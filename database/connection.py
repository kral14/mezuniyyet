# database/connection.py (SON DÜZƏLİŞ)
import psycopg2
from . import get_active_db_params

def db_connect():
    """
    Aktiv şirkətin verilənlər bazasına qoşulur.
    """
    try:
        db_params = get_active_db_params()
        
        # --- DÜZƏLİŞ BURADADIR ---
        # psycopg2-nin tanımadığı "company_code" parametrini qoşulmadan əvvəl silirik.
        db_params.pop('company_code', None)
        
        return psycopg2.connect(**db_params)
        
    except (psycopg2.Error, FileNotFoundError, ConnectionError) as e:
        raise e