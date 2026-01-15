import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Tabs, Tab, Avatar, Button,
    Grid, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, IconButton, CircularProgress, Tooltip, Menu, TableSortLabel, Checkbox, InputAdornment,
    Snackbar, Alert, useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, CheckCircle, Cancel, CalendarToday, Edit, Refresh } from '@mui/icons-material';
import api from '../services/api';
import TableToolbar from '../components/TableToolbar';
import { useNotification } from '../context/NotificationContext';
import EditEmployeeModal from '../components/EditEmployeeModal';

const EmployeeDetails = () => {
    const { id } = useParams();
    const { showNotification } = useNotification();
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const highlightId = new URLSearchParams(location.search).get('highlight');

    const [employee, setEmployee] = useState(null);
    const [vacations, setVacations] = useState([]);
    const [stats, setStats] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const isAdmin = currentUser?.role === 'admin';

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleAdminEditSave = async (type, data) => {
        try {
            setSaving(true);
            if (type === 'profile') {
                const res = await api.adminUpdateEmployee(id, data);
                console.log("DEBUG: Admin update response:", res);
                showNotification("Məlumatlar uğurla yeniləndi!", "success");
            } else if (type === 'password') {
                await api.adminChangePassword(id, data);
                showNotification("Şifrə uğurla dəyişdirildi!", "success");
            }
            setEditModalOpen(false);
            loadData();
        } catch (err) {
            console.error("Edit error:", err);
            showNotification("Xəta baş verdi: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    // Selection State
    const [selected, setSelected] = useState([]);

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // Refs for hidden date pickers
    const startDatePickerRef = useRef(null);
    const endDatePickerRef = useRef(null);
    // Refs for text inputs
    const startDateInputRef = useRef(null);
    const endDateInputRef = useRef(null);

    const handleDatePickerChange = (field, event) => {
        const dateVal = event.target.value; // YYYY-MM-DD
        if (!dateVal) return;
        const [y, m, d] = dateVal.split('-');
        const formatted = `${d}.${m}.${y}`;
        setNewVacation(prev => ({ ...prev, [field]: formatted }));
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = vacations.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        // Check for multi-select modifier (Ctrl or Command) OR if target is checkbox
        const isMultiSelect = event.ctrlKey || event.metaKey || event.target.type === 'checkbox';

        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (isMultiSelect) {
            // Standard toggle behavior
            if (selectedIndex === -1) {
                newSelected = newSelected.concat(selected, id);
            } else if (selectedIndex === 0) {
                newSelected = newSelected.concat(selected.slice(1));
            } else if (selectedIndex === selected.length - 1) {
                newSelected = newSelected.concat(selected.slice(0, -1));
            } else if (selectedIndex > 0) {
                newSelected = newSelected.concat(
                    selected.slice(0, selectedIndex),
                    selected.slice(selectedIndex + 1),
                );
            }
        } else {
            // Single select behavior: Select ONLY this one (unless it was already selected, then maybe keep it?)
            // User requested: "bir setirden digerine kecende o setirin secimi legv olmalidi"
            newSelected = [id];
        }

        setSelected(newSelected);
    };

    const handleBulkDelete = () => {
        if (!selected.length) return;

        // Validation: Cannot delete approved vacations
        const hasApproved = vacations.some(v => selected.includes(v.id) && v.status === 'approved');
        if (hasApproved) {
            showNotification("Təsdiqlənmiş məzuniyyəti silmək olmaz!", "error");
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Silinmə Təsdiqi',
            message: `${selected.length} məzuniyyəti silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`,
            onConfirm: async () => {
                console.log("Bulk Delete Confirmed. Deleting IDs:", selected);
                try {
                    const results = await Promise.all(selected.map(id => {
                        console.log(`Deleting vacation ID: ${id}`);
                        return api.deleteVacation(id);
                    }));
                    console.log("Bulk Delete Results:", results);
                    showNotification("Seçilənlər uğurla silindi!", "success");
                    setSelected([]);
                    loadData();
                } catch (err) {
                    console.error("Bulk delete error:", err);
                    showNotification("Silinmə xətası: " + err.message, "error");
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    const handleBulkArchive = () => {
        if (!selected.length) return;

        // Filter selected vacations
        const selectedVacations = vacations.filter(v => selected.includes(v.id));

        // Validation: Only approved vacations can be archived (backend restriction usually, but let's check)
        const hasNonApproved = selectedVacations.some(v => v.status !== 'approved');
        if (hasNonApproved) {
            showNotification("Yalnız təsdiqlənmiş (Approved) sorğular arxivlənə bilər.", "warning");
            return;
        }

        // Get unique years
        const years = [...new Set(selectedVacations.map(v => new Date(v.start_date).getFullYear()))];

        setConfirmDialog({
            open: true,
            title: 'Arxivləmə Təsdiqi',
            message: `Diqqət: Siz ${selected.length} sorğunu arxivləmək istəyirsiniz.\nSistem seçilmiş illər (${years.join(', ')}) üzrə bütün təsdiqlənmiş sorğuları arxivləyəcək.\nDavam edilsin?`,
            onConfirm: async () => {
                try {
                    await Promise.all(years.map(year =>
                        api.archiveVacations({ year: year.toString(), employee_ids: [parseInt(id)] })
                    ));
                    showNotification("Seçilənlər uğurla arxivləndi!", "success");
                    setSelected([]);
                    loadData(); // Reload to see updates (archived items might disappear if endpoint filters them out)
                } catch (err) {
                    console.error("Archive error:", err);
                    showNotification("Arxivləmə xətası: " + (err.response?.data || err.message), "error");
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        if (!vacations || vacations.length === 0) {
            showNotification("Export ediləcək məlumat yoxdur.", "warning");
            return;
        }

        // CSV Header
        let csvContent = "ID,Baslama Tarixi,Bitme Tarixi,Gun Sayi,Nov,Status\n";

        // CSV Rows
        vacations.forEach(row => {
            const rowStr = [
                row.id,
                formatDate(row.start_date),
                formatDate(row.end_date),
                row.days_count,
                row.vacation_type === 'paid' ? 'Ödənişli' : row.vacation_type === 'sick' ? 'Xəstəlik' : 'Ödənişsiz',
                row.status === 'approved' ? 'Təsdiqlənib' : row.status === 'rejected' ? 'İmtina' : 'Gözləmədə'
            ].join(",");
            csvContent += rowStr + "\n";
        });

        // Use Blob with BOM for Excel UTF-8 compatibility
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `mezuniyyetler_${employee?.first_name || 'export'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Delay revoke to ensure download starts with correct name
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    };

    // Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [newVacation, setNewVacation] = useState({
        start_date: '',
        end_date: '',
        vacation_type: 'paid', // paid, unpaid, sick
        days_count: 0,
        status: currentUser?.role === 'admin' ? 'approved' : 'pending'
    });

    // Edit Dialog State
    const [editDialog, setEditDialog] = useState(false);
    const [editVacation, setEditVacation] = useState({
        id: null,
        start_date: '',
        end_date: '',
        vacation_type: 'paid',
        status: 'pending',
        days_count: 0
    });

    // Edit Date Picker Refs
    const editStartDatePickerRef = useRef(null);
    const editEndDatePickerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    // Helper: Smart Date Parsing (Returns DD.MM.YYYY)
    const parseSmartDate = (value) => {
        if (!value) return value;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1-12

        // Clean input
        let clean = value.trim();

        // Case 1: Just Day ("10") -> 10.MM.YYYY
        if (/^\d{1,2}$/.test(clean)) {
            const day = parseInt(clean, 10);
            return `${String(day).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`;
        }

        // Case 2: Day.Month ("10.11", "10/11", "10-11") -> 10.11.YYYY
        if (/^\d{1,2}[./-]\d{1,2}$/.test(clean)) {
            const [d, m] = clean.split(/[./-]/);
            return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${currentYear}`;
        }

        // Case 3: Full Date ("10.11.2025") -> 10.11.2025 (normalize separators)
        if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(clean)) {
            const [d, m, y] = clean.split(/[./-]/);
            return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
        }

        return value; // Return original if no match
    };

    // Helper: Calculate Timer/Status Text
    // Helper: Calculate Timer/Status Text & Color
    const getTimerInfo = (vacation) => {
        if (vacation.status !== 'approved') return { text: '-', color: 'text.disabled' };

        // Parse dates (assuming YYYY-MM-DD from API)
        const start = new Date(vacation.start_date);
        const end = new Date(vacation.end_date);
        const today = new Date();

        // Reset time parts for accurate day comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (today < start) {
            // Future
            return { text: "Planlaşdırılıb", color: "warning.main" }; // Yellow/Orange
        } else if (today >= start && today <= end) {
            // Ongoing
            const diffTime = Math.abs(end - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { text: `${diffDays} gün`, color: "success.main" }; // Green
        } else {
            // Past
            return { text: "Bitib", color: "error.main" }; // Red (from previous task)
        }
    };

    const handleSmartDateChange = (field, value, isBlur) => {
        // On change (typing), just update the raw value
        if (!isBlur) {
            setNewVacation(prev => ({ ...prev, [field]: value }));
            return;
        }

        // On blur, try to parse/format it
        const formatted = parseSmartDate(value);
        setNewVacation(prev => ({ ...prev, [field]: formatted }));
    };

    const handleKeyDown = (event, field) => {
        // Submit on Ctrl + Enter
        if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
            event.preventDefault();

            const currentValue = event.target.value;
            const formatted = parseSmartDate(currentValue);

            // Create a temporary object with the NEW value
            let tempVacation = { ...newVacation, [field]: formatted };

            // Recalculate days_count manually because useEffect won't run in time for submission
            if (tempVacation.start_date && tempVacation.end_date) {
                const parseLocal = (s) => {
                    if (!s || !s.includes('.')) return NaN;
                    const [d, m, y] = s.split('.').map(Number);
                    return new Date(y, m - 1, d);
                };

                const start = parseLocal(tempVacation.start_date);
                const end = parseLocal(tempVacation.end_date);

                if (!isNaN(start) && !isNaN(end) && end >= start) {
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    tempVacation.days_count = diffDays;
                } else {
                    tempVacation.days_count = 0;
                }

                // Update state and submit
                setNewVacation(tempVacation);
                handleCreateVacation(tempVacation);
            } else {
                showNotification("Zəhmət olmasa bütün xanaları (Başlanğıc və Bitmə) doldurun.", "warning");
            }
            return;
        }

        // If Enter is pressed, move focus or blur
        if (event.keyCode === 13) {
            event.preventDefault();
            if (field === 'start_date' && endDateInputRef.current) {
                endDateInputRef.current.focus();
            } else {
                event.target.blur();
            }
            return;
        }

        // Allow: backspace, delete, tab, escape, period
        if ([46, 8, 9, 27, 110, 190].indexOf(event.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Command+A
            ((event.ctrlKey === true || event.metaKey === true) && [65, 67, 86, 88].indexOf(event.keyCode) !== -1) ||
            // Allow: home, end, left, right, down, up
            (event.keyCode >= 35 && event.keyCode <= 40)) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
            event.preventDefault();
        }
    };

    // Auto-calculate Duration
    useEffect(() => {
        if (newVacation.start_date && newVacation.end_date) {
            // FIX: Parse DD.MM.YYYY
            const parseLocal = (s) => {
                if (!s || !s.includes('.')) return NaN;
                const [d, m, y] = s.split('.').map(Number);
                return new Date(y, m - 1, d);
            };

            const start = parseLocal(newVacation.start_date);
            const end = parseLocal(newVacation.end_date);

            if (!isNaN(start) && !isNaN(end) && end >= start) {
                // Calculate difference in days (inclusive)
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setNewVacation(prev => ({ ...prev, days_count: diffDays }));
            } else {
                setNewVacation(prev => ({ ...prev, days_count: 0 }));
            }
        }
    }, [newVacation.start_date, newVacation.end_date]);


    const loadData = async () => {
        if (!id) return;
        // No more full-screen loading for "instant" feel
        // We only clear if context/employee changes significantly
        try {
            const user = api.getCurrentUser();
            setCurrentUser(user);

            // Fetch everything in ONE call
            const data = await api.getFullEmployeeDetails(id);

            if (data) {
                setEmployee(data.employee);
                setVacations(data.vacations);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error loading full details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Sorting State and Handlers
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('id');

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const descendingComparator = (a, b, orderBy) => {
        if (b[orderBy] < a[orderBy]) return -1;
        if (b[orderBy] > a[orderBy]) return 1;
        return 0;
    };

    const getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    };

    // Date Formatter
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}.${m}.${y}`;
    };

    const headCells = [
        { id: 'id', label: 'Sorğu №', width: '10%' },
        { id: 'created_at', label: 'Yaradılma Tarixi', width: '15%' }, // New
        { id: 'start_date', label: 'Başlama Tarixi', width: '15%' },
        { id: 'end_date', label: 'Bitmə Tarixi', width: '15%' },
        { id: 'days_count', label: 'Gün', width: '5%' },
        { id: 'vacation_type', label: 'Növ', width: '15%' },
        { id: 'status', label: 'Status', width: '10%' },
        { id: 'timer', label: 'Qalıq gün', width: '15%' } // Updated
    ];

    useEffect(() => {
        loadData();

        const handleRealtimeUpdate = () => {
            console.log("🔔 Real-time update signal received. Refreshing table...");
            loadData();
        };

        window.addEventListener('notification-update', handleRealtimeUpdate);
        window.addEventListener('vacation-update', handleRealtimeUpdate);

        return () => {
            window.removeEventListener('notification-update', handleRealtimeUpdate);
            window.removeEventListener('vacation-update', handleRealtimeUpdate);
        };
    }, [id]);

    // Scroll to highlight
    useEffect(() => {
        if (highlightId && vacations.length > 0) {
            setTabValue(0); // Ensure Vacations tab is active

            // Slight delay to ensure render
            setTimeout(() => {
                const el = document.getElementById(`vacation-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, [highlightId, vacations]);

    const handleCreateVacation = async (dataOverride = null) => {
        const dataToUse = dataOverride || newVacation;
        try {
            // Convert DD.MM.YYYY -> YYYY-MM-DD for backend
            const formatDateForApi = (dateStr) => {
                if (!dateStr) return '';
                const [d, m, y] = dateStr.split('.');
                return `${y}-${m}-${d}`;
            };

            const startDateStr = formatDateForApi(dataToUse.start_date);
            const endDateStr = formatDateForApi(dataToUse.end_date);
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);

            // Client-side Validation: Check for Overlaps
            // Only check properly formatted dates
            if (!isNaN(start) && !isNaN(end)) {
                // Filter out non-active vacations if necessary (e.g. rejected ones don't count?)
                // Usually we care about approved or pending.
                const activeVacations = vacations.filter(v => v.status !== 'rejected');

                const hasOverlap = activeVacations.some(v => {
                    const vStart = new Date(v.start_date); // API returns YYYY-MM-DD
                    const vEnd = new Date(v.end_date);

                    // Reset times
                    vStart.setHours(0, 0, 0, 0);
                    vEnd.setHours(0, 0, 0, 0);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);

                    // Check overlap: (StartA <= EndB) and (EndA >= StartB)
                    return (start <= vEnd && end >= vStart);
                });

                if (hasOverlap) {
                    showNotification("Seçilən tarixlərdə artıq mövcud məzuniyyət var!", "error");
                    return; // STOP
                }
            }

            await api.createVacation({
                employee_id: parseInt(id),
                ...dataToUse,
                start_date: formatDateForApi(dataToUse.start_date),
                end_date: formatDateForApi(dataToUse.end_date),
                status: isAdmin ? 'approved' : 'pending'
            });
            setOpenDialog(false);
            setNewVacation({ start_date: '', end_date: '', vacation_type: 'paid', days_count: 0 }); // Reset
            loadData(); // Refresh
        } catch (err) {
            let msg = err.message || err.toString();
            // Clean up the "Server Error: 400 Bad Request - " part
            if (msg.includes('Server Error:')) {
                const parts = msg.split(' - ');
                if (parts.length > 1) {
                    msg = parts[1]; // Get the actual message after dash
                } else {
                    msg = msg.replace('Server Error:', '').trim();
                }
            }
            showNotification(msg, "error");
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState(null); // Stores ID of vacation to delete

    const handleDeleteVacation = (vacId) => {
        const vacation = vacations.find(v => v.id === vacId);
        if (vacation && vacation.status === 'approved') {
            showNotification("Təsdiqlənmiş məzuniyyəti silmək olmaz!", "error");
            return;
        }
        console.log("Requesting delete for:", vacId);
        setDeleteConfirmation(vacId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;

        const vacId = deleteConfirmation;
        console.log("Confirmed delete for:", vacId);

        try {
            await api.deleteVacation(vacId);
            console.log("Delete success");
            showNotification("Məzuniyyət uğurla silindi!", "success");
            loadData();
        } catch (err) {
            console.error("Delete error:", err);
            showNotification("Silinmə xətası: " + (err.message || err), "error");
        } finally {
            setDeleteConfirmation(null);
        }
    };

    const handleUpdateStatus = async (vacId, status) => {
        try {
            await api.updateVacationStatus(vacId, status);
            loadData();
        } catch (err) {
            showNotification("Status dəyişmə xətası: " + err, "error");
        }
    };

    // Status Menu State
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
    const [selectedVacationId, setSelectedVacationId] = useState(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);
    const [contextMenuVacation, setContextMenuVacation] = useState(null);

    const handleContextMenu = (event, vacation) => {
        event.preventDefault(); // BLOCK DEFAULT BROWSER MENU
        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 6,
                }
                : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                null,
        );
        setContextMenuVacation(vacation);
    };

    const handleContextMenuClose = () => {
        setContextMenu(null);
        setContextMenuVacation(null);
    };

    const handleViewInCalendar = () => {
        if (contextMenuVacation) {
            // Navigate to Home with params
            // Format start_date for URL if needed, but assuming YYYY-MM-DD or similar from DB
            navigate(`/dashboard/home?focusDate=${contextMenuVacation.start_date}&highlightVac=${contextMenuVacation.id}`);
        }
        handleContextMenuClose();
    };

    const handleStatusClick = (event, vacId) => {
        if (!isAdmin) return;
        setStatusMenuAnchor(event.currentTarget);
        setSelectedVacationId(vacId);
    };

    const handleStatusMenuClose = () => {
        setStatusMenuAnchor(null);
        setSelectedVacationId(null);
    };

    const handleEditClick = (vacation) => {
        setEditVacation({
            id: vacation.id,
            start_date: formatDate(vacation.start_date), // Convert YYYY-MM-DD -> DD.MM.YYYY
            end_date: formatDate(vacation.end_date),
            vacation_type: vacation.vacation_type || 'paid',
            days_count: vacation.days_count || 0,
            status: vacation.status || 'pending'
        });
        setEditDialog(true);
    };

    const handleEditSave = async () => {
        try {
            // Convert DD.MM.YYYY -> YYYY-MM-DD for backend
            const formatDateForApi = (dateStr) => {
                if (!dateStr) return '';
                const [d, m, y] = dateStr.split('.');
                return `${y}-${m}-${d}`;
            };

            await api.updateVacation(editVacation.id, {
                start_date: formatDateForApi(editVacation.start_date),
                end_date: formatDateForApi(editVacation.end_date),
                vacation_type: editVacation.vacation_type,
                status: editVacation.status
            });

            setEditDialog(false);
            loadData();

            showNotification("Məzuniyyət uğurla yeniləndi!", "success");
        } catch (err) {
            showNotification("Xəta: " + err, "error");
        }
    };

    const handleEditSmartDateChange = (field, value, isBlur) => {
        if (!isBlur) {
            setEditVacation(prev => ({ ...prev, [field]: value }));
            return;
        }
        const formatted = parseSmartDate(value);
        setEditVacation(prev => ({ ...prev, [field]: formatted }));
    };

    const handleEditDatePickerChange = (field, event) => {
        const dateVal = event.target.value;
        if (!dateVal) return;
        const [y, m, d] = dateVal.split('-');
        const formatted = `${d}.${m}.${y}`;
        setEditVacation(prev => ({ ...prev, [field]: formatted }));
    };

    // Calculate duration for Edit Mode
    useEffect(() => {
        if (editDialog && editVacation.start_date && editVacation.end_date) {
            const parseLocal = (s) => {
                if (!s || !s.includes('.')) return NaN;
                const [d, m, y] = s.split('.').map(Number);
                return new Date(y, m - 1, d);
            };
            const start = parseLocal(editVacation.start_date);
            const end = parseLocal(editVacation.end_date);

            if (!isNaN(start) && !isNaN(end) && end >= start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setEditVacation(prev => ({ ...prev, days_count: diffDays }));
            } else {
                setEditVacation(prev => ({ ...prev, days_count: 0 }));
            }
        }
    }, [editVacation.start_date, editVacation.end_date, editDialog]);

    const handleMenuStatusChange = (status) => {
        if (selectedVacationId) {
            handleUpdateStatus(selectedVacationId, status);
        }
        handleStatusMenuClose();
    };

    if (!id) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                sx={{
                    background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f8fafc 100%)',
                    textAlign: 'center',
                    p: 3
                }}
            >
                <Box
                    sx={{
                        mb: 4,
                        position: 'relative',
                        animation: 'float 6s ease-in-out infinite',
                        '@keyframes float': {
                            '0%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-20px)' },
                            '100%': { transform: 'translateY(0px)' }
                        }
                    }}
                >
                    <Box sx={{
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 20px 50px rgba(59, 130, 246, 0.15)'
                    }}>
                        <Box sx={{ fontSize: '6rem' }}>👋</Box>
                    </Box>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -10,
                            right: -10,
                            bgcolor: 'white',
                            p: 2,
                            borderRadius: 4,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            animation: 'bounce 2s infinite',
                            '@keyframes bounce': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-5px)' }
                            }
                        }}
                    >
                        <Typography variant="body2" fontWeight="bold" color="primary">İşçi Seçin</Typography>
                    </Box>
                </Box>

                <Typography variant="h3" fontWeight="800" sx={{ mb: 2, background: 'linear-gradient(45deg, #1e293b, #3b82f6)', backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Xoş Gəldiniz!
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mb: 4, lineHeight: 1.6 }}>
                    İşçilərin məlumatlarına baxmaq, məzuniyyətləri idarə etmək və statusları dəyişmək üçün sol tərəfdəki siyahıdan seçim edin.
                </Typography>

                <Box display="flex" gap={2}>
                    <Chip icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} label="Sürətli Axtarış" sx={{ bgcolor: 'white', py: 2, px: 1, boxShadow: 1 }} />
                    <Chip icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} label="Detallı Statistika" sx={{ bgcolor: 'white', py: 2, px: 1, boxShadow: 1 }} />
                    <Chip icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} label="Asan İdarəetmə" sx={{ bgcolor: 'white', py: 2, px: 1, boxShadow: 1 }} />
                </Box>
            </Box>
        );
    }

    if (!employee && isLoading) return <Typography p={4} align="center">Yüklənir...</Typography>;
    if (!employee && !isLoading) return <Typography p={4} align="center">İşçi məlumatları tapılmadı.</Typography>;

    const fullName = (employee.first_name && employee.last_name)
        ? `${employee.first_name} ${employee.last_name}`.toUpperCase()
        : (employee.name || employee.username).toUpperCase();
    const isOwner = currentUser?.id === parseInt(id);

    if (!isAdmin && !isOwner) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="70vh">
                <Cancel sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" fontWeight="bold">Giriş Qadağandır</Typography>
                <Typography color="text.secondary">Sizin başqa işçinin məlumatlarını görmək hüququnuz yoxdur.</Typography>
                <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate('/dashboard/home')}>Panelə Qayıt</Button>
            </Box>
        );
    }

    // Calculate temporary remaining balance for preview
    const tempRemaining = stats ? stats.remaining - (newVacation.days_count || 0) : 0;



    const handleBulkStatusChange = (newStatus) => {
        if (!selected.length) return;

        const actionName = newStatus === 'approved' ? 'təsdiqləmək' : 'imtina etmək';

        setConfirmDialog({
            open: true,
            title: 'Status Dəyişikliyi',
            message: `Seçilmiş ${selected.length} sorğunu ${actionName} istədiyinizə əminsiniz?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selected.map(id => api.updateVacation(id, { status: newStatus })));
                    showNotification("Statuslar uğurla yeniləndi!", "success");
                    setSelected([]);
                    loadData();
                } catch (err) {
                    console.error("Bulk update error:", err);
                    showNotification("Səhv baş verdi: " + err.message, "error");
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Animation Style */}
            <style>
                {`
                @keyframes flash {
                    0% { background-color: rgba(255, 235, 59, 0.4); } 
                    50% { background-color: rgba(255, 235, 59, 0.4); }
                    100% { background-color: transparent; }
                }
                `}
            </style>

            {/* Header Profile Card */}
            <Paper elevation={0} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {/* Cover Area */}
                <Box
                    sx={{
                        height: 80,
                        background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                        position: 'relative'
                    }}
                />

                <Box px={3} pb={2}>
                    <Box display="flex" alignItems="flex-end" gap={2} mt={-4}>
                        <Avatar
                            src={api.getImageUrl(employee?.profile_image)}
                            sx={{
                                width: 90, height: 90,
                                bgcolor: 'rgba(255,255,255,0.1)', // Neutral background
                                fontSize: '2.5rem',
                                border: '4px solid white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: 'primary.main'
                            }}
                        >
                            {fullName.charAt(0)}
                        </Avatar>
                        <Box flex={1} mb={0.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h5" fontWeight="800" sx={{ color: '#1e293b' }}>{employee?.name}</Typography>
                                {employee.is_active ? (
                                    <Chip label="Aktiv" color="success" size="small" sx={{ fontWeight: 'bold', height: 24 }} />
                                ) : (
                                    <Chip label="Deaktiv" color="error" size="small" sx={{ fontWeight: 'bold', height: 24 }} />
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {employee.position} &bull; <span style={{ color: '#64748b' }}>{employee.department}</span>
                            </Typography>
                        </Box>
                        <Box mb={1} display="flex" gap={2} alignItems="center">
                            {/* Stats Inline */}
                            {stats && (
                                <Box display="flex" gap={2} mr={2}>
                                    {/* Total Card */}
                                    <Box sx={{
                                        textAlign: 'center',
                                        px: 2, py: 1,
                                        bgcolor: '#eff6ff',
                                        borderRadius: 2,
                                        border: '1px solid rgba(59, 130, 246, 0.1)'
                                    }}>
                                        <Typography variant="caption" color="primary" fontWeight="bold" sx={{ opacity: 0.8 }}>ÜMUMİ</Typography>
                                        <Typography variant="h6" color="primary" fontWeight="bold" sx={{ lineHeight: 1 }}>{stats.total_days_given}</Typography>
                                    </Box>

                                    {/* Remaining Card */}
                                    <Box sx={{
                                        textAlign: 'center',
                                        px: 2, py: 1,
                                        bgcolor: '#f0fdf4',
                                        borderRadius: 2,
                                        border: '1px solid rgba(34, 197, 94, 0.1)'
                                    }}>
                                        <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ opacity: 0.8 }}>QALIQ</Typography>
                                        <Typography variant="h6" color="success.main" fontWeight="bold" sx={{ lineHeight: 1 }}>{stats.remaining}</Typography>
                                    </Box>

                                    {/* Used Card */}
                                    <Box sx={{
                                        textAlign: 'center',
                                        px: 2, py: 1,
                                        bgcolor: '#fef2f2',
                                        borderRadius: 2,
                                        border: '1px solid rgba(239, 68, 68, 0.1)'
                                    }}>
                                        <Typography variant="caption" color="error.main" fontWeight="bold" sx={{ opacity: 0.8 }}>İSTİFADƏ</Typography>
                                        <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ lineHeight: 1 }}>{stats.used_paid}</Typography>
                                    </Box>
                                </Box>
                            )}

                            {isAdmin && (
                                <Button
                                    variant="contained"
                                    startIcon={<Edit />}
                                    onClick={() => setEditModalOpen(true)}
                                    size="small"
                                    sx={{
                                        borderRadius: '50px',
                                        px: 3,
                                        boxShadow: '0 4px 10px rgba(234, 179, 8, 0.3)',
                                        bgcolor: '#f59e0b',
                                        '&:hover': { bgcolor: '#d97706' }
                                    }}
                                >
                                    Düzəliş
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Məzuniyyətlər" />
                    <Tab label="Şəxsi Məlumatlar" />
                </Tabs>
            </Box>

            {/* Tab 0: Vacations */}
            {tabValue === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {/* Stats Cards */}


                    {/* Toolbar & Table */}
                    <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <TableToolbar
                            numSelected={selected.length}
                            title="Tarixçə"
                            onAdd={() => setOpenDialog(true)}
                            onDelete={handleBulkDelete}
                            onPrint={handlePrint}
                            onExport={handleExport}
                            onApprove={isAdmin ? () => handleBulkStatusChange('approved') : null}
                            onReject={isAdmin ? () => handleBulkStatusChange('rejected') : null}
                            onEdit={isAdmin ? () => {
                                if (selected.length === 1) {
                                    const selectedVacation = vacations.find(v => v.id === selected[0]);
                                    if (selectedVacation) {
                                        // Allow Admin to edit ANY vacation, logic happens on backend if needed
                                        // But wait, the backend now allows it.
                                        // Still, maybe warn if it's not pending? No, user said "should be able to edit".
                                        handleEditClick(selectedVacation);
                                    }
                                }
                            } : null}
                            onArchive={isAdmin ? handleBulkArchive : null}
                            onRefresh={loadData}
                        />
                        <TableContainer sx={{ flex: 1, minHeight: 0 }}>
                            <Table
                                size="small"
                                sx={{
                                    height: '100%',
                                    '& td, & th': {
                                        borderRight: '1px solid rgba(224, 224, 224, 1)'
                                    },
                                    '& td:last-child, & th:last-child': {
                                        borderRight: 'none'
                                    }
                                }}
                            >
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                color="primary"
                                                indeterminate={selected.length > 0 && selected.length < vacations.length}
                                                checked={vacations.length > 0 && selected.length === vacations.length}
                                                onChange={handleSelectAllClick}
                                            />
                                        </TableCell>
                                        {headCells.map((headCell) => (
                                            <TableCell
                                                key={headCell.id}
                                                width={headCell.width}
                                                sortDirection={orderBy === headCell.id ? order : false}
                                                sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: theme.custom?.tableText || '#475569' }}
                                            >
                                                {headCell.id !== 'actions' ? (
                                                    <TableSortLabel
                                                        active={orderBy === headCell.id}
                                                        direction={orderBy === headCell.id ? order : 'asc'}
                                                        onClick={() => handleRequestSort(headCell.id)}
                                                    >
                                                        {headCell.label}
                                                    </TableSortLabel>
                                                ) : headCell.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {vacations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary" variant="body2">Heç bir məlumat tapılmadı</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stableSort(vacations, getComparator(order, orderBy)).map((vac) => {
                                            const isSelected = selected.indexOf(vac.id) !== -1;
                                            return (
                                                <TableRow
                                                    key={vac.id}
                                                    id={`vacation-${vac.id}`}
                                                    hover
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    selected={isSelected}
                                                    onClick={(event) => handleClick(event, vac.id)}
                                                    onContextMenu={(event) => handleContextMenu(event, vac)}
                                                    sx={{
                                                        cursor: 'context-menu',
                                                        transition: 'background-color 0.3s',
                                                        animation: vac.id.toString() === highlightId ? 'flash 2s ease-out' : 'none',
                                                        '&:last-child td, &:last-child th': { border: 0 },
                                                        height: 50,
                                                        '&.Mui-selected': { bgcolor: 'primary.50' },
                                                        '&.Mui-selected:hover': { bgcolor: 'primary.100' },
                                                    }}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            color="primary"
                                                            checked={isSelected}
                                                            onClick={(event) => event.stopPropagation()}
                                                            onChange={(event) => handleClick(event, vac.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.875rem', color: theme.custom?.tableText || '#334155' }}>
                                                        {`#S${String(vac.id).padStart(6, '0')}`}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.875rem', color: alpha(theme.custom?.tableText || '#64748b', 0.8) }}>
                                                        {formatDate(vac.created_at?.split(' ')[0].split('T')[0] || vac.created_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500, color: theme.custom?.tableText || '#1e293b' }}>
                                                            {formatDate(vac.start_date)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500, color: theme.custom?.tableText || '#1e293b' }}>
                                                            {formatDate(vac.end_date)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold" sx={{ color: theme.custom?.tableText || '#0f172a' }}>
                                                            {vac.days_count} gün
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={vac.vacation_type === 'paid' ? 'Ödənişli' : vac.vacation_type === 'sick' ? 'Xəstəlik' : 'Ödənişsiz'}
                                                            size="small"
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.75rem',
                                                                bgcolor: vac.vacation_type === 'paid' ? '#dbeafe' : '#f1f5f9',
                                                                color: vac.vacation_type === 'paid' ? '#1e40af' : '#64748b'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip status={vac.status} onClick={(e) => handleStatusClick(e, vac.id)} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontWeight: 'bold',
                                                                color: getTimerInfo(vac).color
                                                            }}
                                                        >
                                                            {getTimerInfo(vac).text}
                                                        </Typography>
                                                    </TableCell>


                                                </TableRow>
                                            );
                                        })
                                    )}
                                    {/* Filler Row for continuous vertical lines */}
                                    {vacations.length > 0 && (
                                        <TableRow sx={{ height: '100%' }}>
                                            <TableCell padding="checkbox" sx={{ borderBottom: 0 }} />
                                            {headCells.map(headCell => (
                                                <TableCell key={headCell.id} sx={{ borderBottom: 0 }} />
                                            ))}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            )
            }

            {tabValue === 1 && (
                <Grid container spacing={3} sx={{ p: 1 }}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Əsas Məlumatlar
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Ad Soyad</Typography>
                                    <Typography variant="body1">{employee.name}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Login (İstifadəçi adı)</Typography>
                                    <Typography variant="body1">{employee.username}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Email</Typography>
                                    <Typography variant="body1">{employee.email || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Telefon</Typography>
                                    <Typography variant="body1">{employee.phone || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Doğum Tarixi</Typography>
                                    <Typography variant="body1">{employee.birth_date || '—'}</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                                İş Məlumatları
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Şöbə</Typography>
                                    <Typography variant="body1">{employee.department || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Vəzifə</Typography>
                                    <Typography variant="body1">{employee.position || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Maaş</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="success.main">
                                        {employee.salary ? `${employee.salary} AZN` : '—'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">İşə Başlama Tarixi</Typography>
                                    <Typography variant="body1">{employee.hire_date || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">FIN Kod</Typography>
                                    <Typography variant="body1">{employee.fin_code || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Ünvan</Typography>
                                    <Typography variant="body1">{employee.address || '—'}</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} color="inherit">
                        Ləğv et
                    </Button>
                    <Button onClick={confirmDialog.onConfirm} color="primary" variant="contained" autoFocus>
                        Təsdiqlə
                    </Button>
                </DialogActions>
            </Dialog>

            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={handleStatusMenuClose}
            >
                <MenuItem onClick={() => handleMenuStatusChange('approved')}>
                    <CheckCircle sx={{ mr: 1, color: 'success.main', fontSize: 20 }} /> Təsdiqlə (Approved)
                </MenuItem>
                <MenuItem onClick={() => handleMenuStatusChange('pending')}>
                    <Box sx={{ mr: 1, width: 20, height: 20, borderRadius: '50%', border: '2px solid #ed6c02', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>?</Typography>
                    </Box>
                    Gözləməyə al (Pending)
                </MenuItem>
                <MenuItem onClick={() => handleMenuStatusChange('rejected')}>
                    <Cancel sx={{ mr: 1, color: 'error.main', fontSize: 20 }} /> Ləğv et (Rejected)
                </MenuItem>
            </Menu>

            {/* Custom Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleContextMenuClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleViewInCalendar}>
                    <CalendarToday sx={{ mr: 2, color: 'primary.main' }} /> Təqvimə bax
                </MenuItem>
            </Menu>

            {/* Create Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Yeni Məzuniyyət Əmri</DialogTitle>
                <DialogContent>
                    {/* User Notification */}
                    {!isAdmin && (
                        <Box sx={{ bgcolor: '#fff7ed', p: 2, borderRadius: 1, mb: 2, border: '1px solid #fdba74' }}>
                            <Typography variant="body2" color="#c2410c">
                                <b>Diqqət:</b> Sizin sorğunuz "Gözləmədə" olacaq və Admin tərəfindən təsdiqlənməlidir.
                            </Typography>
                        </Box>
                    )}

                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <TextField
                            select
                            label="Növ"
                            fullWidth
                            value={newVacation.vacation_type}
                            onChange={(e) => setNewVacation({ ...newVacation, vacation_type: e.target.value })}
                        >
                            <MenuItem value="paid">Ödənişli Məzuniyyət</MenuItem>
                            <MenuItem value="unpaid">Ödənişsiz Məzuniyyət</MenuItem>
                            <MenuItem value="sick">Xəstəlik Vərəqəsi</MenuItem>
                        </TextField>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    type="text"
                                    label="Başlanğıc (Məs: 10 və ya 10.11)"
                                    placeholder="DD.MM.YYYY"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    value={newVacation.start_date}
                                    onChange={(e) => handleSmartDateChange('start_date', e.target.value, false)}
                                    onBlur={(e) => handleSmartDateChange('start_date', e.target.value, true)}
                                    onKeyDown={(e) => handleKeyDown(e, 'start_date')}
                                    inputRef={startDateInputRef}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => startDatePickerRef.current.showPicker()} edge="end">
                                                    <CalendarToday fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    type="text"
                                    label="Bitmə (Məs: 15 və ya 15.11)"
                                    placeholder="DD.MM.YYYY"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    value={newVacation.end_date}
                                    onChange={(e) => handleSmartDateChange('end_date', e.target.value, false)}
                                    onBlur={(e) => handleSmartDateChange('end_date', e.target.value, true)}
                                    onKeyDown={(e) => handleKeyDown(e, 'end_date')}
                                    inputRef={endDateInputRef}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => endDatePickerRef.current.showPicker()} edge="end">
                                                    <CalendarToday fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ bgcolor: '#f1f5f9', p: 2, borderRadius: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography color="text.secondary">Hesablanan gün sayı:</Typography>
                                <Typography fontWeight="bold">{newVacation.days_count} gün</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography color="text.secondary">Təxmini qalıq:</Typography>
                                <Typography
                                    fontWeight="bold"
                                    color={tempRemaining < 0 ? 'error.main' : 'success.main'}
                                >
                                    {tempRemaining} gün
                                </Typography>
                            </Box>
                        </Box>

                        {/* Hidden Inputs for Date Picker */}
                        <input
                            type="date"
                            ref={startDatePickerRef}
                            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 0, height: 0 }}
                            onChange={(e) => handleDatePickerChange('start_date', e)}
                            tabIndex={-1}
                        />
                        <input
                            type="date"
                            ref={endDatePickerRef}
                            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 0, height: 0 }}
                            onChange={(e) => handleDatePickerChange('end_date', e)}
                            tabIndex={-1}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Ləğv et</Button>
                    <Button variant="contained" onClick={() => handleCreateVacation()} disabled={!newVacation.start_date || !newVacation.end_date}>
                        Təsdiqlə
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Məzuniyyət Redaktəsi</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <TextField
                            select
                            label="Növ"
                            fullWidth
                            value={editVacation.vacation_type}
                            onChange={(e) => setEditVacation({ ...editVacation, vacation_type: e.target.value })}
                        >
                            <MenuItem value="paid">Ödənişli Məzuniyyət</MenuItem>
                            <MenuItem value="unpaid">Ödənişsiz Məzuniyyət</MenuItem>
                            <MenuItem value="sick">Xəstəlik Vərəqəsi</MenuItem>
                        </TextField>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    type="text"
                                    label="Başlanğıc"
                                    placeholder="DD.MM.YYYY"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    value={editVacation.start_date}
                                    onChange={(e) => handleEditSmartDateChange('start_date', e.target.value, false)}
                                    onBlur={(e) => handleEditSmartDateChange('start_date', e.target.value, true)}
                                    onKeyDown={(e) => handleKeyDown(e, 'start_date')}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => editStartDatePickerRef.current?.showPicker()} edge="end">
                                                    <CalendarToday fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    type="text"
                                    label="Bitmə"
                                    placeholder="DD.MM.YYYY"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    value={editVacation.end_date}
                                    onChange={(e) => handleEditSmartDateChange('end_date', e.target.value, false)}
                                    onBlur={(e) => handleEditSmartDateChange('end_date', e.target.value, true)}
                                    onKeyDown={(e) => handleKeyDown(e, 'end_date')}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => editEndDatePickerRef.current?.showPicker()} edge="end">
                                                    <CalendarToday fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            select
                            label="Status"
                            fullWidth
                            value={editVacation.status}
                            onChange={(e) => setEditVacation({ ...editVacation, status: e.target.value })}
                        >
                            <MenuItem value="pending">Gözləmədə</MenuItem>
                            <MenuItem value="approved">Təsdiqlənib</MenuItem>
                            <MenuItem value="rejected">Ləğv edilib</MenuItem>
                        </TextField>

                        {editVacation.days_count > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                Müddət: {editVacation.days_count} gün
                            </Typography>
                        )}

                        {/* Hidden date pickers */}
                        <input
                            type="date"
                            ref={editStartDatePickerRef}
                            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 0, height: 0 }}
                            onChange={(e) => handleEditDatePickerChange('start_date', e)}
                            tabIndex={-1}
                        />
                        <input
                            type="date"
                            ref={editEndDatePickerRef}
                            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 0, height: 0 }}
                            onChange={(e) => handleEditDatePickerChange('end_date', e)}
                            tabIndex={-1}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>Ləğv et</Button>
                    <Button
                        variant="contained"
                        onClick={handleEditSave}
                        disabled={!editVacation.start_date || !editVacation.end_date}
                    >
                        Yadda saxla
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(deleteConfirmation)}
                onClose={() => setDeleteConfirmation(null)}
            >
                <DialogTitle>Təsdiqlə</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bu məzuniyyət sorğusunu silmək istədiyinizə əminsiniz?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmation(null)}>Xeyr</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmDelete}
                    >
                        Bəli, Sil
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Admin Edit Modal */}
            <EditEmployeeModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                employee={employee}
                onSave={handleAdminEditSave}
            />
        </Box >
    );
};

// Helper for status colors
const StatusChip = ({ status }) => {
    let color = 'default';
    let label = status;

    if (status === 'approved') {
        color = 'success';
        label = 'Təsdiqlənib';
    } else if (status === 'rejected') {
        color = 'error';
        label = 'Ləğv edildi';
    } else if (status === 'pending') {
        color = 'warning';
        label = 'Gözləmədə';
    }

    return <Chip label={label} size="small" color={color} variant={status === 'pending' ? 'filled' : 'outlined'} />;
};


export default EmployeeDetails;
