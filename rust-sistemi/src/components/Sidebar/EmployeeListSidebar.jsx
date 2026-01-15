import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, InputAdornment,
    List, ListItem, ListItemButton, ListItemAvatar,
    Avatar, ListItemText, CircularProgress,
    IconButton, Tooltip, Menu, MenuItem, ListSubheader,
    useTheme, alpha
} from '@mui/material';
import {
    Search, Mail,
    Add as AddIcon, Edit as EditIcon,
    Delete as DeleteIcon, Block as BlockIcon,
    FilterList as FilterListIcon, Close as CloseIcon,
    Archive as ArchiveIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import EmployeeFormDialog from '../EmployeeFormDialog';
import EditEmployeeModal from '../EditEmployeeModal';
import { useNotification } from '../../context/NotificationContext';

const EmployeeListSidebar = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { id } = useParams(); // Selected employee ID
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const { showNotification } = useNotification();

    // Filter State
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);

    // Helper to refresh data
    const loadData = async () => {
        try {
            setLoading(true);
            const user = api.getCurrentUser();
            setCurrentUser(user);
            const allEmployees = await api.getEmployees();

            if (user && user.role !== 'admin') {
                const myProfile = allEmployees.filter(e => e.id === user.id);
                setEmployees(myProfile);
                if (!id && myProfile.length > 0) navigate(`/dashboard/employees/${myProfile[0].id}`);
            } else {
                setEmployees(allEmployees);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id, navigate]);

    const handleOpenDialog = (employee = null) => {
        setSelectedEmployee(employee);
        setOpenDialog(true);
    };

    const handleSuccess = (mode) => {
        loadData(); // Reload list
    };

    const handleEditSave = async (type, data, explicitId) => {
        try {
            const targetId = explicitId || selectedEmployee?.id;
            if (!targetId) {
                showNotification("İşçi ID tapılmadı", "error");
                return;
            }

            if (type === 'profile') {
                await api.updateEmployee(targetId, data);
            } else if (type === 'password') {
                await api.changePassword(targetId, { password: data });
            }
            loadData();
            setEditModalOpen(false);
            showNotification("Məlumat yeniləndi", "success");
        } catch (error) {
            console.error("Edit failed", error);
            showNotification(error.message || "Xəta baş verdi", "error");
        }
    };

    const handleToggleActive = async (empId, currentStatus) => {
        if (!window.confirm(currentStatus ? "İşçini deaktiv etmək istədiyinizə əminsiniz?" : "İşçini aktiv etmək istədiyinizə əminsiniz?")) return;
        try {
            await api.toggleEmployeeActive(empId, !currentStatus);
            loadData();
        } catch (error) {
            alert(`Xəta: ${error}`);
        }
    }

    const handleDelete = async (empId) => {
        if (!window.confirm("Bu işçini tamamilə silmək istədiyinizə əminsiniz?")) return;
        try {
            alert("Sistemdə birbaşa silinmə funksiyası hələ aktiv deyil, lütfən deaktiv edin.");
        } catch (error) {
            alert(error);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const fullName = (emp.name || `${emp.first_name} ${emp.last_name}`).toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    // Grouping Logic
    const getGroupedEmployees = () => {
        let listToGroup = filteredEmployees;

        // Apply position filter if selected
        if (selectedPosition) {
            listToGroup = listToGroup.filter(e => (e.position || 'Digər') === selectedPosition);
        }

        const groups = {};
        listToGroup.forEach(emp => {
            const pos = emp.position || 'Digər';
            if (!groups[pos]) groups[pos] = [];
            groups[pos].push(emp);
        });

        // Sort groups alphabetically
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {});
    };

    const groupedEmployees = getGroupedEmployees();
    const uniquePositions = [...new Set(employees.map(e => e.position || 'Digər'))].sort();

    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleFilterSelect = (position) => {
        setSelectedPosition(position);
        handleFilterClose();
    };

    return (
        <Box
            sx={{
                width: 320,
                height: '100vh',
                borderRight: '1px solid rgba(0,0,0,0.05)',
                background: alpha(theme.custom?.sidebar?.background || '#ffffff', 0.6), // Dynamic glass color
                backdropFilter: 'blur(12px)', // Stronger blur
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                left: 72, // With of IconSidebar
                top: 0,
                zIndex: 10
            }}
        >
            {/* Header / Search */}
            <Box sx={{
                p: 2.5,
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                bgcolor: 'rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h5" fontWeight="800" sx={{
                        color: theme.custom?.sidebar?.text || '#1e293b',
                        letterSpacing: '-0.5px'
                    }}>
                        İşçilər
                    </Typography>
                </Box>
            </Box>

            {/* Toolbar (Only for Admins) */}
            {currentUser?.role === 'admin' && (
                <Box sx={{
                    px: 2, py: 1.5,
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    bgcolor: 'rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', height: 50
                }}>
                    {/* Collapsible Action Icons */}
                    <Box sx={{
                        display: 'flex',
                        gap: 0.5,
                        width: isSearchOpen ? 0 : 'auto',
                        opacity: isSearchOpen ? 0 : 1,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap'
                    }}>
                        <Tooltip title="Yeni İşçi">
                            <IconButton size="small" sx={{ color: 'primary.main', bgcolor: 'rgba(255,255,255,0.5)' }} onClick={() => handleOpenDialog()}>
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Düzəliş et">
                            <span>
                                <IconButton
                                    size="small"
                                    color="info"
                                    disabled={!id || isNaN(parseInt(id))}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}
                                    onClick={() => {
                                        const emp = employees.find(e => e.id === parseInt(id));
                                        if (emp) {
                                            setSelectedEmployee(emp);
                                            setEditModalOpen(true);
                                        }
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Deaktiv/Aktiv et">
                            <span>
                                <IconButton
                                    size="small"
                                    color="warning"
                                    disabled={!id || isNaN(parseInt(id))}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}
                                    onClick={() => {
                                        const emp = employees.find(e => e.id === parseInt(id));
                                        if (emp) handleToggleActive(emp.id, emp.is_active);
                                    }}
                                >
                                    <BlockIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Sil">
                            <span>
                                <IconButton
                                    size="small"
                                    color="error"
                                    disabled={!id || isNaN(parseInt(id))}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}
                                    onClick={() => handleDelete(parseInt(id))}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        {/* Filter Icon */}
                        <Tooltip title="Vəzifəyə görə filterlə">
                            <IconButton size="small" onClick={handleFilterClick} color={selectedPosition ? 'secondary' : 'default'} sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}>
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={filterAnchorEl}
                            open={Boolean(filterAnchorEl)}
                            onClose={handleFilterClose}
                            PaperProps={{
                                elevation: 4,
                                sx: { borderRadius: 3, mt: 1, minWidth: 180 }
                            }}
                        >
                            <MenuItem onClick={() => handleFilterSelect(null)} selected={selectedPosition === null}>
                                <em>Hamısı</em>
                            </MenuItem>
                            {uniquePositions.map(pos => (
                                <MenuItem key={pos} onClick={() => handleFilterSelect(pos)} selected={selectedPosition === pos}>
                                    {pos}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>

                    {/* Expandable Search Input */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        ml: isSearchOpen ? 0 : 1
                    }}>
                        {isSearchOpen ? (
                            <TextField
                                fullWidth
                                size="small"
                                autoFocus
                                placeholder="Axtar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <IconButton size="small" onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(255,255,255,0.8)',
                                        backdropFilter: 'blur(5px)',
                                        '& fieldset': { border: 'none' },
                                        borderRadius: 5,
                                        fontSize: '0.875rem',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                    }
                                }}
                            />
                        ) : (
                            <Tooltip title="Axtarış">
                                <IconButton onClick={() => setIsSearchOpen(true)} sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}>
                                    <Search />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            )}

            {/* List */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1 }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List disablePadding subheader={<li />}>
                        {Object.entries(groupedEmployees).map(([position, groupEmps]) => (
                            <li key={`section-${position}`}>
                                <ul>
                                    {(!selectedPosition || selectedPosition === position) && (
                                        <ListSubheader
                                            sx={{
                                                bgcolor: 'transparent',
                                                fontWeight: '700',
                                                lineHeight: '32px',
                                                color: 'primary.main',
                                                mt: 2,
                                                mb: 1,
                                                textTransform: 'uppercase',
                                                fontSize: '0.7rem',
                                                letterSpacing: '1.2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.5 }} />
                                            {position} <Box component="span" sx={{ opacity: 0.5, ml: 0.5 }}>({groupEmps.length})</Box>
                                        </ListSubheader>
                                    )}
                                    {groupEmps.map((emp) => {
                                        const isSelected = parseInt(id) === emp.id;
                                        const fullName = emp.name || `${emp.first_name} ${emp.last_name}`;

                                        return (
                                            <ListItem key={emp.id} disablePadding sx={{ mb: 1.5 }}>
                                                <ListItemButton
                                                    onClick={() => navigate(`/dashboard/employees/${emp.id}`)}
                                                    selected={isSelected}
                                                    sx={{
                                                        borderRadius: 4,
                                                        mb: 0.5,
                                                        border: isSelected ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                                        bgcolor: isSelected ? 'rgba(255,255,255,0.95) !important' : 'rgba(255,255,255,0.5)',
                                                        backdropFilter: 'blur(8px)',
                                                        boxShadow: isSelected
                                                            ? '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
                                                            : '0 1px 2px 0 rgba(0,0,0,0.05)',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(255,255,255,0.85)',
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                                        },
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        opacity: emp.is_active ? 1 : 0.7,
                                                        pl: 2
                                                    }}
                                                >
                                                    <ListItemAvatar>
                                                        <Box position="relative">
                                                            <Avatar
                                                                src={api.getImageUrl(emp.profile_image)}
                                                                sx={{
                                                                    width: 48, height: 48,
                                                                    bgcolor: isSelected ? 'primary.main' : '#f1f5f9',
                                                                    color: isSelected ? 'white' : 'text.secondary',
                                                                    fontSize: '1rem',
                                                                    fontWeight: 'bold',
                                                                    border: '3px solid white',
                                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                                }}
                                                            >
                                                                {fullName.charAt(0)}
                                                            </Avatar>
                                                            {/* Status Dot: Active=Green, Inactive=Red */}
                                                            <Box
                                                                sx={{
                                                                    position: 'absolute',
                                                                    bottom: 2,
                                                                    right: 2,
                                                                    width: 12,
                                                                    height: 12,
                                                                    bgcolor: emp.is_active ? '#10b981' : '#ef4444', // Green or Red
                                                                    borderRadius: '50%',
                                                                    border: '2px solid white',
                                                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)'
                                                                }}
                                                            />
                                                        </Box>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    fontWeight={isSelected ? '700' : '600'}
                                                                    noWrap
                                                                    sx={{
                                                                        color: isSelected ? 'primary.main' : (theme.custom?.sidebar?.text || '#334155'),
                                                                        fontSize: '0.9rem'
                                                                    }}
                                                                >
                                                                    {fullName}
                                                                </Typography>
                                                                <Box display="flex" gap={0.5}>
                                                                    {/* Mail Icon for Unread Messages */}
                                                                    {emp.unread_count > 0 && (
                                                                        <Tooltip title={`${emp.unread_count} oxunmamış mesaj`}>
                                                                            <Mail
                                                                                sx={{
                                                                                    fontSize: 18,
                                                                                    color: '#f59e0b',
                                                                                    animation: 'shake 1.5s infinite ease-in-out',
                                                                                    '@keyframes shake': {
                                                                                        '0%, 100%': { transform: 'rotate(0deg)' },
                                                                                        '25%': { transform: 'rotate(10deg)' },
                                                                                        '75%': { transform: 'rotate(-10deg)' }
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    )}

                                                                    {/* Pending Vacation Dot */}
                                                                    {emp.has_pending_vacation && (
                                                                        <Tooltip title="Gözləyən məzuniyyət">
                                                                            <Box
                                                                                sx={{
                                                                                    width: 8,
                                                                                    height: 8,
                                                                                    bgcolor: '#f43f5e',
                                                                                    borderRadius: '50%',
                                                                                    boxShadow: '0 0 0 2px #ffe4e6'
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Typography variant="body2" noWrap sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem', opacity: 0.8, color: alpha(theme.custom?.sidebar?.text || '#64748b', 0.8) }}>
                                                                {emp.position || 'Vəzifə yoxdur'}
                                                                {!emp.is_active && <span style={{ color: '#ef4444' }}> • Deaktiv</span>}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                                </ul>
                            </li>
                        ))}
                    </List>
                )}
            </Box>

            {/* Shared Employee Form Dialog */}
            <EmployeeFormDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                employee={selectedEmployee}
                onSuccess={handleSuccess}
            />

            {/* Edit Modal (Same as in Details) */}
            <EditEmployeeModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                employee={selectedEmployee}
                onSave={handleEditSave}
            />
        </Box >
    );
};

export default EmployeeListSidebar;
