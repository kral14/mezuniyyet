# database/__init__.py (QOŞULMA MENECERİ İLƏ YENİ VERSİYA)
import os
import json

_active_connection = None # Sessiya üçün aktiv qoşulmanı saxlayan qlobal dəyişən

def set_active_connection(conn):
    """Giriş zamanı aktiv qoşulmanı təyin edir."""
    global _active_connection
    _active_connection = conn

def get_connection():
    """Aktiv sessiyanın qoşulmasını qaytarır."""
    if not _active_connection or _active_connection.closed:
        raise ConnectionError("Aktiv verilənlər bazası qoşulması mövcud deyil və ya bağlanıb.")
    return _active_connection

def close_active_connection():
    """Çıxış zamanı aktiv qoşulmanı bağlayır."""
    global _active_connection
    if _active_connection and not _active_connection.closed:
        _active_connection.close()
    _active_connection = None

# ... (get_active_db_params və digər importlar olduğu kimi qalır) ...
try:
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    CONFIG_PATH = os.path.join(_BASE_DIR, "config.json")
except NameError: CONFIG_PATH = "config.json"

def get_active_db_params():
    if not os.path.exists(CONFIG_PATH): raise FileNotFoundError(f"Konfiqurasiya faylı tapılmadı: {CONFIG_PATH}")
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f: config = json.load(f)
        active_company = config.get("active_company")
        if not active_company or not config.get("companies"): raise ConnectionError("Aktiv şirkət təyin edilməyib.")
        params = config["companies"].get(active_company)
        if not params: raise ConnectionError(f"'{active_company}' üçün konfiqurasiya tapılmadı.")
        if not params.get("sslmode"): params["sslmode"] = "require"
        return params
    except (json.JSONDecodeError, IOError) as e: raise ConnectionError(f"Konfiqurasiya faylını oxumaq mümkün olmadı: {e}")

# Funksiyaların importu
from .connection import db_connect
from .settings_queries import *
from .error_queries import *
from .user_queries import *
from .session_queries import *
from .vacation_queries import *
from .command_queries import *
from .system_queries import *
from .notification_queries import *