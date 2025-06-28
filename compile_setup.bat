@echo off
rem --- Azərbaycan hərfləri üçün ---
chcp 65001 > nul
title Inno Setup Compiler

echo =======================================================
echo               Məzuniyyət Sistemi Setup
echo =======================================================
echo.

echo --- 1. Kohne proqram prosesi dayandirilir (varsa)...
taskkill /f /im MezuniyyetSistemi.exe > nul 2>&1

rem --- YENİ ƏLAVƏ: Fayl kilidinin buraxılması üçün 2 saniyə gözləyirik ---
echo Proses dayandirildi, fayl kilidinin buraxilmasi gozlenilir...
timeout /t 2 /nobreak > nul

echo.
echo --- 2. Inno Setup kompayleri axtarilir...
set ISCC_PATH="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
set SCRIPT_FILE="MezuniyyetSistemi.iss"

if not exist %ISCC_PATH% (
    echo [XETA] Inno Setup kompayleri tapilmadi!
    echo Yol: %ISCC_PATH%
    goto :error
)
echo Kompayler tapildi.
echo.

echo --- 3. Setup fayli yaradilir...
%ISCC_PATH% %SCRIPT_FILE%
echo.

echo =======================================================
echo Proses ugurla basa catdi!
goto :end

:error
echo.
echo [Ugurusz] Proses xeta ile dayandi.

:end
echo.
pause