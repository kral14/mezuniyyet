import psycopg2
from tkinter import messagebox
from .connection import db_connect
from .notification_queries import create_notification, _get_admin_ids

def add_vacation(employee_id, employee_name, vac_data, requested_by_role):
    """Verilənlər bazasına yeni məzuniyyət sorğusu əlavə edir."""
    conn = db_connect()
    if not conn:
        return
        
    status = 'approved' if requested_by_role == 'admin' else 'pending'
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO vacations (employee_id, start_date, end_date, note, created_at, status) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (employee_id, vac_data['baslama'], vac_data['bitme'], vac_data['qeyd'], vac_data['yaradilma_tarixi'], status)
            )
            vac_id = cur.fetchone()[0]
            
            # Əgər sorğunu işçi göndəribsə, adminlərə bildiriş getsin
            if status == 'pending':
                admin_ids = _get_admin_ids(cur)
                message = f"İşçi '{employee_name}' yeni məzuniyyət sorğusu göndərdi."
                for admin_id in admin_ids:
                    create_notification(admin_id, message, vac_id, cur)
            conn.commit()
            
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Məzuniyyət əlavə edilərkən xəta baş verdi:\n{e}")
        conn.rollback()
    finally:
        if conn:
            conn.close()

def update_vacation(vac_id, vac_data, admin_name):
    """Mövcud məzuniyyət sorğusunun tarix və qeydini yeniləyir."""
    conn = db_connect()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE vacations SET start_date=%s, end_date=%s, note=%s WHERE id=%s RETURNING employee_id",
                (vac_data['baslama'], vac_data['bitme'], vac_data['qeyd'], vac_id)
            )
            recipient_id = cur.fetchone()[0]
            
            # Dəyişiklik haqqında işçiyə bildiriş göndər
            message = f"Admin '{admin_name}' sizin {vac_data['baslama']} tarixli məzuniyyət sorğunuzda dəyişiklik etdi."
            create_notification(recipient_id, message, vac_id, cur)
            conn.commit()
            
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Məzuniyyət yenilənərkən xəta baş verdi:\n{e}")
        conn.rollback()
    finally:
        if conn:
            conn.close()

def update_vacation_status(vac_id, new_status, admin_name):
    """Məzuniyyət sorğusunun statusunu (təsdiq/rədd) dəyişir."""
    conn = db_connect()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE vacations SET status = %s WHERE id = %s RETURNING employee_id, start_date, end_date",
                (new_status, vac_id)
            )
            recipient_id, start_date, end_date = cur.fetchone()
            
            status_az = "Təsdiqləndi" if new_status == 'approved' else "Rədd edildi"
            message = f"Admin '{admin_name}', sizin {start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')} arası sorğunuzu '{status_az}' statusu ilə yenilədi."
            create_notification(recipient_id, message, vac_id, cur)
            conn.commit()
            
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Məzuniyyət statusu yenilənərkən xəta baş verdi:\n{e}")
        conn.rollback()
    finally:
        if conn:
            conn.close()

def delete_vacation(vac_id, admin_name):
    """Məzuniyyət sorğusunu tamamilə silir."""
    conn = db_connect()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT employee_id, start_date, end_date FROM vacations WHERE id = %s", (vac_id,))
            result = cur.fetchone()
            if result:
                recipient_id, start_date, end_date = result
                
                # Əvvəlcə sil, sonra bildiriş göndər
                cur.execute("DELETE FROM vacations WHERE id = %s", (vac_id,))
                
                message = f"Admin '{admin_name}' sizin {start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')} arası sorğunuzu sildi."
                # Məzuniyyət silindiyi üçün `related_vacation_id` NULL olacaq
                create_notification(recipient_id, message, None, cur)
            conn.commit()
            
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Məzuniyyət silinərkən xəta baş verdi:\n{e}")
        conn.rollback()
    finally:
        if conn:
            conn.close()

def toggle_vacation_activity(vac_id, new_status, admin_name):
    """Təsdiqlənmiş məzuniyyəti aktiv/deaktiv edir."""
    conn = db_connect()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE vacations SET is_inactive = %s WHERE id = %s RETURNING employee_id, start_date, end_date",
                (new_status, vac_id)
            )
            recipient_id, start_date, end_date = cur.fetchone()
            
            status_az = "deaktiv" if new_status else "aktiv"
            message = f"Admin '{admin_name}' sizin {start_date.strftime('%d.%m.%Y')} tarixli təsdiqlənmiş məzuniyyətinizi '{status_az}' etdi."
            create_notification(recipient_id, message, vac_id, cur)
            conn.commit()
            
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Status dəyişdirilərkən xəta baş verdi:\n{e}")
        conn.rollback()
    finally:
        if conn:
            conn.close()