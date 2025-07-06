# database/connection.py

import psycopg2
from tkinter import messagebox

DB_PARAMS = { "dbname": "neondb", "user": "neondb_owner", "password": "npg_RXHDsJQeL08a", "host": "ep-yellow-lake-a9ooylj6-pooler.gwc.azure.neon.tech", "port": "5432", "sslmode": "require" }

def db_connect():
    try:
        return psycopg2.connect(**DB_PARAMS)
    except psycopg2.OperationalError as e:
        messagebox.showerror("Baza Qoşulma Xətası", f"Verilənlər bazasına qoşulmaq mümkün olmadı:\n{e}")
        return None