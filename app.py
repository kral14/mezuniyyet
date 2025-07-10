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
# İlk qurulum pəncərəsinə artıq ehtiyac yoxdur.
# from ui.initial_config_window import InitialDBConfigWindow 

CONFIG_FILE = "config.json"
APP_VERSION = "4.3"

# DÜZƏLİŞ: Bütün şirkətlərin məlumatlarını proqramın daxilində saxlayırıq.
# Yeni şirkət əlavə etmək üçün bu siyahını yeniləyib proqramı yenidən build etmək lazımdır.
KNOWN_COMPANIES = {
    "aztrade": {
        "company_name": "Yeni_sirket",
        "db_params": {
            "host": "ep-royal-moon-a2n0reuz-pooler.eu-central-1.aws.neon.tech",
            "port": "5432",
            "dbname": "neondb",
            "user": "neondb_owner",
            "password": "npg_sroMeB06VSiQ",
            "sslmode": "require"
        }
    },
    "aztrade12": {
        "company_name": "kohnesi",
        "db_params": {
            "host": "ep-yellow-lake-a9ooylj6-pooler.gwc.azure.neon.tech",
            "port": "5432",
            "dbname": "neondb",
            "user": "neondb_owner",
            "password": "npg_RXHDsJQeL08a",
            "sslmode": "require"
        }
    }
}


# --- Köməkçi Funksiyalar (dəyişiklik yoxdur) ---
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
        s.settimeout(0.1)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def load_config():
    if not os.path.exists(CONFIG_FILE):
        return {} # Fayl yoxdursa, boş lüğət qaytar
    try:
        with open(CONFIG_FILE, "r", encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}

def save_config(config_data):
    try:
        with open(CONFIG_FILE, "w", encoding='utf-8') as f:
            json.dump(config_data, f, indent=4, ensure_ascii=False)
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

        self.main_font = "Segoe UI"
        self.configure_styles()

        self.container = ttk.Frame(self)
        self.container.pack(fill="both", expand=True)
        
        self.frames = {}
        self.current_user = None
        
        self.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # DÜZƏLİŞ: İlkin konfiqurasiya yoxlaması ləğv edildi, birbaşa proqram başlayır.
        self.start_app()

    def configure_styles(self):
        s = ttk.Style()
        s.theme_use('vista')
        s.configure('.', font=(self.main_font, 10))
        s.configure('TNotebook.Tab', font=(self.main_font, 10))
        s.configure('TLabelframe.Label', font=(self.main_font, 9, 'bold'))
        s.configure('TButton', font=(self.main_font, 9))
        s.configure("Accent.TButton", foreground="white", background="#007bff")

    def start_app(self):
        self._initialize_auth_frames()
        self.show_login_frame()

    def on_closing(self):
        if self.current_user:
            database.close_active_connection()
        self.destroy()

    def _initialize_auth_frames(self):
        config = load_config()
        last_login = config.get("last_login_info", {})
        self.frames['LoginFrame'] = LoginFrame(self.container, self.attempt_login, self.show_register_frame, last_login)
        self.frames['RegisterFrame'] = RegisterFrame(self.container, self.attempt_register, self.show_login_frame)

    def show_frame(self, frame_name, geometry="400x550", minsize=(350, 500)):
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
        if 'LoginFrame' not in self.frames:
            self._initialize_auth_frames()
        self.deiconify()
        self.show_frame('LoginFrame')

    def show_register_frame(self):
        self.show_frame('RegisterFrame')

    # app.py (Düzəldilmiş)
