# ui/employee_form_window.py

import tkinter as tk
from tkinter import ttk, messagebox, Toplevel
import database

class EmployeeFormWindow(Toplevel):
    def __init__(self, parent, refresh_callback, employee_data=None):
        super().__init__(parent)
        self.transient(parent)
        self.grab_set()

        self.refresh_callback = refresh_callback
        self.employee_data = employee_data
        self.is_edit_mode = bool(employee_data)

        self.title("İşçiyə Düzəliş Et" if self.is_edit_mode else "Yeni İşçi Yarat")
        
        frame = ttk.Frame(self, padding="15")
        frame.pack(expand=True, fill="both")

        ttk.Label(frame, text="Ad və Soyad:").grid(row=0, column=0, sticky="w", pady=5)
        self.name_entry = ttk.Entry(frame, width=40)
        self.name_entry.grid(row=0, column=1, pady=5)

        ttk.Label(frame, text="İllik Məzuniyyət Günü:").grid(row=1, column=0, sticky="w", pady=5)
        self.days_entry = ttk.Entry(frame, width=15)
        self.days_entry.grid(row=1, column=1, pady=5, sticky="w")
        
        ttk.Label(frame, text="Maksimum Sessiya Sayı:").grid(row=2, column=0, sticky="w", pady=5)
        self.sessions_entry = ttk.Entry(frame, width=15)
        self.sessions_entry.grid(row=2, column=1, pady=5, sticky="w")

        if self.is_edit_mode:
            self.name_entry.insert(0, self.employee_data.get('name', ''))
            self.days_entry.insert(0, self.employee_data.get('umumi_gun', 30))
            self.sessions_entry.insert(0, self.employee_data.get('max_sessions', 1))
            self.days_entry.focus()
        else:
            self.sessions_entry.insert(0, 1)
            ttk.Label(frame, text="İstifadəçi adı (login):").grid(row=3, column=0, sticky="w", pady=5)
            self.user_entry = ttk.Entry(frame, width=40)
            self.user_entry.grid(row=3, column=1, pady=5)

            ttk.Label(frame, text="Şifrə:").grid(row=4, column=0, sticky="w", pady=5)
            self.pass_entry = ttk.Entry(frame, width=40, show="*")
            self.pass_entry.grid(row=4, column=1, pady=5)
            self.name_entry.focus()
            
        save_button_row = 3 if self.is_edit_mode else 5
        ttk.Button(frame, text="Yadda Saxla", command=self.save).grid(row=save_button_row, column=0, columnspan=2, pady=10)

    def save(self):
        new_name = self.name_entry.get().strip()
        days_str = self.days_entry.get().strip()
        sessions_str = self.sessions_entry.get().strip()

        if not all([new_name, days_str, sessions_str]):
            messagebox.showerror("Xəta", "Bütün xanalar doldurulmalıdır.", parent=self)
            return
        try:
            days = int(days_str)
            max_sessions = int(sessions_str)
        except ValueError:
            messagebox.showerror("Xəta", "Məzuniyyət və sessiya günü rəqəm olmalıdır.", parent=self)
            return

        if self.is_edit_mode:
            old_name = self.employee_data['name']
            if (new_name != old_name) and (database.check_if_name_exists(new_name)):
                messagebox.showerror("Xəta", "Bu adda işçi artıq mövcuddur.", parent=self)
                return
            emp_id = self.employee_data['db_id']
            database.update_employee(emp_id, new_name, days, max_sessions)
            self.refresh_callback(selection_to_keep=new_name)
        else:
            username = self.user_entry.get().strip()
            password = self.pass_entry.get()
            if not username or not password:
                messagebox.showerror("Xəta", "Yeni işçi üçün istifadəçi adı və şifrə mütləqdir.", parent=self)
                return
            if database.create_new_user(new_name, username, password, total_days=days, max_sessions=max_sessions):
                self.refresh_callback(selection_to_keep=new_name)
        
        self.destroy()