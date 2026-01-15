@echo off
echo ==========================================
echo   Məzuniyyət İdarəetmə Sistemi - Dev Mode
echo ==========================================
echo.
echo Starting Application...
cd /d "%~dp0"
npm run tauri:dev
pause
