# app.py (Sessiya İdarəetməli Yekun Versiya)

import tkinter as tk
from tkinter import ttk, messagebox
import logging
import os
import sys
import socket
import json
import bcrypt
import uuid # Sessiya ID-ləri üçün
from auth_windows import LoginFrame, RegisterFrame
from main_app_window import MainAppFrame
import database # database.py faylından funksiyaları import edirik

CONFIG_FILE = "config.json"

def get_log_file_path():
    try:
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            app_data_dir = os.path.join(os.getenv('APPDATA'), 'MezuniyyetSistemi')
        else:
            app_data_dir = os.path.dirname(os.path.abspath(__file__))
        os.makedirs(app_data_dir, exist_ok=True)
        return os.path.join(app_data_dir, 'app_debug.log')
    except Exception:
        return 'app_debug.log'

log_file = get_log_file_path()
logging.basicConfig(filename=log_file, level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]', encoding='utf-8')

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def load_config():
    if not os.path.exists(CONFIG_FILE): return {}
    try:
        with open(CONFIG_FILE, "r") as f: return json.load(f)
    except (json.JSONDecodeError, IOError): return {}

def save_config(config_data):
    try:
        with open(CONFIG_FILE, "w") as f: json.dump(config_data, f, indent=4)
    except IOError as e: logging.error(f"Config faylı yazılarkən xəta: {e}")

class MainApplication(tk.Tk):
    def __init__(self):
        super().__init__()
        
        self.session_id = None # Bu proqramın unikal sessiya ID-si
        self.version_info = {"current": "4.1", "latest": ""}
        current_version = self.version_info.get("current", "")
        self.title(f"Məzuniyyət İdarəetmə Sistemi v{current_version}")
        self.geometry("400x550")
        self.minsize(350, 500)
        self.current_user = None
        
        style = ttk.Style(self)
        style.theme_use('vista')
        style.configure('TFrame', background='white')

        self.container = ttk.Frame(self)
        self.container.pack(fill="both", expand=True)
        
        self.frames = {}
        self._initialize_frames()
        self.check_database_connection()

        # Proqram "X" ilə bağlandıqda sessiyanı silmək üçün
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

    def on_closing(self):
        """Pəncərə bağlandıqda çağırılır."""
        if self.session_id:
            database.remove_user_session(self.session_id)
        self.destroy()

    def _initialize_frames(self):
        config = load_config()
        ip_address = get_ip_address()
        last_username = config.get(ip_address, {}).get("last_user", "")

        login_frame = LoginFrame(self.container, self.attempt_login, self.show_register_frame, last_username)
        self.frames[LoginFrame.__name__] = login_frame
        login_frame.place(relx=0.5, rely=0.5, anchor="center")

        register_frame = RegisterFrame(self.container, self.attempt_register, self.show_login_frame)
        self.frames[RegisterFrame.__name__] = register_frame
        register_frame.place(relx=0.5, rely=0.5, anchor="center")
    
    def show_login_frame(self):
        self.show_frame("LoginFrame")

    def show_register_frame(self):
        self.show_frame("RegisterFrame")

    def attempt_login(self, username, password, remember_me):
        logging.info(f"'{username}' üçün daxil olma cəhdi.")
        user_data = database.get_user_for_login(username)
        
        if user_data and bcrypt.checkpw(password.encode('utf-8'), user_data[2].encode('utf-8')):
            user_id = user_data[0]
            max_sessions = user_data[4]
            
            # Sessiya limitini yoxlayaq
            active_sessions = database.get_active_session_counts().get(user_id, 0)
            if active_sessions >= max_sessions:
                messagebox.showerror("Giriş Məhdudiyyəti", f"Bu istifadəçi üçün maksimum {max_sessions} aktiv sessiyaya icazə verilir. \nBaşqa bir cihazdan çıxış edin və yenidən cəhd edin.")
                return

            # Yeni sessiya yaradaq
            self.session_id = database.add_user_session(user_id)
            if not self.session_id:
                messagebox.showerror("Xəta", "Sessiya yaradıla bilmədi. Zəhmət olmasa, yenidən cəhd edin.")
                return

            user_info = {'id': user_id, 'name': user_data[1], 'role': user_data[3].strip()}
            
            config = load_config()
            ip_address = get_ip_address()
            if ip_address not in config: config[ip_address] = {}
            config[ip_address]["last_user"] = username if remember_me else ""
            save_config(config)
            
            self.login_successful(user_info)
        else:
            messagebox.showerror("Xəta", "İstifadəçi adı və ya şifrə yanlışdır.")
            logging.warning(f"'{username}' üçün uğursuz daxil olma cəhdi.")

    def attempt_register(self, name, username, password, confirm_password):
        if not all([name, username, password, confirm_password]):
            messagebox.showerror("Xəta", "Bütün xanalar doldurulmalıdır."); return
        if password != confirm_password:
            messagebox.showerror("Xəta", "Şifrələr eyni deyil."); return

        logging.info(f"'{username}' üçün qeydiyyat cəhdi.")
        if database.create_new_user(name, username, password):
            messagebox.showinfo("Uğurlu", "Qeydiyyat uğurla tamamlandı. İndi daxil ola bilərsiniz.")
            self.show_frame("LoginFrame")

    def show_frame(self, page_name):
        if page_name == "MainAppFrame":
            if self.current_user:
                if "MainAppFrame" in self.frames: self.frames["MainAppFrame"].destroy()
                self.geometry("1200x700")
                self.minsize(1000, 600)
                frame = MainAppFrame(self.container, self.current_user, self.version_info, self.logout)
                self.frames["MainAppFrame"] = frame
                frame.pack(fill="both", expand=True)
                frame.tkraise()
        else:
            self.geometry("400x550")
            self.minsize(350, 500)
            if "MainAppFrame" in self.frames: self.frames["MainAppFrame"].pack_forget()
            frame = self.frames.get(page_name)
            if frame: frame.tkraise()

    def login_successful(self, user_info):
        self.current_user = user_info
        logging.info(f"İstifadəçi '{user_info['name']}' ({user_info.get('role', 'user')}) sistemə daxil oldu. Sessiya ID: {self.session_id}")
        self.show_frame("MainAppFrame")

    def logout(self):
        if self.session_id:
            logging.info(f"Sessiya {self.session_id} bağlanır...")
            database.remove_user_session(self.session_id)
            self.session_id = None
        
        if self.current_user:
            logging.info(f"İstifadəçi '{self.current_user.get('name', 'Bilinməyən')}' sistemdən çıxdı.")
        
        self.current_user = None
        if "MainAppFrame" in self.frames:
            self.frames["MainAppFrame"].destroy()
            del self.frames["MainAppFrame"]
        
        self._initialize_frames()
        self.show_frame("LoginFrame")
    
    def check_database_connection(self):
        conn = database.db_connect()
        if conn:
            logging.info("Verilənlər bazasına uğurla qoşuldu.")
            conn.close() 
            self.show_frame("LoginFrame")
        else:
            logging.critical("Verilənlər bazasına qoşulmaq mümkün olmadı. Proqram dayandırılır.")
            self.destroy()

if __name__ == "__main__":
    try:
        app = MainApplication()
        app.mainloop()
    except Exception as e:
        logging.exception("Gözlənilməz xəta baş verdi!")
        messagebox.showerror("Gözlənilməz Xəta", f"Proqramda kritik bir xəta baş verdi:\n\n{type(e).__name__}: {e}\n\nƏtraflı məlumat üçün log faylına baxın.")

