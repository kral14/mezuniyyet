import tkinter as tk
from tkinter import ttk, messagebox, Toplevel
import database
from .archive_window import ArchiveWindow
from .login_history_window import LoginHistoryWindow

class UserManagementWindow(Toplevel):
    def __init__(self, parent, main_app_ref):
        super().__init__(parent)
        self.title("Aktiv İstifadəçi İdarəetmə Paneli")
        self.geometry("950x500")
        self.transient(parent)
        self.grab_set()

        self.main_app_ref = main_app_ref
        self.selection_state = {}

        # --- Pəncərənin əsas hissələrinin yaradılması ---
        top_frame = ttk.Frame(self, padding=10)
        top_frame.pack(fill='x', side='top')

        list_frame = ttk.Frame(self, padding=10)
        list_frame.pack(expand=True, fill='both', side='top')
        
        bottom_frame = ttk.Frame(self, padding=10)
        bottom_frame.pack(fill='x', side='bottom')

        # --- Yuxarıdakı idarəetmə elementləri ---
        self.select_all_var = tk.BooleanVar()
        ttk.Checkbutton(top_frame, text="Hamısını Seç", variable=self.select_all_var, command=self.toggle_select_all).pack(side='left', padx=(0, 20))
        
        ttk.Button(top_frame, text="Siyahını Yenilə", command=self.load_active_users).pack(side='left')

        self.history_button = ttk.Button(top_frame, text="Seçilmiş İstifadəçinin Giriş Tarixçəsi", command=self.open_login_history, state="disabled")
        self.history_button.pack(side='left', padx=10)

        # "Sistemi Kilidlə/Aç" düyməsi
        maintenance_frame = ttk.Frame(top_frame)
        maintenance_frame.pack(side='right', padx=10)
        self.maintenance_status_var = tk.StringVar()
        self.maintenance_btn = ttk.Button(maintenance_frame, textvariable=self.maintenance_status_var, command=self.toggle_maintenance_mode)
        self.maintenance_btn.pack()
        self.update_maintenance_button_status() # Düymənin ilkin vəziyyətini təyin edirik

        self.status_label = ttk.Label(top_frame, text="Hazır", foreground="blue")
        self.status_label.pack(side='right')

        # --- Aktiv istifadəçilərin siyahısı üçün cədvəl (Treeview) ---
        columns = ('select', 'username', 'name', 'login_time', 'ip_address')
        self.tree = ttk.Treeview(list_frame, columns=columns, show='headings', selectmode="browse")
        
        self.tree.heading('select', text='Seç')
        self.tree.heading('username', text='İstifadəçi Adı')
        self.tree.heading('name', text='Ad, Soyad')
        self.tree.heading('login_time', text='Giriş Vaxtı')
        self.tree.heading('ip_address', text='IP Ünvan')
        
        self.tree.column('select', width=50, anchor='center', stretch=tk.NO)
        self.tree.column('username', width=120, anchor='w')
        self.tree.column('name', width=180, anchor='w')
        self.tree.column('login_time', width=150, anchor='center')
        self.tree.column('ip_address', width=120, anchor='center')
        
        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=self.tree.yview)
        hsb = ttk.Scrollbar(list_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
        
        vsb.pack(side='right', fill='y')
        hsb.pack(side='bottom', fill='x')
        self.tree.pack(side='left', expand=True, fill='both')
        
        # Cədvəl üçün hadisələri (events) təyin edirik
        self.tree.bind('<Button-1>', self.on_tree_click)
        self.tree.bind('<<TreeviewSelect>>', self.on_row_select)

        # --- Aşağıdakı idarəetmə düymələri ---
        force_logout_btn = ttk.Button(bottom_frame, text="Seçilənləri Dərhal Sistemdən At", command=self.force_logout_selected)
        force_logout_btn.pack(side='left', padx=(0, 20))
        
        timed_logout_frame = ttk.LabelFrame(bottom_frame, text="Vaxtla Çıxış")
        timed_logout_frame.pack(side='left', fill='x')
        self.time_entry = ttk.Entry(timed_logout_frame, width=5)
        self.time_entry.pack(side='left', padx=5)
        self.time_entry.insert(0, "5")
        ttk.Label(timed_logout_frame, text="dəqiqə sonra sistemdən at").pack(side='left')
        ttk.Button(timed_logout_frame, text="Əmri Göndər", command=self.timed_logout_selected).pack(side='left', padx=5)

        # Pəncərə açılan kimi aktiv istifadəçiləri yükləyirik
        self.load_active_users()
    def update_maintenance_button_status(self):
        """Sistemin kilidli olub-olmamağına görə düymənin mətnini və rəngini dəyişir."""
        is_locked = database.get_maintenance_mode()
        if is_locked:
            self.maintenance_status_var.set("🔴 Sistemi AÇ")
            # Stil də əlavə etmək olar
        else:
            self.maintenance_status_var.set("🟢 Sistemi KİLİDLƏ")

    def toggle_maintenance_mode(self):
        """Texniki iş rejimini aktiv/deaktiv edir və istifadəçiləri sistemdən atır."""
        is_currently_locked = database.get_maintenance_mode()
        new_status = not is_currently_locked
        
        status_text = "kilidləmək" if new_status else "açmaq"
        if messagebox.askyesno("Təsdiq", f"Sistemi digər istifadəçilər üçün {status_text} istədiyinizə əminsiniz?\n(Adminlər giriş edə biləcək)", parent=self):
            database.set_maintenance_mode(new_status)
            
            # Əgər sistem KİLİDLƏNİRSƏ, bütün aktiv istifadəçiləri sistemdən ataq
            if new_status is True:
                non_admin_ids = database.get_all_active_non_admin_user_ids()
                if non_admin_ids:
                    database.issue_immediate_logout_command(non_admin_ids)
                    database.force_remove_sessions_by_user_id(non_admin_ids)
                    messagebox.showinfo("Əməliyyat Uğurlu", f"Sistem kilidləndi və {len(non_admin_ids)} aktiv istifadəçi üçün çıxış əmri göndərildi.")
                else:
                    messagebox.showinfo("Əməliyyat Uğurlu", "Sistem kilidləndi. Aktiv istifadəçi tapılmadı.")

            self.update_maintenance_button_status()
    def on_row_select(self, event):
        selected_items = self.tree.selection()
        self.history_button.config(state="normal" if len(selected_items) == 1 else "disabled")

    def open_login_history(self):
        selected_items = self.tree.selection()
        if not selected_items: return
        user_id = int(selected_items[0])
        username = self.tree.item(selected_items[0])['values'][1]
        win = LoginHistoryWindow(self, user_id, username)
        self.main_app_ref._center_toplevel(win)

    def on_tree_click(self, event):
        region = self.tree.identify_region(event.x, event.y)
        if region != "cell": return
        column_id = self.tree.identify_column(event.x)
        if column_id == '#1':
            item_id = self.tree.identify_row(event.y)
            if not item_id: return
            user_id = int(item_id)
            self.selection_state[user_id] = not self.selection_state.get(user_id, False)
            self.update_row_visuals(item_id)
            self.update_select_all_checkbox_state()

    def toggle_select_all(self):
        is_selected = self.select_all_var.get()
        for item_id in self.tree.get_children():
            user_id = int(item_id)
            self.selection_state[user_id] = is_selected
            self.update_row_visuals(item_id)
            
    def update_row_visuals(self, item_id):
        user_id = int(item_id)
        is_selected = self.selection_state.get(user_id, False)
        current_values = list(self.tree.item(item_id, 'values'))
        current_values[0] = '[✓]' if is_selected else '[ ]'
        self.tree.item(item_id, values=tuple(current_values))
        
    def update_select_all_checkbox_state(self):
        if not self.selection_state:
            self.select_all_var.set(False)
            return
        all_selected = all(self.selection_state.values())
        self.select_all_var.set(all_selected)

    def load_active_users(self):
        self.status_label.config(text="Məlumatlar yüklənir...")
        self.after(100, self._load_data_from_db)

    def _load_data_from_db(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.selection_state.clear()
        
        active_users = database.get_active_user_details()
        for user in active_users:
            user_id = user['user_id']
            self.selection_state[user_id] = False
            login_time_str = user['login_time'].strftime('%d.%m.%Y %H:%M:%S') if user.get('login_time') else 'Bilinmir'
            self.tree.insert('', 'end', values=('[ ]', user['username'], user['name'], login_time_str, user['ip_address']), iid=user_id)
        
        self.status_label.config(text="Hazır", foreground="blue")
        self.update_select_all_checkbox_state()
        self.history_button.config(state="disabled")

    def get_selected_user_ids(self):
        selected_ids = [user_id for user_id, is_selected in self.selection_state.items() if is_selected]
        if not selected_ids:
            messagebox.showwarning("Seçim Yoxdur", "Zəhmət olmasa, əməliyyat üçün ən az bir istifadəçi seçin.", parent=self)
            return None
        return selected_ids

    def force_logout_selected(self):
        selected_ids = self.get_selected_user_ids()
        if selected_ids:
            if messagebox.askyesno("Təsdiq", f"{len(selected_ids)} istifadəçini dərhal sistemdən atmaq istədiyinizə əminsiniz?", parent=self):
                database.issue_immediate_logout_command(selected_ids)
                result = database.force_remove_sessions_by_user_id(selected_ids)
                if result:
                    messagebox.showinfo("Uğurlu", f"{len(selected_ids)} istifadəçi üçün çıxış əmri göndərildi və sessiyaları silindi.", parent=self)
                    self.load_active_users()
    
    def timed_logout_selected(self):
        selected_ids = self.get_selected_user_ids()
        if not selected_ids: return
        try:
            minutes = int(self.time_entry.get())
            if minutes <= 0: raise ValueError
        except ValueError:
            messagebox.showerror("Xəta", "Zəhmət olmasa, dəqiqə üçün müsbət bir rəqəm daxil edin.", parent=self)
            return
            
        if messagebox.askyesno("Təsdiq", f"Seçilmiş {len(selected_ids)} istifadəçi üçün {minutes} dəqiqə sonra sistemdən atma əmri göndərilsin?", parent=self):
            success_count = database.issue_timed_logout_command(selected_ids, minutes)
            if success_count > 0:
                messagebox.showinfo("Əmr Göndərildi", f"{success_count} istifadəçi üçün əmr uğurla göndərildi.", parent=self)