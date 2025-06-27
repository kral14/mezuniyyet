# database.py (Yeni, Təhlükəsiz Versiya)

import psycopg2
import bcrypt
from tkinter import messagebox
import configparser  # <--- 1. BU SATIRI ƏLAVƏ EDİN
from datetime import date
import uuid

# DB_PARAMS lüğəti artıq burada olmayacaq, onu sildik.

def get_db_params():
    """config.ini dosyasından database parametrlərini oxuyur."""
    config = configparser.ConfigParser()
    try:
        config.read('config.ini')
        db_params = dict(config['postgresql'])
        return db_params
    except (FileNotFoundError, KeyError) as e:
        messagebox.showerror("Konfiqurasiya Xətası", f"config.ini faylı tapılmadı və ya 'postgresql' başlığı yoxdur.\nXəta: {e}")
        return None

def db_connect():
    """Parametrləri konfiqurasiya faylından alaraq bazaya qoşulur."""
    db_params = get_db_params() # <--- 2. PARAMETRLƏRİ FUNKSİYADAN ALIN
    if not db_params:
        return None
    try: 
        return psycopg2.connect(**db_params) # <--- 3. PARAMETRLƏRİ BURADA İSTİFADƏ EDİN
    except psycopg2.OperationalError as e: 
        messagebox.showerror("Baza Qoşulma Xətası", f"Verilənlər bazasına qoşulmaq mümkün olmadı:\n{e}")
        return None
# --- SESSİYA (SESSION) FUNKSİYALARI ---
def add_user_session(user_id):
    """Verilən istifadəçi üçün yeni sessiya yaradır və sessiya ID-sini qaytarır."""
    conn = db_connect()
    if not conn: return None
    session_id = uuid.uuid4()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO active_sessions (session_id, user_id) VALUES (%s, %s)", (str(session_id), user_id))
            conn.commit()
        return session_id
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Sessiya yaradılarkən xəta: \n{e}")
        return None
    finally:
        if conn: conn.close()

def remove_user_session(session_id):
    """Verilən sessiyanı silir."""
    if not session_id: return
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM active_sessions WHERE session_id = %s", (str(session_id),))
            conn.commit()
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Sessiya silinərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def get_active_session_counts():
    """Hər bir istifadəçinin aktiv sessiya sayını qaytarır."""
    conn = db_connect()
    if not conn: return {}
    counts = {}
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, COUNT(*) FROM active_sessions GROUP BY user_id")
            for user_id, count in cur.fetchall():
                counts[user_id] = count
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Aktiv sessiyalar alınarkən xəta: \n{e}")
    finally:
        if conn: conn.close()
    return counts

# --- BİLDİRİŞ FUNKSİYALARI ---
def get_unread_notifications_for_user(user_id):
    """Yalnız oxunmamış bildirişlərin SAYINI qaytarır."""
    conn = db_connect()
    if not conn: return 0
    count = 0
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM notifications WHERE recipient_id = %s AND is_read = FALSE", (user_id,))
            result = cur.fetchone()
            if result: count = result[0]
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Bildirişləri sayarkən xəta: \n{e}")
    finally:
        if conn: conn.close()
    return count

