import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Chip, IconButton, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tabs, Tab, CircularProgress, Alert, Checkbox
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import TableToolbar from '../components/TableToolbar';
import EditVacationDialog from '../components/vacations/EditVacationDialog';

const VacationRequestsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Parse query params for default tab
    const queryParams = new URLSearchParams(location.search);
    const filterParam = queryParams.get('filter');
    const highlightParam = queryParams.get('highlight');

    const [tabValue, setTabValue] = useState(filterParam === 'pending' ? 0 : (highlightParam ? 3 : 3)); // Default 'All' if highlight is present
    const [vacations, setVacations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Selection State
    const [selected, setSelected] = useState([]);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedVacation, setSelectedVacation] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    // Filter Logic mapping
    // Tabs: 0 -> Pending, 1 -> Approved, 2 -> Rejected, 3 -> All
    const getTabFromFilter = (f) => {
        if (f === 'pending') return 0;
        if (f === 'approved') return 1;
        if (f === 'rejected') return 2;
        return 3; // Default ALL
    };

    useEffect(() => {
        if (filterParam) {
            setTabValue(getTabFromFilter(filterParam));
        } else if (highlightParam) {
            setTabValue(3); // Ensure ALL is selected for highlighting
        }
    }, [filterParam, highlightParam]);

    // Scroll to highlight
    useEffect(() => {
        if (!loading && highlightParam && vacations.length > 0) {
            const element = document.getElementById(`vacation-${highlightParam}`);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }, [loading, highlightParam, vacations, tabValue]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.getAllVacations();
            if (Array.isArray(data)) {
                setVacations(data);
            } else {
                setVacations([]);
            }
        } catch (err) {
            console.error(err);
            setError('Məlumatları yükləmək mümkün olmadı.');
        } finally {
            setLoading(false);
        }
    };

    // Selection Handlers
    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = filteredList.map((n) => n.id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

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
        setSelected(newSelected);
    };

    const handleEditClick = () => {
        if (selected.length === 1) {
            const vac = vacations.find(v => v.id === selected[0]);
            if (vac) {
                // Prevent editing if not pending
                if (vac.status !== 'pending') {
                    // UI Protection (UX Layer) - Backend has stronger checks
                    const user = api.getCurrentUser();

                    // If user is NOT admin, block the dialog
                    if (user?.role !== 'admin') {
                        alert("Yalnız 'Gözləyən' statusunda olan sorğular redaktə edilə bilər.");
                        return;
                    }
                }
                setSelectedVacation(vac);
                setEditDialogOpen(true);
            }
        }
    };

    const handleEditDialogSave = () => {
        loadData();
        setSelected([]); // Clear selection after save
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Sorğunun statusunu '${newStatus}' olaraq dəyişmək istədiyinizə əminsiniz?`)) return;

        try {
            await api.updateVacationStatus(id, newStatus);
            loadData(); // Refresh list
        } catch (err) {
            alert(`Xəta: ${err.message}`);
        }
    };

    const getFilteredVacations = () => {
        switch (tabValue) {
            case 0: return vacations.filter(v => v.status === 'pending');
            case 1: return vacations.filter(v => v.status === 'approved');
            case 2: return vacations.filter(v => v.status === 'rejected');
            default: return vacations;
        }
    };

    const filteredList = getFilteredVacations();

    const getStatusChip = (status) => {
        const map = {
            'approved': { label: 'Təsdiqlənib', color: 'success' },
            'rejected': { label: 'Ləğv edilib', color: 'error' },
            'pending': { label: 'Gözləyir', color: 'warning' },
        };
        const s = map[status] || { label: status, color: 'default' };
        return <Chip label={s.label} color={s.color} size="small" />;
    };

    const handleDelete = async () => {
        if (selected.length === 0) return;
        if (!window.confirm(`${selected.length} sorğunu silmək istədiyinizə əminsiniz?`)) return;

        try {
            await Promise.all(selected.map(id => api.deleteVacation(id)));
            setSelected([]);
            loadData();
            // Optional: Show success notification
        } catch (err) {
            alert(`Xəta: ${err.message}`);
        }
    };

    return (
        <Box p={3}>
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

            {/* Header Replaced with Toolbar */}
            <TableToolbar
                title="Məzuniyyət Sorğuları"
                numSelected={selected.length}
                onRefresh={loadData}
                onEdit={handleEditClick}
                onDelete={handleDelete}
            />

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label="Gözləyən" />
                    <Tab label="Təsdiqlənən" />
                    <Tab label="Ləğv edilən" />
                    <Tab label="Hamısı" />
                </Tabs>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    color="primary"
                                    indeterminate={selected.length > 0 && selected.length < filteredList.length}
                                    checked={filteredList.length > 0 && selected.length === filteredList.length}
                                    onChange={handleSelectAllClick}
                                />
                            </TableCell>
                            <TableCell><strong>İşçi</strong></TableCell>
                            <TableCell><strong>Tarixlər</strong></TableCell>
                            <TableCell><strong>Müddət</strong></TableCell>
                            <TableCell><strong>Yaradılma vaxtı</strong></TableCell>
                            <TableCell><strong>Səbəb</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Əməliyyatlar</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                    <Typography color="text.secondary">Göstəriləcək məlumat yoxdur</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredList.map((row) => {
                                const isItemSelected = selected.indexOf(row.id) !== -1;
                                const user = api.getCurrentUser();
                                const isAdmin = user?.role === 'admin';

                                return (
                                    <TableRow
                                        key={row.id}
                                        id={`vacation-${row.id}`}
                                        hover
                                        onClick={(event) => handleClick(event, row.id)}
                                        role="checkbox"
                                        aria-checked={isItemSelected}
                                        selected={isItemSelected}
                                        sx={{
                                            cursor: 'pointer',
                                            animation: row.id.toString() === highlightParam ? 'flash 2s ease-out' : 'none',
                                            transition: 'background-color 0.5s'
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                color="primary"
                                                checked={isItemSelected}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight="medium">{row.employee_name}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.start_date} - {row.end_date}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {row.days_count} gün
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {row.created_at}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {row.reason || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(row.status)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {/* Action Buttons Logic
                                                - Pending: Show Approve/Reject for Admin (or Owner? No, Owner can't approve). Only Admin can approve.
                                                - Approved: Show Reject (Cancel) for Admin.
                                            */}
                                            <Box display="flex" gap={1} justifyContent="flex-end">
                                                {row.status === 'pending' && isAdmin && (
                                                    <Tooltip title="Təsdiqlə">
                                                        <IconButton
                                                            color="success"
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row.id, 'approved'); }}
                                                        >
                                                            <CheckIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {(row.status === 'pending' || (row.status === 'approved' && isAdmin)) && (
                                                    <Tooltip title="Ləğv et">
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row.id, 'rejected'); }}
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <EditVacationDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                vacation={selectedVacation}
                onSave={handleEditDialogSave}
            />
        </Box>
    );
};

export default VacationRequestsPage;
