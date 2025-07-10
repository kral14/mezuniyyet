# database_setup.py

import psycopg2
from tkinter import messagebox

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    total_vacation_days INT DEFAULT 30,
    max_sessions INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    company_code VARCHAR(100) -- YENİ SÜTUN
);
CREATE TABLE IF NOT EXISTS vacations (
    id SERIAL PRIMARY KEY, employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL, end_date DATE NOT NULL, note TEXT, status VARCHAR(50) DEFAULT 'pending',
    is_inactive BOOLEAN DEFAULT FALSE, is_archived BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY, recipient_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    message TEXT NOT NULL, related_vacation_id INT REFERENCES vacations(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS active_sessions (
    session_id UUID PRIMARY KEY, user_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    ip_address VARCHAR(100), created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, logout_time TIMESTAMP WITH TIME ZONE
);
CREATE TABLE IF NOT EXISTS system_commands (
    id SERIAL PRIMARY KEY, target_user_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL, command_value TEXT, is_executed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY, user_id INT REFERENCES employees(id) ON DELETE SET NULL,
    traceback_text TEXT NOT NULL, error_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Yeni'
);
CREATE TABLE IF NOT EXISTS app_settings (
    setting_name VARCHAR(100) PRIMARY KEY, setting_value TEXT
);
CREATE TABLE IF NOT EXISTS app_version (
    id INT PRIMARY KEY, latest_version VARCHAR(20)
);
INSERT INTO app_settings (setting_name, setting_value) VALUES ('maintenance_mode', 'false') ON CONFLICT (setting_name) DO NOTHING;
INSERT INTO app_version (id, latest_version) VALUES (1, '1.0') ON CONFLICT (id) DO NOTHING;
"""

def setup_database_schema(db_params):
    """Verilən qoşulma parametrləri ilə yeni bazada lazımi cədvəlləri yaradır."""
    try:
        conn = psycopg2.connect(**db_params)
        with conn.cursor() as cur:
            cur.execute(CREATE_TABLES_SQL)
        conn.commit()
        conn.close()
        messagebox.showinfo("Uğurlu", "Verilənlər bazası cədvəlləri uğurla yaradıldı!", icon='info')
        return True
    except psycopg2.Error as e:
        messagebox.showerror("Baza Xətası", f"Cədvəllər yaradılarkən xəta baş verdi:\n{e}", icon='error')
        return False