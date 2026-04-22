@echo off
setlocal

REM ============================================================
REM  Urdu TTS Service - Startup Script
REM  Runs on port 8001 (English TTS uses 8000)
REM ============================================================

set "VENV_PATH=%~dp0urdu_tts_env\urdu_tts_env"

set "OPENVOICE_CONVERTER_DIR=%~dp0..\checkpoints_v2\converter"

set "URDU_PROFILES_DIR=%~dp0..\TTS_Output\urdu_profiles"

REM Device: use "cpu" if CUDA/cublas crashes on this machine
set "URDU_DEVICE=cuda"

REM Use local cache directory
set "HF_HOME=%~dp0..\model_cache\hf"
set "TRANSFORMERS_CACHE=%~dp0..\model_cache\hf\transformers"
set "TORCH_HOME=%~dp0..\model_cache\torch"
set "TTS_HOME=%~dp0..\model_cache\TTS_HOME"

REM HuggingFace token for gated models
REM Priority: HF_TOKEN env var > HF_TOKEN.txt file in this folder
if not "%HF_TOKEN%"=="" (
    set "HUGGINGFACE_HUB_TOKEN=%HF_TOKEN%"
)
if "%HUGGINGFACE_HUB_TOKEN%"=="" (
    if exist "%~dp0HF_TOKEN.txt" (
        set /p HUGGINGFACE_HUB_TOKEN=<"%~dp0HF_TOKEN.txt"
        echo [INFO] Loaded HuggingFace token from HF_TOKEN.txt
    )
)
if "%HUGGINGFACE_HUB_TOKEN%"=="" (
    echo [WARNING] No HuggingFace token found. Create HF_TOKEN.txt in this folder with your token.
    echo [WARNING] Get access at: https://huggingface.co/ai4bharat/indic-parler-tts
)

if not exist "%VENV_PATH%\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at: %VENV_PATH%
    pause
    exit /b 1
)

if not exist "%OPENVOICE_CONVERTER_DIR%\checkpoint.pth" (
    echo [ERROR] OpenVoice checkpoint not found at: %OPENVOICE_CONVERTER_DIR%
    pause
    exit /b 1
)

if exist "%VENV_PATH%\Lib\site-packages\nvidia\cublas\bin" (
    set "PATH=%VENV_PATH%\Lib\site-packages\nvidia\cublas\bin;%PATH%"
)
if exist "%VENV_PATH%\Lib\site-packages\nvidia\cuda_nvrtc\bin" (
    set "PATH=%VENV_PATH%\Lib\site-packages\nvidia\cuda_nvrtc\bin;%PATH%"
)

echo [INFO] Activating virtual environment...
call "%VENV_PATH%\Scripts\activate.bat"

cd /d "%~dp0"

echo [INFO] Starting Urdu TTS on http://localhost:8001  health: http://localhost:8001/health
echo [INFO] Device: %URDU_DEVICE%  - set URDU_DEVICE=cpu in this file if CUDA fails
echo.

set "SITE_PACKAGES=%VENV_PATH%\Lib\site-packages"
set "PY=%VENV_PATH%\Scripts\python.exe"

%PY% -c "import sys,os; sys.path.insert(0, os.getcwd()); sys.path.insert(0, r'%SITE_PACKAGES%'); import uvicorn, fastapi_server; uvicorn.run(fastapi_server.app, host='0.0.0.0', port=8001)" 2>&1

echo.
echo ================================================================
echo  Urdu TTS stopped.
echo  CUDA issue? Change URDU_DEVICE to cpu in this .bat
echo ================================================================
pause
