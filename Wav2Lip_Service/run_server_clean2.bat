@echo off
setlocal

REM ============================================================
REM Wav2Lip Lip-sync Service — run_server_clean2.bat
REM ============================================================

REM Use local cache directory
set "HF_HOME=%~dp0..\model_cache\hf"
set "TRANSFORMERS_CACHE=%~dp0..\model_cache\hf\transformers"
set "TORCH_HOME=%~dp0..\model_cache\torch"
set "TEMP=%TEMP%"
set "TMP=%TMP%"

set "VENV_PATH=%~dp0wav2lip_env"
set "PY=%VENV_PATH%\Scripts\python.exe"
set "PYTHONPATH="

if not exist "%PY%" (
  echo [INFO] Creating Wav2Lip service venv...
  py -3.9 -m venv "%VENV_PATH%"
)

echo [INFO] Ensuring pip exists
"%PY%" -m ensurepip --upgrade

echo [INFO] Upgrading pip
"%PY%" -m pip install --upgrade pip

echo [INFO] Installing Wav2Lip service deps
"%PY%" -m pip install -r "%~dp0requirements.txt"

cd /d "%~dp0"
"%PY%" -c "import uvicorn, fastapi_server; uvicorn.run(fastapi_server.app, host='127.0.0.1', port=8002, log_level='info', access_log=True)"