# ... (faylın əvvəli olduğu kimi qalır) ...

    def attempt_login(self, company_code, username, password, remember_me):
        if not all([company_code, username, password]):
            messagebox.showerror("Xəta", "Bütün sahələr doldurulmalıdır."); return
        
        company_info = KNOWN_COMPANIES.get(company_code)
        if not company_info:
            messagebox.showerror("Xəta", "Daxil edilən şirkət kodu tapılmadı."); return
        
        db_params = company_info["db_params"]
        conn = None
        try:
            conn = psycopg2.connect(**db_params)
            
            # DÜZƏLİŞ: get_user_for_login funksiyasına company_code ötürülür
            user_data = database.get_user_for_login(username, company_code, connection=conn)
            
            if user_data and bcrypt.checkpw(password.encode('utf-8'), user_data[2].encode('utf-8')):
                config = load_config()
                if "companies" not in config: config["companies"] = {}
                for code, info in KNOWN_COMPANIES.items():
                    config["companies"][info["company_name"]] = {"company_code": code, **info["db_params"]}
                config["active_company"] = company_info["company_name"]
                if remember_me:
                    config["last_login_info"] = {"company_code": company_code, "username": username}
                else:
                    config.pop("last_login_info", None)
                save_config(config)

                database.set_active_connection(conn)
                user_id, name, _, role, _ = user_data
                self.current_user = {'id': user_id, 'name': name, 'role': role.strip(), 'username': username}
                self.show_main_app_frame()
            else:
                if conn: conn.close()
                messagebox.showerror("Xəta", "İstifadəçi adı və ya şifrə yanlışdır.")
        except psycopg2.Error as e:
            if conn: conn.close()
            messagebox.showerror("Giriş Xətası", f"Verilənlər bazasına qoşularkən xəta baş verdi:\n{e}")
        except Exception as e:
            if conn: conn.close()
            messagebox.showerror("Giriş Xətası", f"Naməlum xəta baş verdi: {e}")

# ... (faylın qalan hissəsi olduğu kimi qalır) ...
    # ... (faylın əvvəli olduğu kimi qalır) ...

    def attempt_register(self, company_code, name, username, password, confirm_password):
        if not all([company_code, name, username, password, confirm_password]):
            messagebox.showerror("Xəta", "Bütün xanalar doldurulmalıdır."); return
        if password != confirm_password:
            messagebox.showerror("Xəta", "Şifrələr eyni deyil."); return
        
        company_info = KNOWN_COMPANIES.get(company_code)
        if not company_info:
            messagebox.showerror("Xəta", "Daxil edilən şirkət kodu tapılmadı."); return
        
        db_params = company_info["db_params"]
        conn = None
        try:
            conn = psycopg2.connect(**db_params)
            # DÜZƏLİŞ: company_code parametrini ötürürük
            if database.create_new_user(name, username, password, company_code=company_code, connection=conn):
                messagebox.showinfo("Uğurlu", "Qeydiyyat uğurla tamamlandı. İndi daxil ola bilərsiniz.")
                self.show_login_frame()
        except psycopg2.Error as e:
            messagebox.showerror("Qeydiyyat Xətası", f"Verilənlər bazası ilə əlaqə zamanı xəta: {e}")
        except Exception as e:
            messagebox.showerror("Qeydiyyat Xətası", f"Naməlum xəta baş verdi: {e}")
        finally:
            if conn: conn.close()
            
# ... (faylın qalan hissəsi olduğu kimi qalır) ...
    def show_main_app_frame(self):
        for frame in self.frames.values():
            if frame.winfo_exists(): frame.place_forget()
        self.geometry("1200x700"); self.minsize(1000, 600)
        main_frame = MainAppFrame(self.container, self.current_user, self.version_info, self.logout)
        self.frames['MainAppFrame'] = main_frame
        main_frame.pack(fill="both", expand=True)

    def logout(self, restart=False):
        database.close_active_connection()
        if restart:
            self.destroy(); python = sys.executable; os.execl(python, python, *sys.argv); return
        self.current_user = None
        for widget in self.container.winfo_children(): widget.destroy()
        self.frames.clear()
        self.start_app()

def handle_global_exception(exc_type, exc_value, exc_traceback):
    error_details = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
    logging.critical("QOBAL GÖZLƏNİLMƏZ XƏTA BAŞ VERDİ:\n%s", error_details)
    try:
        # DB bağlantısı olmadan da xətanı loglaya bilmək üçün bu hissəni təhlükəsiz edirik.
        if 'app' in globals() and app.current_user and database.get_connection() and not database.get_connection().closed:
            user_id = app.current_user.get('id')
            database.log_error_to_db(user_id, error_details)
    except Exception as db_err:
        logging.error(f"Xəta logunu bazaya yazmaq mümkün olmadı: {db_err}")
    messagebox.showerror("Gözlənilməz Xəta", "Proqramda gözlənilməz bir xəta baş verdi. Detallar üçün log faylına baxın.")
    if 'app' in globals() and app.winfo_exists(): app.destroy()

if __name__ == "__main__":
    log_file = get_log_file_path()
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]', handlers=[logging.FileHandler(log_file, 'a', 'utf-8'), logging.StreamHandler()])
    sys.excepthook = handle_global_exception
    
    app = MainApplication()
    app.mainloop()