# Teammate Setup Guide

Complete guide to clone and run the full stack locally.

---

## Architecture Overview

```
 Browser (localhost:3000)
    |
    v
 [Next.js Frontend]  ───────>  [Node.js Backend]  (localhost:5000)
    |                               |
    |  (proxy routes)               |  Clerk auth + Supabase DB
    |                               |
    +-------> [English TTS]         |  FastAPI / Coqui XTTS v2  (localhost:8000)
    +-------> [Urdu TTS]            |  FastAPI / Parler-TTS + OpenVoice V2  (localhost:8001)
```

| Service | Port | Tech | Directory |
|---------|------|------|-----------|
| Frontend | 3000 | Next.js, TypeScript, Tailwind, Clerk | `/` (root) |
| Backend | 5000 | Express, TypeScript, Supabase | `/server` |
| English TTS | 8000 | FastAPI, Coqui XTTS v2 | `/English_TTS/englishttts` |
| Urdu TTS | 8001 | FastAPI, Parler-TTS, OpenVoice V2 | `/Urdu_TTS` |

---

## Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.10+
- **Git**
- **NVIDIA GPU + CUDA 11.8** (optional but strongly recommended for TTS)
- **Clerk account** (shared project — ask team lead for access)
- **Supabase account** (shared project — ask team lead for access)

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd FYP-Content-Creation-Lip-sync-Voice-cloning

# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

---

## 2. Environment Variables

### Frontend

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from Clerk dashboard > API Keys
- `CLERK_SECRET_KEY` — from Clerk dashboard > API Keys
- `INTERNAL_API_SECRET` — generate with: `node -e "console.log('internal-'+require('crypto').randomUUID())"`

The rest of the defaults (localhost URLs) should work as-is for local development.

### Backend

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in:
- `CLERK_SECRET_KEY` — same as frontend
- `SUPABASE_URL` — from Supabase dashboard > Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard > Settings > API (use **Service Role** key, NOT anon)
- `INTERNAL_API_SECRET` — must match the frontend value

---

## 3. Database Setup

Run this SQL in **Supabase > SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.users
  AS PERMISSIVE FOR ALL
  USING (true) WITH CHECK (true)
  TO authenticated, service_role;
```

> For additional tables (scripts, tts_jobs, user_media), check `ENV_SETUP.md` and `server/src/types/database.types.ts` for the full schema.

---

## 4. English TTS Setup (Port 8000)

The English TTS service uses **Coqui XTTS v2** for voice cloning.

```bash
cd English_TTS/englishttts

# Create a Python virtual environment
python -m venv english_tts_env

# Activate it (Windows)
english_tts_env\Scripts\activate

# Install PyTorch with CUDA (recommended)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# OR install CPU-only PyTorch (slower, no GPU needed)
# pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install Coqui TTS
pip install TTS

# Install remaining dependencies
pip install -r requirements.txt

cd ../..
```

> The XTTS v2 model downloads automatically from HuggingFace on first run (~1.8 GB).

---

## 5. Urdu TTS Setup (Port 8001)

The Urdu TTS service uses a two-stage pipeline:
1. **Indic Parler-TTS** — generates base Urdu audio from text
2. **OpenVoice V2** — clones the user's voice onto the base audio

### 5a. Create the virtual environment

```bash
cd Urdu_TTS

# Create venv
python -m venv urdu_tts_env

# Activate (Windows)
urdu_tts_env\Scripts\activate

# Install PyTorch with CUDA
pip install torch==2.7.1+cu118 torchaudio==2.7.1+cu118 --index-url https://download.pytorch.org/whl/cu118

# Install Parler-TTS from HuggingFace
pip install git+https://github.com/huggingface/parler-tts.git

# Install OpenVoice
pip install git+https://github.com/myshell-ai/OpenVoice.git

# Install remaining dependencies
pip install -r requirements.txt

cd ..
```

### 5b. Download OpenVoice V2 checkpoint

The converter checkpoint is NOT included in the repo. Download it:

1. Go to: https://huggingface.co/myshell-ai/OpenVoiceV2
2. Download the `checkpoints_v2/converter/` folder (contains `config.json` and `checkpoint.pth`)
3. Place it somewhere on your machine, e.g. `C:\openvoice_checkpoints\converter\`

### 5c. Edit `run_server.bat`

Open `Urdu_TTS/run_server.bat` and update these two paths to match YOUR machine:

```bat
REM Change this to your venv path:
set "VENV_PATH=C:\path\to\your\urdu_tts_env"

