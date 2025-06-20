# vacation_tree_view.py (Düzəldilmiş çeşidləmə funksiyası ilə)

import tkinter as tk
from tkinter import ttk, messagebox
import tkinter.font as tkFont
from datetime import datetime, date
import database
from ui_components import Tooltip, get_vacation_status_and_color, mezuniyyet_muddetini_hesabla

class VacationTreeView(ttk.Frame):
    def __init__(self, parent, main_app, employee_info, current_user, refresh_callback):
        super().__init__(parent)
        self.main_app_ref = main_app 
        self.employee_info = employee_info
        self.current_user = current_user
        self.is_admin = self.current_user['role'].strip() == 'admin'
        self.refresh_callback = refresh_callback

        default_font_info = tkFont.nametofont("TkDefaultFont").actual()
        self.strikethrough_font = tkFont.Font(family=default_font_info['family'], size=default_font_info['size'], overstrike=True)

        columns = ('#', 'start_date', 'end_date', 'duration', 'status', 'countdown', 'created_at')
        self.tree = ttk.Treeview(self, columns=columns, show='headings')
        self.setup_tree_columns()
        self.tree.pack(expand=True, fill='both')

        self.populate_tree()
        self.create_context_menu()
        self.tree.bind("<Button-3>", self.show_context_menu)
        self.tree.bind("<Double-1>", self.on_double_click)

    def sort_by_column(self, col, reverse):
        """Məlumatları verilən sütuna görə çeşidləyir."""
        # --- DÜZƏLİŞ BURADADIR: Dəyərlərlə yanaşı teqləri (rəngləri) də yadda saxlayırıq ---
        data = []
        for item_id in self.tree.get_children(''):
            values = self.tree.item(item_id, 'values')
            tags = self.tree.item(item_id, 'tags')
            data.append((item_id, values, tags))

        def sort_key(item):
            values = item[1]
            col_index = self.tree["columns"].index(col)
            val = values[col_index]
            
            if col in ['start_date', 'end_date', 'created_at']:
                try: return datetime.strptime(val, '%d.%m.%Y')
                except (ValueError, TypeError): return datetime.min
            if col in ['duration', 'countdown']:
                try: return int(val.split()[0])
                except (ValueError, IndexError): return 0
            if col == '#':
                try: return int(val)
                except (ValueError, IndexError): return 0
            return str(val)

        data.sort(key=sort_key, reverse=reverse)

        for col_name in self.tree['columns']:
            current_text = self.tree.heading(col_name, 'text').replace(' ▼', '').replace(' ▲', '')
            self.tree.heading(col_name, text=current_text)
        
        arrow = ' ▼' if reverse else ' ▲'
        new_heading = self.tree.heading(col, 'text') + arrow
        self.tree.heading(col, text=new_heading)
        
        for item in self.tree.get_children(): self.tree.delete(item)
        
        # --- DÜZƏLİŞ BURADADIR: Yadda saxlanılan teqlərdən istifadə edirik ---
        for item_id, values, tags in data:
            self.tree.insert('', 'end', iid=item_id, values=values, tags=tags)

        self.tree.heading(col, command=lambda _col=col: self.sort_by_column(_col, not reverse))

    def setup_tree_columns(self):
        columns_config = {
            '#': {'text': '№', 'width': 40, 'minwidth': 30, 'anchor': 'center', 'sortable': True},
            'start_date': {'text': 'Başlanğıc', 'width': 100, 'minwidth': 90, 'anchor': 'center', 'sortable': True},
            'end_date': {'text': 'Bitmə', 'width': 100, 'minwidth': 90, 'anchor': 'center', 'sortable': True},
            'duration': {'text': 'Müddət', 'width': 80, 'minwidth': 60, 'anchor': 'center', 'sortable': True},
            'status': {'text': 'Status', 'width': 110, 'minwidth': 90, 'anchor': 'w', 'sortable': True},
            'countdown': {'text': 'Bitməsinə', 'width': 100, 'minwidth': 80, 'anchor': 'center', 'sortable': True},
            'created_at': {'text': 'Yaradılma Tarixi', 'width': 120, 'minwidth': 100, 'anchor': 'center', 'sortable': True}
        }
        
        for col, config in columns_config.items():
            self.tree.heading(col, text=config['text'])
            self.tree.column(col, width=config['width'], minwidth=config['minwidth'], anchor=config['anchor'])
            if config['sortable']:
                self.tree.heading(col, command=lambda _col=col: self.sort_by_column(_col, False))

        self.tree.tag_configure('approved_ongoing', foreground='green'); self.tree.tag_configure('approved_finished', foreground='red')
        self.tree.tag_configure('approved_planned', foreground='#007bff'); self.tree.tag_configure('pending', foreground='#E49B0F')
        self.tree.tag_configure('rejected', foreground='gray'); self.tree.tag_configure('inactive', font=self.strikethrough_font, foreground='gray')

    def populate_tree(self):
        for item in self.tree.get_children(): self.tree.delete(item)
        today = date.today()
        vacations_list = self.employee_info.get("goturulen_icazeler", [])
        
        for i, vacation in enumerate(vacations_list, start=1):
            try:
                start_date_formatted = datetime.strptime(vacation['baslama'], '%Y-%m-%d').strftime('%d.%m.%Y')
                end_date_formatted = datetime.strptime(vacation['bitme'], '%Y-%m-%d').strftime('%d.%m.%Y')
                created_at_formatted = datetime.strptime(vacation.get('yaradilma_tarixi', '1970-01-01'), '%Y-%m-%d').strftime('%d.%m.%Y')
            except (ValueError, KeyError):
                start_date_formatted = vacation['baslama']; end_date_formatted = vacation['bitme']; created_at_formatted = vacation.get('yaradilma_tarixi', '')

            is_inactive = vacation.get('aktiv_deyil', False)
            _, status_text = get_vacation_status_and_color(vacation)
            muddet = mezuniyyet_muddetini_hesabla(vacation['baslama'], vacation['bitme'])
            qalan_gun_str = ""
            if status_text == "[Davam edən]":
                try:
                    end_dt = datetime.strptime(vacation['bitme'], '%Y-%m-%d').date()
                    qalan_gun = (end_dt - today).days + 1
                    if qalan_gun > 0: qalan_gun_str = f"{qalan_gun} gün"
                except: pass
            
            tag_name = vacation.get('status', 'approved')
            if tag_name == 'approved':
                if status_text == "[Davam edən]": tag_name = "approved_ongoing"
                elif status_text == "[Bitmiş]": tag_name = "approved_finished"
                else: tag_name = "approved_planned"
            if is_inactive: tag_name = 'inactive'
            
            values = (i, start_date_formatted, end_date_formatted, f"{muddet} gün", status_text.strip("[]"), qalan_gun_str, created_at_formatted)
            self.tree.insert('', 'end', iid=vacation['db_id'], values=values, tags=(tag_name,))
        
        self.sort_by_column('start_date', False)

    def create_context_menu(self):
        self.context_menu = tk.Menu(self, tearoff=0)

    def show_context_menu(self, event):
        self.context_menu.delete(0, 'end')
        item_id = self.tree.identify_row(event.y)
        if not item_id: return
        self.tree.selection_set(item_id)
        if not self.is_admin: return
        vacation = self._get_vacation_by_id(item_id)
        if not vacation: return
        vac_status = vacation['status']; is_inactive = vacation.get('aktiv_deyil', False)
        if vac_status == 'pending':
            self.context_menu.add_command(label="Təsdiqlə", command=lambda: self._handle_request_action(item_id, 'approved'))
            self.context_menu.add_command(label="Rədd Et", command=lambda: self._handle_request_action(item_id, 'rejected'))
        self.context_menu.add_command(label="Düzəliş Et", command=lambda: self.main_app_ref.toggle_vacation_panel(show=True, employee_name=self.employee_info['name'], vacation=vacation))
        if vac_status == 'approved':
            self.context_menu.add_separator()
            toggle_label = "Deaktiv Et" if not is_inactive else "Aktiv Et"
            self.context_menu.add_command(label=toggle_label, command=lambda: self.toggle_vacation_activity(vacation))
        self.context_menu.add_separator()
        self.context_menu.add_command(label="Sorğunu Sil", command=lambda: self.delete_vacation(vacation))
        self.context_menu.post(event.x_root, event.y_root)

    def on_double_click(self, event):
        if not self.is_admin: return
        item_id = self.tree.identify_row(event.y)
        if not item_id: return
        vacation = self._get_vacation_by_id(item_id)
        if vacation: self.main_app_ref.toggle_vacation_panel(show=True, employee_name=self.employee_info['name'], vacation=vacation)

    def _get_vacation_by_id(self, item_id):
        return next((v for v in self.employee_info.get("goturulen_icazeler", []) if str(v['db_id']) == str(item_id)), None)

    def _handle_request_action(self, vac_id, new_status):
        database.update_vacation_status(vac_id, new_status, self.current_user['name']); self.refresh_callback()

    def toggle_vacation_activity(self, vacation):
        database.toggle_vacation_activity(vacation['db_id'], not vacation.get('aktiv_deyil', False), self.current_user['name']); self.refresh_callback()

    def delete_vacation(self, vacation):
        if messagebox.askyesno("Təsdiq", f"Məzuniyyət sorğusunu silmək istədiyinizə əminsiniz?", parent=self):
            database.delete_vacation(vacation['db_id'], self.current_user['name']); self.refresh_callback()
