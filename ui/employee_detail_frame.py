# ui/employee_detail_frame.py

import tkinter as tk
from tkinter import ttk
from ui_components import mezuniyyet_muddetini_hesabla
from vacation_tree_view import VacationTreeView

class EmployeeDetailFrame(ttk.Frame):
    def __init__(self, parent, main_app_ref):
        super().__init__(parent)
        self.main_app_ref = main_app_ref # Ana pəncərəyə referans

        # Bu çərçivənin daxili, update_data ilə dinamik dolacaq
        self.header_container = ttk.Frame(self, style="Card.TFrame")
        self.header_container.pack(fill='x', padx=10)
        
        self.tree_area_frame = ttk.Frame(self)
        self.tree_area_frame.pack(expand=True, fill='both', padx=10, pady=(0, 10))
        
    def update_data(self, info, current_user):
        """Bu görünüşü seçilmiş işçinin məlumatları ilə yeniləyir."""
        # Köhnə məlumatları təmizlə
        for widget in self.header_container.winfo_children(): widget.destroy()
        for widget in self.tree_area_frame.winfo_children(): widget.destroy()

        is_admin = current_user['role'].strip() == 'admin'
        
        # Başlıq hissəsi
        title_bar = ttk.Frame(self.header_container, style="Card.TFrame")
        title_bar.pack(fill='x', pady=(5,0))
        ttk.Label(title_bar, text=info['name'], font=("Helvetica", 18, "bold"), style="Card.TLabel").pack(side='left', anchor='w')
        if is_admin:
            admin_buttons_frame = ttk.Frame(title_bar, style="Card.TFrame")
            admin_buttons_frame.pack(side='right', anchor='e')
            user_id = info['db_id']
            is_user_active = info.get("is_active", True)
            toggle_text = "Deaktiv Et" if is_user_active else "Aktiv Et"
            ttk.Button(admin_buttons_frame, text=toggle_text, command=lambda: self.main_app_ref.toggle_user_activity(user_id, not is_user_active)).pack(side='left')

        # Xülasə paneli (İllik hüquq, istifadə, qalıq)
        self.main_app_ref.show_summary_panel(self.header_container, info)
        
        # Yeni məzuniyyət düyməsi
        ttk.Button(self.header_container, text=f"✚ Yeni Məzuniyyət Əlavə Et", command=lambda: self.main_app_ref.toggle_vacation_panel(show=True, employee_name=info['name'])).pack(pady=10)
        
        # Məzuniyyət cədvəli
        tree_view = VacationTreeView(self.tree_area_frame, self.main_app_ref, info, current_user, self.main_app_ref.load_and_refresh_data)
        tree_view.pack(expand=True, fill='both')