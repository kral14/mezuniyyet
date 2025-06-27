# auth_windows.py (Yenilənmiş)

import tkinter as tk
from tkinter import ttk, font as tkFont

class LoginFrame(ttk.Frame):
    def __init__(self, parent, login_callback, register_callback, last_username=""):
        super().__init__(parent, padding="20")
        
        self.login_callback = login_callback
        self.register_callback = register_callback

        style = ttk.Style(self)
        style.configure('TFrame', background='white')
        style.configure('TLabel', background='white', font=('Helvetica', 11))
        style.configure('TButton', font=('Helvetica', 10, 'bold'))
        self.configure(style='TFrame')
        
        container = ttk.Frame(self, style='TFrame')
        container.pack(expand=True)
        
        title_font = tkFont.Font(family="Helvetica", size=18, weight="bold")
        ttk.Label(container, text="Sistemə Giriş", font=title_font, foreground="#333").pack(pady=(0, 25))

        self.username = tk.StringVar(value=last_username)
        self.password = tk.StringVar()
        self.remember_me = tk.BooleanVar(value=bool(last_username))

        ttk.Label(container, text="İstifadəçi adı:").pack(padx=10, pady=(10,0), anchor='w')
        username_entry = ttk.Entry(container, textvariable=self.username, width=35, font=('Helvetica', 11))
        username_entry.pack(padx=10, pady=(0,10))
        username_entry.focus()
        
        ttk.Label(container, text="Şifrə:").pack(padx=10, pady=(10,0), anchor='w')
        password_entry = ttk.Entry(container, textvariable=self.password, show="*", width=35, font=('Helvetica', 11))
        password_entry.pack(padx=10, pady=(0,10))

        # --- YENİ ƏLAVƏ: "Enter" düyməsi ilə giriş ---
        # Şifrə xanasında Enter basıldıqda attempt_login funksiyasını çağırır
        password_entry.bind('<Return>', lambda event: self.attempt_login())
        
        ttk.Checkbutton(container, text="Məni xatırla", variable=self.remember_me).pack(pady=10)

        button_frame = ttk.Frame(container, style='TFrame')
        button_frame.pack(pady=15)
        ttk.Button(button_frame, text="Giriş", command=self.attempt_login, width=12).pack(side="left", padx=10)
        ttk.Button(button_frame, text="Qeydiyyat", command=self.register_callback, width=12).pack(side="left", padx=10)

    def attempt_login(self):
        # Callback-ə yalnız lazımi parametrləri ötürürük
        self.login_callback(self.username.get(), self.password.get(), self.remember_me.get())

class RegisterFrame(ttk.Frame):
    def __init__(self, parent, register_callback, back_to_login_callback):
        super().__init__(parent, padding="20")
        self.register_callback = register_callback
        self.back_to_login_callback = back_to_login_callback
        style = ttk.Style(self)
        style.configure('TFrame', background='white')
        style.configure('TLabel', background='white', font=('Helvetica', 11))
        style.configure('TButton', font=('Helvetica', 10, 'bold'))
        self.configure(style='TFrame')
        container = ttk.Frame(self, style='TFrame')
        container.pack(expand=True)
        title_font = tkFont.Font(family="Helvetica", size=18, weight="bold")
        ttk.Label(container, text="Yeni İşçi Qeydiyyatı", font=title_font, foreground="#333").pack(pady=(0, 20))
        self.name = tk.StringVar()
        self.username = tk.StringVar()
        self.password = tk.StringVar()
        self.confirm_password = tk.StringVar()
        form_frame = ttk.Frame(container, style='TFrame')
        form_frame.pack(pady=10)
        ttk.Label(form_frame, text="Ad və Soyad:").grid(row=0, column=0, sticky="w", pady=5, padx=5)
        ttk.Entry(form_frame, textvariable=self.name, width=30, font=('Helvetica', 11)).grid(row=0, column=1, sticky="ew")
        ttk.Label(form_frame, text="İstifadəçi adı:").grid(row=1, column=0, sticky="w", pady=5, padx=5)
        ttk.Entry(form_frame, textvariable=self.username, width=30, font=('Helvetica', 11)).grid(row=1, column=1, sticky="ew")
        ttk.Label(form_frame, text="Şifrə:").grid(row=2, column=0, sticky="w", pady=5, padx=5)
        ttk.Entry(form_frame, textvariable=self.password, show="*", width=30, font=('Helvetica', 11)).grid(row=2, column=1, sticky="ew")
        ttk.Label(form_frame, text="Şifrə (təkrar):").grid(row=3, column=0, sticky="w", pady=5, padx=5)
        ttk.Entry(form_frame, textvariable=self.confirm_password, show="*", width=30, font=('Helvetica', 11)).grid(row=3, column=1, sticky="ew")
        button_frame = ttk.Frame(container, style='TFrame')
        button_frame.pack(pady=20)
        ttk.Button(button_frame, text="Qeydiyyatdan Keç", command=self.attempt_register).pack(side="left", padx=10)
        ttk.Button(button_frame, text="Girişə Qayıt", command=self.back_to_login_callback).pack(side="left")

    def attempt_register(self):
        self.register_callback(self.name.get(), self.username.get(), self.password.get(), self.confirm_password.get())