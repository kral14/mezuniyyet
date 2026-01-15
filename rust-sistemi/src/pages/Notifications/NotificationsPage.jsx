import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Checkbox, IconButton, Button,
    Card, Divider, Container, CircularProgress,
    Fade, Chip
} from '@mui/material';
import { Delete, ArrowBack, CheckCircle, Notifications as NotifIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const user = api.getCurrentUser();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.getNotifications(user?.id);
            setNotifications(Array.isArray(data) ? data : []);
            setSelectedIds(new Set()); // Reset selection
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(notifications.map(n => n.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id, checked) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const handleDeleteSelected = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        console.log("Attempting to delete notifications:", ids);

        if (!confirm(`${ids.length} bildirişi silmək istədiyinizə əminsiniz?`)) return;

        try {
            // Delete sequentially (API doesn't support bulk delete yet, loop for now)
            // Ideally backend should support bulk delete
            for (const id of ids) {
                console.log(`Deleting notification ID: ${id}`);
                await api.deleteNotification(id);
                console.log(`Successfully deleted ID: ${id}`);
            }
            loadData();
        } catch (error) {
            console.error("Delete failed Error", error);
            alert(`Silinmə xətası: ${error.message || error}`);
        }
    };

    const handleRead = async (notif) => {
        // Mark as read if not already
        if (!notif.is_read) {
            try {
                await api.markNotificationRead(notif.id);
                loadData();
            } catch (e) { console.error(e); }
        }

        // Navigate logic
        if (notif.related_id) {
            // Check if related_id is in format EMPID:VACID
            if (notif.related_id.includes(':')) {
                const [empId, vacId] = notif.related_id.split(':');
                navigate(`/dashboard/employees/${empId}?highlight=${vacId}`);
            } else {
                // Assume it's just EMPID
                navigate(`/dashboard/employees/${notif.related_id}`);
            }
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header */}
            <Box mb={4} display="flex" alignItems="center" gap={2}>
                <IconButton onClick={() => navigate(-1)} color="inherit">
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                    Bildirişlər
                </Typography>
            </Box>

            {/* Toolbar */}
            <Card sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', boxShadow: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Checkbox
                        checked={notifications.length > 0 && selectedIds.size === notifications.length}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < notifications.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        sx={{ color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }}
                    />
                    <Typography color="text.secondary">
                        {selectedIds.size > 0 ? `${selectedIds.size} seçilib` : 'Hamısını Seç'}
                    </Typography>
                </Box>

                {selectedIds.size > 0 && (
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                        onClick={handleDeleteSelected}
                    >
                        Seçilənləri Sil
                    </Button>
                )}
            </Card>

            {/* List */}
            <Box display="flex" flexDirection="column" gap={2}>
                {notifications.length === 0 ? (
                    <Box textAlign="center" py={10}>
                        <NotifIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                        <Typography color="text.secondary" mt={2}>Heç bir bildiriş yoxdur</Typography>
                    </Box>
                ) : (
                    notifications.map(notif => (
                        <Card
                            key={notif.id}
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: notif.is_read ? 'background.paper' : 'primary.50', // Use tiny tint for unread if possible, or simple background
                                borderLeft: notif.is_read ? '4px solid transparent' : '4px solid #3b82f6',
                                transition: '0.2s',
                                '&:hover': { bgcolor: 'action.hover' },
                                cursor: 'pointer',
                                boxShadow: 1
                            }}
                            onClick={() => handleRead(notif)}
                        >
                            <Checkbox
                                checked={selectedIds.has(notif.id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleSelectOne(notif.id, e.target.checked)}
                                sx={{ color: 'text.secondary' }}
                            />

                            <Box flex={1}>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                    <Chip
                                        label={notif.change_type === 'info' ? 'Məlumat' : notif.change_type.replace('_', ' ').toUpperCase()}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.65rem',
                                            bgcolor: notif.is_read ? 'action.disabledBackground' : 'primary.main',
                                            color: notif.is_read ? 'text.secondary' : 'white'
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {notif.created_at}
                                    </Typography>
                                </Box>
                                <Typography color="text.primary" fontWeight={notif.is_read ? 'normal' : 'bold'}>
                                    {notif.message}
                                </Typography>
                            </Box>

                            <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Bu bildirişi silmək istəyirsiniz?')) {
                                        api.deleteNotification(notif.id)
                                            .then(() => loadData())
                                            .catch(err => alert("Silinmə xətası: " + (err.message || err)));
                                    }
                                }}
                            >
                                <Delete />
                            </IconButton>
                        </Card>
                    ))
                )}
            </Box>
        </Container>
    );
};

export default NotificationsPage;
