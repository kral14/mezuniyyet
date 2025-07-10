# test_db_config_window.py

import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
from database_setup import setup_database_schema
import psycopg2

CONFIG_FILE = "config.json"

class DatabaseConfigWindow(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("Verilənlər Bazası Konfiqurasiyası")
        self.geometry("600x450")
        self.transient(parent)
        self.grab_set()

        # Accent stilini təyin edək
        style = ttk.Style(self)
        style.configure("Accent.TButton", foreground="white", background="#007bff")

        self.config = self._load_config()
        self.create_widgets()
        self._populate_companies()
        self.on_company_select()

    def create_widgets(self):
        main_frame = ttk.Frame(self, padding=10)
        main_frame.pack(fill='both', expand=True)

        select_frame = ttk.LabelFrame(main_frame, text="Mövcud Konfiqurasiyalar", padding=10)
        select_frame.pack(fill='x', pady=(0, 10))
        
        ttk.Label(select_frame, text="Şirkət:").pack(side='left')
        self.company_combo = ttk.Combobox(select_frame, state="readonly", width=30)
        self.company_combo.pack(side='left', padx=5, expand=True, fill='x')
        self.company_combo.bind("<<ComboboxSelected>>", self.on_company_select)
        
        self.set_active_btn = ttk.Button(select_frame, text="Aktiv Et və Yenidən Başlat", command=self.set_active_company)
        self.set_active_btn.pack(side='left', padx=5)

        form_frame = ttk.LabelFrame(main_frame, text="Konfiqurasiya Detalları", padding=10)
        form_frame.pack(fill='both', expand=True)

        labels = ["Şirkət Adı", "Host", "Port", "Baza Adı", "İstifadəçi", "Şifrə", "SSL Rejimi"]
        self.entries = {}
        for i, label_text in enumerate(labels):
            ttk.Label(form_frame, text=label_text + ":").grid(row=i, column=0, sticky='w', pady=2, padx=5)
            if label_text == "SSL Rejimi":
                self.entries[label_text] = ttk.Combobox(form_frame, values=["require", "prefer", "disable"], width=38)
                self.entries[label_text].grid(row=i, column=1, sticky='ew', pady=2)
            else:
                entry = ttk.Entry(form_frame, width=40)
                entry.grid(row=i, column=1, sticky='ew', pady=2)
                self.entries[label_text] = entry
        form_frame.columnconfigure(1, weight=1)

        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill='x', pady=(10, 0))

        ttk.Button(button_frame, text="Yoxla", command=self.test_connection).pack(side='left')
        ttk.Button(button_frame, text="Yadda Saxla", command=self.save_config).pack(side='left', padx=10)
        ttk.Button(button_frame, text="Sil", command=self.delete_config).pack(side='left')
        ttk.Button(button_frame, text="🔥 Cədvəlləri Qur", command=self.setup_schema, style="Accent.TButton").pack(side='right')

    def _load_config(self):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                # Əgər əsas açarlar yoxdursa, onları əlavə et
                config.setdefault("active_company", "")
                config.setdefault("companies", {})
                return config
        except (FileNotFoundError, json.JSONDecodeError):
            return {"active_company": "", "companies": {}}
    def _populate_companies(self):
        companies = list(self.config.get("companies", {}).keys())
        self.company_combo['values'] = companies
        active_company = self.config.get("active_company")
        if active_company in companies: self.company_combo.set(active_company)

    def on_company_select(self, event=None):
        company_name = self.company_combo.get()
        params = self.config.get("companies", {}).get(company_name, {})
        
        self.entries["Şirkət Adı"].delete(0, tk.END); self.entries["Şirkət Adı"].insert(0, company_name)
        self.entries["Host"].delete(0, tk.END); self.entries["Host"].insert(0, params.get("host", ""))
        self.entries["Port"].delete(0, tk.END); self.entries["Port"].insert(0, params.get("port", "5432"))
        self.entries["Baza Adı"].delete(0, tk.END); self.entries["Baza Adı"].insert(0, params.get("dbname", ""))
        self.entries["İstifadəçi"].delete(0, tk.END); self.entries["İstifadəçi"].insert(0, params.get("user", ""))
        self.entries["Şifrə"].delete(0, tk.END); self.entries["Şifrə"].insert(0, params.get("password", ""))
        self.entries["SSL Rejimi"].set(params.get("sslmode", "require"))

    def _get_params_from_form(self):
        return {"host": self.entries["Host"].get(), "port": self.entries["Port"].get(), "dbname": self.entries["Baza Adı"].get(), "user": self.entries["İstifadəçi"].get(), "password": self.entries["Şifrə"].get(), "sslmode": self.entries["SSL Rejimi"].get()}

    def test_connection(self):
        params = self._get_params_from_form()
        try:
            conn = psycopg2.connect(**params); conn.close()
            messagebox.showinfo("Uğurlu", "Qoşulma uğurludur!", parent=self)
        except psycopg2.Error as e:
            messagebox.showerror("Xəta", f"Qoşulma uğursuz oldu:\n{e}", parent=self)

    def save_config(self):
        company_name = self.entries["Şirkət Adı"].get().strip()
        if not company_name:
            messagebox.showerror("Xəta", "Şirkət adı boş ola bilməz.", parent=self)
            return

        # Əgər "companies" açarı yoxdursa, onu yarat
        if "companies" not in self.config:
            self.config["companies"] = {}
            
        self.config["companies"][company_name] = self._get_params_from_form()
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=4, ensure_ascii=False)
        
        messagebox.showinfo("Yadda Saxlandı", f"'{company_name}' konfiqurasiyası yadda saxlandı.", parent=self)
        self._populate_companies()
        self.company_combo.set(company_name)
    def delete_config(self):
        company_name = self.company_combo.get()
        if not company_name: return
        if company_name == self.config.get("active_company"): messagebox.showerror("Xəta", "Aktiv konfiqurasiyanı silə bilməzsiniz.", parent=self); return
        if messagebox.askyesno("Təsdiq", f"'{company_name}' konfiqurasiyasını silməyə əminsiniz?", parent=self):
            self.config["companies"].pop(company_name, None)
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(self.config, f, indent=4, ensure_ascii=False)
            self._populate_companies(); self.company_combo.set(""); self.on_company_select()

    def set_active_company(self):
        company_name = self.company_combo.get()
        if not company_name: return
        if messagebox.askyesno("Təsdiq", f"'{company_name}' aktiv edilsin? Proqram yenidən başladılacaq.", parent=self):
            self.config["active_company"] = company_name
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(self.config, f, indent=4, ensure_ascii=False)
            messagebox.showinfo("Yenidən Başlatma", "Dəyişikliklərin qüvvəyə minməsi üçün proqramı bağlayıb yenidən açın.", parent=self)
            self.destroy()

    def setup_schema(self):
        params = self._get_params_from_form()
        if not all(params.get(k) for k in ["host", "port", "dbname", "user"]): messagebox.showwarning("Məlumat Çatışmır", "Cədvəlləri qurmaq üçün baza məlumatları daxil edilməlidir.", parent=self); return
        if messagebox.askyesno("DİQQƏT", "Bu əməliyyat mövcud cədvəlləri dəyişdirməyəcək, yalnız çatışmayanları yaradacaq. Davam edilsin?", parent=self):
            setup_database_schema(params)

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Test Ana Pəncərə")
    root.geometry("300x150")

    def open_config_window():
        DatabaseConfigWindow(root)

    ttk.Button(root, text="Baza Konfiqurasiyasını Aç", command=open_config_window).pack(expand=True, padx=20, pady=20)
    root.mainloop()