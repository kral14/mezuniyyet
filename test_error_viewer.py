import tkinter as tk
from tkinter import ttk, messagebox
import calendar
from datetime import datetime, date, timedelta

class Tooltip:
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tooltip_window = None
        # Bind to the widget itself for showing/hiding
        # The '+' ensures this binding doesn't overwrite others
        self.widget.bind("<Enter>", self.show_tooltip, add='+')
        self.widget.bind("<Leave>", self.hide_tooltip, add='+')

    def show_tooltip(self, event):
        if self.tooltip_window or not self.text: return
        x, y, _, _ = self.widget.bbox("insert")
        x += self.widget.winfo_rootx() + 25
        y += self.widget.winfo_rooty() + 25
        self.tooltip_window = tk.Toplevel(self.widget)
        self.tooltip_window.wm_overrideredirect(True)
        self.tooltip_window.wm_geometry(f"+{x}+{y}")
        label = tk.Label(self.tooltip_window, text=self.text, justify='left',
                         background="#ffffe0", relief='solid', borderwidth=1,
                         font=("tahoma", "8", "normal"))
        label.pack(ipadx=1)

    def hide_tooltip(self, event):
        if self.tooltip_window:
            self.tooltip_window.destroy()
        self.tooltip_window = None

class InteractiveDashboardPrototype(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Yekun Dashboard və Təqvim Dizaynı - Prototip")
        self.geometry("1100x700")

        # --- Test üçün genişləndirilmiş saxta məlumatlar ---
        self.pending_requests = [
            {'id': 105, 'employee': 'Nəsib Əliyev'},
            {'id': 106, 'employee': 'Aygün Quliyeva'}
        ]
        self.active_users = [
            {'id': 1, 'employee': 'Tamara Hemidzade'},
            {'id': 2, 'employee': 'Murad Babayev'}
        ]
        self.vacations = [
            {'employee_id': 1, 'employee': 'Tamara Hemidzade', 'start': '2025-07-07', 'end': '2025-07-15'},
            {'employee_id': 2, 'employee': 'Murad Babayev', 'start': '2025-07-21', 'end': '2025-07-25'},
            {'employee_id': 3, 'employee': 'Admin', 'start': '2025-07-01', 'end': '2025-07-01'},
            {'employee_id': 4, 'employee': 'Elnare Quliyeva', 'start': '2025-07-07', 'end': '2025-07-18'},
            {'employee_id': 5, 'employee': 'Nəsib Əliyev', 'start': '2025-07-07', 'end': '2025-07-07'},
            {'employee_id': 6, 'employee': 'Aygün Kazımova', 'start': '2025-07-07', 'end': '2025-07-09'},
            {'employee_id': 7, 'employee': 'Leyla Əliyeva', 'start': '2025-07-07', 'end': '2025-07-07'},
        ]
        
        self.colors = ["#a0c4ff", "#caffbf", "#fdffb6", "#ffd6a5", "#ffadad", "#bdb2ff", "#9bf6ff"]
        self.employee_colors = {}
        unique_employees = sorted(list({vac['employee'] for vac in self.vacations}))
        for i, emp in enumerate(unique_employees):
            self.employee_colors[emp] = self.colors[i % len(self.colors)]

        for vac in self.vacations:
            vac['start_date'] = datetime.strptime(vac['start'], '%Y-%m-%d').date()
            vac['end_date'] = datetime.strptime(vac['end'], '%Y-%m-%d').date()
        
        self.on_vacation_today = [v for v in self.vacations if v['start_date'] <= date.today() <= v['end_date']]

        self.current_date = datetime(2025, 7, 1)

        self.create_widgets()

    def create_widgets(self):
        notebook = ttk.Notebook(self)
        notebook.pack(expand=True, fill='both', padx=10, pady=10)

        dashboard_tab = ttk.Frame(notebook, padding=10)
        notebook.add(dashboard_tab, text='📊 İnteraktiv İdarə Paneli')
        self.create_interactive_dashboard(dashboard_tab)
        
        calendar_tab = ttk.Frame(notebook, padding=10)
        notebook.add(calendar_tab, text='🗓️ Ümumi Təqvim')
        self.create_calendar_widgets(calendar_tab)

    def create_interactive_dashboard(self, parent_frame):
        parent_frame.columnconfigure((0, 1, 2), weight=1)
        parent_frame.rowconfigure(0, weight=1)

        card1 = ttk.LabelFrame(parent_frame, text=f"Gözləyən Sorğular ({len(self.pending_requests)})")
        card1.grid(row=0, column=0, padx=10, pady=10, sticky='nsew')
        for request in self.pending_requests:
            link = ttk.Label(card1, text=request['employee'], foreground="blue", cursor="hand2", anchor="w")
            link.pack(fill='x', padx=10, pady=2)
            link.bind("<Button-1>", lambda e, r=request: self.handle_request_click(r))
            
        card2 = ttk.LabelFrame(parent_frame, text=f"Aktiv İstifadəçilər ({len(self.active_users)})")
        card2.grid(row=0, column=1, padx=10, pady=10, sticky='nsew')
        for user in self.active_users:
            link = ttk.Label(card2, text=f"● {user['employee']}", foreground="green", cursor="hand2", anchor="w")
            link.pack(fill='x', padx=10, pady=2)
            link.bind("<Button-1>", lambda e, u=user: self.handle_user_click(u))
            
        card3 = ttk.LabelFrame(parent_frame, text=f"Bu Gün Məzuniyyətdə ({len(self.on_vacation_today)})")
        card3.grid(row=0, column=2, padx=10, pady=10, sticky='nsew')
        for user in self.on_vacation_today:
            link = ttk.Label(card3, text=user['employee'], foreground="purple", cursor="hand2", anchor="w")
            link.pack(fill='x', padx=10, pady=2)
            link.bind("<Button-1>", lambda e, u=user: self.handle_user_click(u))

    def create_calendar_widgets(self, parent_frame):
        header_frame = ttk.Frame(parent_frame)
        header_frame.pack(fill='x', pady=(0, 10))
        ttk.Button(header_frame, text="<", command=lambda: self.change_month(-1)).pack(side='left')
        self.month_year_label = ttk.Label(header_frame, text="", font=("Helvetica", 16, "bold"), anchor='center')
        self.month_year_label.pack(side='left', expand=True, fill='x')
        ttk.Button(header_frame, text=">", command=lambda: self.change_month(1)).pack(side='right')

        self.calendar_frame = ttk.Frame(parent_frame)
        self.calendar_frame.pack(expand=True, fill='both')
        self.update_calendar()

    def update_calendar(self):
        for widget in self.calendar_frame.winfo_children(): widget.destroy()

        month_names_az = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"]
        self.month_year_label.config(text=f"{month_names_az[self.current_date.month - 1]} {self.current_date.year}")
        
        days_of_week = ["B.e.", "Ç.a.", "Çər.", "C.a.", "Cüm.", "Şən.", "Baz."]
        for i, day in enumerate(days_of_week):
            self.calendar_frame.grid_columnconfigure(i, weight=1)
            ttk.Label(self.calendar_frame, text=day, font=("Helvetica", 10, "bold"), anchor='center', relief='groove', padding=5).grid(row=0, column=i, sticky='nsew', pady=5)
            
        for i in range(1, 8): # We might need 7 rows for weeks
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
                
                # --- DƏYİŞİKLİK BAŞLADI ---

                # 1. Xananın arxa fonunu rənglə (bir rəng və ya grid ilə)
                if len(vacations_on_this_day) == 1:
                    vac = vacations_on_this_day[0]
                    is_finished = vac['end_date'] < date.today()
                    color = "#E98585" if is_finished else self.employee_colors.get(vac['employee'], 'lightgray')
                    day_frame.config(bg=color)
                    Tooltip(day_frame, vac['employee'])
                    day_frame.bind("<Button-1>", lambda e, v=vac: self.on_day_click(v))
                
                elif len(vacations_on_this_day) > 1:
                    num_vacations = len(vacations_on_this_day)
                    if num_vacations <= 2: num_rows, num_cols = num_vacations, 1
                    elif num_vacations <= 4: num_rows, num_cols = 2, 2
                    elif num_vacations <= 6: num_rows, num_cols = 3, 2
                    else: num_rows, num_cols = 3, 3

                    for r in range(num_rows): day_frame.rowconfigure(r, weight=1)
                    for c in range(num_cols): day_frame.columnconfigure(c, weight=1)

                    for i, vac in enumerate(vacations_on_this_day):
                        if i >= num_rows * num_cols: break
                        row, col = i // num_cols, i % num_cols
                        is_finished = vac['end_date'] < date.today()
                        color = "#E98585" if is_finished else self.employee_colors.get(vac['employee'], 'lightgray')
                        handler = lambda e, v=vac: self.on_day_click(v)
                        
                        indicator_frame = tk.Frame(day_frame, bg=color)
                        indicator_frame.grid(row=row, column=col, sticky='nsew')
                        indicator_frame.bind("<Button-1>", handler)
                        Tooltip(indicator_frame, vac['employee'])

                # 2. Günün nömrəsini göstərən label yarat və `place` ilə üstə yerləşdir
                day_label = tk.Label(day_frame, text=str(day_val), font=("Helvetica", 10), padx=3, pady=1)
                day_label.place(relx=1.0, rely=0.0, anchor='ne') # Sağ-üst küncə yerləşdir

                # 3. Label-in arxa fonunu altındakı rəngə uyğunlaşdır
                label_bg_color = day_frame.cget('bg') # İlkin rəngi götür (ağ və ya tək məzuniyyət rəngi)
                vacation_for_label = None # Label-in üstündə olduğu məzuniyyət məlumatı

                if len(vacations_on_this_day) == 1:
                    vacation_for_label = vacations_on_this_day[0]
                elif len(vacations_on_this_day) > 1:
                    num_vacations = len(vacations_on_this_day)
                    if num_vacations <= 2: num_cols = 1
                    elif num_vacations <= 4: num_cols = 2
                    elif num_vacations <= 6: num_cols = 2
                    else: num_cols = 3
                    
                    top_right_cell_index = num_cols - 1
                    if num_vacations > top_right_cell_index:
                        vac = vacations_on_this_day[top_right_cell_index]
                        vacation_for_label = vac
                        is_finished = vac['end_date'] < date.today()
                        label_bg_color = "#E98585" if is_finished else self.employee_colors.get(vac['employee'], 'lightgray')

                day_label.config(bg=label_bg_color)

                # 4. Əgər label rəngli sahənin üstündədirsə, click və tooltip funksiyalarını ona da bağla
                if vacation_for_label:
                    day_label.bind("<Button-1>", lambda e, v=vacation_for_label: self.on_day_click(v))
                    Tooltip(day_label, vacation_for_label['employee'])
                
                # --- DƏYİŞİKLİK BİTDİ ---


    def on_day_click(self, vacation):
        messagebox.showinfo("Təqvim Klikləməsi", f"Seçilən məzuniyyət:\n\nİşçi: {vacation['employee']}\nBaşlanğıc: {vacation['start']}\nBitmə: {vacation['end']}", parent=self)

    def handle_request_click(self, request):
        messagebox.showinfo("Sorğu", f"'{request['employee']}' adlı işçinin sorğusunu təsdiqləmək üçün pəncərə açılacaq.", parent=self)

    def handle_user_click(self, user):
        messagebox.showinfo("Profil", f"'{user['employee']}' adlı işçinin profil səhifəsinə keçid edilir.", parent=self)

    def change_month(self, month_delta):
        current_month = self.current_date.month
        current_year = self.current_date.year
        new_month = current_month + month_delta
        new_year = current_year
        if new_month > 12:
            new_month = 1; new_year += 1
        elif new_month < 1:
            new_month = 12; new_year -= 1
        self.current_date = self.current_date.replace(year=new_year, month=new_month, day=1)
        self.update_calendar()

if __name__ == "__main__":
    app = InteractiveDashboardPrototype()
    app.mainloop()