@echo off
chcp 65001 > nul
title GitHub Yukleyici

echo.
echo ======================================================
echo           KODLAR GITHUB-A YUKLENIR...
echo ======================================================
echo.

:: Istifadeciden commit mesaji alinir
set /p commitMessage="Deyisiklik ucun bir mesaj daxil edin (mes: Interfeys duzelisleri): "

:: Eger mesaj bosdursa, standart bir mesaj teyin edilir
if not defined commitMessage set commitMessage="Proqramda yenilenmeler edildi"

echo.
echo -> Fayllar elave edilir (git add .)...
git add .

echo -> Deyisiklikler yadda saxlanilir (git commit)...
git commit -m "%commitMessage%"

echo -> Kodlar GitHub-a gonderilir (git push)...
git push origin main

echo.
echo ======================================================
echo           PROSES UGURLA TAMAMLANDI!
echo ======================================================
echo.

:: Pencereni baglamadan once gozleyir ki, neticeni goresiniz
pause
