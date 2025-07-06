import tkinter as tk
from tkinter import ttk, messagebox
import logging
import os
import sys
import socket
import json
import bcrypt

import database
from auth_windows import LoginFrame, RegisterFrame
from ui import MainAppFrame
import traceback  # DÜZƏLİŞ: Çatışmayan import əlavə edildi


CONFIG_FILE = "config.json"

# --- Köməkçi Funksiyalar (Tam Doldurulmuş) ---

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

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(2)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def load_config():
    if not os.path.exists(CONFIG_FILE):
        return {}
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}

def save_config(config_data):
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config_data, f, indent=4)
    except IOError as e:
        logging.error(f"Config faylı yazılarkən xəta: {e}")
def handle_exception(exc_type, exc_value, exc_traceback):
    """Gözlənilməz xətaları tutub bazaya yazan qlobal funksiya."""
    error_details = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
    
    user_id = None
    if 'app' in globals() and hasattr(app, 'current_user') and app.current_user:
        user_id = app.current_user.get('id')
    
    logging.critical("GÖZLƏNİLMƏZ XƏTA BAŞ VERDİ:\n%s", error_details)
    
    database.log_error_to_db(user_id, error_details)
    
    messagebox.showerror(
        "Gözlənilməz Xəta",
        "Proqramda gözlənilməz bir xəta baş verdi. Məlumat adminə göndərildi.\n"
        "Zəhmət olmasa, proqramı yenidən başladın."
    )
    if 'app' in globals() and app.winfo_exists():
        app.destroy()
# --- ƏSAS PROQRAM KODU ---

log_file = get_log_file_path()
logging.basicConfig(filename=log_file, level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]', encoding='utf-8')
class MainApplication(tk.Tk):
    def __init__(self):
        super().__init__()
        
        self.session_id = None
        self.login_history_id = None
        self.version_info = {"current": "4.3", "latest": ""}
        self.title(f"Məzuniyyət İdarəetmə Sistemi v{self.version_info['current']}")
        
        self.container = ttk.Frame(self)
        self.container.pack(fill="both", expand=True)
        
        self.frames = {}
        self.current_user = None
        
        self.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        self._initialize_auth_frames()
        self.check_database_connection()

    def on_closing(self):
        if self.current_user:
            database.remove_user_session(self.session_id, self.login_history_id)
        self.destroy()

    def _initialize_auth_frames(self):
        config = load_config()
        ip_address = get_ip_address()
        last_username = config.get(ip_address, {}).get("last_user", "")

        self.frames['LoginFrame'] = LoginFrame(self.container, self.attempt_login, self.show_register_frame, last_username)
        self.frames['RegisterFrame'] = RegisterFrame(self.container, self.attempt_register, self.show_login_frame)

    def show_login_frame(self):
        if 'MainAppFrame' in self.frames and self.frames.get('MainAppFrame').winfo_exists():
            self.frames['MainAppFrame'].destroy()
            del self.frames['MainAppFrame']
        
        self.geometry("400x550")
        self.minsize(350, 500)
        
        self.frames['LoginFrame'].place(relx=0.5, rely=0.5, anchor="center")
        self.frames['LoginFrame'].tkraise()

    def show_register_frame(self):
        self.frames['RegisterFrame'].place(relx=0.5, rely=0.5, anchor="center")
        self.frames['RegisterFrame'].tkraise()

    def attempt_login(self, username, password, remember_me):
        is_maintenance = database.get_maintenance_mode()
        user_data = database.get_user_for_login(username)

        if is_maintenance and (not user_data or user_data[3].strip() != 'admin'):
            messagebox.showerror("Giriş Mümkün Deyil", "Sistemdə texniki işlər aparılır.\nZəhmət olmasa, daha sonra yenidən cəhd edin.")
            return

        if user_data and bcrypt.checkpw(password.encode('utf-8'), user_data[2].encode('utf-8')):
            user_id, name, role, max_sessions = user_data[0], user_data[1], user_data[3], user_data[4]
            active_sessions = database.get_active_session_counts().get(user_id, 0)
            if active_sessions >= max_sessions:
                messagebox.showerror("Giriş Məhdudiyyəti", f"Bu istifadəçi üçün maksimum {max_sessions} aktiv sessiyaya icazə verilir.")
                return

            ip_address = get_ip_address()
            self.session_id, self.login_history_id = database.add_user_session(user_id, ip_address)

            if not self.session_id:
                messagebox.showerror("Xəta", "Sessiya yaradıla bilmədi.")
                return

            self.current_user = {'id': user_id, 'name': name, 'role': role.strip()}
            
            config = load_config()
            if ip_address not in config: config[ip_address] = {}
            config[ip_address]["last_user"] = username if remember_me else ""
            save_config(config)
            
            self.show_main_app_frame()
        else:
            messagebox.showerror("Xəta", "İstifadəçi adı və ya şifrə yanlışdır.")

    def attempt_register(self, name, username, password, confirm_password):
        if not all([name, username, password, confirm_password]):
            messagebox.showerror("Xəta", "Bütün xanalar doldurulmalıdır.")
            return
        if password != confirm_password:
            messagebox.showerror("Xəta", "Şifrələr eyni deyil.")
            return
        if database.create_new_user(name, username, password):
            messagebox.showinfo("Uğurlu", "Qeydiyyat uğurla tamamlandı. İndi daxil ola bilərsiniz.")
            self.show_login_frame()

    def show_main_app_frame(self):
        for frame in self.frames.values():
            frame.place_forget()
            
        self.geometry("1200x700")
        self.minsize(1000, 600)
        
        main_frame = MainAppFrame(self.container, self.current_user, self.version_info, self.logout)
        self.frames['MainAppFrame'] = main_frame
        main_frame.pack(fill="both", expand=True)

    def logout(self, message=None):
        if self.current_user:
            database.remove_user_session(self.session_id, self.login_history_id)
        
        self.session_id = None
        self.login_history_id = None
        self.current_user = None
        
        def _show_login_and_message():
            if message:
                messagebox.showwarning("Sistem Mesajı", message, parent=self)
            self.show_login_frame()
            
        self.after(50, _show_login_and_message)
    
    def check_database_connection(self):
        conn = database.db_connect()
        if conn:
            conn.close() 
            self.show_login_frame()
        else:
            self.destroy()

if __name__ == "__main__":
    app = MainApplication()
    app.mainloop()