@echo off
REM ── English TTS FastAPI Server ─────────────────────────────────────────────
REM Activates the english_tts_env venv and starts uvicorn on port 8000.
REM Run this script from any directory — it anchors to its own location.

setlocal

REM Move into this folder (fastapi_server.py lives here)
cd /d "%~dp0"

REM Force model/cache downloads onto D: only
set "HF_HOME=D:\DevCaches\hf"
set "TRANSFORMERS_CACHE=D:\DevCaches\hf\transformers"
set "TORCH_HOME=D:\DevCaches\torch"
set "TTS_HOME=D:\DevCaches\TTS_HOME"

REM Auto-accept Coqui CPML TOS (avoids interactive [y/n] prompt)
set "COQUI_TOS_AGREED=1"

REM These extracted venvs behave like "partial" venvs (no site init),
REM so we start Python with sys.path pointing at Lib\site-packages.
set "VENV_ROOT=english_tts_env\english_tts_env"
set "SITE_PACKAGES=%VENV_ROOT%\Lib\site-packages"
set "PY=%VENV_ROOT%\Scripts\python.exe"

%PY% -c "import sys,os; sys.path.insert(0, os.getcwd()); sys.path.insert(0, r'%SITE_PACKAGES%'); import uvicorn, fastapi_server; uvicorn.run(fastapi_server.app, host='127.0.0.1', port=8000)" 
pause
