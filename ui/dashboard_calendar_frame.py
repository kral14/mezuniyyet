import tkinter as tk
from tkinter import ttk, messagebox
import calendar
from datetime import datetime, date, timedelta
import random
import database
from ui_components import Tooltip

class DashboardCalendarFrame(ttk.Frame):
    def __init__(self, parent, main_app_ref):
        super().__init__(parent)
        self.main_app_ref = main_app_ref
        self.current_user = main_app_ref.current_user
        self.is_admin = self.current_user['role'].strip() == 'admin'
        
        self.current_date = datetime.now()
        self.colors = ["#a0c4ff", "#caffbf", "#fdffb6", "#ffd6a5", "#ffadad", "#bdb2ff", "#9bf6ff", "#ffc6ff"]
        self.employee_colors = {}

        self.create_widgets()
        
    def create_widgets(self):
        notebook = ttk.Notebook(self)
        notebook.pack(expand=True, fill='both')

        dashboard_tab = ttk.Frame(notebook, padding=10)
        notebook.add(dashboard_tab, text='📊 İdarə Paneli')
        self.create_dashboard_widgets(dashboard_tab)
        
        calendar_tab = ttk.Frame(notebook, padding=10)
        notebook.add(calendar_tab, text='🗓️ Ümumi Təqvim')
        self.create_calendar_widgets(calendar_tab)

    def load_data(self):
        """Məlumatları bazadan yükləyir və komponentləri yeniləyir."""
        self.vacations = database.get_all_active_vacations()
        
        unique_employees = sorted(list({vac['employee'] for vac in self.vacations}))
        for i, emp in enumerate(unique_employees):
            self.employee_colors[emp] = self.colors[i % len(self.colors)]
        
        self.update_dashboard_data()
        self.update_calendar()

    def create_dashboard_widgets(self, parent_frame):
        parent_frame.columnconfigure((0, 1, 2), weight=1)
        parent_frame.rowconfigure(0, weight=1)

        self.pending_card = ttk.LabelFrame(parent_frame, text="Gözləyən Sorğular (0)")
        self.pending_card.grid(row=0, column=0, padx=10, pady=10, sticky='nsew')
        
        self.active_users_card = ttk.LabelFrame(parent_frame, text="Aktiv İstifadəçilər (0)")
        self.active_users_card.grid(row=0, column=1, padx=10, pady=10, sticky='nsew')
        
        self.on_vacation_card = ttk.LabelFrame(parent_frame, text="Bu Gün Məzuniyyətdə (0)")
        self.on_vacation_card.grid(row=0, column=2, padx=10, pady=10, sticky='nsew')

    def update_dashboard_data(self):
        # Aktiv istifadəçilər
        active_users = database.get_active_user_details()
        for widget in self.active_users_card.winfo_children(): widget.destroy()
        self.active_users_card.config(text=f"Aktiv İstifadəçilər ({len(active_users)})")
        for user in active_users:
            link = ttk.Label(self.active_users_card, text=f"● {user['name']}", foreground="green", cursor="hand2", anchor="w")
            link.pack(fill='x', padx=10, pady=2)
            link.bind("<Button-1>", lambda e, u=user: self.main_app_ref.show_employee_by_id(u['user_id']))

        # Bu gün məzuniyyətdə olanlar
        today = date.today()
        on_vacation_today = [v for v in self.vacations if v['start_date'] <= today <= v['end_date']]
        for widget in self.on_vacation_card.winfo_children(): widget.destroy()
        self.on_vacation_card.config(text=f"Bu Gün Məzuniyyətdə ({len(on_vacation_today)})")
        for vac in on_vacation_today:
            link = ttk.Label(self.on_vacation_card, text=vac['employee'], foreground="purple", cursor="hand2", anchor="w")
            link.pack(fill='x', padx=10, pady=2)
            link.bind("<Button-1>", lambda e, v=vac: self.main_app_ref.show_employee_by_id(v['employee_id']))

        # Gözləyən sorğular (bunun üçün database-də yeni funksiya lazımdır, hələlik boş qalır)
        # pending_requests = database.get_pending_requests() ...
        
    def create_calendar_widgets(self, parent_frame):
        header_frame = ttk.Frame(parent_frame)
        header_frame.pack(fill='x', pady=(0, 10))
        ttk.Button(header_frame, text="<", command=lambda: self.change_month(-1)).pack(side='left')
        self.month_year_label = ttk.Label(header_frame, text="", font=("Helvetica", 16, "bold"), anchor='center')
        self.month_year_label.pack(side='left', expand=True, fill='x')
        ttk.Button(header_frame, text=">", command=lambda: self.change_month(1)).pack(side='right')

        self.calendar_frame = ttk.Frame(parent_frame)
        self.calendar_frame.pack(expand=True, fill='both')

    def update_calendar(self):
        for widget in self.calendar_frame.winfo_children(): widget.destroy()

        month_names_az = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"]
        self.month_year_label.config(text=f"{month_names_az[self.current_date.month - 1]} {self.current_date.year}")
        
        days_of_week = ["B.e.", "Ç.a.", "Çər.", "C.a.", "Cüm.", "Şən.", "Baz."]
        for i, day in enumerate(days_of_week):
            self.calendar_frame.grid_columnconfigure(i, weight=1)
            ttk.Label(self.calendar_frame, text=day, font=("Helvetica", 10, "bold"), anchor='center', relief='groove', padding=5).grid(row=0, column=i, sticky='nsew', pady=5)
            
        for i in range(1, 7):
            self.calendar_frame.grid_rowconfigure(i, weight=1, uniform="week_row")

        month_calendar = calendar.monthcalendar(self.current_date.year, self.current_date.month)
        for week_num, week in enumerate(month_calendar, 1):
            for day_num_idx, day_val in enumerate(week):
                if day_val == 0: continue
                
                day_date = date(self.current_date.year, self.current_date.month, day_val)
                day_frame = tk.Frame(self.calendar_frame, relief='solid', borderwidth=1, bg='white')
                day_frame.grid(row=week_num, column=day_num_idx, sticky='nsew')
                day_frame.grid_propagate(False)
                
                vacations_on_this_day = [v for v in self.vacations if v['start_date'] <= day_date <= v['end_date']]
                
                day_label = tk.Label(day_frame, text=str(day_val), font=("Helvetica", 10), anchor='ne', padx=3, pady=1)
                day_label.place(relx=1.0, rely=0.0, anchor='ne')
                
                if not vacations_on_this_day:
                    day_label.config(bg='white')
                else:
                    if len(vacations_on_this_day) == 1:
                        vac = vacations_on_this_day[0]
                        is_finished = vac['end_date'] < date.today()
                        color = "#E98585" if is_finished else self.employee_colors.get(vac['employee'], 'lightgray')
                        day_frame.config(bg=color); day_label.config(bg=color)
                        Tooltip(day_frame, vac['employee'])
                        handler = lambda e, v=vac: self.on_day_click(v)
                        day_frame.bind("<Button-1>", handler)
                    else:
                        num_vacations = len(vacations_on_this_day)
                        num_columns = 2 if num_vacations > 4 else 1
                        for i, vac in enumerate(vacations_on_this_day):
                            day_frame.rowconfigure(i // num_columns, weight=1)
                            day_frame.columnconfigure(i % num_columns, weight=1)
                            is_finished = vac['end_date'] < date.today()
                            color = "#E98585" if is_finished else self.employee_colors.get(vac['employee'], 'lightgray')
                            handler = lambda e, v=vac: self.on_day_click(v)
                            indicator_label = tk.Label(day_frame, bg=color)
                            indicator_label.grid(row=i // num_columns, column=i % num_columns, sticky='nsew')
                            indicator_label.bind("<Button-1>", handler)
                            Tooltip(indicator_label, vac['employee'])
                    day_label.lift()

    def on_day_click(self, vacation_info):
        if self.is_admin:
            self.main_app_ref.show_employee_by_id(vacation_info['employee_id'])

    def change_month(self, month_delta):
        self.current_date += timedelta(days=31 * month_delta)
        self.current_date = self.current_date.replace(day=1)
        self.update_calendar()