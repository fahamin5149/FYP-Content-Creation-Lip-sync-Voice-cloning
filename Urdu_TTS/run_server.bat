@echo off
setlocal

REM ============================================================
REM  Urdu TTS Service — Startup Script
REM  Runs on port 8001 (English TTS uses 8000)
REM ============================================================

REM Path to the pre-built virtual environment from urdu_tts_testing
set "VENV_PATH=F:\urdu_tts_testing\urdu_tts_env"

REM Absolute path to the OpenVoice V2 converter checkpoint folder
set "OPENVOICE_CONVERTER_DIR=F:\urdu_tts_testing\checkpoints_v2\converter"

REM Per-user adaptive embedding profiles stored inside the project
set "URDU_PROFILES_DIR=%~dp0..\TTS_Output\urdu_profiles"

REM Device override: change to "cpu" if you get a CUDA crash at startup
set "URDU_DEVICE=cuda"

REM ── Validate venv exists ─────────────────────────────────────────────────
if not exist "%VENV_PATH%\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at: %VENV_PATH%
    pause
    exit /b 1
)

REM ── Validate checkpoint exists ───────────────────────────────────────────
if not exist "%OPENVOICE_CONVERTER_DIR%\checkpoint.pth" (
    echo [ERROR] OpenVoice checkpoint not found at: %OPENVOICE_CONVERTER_DIR%
    pause
    exit /b 1
)

REM ── Activate venv ────────────────────────────────────────────────────────
echo [INFO] Activating virtual environment...
call "%VENV_PATH%\Scripts\activate.bat"

REM ── Change to the Urdu_TTS folder (where fastapi_server.py lives) ────────
cd /d "%~dp0"

REM ── Start the server (2>&1 merges stderr into stdout so errors are visible)
echo [INFO] Starting Urdu TTS service on http://localhost:8001
echo [INFO] Health check: http://localhost:8001/health
echo [INFO] Press Ctrl+C to stop
echo [INFO] Device: %URDU_DEVICE%  (change to cpu above if CUDA crashes)
echo.

uvicorn fastapi_server:app --host 0.0.0.0 --port 8001 2>&1

REM ── Server stopped (crash or Ctrl+C) ─────────────────────────────────────
echo.
echo ================================================================
echo  Urdu TTS service stopped.
echo.
echo  If it crashed, check the error log at:
echo  %~dp0..\urdu_tts_error.log
echo.
echo  Common fix: change  set "URDU_DEVICE=cuda"  to  set "URDU_DEVICE=cpu"
echo  in this bat file and try again.
echo ================================================================
pause
