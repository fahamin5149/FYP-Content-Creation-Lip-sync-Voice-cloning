@echo off
REM ============================================================
REM  Master Startup Script - AI Content Creation Platform
REM  Starts all services in separate windows
REM ============================================================
echo.
echo ============================================================
echo  Starting AI Content Creation Platform
echo ============================================================
echo.

REM 1. Node.js Backend (port 5000)
echo [1/4] Starting Backend Server (port 5000)...
start "Backend Server" cmd /k "cd /d "%~dp0server" && node dist/index.js"

timeout /t 2 /nobreak >nul

REM 2. Next.js Frontend (port 3000)
echo [2/4] Starting Frontend (port 3000)...
start "Frontend (Next.js)" cmd /k "cd /d "%~dp0" && node node_modules\next\dist\bin\next dev --port 3000"

timeout /t 2 /nobreak >nul

REM 3. English TTS Service (port 8000)
echo [3/4] Starting English TTS Service (port 8000)...
start "English TTS" cmd /k "cd /d "%~dp0English_TTS\englishttts" && call run_server.bat"

REM 4. Urdu TTS Service (port 8001)
echo [4/4] Starting Urdu TTS Service (port 8001)...
start "Urdu TTS" cmd /k "cd /d "%~dp0Urdu_TTS" && call run_server.bat"

echo.
echo ============================================================
echo  All services launched in separate windows:
echo    Frontend   : http://localhost:3000
echo    Backend    : http://localhost:5000
echo    English TTS: http://localhost:8000
echo    Urdu TTS   : http://localhost:8001
echo    Wav2Lip    : Run Wav2Lip_Service\run_server_clean2.bat if needed
echo ============================================================
echo.
pause
