# ui/main_frame.py (BÜTÜN METODLAR SİNİFİN İÇİNDƏ - YEKUN VERSİYA)

import tkinter as tk
from tkinter import ttk, messagebox, Toplevel
from datetime import datetime, date

# Komponentlərin import edilməsi
from ui_components import mezuniyyet_muddetini_hesabla, CustomDateEntry
from .dashboard_calendar_frame import DashboardCalendarFrame
from .employee_detail_frame import EmployeeDetailFrame
from .notifications_window import NotificationsWindow
from .user_management_window import UserManagementWindow
from .employee_form_window import EmployeeFormWindow
from .archive_window import ArchiveWindow
from .error_viewer_window import AdvancedErrorViewer
from .database_config_window import DatabaseConfigWindow

# Proyekt importları
import database
from updater_service import UpdaterService

class MainAppFrame(ttk.Frame):
    def __init__(self, parent, current_user, version_info, logout_callback):
        super().__init__(parent)
        self.parent = parent
        self.current_user = current_user
        self.logout_callback = logout_callback
        self.version_info = version_info
        
        self.main_font = self.winfo_toplevel().main_font
        
        self.notif_window = None
        self.command_check_timer = None
        self.auto_refresh_timer = None
        self.master_logout_timer_id = None

        self.is_setup_mode = self.current_user.get('role') == 'setup'
        self.is_admin = self.current_user['role'].strip() == 'admin'

        style = ttk.Style(self)
        style.configure("Card.TFrame", background="white")
        style.configure("Card.TLabel", background="white", font=(self.main_font, 9))
        
        self.vacation_panel_active = False
        self.animation_in_progress = False
        
        self.create_main_layout()

        if self.is_setup_mode:
            ttk.Label(self.right_frame, 
                      text="Sistem qurulum rejimindədir.\nZəhmət olmasa, Admin Panelindən Baza Konfiqurasiyasını tamamlayın.", 
                      foreground="red", wraplength=400, justify="center", 
                      font=(self.main_font, 14, "bold")).pack(pady=100, fill='x')
        else:
            self.create_views()
            self._create_vacation_panel()
            self.show_view('dashboard')
            self.load_and_refresh_data()
            self.start_background_tasks()

    def start_background_tasks(self):
        if self.is_setup_mode: return
        self.command_check_timer = self.after(10000, self._check_for_commands)
        self.auto_refresh_timer = self.after(60000, self._auto_refresh_data)

    def destroy(self):
        if hasattr(self, 'command_check_timer') and self.command_check_timer: self.after_cancel(self.command_check_timer)
        if hasattr(self, 'auto_refresh_timer') and self.auto_refresh_timer: self.after_cancel(self.auto_refresh_timer)
        if hasattr(self, 'master_logout_timer_id') and self.master_logout_timer_id: self.after_cancel(self.master_logout_timer_id)
        super().destroy()

    def create_main_layout(self):
        top_bar = ttk.Frame(self); top_bar.pack(fill='x', padx=10, pady=(5, 10))
        ttk.Label(top_bar, text=f"İstifadəçi: {self.current_user['name']} (Rol: {self.current_user['role']})").pack(side='left')
        right_buttons_frame = ttk.Frame(top_bar); right_buttons_frame.pack(side='right')
        if self.is_admin:
            ttk.Button(right_buttons_frame, text="👤 İstifadəçi İdarəetməsi", command=self.open_user_management, state="disabled" if self.is_setup_mode else "normal").pack(side='left', padx=2)
            ttk.Button(right_buttons_frame, text="🐞 Xəta Jurnalı", command=self.open_error_viewer, state="disabled" if self.is_setup_mode else "normal").pack(side='left', padx=2)
        self.notifications_button = ttk.Button(right_buttons_frame, text="🔔 Bildirişlər", command=self.open_notifications_window, state="disabled" if self.is_setup_mode else "normal")
        self.notifications_button.pack(side='left', padx=2)
        ttk.Button(right_buttons_frame, text="Sistemdən Çıxış", command=self.logout_callback).pack(side='left', padx=2)
        self.content_container = ttk.Frame(self); self.content_container.pack(expand=True, fill='both')
        self.left_frame = ttk.Frame(self.content_container, padding="10"); self.left_frame.pack(side="left", fill="y", anchor="n")
        self.right_frame = ttk.Frame(self.content_container); self.right_frame.pack(side="right", expand=True, fill="both")
        self.setup_left_panel()

    def setup_left_panel(self):
        ttk.Button(self.left_frame, text="🏠 Ana Səhifə / Təqvim", command=lambda: self.show_view('dashboard'), state="disabled" if self.is_setup_mode else "normal").pack(fill='x', pady=(0, 10), ipady=4)
        if self.is_admin or self.is_setup_mode:
            admin_panel = ttk.LabelFrame(self.left_frame, text="Admin Paneli")
            admin_panel.pack(fill='x', pady=10)
            if not self.is_setup_mode:
                top_admin_frame = ttk.Frame(admin_panel)
                top_admin_frame.pack(fill='x', padx=5, pady=(5,0))
                ttk.Button(top_admin_frame, text="✚ Yeni İşçi", command=lambda: self.open_employee_form_window(is_new=True)).pack(side='left', expand=True, fill='x')
                self.edit_employee_button = ttk.Button(top_admin_frame, text="✎ Düzəliş", state="disabled", command=lambda: self.open_employee_form_window(is_new=False))
                self.edit_employee_button.pack(side='left', expand=True, fill='x', padx=5)
                self.delete_employee_button = ttk.Button(top_admin_frame, text="🗑 Sil", state="disabled", command=self.delete_employee)
                self.delete_employee_button.pack(side='left', expand=True, fill='x')
            ttk.Button(admin_panel, text="🗓️ Yeni Məzuniyyət İli", command=self._confirm_and_start_new_year, state="disabled" if self.is_setup_mode else "normal").pack(fill='x', pady=2, padx=5)
            ttk.Button(admin_panel, text="🗄️ Məzuniyyət Arxivi", command=self.open_archive_view_window, state="disabled" if self.is_setup_mode else "normal").pack(fill='x', pady=(0, 5), padx=5)
            ttk.Button(admin_panel, text="⚙️ Baza Konfiqurasiyası", command=self.open_db_config_window).pack(fill='x', pady=2, padx=5)
        if not self.is_setup_mode:
            employee_frame = ttk.LabelFrame(self.left_frame, text="İşçilər"); employee_frame.pack(expand=True, fill='both')
            listbox_frame = ttk.Frame(employee_frame); listbox_frame.pack(expand=True, fill='both', pady=5, padx=5)
            self.employee_listbox = tk.Listbox(listbox_frame, font=(self.main_font, 11), relief="flat", highlightthickness=1)
            self.employee_listbox.config(highlightbackground="#cccccc", highlightcolor="#007bff")
            vsb = ttk.Scrollbar(listbox_frame, orient="vertical", command=self.employee_listbox.yview)
            self.employee_listbox.configure(yscrollcommand=vsb.set)
            vsb.pack(side='right', fill='y')
            self.employee_listbox.pack(side='left', expand=True, fill="both")
            self.employee_listbox.bind("<<ListboxSelect>>", self.on_employee_select)

    def _center_toplevel(self, toplevel_window):
        toplevel_window.update_idletasks(); main_app = self.winfo_toplevel()
        x = main_app.winfo_x() + (main_app.winfo_width() - toplevel_window.winfo_width()) // 2
        y = main_app.winfo_y() + (main_app.winfo_height() - toplevel_window.winfo_height()) // 2
        toplevel_window.geometry(f"+{x}+{y}"); toplevel_window.lift()

    def open_db_config_window(self):
        win = DatabaseConfigWindow(self, self.current_user, self.logout_callback)
        self._center_toplevel(win)
        
    def open_notifications_window(self):
        if self.notif_window and self.notif_window.winfo_exists(): self.notif_window.lift(); return
        self.notif_window = NotificationsWindow(parent=self, user_id=self.current_user['id'], on_notif_click_callback=self._on_notification_click)
        self.notif_window.protocol("WM_DELETE_WINDOW", lambda: (self.load_and_refresh_data(), self.notif_window.destroy()))
        self._center_toplevel(self.notif_window)

    def create_views(self):
        self.views = {}
        self.views['dashboard'] = DashboardCalendarFrame(self.right_frame, self)
        self.views['dashboard'].place(in_=self.right_frame, x=0, y=0, relwidth=1, relheight=1)
        self.views['employee_details'] = EmployeeDetailFrame(self.right_frame, self)
        self.views['employee_details'].place(in_=self.right_frame, x=0, y=0, relwidth=1, relheight=1)

    def show_view(self, view_name):
        if self.is_setup_mode: return
        if view_name == 'dashboard':
            if hasattr(self, 'employee_listbox'): self.employee_listbox.selection_clear(0, tk.END)
            if self.is_admin:
                if hasattr(self, 'edit_employee_button'): self.edit_employee_button.config(state="disabled")
                if hasattr(self, 'delete_employee_button'): self.delete_employee_button.config(state="disabled")
            if hasattr(self.views.get('dashboard'), 'load_data'): self.views['dashboard'].load_data()
        frame = self.views.get(view_name)
        if frame: frame.tkraise()

    def on_employee_select(self, event=None):
        if not hasattr(self, 'employee_listbox') or not self.employee_listbox.curselection():
            self.show_view('dashboard'); return
        if self.is_admin: self.edit_employee_button.config(state="normal"); self.delete_employee_button.config(state="normal")
        _, selected_name = self.get_selected_employee_name()
        if not selected_name: return
        info = self.data.get(selected_name)
        if not info: return
        info['name'] = selected_name
        self.views['employee_details'].update_data(info, self.current_user)
        self.show_view('employee_details')

    def load_and_refresh_data(self, selection_to_keep=None):
        if self.is_setup_mode: return
        if not selection_to_keep and hasattr(self, 'employee_listbox') and self.employee_listbox.curselection():
            _, selection_to_keep = self.get_selected_employee_name()
        self.data = database.load_data_for_user(self.current_user)
        self._update_notification_button()
        if hasattr(self, 'employee_listbox'):
            self.refresh_employee_list(selection_to_keep)
        if hasattr(self, 'employee_listbox') and self.employee_listbox.curselection(): self.on_employee_select()
        else: self.show_view('dashboard')
        
    def refresh_employee_list(self, selection_to_keep=None):
        self.employee_listbox.delete(0, tk.END)
        if not hasattr(self, 'data') or not self.data: return
        sorted_names = sorted(self.data.keys())
        restored_idx = -1
        for i, name in enumerate(sorted_names):
            emp_data = self.data[name]
            is_active = emp_data.get("is_active", True)
            sessions = emp_data.get("active_session_count", 0)
            indicator, color, text = ("●", "gray", f" {name} [Deactivated]") if not is_active else \
                                     (("●", "green", f" {name}" + (f" ({sessions})" if sessions > 1 else "")) if sessions > 0 else ("●", "#808080", f" {name}"))
            self.employee_listbox.insert(tk.END, indicator + text); self.employee_listbox.itemconfig(i, {'fg': color})
            if name == selection_to_keep: restored_idx = i
        if restored_idx != -1: self.employee_listbox.selection_set(restored_idx); self.employee_listbox.activate(restored_idx); self.employee_listbox.see(restored_idx)

    def get_selected_employee_name(self):
        if not hasattr(self, 'employee_listbox') or not self.employee_listbox.curselection(): return None, None
        full_text = self.employee_listbox.get(self.employee_listbox.curselection()[0])
        clean_name = full_text.replace("● ", "").split(" [")[0].split(" (")[0].strip()
        return full_text, clean_name
        
    def delete_employee(self):
        _, selected_name = self.get_selected_employee_name()
        if not selected_name: return
        if messagebox.askyesno("Confirm", f"Are you sure you want to delete the employee '{selected_name}'?", parent=self):
            emp_id = self.data[selected_name]['db_id']
            database.issue_immediate_logout_command([emp_id]); database.force_remove_sessions_by_user_id([emp_id])
            database.delete_employee(emp_id); self.load_and_refresh_data()

    def show_employee_by_id(self, employee_id):
        target_name = next((name for name, data in self.data.items() if data['db_id'] == employee_id), None)
        if not target_name: return
        listbox_items = self.employee_listbox.get(0, tk.END)
        for i, item in enumerate(listbox_items):
            clean_item = item.replace("● ", "").split(" [")[0].split(" (")[0].strip()
            if clean_item == target_name:
                self.employee_listbox.selection_clear(0, tk.END); self.employee_listbox.selection_set(i)
                self.employee_listbox.see(i); self.on_employee_select(); break

    def toggle_user_activity(self, user_id, new_status):
        _, selected_name = self.get_selected_employee_name()
        if selected_name:
            database.set_user_activity(user_id, new_status)
            if not new_status: database.issue_immediate_logout_command([user_id]); database.force_remove_sessions_by_user_id([user_id])
            self.load_and_refresh_data(selection_to_keep=selected_name)
    
    def show_summary_panel(self, parent_frame, info):
        umumi_gun = info.get("umumi_gun", 0)
        istifade_olunmus = sum(mezuniyyet_muddetini_hesabla(v['baslama'], v['bitme']) for v in info.get("goturulen_icazeler", []) if v.get('status') == 'approved' and not v.get('aktiv_deyil', False))
        qaliq_gun = umumi_gun - istifade_olunmus
        for widget in parent_frame.winfo_children():
            if isinstance(widget, ttk.Separator) or (hasattr(widget, 'is_summary_container') and widget.is_summary_container): widget.destroy()
        separator1 = ttk.Separator(parent_frame); separator1.pack(fill='x', pady=5)
        summary_container = ttk.Frame(parent_frame, style="Card.TFrame"); summary_container.pack(fill='x'); summary_container.is_summary_container = True
        self._create_summary_labels(summary_container, umumi_gun, istifade_olunmus, qaliq_gun)
        separator2 = ttk.Separator(parent_frame); separator2.pack(fill='x', pady=5)

    def _create_summary_labels(self, parent, total, used, remaining):
        style = ttk.Style()
        style.configure("Summary.TLabel", font=(self.main_font, 9), background='white')
        style.configure("SummaryValue.TLabel", font=(self.main_font, 10, "bold"), background='white')
        frame_total = ttk.Frame(parent, style="Card.TFrame"); frame_total.pack(side='left', padx=10)
        ttk.Label(frame_total, text="Annual Leave:", style="Summary.TLabel").pack(); ttk.Label(frame_total, text=f"{total} days", style="SummaryValue.TLabel").pack()
        frame_used = ttk.Frame(parent, style="Card.TFrame"); frame_used.pack(side='left', padx=10)
        ttk.Label(frame_used, text="Used:", style="Summary.TLabel").pack(); ttk.Label(frame_used, text=f"{used} days", style="SummaryValue.TLabel").pack()
        frame_rem = ttk.Frame(parent, style="Card.TFrame"); frame_rem.pack(side='left', padx=10)
        ttk.Label(frame_rem, text="Remaining:", style="Summary.TLabel").pack(); ttk.Label(frame_rem, text=f"{remaining} days", style="SummaryValue.TLabel", foreground="green" if remaining >= 0 else "red").pack()
    
    def open_user_management(self): win = UserManagementWindow(self, main_app_ref=self); self._center_toplevel(win)
    def open_error_viewer(self):
        try: win = AdvancedErrorViewer(self); self._center_toplevel(win)
        except Exception as e: messagebox.showerror("Window Error", f"Could not open the error log window:\n{e}")

    def open_archive_view_window(self):
        if hasattr(self, 'data'):
            win = ArchiveWindow(self, self.data, self.current_user); self._center_toplevel(win)
    
    def open_employee_form_window(self, is_new=False):
        employee_to_edit = None
        if not is_new:
            _, selected_name = self.get_selected_employee_name()
            if not selected_name: return
            employee_to_edit = self.data[selected_name]; employee_to_edit['name'] = selected_name
        win = EmployeeFormWindow(self, self.load_and_refresh_data, employee_to_edit); self._center_toplevel(win)
        
    def _confirm_and_start_new_year(self):
        employees_to_archive = database.get_employees_with_archivable_vacations()
        win = Toplevel(self); win.title("New Vacation Year - Archive Confirmation"); win.geometry("500x600"); win.transient(self); win.grab_set()
        checkbox_vars = {}
        def do_archive():
            selected_ids = [emp_id for emp_id, var in checkbox_vars.items() if var.get()]
            if not selected_ids: messagebox.showwarning("No Selection", "No employees selected for archiving.", parent=win); return
            if messagebox.askyesno("Final Confirmation", f"Start a new vacation year for {len(selected_ids)} employees?", parent=win):
                if database.start_new_vacation_year(selected_ids): win.destroy(); self.load_and_refresh_data()
        top_frame = ttk.Frame(win, padding=10); top_frame.pack(fill='x')
        select_all_var = tk.BooleanVar()
        employees_by_id = {emp_id: {'can_be_archived': count > 0} for emp_id, _, count in employees_to_archive}
        def toggle_all():
            for emp_id, var in checkbox_vars.items():
                if employees_by_id[emp_id]['can_be_archived']: var.set(select_all_var.get())
        ttk.Checkbutton(top_frame, text="Select All (Archivable)", variable=select_all_var, command=toggle_all).pack(side='left')
        ttk.Button(top_frame, text="Archive Selected", command=do_archive).pack(side='right')
        canvas = tk.Canvas(win); scrollbar = ttk.Scrollbar(win, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas); scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw"); canvas.configure(yscrollcommand=scrollbar.set)
        for emp_id, name, count in employees_to_archive:
            var = tk.BooleanVar(); checkbox_vars[emp_id] = var; row_frame = ttk.Frame(scrollable_frame, padding=(5,2))
            cb_state = "normal" if employees_by_id[emp_id]['can_be_archived'] else "disabled"
            ttk.Checkbutton(row_frame, variable=var, state=cb_state).pack(side='left')
            label_color = "black" if employees_by_id[emp_id]['can_be_archived'] else "gray"
            ttk.Label(row_frame, text=f"{name} ({count} vacations)", foreground=label_color).pack(side='left')
            row_frame.pack(fill='x', padx=10)
        canvas.pack(side="left", fill="both", expand=True); scrollbar.pack(side="right", fill="y")
        self._center_toplevel(win)
        
    def _on_notification_click(self, notif_id, employee_id, vacation_id):
        database.mark_notifications_as_read([notif_id])
        if employee_id:
            self.show_employee_by_id(employee_id)
            if 'employee_details' in self.views and hasattr(self.views['employee_details'], 'highlight_vacation'):
                self.after(100, lambda: self.views['employee_details'].highlight_vacation(vacation_id))
        else: self.load_and_refresh_data()
            
    def _update_notification_button(self):
        if self.is_setup_mode: return
        unread_count = database.get_unread_notifications_for_user(self.current_user['id'])
        button_text = f"🔔 Notifications ({unread_count})" if unread_count > 0 else "🔔 Notifications"
        if hasattr(self, 'notifications_button'): self.notifications_button.config(text=button_text)
    
    def _auto_refresh_data(self):
        if hasattr(self, 'vacation_panel_active') and not self.vacation_panel_active: self.load_and_refresh_data()
        self.auto_refresh_timer = self.after(60000, self._auto_refresh_data)

    def _check_for_commands(self):
        if self.is_setup_mode: return
        command = database.get_pending_commands(self.current_user['id'])
        if command: self._handle_system_command(command)
        self.command_check_timer = self.after(10000, self._check_for_commands)

    def _handle_system_command(self, command):
        command_type = command.get('type'); command_id = command.get('id')
        database.mark_command_as_executed(command_id)
        if command_type == 'IMMEDIATE_LOGOUT': self.after(0, self.logout_callback, "You have been logged out by the administrator.")
        elif command_type == 'TIMED_LOGOUT':
            if self.master_logout_timer_id: self.after_cancel(self.master_logout_timer_id)
            try:
                logout_time = datetime.fromisoformat(command['value']); self._start_master_logout_timer(logout_time); self._show_visual_timer_window(logout_time)
            except (ValueError, TypeError): pass

    def _start_master_logout_timer(self, logout_time):
        now = datetime.now(); remaining_ms = max(0, (logout_time - now).total_seconds() * 1000)
        if remaining_ms > 0: self.master_logout_timer_id = self.after(int(remaining_ms), self._execute_final_logout)

    def _execute_final_logout(self):
        self.master_logout_timer_id = None; self.after(0, self.logout_callback, "You are being logged out as the allotted time has expired.")

    def _show_visual_timer_window(self, logout_time):
        timer_window = Toplevel(self); timer_window.title("System Message"); timer_window.transient(self)
        self.update_idletasks()
        x = self.winfo_rootx() + self.winfo_width() - 420; y = self.winfo_rooty() + self.winfo_height() - 200
        timer_window.geometry(f"400x150+{x}+{y}"); timer_window.resizable(False, False)
        main_frame = ttk.Frame(timer_window, padding=20); main_frame.pack(expand=True, fill='both')
        ttk.Label(main_frame, text="Logout requested by administrator!", font=(self.main_font, 12, "bold"), foreground="red").pack(pady=(0, 5))
        ttk.Label(main_frame, text="The program will close at the specified time.").pack(pady=(0, 10))
        timer_label = ttk.Label(main_frame, text="", font=(self.main_font, 18, "bold")); timer_label.pack(pady=5)
        def update_visual_timer():
            if not timer_window.winfo_exists(): return
            remaining = logout_time - datetime.now()
            if remaining.total_seconds() < 1: timer_window.destroy()
            else: minutes, seconds = divmod(int(remaining.total_seconds()), 60); timer_label.config(text=f"{minutes:02d}:{seconds:02d}"); timer_window.after(1000, update_visual_timer)
        update_visual_timer()
        
    def _create_vacation_panel(self):
        style = ttk.Style(self); style.configure("Close.TButton", font=(self.main_font, 10, 'bold'), borderwidth=0, relief="flat"); style.map("Close.TButton", background=[('active', '#e8e8e8')])
        self.vacation_form_panel = ttk.Frame(self.views['employee_details'], style="Card.TFrame", padding=20)
        self.panel_save_button = ttk.Button(self.vacation_form_panel, text="Send Request", command=self._save_vacation_from_panel); self.panel_save_button.pack(side='bottom', fill='x', ipady=5, pady=(15, 0))
        form_body = ttk.Frame(self.vacation_form_panel, style="Card.TFrame"); form_body.pack(side='top', fill='both', expand=True)
        panel_header = ttk.Frame(form_body, style="Card.TFrame"); panel_header.pack(fill='x', pady=(0, 20))
        self.panel_title = ttk.Label(panel_header, text="New Request", font=(self.main_font, 14, "bold"), style="Card.TLabel"); self.panel_title.pack(side='left')
        ttk.Button(panel_header, text="✖", width=3, style="Close.TButton", command=lambda: self.toggle_vacation_panel(show=False)).pack(side='right')
        ttk.Label(form_body, text="Start Date:", style="Card.TLabel").pack(anchor='w', pady=(5,2))
        self.panel_start_cal = CustomDateEntry(form_body, date_pattern='dd.mm.yyyy', font_name=self.main_font); self.panel_start_cal.pack(anchor='w', pady=(0,10), fill='x')
        ttk.Label(form_body, text="End Date:", style="Card.TLabel").pack(anchor='w', pady=(5,2))
        self.panel_end_cal = CustomDateEntry(form_body, date_pattern='dd.mm.yyyy', font_name=self.main_font); self.panel_end_cal.pack(anchor='w', pady=(0,10), fill='x')
        ttk.Label(form_body, text="Note:", style="Card.TLabel").pack(anchor='w', pady=(5,2))
        self.panel_note_entry = tk.Text(form_body, height=4, relief="solid", borderwidth=1, font=(self.main_font, 10)); self.panel_note_entry.pack(anchor='w', pady=0, fill='both', expand=True)
        
    def toggle_vacation_panel(self, show, employee_name=None, vacation=None):
        if self.animation_in_progress: return
        if show:
            is_edit_mode = vacation is not None
            self.current_panel_employee = employee_name; self.current_panel_vacation = vacation
            self.panel_title.config(text="Edit" if is_edit_mode else "New Request")
            if is_edit_mode:
                self.panel_start_cal.set_date(datetime.strptime(vacation['baslama'], '%Y-%m-%d')); self.panel_end_cal.set_date(datetime.strptime(vacation['bitme'], '%Y-%m-%d'))
                self.panel_note_entry.delete("1.0", tk.END); self.panel_note_entry.insert("1.0", vacation.get('qeyd', ''))
                self.panel_save_button.config(text="Save")
            else:
                self.panel_start_cal.set_date(date.today()); self.panel_end_cal.set_date(date.today())
                self.panel_note_entry.delete("1.0", tk.END); self.panel_save_button.config(text="Send Request")
        self.vacation_panel_active = show; self._animate_panel()

    def _animate_panel(self):
        self.animation_in_progress = True; start_relx, end_relx, step = (1.0, 1.0 - 0.45, -0.05)
        current_pos, target_pos, move = (self.vacation_form_panel.place_info().get('relx', start_relx), end_relx, -step) if self.vacation_panel_active else (self.vacation_form_panel.place_info().get('relx', end_relx), start_relx, step)
        new_pos = float(current_pos) + move
        if (move < 0 and new_pos <= target_pos) or (move > 0 and new_pos >= target_pos):
            new_pos = target_pos; self.animation_in_progress = False
            if not self.vacation_panel_active: self.vacation_form_panel.place_forget()
        self.vacation_form_panel.place(in_=self.views['employee_details'], relx=new_pos, rely=0, relwidth=0.45, relheight=1)
        if self.animation_in_progress: self.after(15, self._animate_panel)

    def _save_vacation_from_panel(self):
        start_date_obj = self.panel_start_cal.get_date(); end_date_obj = self.panel_end_cal.get_date()
        if not start_date_obj or not end_date_obj: messagebox.showerror("Error", "Dates must be selected.", parent=self); return
        if end_date_obj < start_date_obj: messagebox.showerror("Error", "End date cannot be earlier than start date.", parent=self); return
        is_edit_mode = self.current_panel_vacation is not None
        creation_date = date.today().isoformat()
        if is_edit_mode and self.current_panel_vacation: creation_date = self.current_panel_vacation.get('yaradilma_tarixi', date.today().isoformat())
        new_data = {"baslama": start_date_obj.isoformat(), "bitme": end_date_obj.isoformat(), "qeyd": self.panel_note_entry.get("1.0", tk.END).strip(), "yaradilma_tarixi": creation_date}
        if is_edit_mode: database.update_vacation(self.current_panel_vacation['db_id'], new_data, self.current_user['name'])
        else:
            emp_id = self.data[self.current_panel_employee]['db_id']
            database.add_vacation(emp_id, self.current_panel_employee, new_data, self.current_user['role'])
        self.toggle_vacation_panel(show=False); self.load_and_refresh_data(selection_to_keep=self.current_panel_employee)