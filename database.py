# database.py (Arxiv məntiqi ilə tam kod)

import psycopg2
import bcrypt
from tkinter import messagebox
from datetime import date

# ... (db_connect və digər yuxarıdakı funksiyalar olduğu kimi qalır) ...
DB_PARAMS = { "dbname": "neondb", "user": "neondb_owner", "password": "npg_RXHDsJQeL08a", "host": "ep-yellow-lake-a9ooylj6-pooler.gwc.azure.neon.tech", "port": "5432", "sslmode": "require" }
def db_connect():
    try: return psycopg2.connect(**DB_PARAMS)
    except psycopg2.OperationalError as e: messagebox.showerror("Baza Qoşulma Xətası", f"Verilənlər bazasına qoşulmaq mümkün olmadı:\n{e}"); return None
def get_user_for_login(username):
    conn = db_connect();
    if not conn: return None
    user_data = None
    try:
        with conn.cursor() as cur: cur.execute("SELECT id, name, password_hash, role FROM employees WHERE username = %s AND is_active = TRUE", (username,)); user_data = cur.fetchone()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Giriş zamanı xəta: {e}")
    finally:
        if conn: conn.close()
    return user_data
def get_user_by_id(user_id):
    conn = db_connect();
    if not conn: return None
    user_data = None
    try:
        with conn.cursor() as cur: cur.execute("SELECT id, name, password_hash, role FROM employees WHERE id = %s AND is_active = TRUE", (user_id,)); user_data = cur.fetchone()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"İstifadəçi məlumatı alınarkən xəta: {e}")
    finally:
        if conn: conn.close()
    return user_data
def create_new_user(name, username, password, role='user', total_days=30):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    conn = db_connect();
    if not conn: return False
    success = False
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO employees (name, username, password_hash, role, total_vacation_days) VALUES (%s, %s, %s, %s, %s)", (name, username, hashed_password.decode('utf-8'), role, total_days))
        conn.commit(); success = True
    except psycopg2.IntegrityError: messagebox.showerror("Xəta", "Bu istifadəçi adı artıq mövcuddur.")
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Qeydiyyat zamanı xəta: {e}")
    finally:
        if conn: conn.close()
    return success
def _get_admin_ids(cursor):
    cursor.execute("SELECT id FROM employees WHERE role = 'admin'")
    return [row[0] for row in cursor.fetchall()]
def update_employee(emp_id, new_name, days):
    conn = db_connect();
    if not conn: return
    try:
        with conn.cursor() as cur: cur.execute("UPDATE employees SET name = %s, total_vacation_days = %s WHERE id = %s", (new_name, days, emp_id)); conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"İşçi məlumatını yeniləyərkən xəta: \n{e}")
    finally:
        if conn: conn.close()
def delete_employee(emp_id):
    conn = db_connect();
    if not conn: return
    try:
        with conn.cursor() as cur: cur.execute("DELETE FROM employees WHERE id = %s", (emp_id,)); conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"İşçini silərkən xəta: \n{e}")
    finally:
        if conn: conn.close()
def set_user_activity(user_id, new_status):
    conn = db_connect();
    if not conn: return
    try:
        with conn.cursor() as cur: cur.execute("UPDATE employees SET is_active = %s WHERE id = %s", (new_status, user_id)); conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Statusu dəyişərkən xəta: \n{e}")
    finally:
        if conn: conn.close()
def check_if_name_exists(name):
    conn = db_connect();
    if not conn: return False
    exists = False
    try:
        with conn.cursor() as cur: cur.execute("SELECT 1 FROM employees WHERE name = %s", (name,)); exists = cur.fetchone() is not None
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Ad yoxlanarkən xəta baş verdi:\n{e}")
    finally:
        if conn: conn.close()
    return exists
def add_vacation(employee_id, employee_name, vac_data, requested_by_role):
    conn = db_connect();
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
    conn = db_connect();
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
    conn = db_connect();
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
    conn = db_connect();
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
    conn = db_connect();
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
def start_new_vacation_year(default_days=30):
    print("\n--- 'Yeni Məzuniyyət İli Başlat' əməliyyatı başladı ---")
    conn = db_connect()
    if not conn: print("LOG: Baza ilə əlaqə qurula bilmədi. Əməliyyat dayandırıldı."); return False
    try:
        with conn.cursor() as cur:
            current_year = date.today().year
            print(f"LOG: Cari il {current_year} olaraq təyin edildi.")
            print(f"LOG: {current_year}-ci ildən əvvəlki təsdiqlənmiş məzuniyyətlər arxivləşdirilir...")
            cur.execute("UPDATE vacations SET is_archived = TRUE WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) < %s", (current_year,))
            archived_count = cur.rowcount
            print(f"LOG: {archived_count} məzuniyyət arxivlənmək üçün işarələndi.")
            print(f"LOG: Bütün işçilərin illik məzuniyyət hüququ {default_days} gün olaraq yenilənir...")
            cur.execute("UPDATE employees SET total_vacation_days = %s", (default_days,))
            updated_employees = cur.rowcount
            print(f"LOG: {updated_employees} işçinin məzuniyyət hüququ yeniləndi.")
        conn.commit()
        print("LOG: Bütün dəyişikliklər verilənlər bazasında təsdiqləndi (COMMIT).")
        messagebox.showinfo("Əməliyyat Uğurlu", f"{archived_count} köhnə məzuniyyət arxivləşdirildi.\n{updated_employees} işçinin məzuniyyət hüququ yeniləndi.")
        return True
    except psycopg2.Error as e:
        print(f"XƏTA: Baza əməliyyatı zamanı xəta baş verdi: {e}")
        messagebox.showerror("Baza Xətası", f"Yeni məzuniyyət ilinə başlarkən xəta: \n{e}")
        conn.rollback()
        return False
    finally:
        if conn: conn.close()
        print("--- 'Yeni Məzuniyyət İli Başlat' əməliyyatı başa çatdı ---")
