# database/error_queries.py

import psycopg2
from .connection import db_connect

def log_error_to_db(user_id, traceback_str):
    """Baş verən xətanı verilənlər bazasına yazır."""
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO error_logs (user_id, traceback_text) VALUES (%s, %s)",
                (user_id, traceback_str)
            )
            conn.commit()
    except psycopg2.Error as e:
        # Bu funksiya xəta baş verərkən işlədiyi üçün,
        # burada messagebox göstərmək olmaz, çünki sonsuz dövrə girə bilər.
        # Sadəcə terminala yazırıq.
        print(f"XƏTA LOGUNU YAZARKƏN XƏTA BAŞ VERDİ: {e}")
    finally:
        if conn: conn.close()

def get_all_errors():
    """Bütün xəta qeydlərini bazadan çəkir."""
    conn = db_connect()
    if not conn: return []
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT e.id, emp.username, e.error_timestamp, e.status, e.traceback_text 
                FROM error_logs e
                LEFT JOIN employees emp ON e.user_id = emp.id
                ORDER BY e.error_timestamp DESC
            """)
            return cur.fetchall()
    finally:
        if conn: conn.close()

def get_error_users():
    """Xətası qeydə alınmış unikal istifadəçilərin siyahısını qaytarır."""
    conn = db_connect()
    if not conn: return []
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT emp.username FROM error_logs e
                JOIN employees emp ON e.user_id = emp.id
                WHERE emp.username IS NOT NULL
                ORDER BY emp.username
            """)
            return [row[0] for row in cur.fetchall()]
    finally:
        if conn: conn.close()

def mark_error_as_resolved(error_id):
    """Xətanın statusunu 'Həll Edildi' olaraq dəyişir."""
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE error_logs SET status = 'Həll Edildi' WHERE id = %s", (error_id,))
            conn.commit()
    finally:
        if conn: conn.close()

def delete_error_log(error_id):
    """Seçilmiş xəta qeydini jurnaldan silir."""
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM error_logs WHERE id = %s", (error_id,))
            conn.commit()
    finally:
        if conn: conn.close()