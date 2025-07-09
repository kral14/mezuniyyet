# database/connection.py (Düzəldilmiş Tam Versiya)

import psycopg2
# DÜZƏLİŞ: messagebox buradan silindi, çünki UI elementi baza kodunda olmamalıdır.

DB_PARAMS = { 
    "dbname": "neondb", 
    "user": "neondb_owner", 
    "password": "npg_RXHDsJQeL08a", 
    "host": "ep-yellow-lake-a9ooylj6-pooler.gwc.azure.neon.tech", 
    "port": "5432", 
    "sslmode": "require" 
}

def db_connect():
    """
    Verilənlər bazasına qoşulmağa cəhd edir.
    Uğursuz olarsa, xətanı yuxarıya (onu çağıran funksiyaya) ötürür.
    """
    try:
        return psycopg2.connect(**DB_PARAMS)
    except psycopg2.OperationalError as e:
        # Xətanı messagebox ilə göstərmək əvəzinə, sadəcə yuxarı ötürürük.
        # Bu xətanı UI (istifadəçi interfeysi) təbəqəsi tutub istifadəçiyə göstərməlidir.
        raise e