def create_notification(recipient_id, message, related_vacation_id, cursor):
    cursor.execute("INSERT INTO notifications (recipient_id, message, related_vacation_id) VALUES (%s, %s, %s)", (recipient_id, message, related_vacation_id))
def get_unread_notifications_for_user(user_id):
    conn = db_connect();
    if not conn: return []
    notifications = []
    try:
        with conn.cursor() as cur: cur.execute("SELECT id, message, created_at FROM notifications WHERE recipient_id = %s AND is_read = FALSE ORDER BY created_at DESC", (user_id,)); notifications = cur.fetchall()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Bildirişləri oxuyarkən xəta: \n{e}")
    finally:
        if conn: conn.close()
    return notifications
def mark_notifications_as_read(notification_ids):
    if not notification_ids: return
    conn = db_connect();
    if not conn: return
    try:
        with conn.cursor() as cur: cur.execute("UPDATE notifications SET is_read = TRUE WHERE id IN %s", (tuple(notification_ids),)); conn.commit()
    except psycopg2.Error as e: messagebox.showerror("Baza Xətası", f"Bildirişləri yeniləyərkən xəta: \n{e}")
    finally:
        if conn: conn.close()
def get_latest_version():
    conn = db_connect();
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

# === YENİ FUNKSİYALAR ===
def get_available_archive_years(employee_id):
    """İşçinin arxivlənmiş məzuniyyətlərinin olduğu illəri gətirir."""
    conn = db_connect()
    if not conn: return []
    years = []
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT EXTRACT(YEAR FROM start_date)::INTEGER FROM vacations WHERE employee_id = %s AND is_archived = TRUE ORDER BY 1 DESC",
                (employee_id,)
            )
            years = [row[0] for row in cur.fetchall()]
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Arxiv illəri alınarkən xəta: \n{e}")
    finally:
        if conn: conn.close()
    return years

def load_archived_vacations_for_employee(employee_id, year):
    """İşçinin müəyyən bir ilə aid arxivlənmiş məzuniyyətlərini yükləyir."""
    conn = db_connect()
    if not conn: return []
    vacations = []
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, employee_id, start_date, end_date, note, is_inactive, created_at, status FROM vacations WHERE employee_id = %s AND EXTRACT(YEAR FROM start_date) = %s AND is_archived = TRUE ORDER BY start_date",
                (employee_id, year)
            )
            # Məlumatları lüğət formatına çeviririk
            for row in cur.fetchall():
                vac_id, emp_id, start, end, note, inactive, created, status = row
                vacations.append({
                    "db_id": vac_id, "baslama": start.isoformat(), "bitme": end.isoformat(),
                    "qeyd": note, "aktiv_deyil": inactive,
                    "yaradilma_tarixi": created.isoformat(), "status": status
                })
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Arxiv məlumatı oxunarkən xəta: \n{e}")
    finally:
        if conn: conn.close()
    return vacations

# --- Məlumat Yükləmə Funksiyası ---
def load_data_for_user(current_user):
    conn = db_connect();
    if not conn: return {}
    data = {}
    try:
        with conn.cursor() as cur:
            if current_user['role'].strip() == 'admin':
                cur.execute("SELECT id, name, total_vacation_days, is_active FROM employees WHERE id != %s ORDER BY name", (current_user['id'],))
            else:
                cur.execute("SELECT id, name, total_vacation_days, is_active FROM employees WHERE id = %s", (current_user['id'],))
            employees = cur.fetchall()
            for emp_id, name, total_days, is_active in employees:
                data[name] = {"db_id": emp_id, "umumi_gun": total_days, "is_active": is_active, "goturulen_icazeler": []}
            if current_user['role'].strip() == 'admin':
                cur.execute("SELECT id, employee_id, start_date, end_date, note, is_inactive, created_at, status FROM vacations WHERE is_archived = FALSE ORDER BY start_date")
            else:
                cur.execute("SELECT id, employee_id, start_date, end_date, note, is_inactive, created_at, status FROM vacations WHERE employee_id = %s AND is_archived = FALSE ORDER BY start_date", (current_user['id'],))
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
# database.py faylına əlavə olunacaq yeni funksiya

def load_archived_vacations_for_year(employee_id, year):
    """Verilmiş işçi və il üçün arxivlənmiş məzuniyyətləri gətirir."""
    conn = db_connect()
    if not conn: return []
    vacations = []
    try:
        with conn.cursor() as cur:
            # Yalnız arxivlənmiş (is_archived = TRUE) və konkret ilə aid məzuniyyətləri seçirik
            sql = """
                SELECT id, employee_id, start_date, end_date, note, is_inactive, created_at, status
                FROM vacations
                WHERE employee_id = %s
                  AND is_archived = TRUE
                  AND EXTRACT(YEAR FROM start_date) = %s
                ORDER BY start_date
            """
            cur.execute(sql, (employee_id, year))
            
            # Məlumatları lüğət formatına çeviririk
            for vac_id, emp_id, start, end, note, inactive, created, status in cur.fetchall():
                vacations.append({
                    "db_id": vac_id,
                    "baslama": start.isoformat(),
                    "bitme": end.isoformat(),
                    "qeyd": note,
                    "aktiv_deyil": inactive,
                    "yaradilma_tarixi": created.isoformat(),
                    "status": status
                })
    except psycopg2.Error as e:
        messagebox.showerror("Baza Oxuma Xətası", f"Arxiv məlumatlarını oxuyarkən xəta baş verdi:\n{e}")
    finally:
        if conn: conn.close()
    return vacations