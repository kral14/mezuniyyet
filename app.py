# app.py (Düzəldilmiş Tam Versiya)

import tkinter as tk
from tkinter import ttk, messagebox
import logging
import os
import sys
import socket
import json
import traceback

import bcrypt
import psycopg2
# Proyektin daxili importları
import database
from auth_windows import LoginFrame, RegisterFrame
from ui import MainAppFrame

CONFIG_FILE = "config.json"
APP_VERSION = "4.3" # Versiyanı mərkəzi bir yerdə saxlayaq

# --- Köməkçi Funksiyalar ---

def get_log_file_path():
    try:
        # .exe olaraq işləyəndə %APPDATA% qovluğunu istifadə etsin
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            app_data_dir = os.path.join(os.getenv('APPDATA'), 'MezuniyyetSistemi')
        else: # Normal `python app.py` olaraq işləyəndə
            app_data_dir = os.path.dirname(os.path.abspath(__file__))
        os.makedirs(app_data_dir, exist_ok=True)
        return os.path.join(app_data_dir, 'app_debug.log')
    except Exception:
        # Hər hansı bir xəta olarsa, proqramın olduğu yerdə saxlasın
        return 'app_debug.log'

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(1) # Gözləmə müddətini azaldırıq
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def load_config():
    if not os.path.exists(CONFIG_FILE):
        return {}
    try:
        with open(CONFIG_FILE, "r", encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}

def save_config(config_data):
    try:
        with open(CONFIG_FILE, "w", encoding='utf-8') as f:
            json.dump(config_data, f, indent=4)
    except IOError as e:
        logging.error(f"Config faylı yazılarkən xəta: {e}")

# --- Əsas Proqram Sinifi ---

class MainApplication(tk.Tk):
    def __init__(self):
        super().__init__()

        self.session_id = None
        self.login_history_id = None
        self.version_info = {"current": APP_VERSION, "latest": ""}
        self.title(f"Məzuniyyət İdarəetmə Sistemi v{self.version_info['current']}")

        # Şriftləri və stilləri mərkəzi konfiqurasiya edirik
        self.main_font = "Segoe UI"
        self.configure_styles()

        self.container = ttk.Frame(self)
        self.container.pack(fill="both", expand=True)
        
        self.frames = {}
        self.current_user = None
        
        self.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        self._initialize_auth_frames()
        self.check_database_connection()

    def configure_styles(self):
        """Bütün proqram üçün şriftləri və stilləri təyin edir."""
        s = ttk.Style()
        s.theme_use('vista') # Daha müasir görünüş üçün 'vista', 'xpnative', və ya 'clam' istifadə etmək olar
        
        # Bütün ttk elementləri üçün standart şrifti təyin et
        s.configure('.', font=(self.main_font, 10))
        
        # Xüsusi elementlərin şriftlərini fərdiləşdir
        s.configure('TNotebook.Tab', font=(self.main_font, 10))
        s.configure('TLabelframe.Label', font=(self.main_font, 9, 'bold'))
        s.configure('TButton', font=(self.main_font, 9))
        s.configure('Header.TLabel', font=(self.main_font, 14, 'bold'))

    def on_closing(self):
        """Proqram bağlanarkən aktiv sessiyanı da bağlayır."""
        if self.current_user and self.session_id:
            database.remove_user_session(self.session_id, self.login_history_id)
        self.destroy()

    def _initialize_auth_frames(self):
        """Giriş və qeydiyyat pəncərələrini ilkin hazırlayır."""
        config = load_config()
        ip_address = get_ip_address()
        last_username = config.get(ip_address, {}).get("last_user", "")

        # LoginFrame yaradarkən bütün lazımi callback-ləri ötürürük
        self.frames['LoginFrame'] = LoginFrame(self.container, self.attempt_login, self.show_register_frame, last_username)
        self.frames['RegisterFrame'] = RegisterFrame(self.container, self.attempt_register, self.show_login_frame)

    def show_frame(self, frame_name, geometry="400x550", minsize=(350, 500)):
        """Verilən adda olan pəncərəni göstərir və digərlərini gizlədir."""
        # Əsas proqram pəncərəsi varsa və yeni pəncərə o deyilsə, onu məhv et
        if 'MainAppFrame' in self.frames and self.frames['MainAppFrame'].winfo_exists():
            self.frames['MainAppFrame'].destroy()
            del self.frames['MainAppFrame']
        
        self.geometry(geometry)
        self.minsize(minsize[0], minsize[1])

        frame = self.frames.get(frame_name)
        if frame:
            frame.place(in_=self.container, relx=0.5, rely=0.5, anchor="center")
            frame.tkraise()

    def show_login_frame(self):
        self.show_frame('LoginFrame')

    def show_register_frame(self):
        self.show_frame('RegisterFrame')

    def attempt_login(self, username, password, remember_me):
        try:
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
        except Exception as e:
            messagebox.showerror("Giriş Xətası", f"Giriş zamanı xəta baş verdi: {e}")
            logging.error(f"Giriş xətası: {traceback.format_exc()}")

    def attempt_register(self, name, username, password, confirm_password):
        if not all([name, username, password, confirm_password]):
            messagebox.showerror("Xəta", "Bütün xanalar doldurulmalıdır.")
            return
        if password != confirm_password:
            messagebox.showerror("Xəta", "Şifrələr eyni deyil.")
            return
        
        try:
            if database.create_new_user(name, username, password):
                messagebox.showinfo("Uğurlu", "Qeydiyyat uğurla tamamlandı. İndi daxil ola bilərsiniz.")
                self.show_login_frame()
        except Exception as e:
            messagebox.showerror("Qeydiyyat Xətası", f"Qeydiyyat zamanı xəta: {e}")
            logging.error(f"Qeydiyyat xətası: {traceback.format_exc()}")

    def show_main_app_frame(self):
        for frame in self.frames.values():
            if frame.winfo_exists():
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
        
        if message:
            messagebox.showwarning("Sistem Mesajı", message, parent=self)
            
        self.show_login_frame()
    
    def check_database_connection(self):
        try:
            conn = database.db_connect()
            if conn:
                conn.close() 
                self.show_login_frame()
            else:
                # db_connect() içində onsuz da xəta göstərilir, amma hər ehtimala qarşı
                self.destroy()
        except psycopg2.Error as e:
            messagebox.showerror("Kritik Baza Xətası", f"Verilənlər bazasına qoşulmaq mümkün olmadı:\n{e}\n\nProqram bağlanır.")
            self.destroy()

