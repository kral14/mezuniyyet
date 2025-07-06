@echo off
chcp 65001 > nul
title GitHub Yukleyici
cls

echo.
echo ======================================================
echo      KODLAR GITHUB-A YUKLENECEK...
echo ======================================================
echo.

:: 1. Git kimliyinin teyin edilib-edilmediyini yoxlayir
git config user.name > nul 2>&1
if errorlevel 1 (
    echo [XETA] Git istifadeci adi teyin edilmeyib!
    echo Zehmet olmasa, terminalda bu emrleri icra edin:
    echo   git config --global user.name "kral14"
    echo   git config --global user.email "nesib20@gmail.com"
    echo.
    pause
    exit /b
)

:: 2. GitHub anbarinin (remote origin) elaqelendirildiyini yoxlayir
git remote -v | find "origin" > nul
if errorlevel 1 (
    echo [XETA] Lokal qovluq hec bir GitHub anbari ile elaqelendirilimeyib!
    echo Zehmet olmasa, GitHub-da yeni bir anbar yaradib,
    echo onun URL-ni bu emrle elave edin:
    echo   git remote add origin https://github.com/istifadeci_adiniz/anbar_adi.git
    echo.
    pause
    exit /b
)


:: Istifadeciden commit mesaji alinir
set /p commitMessage="Deyisiklik ucun bir mesaj daxil edin (bos buraxsaniz standart mesaj yazilacaq): "

:: Eger mesaj bosdursa, standart bir mesaj teyin edilir
if not defined commitMessage set commitMessage="Proqramda yenilenmeler edildi"

echo.
echo -> Fayllar elave edilir (git add .)...
git add .

echo.
echo -> Deyisiklikler yadda saxlanilir (git commit)...
git commit -m "%commitMessage%"

echo.
echo -> Kodlar GitHub-a gonderilir (git push)...
git push origin main

:: Push emrinin ugurlu olub-olmadigini yoxlayir
if errorlevel 1 (
    echo.
    echo ======================================================
    echo      [XETA] KODLAR GONDERILERKEN PROBLEM YASANDI!
    echo ======================================================
    echo.
    echo Mymkyn sebebler:
    echo  - Internet elaqesi yoxdur.
    echo  - GitHub-a giris icazeniz yoxdur (access rights).
    echo  - Anbar (repository) GitHub-da movcud deyil.
    echo.
) else (
    echo.
    echo ======================================================
    echo      PROSES UGURLA TAMAMLANDI!
    echo ======================================================
    echo.
)


:: Pencereni baglamadan once gozleyir ki, neticeni goresiniz
pause