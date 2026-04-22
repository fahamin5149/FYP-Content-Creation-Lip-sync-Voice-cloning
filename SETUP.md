# Setup Guide (Complete Handoff)

This document is a complete, step-by-step setup for a new developer to run this project locally.
It includes required accounts, exact env values, path edits, startup order, and common fixes.

---

## 0) Services and Ports

Local stack:

- Frontend (Next.js): `http://localhost:3000`
- Backend (Express API): `http://localhost:5000`
- English TTS (FastAPI): `http://localhost:8000`
- Urdu TTS (FastAPI): `http://localhost:8001`
- Wav2Lip (FastAPI): `http://localhost:8002`

---

## 1) Accounts and Access Required

Before coding, make sure the teammate has:

1. GitHub access to this repo
2. Clerk project access (publishable + secret keys)
3. Supabase project access (project URL + service role key)
4. HuggingFace token (for Urdu models; recommended/usually required)

---

## 2) System Requirements

- OS: Windows 10/11 (scripts are `.bat` and PowerShell-friendly)
- Node.js: 20+ (project uses `pnpm@9.15.4`)
- pnpm via Corepack:
  - `corepack enable`
  - `corepack prepare pnpm@9.15.4 --activate`
- Python installed and available to create/run service environments
- Git installed

Optional but helpful:

- NVIDIA GPU + CUDA runtime for faster Urdu/Wav2Lip

---

## 3) Clone the Repository

Pick a local folder path (example):

```powershell
cd D:\
git clone https://github.com/fahamin5149/FYP-Content-Creation-Lip-sync-Voice-cloning.git
cd FYP-Content-Creation-Lip-sync-Voice-cloning
```

If you use a different path than `D:\FYP_3\...`, that is fine, but check path notes in section 8.

---

## 4) Install Dependencies

From repo root:

```powershell
pnpm install
```

Then backend:

```powershell
cd server
pnpm install
cd ..
```

---

## 5) Create and Fill Environment Files

### 5.1 Frontend env (`.env.local`)

Create:

```powershell
Copy-Item .env.example .env.local
```

Update `.env.local` values:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...`
- `CLERK_SECRET_KEY=...`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`
- `NEXT_PUBLIC_API_URL=http://localhost:5000`
- `PYTHON_TTS_URL=http://localhost:8000`
- `URDU_TTS_URL=http://localhost:8001`
- `INTERNAL_API_SECRET=internal-<same-random-value-as-backend>`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NODE_ENV=development`

Generate a random secret:

```powershell
node -e "console.log('internal-'+require('crypto').randomUUID())"
```

### 5.2 Backend env (`server/.env`)

Create:

```powershell
Copy-Item server\.env.example server\.env
```

Update `server/.env` values:

- `CLERK_SECRET_KEY=...` (same Clerk secret used in frontend env)
- `SUPABASE_URL=https://...supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `PORT=5000`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`
- `INTERNAL_API_SECRET=internal-<must exactly match .env.local>`

Critical rule:

- `INTERNAL_API_SECRET` must be identical in both files.

---

## 6) Python Services Setup Notes

This repo contains service startup scripts:

- `English_TTS\englishttts\run_server.bat`
- `Urdu_TTS\run_server.bat`
- `Wav2Lip_Service\run_server_clean2.bat`

They handle most startup details, but teammate should verify:

1. Python executable works in each service venv (or let scripts create/install where supported).
2. Internet access exists for model downloads on first run.
3. Enough disk space for model caches.
4. Urdu OpenVoice converter files exist:
   - `checkpoints_v2\converter\checkpoint.pth`
   - `checkpoints_v2\converter\config.json`

If HuggingFace-gated models fail in Urdu service:

- Set `HF_TOKEN` (or `HUGGINGFACE_HUB_TOKEN`) in terminal before running Urdu script.

Example:

```powershell
$env:HF_TOKEN="hf_xxx"
.\Urdu_TTS\run_server.bat
```

---

## 7) Start Everything (Exact Order)

Open 5 terminals.

### Terminal 1: English TTS

```powershell
cd D:\FYP_3\FYP-Content-Creation-Lip-sync-Voice-cloning
.\English_TTS\englishttts\run_server.bat
```

### Terminal 2: Urdu TTS

```powershell
cd D:\FYP_3\FYP-Content-Creation-Lip-sync-Voice-cloning
.\Urdu_TTS\run_server.bat
```

