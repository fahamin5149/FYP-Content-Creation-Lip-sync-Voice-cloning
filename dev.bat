@echo off
setlocal
set "PATH=D:\DevCaches\node\node-v20.20.0-win-x64;%PATH%"
cd /d "%~dp0"
pnpm dev
