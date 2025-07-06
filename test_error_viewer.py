# test_error_viewer_v2.py (DÜZƏLDİLMİŞ)

import tkinter as tk
# DÜZƏLİŞ BURADADIR: messagebox əlavə edildi
from tkinter import ttk, Toplevel, Text, messagebox

class AdvancedErrorViewer(Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("Xəta Jurnalı - Peşəkar Panel")
        self.geometry("1100x700")
        self.transient(parent)
        self.grab_set()

        # --- Əsas Pəncərə Hissələri ---
        top_frame = ttk.Frame(self, padding=(10, 10, 10, 0))
        top_frame.pack(fill='x')

        filter_frame = ttk.LabelFrame(top_frame, text="Filtrləmə və Axtarış", padding=10)
        filter_frame.pack(fill='x')

        # DÜZƏLİŞ: -sashrelief parametri silindi
        main_paned_window = ttk.PanedWindow(self, orient='vertical')
        main_paned_window.pack(fill='both', expand=True, padx=10, pady=10)

        list_frame = ttk.Frame(main_paned_window, padding=5)
        main_paned_window.add(list_frame, weight=2)

        details_frame = ttk.LabelFrame(main_paned_window, text="Seçilmiş Xətanın Detalları", padding=5)
        main_paned_window.add(details_frame, weight=3)
        
        # --- Filtrləmə Elementləri ---
        ttk.Label(filter_frame, text="Status:").pack(side='left', padx=(0, 5))
        self.status_filter = ttk.Combobox(filter_frame, values=["Bütün Statuslar", "Yeni", "Həll Edilib"], state="readonly")
        self.status_filter.pack(side='left', padx=5)
        self.status_filter.set("Bütün Statuslar")

        ttk.Label(filter_frame, text="İstifadəçi:").pack(side='left', padx=(10, 5))
        self.user_filter = ttk.Combobox(filter_frame, values=["Bütün İstifadəçilər", "tamara", "murad", "admin"], state="readonly")
        self.user_filter.pack(side='left', padx=5)
        self.user_filter.set("Bütün İstifadəçilər")

        ttk.Label(filter_frame, text="Axtarış:").pack(side='left', padx=(10, 5))
        self.search_var = tk.StringVar()
        search_entry = ttk.Entry(filter_frame, textvariable=self.search_var, width=30)
        search_entry.pack(side='left', padx=5, fill='x', expand=True)

        ttk.Button(filter_frame, text="Tətbiq Et", command=self.apply_filters).pack(side='left', padx=10)
        ttk.Button(filter_frame, text="Sıfırla", command=self.reset_filters).pack(side='left')

        # --- Xətalar Siyahısı (Treeview) ---
        columns = ('id', 'user', 'timestamp', 'status', 'error_type')
        self.tree = ttk.Treeview(list_frame, columns=columns, show='headings')
        
        self.tree.heading('id', text='ID', command=lambda: self.sort_by_column('id', False))
        self.tree.heading('user', text='İstifadəçi', command=lambda: self.sort_by_column('user', False))
        self.tree.heading('timestamp', text='Tarix', command=lambda: self.sort_by_column('timestamp', False))
        self.tree.heading('status', text='Status', command=lambda: self.sort_by_column('status', False))
        self.tree.heading('error_type', text='Xəta Növü', command=lambda: self.sort_by_column('error_type', False))

        self.tree.column('id', width=50, anchor='center', stretch=tk.NO)
        self.tree.column('user', width=150, anchor='w')
        self.tree.column('timestamp', width=150, anchor='center')
        self.tree.column('status', width=100, anchor='w')
        self.tree.column('error_type', width=200, anchor='w')
        
        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side='right', fill='y')
        self.tree.pack(fill='both', expand=True)
        self.tree.bind("<<TreeviewSelect>>", self.on_error_select)

        # --- Xəta Detalları (Text Widget) və İdarəetmə ---
        action_frame = ttk.Frame(details_frame)
        action_frame.pack(fill='x', pady=5)
        self.resolve_button = ttk.Button(action_frame, text="✅ Həll Edildi İşarələ", state="disabled", command=self.mark_as_resolved)
        self.resolve_button.pack(side='left', padx=(0, 10))
        self.delete_button = ttk.Button(action_frame, text="🗑 Jurnaldan Sil", state="disabled", command=self.delete_log)
        self.delete_button.pack(side='left')

        self.details_text = Text(details_frame, wrap='word', font=("Courier New", 10), relief='solid', borderwidth=1, state='disabled')
        txt_vsb = ttk.Scrollbar(details_frame, orient='vertical', command=self.details_text.yview)
        self.details_text.config(yscrollcommand=txt_vsb.set)
        txt_vsb.pack(side='right', fill='y')
        self.details_text.pack(fill='both', expand=True, pady=(5,0))
        
        self.load_errors()

    def load_errors(self):
        self.all_errors = {
            '101': {'user': 'tamara', 'timestamp': '2025-07-06 14:10:43', 'status': 'Yeni', 'error_type': 'ZeroDivisionError', 'traceback': 'Traceback (most recent call last):\n  File "app.py", line 123, in some_function\n    result = value / 0\nZeroDivisionError: division by zero'},
            '102': {'user': 'murad', 'timestamp': '2025-07-06 13:50:47', 'status': 'Yeni', 'error_type': '_tkinter.TclError', 'traceback': 'Traceback (most recent call last):\n  File "ui/main_frame.py", line 389, in _handle_system_command\n    messagebox.showwarning("Sistem Mesajı", ...)\n_tkinter.TclError: bad window path name ".!frame.!mainappframe"'},
            '103': {'user': 'tamara', 'timestamp': '2025-07-05 18:00:00', 'status': 'Həll Edilib', 'error_type': 'AttributeError', 'traceback': 'Traceback (most recent call last):\n  File "database/user_queries.py", line 50, in get_user_for_login\nAttributeError: \'NoneType\' object has no attribute \'cursor\''},
            '104': {'user': 'admin', 'timestamp': '2025-07-06 15:00:10', 'status': 'Yeni', 'error_type': 'psycopg2.OperationalError', 'traceback': 'psycopg2.OperationalError: connection to server at "example.com" (1.2.3.4), port 5432 failed: Connection timed out\n\tIs the server running on that host and accepting TCP/IP connections?'}
        }
        self.apply_filters()

    def apply_filters(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        status = self.status_filter.get()
        user = self.user_filter.get()
        search_term = self.search_var.get().lower()

        for error_id, data in self.all_errors.items():
            status_match = (status == "Bütün Statuslar") or (data['status'] == status)
            user_match = (user == "Bütün İstifadəçilər") or (data['user'] == user)
            search_match = (search_term == "") or (search_term in data['traceback'].lower())

            if status_match and user_match and search_match:
                tag = 'resolved' if data['status'] == 'Həll Edilib' else 'new'
                self.tree.insert('', 'end', iid=error_id, values=(error_id, data['user'], data['timestamp'], data['status'], data['error_type']), tags=(tag,))
        
        self.tree.tag_configure('resolved', foreground='gray')
        self.tree.tag_configure('new', foreground='red', font=("Helvetica", 10, "bold"))
        
        self.on_error_select(None)

    def reset_filters(self):
        self.status_filter.set("Bütün Statuslar")
        self.user_filter.set("Bütün İstifadəçilər")
        self.search_var.set("")
        self.apply_filters()
        
    def on_error_select(self, event):
        selected_items = self.tree.selection()
        
        self.details_text.config(state='normal')
        self.details_text.delete('1.0', tk.END)
        
        if not selected_items:
            self.resolve_button.config(state="disabled")
            self.delete_button.config(state="disabled")
        else:
            selected_id = selected_items[0]
            error_details = self.all_errors.get(selected_id)
            if error_details:
                self.details_text.insert('1.0', error_details['traceback'])
                if error_details['status'] == 'Yeni':
                    self.resolve_button.config(state="normal")
                else:
                    self.resolve_button.config(state="disabled")
                self.delete_button.config(state="normal")

        self.details_text.config(state='disabled')

    def mark_as_resolved(self):
        selected_id = self.tree.selection()[0]
        messagebox.showinfo("Uğurlu", f"Xəta {selected_id} uğurla arxivləşdirildi.", parent=self)
        self.all_errors[selected_id]['status'] = 'Həll Edilib'
        self.apply_filters()

    def delete_log(self):
        selected_id = self.tree.selection()[0]
        if messagebox.askyesno("Təsdiq", f"Xəta №{selected_id} jurnalını tamamilə silmək istədiyinizə əminsiniz?", parent=self):
            del self.all_errors[selected_id]
            self.apply_filters()
            
    def sort_by_column(self, col, reverse):
        print(f"Siyahı '{col}' sütununa görə çeşidləndi (Tərs: {reverse})")


if __name__ == "__main__":
    root = tk.Tk()
    root.title("Ana Proqram (Test üçün)")
    root.geometry("400x200")

    def open_error_viewer():
        viewer = AdvancedErrorViewer(root)

    ttk.Button(root, text="Peşəkar Xəta Panelini Aç", command=open_error_viewer).pack(expand=True)

    root.mainloop()