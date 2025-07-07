# database/__init__.py (YEKUN VƏ TAM VERSİYA)

from .connection import db_connect
from .settings_queries import * # YENİ ƏLAVƏ EDİLƏN SƏTİR
from .error_queries import * # YENİ ƏLAVƏ EDİLƏN SƏTİR
from .user_queries import (
    get_user_for_login,
    create_new_user,
    update_employee,
    delete_employee, # Əgər bu funksiya user_queries.py-dədirsə
    set_user_activity, # Əgər bu funksiya user_queries.py-dədirsə
    check_if_name_exists,
    load_data_for_user
)
from .session_queries import (
    # ...
    get_login_history,
    get_all_active_non_admin_user_ids # YENİ ƏLAVƏ EDİLDİ
)
from .vacation_queries import (
    add_vacation,
    update_vacation,
    update_vacation_status,
    delete_vacation,
    toggle_vacation_activity,
    get_all_active_vacations # YENİ ƏLAVƏ EDİLƏN SƏTİR
)

from .session_queries import (
    add_user_session,
    remove_user_session,
    get_active_session_counts,
    get_active_user_details,
    force_remove_sessions_by_user_id,
    get_login_history # get_login_history artıq buradan import olunur
)

from .notification_queries import (
    get_unread_notifications_for_user,
    get_all_notifications_for_user,
    mark_notifications_as_read,
    delete_notifications
)

from .command_queries import (
    issue_timed_logout_command,
    issue_immediate_logout_command,
    get_pending_commands,
    mark_command_as_executed
)

from .system_queries import (
    get_employees_with_archivable_vacations,
    start_new_vacation_year,
    load_archived_vacations_for_year,
    get_latest_version
)

# Qeyd: Yuxarıda sadalanan hər bir funksiyanın öz .py faylında mövcud olduğundan əmin olun.
# `delete_employee` və `set_user_activity` kimi funksiyalar əgər `user_queries.py`-də deyilsə,
# onların olduğu fayldan import edilməlidir. Mənim təlimatlarıma görə `user_queries.py`-də olmalıdırlar.