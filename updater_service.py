# updater_service.py (Düzgün versiya)

import tkinter as tk
from tkinter import messagebox
import requests
import os
import sys
import subprocess
import threading
from pathlib import Path
import time  # <-- ƏSAS DÜZƏLİŞ BURADADIR / EN ÖNEMLİ DÜZELTME BURADA

# --- YENİLƏMƏ ÜÇÜN KONFİQURASİYA ---
GITHUB_API_URL = "https://api.github.com/repos/kral14/mezuniyyet/releases/latest"

class UpdaterService:
    def __init__(self, ui_callbacks):
        self.ui_callbacks = ui_callbacks

    def start_update_in_thread(self):
        """Yeniləmə prosesini arxa fonda (background thread) başladır."""
        threading.Thread(target=self._run_update_task, daemon=True).start()

    def _run_update_task(self):
        """GitHub-dan ən son versiyanı endirir və istifadəçiyə məlumat verir."""
        try:
            self.ui_callbacks['update_status']("Yeni versiya yoxlanılır...")
            response = requests.get(GITHUB_API_URL, timeout=10)
            response.raise_for_status()
            latest_data = response.json()
            
            asset = next((a for a in latest_data['assets'] if 'setup' in a['name'].lower() and a['name'].endswith('.exe')), None)
            if not asset:
                raise Exception("GitHub Releases-də 'setup.exe' faylı tapılmadı.")

            asset_url = asset['browser_download_url']
            setup_filename = asset['name']

            self.ui_callbacks['update_status'](f"{setup_filename} endirilir...")
            downloads_path = str(Path.home() / "Downloads")
            save_path = os.path.join(downloads_path, setup_filename)

            response = requests.get(asset_url, stream=True, timeout=180)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            with open(save_path, 'wb') as f:
                downloaded_size = 0
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded_size += len(chunk)
                    if total_size > 0:
                        self.ui_callbacks['update_progress']((downloaded_size / total_size) * 100)

            self.ui_callbacks['update_status']("Quraşdırma başladılır...")
            time.sleep(1) # Endirmənin bitməsinə əmin olmaq üçün qısa fasilə

            subprocess.Popen([save_path])
            sys.exit()

        except Exception as e:
            messagebox.showerror("Yeniləmə Xətası", f"Yeniləmə zamanı xəta baş verdi:\n{e}")
            if 'on_error' in self.ui_callbacks:
                self.ui_callbacks['on_error']()