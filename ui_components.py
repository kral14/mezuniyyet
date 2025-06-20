# ui_components.py (Son dərəcə stabil təqvim vidceti ilə)

import tkinter as tk
from tkinter import ttk, Toplevel
from datetime import datetime, date
from tkcalendar import Calendar 

class Tooltip:
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tooltip_window = None
        self.widget.bind("<Enter>", self.show_tooltip)
        self.widget.bind("<Leave>", self.hide_tooltip)
    
    def show_tooltip(self, event):
        if self.tooltip_window or not self.text: return
        x, y, _, _ = self.widget.bbox("insert")
        x += self.widget.winfo_rootx() + 25
        y += self.widget.winfo_rooty() + 25
        self.tooltip_window = Toplevel(self.widget)
        self.tooltip_window.wm_overrideredirect(True)
        self.tooltip_window.wm_geometry(f"+{x}+{y}")
        label = tk.Label(self.tooltip_window, text=self.text, justify='left', background="#ffffe0", relief='solid', borderwidth=1, font=("tahoma", "8", "normal"))
        label.pack(ipadx=1)
    
    def hide_tooltip(self, event):
        if self.tooltip_window:
            self.tooltip_window.destroy()
        self.tooltip_window = None

class CustomDateEntry(ttk.Frame):
    """
    Daha stabil və rahat təqvim təcrübəsi üçün yaradılmış xüsusi vidcet.
    Fokus itməsi problemi yoxdur və ay/il seçimi daha asandır.
    """
    def __init__(self, parent, **kwargs):
        # İstifadəçinin göndərdiyi formatı (məs, dd.mm.Y) emal edirik
        user_pattern = kwargs.pop('date_pattern', 'dd.mm.%Y')
        self.strptime_pattern = user_pattern.replace('dd', '%d').replace('mm', '%m').replace('Y', '%Y').replace('y', '%y')
        self.calendar_pattern = user_pattern.replace('%d', 'dd').replace('%m', 'mm').replace('%Y', 'yyyy').replace('%y', 'yy')
        
        super().__init__(parent)

        self._is_calendar_open = False
        self.date_var = tk.StringVar()
        self.entry = ttk.Entry(self, textvariable=self.date_var, state="readonly", justify='center')
        self.button = ttk.Button(self, text="📅", command=self._open_calendar, width=3)
        
        self.entry.pack(side="left", fill="x", expand=True)
        self.button.pack(side="left", padx=(3, 0))

        self.entry.bind("<Button-1>", self._open_calendar)
        self.button.bind("<Button-1>", self._open_calendar)

    def _open_calendar(self, event=None):
        if self._is_calendar_open:
            return

        self._is_calendar_open = True

        self._calendar_popup = Toplevel(self)
        self._calendar_popup.transient(self)
        self._calendar_popup.overrideredirect(True)

        try:
            current_date = datetime.strptime(self.date_var.get(), self.strptime_pattern)
        except ValueError:
            current_date = date.today()

        self.cal = Calendar(self._calendar_popup, selectmode='day',
                              year=current_date.year, month=current_date.month,
                              day=current_date.day,
                              date_pattern=self.calendar_pattern.lower(),
                              showweeknumbers=False)
        self.cal.pack(fill="both", expand=True)

        x = self.entry.winfo_rootx()
        y = self.entry.winfo_rooty() + self.entry.winfo_height()
        self._calendar_popup.geometry(f'+{x}+{y}')
        
        self.cal.bind("<<CalendarSelected>>", self._on_date_select)
        self._calendar_popup.bind("<FocusOut>", self._on_focus_out)
        self._calendar_popup.bind("<Escape>", lambda e: self._destroy_calendar_popup())
        
        self._calendar_popup.grab_set()

    def _on_focus_out(self, event=None):
        """Təqvimdən kənara kliklədikdə onu bağlayır."""
        self._destroy_calendar_popup()

    def _on_date_select(self, event=None):
        """Tarix seçildikdə dəyəri yeniləyir və təqvimi bağlayır."""
        self.date_var.set(self.cal.get_date())
        self._destroy_calendar_popup()

    def _destroy_calendar_popup(self):
        """Təqvim pəncərəsini təhlükəsiz şəkildə məhv edir."""
        if hasattr(self, '_calendar_popup') and self._calendar_popup.winfo_exists():
            self._calendar_popup.grab_release()
            self._calendar_popup.destroy()
        self._is_calendar_open = False

    def get(self):
        return self.date_var.get()

    def set_date(self, new_date):
        if isinstance(new_date, str):
            try:
                dt_obj = datetime.strptime(new_date, '%Y-%m-%d')
                self.date_var.set(dt_obj.strftime(self.strptime_pattern))
            except ValueError:
                self.date_var.set(new_date)
        elif isinstance(new_date, (date, datetime)):
            self.date_var.set(new_date.strftime(self.strptime_pattern))

def mezuniyyet_muddetini_hesabla(baslama_str, bitme_str):
    try:
        baslama_tarixi = datetime.strptime(baslama_str, '%Y-%m-%d').date()
        bitme_tarixi = datetime.strptime(bitme_str, '%Y-%m-%d').date()
        return (bitme_tarixi - baslama_tarixi).days + 1
    except:
        return 0

def get_vacation_status_and_color(vacation):
    today = date.today()
    status = vacation.get('status', 'approved')
    if status == 'pending': return "#E49B0F", "[Gözləmədə]"
    if status == 'rejected': return "gray", "[Rədd edilib]"
    if status == 'approved':
        try:
            start_dt = datetime.strptime(vacation['baslama'], '%Y-%m-%d').date()
            end_dt = datetime.strptime(vacation['bitme'], '%Y-%m-%d').date()
            if end_dt < today: return "red", "[Bitmiş]"
            elif start_dt <= today <= end_dt: return "green", "[Davam edən]"
            else: return "#007bff", "[Planlaşdırılıb]"
        except: return "black", ""
    return "black", ""
