# ui/dashboard_calendar_frame.py (Yenilənmiş Versiya)

import tkinter as tk
from tkinter import ttk, messagebox
import calendar
from datetime import datetime, date, timedelta
import database
from ui_components import Tooltip

class DashboardCalendarFrame(ttk.Frame):
    def __init__(self, parent, main_app_ref):
        super().__init__(parent)
        self.main_app_ref = main_app_ref
        self.current_user = main_app_ref.current_user
        self.is_admin = self.current_user['role'].strip() == 'admin'
        self.main_font = main_app_ref.main_font
        
        self.current_date = datetime.now()
        self.colors = ["#a0c4ff", "#caffbf", "#fdffb6", "#ffd6a5", "#ffadad", "#bdb2ff", "#9bf6ff", "#ffc6ff"]
        self.employee_colors = {}

        self.create_widgets()
        
    def create_widgets(self):
        # Notebook-u self-də saxlayırıq ki, tabları dəyişə bilək
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(expand=True, fill='both', padx=5, pady=5)

        # Tabları yaradırıq
        self.dashboard_tab = ttk.Frame(self.notebook, padding=10)
        self.calendar_tab = ttk.Frame(self.notebook, padding=10)

        self.notebook.add(self.dashboard_tab, text='📊 İdarə Paneli')
        self.notebook.add(self.calendar_tab, text='🗓️ Ümumi Təqvim')
        
        self.create_dashboard_widgets(self.dashboard_tab)
        self.create_calendar_widgets(self.calendar_tab)

    def load_data(self):
        """Məlumatları bazadan yükləyir və komponentləri yeniləyir."""
        try:
            self.vacations = database.get_all_active_vacations()
            unique_employees = sorted(list({vac['employee'] for vac in self.vacations}))
            for i, emp in enumerate(unique_employees):
                self.employee_colors[emp] = self.colors[i % len(self.colors)]
            
            self.update_dashboard_data()
            self.update_calendar()
        except Exception as e:
            messagebox.showerror("Məlumat Yükləmə Xətası", f"Dashboard məlumatları yüklənərkən xəta baş verdi:\n{e}", parent=self)

    def create_dashboard_widgets(self, parent_frame):
        # Admin üçün 3 sütun, adi istifadəçi üçün 1 sütun
        if self.is_admin:
            parent_frame.columnconfigure((0, 1, 2), weight=1)
            # Admin panellərini yaradırıq
            self.pending_card = ttk.LabelFrame(parent_frame, text="Gözləyən Sorğular (0)")
            self.pending_card.grid(row=0, column=0, padx=10, pady=10, sticky='nsew')
            self.active_users_card = ttk.LabelFrame(parent_frame, text="Aktiv İstifadəçilər (0)")
            self.active_users_card.grid(row=0, column=1, padx=10, pady=10, sticky='nsew')
            self.on_vacation_card = ttk.LabelFrame(parent_frame, text="Bu Gün Məzuniyyətdə (0)")
            self.on_vacation_card.grid(row=0, column=2, padx=10, pady=10, sticky='nsew')
        else:
            parent_frame.columnconfigure(0, weight=1)
            # Adi istifadəçi üçün yalnız bir panel yaradırıq
            self.on_vacation_card = ttk.LabelFrame(parent_frame, text="Bu Gün Məzuniyyətdə (0)")
            self.on_vacation_card.grid(row=0, column=0, padx=10, pady=10, sticky='nsew')
        
        parent_frame.rowconfigure(0, weight=1)

    def update_dashboard_data(self):
        # Adminə məxsus panelləri yalnız admin üçün yeniləyirik
        if self.is_admin:
            active_users = database.get_active_user_details()
            for widget in self.active_users_card.winfo_children(): widget.destroy()
            self.active_users_card.config(text=f"Aktiv İstifadəçilər ({len(active_users)})")
            for user in active_users:
                link = ttk.Label(self.active_users_card, text=f"● {user['name']}", foreground="green", cursor="hand2", anchor="w")
                link.pack(fill='x', padx=10, pady=2)
                link.bind("<Button-1>", lambda e, u=user: self.main_app_ref.show_employee_by_id(u['user_id']))
            # Gözləyən sorğular üçün məntiq (əgər varsa)
            # pending_requests = database.get_pending_requests() ...
            # self.pending_card.config(...)

        # "Bu Gün Məzuniyyətdə" paneli hər kəs üçün yenilənir
        today = date.today()
        on_vacation_today = [v for v in self.vacations if v.get('start_date') and v.get('end_date') and v['start_date'] <= today <= v['end_date']]
        for widget in self.on_vacation_card.winfo_children(): widget.destroy()
        self.on_vacation_card.config(text=f"Bu Gün Məzuniyyətdə ({len(on_vacation_today)})")
        for vac in on_vacation_today:
            link = ttk.Label(self.on_vacation_card, text=vac['employee'], foreground="purple", cursor="hand2", anchor="w")
            link.pack(fill='x', padx=10, pady=2)
            
            # --- KLİK MƏNTİQİ DƏYİŞDİRİLİR ---
            if self.is_admin:
                # Admin kliklədikdə işçinin detallarına getsin
                link.bind("<Button-1>", lambda e, v=vac: self.main_app_ref.show_employee_by_id(v['employee_id']))
            else:
                # Adi istifadəçi kliklədikdə təqvimə getsin
                link.bind("<Button-1>", lambda e, v=vac: self.go_to_vacation_on_calendar(v))

    def go_to_vacation_on_calendar(self, vacation_info):
        """Kliklənən məzuniyyətin tarixinə təqvimi aparır və vərəqi dəyişir."""
        if vacation_info and vacation_info.get('start_date'):
            start_date = vacation_info['start_date']
            # Təqvimin ayını məzuniyyətin başladığı aya dəyişirik
            self.current_date = self.current_date.replace(year=start_date.year, month=start_date.month, day=1)
            self.update_calendar()
            # Notebook-u təqvim vərəqinə keçiririk
            self.notebook.select(self.calendar_tab)

    def create_calendar_widgets(self, parent_frame):
        #... (Bu metod olduğu kimi qalır)
        header_frame = ttk.Frame(parent_frame)
        header_frame.pack(fill='x', pady=(0, 10))
        ttk.Button(header_frame, text="<", command=lambda: self.change_month(-1)).pack(side='left')
        self.month_year_label = ttk.Label(header_frame, text="", font=(self.main_font, 16, "bold"), anchor='center')
        self.month_year_label.pack(side='left', expand=True, fill='x')
        ttk.Button(header_frame, text=">", command=lambda: self.change_month(1)).pack(side='right')

        self.calendar_frame = ttk.Frame(parent_frame)
        self.calendar_frame.pack(expand=True, fill='both')

    def update_calendar(self):
        #... (Bu metod olduğu kimi qalır)
        for widget in self.calendar_frame.winfo_children(): widget.destroy()
        month_names_az = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"]
        self.month_year_label.config(text=f"{month_names_az[self.current_date.month - 1]} {self.current_date.year}")
        days_of_week = ["B.e.", "Ç.a.", "Çər.", "C.a.", "Cüm.", "Şən.", "Baz."]
        for i, day in enumerate(days_of_week):
            self.calendar_frame.grid_columnconfigure(i, weight=1)
            ttk.Label(self.calendar_frame, text=day, font=(self.main_font, 10, "bold"), anchor='center', relief='groove', padding=5).grid(row=0, column=i, sticky='nsew', pady=5)
        for i in range(1, 8): self.calendar_frame.grid_rowconfigure(i, weight=1, uniform="week_row")
        month_calendar = calendar.monthcalendar(self.current_date.year, self.current_date.month)
        today = date.today()
        for week_num, week in enumerate(month_calendar, 1):
            for day_num_idx, day_val in enumerate(week):
                if day_val == 0: continue
                day_date = date(self.current_date.year, self.current_date.month, day_val)
                frame_config = {'relief': 'solid', 'borderwidth': 1}
                is_weekend = day_num_idx >= 5; is_today = (day_date == today)
                if is_today: frame_config.update({'bg': '#e8f0fe', 'highlightbackground': '#007bff', 'highlightthickness': 2})
                elif is_weekend: frame_config['bg'] = '#f5f5f5'
                else: frame_config['bg'] = 'white'
                day_frame = tk.Frame(self.calendar_frame, **frame_config); day_frame.grid(row=week_num, column=day_num_idx, sticky='nsew'); day_frame.grid_propagate(False)
                day_label = tk.Label(day_frame, text=str(day_val), font=(self.main_font, 9), anchor='ne', padx=4, pady=1); day_label.place(relx=1.0, rely=0.0, anchor='ne')
                vacations_on_this_day = [v for v in self.vacations if v.get('start_date') and v.get('end_date') and v['start_date'] <= day_date <= v['end_date']]
                if not vacations_on_this_day: day_label.config(bg=frame_config['bg'])
                else:
                    if len(vacations_on_this_day) == 1:
                        vac = vacations_on_this_day[0]; color = self.employee_colors.get(vac['employee'], 'lightgray')
                        day_frame.config(bg=color); day_label.config(bg=color); Tooltip(day_frame, vac['employee'], font_name=self.main_font)
                        handler = lambda e, v=vac: self.on_day_click(v); day_frame.bind("<Button-1>", handler); day_label.bind("<Button-1>", handler)
                    else:
                        day_label.config(bg=frame_config['bg'])
                        for i, vac in enumerate(vacations_on_this_day):
                            num_columns = 2 if len(vacations_on_this_day) > 4 else 1
                            day_frame.rowconfigure(i // num_columns, weight=1); day_frame.columnconfigure(i % num_columns, weight=1)
                            color = self.employee_colors.get(vac['employee'], 'lightgray'); handler = lambda e, v=vac: self.on_day_click(v)
                            indicator_frame = tk.Frame(day_frame, bg=color); indicator_frame.grid(row=i // num_columns, column=i % num_columns, sticky='nsew', padx=0.5, pady=0.5)
                            indicator_frame.bind("<Button-1>", handler); Tooltip(indicator_frame, vac['employee'], font_name=self.main_font)
                        day_label.lift()

    def on_day_click(self, vacation_info):
        # Bu metod da rol yoxlamasına görə fərqli işləyə bilər
        if self.is_admin and vacation_info.get('employee_id'):
            self.main_app_ref.show_employee_by_id(vacation_info['employee_id'])
        else:
            # Adi istifadəçi təqvimdəki günə basarsa heç nə olmasın və ya sadəcə məlumat göstərilsin
            pass

    def change_month(self, month_delta):
        #... (Bu metod olduğu kimi qalır)
        current_year, current_month = self.current_date.year, self.current_date.month
        new_month = current_month + month_delta; new_year = current_year
        if new_month > 12: new_month = 1; new_year += 1
        elif new_month < 1: new_month = 12; new_year -= 1
        self.current_date = self.current_date.replace(year=new_year, month=new_month, day=1)
        self.update_calendar()