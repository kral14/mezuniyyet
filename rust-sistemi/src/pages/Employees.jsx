import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    Typography,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Avatar,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Alert,
    Snackbar,
    Chip
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import EmployeeFormDialog from '../components/EmployeeFormDialog';

// Fields configuration
const initialFormState = {
    first_name: '',
    last_name: '',
    father_name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    fin_code: '',
    department: '',
    position: '',
    salary: '',
    hire_date: '',
    birth_date: '',
    role: 'user'
};

const Employees = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    // Fetch Employees
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await api.getEmployees();
            setRows(data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            showNotification(`Xəta: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Open Dialog
    const handleOpenDialog = (employee = null) => {
        if (employee) {
            setIsEditMode(true);
            setCurrentId(employee.id);
            // Pre-fill form data for the dialog prop
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                father_name: employee.father_name || '',
                username: employee.username || '',
                email: employee.email || '',
                phone: employee.phone || '',
                address: employee.address || '',
                fin_code: employee.fin_code || '',
                department: employee.department || '',
                position: employee.position || '',
                salary: employee.salary ? employee.salary.toString() : '',
                hire_date: employee.hire_date || '',
                birth_date: employee.birth_date || '',
                role: employee.role || 'user'
            });
        } else {
            setIsEditMode(false);
            setCurrentId(null);
            setFormData(initialFormState);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    // Notifications
    const showNotification = (message, severity = 'info') => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await api.toggleEmployeeActive(id, !currentStatus);
            showNotification(currentStatus ? "İşçi deaktiv edildi" : "İşçi aktiv edildi", 'info');
            fetchEmployees();
        } catch (error) {
            showNotification(`Status dəyişmə xətası: ${error}`, 'error');
        }
    }

    // Columns
    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        {
            field: 'name',
            headerName: 'Ad Soyad',
            width: 200,
            valueGetter: (value, row) => {
                if (row.first_name && row.last_name) return `${row.first_name} ${row.last_name}`;
                return row.name || row.username || 'Noname';
            },
            renderCell: (params) => (
                <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                        src={params.row.profile_image ? `${api.API_URL.replace('/api', '')}/${params.row.profile_image}` : null}
                        sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}
                    >
                        {params.value.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">{params.value}</Typography>
                </Box>
            )
        },
        { field: 'department', headerName: 'Şöbə', width: 150 },
        { field: 'position', headerName: 'Vəzifə', width: 150 },
        { field: 'phone', headerName: 'Telefon', width: 130 },
        { field: 'email', headerName: 'Email', width: 180 },
        {
            field: 'is_active',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Box>
                    {params.value ? (
                        <Chip label="Aktiv" color="success" size="small" variant="outlined" />
                    ) : (
                        <Chip label="Deaktiv" color="default" size="small" variant="outlined" />
                    )}
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Əməliyyatlar',
            width: 180,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Bax">
                        <IconButton size="small" onClick={() => navigate(`/dashboard/employees/${params.row.id}`)} color="info">
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Düzəliş et">
                        <IconButton size="small" onClick={() => handleOpenDialog(params.row)} color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={params.row.is_active ? "Deaktiv et" : "Aktiv et"}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => handleToggleActive(params.row.id, params.row.is_active)}
                                color={params.row.is_active ? "error" : "success"}
                            >
                                {params.row.is_active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Əməkdaşlar
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2 }}
                >
                    Yeni İşçi
                </Button>
            </Box>

            <Card sx={{ height: 600, width: '100%', boxShadow: 3, borderRadius: 2 }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 },
                        },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-cell:focus': { outline: 'none' },
                        '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' }
                    }}
                />
            </Card>

            {/* Add/Edit Dialog */}
            <EmployeeFormDialog
                open={openDialog}
                onClose={handleCloseDialog}
                employee={isEditMode ? { ...formData, id: currentId } : null}
                onSuccess={(mode) => {
                    showNotification(mode === 'updated' ? "İşçi məlumatları yeniləndi!" : "Yeni işçi əlavə edildi!", 'success');
                    fetchEmployees();
                }}
            />

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Employees;
