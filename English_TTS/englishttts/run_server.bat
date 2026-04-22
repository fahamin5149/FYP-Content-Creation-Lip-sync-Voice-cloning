@echo off
REM ── English TTS FastAPI Server ─────────────────────────────────────────────
REM Activates the english_tts_env venv and starts uvicorn on port 8000.

setlocal

cd /d "%~dp0"

REM Use local cache directory
set "HF_HOME=%~dp0..\..\model_cache\hf"
set "TRANSFORMERS_CACHE=%~dp0..\..\model_cache\hf\transformers"
set "TORCH_HOME=%~dp0..\..\model_cache\torch"
set "TTS_HOME=%~dp0..\..\model_cache\TTS_HOME"

REM Auto-accept Coqui CPML TOS
set "COQUI_TOS_AGREED=1"

set "VENV_ROOT=english_tts_env\english_tts_env"
set "SITE_PACKAGES=%VENV_ROOT%\Lib\site-packages"
set "PY=%VENV_ROOT%\Scripts\python.exe"

%PY% -c "import sys,os; sys.path.insert(0, os.getcwd()); sys.path.insert(0, r'%SITE_PACKAGES%'); import uvicorn, fastapi_server; uvicorn.run(fastapi_server.app, host='127.0.0.1', port=8000)"
pause