### Terminal 3: Wav2Lip

```powershell
cd D:\FYP_3\FYP-Content-Creation-Lip-sync-Voice-cloning
.\Wav2Lip_Service\run_server_clean2.bat
```

### Terminal 4: Backend

```powershell
cd D:\FYP_3\FYP-Content-Creation-Lip-sync-Voice-cloning\server
pnpm dev
```

### Terminal 5: Frontend

```powershell
cd D:\FYP_3\FYP-Content-Creation-Lip-sync-Voice-cloning
pnpm dev
```

Open app:

- `http://localhost:3000`

If teammate uses a different clone path, replace `D:\FYP_3\FYP-Content-Creation-Lip-sync-Voice-cloning` in all commands.

---

## 8) Path Changes Teammate Must Check

This is the most important section for new machines.

### 8.1 Hardcoded/assumed local paths in startup scripts

Review these scripts on a new machine and update paths if needed:

- `dev.bat`
- `server/dev.bat`
- `English_TTS/englishttts/run_server.bat`
- `Urdu_TTS/run_server.bat`
- `Wav2Lip_Service/run_server_clean2.bat`

Common path variables to verify:

- Node location (example currently points to `D:\DevCaches\node\...`)
- Cache folders (`HF_HOME`, `TRANSFORMERS_CACHE`, `TORCH_HOME`, `TTS_HOME`, `TEMP`, `TMP`)
- Venv paths in TTS services
- OpenVoice converter path in Urdu script

If teammate does not have `D:\DevCaches\...`, they should replace with valid local folders.

### 8.2 Environment URL alignment

Ensure these URLs are consistent:

- Frontend `.env.local`:
  - `NEXT_PUBLIC_API_URL=http://localhost:5000`
  - `PYTHON_TTS_URL=http://localhost:8000`
  - `URDU_TTS_URL=http://localhost:8001`
- Backend `server/.env`:
  - `FRONTEND_URL=http://localhost:3000`
  - `PORT=5000`

### 8.3 Secrets

Do not reuse someone else's local secrets blindly:

- Use your own Clerk keys
- Use your own Supabase service key
- Generate your own `INTERNAL_API_SECRET` (share only inside team securely)

---

## 9) Health Checks (Must Pass)

After startup, verify:

- `http://localhost:8000/health` (English TTS)
- `http://localhost:8001/health` (Urdu TTS)
- `http://localhost:8002/health` (Wav2Lip)
- `http://localhost:5000/test` (Backend)
- `http://localhost:3000` (Frontend)

If any one fails, fix that service first before testing end-to-end flow.

---

## 10) First End-to-End Functional Test

1. Sign in via Clerk
2. Open dashboard create-content flow
3. Generate script
4. Run TTS
5. Run lip-sync
6. Confirm output appears in dashboard/videos

If this passes, setup is successful.

---

## 11) Troubleshooting Checklist

- **`pnpm` not found**
  - Run `corepack enable` and activate pnpm version.

- **Clerk auth errors**
  - Recheck Clerk keys in `.env.local` and `server/.env`.
  - Restart frontend/backend after changing env files.

- **Backend unreachable from frontend**
  - Verify `NEXT_PUBLIC_API_URL`.
  - Verify backend terminal is running on port 5000.

- **Urdu service fails on startup**
  - Ensure HF token exists.
  - Ensure `checkpoints_v2\converter\checkpoint.pth` and `config.json` exist.
  - If CUDA fails, change `URDU_DEVICE=cuda` to `URDU_DEVICE=cpu` in `Urdu_TTS/run_server.bat`.

- **Wav2Lip service fails**
  - Re-run script and watch dependency install output.
  - Confirm port 8002 is free and `/health` responds.

- **CRLF/LF git warnings**
  - Warnings are common on Windows; not usually blocking runtime.

---

## 12) Developer Commands

Repo root:

```powershell
pnpm dev
pnpm build
pnpm start
pnpm lint
```

Server:

```powershell
cd server
pnpm dev
pnpm build
pnpm start
```

---

## 13) Security and Team Rules

- Never commit `.env.local` or `server/.env`
- Never commit real service tokens/keys
- Keep generated artifacts/log noise out of commits unless required

---

## 14) Related Documents

- `README.md`
- `server/README_INDEX.md`
- `progress.md`
- `README_CLERK_SUPABASE.md`