def get_all_notifications_for_user(user_id):
    """İstifadəçinin bütün bildirişlərini (oxunmuş və oxunmamış) gətirir."""
    conn = db_connect()
    if not conn: return []
    notifications = []
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT n.id, n.message, n.created_at, n.related_vacation_id, v.employee_id, n.is_read
                FROM notifications n
                LEFT JOIN vacations v ON n.related_vacation_id = v.id
                WHERE n.recipient_id = %s ORDER BY n.created_at DESC
            """, (user_id,))
            notifications = cur.fetchall()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Bildirişləri oxuyarkən xəta: \n{e}")
    finally:
        if conn: conn.close()
    return notifications

def mark_notifications_as_read(notification_ids):
    if not notification_ids: return
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE notifications SET is_read = TRUE WHERE id IN %s", (tuple(notification_ids),))
            conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Bildirişləri yeniləyərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def delete_notifications(notification_ids):
    if not notification_ids: return
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM notifications WHERE id IN %s", (tuple(notification_ids),))
            conn.commit()
            messagebox.showinfo("Uğurlu", f"{len(notification_ids)} bildiriş uğurla silindi.", parent=None)
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Bildirişləri silərkən xəta baş verdi: \n{e}")
    finally:
        if conn: conn.close()

def create_notification(recipient_id, message, related_vacation_id, cursor):
    cursor.execute("INSERT INTO notifications (recipient_id, message, related_vacation_id) VALUES (%s, %s, %s)", (recipient_id, message, related_vacation_id))

# --- İSTİFADƏÇİ (EMPLOYEE) FUNKSİYALARI ---
def get_user_for_login(username):
    """Giriş üçün istifadəçi məlumatlarını və maksimum sessiya sayını gətirir."""
    conn = db_connect()
    if not conn: return None
    user_data = None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, password_hash, role, max_sessions FROM employees WHERE username = %s AND is_active = TRUE", (username,))
            user_data = cur.fetchone()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Giriş zamanı xəta: {e}")
    finally:
        if conn: conn.close()
    return user_data

def create_new_user(name, username, password, role='user', total_days=30, max_sessions=1):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    conn = db_connect()
    if not conn: return False
    success = False
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO employees (name, username, password_hash, role, total_vacation_days, max_sessions) VALUES (%s, %s, %s, %s, %s, %s)",
                (name, username, hashed_password.decode('utf-8'), role, total_days, max_sessions)
            )
        conn.commit()
        success = True
    except psycopg2.IntegrityError: messagebox.showerror("Xəta", "Bu istifadəçi adı artıq mövcuddur.")
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Qeydiyyat zamanı xəta: {e}")
    finally:
        if conn: conn.close()
    return success

def update_employee(emp_id, new_name, days, max_sessions):
    """Maksimum sessiya sayını da yeniləyir."""
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE employees SET name = %s, total_vacation_days = %s, max_sessions = %s WHERE id = %s", (new_name, days, max_sessions, emp_id))
            conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"İşçi məlumatını yeniləyərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def delete_employee(emp_id):
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM employees WHERE id = %s", (emp_id,))
            conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"İşçini silərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def set_user_activity(user_id, new_status):
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE employees SET is_active = %s WHERE id = %s", (new_status, user_id))
            conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Statusu dəyişərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def check_if_name_exists(name):
    conn = db_connect()
    if not conn: return False
    exists = False
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM employees WHERE name = %s", (name,))
            exists = cur.fetchone() is not None
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Ad yoxlanarkən xəta baş verdi:\n{e}")
    finally:
        if conn: conn.close()
    return exists

def load_data_for_user(current_user):
    """Bütün işçilərin məlumatlarını və aktiv sessiya saylarını gətirir."""
    conn = db_connect()
    if not conn: return {}
    data = {}
    active_sessions = get_active_session_counts()
    try:
        with conn.cursor() as cur:
            if current_user['role'].strip() == 'admin':
                cur.execute("SELECT id, name, total_vacation_days, is_active, max_sessions FROM employees ORDER BY name")
            else:
                cur.execute("SELECT id, name, total_vacation_days, is_active, max_sessions FROM employees WHERE id = %s", (current_user['id'],))
            
            employees = cur.fetchall()
            for emp_id, name, total_days, is_active, max_sessions in employees:
                data[name] = {
                    "db_id": emp_id,
                    "umumi_gun": total_days,
                    "is_active": is_active,
                    "max_sessions": max_sessions,
                    "active_session_count": active_sessions.get(emp_id, 0),
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
    except psycopg2.Error as e: messagebox.showerror("Baza Oxuma Xətası", f"Məlumatları oxuyarkən xəta baş verdi:\n{e}")
    finally:
        if conn: conn.close()
    return data

# --- MƏZUNİYYƏT (VACATION) FUNKSİYALARI ---
def _get_admin_ids(cursor):
    cursor.execute("SELECT id FROM employees WHERE role = 'admin'")
    return [row[0] for row in cursor.fetchall()]

def add_vacation(employee_id, employee_name, vac_data, requested_by_role):
    conn = db_connect()
    if not conn: return
    status = 'approved' if requested_by_role == 'admin' else 'pending'
    try:
        with conn.cursor() as cur:
            cur.execute( "INSERT INTO vacations (employee_id, start_date, end_date, note, created_at, status) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (employee_id, vac_data['baslama'], vac_data['bitme'], vac_data['qeyd'], vac_data['yaradilma_tarixi'], status))
            vac_id = cur.fetchone()[0]
            if status == 'pending':
                admin_ids = _get_admin_ids(cur)
                message = f"İşçi '{employee_name}' yeni məzuniyyət sorğusu göndərdi."
                for admin_id in admin_ids: create_notification(admin_id, message, vac_id, cur)
        conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Məzuniyyəti əlavə edərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def update_vacation(vac_id, vac_data, admin_name):
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE vacations SET start_date=%s, end_date=%s, note=%s WHERE id=%s RETURNING employee_id", (vac_data['baslama'], vac_data['bitme'], vac_data['qeyd'], vac_id))
            result = cur.fetchone()
            if result:
                recipient_id = result[0]
                message = f"Admin '{admin_name}' sizin {vac_data['baslama']} tarixli məzuniyyət sorğunuzda dəyişiklik etdi."
                create_notification(recipient_id, message, vac_id, cur)
        conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Məzuniyyəti yeniləyərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def update_vacation_status(vac_id, new_status, admin_name):
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE vacations SET status = %s WHERE id = %s RETURNING employee_id, start_date, end_date", (new_status, vac_id))
            result = cur.fetchone()
            if result:
                recipient_id, start_date, end_date = result
                status_az = "Təsdiqləndi" if new_status == 'approved' else "Rədd edildi"
                message = f"Admin '{admin_name}', sizin {start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')} arası sorğunuzu '{status_az}' statusu ilə yenilədi."
                create_notification(recipient_id, message, vac_id, cur)
        conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Məzuniyyət statusunu dəyişərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def delete_vacation(vac_id, admin_name):
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT employee_id, start_date, end_date FROM vacations WHERE id = %s", (vac_id,))
            result = cur.fetchone()
            if result:
                recipient_id, start_date, end_date = result
                cur.execute("DELETE FROM vacations WHERE id = %s", (vac_id,))
                message = f"Admin '{admin_name}' sizin {start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')} arası sorğunuzu sildi."
                create_notification(recipient_id, message, None, cur)
        conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Məzuniyyəti silərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

def toggle_vacation_activity(vac_id, new_status, admin_name):
    conn = db_connect()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE vacations SET is_inactive = %s WHERE id = %s RETURNING employee_id, start_date, end_date", (new_status, vac_id))
            result = cur.fetchone()
            if result:
                recipient_id, start_date, end_date = result
                status_az = "deaktiv" if new_status else "aktiv"
                message = f"Admin '{admin_name}' sizin {start_date.strftime('%d.%m.%Y')} tarixli təsdiqlənmiş məzuniyyətinizi '{status_az}' etdi."
                create_notification(recipient_id, message, vac_id, cur)
        conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Statusu dəyişərkən xəta: \n{e}")
    finally:
        if conn: conn.close()

# --- ARXİVLƏMƏ FUNKSİYALARI ---
def get_employees_with_archivable_vacations():
    conn = db_connect()
    if not conn: return []
    employees = []
    try:
        with conn.cursor() as cur:
            current_year = date.today().year
            sql = """
                SELECT e.id, e.name, COUNT(v.id) FILTER (WHERE EXTRACT(YEAR FROM v.start_date) < %s AND v.is_archived = FALSE AND v.status = 'approved')
                FROM employees e
                LEFT JOIN vacations v ON e.id = v.employee_id
                WHERE e.is_active = TRUE
                GROUP BY e.id, e.name ORDER BY e.name
            """
            cur.execute(sql, (current_year,))
            employees = cur.fetchall()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Arxiv məlumatı alınarkən xəta: \n{e}")
    finally:
        if conn: conn.close()
    return employees

def start_new_vacation_year(employee_ids, default_days=30):
    if not employee_ids: return False
    conn = db_connect()
    if not conn: return False
    try:
        with conn.cursor() as cur:
            current_year = date.today().year
            ids_tuple = tuple(employee_ids)
            cur.execute("UPDATE vacations SET is_archived = TRUE WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) < %s AND employee_id IN %s", (current_year, ids_tuple))
            archived_count = cur.rowcount
            cur.execute("UPDATE employees SET total_vacation_days = %s WHERE id IN %s", (default_days, ids_tuple))
            updated_employees = cur.rowcount
        conn.commit()
        messagebox.showinfo("Əməliyyat Uğurlu", f"{updated_employees} işçinin məzuniyyət hüququ yeniləndi və {archived_count} köhnə məzuniyyət arxivləşdirildi.")
        return True
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Yeni məzuniyyət ilinə başlarkən xəta: \n{e}")
        conn.rollback()
        return False
    finally:
        if conn: conn.close()

def load_archived_vacations_for_year(employee_id, year):
    conn = db_connect()
    if not conn: return []
    vacations = []
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT id, start_date, end_date, note, is_inactive, created_at, status
                FROM vacations
                WHERE employee_id = %s AND is_archived = TRUE AND EXTRACT(YEAR FROM start_date) = %s
                ORDER BY start_date
            """
            cur.execute(sql, (employee_id, year))
            for vac_id, start, end, note, inactive, created, status in cur.fetchall():
                vacations.append({
                    "db_id": vac_id, "baslama": start.isoformat(), "bitme": end.isoformat(),
                    "qeyd": note, "aktiv_deyil": inactive,
                    "yaradilma_tarixi": created.isoformat(), "status": status
                })
    except psycopg2.Error as e: messagebox.showerror("Baza Oxuma Xətası", f"Arxiv məlumatlarını oxuyarkən xəta baş verdi:\n{e}")
    finally:
        if conn: conn.close()
    return vacations

# --- VERSİYA FUNKSİYASI ---
def get_latest_version():
    conn = db_connect()
    if not conn: return None
    version = None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT latest_version FROM app_version WHERE id = 1")
            result = cur.fetchone()
            if result: version = result[0]
    except psycopg2.Error as e: print(f"Versiya yoxlanarkən xəta: {e}")
    finally:
        if conn: conn.close()
    return version
