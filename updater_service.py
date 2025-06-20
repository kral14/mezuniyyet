# updater_service.py (Yeniləmə məntiqini özündə saxlayan yeni modul)

import tkinter as tk
from tkinter import messagebox
import requests
import os
import sys
import subprocess
import threading

# --- YENİLƏMƏ ÜÇÜN KONFİQURASİYA ---
GITHUB_API_URL = "https://api.github.com/repos/kral14/mezuniyyet/releases/latest"
MAIN_APP_NAME = "mezuniyyet.exe"

class UpdaterService:
    def __init__(self, ui_callbacks):
        """
        Yeniləmə prosesini idarə edir.
        ui_callbacks: UI-ı yeniləmək üçün funksiyaları olan bir lüğət.
                      Məsələn: {'update_status': func, 'update_progress': func, 'on_finish': func}
        """
        self.ui_callbacks = ui_callbacks

    def start_update_in_thread(self):
        """Yeniləmə prosesini arxa fonda (background thread) başladır."""
        threading.Thread(target=self._run_update_task, daemon=True).start()

    def _run_update_task(self):
        """GitHub-dan ən son versiyanı endirir və proqramı yeniləyir."""
        try:
            # 1. GitHub-dan ən son versiyanı al
            self.ui_callbacks['update_status']("Ən son versiya məlumatları alınır...")
            response = requests.get(GITHUB_API_URL, timeout=10)
            response.raise_for_status()
            latest_data = response.json()
            asset_url = next((asset['browser_download_url'] for asset in latest_data['assets'] if asset['name'].lower() == MAIN_APP_NAME.lower()), None)
            
            if not asset_url:
                raise Exception(f"{MAIN_APP_NAME} faylı GitHub Releases-də tapılmadı.")

            # 2. Yeni versiyanı müvəqqəti fayla endir
            self.ui_callbacks['update_status']("Yeni versiya endirilir...")
            temp_exe_path = MAIN_APP_NAME + ".new"
            response = requests.get(asset_url, stream=True, timeout=60)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            with open(temp_exe_path, 'wb') as f:
                downloaded_size = 0
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded_size += len(chunk)
                    if total_size > 0:
                        progress = (downloaded_size / total_size) * 100
                        self.ui_callbacks['update_progress'](progress)

            # 3. Proqramı yeniləmək üçün batch skripti yarat və işə sal
            self.ui_callbacks['update_status']("Quraşdırma tamamlanır...")
            
            batch_script = f"""
@echo off
echo Proqram yenilenir, zehmet olmasa gozleyin...
timeout /t 3 /nobreak > NUL
move /Y "{temp_exe_path}" "{MAIN_APP_NAME}"
echo Yenilenme tamamlandi! Proqram yeniden basladilir...
start "" "{MAIN_APP_NAME}"
del "%~f0"
"""
            with open("update.bat", "w", encoding='utf-8') as f:
                f.write(batch_script)

            # Batch skriptini işə sal və proqramdan çıx
            subprocess.Popen("update.bat", shell=True)
            sys.exit()

        except Exception as e:
            messagebox.showerror("Yeniləmə Xətası", f"Yeniləmə zamanı xəta baş verdi:\n{e}")
            # Xəta baş verərsə, UI-ı əvvəlki vəziyyətinə qaytar
            if 'on_error' in self.ui_callbacks:
                self.ui_callbacks['on_error']()
