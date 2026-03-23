@echo off
REM ── English TTS FastAPI Server ─────────────────────────────────────────────
REM Activates the english_tts_env venv and starts uvicorn on port 8000.
REM Run this script from any directory — it anchors to its own location.

cd /d "%~dp0"
call english_tts_env\Scripts\activate.bat
uvicorn fastapi_server:app --host 127.0.0.1 --port 8000
pause
