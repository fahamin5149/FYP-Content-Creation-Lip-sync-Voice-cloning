## Complete Step-by-Step Setup & Startup Guide

I'll walk you through everything in order. **Don't skip any steps.**

---

## **STEP 1: Pre-flight Checks (One-Time)**

### 1a. Verify Python Version

Open **PowerShell** and run:

```powershell
E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Models\English_TTS\english_tts_env\Scripts\python.exe --version
```

**Expected output:** `Python 3.9.x`, `3.10.x`, or `3.11.x`

❌ **If you see 3.12 or 3.13:** Stop. You need to recreate the venv with Python 3.11. (Contact me if this happens.)

✅ **If correct:** Continue.

---

### 1b. Verify TTS is Installed

In the same PowerShell:

```powershell
E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Models\English_TTS\english_tts_env\Scripts\pip.exe show TTS
```

**Expected output:** Shows package info including `Version: ...`

❌ **If not found:** Run this:
```powershell
cd E:\FYP-Content-Creation-Lip-sync-Voice-cloning
E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Models\English_TTS\english_tts_env\Scripts\pip.exe install -e .\coqui-ai-TTS
```

✅ **If found:** Continue.

---

### 1c. Download XTTS v2 Model (First Run Only — 30–60 Minutes)

In PowerShell:

```powershell
E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Models\English_TTS\english_tts_env\Scripts\python.exe -c "from TTS.api import TTS; print('Loading model...'); TTS('tts_models/multilingual/multi-dataset/xtts_v2'); print('Model ready!')"
```

**What happens:**
- First time: Downloads ~2 GB from HuggingFace, caches in `~/.cache/TTS_HOME/` — **takes 10–30 minutes**
- Subsequent runs: Uses cached model — **takes 30–60 seconds to load**

**Expected output at the end:**
```
Model ready!
```

⏳ **Wait for completion before moving to Step 2.** (Grab coffee ☕)

---

## **STEP 2: Start FastAPI TTS Service**

### 2a. Open a New PowerShell Window (keep the first one open)

### 2b. Start the Server

```
E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Models\English_TTS\english_tts_env\Scripts\pip.exe install -r E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Models\English_TTS\requirements.txt
```

Simply **double-click this file:**

```
E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Models\English_TTS\run_server.bat
```

**A cmd window opens. You should see:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

✅ **Server is running.** Leave this window open.

---

### 2c. Verify FastAPI is Ready (in a 3rd PowerShell window)

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" | Select-Object -ExpandProperty Content
```

**Expected output:**
```json
{"status":"ok","model_loaded":true,"device":"cuda"}
```

or if no GPU:
```json
{"status":"ok","model_loaded":true,"device":"cpu"}
```

✅ **FastAPI is ready.** Leave the cmd window running.

---

## **STEP 3: Start Node.js Backend Server**

### 3a. Open a 4th PowerShell Window

Navigate to the server directory:

```powershell
cd E:\FYP-Content-Creation-Lip-sync-Voice-cloning\server
```

### 3b. Install Dependencies (First Run Only)

```powershell
pnpm install
```

⏳ **Wait for completion.**

### 3c. Start the Server

```powershell
pnpm dev
```

**You should see:**

```
5. Server running on: 5000
6. All files loaded successfully!
```

✅ **Node.js backend is ready.** Leave this window open.

---

## **STEP 4: Start Next.js Frontend**

### 4a. Open a 5th PowerShell Window

Navigate to the project root:

```powershell
cd E:\FYP-Content-Creation-Lip-sync-Voice-cloning
```

### 4b. Install Dependencies (First Run Only)

```powershell
pnpm install
```

⏳ **Wait for completion.**

### 4c. Start Dev Server

```powershell
pnpm dev
```

**You should see:**

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

✅ **Next.js is ready.** Leave this window open.

---

## **STEP 5: Upload Test Audio (If Needed)**

### 5a. Open Browser

Go to:
```
http://localhost:3000
```

### 5b. Sign In

Use your Clerk account (or create one if testing new account).

### 5c. Upload English Audio Samples

1. Go to **Dashboard** → **Setup** → **Voice**
2. Select **English** from the language dropdown
3. Upload **at least 2 audio files** (`.wav`, `.mp3`, etc.)
   - Example: voice samples of you speaking, 5–10 seconds each
4. Wait for all uploads to complete ✅

---

## **STEP 6: Test the Pipeline**

### 6a. Start Creating Content

1. Go to **Dashboard** → **Create Content**
2. Click **Next** (language selection appears — select **English**)
3. Click **Next** (method selection — pick any: generation, refinement, passthrough)
4. Follow the prompts to create or provide a script
5. Click **Accept & proceed** (review stage)
6. Click **Accept & proceed** (TTS stage)

### 6b. TTS Stage: Select Voice & Synthesize

At the **Text-to-Speech** stage:

1. **You see your uploaded audio samples** — each shows filename, size, and a playable preview
2. **Select at least 1 sample** (checkbox on each card)
3. Click **Generate Voice**
4. **Watch the animated loader** — rotating status messages like "Analyzing voice characteristics…"
5. ⏳ **Wait 30–90 seconds** (depends on script length and GPU)
6. **Result appears** with audio playback
7. Click **Try Again** (to retry) or **Use This Voice & Continue** (to proceed)

✅ **Success!** Audio plays back, job record appears in Supabase `tts_jobs` table.

---

## **STEP 7: Verify Everything Worked**

### 7a. Check Supabase

1. Open Supabase dashboard → **tts_jobs** table
2. **You should see a new row** with:
   - `status: "completed"`
   - `duration_seconds: 5.2` (example)
   - `output_audio_path: /path/to/TTS_Output/results/{uuid}.wav`

### 7b. Check Generated Audio Files

```powershell
dir E:\FYP-Content-Creation-Lip-sync-Voice-cloning\TTS_Output\results\
```

**You should see `.wav` files** created by the synthesis.

✅ **Pipeline works end-to-end!**

---

## **TROUBLESHOOTING: If Something Breaks**

| Problem | Solution |
|---------|----------|
| FastAPI won't start | Check Python version is 3.9–3.11. Rerun model download step. |
| "Model not loaded yet" error | Model is still downloading (first run). Wait 30 min, don't close FastAPI window. |
| Node.js backend fails to start | Verify .env has correct `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`. |
| "No audio samples found" in TTS stage | Upload English samples first in Setup → Voice. They take ~5 sec to save to Supabase. |
| "Synthesis failed" after 60s | Script too long for free GPU. Try shorter text or reduce number of reference audios. |
| Blob URL error in TTSStage | Browser cache issue. Hard refresh (`Ctrl+Shift+R`). |

---

## **Keep Running While Testing**

You should have **5 PowerShell/cmd windows open:**

1. ✅ FastAPI (`run_server.bat`) — port 8000
2. ✅ Node.js backend (`pnpm dev`) — port 5000
3. ✅ Next.js frontend (`pnpm dev`) — port 3000
4. ✅ Spare window for commands
5. Browser at `http://localhost:3000`

**Never close the FastAPI or backend windows** — they stay running while you test.

---

**Done! Let me know what breaks or if you need help with any step.** 🚀