# --- Qlobal Xəta Tutucu (Global Exception Handler) ---
def handle_global_exception(exc_type, exc_value, exc_traceback):
    """Gözlənilməz xətaları tutub loga və bazaya yazır."""
    error_details = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
    
    # Əgər 'app' obyekti mövcuddursa, istifadəçi ID-sini götürməyə çalış
    user_id = None
    if 'app' in globals() and isinstance(app, MainApplication) and hasattr(app, 'current_user') and app.current_user:
        user_id = app.current_user.get('id')
    
    logging.critical("QOBAL GÖZLƏNİLMƏZ XƏTA BAŞ VERDİ:\n%s", error_details)
    
    try:
        database.log_error_to_db(user_id, error_details)
    except Exception as db_err:
        logging.error(f"Xəta logunu bazaya yazmaq mümkün olmadı: {db_err}")

    messagebox.showerror(
        "Gözlənilməz Xəta",
        "Proqramda gözlənilməz bir xəta baş verdi. Məlumat adminə göndərildi.\n"
        "Zəhmət olmasa, proqramı yenidən başladın."
    )
    if 'app' in globals() and app.winfo_exists():
        app.destroy()

if __name__ == "__main__":
    # Log faylının konfiqurasiyası
    log_file = get_log_file_path()
    logging.basicConfig(
        level=logging.DEBUG, 
        format='%(asctime)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]', 
        handlers=[
            logging.FileHandler(log_file, 'a', 'utf-8'),
            logging.StreamHandler() # Konsola da yazdırmaq üçün
        ]
    )
    
    # Qlobal xəta tutucunu təyin edirik
    sys.excepthook = handle_global_exception
    
    app = MainApplication()
    app.mainloop()