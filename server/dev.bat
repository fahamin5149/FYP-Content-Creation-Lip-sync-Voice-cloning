@echo off
setlocal
REM Ensure portable Node + pnpm (corepack) are on PATH for this window
set "PATH=D:\DevCaches\node\node-v20.20.0-win-x64;%PATH%"
cd /d "%~dp0"
pnpm dev
