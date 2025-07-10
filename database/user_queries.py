# database/user_queries.py (Düzgün Versiya)

import bcrypt
import psycopg2
from tkinter import messagebox
from .connection import db_connect
from .session_queries import get_active_session_counts

def get_user_for_login(username, company_code, connection=None):
    """Giriş üçün istifadəçini həm istifadəçi adına, həm də şirkət koduna görə axtarır."""
    conn = connection or db_connect()
    if not conn: return None
    try:
        with conn.cursor() as cur:
            # DÜZƏLİŞ: SQL sorğusuna company_code yoxlaması əlavə edildi
            cur.execute(
                "SELECT id, name, password_hash, role, max_sessions FROM employees WHERE username = %s AND company_code = %s AND is_active = TRUE",
                (username, company_code)
            )
            return cur.fetchone()
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Giriş zamanı xəta: {e}")
        return None
    finally:
        if not connection and conn:
            conn.close()
# ... (faylın əvvəli olduğu kimi qalır) ...

def create_new_user(name, username, password, company_code, role='user', total_days=30, max_sessions=1, connection=None):
    """Yeni istifadəçi yaradır və şirkət kodunu da qeyd edir."""
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    conn = connection or db_connect()
    if not conn: return False
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO employees (name, username, password_hash, role, total_vacation_days, max_sessions, company_code) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (name, username, hashed_password.decode('utf-8'), role, total_days, max_sessions, company_code)
            )
        conn.commit()
        return True
    except psycopg2.IntegrityError:
        messagebox.showerror("Xəta", "Bu istifadəçi adı artıq mövcuddur.")
        conn.rollback()
        return False
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Qeydiyyat zamanı xəta: {e}")
        conn.rollback()
        return False
    finally:
        if not connection and conn:
            conn.close()

# ... (faylın qalan hissəsi olduğu kimi qalır) ...
def update_employee(emp_id, new_name, days, max_sessions):
    """İşçi məlumatını və maksimum sessiya sayını yeniləyir."""
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE employees SET name = %s, total_vacation_days = %s, max_sessions = %s WHERE id = %s", (new_name, days, max_sessions, emp_id))
            conn.commit()
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"İşçi məlumatını yeniləyərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def delete_employee(emp_id):
    """İşçini verilənlər bazasından silir."""
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM employees WHERE id = %s", (emp_id,))
            conn.commit()
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"İşçini silərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def set_user_activity(user_id, new_status):
    """İşçinin aktivlik statusunu dəyişir."""
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE employees SET is_active = %s WHERE id = %s", (new_status, user_id))
            conn.commit()
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Statusu dəyişərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def check_if_name_exists(name):
    """Verilmiş adla işçinin mövcud olub-olmadığını yoxlayır."""
    conn = db_connect()
    if not conn: return False
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM employees WHERE name = %s", (name,))
            return cur.fetchone() is not None
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Ad yoxlanarkən xəta baş verdi:\n{e}")
        return False
    finally:
        if conn: conn.close()
        
def load_data_for_user(current_user):
    """İstifadəçi roluna uyğun olaraq məlumatları gətirir."""
    conn = db_connect()
    if not conn: return {}
    data = {}
    try:
        active_sessions = get_active_session_counts()
        with conn.cursor() as cur:
            if current_user['role'].strip() == 'admin':
                cur.execute("SELECT id, name, total_vacation_days, is_active, max_sessions FROM employees ORDER BY name")
            else:
                cur.execute("SELECT id, name, total_vacation_days, is_active, max_sessions FROM employees WHERE id = %s", (current_user['id'],))
            
            employees = cur.fetchall()
            for emp_id, name, total_days, is_active, max_sessions in employees:
                data[name] = {
                    "db_id": emp_id, "umumi_gun": total_days, "is_active": is_active,
                    "max_sessions": max_sessions, "active_session_count": active_sessions.get(emp_id, 0),
                    "goturulen_icazeler": []
                }
            
            vacation_query = "SELECT id, employee_id, start_date, end_date, note, is_inactive, created_at, status FROM vacations WHERE is_archived = FALSE"
            params = []
            if current_user['role'].strip() != 'admin':
                vacation_query += " AND employee_id = %s"
                params.append(current_user['id'])
            vacation_query += " ORDER BY start_date"
            cur.execute(vacation_query, tuple(params))

            vacations = cur.fetchall()
            for vac_id, emp_id, start, end, note, inactive, created, status in vacations:
                for emp_name, emp_data in data.items():
                    if emp_data["db_id"] == emp_id:
                        emp_data["goturulen_icazeler"].append({
                            "db_id": vac_id, "baslama": start.isoformat(), "bitme": end.isoformat(),
                            "qeyd": note, "aktiv_deyil": inactive,
                            "yaradilma_tarixi": created.isoformat(), "status": status
                        }); break
    except psycopg2.Error as e:
        messagebox.showerror("Baza Oxuma Xətası", f"Məlumatları oxuyarkən xəta baş verdi:\n{e}")
    finally:
        if conn: conn.close()
    return data