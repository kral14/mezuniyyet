# app.py (Düzəldilmiş sessiya məntiqi ilə)

import tkinter as tk
from tkinter import messagebox
import bcrypt
import os
import sys
import json

from auth_windows import LoginFrame, RegisterFrame
from main_app_window import MainAppFrame
import database

CURRENT_VERSION = "3.3" 
CONFIG_FILE = "config.json"

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.current_user = None
        self._current_frame = None
        
        self.version_info = {"current": CURRENT_VERSION, "latest": CURRENT_VERSION}
        
        self.protocol("WM_DELETE_WINDOW", self.destroy)
        self._handle_startup()

    def _load_config(self):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _save_config(self, data):
        with open(CONFIG_FILE, 'w') as f:
            json.dump(data, f)

    def _handle_startup(self):
        config = self._load_config()
        relogin_id = None
        
        if "--relogin-id" in sys.argv:
            try:
                idx = sys.argv.index("--relogin-id")
                relogin_id = int(sys.argv[idx + 1])
            except (ValueError, IndexError):
                relogin_id = None
        elif config.get("session_user_id"):
            relogin_id = config.get("session_user_id")

        if relogin_id:
            user_data_tuple = database.get_user_by_id(relogin_id)
            if user_data_tuple:
                user_id, name, _, role = user_data_tuple
                self.current_user = {"id": user_id, "name": name, "role": role}
                
                # === DÜZƏLİŞ BURADADIR ===
                # Avtomatik giriş zamanı _on_login_success çağırılmamalıdır,
                # çünki "remember_me" seçimi yoxdur. Birbaşa əsas səhifəyə keçirik.
                # self._on_login_success() # <-- BU SƏTİR SİLİNİR VƏ YA ŞƏRHƏ ALINIR
                
                self._show_main_app_frame()
                return

        self._show_login_frame()

    def _on_login_success(self):
        """Uğurlu MANUAL girişdən sonra konfiqurasiyanı yeniləyir."""
        config = self._load_config()
        config["session_user_id"] = self.current_user['id']
        if self.remember_me_choice:
            config["last_username"] = self.current_user['username_for_login']
        elif "last_username" in config:
            # Əgər "Məni xatırla" seçilməyibsə, yadda saxlanılan adı silirik
            del config["last_username"]
        self._save_config(config)
    
    def _on_logout(self):
        """Sistemdən çıxış zamanı sessiyanı təmizləyir."""
        config = self._load_config()
        if "session_user_id" in config:
            del config["session_user_id"]
        # "Məni xatırla" seçimi aktiv deyilsə, istifadəçi adını da silirik
        # Bu məntiqi gələcəkdə əlavə etmək olar, hələlik sadə saxlayaq.
        self._save_config(config)
        self._show_login_frame()

    def _clear_frame(self):
        if self._current_frame: self._current_frame.destroy()

    def _show_login_frame(self):
        self._clear_frame()
        config = self._load_config()
        last_username = config.get("last_username", "")
        self.title("Sistemə Giriş"); self.geometry("550x450"); self.resizable(True, True); self.minsize(550, 450)
        self._current_frame = LoginFrame(self, self.attempt_login, self._show_register_frame, last_username)
        self._current_frame.pack(expand=True, fill="both")

    def _show_register_frame(self):
        self._clear_frame()
        self.title("Qeydiyyat"); self.geometry("550x450"); self.resizable(True, True); self.minsize(550, 450)
        self._current_frame = RegisterFrame(self, self.attempt_register, self._show_login_frame)
        self._current_frame.pack(expand=True, fill="both")
    
    def _show_main_app_frame(self):
        self._clear_frame()
        self.title("Məzuniyyət İdarəetmə Sistemi"); self.geometry("1100x700"); self.resizable(True, True); self.minsize(900, 600)
        self._current_frame = MainAppFrame(self, self.current_user, self.version_info, self._on_logout)
        self._current_frame.pack(expand=True, fill="both")

    def attempt_login(self, username, password, remember_me):
        user_data_tuple = database.get_user_for_login(username)
        if user_data_tuple:
            user_id, name, stored_hash, role = user_data_tuple
            if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                self.current_user = {"id": user_id, "name": name, "role": role, "username_for_login": username}
                self.remember_me_choice = remember_me
                self._on_login_success()
                self._show_main_app_frame()
                return
        messagebox.showerror("Xəta", "İstifadəçi adı və ya şifrə yanlışdır.", parent=self)

    def attempt_register(self, name, username, password, confirm_password):
        name = name.strip(); username = username.strip()
        if not all([name, username, password, confirm_password]): messagebox.showerror("Xəta", "Bütün xanalar doldurulmalıdır."); return
        if password != confirm_password: messagebox.showerror("Xəta", "Şifrələr eyni deyil."); return
        if database.check_if_name_exists(name): messagebox.showerror("Xəta", f"'{name}' adlı istifadəçi artıq mövcuddur."); return
        if database.create_new_user(name, username, password):
            messagebox.showinfo("Uğurlu", "Qeydiyyat tamamlandı! Admin təsdiqindən sonra daxil ola biləcəksiniz.")
            self._show_login_frame()

if __name__ == "__main__":
    app = App()
    app.mainloop()