REM Change this to where you put the converter checkpoint:
set "OPENVOICE_CONVERTER_DIR=C:\openvoice_checkpoints\converter"
```

### 5d. Device setting

```bat
REM Use "cuda" if you have an NVIDIA GPU, "cpu" otherwise:
set "URDU_DEVICE=cuda"
```

> If CUDA crashes on startup, change to `cpu`. CPU is slower (~7 min per generation vs ~1 min on GPU).

---

## 6. Running All Services

Open **4 separate terminals**:

### Terminal 1 — Frontend
```bash
cd FYP-Content-Creation-Lip-sync-Voice-cloning
npm run dev
```

### Terminal 2 — Backend
```bash
cd FYP-Content-Creation-Lip-sync-Voice-cloning/server
npm run dev
```

### Terminal 3 — English TTS
```bash
cd FYP-Content-Creation-Lip-sync-Voice-cloning/English_TTS/englishttts
run_server.bat
```

### Terminal 4 — Urdu TTS
```bash
cd FYP-Content-Creation-Lip-sync-Voice-cloning/Urdu_TTS
run_server.bat
```

Wait for each service to show "ready" before using the app.

---

## 7. Verification Checklist

After all services are running:

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:5000/test (should return JSON)
- [ ] English TTS health at http://localhost:8000/health
- [ ] Urdu TTS health at http://localhost:8001/health
- [ ] Sign up works (creates user in Supabase)
- [ ] Can upload a voice reference audio clip
- [ ] English TTS generates audio from script
- [ ] Urdu TTS generates audio from script

---

## 8. Troubleshooting

### "CUDA out of memory" or CUDA crash on startup
Change `URDU_DEVICE=cuda` to `URDU_DEVICE=cpu` in `Urdu_TTS/run_server.bat`.

### Port already in use
Kill the process using the port:
```bash
# Find what's using port 5000
netstat -ano | findstr :5000
# Kill by PID
taskkill /PID <pid> /F
```

### "Module not found" in Python TTS services
Make sure the virtual environment is activated. The `.bat` files handle this automatically — run them instead of calling `uvicorn` directly.

### Clerk "unauthorized" errors
- Ensure `CLERK_SECRET_KEY` is the same in both `.env.local` and `server/.env`
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test_`

### Backend can't connect to Supabase
- Verify `SUPABASE_URL` format: `https://xxxxx.supabase.co` (no trailing slash)
- Use the **Service Role** key, not the anon key

### TTS generation is very slow
- On CPU, Urdu TTS takes ~7-10 minutes per script. GPU (CUDA) reduces this to ~1-2 minutes.
- English TTS is faster but still benefits from GPU.
- Ensure no other GPU-heavy processes are running.

### "OpenVoice checkpoint not found"
Edit `OPENVOICE_CONVERTER_DIR` in `Urdu_TTS/run_server.bat` to the correct path where you placed the `converter/` folder containing `checkpoint.pth` and `config.json`.

---

## Project Structure (Key Files)

```
/
├── app/                          # Next.js pages and API routes
│   ├── dashboard/create-content/ # Content creation wizard
│   └── api/process/              # TTS proxy routes (English + Urdu)
├── components/create-content/    # TTS stage, script generation UI
├── lib/api.ts                    # Frontend API client
├── server/
│   ├── src/index.ts              # Express server entry point
│   ├── src/controllers/          # Business logic (tts, content, media)
│   ├── src/routes/               # API route definitions
│   ├── src/middleware/auth.ts     # Clerk token verification
│   └── src/db/supabase.ts        # Supabase client
├── English_TTS/englishttts/
│   ├── fastapi_server.py         # English TTS FastAPI service
│   └── requirements.txt
├── Urdu_TTS/
│   ├── fastapi_server.py         # Urdu TTS FastAPI service
│   └── requirements.txt
├── .env.example                  # Frontend env template
└── server/.env.example           # Backend env template
```
