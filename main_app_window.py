# main_app_window.py (Tam və Düzəldilmiş Yekun Versiya)

import tkinter as tk
from tkinter import ttk, messagebox, Toplevel
import tkinter.font as tkFont
import database
from datetime import datetime, date
import os
import sys

from updater_service import UpdaterService
from ui_components import Tooltip, mezuniyyet_muddetini_hesabla, get_vacation_status_and_color, CustomDateEntry
from vacation_tree_view import VacationTreeView

class MainAppFrame(ttk.Frame):
    def __init__(self, parent, current_user, version_info, logout_callback):
        super().__init__(parent)
        self.parent = parent
        self.current_user = current_user
        self.logout_callback = logout_callback
        self.notifications = []
        self.version_info = version_info
        
        self.notif_window = None

        style = ttk.Style(self)
        style.configure("Card.TFrame", background="white")
        style.configure("Card.TLabel", background="white")
        style.configure("Close.TButton", font=('Arial', 10, 'bold'), borderwidth=0, relief="flat")
        style.map("Close.TButton", background=[('active', '#e8e8e8')])
        style.configure("Notification.TFrame", background="white")
        style.map("Notification.TFrame", background=[('active', '#f0f0f0')])
        style.configure("Read.TFrame", background="#f0f0f0")
        style.configure("Read.TLabel", background="#f0f0f0", foreground="gray")
        style.configure("Read.TCheckbutton", background="#f0f0f0")
        style.configure("Notification.TCheckbutton", background="white")

        self.PANEL_WIDTH = 0.45 
        self.vacation_panel_active = False
        self.animation_in_progress = False
        self.is_update_active = False
        self.tree_frame = None 
        
        self.create_widgets()
        self.load_and_refresh_data()
        self.after(20000, self._auto_refresh_data)

    def create_widgets(self):
        update_bar = ttk.Frame(self); update_bar.pack(fill='x')
        self.update_button = ttk.Button(update_bar, text="🔄 Yeni Versiya Mövcuddur! Klikləyin və Yeniləyin", command=self._start_update_process)
        
        top_bar = ttk.Frame(self); top_bar.pack(fill='x', padx=10, pady=(5, 10))
        ttk.Label(top_bar, text=f"İstifadəçi: {self.current_user['name']} (Rol: {self.current_user['role']})").pack(side='left')
        right_buttons_frame = ttk.Frame(top_bar); right_buttons_frame.pack(side='right')
        is_admin = self.current_user['role'].strip() == 'admin'
        if is_admin:
            ttk.Button(right_buttons_frame, text="🗓️ Yeni Məzuniyyət İli", command=self._confirm_and_start_new_year).pack(side='left', padx=5)
            ttk.Button(right_buttons_frame, text="🗄️ Arxivə Bax", command=self.open_archive_view_window).pack(side='left', padx=5)
        self.notifications_button = ttk.Button(right_buttons_frame, text="🔔 Bildirişlər", command=self._show_notifications_window); self.notifications_button.pack(side='left', padx=5)
        ttk.Button(right_buttons_frame, text="Sistemdən Çıxış", command=self.logout_callback).pack(side='left', padx=5)
        
        self.content_container = ttk.Frame(self); self.content_container.pack(expand=True, fill='both')
        self.left_frame = ttk.Frame(self.content_container, padding="10"); self.left_frame.pack(side="left", fill="y", anchor="n")
        self.right_frame = ttk.Frame(self.content_container); self.right_frame.pack(side="right", expand=True, fill="both")
        self.right_frame.rowconfigure(1, weight=1); self.right_frame.columnconfigure(0, weight=1)
        self.header_container = ttk.Frame(self.right_frame); self.header_container.grid(row=0, column=0, sticky="new", padx=10)
        self.tree_area_frame = ttk.Frame(self.right_frame); self.tree_area_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        
        self._create_update_screen()
        self._create_vacation_panel() 
        self.setup_left_panel()

    def refresh_employee_list(self, selection_to_keep=None):
        self.employee_listbox.delete(0, tk.END)
        if not hasattr(self, 'data') or not self.data: return
        
        sorted_names = sorted(self.data.keys())
        restored_idx = -1
        for i, name in enumerate(sorted_names):
            employee_data = self.data[name]
            is_active_account = employee_data.get("is_active", True)
            active_sessions = employee_data.get("active_session_count", 0)

            indicator = "●"
            color = "gray"
            session_text = ""

            if not is_active_account:
                color = "gray"
                display_name = f"{indicator} {name} [Deaktiv]"
            elif active_sessions > 0:
                color = "green"
                if active_sessions > 1:
                    session_text = f" ({active_sessions})"
                display_name = f"{indicator} {name}{session_text}"
            else:
                color = "#808080"
                display_name = f"{indicator} {name}"
            
            self.employee_listbox.insert(tk.END, display_name)
            self.employee_listbox.itemconfig(i, {'fg': color})
            
            if name == selection_to_keep:
                restored_idx = i
                
        if restored_idx != -1:
            self.employee_listbox.selection_set(restored_idx)
            self.employee_listbox.activate(restored_idx)
            self.employee_listbox.see(restored_idx)
    
    def get_selected_employee_name(self):
        if not self.employee_listbox.curselection(): return None, None
        full_text = self.employee_listbox.get(self.employee_listbox.curselection()[0])
        clean_name = full_text.replace("● ", "")
        if " (" in clean_name: clean_name = clean_name.split(" (")[0]
        if " [" in clean_name: clean_name = clean_name.split(" [")[0]
        return full_text, clean_name.strip()

    def show_employee_details(self):
        for widget in self.header_container.winfo_children(): widget.destroy()
        if self.tree_frame is not None and self.tree_frame.winfo_exists(): self.tree_frame.destroy()

        _, selected_name = self.get_selected_employee_name()
        if not selected_name: self.show_placeholder_text(); return
        
        info = self.data.get(selected_name)
        if not info: self.show_placeholder_text(); return
        
        info['name'] = selected_name
        is_admin = self.current_user['role'].strip() == 'admin'
        title_bar = ttk.Frame(self.header_container); title_bar.pack(fill='x', pady=(5,0))
        ttk.Label(title_bar, text=selected_name, font=("Helvetica", 18, "bold")).pack(side='left', anchor='w')
        if is_admin:
            user_id = info['db_id']; is_user_active = info.get("is_active", True)
            toggle_text = "Deaktiv Et" if is_user_active else "Aktiv Et"
            ttk.Button(title_bar, text=toggle_text, command=lambda: self.toggle_user_activity(user_id, not is_user_active)).pack(side='right', anchor='e')
        
        self.show_summary_panel(self.header_container, info)
        ttk.Button(self.header_container, text=f"✚ Yeni Məzuniyyət Əlavə Et", command=lambda: self.toggle_vacation_panel(show=True, employee_name=selected_name)).pack(pady=10)
        
        self.tree_frame = VacationTreeView(self.tree_area_frame, self, info, self.current_user, self.load_and_refresh_data)
        self.tree_frame.pack(expand=True, fill='both'); self.tree_frame.lower()

    def open_edit_employee_window(self, is_new=False):
        old_name = None
        if not is_new:
            if not self.employee_listbox.curselection(): return
            _, old_name = self.get_selected_employee_name()
        
        is_edit_mode = old_name is not None
        title = "İşçiyə Düzəliş Et" if is_edit_mode else "Yeni İşçi Yarat"
        window = Toplevel(self); window.title(title); window.grab_set(); window.transient(self)
        frame = ttk.Frame(window, padding="15"); frame.pack(expand=True, fill="both")
        
        ttk.Label(frame, text="Ad və Soyad:").grid(row=0, column=0, sticky="w", pady=5); name_entry = ttk.Entry(frame, width=40); name_entry.grid(row=0, column=1, pady=5)
        ttk.Label(frame, text="İllik Məzuniyyət Günü:").grid(row=1, column=0, sticky="w", pady=5); days_entry = ttk.Entry(frame, width=15); days_entry.grid(row=1, column=1, pady=5, sticky="w")
        ttk.Label(frame, text="Maksimum Sessiya Sayı:").grid(row=2, column=0, sticky="w", pady=5); sessions_entry = ttk.Entry(frame, width=15); sessions_entry.grid(row=2, column=1, pady=5, sticky="w")

        if is_edit_mode:
            emp_data = self.data[old_name]
            name_entry.insert(0, old_name)
            days_entry.insert(0, emp_data.get("umumi_gun", 30))
            sessions_entry.insert(0, emp_data.get("max_sessions", 1))
            days_entry.focus()
        else:
            sessions_entry.insert(0, 1)
            ttk.Label(frame, text="İstifadəçi adı (login):").grid(row=3, column=0, sticky="w", pady=5); user_entry = ttk.Entry(frame, width=40); user_entry.grid(row=3, column=1, pady=5)
            ttk.Label(frame, text="Şifrə:").grid(row=4, column=0, sticky="w", pady=5); pass_entry = ttk.Entry(frame, width=40, show="*"); pass_entry.grid(row=4, column=1, pady=5)
            name_entry.focus()
        
        def save():
            new_name = name_entry.get().strip(); days_str = days_entry.get().strip(); sessions_str = sessions_entry.get().strip()
            if not all([new_name, days_str, sessions_str]): messagebox.showerror("Xəta", "Bütün xanalar doldurulmalıdır.", parent=window); return
            try:
                days = int(days_str)
                max_sessions = int(sessions_str)
            except ValueError: messagebox.showerror("Xəta", "Məzuniyyət və sessiya günü rəqəm olmalıdır.", parent=window); return
            
            if is_edit_mode:
                if (new_name != old_name) and (database.check_if_name_exists(new_name)): messagebox.showerror("Xəta", "Bu adda işçi artıq mövcuddur.", parent=window); return
                emp_id = self.data[old_name]['db_id']; database.update_employee(emp_id, new_name, days, max_sessions); self.load_and_refresh_data(selection_to_keep=new_name)
            else:
                username = user_entry.get().strip(); password = pass_entry.get()
                if not username or not password: messagebox.showerror("Xəta", "Yeni işçi üçün istifadəçi adı və şifrə mütləqdir.", parent=window); return
                if database.create_new_user(new_name, username, password, total_days=days, max_sessions=max_sessions): self.load_and_refresh_data(selection_to_keep=new_name)
            window.destroy()
        
        save_button_row = 5 if not is_edit_mode else 3
        ttk.Button(frame, text="Yadda Saxla", command=save).grid(row=save_button_row, column=0, columnspan=2, pady=10)
        self._center_toplevel(window)

    def delete_employee(self):
        _, selected_name = self.get_selected_employee_name()
        if not selected_name: return
        if messagebox.askyesno("Təsdiq", f"'{selected_name}' adlı işçini silmək istədiyinizə əminsiniz?", parent=self):
            emp_id = self.data[selected_name]['db_id']; database.delete_employee(emp_id); self.load_and_refresh_data()

    def toggle_user_activity(self, user_id, new_status):
        _, selected_name = self.get_selected_employee_name()
        if selected_name:
            database.set_user_activity(user_id, new_status)
            self.load_and_refresh_data(selection_to_keep=selected_name)

    def load_and_refresh_data(self, selection_to_keep=None):
        if not selection_to_keep and self.employee_listbox.curselection():
            _, selection_to_keep = self.get_selected_employee_name()
        
        self.data = database.load_data_for_user(self.current_user)
        self._update_notification_button()
        self.refresh_employee_list(selection_to_keep)
        
        if self.employee_listbox.curselection():
            self.show_employee_details()
        else:
            self.show_placeholder_text()

    def _on_notification_click(self, notif_id, employee_id, vacation_id):
        if notif_id:
            database.mark_notifications_as_read([notif_id])
            if self.notif_window and self.notif_window.winfo_exists():
                self.notif_window.destroy()
            self._update_notification_button()
            self._show_notifications_window()

        if employee_id:
            employee_name = next((name for name, data in self.data.items() if data['db_id'] == employee_id), None)
            if not employee_name: return

            listbox_items = [self.employee_listbox.get(i) for i in range(self.employee_listbox.size())]
            for i, item in enumerate(listbox_items):
                if item.strip().endswith(employee_name):
                    self.employee_listbox.selection_clear(0, tk.END)
                    self.employee_listbox.selection_set(i)
                    self.employee_listbox.see(i)
                    self.on_employee_select()
                    break
            self.after(100, lambda: self.tree_frame.highlight_vacation(vacation_id))

    def _toggle_select_all_notifs(self, var, checkboxes):
        is_selected = var.get()
        for cb_var in checkboxes:
            cb_var.set(is_selected)

    def _delete_selected_notifs(self):
        ids_to_delete = [notif_id for notif_id, var in self.notif_checkbox_vars.items() if var.get()]
        if not ids_to_delete:
            messagebox.showwarning("Seçim Yoxdur", "Silmək üçün heç bir bildiriş seçilməyib.", parent=self.notif_window)
            return
        if messagebox.askyesno("Təsdiq", f"{len(ids_to_delete)} bildirişi silmək istədiyinizə əminsiniz?", parent=self.notif_window):
            database.delete_notifications(ids_to_delete)
            if self.notif_window and self.notif_window.winfo_exists():
                self.notif_window.destroy()
            self._update_notification_button()
            self._show_notifications_window()

    def _show_notifications_window(self):
        if self.notif_window and self.notif_window.winfo_exists():
            self.notif_window.lift()
            return
        
        self.notifications = database.get_all_notifications_for_user(self.current_user['id'])
        self.notif_window = Toplevel(self)
        self.notif_window.title("Bildirişlər")
        self.notif_window.geometry("650x500")
        self.notif_window.transient(self)
        self.notif_window.protocol("WM_DELETE_WINDOW", self.notif_window.destroy) 
        self.notif_checkbox_vars = {}
        
        top_frame = ttk.Frame(self.notif_window, padding=(10, 5)); top_frame.pack(fill='x')
        main_frame = ttk.Frame(self.notif_window); main_frame.pack(fill="both", expand=True)
        canvas = tk.Canvas(main_frame, background="white")
        scrollbar = ttk.Scrollbar(main_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas, style="Card.TFrame")
        scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        if not self.notifications:
            ttk.Label(scrollable_frame, text="Heç bir bildiriş yoxdur.", padding=20, style="Card.TLabel").pack()
        else:
            checkbox_list = []
            select_all_var = tk.BooleanVar()
            select_all_cb = ttk.Checkbutton(top_frame, text="Hamısını Seç", variable=select_all_var, command=lambda: self._toggle_select_all_notifs(select_all_var, checkbox_list))
            select_all_cb.pack(side='left')
            delete_button = ttk.Button(top_frame, text="Seçilənləri Sil", command=self._delete_selected_notifs)
            delete_button.pack(side='right', padx=5)

            for notif_id, message, created_at, vac_id, emp_id, is_read in self.notifications:
                var = tk.BooleanVar()
                self.notif_checkbox_vars[notif_id] = var
                checkbox_list.append(var)
                
                frame_style = "Read.TFrame" if is_read else "Notification.TFrame"
                label_style = "Read.TLabel" if is_read else "Card.TLabel"
                cb_style = "Read.TCheckbutton" if is_read else "Notification.TCheckbutton"
                
                frame = ttk.Frame(scrollable_frame, padding=(10, 5), relief="solid", borderwidth=1, style=frame_style)
                frame.pack(fill='x', padx=10, pady=5)
                cb = ttk.Checkbutton(frame, variable=var, style=cb_style); cb.pack(side='left', padx=(0, 10))
                text_frame = ttk.Frame(frame, style=frame_style, cursor="hand2"); text_frame.pack(fill='x', expand=True)
                label_msg = ttk.Label(text_frame, text=message, wraplength=500, justify="left", style=label_style); label_msg.pack(anchor='w')
                label_date = ttk.Label(text_frame, text=created_at.strftime('%d.%m.%Y %H:%M'), font=("Helvetica", 8, "italic"), style=label_style); label_date.pack(anchor='e')

                if not is_read:
                    click_command = lambda e, n_id=notif_id, employee_id=emp_id, vacation_id=vac_id: self._on_notification_click(n_id, employee_id, vacation_id)
                    text_frame.bind("<Button-1>", click_command)
                    label_msg.bind("<Button-1>", click_command)
                    label_date.bind("<Button-1>", click_command)

        self._center_toplevel(self.notif_window)
        self.notif_window.grab_set()
    
    def _update_notification_button(self):
        unread_count = database.get_unread_notifications_for_user(self.current_user['id'])
        button_text = f"🔔 Bildirişlər ({unread_count})" if unread_count > 0 else "🔔 Bildirişlər"
        if hasattr(self, 'notifications_button'): self.notifications_button.config(text=button_text)

    def _auto_refresh_data(self):
        try:
            latest_version = database.get_latest_version()
            if latest_version and latest_version != self.version_info['current']:
                self.version_info['latest'] = latest_version
                self.update_button.pack(pady=5)
        except Exception: pass
        
        if not self.vacation_panel_active and not self.is_update_active:
            _, selection_to_keep = self.get_selected_employee_name()
            self.load_and_refresh_data(selection_to_keep=selection_to_keep)
        else:
            self.after(20000, self._auto_refresh_data)

    def _create_update_screen(self):
        self.update_frame = ttk.Frame(self)
        ttk.Label(self.update_frame, text="Proqram Yenilənir...", font=("Helvetica", 18, "bold")).pack(pady=20)
        self.update_status_label = ttk.Label(self.update_frame, text="Proses başlayır...", font=("Helvetica", 11))
        self.update_status_label.pack(pady=10, padx=20)
        self.update_progress_bar = ttk.Progressbar(self.update_frame, orient="horizontal", length=400, mode="determinate")
        self.update_progress_bar.pack(pady=20)
    
    def _start_update_process(self):
        if messagebox.askyesno("Yeniləmə Mövcuddur", "Proqramın yeni versiyası var. İndi endirilsin?", icon='question'):
            self.is_update_active = True
            self.content_container.pack_forget()
            self.update_frame.pack(expand=True)
            updater = UpdaterService({'update_status': self._update_status_on_ui, 'update_progress': self._update_progress_on_ui, 'on_error': self._handle_update_error})
            updater.start_update_in_thread()

    def _update_status_on_ui(self, text):
        if self.winfo_exists(): self.update_status_label.config(text=text)

    def _update_progress_on_ui(self, value):
        if self.winfo_exists(): self.update_progress_bar['value'] = value
    
    def _handle_update_error(self):
        self.update_frame.pack_forget()
        self.content_container.pack(expand=True, fill='both')
        self.is_update_active = False

    def _center_toplevel(self, toplevel_window):
        toplevel_window.update_idletasks()
        main_app = self.winfo_toplevel()
        x = main_app.winfo_x() + (main_app.winfo_width() - toplevel_window.winfo_width()) // 2
        y = main_app.winfo_y() + (main_app.winfo_height() - toplevel_window.winfo_height()) // 2
        toplevel_window.geometry(f"+{x}+{y}"); toplevel_window.lift()

    def _create_summary_labels(self, parent, total, used, remaining):
        style = ttk.Style(); style.configure("Summary.TLabel", font=("Helvetica", 9)); style.configure("SummaryValue.TLabel", font=("Helvetica", 10, "bold"))
        frame_total = ttk.Frame(parent); frame_total.pack(side='left', padx=10)
        ttk.Label(frame_total, text="İllik Hüquq:", style="Summary.TLabel").pack(); ttk.Label(frame_total, text=f"{total} gün", style="SummaryValue.TLabel").pack()
        frame_used = ttk.Frame(parent); frame_used.pack(side='left', padx=10)
        ttk.Label(frame_used, text="İstifadə:", style="Summary.TLabel").pack(); ttk.Label(frame_used, text=f"{used} gün", style="SummaryValue.TLabel").pack()
        frame_rem = ttk.Frame(parent); frame_rem.pack(side='left', padx=10)
        ttk.Label(frame_rem, text="Qalıq:", style="Summary.TLabel").pack(); ttk.Label(frame_rem, text=f"{remaining} gün", style="SummaryValue.TLabel", foreground="green" if remaining >= 0 else "red").pack()
        ttk.Separator(parent, orient='vertical').pack(side='left', fill='y', padx=10, expand=True)

    def show_summary_panel(self, parent_frame, info):
        umumi_gun = info.get("umumi_gun", 0)
        istifade_olunmus_gun_cemi = sum(mezuniyyet_muddetini_hesabla(v['baslama'], v['bitme']) for v in info.get("goturulen_icazeler", []) if v.get('status') == 'approved' and not v.get('aktiv_deyil', False))
        qaliq_gun = umumi_gun - istifade_olunmus_gun_cemi
        ttk.Separator(parent_frame).pack(fill='x', pady=5)
        summary_container = ttk.Frame(parent_frame); summary_container.pack(fill='x')
        self._create_summary_labels(summary_container, umumi_gun, istifade_olunmus_gun_cemi, qaliq_gun)
        ttk.Separator(parent_frame).pack(fill='x', pady=5)
    
    def _confirm_and_start_new_year(self):
        self._open_archive_confirmation_window()

    def _open_archive_confirmation_window(self):
        employees_to_archive = database.get_employees_with_archivable_vacations()
        win = Toplevel(self); win.title("Yeni Məzuniyyət İli - Arxivləmə Təsdiqi"); win.geometry("500x600"); win.transient(self); win.grab_set()
        checkbox_vars = {}

        def do_archive():
            selected_ids = [emp_id for emp_id, var in checkbox_vars.items() if var.get()]
            if not selected_ids: messagebox.showwarning("Seçim Yoxdur", "Arxivləmək üçün heç bir işçi seçilməyib.", parent=win); return
            if messagebox.askyesno("Son Təsdiq", f"{len(selected_ids)} işçi üçün yeni məzuniyyət ili başlasın?", parent=win):
                if database.start_new_vacation_year(selected_ids):
                    win.destroy()
                    self.load_and_refresh_data()

        top_frame = ttk.Frame(win, padding=10); top_frame.pack(fill='x')
        select_all_var = tk.BooleanVar()
        def toggle_all():
            for emp_id, var in checkbox_vars.items():
                if employees_by_id[emp_id]['can_be_archived']:
                    var.set(select_all_var.get())
        
        ttk.Checkbutton(top_frame, text="Hamısını Seç (Arxivlənə bilənləri)", variable=select_all_var, command=toggle_all).pack(side='left')
        ttk.Button(top_frame, text="Seçilənləri Arxivlə", command=do_archive).pack(side='right')

        canvas = tk.Canvas(win); scrollbar = ttk.Scrollbar(win, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas); scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw"); canvas.configure(yscrollcommand=scrollbar.set)
        
        employees_by_id = {}
        for emp_id, name, count in employees_to_archive:
            var = tk.BooleanVar()
            can_be_archived = count > 0
            checkbox_vars[emp_id] = var
            employees_by_id[emp_id] = {'can_be_archived': can_be_archived}
            
            label_color = "black" if can_be_archived else "gray"
            cb_state = "normal" if can_be_archived else "disabled"
            row_frame = ttk.Frame(scrollable_frame, padding=(5,2))
            cb = ttk.Checkbutton(row_frame, variable=var, state=cb_state); cb.pack(side='left')
            ttk.Label(row_frame, text=f"{name} ({count} məzuniyyət)", foreground=label_color).pack(side='left')
            row_frame.pack(fill='x', padx=10)

        canvas.pack(side="left", fill="both", expand=True); scrollbar.pack(side="right", fill="y")
        self._center_toplevel(win)

    def show_placeholder_text(self):
        for widget in self.header_container.winfo_children(): widget.destroy()
        if self.tree_frame and self.tree_frame.winfo_exists(): self.tree_frame.destroy()
        ttk.Label(self.header_container, text="Məlumatları görmək üçün işçi seçin.", font=("Helvetica", 14, "italic")).pack(pady=100, padx=20)
    
    def on_employee_select(self, event=None):
        if self.vacation_panel_active: self.toggle_vacation_panel(show=False)
        is_admin = self.current_user['role'].strip() == 'admin'
        if self.employee_listbox.curselection():
            if is_admin: 
                self.edit_employee_button.config(state="normal")
                self.delete_employee_button.config(state="normal")
            self.show_employee_details()
        else:
            if is_admin: 
                self.edit_employee_button.config(state="disabled")
                self.delete_employee_button.config(state="disabled")
            self.show_placeholder_text()
            
    def setup_left_panel(self):
        is_admin = self.current_user['role'].strip() == 'admin'
        if is_admin:
            admin_panel = ttk.LabelFrame(self.left_frame, text="Admin Paneli"); admin_panel.pack(fill='x', pady=10)
            control_frame = ttk.Frame(admin_panel, padding=5); control_frame.pack(fill='x')
            ttk.Button(control_frame, text="✚ Yeni İşçi", command=lambda: self.open_edit_employee_window(is_new=True)).pack(side="left", expand=True)
            self.edit_employee_button = ttk.Button(control_frame, text="✎ Düzəliş", state="disabled", command=lambda: self.open_edit_employee_window()); self.edit_employee_button.pack(side="left", expand=True, padx=5)
            self.delete_employee_button = ttk.Button(control_frame, text="🗑 Sil", state="disabled", command=self.delete_employee); self.delete_employee_button.pack(side="left", expand=True)
        self.employee_listbox = tk.Listbox(self.left_frame, width=35, font=("Helvetica", 12)); self.employee_listbox.pack(expand=True, fill="both", pady=(10,0))
        self.employee_listbox.bind("<<ListboxSelect>>", self.on_employee_select)
        
    def _create_vacation_panel(self):
        self.vacation_form_panel = ttk.Frame(self.right_frame, style="Card.TFrame", padding=20)
        self.panel_save_button = ttk.Button(self.vacation_form_panel, text="Sorğu Göndər", command=self._save_vacation_from_panel); self.panel_save_button.pack(side='bottom', fill='x', ipady=5, pady=(15, 0))
        form_body = ttk.Frame(self.vacation_form_panel, style="Card.TFrame"); form_body.pack(side='top', fill='both', expand=True)
        panel_header = ttk.Frame(form_body, style="Card.TFrame"); panel_header.pack(fill='x', pady=(0, 20))
        self.panel_title = ttk.Label(panel_header, text="Yeni Sorğu", font=("Helvetica", 14, "bold"), style="Card.TLabel"); self.panel_title.pack(side='left')
        ttk.Button(panel_header, text="✖", width=3, style="Close.TButton", command=lambda: self.toggle_vacation_panel(show=False)).pack(side='right')
        
        ttk.Label(form_body, text="Başlanğıc Tarixi:", style="Card.TLabel").pack(anchor='w', pady=(5,2))
        self.panel_start_cal = CustomDateEntry(form_body, date_pattern='dd.mm.yyyy'); self.panel_start_cal.pack(anchor='w', pady=(0,10), fill='x')
        ttk.Label(form_body, text="Bitmə Tarixi:", style="Card.TLabel").pack(anchor='w', pady=(5,2))
        self.panel_end_cal = CustomDateEntry(form_body, date_pattern='dd.mm.yyyy'); self.panel_end_cal.pack(anchor='w', pady=(0,10), fill='x')
        ttk.Label(form_body, text="Qeyd:", style="Card.TLabel").pack(anchor='w', pady=(5,2))
        self.panel_note_entry = tk.Text(form_body, height=4, relief="solid", borderwidth=1, font=("Helvetica", 10)); self.panel_note_entry.pack(anchor='w', pady=0, fill='both', expand=True)
        
    def toggle_vacation_panel(self, show, employee_name=None, vacation=None):
        if self.animation_in_progress: return
        if show:
            if self.tree_frame and self.tree_frame.winfo_exists(): self.tree_frame.tree.unbind("<Double-1>")
        else:
            if self.tree_frame and self.tree_frame.winfo_exists(): self.tree_frame.tree.bind("<Double-1>", self.tree_frame.on_double_click)

        if show:
            is_edit_mode = vacation is not None
            self.current_panel_employee = employee_name
            self.current_panel_vacation = vacation
            self.panel_title.config(text="Düzəliş Et" if is_edit_mode else "Yeni Sorğu")
            if is_edit_mode:
                self.panel_start_cal.set_date(datetime.strptime(vacation['baslama'], '%Y-%m-%d'))
                self.panel_end_cal.set_date(datetime.strptime(vacation['bitme'], '%Y-%m-%d'))
                self.panel_note_entry.delete("1.0", tk.END)
                self.panel_note_entry.insert("1.0", vacation.get('qeyd', ''))
                self.panel_save_button.config(text="Yadda Saxla")
            else:
                self.panel_start_cal.set_date(date.today())
                self.panel_end_cal.set_date(date.today())
                self.panel_note_entry.delete("1.0", tk.END)
                self.panel_save_button.config(text="Sorğu Göndər")
        
        self.vacation_panel_active = show
        self._animate_panel()

    def _animate_panel(self):
        self.animation_in_progress = True
        start_relx, end_relx = (1.0, 1.0 - self.PANEL_WIDTH); step = 0.05
        if self.vacation_panel_active: current_pos, target_pos, move = (self.vacation_form_panel.place_info().get('relx', start_relx), end_relx, -step)
        else: current_pos, target_pos, move = (self.vacation_form_panel.place_info().get('relx', end_relx), start_relx, step)
        new_pos = float(current_pos) + move
        if (move < 0 and new_pos <= target_pos) or (move > 0 and new_pos >= target_pos):
            new_pos, self.animation_in_progress = target_pos, False
            if not self.vacation_panel_active: self.vacation_form_panel.place_forget()
        self.vacation_form_panel.place(in_=self.tree_area_frame, relx=new_pos, rely=0, relwidth=self.PANEL_WIDTH, relheight=1)
        if self.animation_in_progress: self.after(15, self._animate_panel)

    def _save_vacation_from_panel(self):
        start_date_obj = self.panel_start_cal.get_date()
        end_date_obj = self.panel_end_cal.get_date()
        if not start_date_obj or not end_date_obj: messagebox.showerror("Xəta", "Tarixlər seçilməlidir.", parent=self.parent); return
        if end_date_obj < start_date_obj: messagebox.showerror("Xəta", "Bitmə tarixi başlanğıcdan əvvəl ola bilməz.", parent=self.parent); return

        is_edit_mode = self.current_panel_vacation is not None
        new_data = {"baslama": start_date_obj.isoformat(), "bitme": end_date_obj.isoformat(), "qeyd": self.panel_note_entry.get("1.0", tk.END).strip(), "yaradilma_tarixi": self.current_panel_vacation.get('yaradilma_tarixi', date.today().isoformat()) if is_edit_mode else date.today().isoformat()}
        if is_edit_mode: database.update_vacation(self.current_panel_vacation['db_id'], new_data, self.current_user['name'])
        else: emp_id = self.data[self.current_panel_employee]['db_id']; database.add_vacation(emp_id, self.current_panel_employee, new_data, self.current_user['role'])
        self.toggle_vacation_panel(show=False); self.load_and_refresh_data(selection_to_keep=self.current_panel_employee)

    def open_archive_view_window(self):
        archive_window = Toplevel(self); archive_window.title("Arxiv Məlumatları"); archive_window.geometry("850x500"); archive_window.transient(self); archive_window.grab_set()
        main_frame = ttk.Frame(archive_window, padding=10); main_frame.pack(fill="both", expand=True)
        top_frame = ttk.Frame(main_frame); top_frame.pack(fill='x', pady=(0, 10))
        ttk.Label(top_frame, text="İşçi seçin:").pack(side='left', padx=(0,5))
        employee_names = sorted(self.data.keys())
        emp_combo = ttk.Combobox(top_frame, values=employee_names, state="readonly", width=30); emp_combo.pack(side='left', padx=5)
        ttk.Label(top_frame, text="İli seçin:").pack(side='left', padx=(10,5))
        years = list(range(date.today().year, 2020, -1)); year_combo = ttk.Combobox(top_frame, values=years, state="readonly"); year_combo.pack(side='left', padx=5)
        summary_frame = ttk.Frame(main_frame, padding=5); summary_frame.pack(fill='x')
        results_frame = ttk.Frame(main_frame); results_frame.pack(fill='both', expand=True)
        
        def show_archive_data():
            for widget in results_frame.winfo_children(): widget.destroy()
            for widget in summary_frame.winfo_children(): widget.destroy()
            selected_name = emp_combo.get(); selected_year = year_combo.get()
            if not selected_name or not selected_year: ttk.Label(results_frame, text="Zəhmət olmasa, işçi və il seçin.").pack(pady=20); return
            employee_info = self.data[selected_name]
            archived_vacations = database.load_archived_vacations_for_year(employee_info['db_id'], int(selected_year))
            umumi_gun = employee_info.get("umumi_gun", 30)
            istifade_olunmus = sum(mezuniyyet_muddetini_hesabla(v['baslama'], v['bitme']) for v in archived_vacations if v.get('status') == 'approved' and not v.get('aktiv_deyil', False))
            qaliq_gun = umumi_gun - istifade_olunmus
            self._create_summary_labels(summary_frame, umumi_gun, istifade_olunmus, qaliq_gun)
            if not archived_vacations: ttk.Label(results_frame, text=f"{selected_year}-ci il üçün arxiv məlumatı tapılmadı.").pack(pady=20); return
            info_archive = {"name": selected_name, "goturulen_icazeler": archived_vacations}
            tree_frame = VacationTreeView(results_frame, self, info_archive, self.current_user, show_archive_data)
            tree_frame.pack(expand=True, fill='both')
        
        ttk.Button(top_frame, text="Göstər", command=show_archive_data).pack(side='left', padx=10)
        self._center_toplevel(archive_window)
