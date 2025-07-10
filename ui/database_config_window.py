# ui/database_config_window.py (YENİLƏNMİŞ TAM VERSİYA)
import tkinter as tk
from tkinter import ttk, messagebox, Toplevel, simpledialog
import json
import os
import sys
import bcrypt
import database
from database_setup import setup_database_schema
import psycopg2

CONFIG_FILE = "config.json"

class PasswordPrompt(simpledialog.Dialog):
    def body(self, master):
        self.title("Təsdiq Tələb Olunur");
        ttk.Label(master, text="Əməliyyatı təsdiqləmək üçün admin şifrəsini daxil edin:").pack(padx=10, pady=10)
        self.password_entry = ttk.Entry(master, show="*"); self.password_entry.pack(padx=10, pady=5)
        return self.password_entry
    def apply(self): self.result = self.password_entry.get()

class DatabaseConfigWindow(Toplevel):
    def __init__(self, parent, current_user, logout_callback):
        super().__init__(parent)
        self.title("Verilənlər Bazası Konfiqurasiyası")
        self.geometry("600x520")
        self.transient(parent); self.grab_set()

        self.current_user = current_user
        self.is_setup_mode = self.current_user.get('role') == 'setup'
        self.logout_callback = logout_callback
        style = ttk.Style(self); style.configure("Accent.TButton", foreground="white", background="#007bff")
        
        self.config = self._load_config()
        self.create_widgets()
        self._populate_companies()
        self.on_company_select()
        if not self.is_setup_mode:
            self.set_edit_mode(False)

    def create_widgets(self):
        main_frame = ttk.Frame(self, padding=10); main_frame.pack(fill='both', expand=True)
        # ... (select_frame olduğu kimi qalır) ...
        select_frame = ttk.LabelFrame(main_frame, text="Mövcud Konfiqurasiyalar", padding=10); select_frame.pack(fill='x', pady=(0, 10))
        ttk.Label(select_frame, text="Şirkət:").pack(side='left')
        self.company_combo = ttk.Combobox(select_frame, state="readonly", width=30); self.company_combo.pack(side='left', padx=5, expand=True, fill='x')
        self.company_combo.bind("<<ComboboxSelected>>", self.on_company_select)
        self.set_active_btn = ttk.Button(select_frame, text="Aktiv Et və Yenidən Başlat", command=self.set_active_company); self.set_active_btn.pack(side='left', padx=5)

        form_frame = ttk.LabelFrame(main_frame, text="Konfiqurasiya Detalları", padding=10); form_frame.pack(fill='both', expand=True)
        # "Şirkət Kodu" əlavə olundu
        labels = ["Şirkət Adı", "Şirkət Kodu (Qeydiyyat üçün)", "Host", "Port", "Baza Adı", "İstifadəçi", "Şifrə", "SSL Rejimi"]
        self.entries = {}
        for i, label_text in enumerate(labels):
            ttk.Label(form_frame, text=label_text + ":").grid(row=i, column=0, sticky='w', pady=3, padx=5)
            if label_text == "SSL Rejimi":
                self.entries[label_text] = ttk.Combobox(form_frame, values=["require", "prefer", "disable"], width=38); self.entries[label_text].grid(row=i, column=1, sticky='ew', pady=3)
            else:
                entry = ttk.Entry(form_frame, width=40); entry.grid(row=i, column=1, sticky='ew', pady=3)
                self.entries[label_text] = entry
        form_frame.columnconfigure(1, weight=1)

        button_frame = ttk.Frame(main_frame); button_frame.pack(fill='x', pady=(15, 0))
        self.edit_button = ttk.Button(button_frame, text="Dəyiş", command=lambda: self.set_edit_mode(True)); self.edit_button.pack(side='left')
        self.save_button = ttk.Button(button_frame, text="Yadda Saxla", command=self.save_config); self.save_button.pack(side='left', padx=10)
        self.delete_button = ttk.Button(button_frame, text="Sil", command=self.delete_config); self.delete_button.pack(side='left')
        ttk.Button(button_frame, text="🔥 Cədvəlləri Qur", command=self.setup_schema).pack(side='right')

    def check_admin_password(self):
        if self.is_setup_mode: return True # Qurulum rejimində şifrə yoxlanılmır
        prompt = PasswordPrompt(self); password = prompt.result
        if not password: return False
        user_info = database.get_user_for_login(self.current_user['username'])
        if user_info and bcrypt.checkpw(password.encode('utf-8'), user_info[2].encode('utf-8')): return True
        messagebox.showerror("Xəta", "Şifrə yanlışdır.", parent=self); return False
    
    def set_edit_mode(self, active):
        if active and not self.check_admin_password(): return
        state = "normal" if active else "disabled"
        for key, widget in self.entries.items():
            if isinstance(widget, ttk.Combobox): widget.config(state="readonly" if active else "disabled")
            else: widget.config(state=state)
        self.save_button.config(state=state)
        self.delete_button.config(state=state)
        self.edit_button.config(state="disabled" if active else "normal")

    def _load_config(self):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f: return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError): return {"active_company": "", "companies": {}}

    def _populate_companies(self):
        companies = list(self.config.get("companies", {}).keys())
        self.company_combo['values'] = companies
        active_company = self.config.get("active_company")
        if active_company in companies: self.company_combo.set(active_company)

    def on_company_select(self, event=None):
        company_name = self.company_combo.get()
        params = self.config.get("companies", {}).get(company_name, {})
        for key, widget in self.entries.items():
            field_key = key.lower().replace(' ', '_').replace('(', '').replace(')', '')
            if key == "Şirkət Adı": value = company_name
            elif key == "Şirkət Kodu (Qeydiyyat üçün)": value = params.get("company_code", "")
            else: value = params.get(field_key, "")
            widget.config(state="normal"); widget.delete(0, tk.END); widget.insert(0, str(value)); widget.config(state="disabled")
            if isinstance(widget, ttk.Combobox): widget.set(value); widget.config(state="disabled")
        if not self.is_setup_mode: self.set_edit_mode(False)

    def _get_params_from_form(self):
        return {"company_code": self.entries["Şirkət Kodu (Qeydiyyat üçün)"].get(), "host": self.entries["Host"].get(), "port": self.entries["Port"].get(), "dbname": self.entries["Baza Adı"].get(), "user": self.entries["İstifadəçi"].get(), "password": self.entries["Şifrə"].get(), "sslmode": self.entries["SSL Rejimi"].get()}

    def test_connection(self):
        params = self._get_params_from_form(); del params["company_code"]
        try: conn = psycopg2.connect(**params); conn.close(); messagebox.showinfo("Uğurlu", "Qoşulma uğurludur!", parent=self)
        except psycopg2.Error as e: messagebox.showerror("Xəta", f"Qoşulma uğursuz oldu:\n{e}", parent=self)

    def save_config(self):
        company_name = self.entries["Şirkət Adı"].get().strip()
        if not company_name: messagebox.showerror("Xəta", "Şirkət adı boş ola bilməz.", parent=self); return
        self.config["companies"][company_name] = self._get_params_from_form()
        if not self.config.get("active_company"): self.config["active_company"] = company_name
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(self.config, f, indent=4, ensure_ascii=False)
        messagebox.showinfo("Yadda Saxlandı", f"'{company_name}' konfiqurasiyası yadda saxlandı.", parent=self)
        self._populate_companies(); self.company_combo.set(company_name)
        if not self.is_setup_mode: self.set_edit_mode(False)

    def delete_config(self):
        if not self.check_admin_password(): return
        company_name = self.company_combo.get()
        if not company_name: return
        if company_name == self.config.get("active_company"): messagebox.showerror("Xəta", "Aktiv konfiqurasiyanı silə bilməzsiniz.", parent=self); return
        if messagebox.askyesno("Təsdiq", f"'{company_name}' konfiqurasiyasını silməyə əminsiniz?", parent=self):
            self.config["companies"].pop(company_name, None)
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(self.config, f, indent=4, ensure_ascii=False)
            self._populate_companies(); self.company_combo.set(""); self.on_company_select()

    def set_active_company(self):
        if not self.check_admin_password(): return
        company_name = self.company_combo.get()
        if not company_name: return
        if messagebox.askyesno("Təsdiq", f"'{company_name}' aktiv edilsin? Proqram yenidən başladılacaq.", parent=self):
            self.config["active_company"] = company_name
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(self.config, f, indent=4, ensure_ascii=False)
            self.logout_callback(restart=True)

    def setup_schema(self):
        if not self.check_admin_password(): return
        params = self._get_params_from_form(); del params["company_code"]
        if not all(params.get(k) for k in ["host", "port", "dbname", "user"]): messagebox.showwarning("Məlumat Çatışmır", "Cədvəlləri qurmaq üçün baza məlumatları daxil edilməlidir.", parent=self); return
        if messagebox.askyesno("DİQQƏT", "Bu əməliyyat mövcud cədvəlləri dəyişdirməyəcək, yalnız çatışmayanları yaradacaq. Davam edilsin?", parent=self):
            setup_database_schema(params)