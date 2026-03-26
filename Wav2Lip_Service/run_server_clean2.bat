@echo off
setlocal

REM ============================================================
REM Wav2Lip Lip-sync Service — run_server_clean2.bat
REM ============================================================

REM D-drive caches (keep all downloads on D:)
set "HF_HOME=D:\DevCaches\hf"
set "TRANSFORMERS_CACHE=D:\DevCaches\hf\transformers"
set "TORCH_HOME=D:\DevCaches\torch"
set "TEMP=D:\DevCaches\temp"
set "TMP=D:\DevCaches\temp"

set "VENV_PATH=%~dp0wav2lip_env"
set "PY=%VENV_PATH%\Scripts\python.exe"
set "PYTHONPATH="

if not exist "%PY%" (
  echo [INFO] Creating Wav2Lip service venv on D:
  if not exist "%VENV_PATH%" mkdir "%VENV_PATH%"
  py -3.9 -m venv "%VENV_PATH%"
)

echo [INFO] Ensuring pip exists
"%PY%" -m ensurepip --upgrade

echo [INFO] Upgrading pip
"%PY%" -m pip install --upgrade pip

echo [INFO] Installing Wav2Lip service deps
"%PY%" -m pip install -r "%~dp0requirements.txt"

cd /d "%~dp0"
REM access_log=True so each /lipsync request is visible; Wav2Lip subprocess logs print here too (no PIPE capture).
"%PY%" -c "import uvicorn, fastapi_server; uvicorn.run(fastapi_server.app, host='127.0.0.1', port=8002, log_level='info', access_log=True)"

