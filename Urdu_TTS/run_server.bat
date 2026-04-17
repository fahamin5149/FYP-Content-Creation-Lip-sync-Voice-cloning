@echo off
setlocal

REM ============================================================
REM  Urdu TTS Service - Startup Script
REM  Runs on port 8001 (English TTS uses 8000)
REM ============================================================

REM Path to the Urdu TTS virtual environment
set "VENV_PATH=%~dp0urdu_tts_env\urdu_tts_env"

REM OpenVoice V2 converter checkpoint folder (repo: ..\checkpoints_v2\converter)
set "OPENVOICE_CONVERTER_DIR=%~dp0..\checkpoints_v2\converter"

REM Per-user adaptive embedding profiles (under project TTS_Output)
set "URDU_PROFILES_DIR=%~dp0..\TTS_Output\urdu_profiles"

REM Device: use "cpu" if CUDA/cublas crashes on this machine
set "URDU_DEVICE=cuda"

REM OpenVoice uses faster-whisper for speaker embedding when vad=False. Pip wheels ship
REM cublas/nvrtc DLLs under site-packages; PATH is extended below so GPU whisper can load them.
REM If GPU whisper still errors, set OPENVOICE_WHISPER_DEVICE=cpu (slower Stage 2).

REM Model/cache downloads on D: (see progress.md)
set "HF_HOME=D:\DevCaches\hf"
set "TRANSFORMERS_CACHE=D:\DevCaches\hf\transformers"
set "TORCH_HOME=D:\DevCaches\torch"
set "TTS_HOME=D:\DevCaches\TTS_HOME"

REM HuggingFace token for gated models (e.g. ai4bharat/indic-parler-tts)
if not "%HF_TOKEN%"=="" (
    set "HUGGINGFACE_HUB_TOKEN=%HF_TOKEN%"
)
if "%HUGGINGFACE_HUB_TOKEN%"=="" (
    echo [WARNING] Missing HuggingFace token HF_TOKEN. If models are already cached on disk, service may still start.
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

REM nvidia-cublas-cu12 / cuda-nvrtc: DLLs must be on PATH for faster-whisper (CTranslate2)
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

REM Partial/extracted venvs: inject site-packages explicitly
set "SITE_PACKAGES=%VENV_PATH%\Lib\site-packages"
set "PY=%VENV_PATH%\Scripts\python.exe"

%PY% -c "import sys,os; sys.path.insert(0, os.getcwd()); sys.path.insert(0, r'%SITE_PACKAGES%'); import uvicorn, fastapi_server; uvicorn.run(fastapi_server.app, host='0.0.0.0', port=8001)" 2>&1

echo.
echo ================================================================
echo  Urdu TTS stopped.
echo  Log hint: %~dp0..\urdu_tts_error.log
echo  CUDA issue? Change URDU_DEVICE to cpu in this .bat
echo ================================================================
pause
