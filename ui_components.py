# ui_components.py (Yekun Düzəliş Edilmiş Versiya)

import tkinter as tk
from tkinter import ttk, Toplevel
from datetime import datetime, date, timedelta
import calendar

class Tooltip:
    def __init__(self, widget, text, font_name="Segoe UI"):
        self.widget = widget
        self.text = text
        self.tooltip_window = None
        self.font_name = font_name
        self.widget.bind("<Enter>", self.show_tooltip, add='+')
        self.widget.bind("<Leave>", self.hide_tooltip, add='+')
        
    def show_tooltip(self, event):
        if self.tooltip_window or not self.text: return
        x, y, _, _ = self.widget.bbox("insert")
        x += self.widget.winfo_rootx() + 25
        y += self.widget.winfo_rooty() + 25
        self.tooltip_window = Toplevel(self.widget)
        self.tooltip_window.wm_overrideredirect(True)
        self.tooltip_window.wm_geometry(f"+{x}+{y}")
        label = tk.Label(self.tooltip_window, text=self.text, justify='left', 
                         background="#ffffe0", relief='solid', borderwidth=1, 
                         font=(self.font_name, 8, "normal"))
        label.pack(ipadx=1)

    def hide_tooltip(self, event):
        if self.tooltip_window:
            self.tooltip_window.destroy()
        self.tooltip_window = None


class CustomDateEntry(ttk.Frame):
    def __init__(self, parent, date_pattern='dd.mm.yyyy', font_name="Segoe UI", **kwargs):
        # DÜZƏLİŞ: `font_name` kwargs-dan çıxarılır ki, super().__init__-ə ötürülməsin
        if 'font_name' in kwargs:
            del kwargs['font_name']

        super().__init__(parent, **kwargs)
        
        self.main_font = font_name
        self.date_var = tk.StringVar()
        self.strftime_pattern = date_pattern.replace('dd', '%d').replace('mm', '%m').replace('yyyy', '%Y')
        self._calendar_win = None

        self.entry = ttk.Entry(self, textvariable=self.date_var, state="readonly", justify='center', width=18, cursor="hand2", font=(self.main_font, 9))
        self.button = ttk.Button(self, text="📅", command=self._open_calendar, width=3)
        
        self.entry.pack(side="left", fill="x", expand=True)
        self.button.pack(side="left", padx=(2,0))
        
        self.entry.bind("<Button-1>", self._open_calendar)
        
        self.set_date(date.today())

    def _open_calendar(self, event=None):
        if self._calendar_win and self._calendar_win.winfo_exists():
            return

        win = Toplevel(self)
        self._calendar_win = win
        win.transient(self)
        win.grab_set()
        win.resizable(False, False)
        win.title("Tarix Seçin")

        style = ttk.Style(win)
        style.configure("Today.TButton", font=(self.main_font, 9, "bold"), foreground="#007bff")
        style.configure("Weekend.TButton", foreground="red")
        style.configure("Weekday.TLabel", foreground="gray", font=(self.main_font, 9))

        main_frame = ttk.Frame(win, style="Card.TFrame", relief="solid", borderwidth=1)
        main_frame.pack(padx=1, pady=1)

        try:
            initial_date = datetime.strptime(self.date_var.get(), self.strftime_pattern).date()
        except (ValueError, TypeError):
            initial_date = date.today()

        state = {'view_date': initial_date}

        def close_calendar(event=None):
            if self._calendar_win and self._calendar_win.winfo_exists():
                self._calendar_win.grab_release()
                self._calendar_win.destroy()
                self._calendar_win = None

        def update_calendar_display():
            view_date = state['view_date']
            today = date.today()
            month_names = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"]
            month_name = month_names[view_date.month - 1]
            month_year_label.config(text=f"{month_name} {view_date.year}")
            
            for w in body_frame.winfo_children(): w.destroy()
            
            weekdays = ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən', 'Baz']
            for i, day in enumerate(weekdays):
                ttk.Label(body_frame, text=day, width=4, anchor='center', style="Weekday.TLabel").grid(row=0, column=i, pady=(0,5))
            
            cal = calendar.monthcalendar(view_date.year, view_date.month)
            for r, week in enumerate(cal, 1):
                for c, day_num in enumerate(week):
                    if day_num != 0:
                        btn = ttk.Button(body_frame, text=str(day_num), width=4)
                        is_today = (view_date.year == today.year and view_date.month == today.month and day_num == today.day)
                        is_weekend = c >= 5 
                        if is_today: btn.config(style="Today.TButton")
                        elif is_weekend: btn.config(style="Weekend.TButton")
                        btn.grid(row=r, column=c, padx=1, pady=1)
                        btn.configure(command=lambda d=day_num: select_date(d))

        def change_month(delta):
            old_date = state['view_date']
            new_month_date = old_date + timedelta(days=delta * 31)
            state['view_date'] = new_month_date.replace(day=1)
            update_calendar_display()

        def select_date(day):
            selected = state['view_date'].replace(day=day)
            self.date_var.set(selected.strftime(self.strftime_pattern))
            close_calendar()

        header_frame = ttk.Frame(main_frame)
        header_frame.pack(pady=5, padx=5, fill='x')
        ttk.Button(header_frame, text="<", width=3, command=lambda: change_month(-1)).pack(side='left')
        month_year_label = ttk.Label(header_frame, width=18, anchor='center', font=(self.main_font, 10, "bold"))
        month_year_label.pack(side='left', expand=True, fill='x')
        ttk.Button(header_frame, text=">", width=3, command=lambda: change_month(1)).pack(side='left')
        body_frame = ttk.Frame(main_frame)
        body_frame.pack(padx=10, pady=(0, 10))
        update_calendar_display()
        
        win.bind("<Escape>", close_calendar)
        win.protocol("WM_DELETE_WINDOW", close_calendar)

        win.update_idletasks()
        main_app_win = self.winfo_toplevel()
        x = self.winfo_x() + main_app_win.winfo_x()
        y = self.winfo_y() + main_app_win.winfo_y() + self.entry.winfo_height()
        win.geometry(f'+{x}+{y}')

    def get_date(self):
        try: return datetime.strptime(self.date_var.get(), self.strftime_pattern).date()
        except (ValueError, TypeError): return None

    def set_date(self, new_date):
        if isinstance(new_date, (date, datetime)): self.date_var.set(new_date.strftime(self.strftime_pattern))
        elif isinstance(new_date, str): self.date_var.set(new_date)

def mezuniyyet_muddetini_hesabla(baslama_str, bitme_str):
    try:
        baslama_tarixi = datetime.strptime(baslama_str, '%Y-%m-%d').date()
        bitme_tarixi = datetime.strptime(bitme_str, '%Y-%m-%d').date()
        return (bitme_tarixi - baslama_tarixi).days + 1
    except (ValueError, TypeError): return 0

def get_vacation_status_and_color(vacation):
    today = date.today()
    status = vacation.get('status', 'approved')
    if status == 'pending': return "#E49B0F", "[Gözləyir]"
    if status == 'rejected': return "gray", "[Rədd edilib]"
    if status == 'approved':
        try:
            start_dt = datetime.strptime(vacation['baslama'], '%Y-%m-%d').date()
            end_dt = datetime.strptime(vacation['bitme'], '%Y-%m-%d').date()
            if end_dt < today: return "red", "[Bitmiş]"
            elif start_dt <= today <= end_dt: return "green", "[Davam edən]"
            else: return "#007bff", "[Planlaşdırılıb]"
        except (ValueError, TypeError): return "black", ""
    return "black", ""