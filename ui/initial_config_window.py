# ui/initial_config_window.py
import tkinter as tk
from tkinter import ttk, messagebox, Toplevel
from database_setup import setup_database_schema
import psycopg2
import json, os, sys

class InitialDBConfigWindow(Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("İlkin Verilənlər Bazası Qurulumu")
        self.geometry("500x350")
        self.resizable(False, False)
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        self.grab_set()
        self.create_widgets()

    def on_close(self):
        if messagebox.askokcancel("Çıxış", "Qurulum tamamlanmayıb. Proqramdan çıxmaq istədiyinizə əminsiniz?", parent=self):
            self.master.destroy()

    def create_widgets(self):
        main_frame = ttk.Frame(self, padding=15)
        main_frame.pack(fill='both', expand=True)
        ttk.Label(main_frame, text="Proqramın işləməsi üçün ilkin baza məlumatlarını daxil edin.", wraplength=450).pack(pady=(0, 15))
        form_frame = ttk.Frame(main_frame)
        form_frame.pack(fill='x')
        labels = ["Host", "Port", "Baza Adı", "İstifadəçi", "Şifrə", "SSL Rejimi"]
        self.entries = {}
        for i, label_text in enumerate(labels):
            ttk.Label(form_frame, text=label_text + ":").grid(row=i, column=0, sticky='w', pady=4, padx=5)
            if label_text == "SSL Rejimi":
                self.entries[label_text] = ttk.Combobox(form_frame, values=["require", "prefer", "disable"], width=38)
                self.entries[label_text].grid(row=i, column=1, sticky='ew', pady=4)
                self.entries[label_text].set("require")
            else:
                entry = ttk.Entry(form_frame, width=40)
                entry.grid(row=i, column=1, sticky='ew', pady=4)
                self.entries[label_text] = entry
        form_frame.columnconfigure(1, weight=1)
        ttk.Button(main_frame, text="Yoxla və Cədvəlləri Qur", command=self.test_and_setup, style="Accent.TButton").pack(fill='x', pady=(20, 0), ipady=5)

    def get_params(self):
        return {"host": self.entries["Host"].get(), "port": self.entries["Port"].get(), "dbname": self.entries["Baza Adı"].get(), "user": self.entries["İstifadəçi"].get(), "password": self.entries["Şifrə"].get(), "sslmode": self.entries["SSL Rejimi"].get()}

    def test_and_setup(self):
        params = self.get_params()
        if not all(params.get(k) for k in ["host", "port", "dbname", "user"]):
            messagebox.showwarning("Məlumat Çatışmır", "Bütün xanaları doldurun.", parent=self); return
        try:
            conn = psycopg2.connect(**params); conn.close()
        except psycopg2.Error as e:
            messagebox.showerror("Qoşulma Xətası", f"Bazaya qoşulmaq mümkün olmadı:\n{e}", parent=self); return
        if setup_database_schema(params):
            config = {
                "active_company": "İlkin Şirkət",
                "companies": {"İlkin Şirkət": params},
                "last_login_info": {}
            }
            with open("config.json", 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
            messagebox.showinfo("Uğurlu", "Baza uğurla quruldu! Proqram yenidən başladılacaq.", parent=self)
            self.master.destroy()
            python = sys.executable
            os.execl(python, python, *sys.argv)