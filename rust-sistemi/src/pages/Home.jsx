import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Button, Skeleton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, Divider } from '@mui/material';
import { People, FlightTakeoff, PendingActions, Work } from '@mui/icons-material';
import api from '../services/api';
import VacationCalendar from '../components/VacationCalendar';

const StatCard = ({ title, value, icon, color, loading }) => (
    <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 2 }}>
        <Box sx={{
            p: 2,
            borderRadius: '50%',
            bgcolor: `${color}20`,
            color: color,
            mr: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </Box>
        <Box sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
                {loading ? <Skeleton width={60} /> : (value ?? 0)}
            </Typography>
        </Box>
    </Card>
);

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const focusDate = queryParams.get('focusDate');
    const highlightVacationId = queryParams.get('highlightVac');

    const [stats, setStats] = useState(null);
    const [vacStats, setVacStats] = useState(null);
    const [vacations, setVacations] = useState([]); // Store vacations (Personal)
    const [allVacations, setAllVacations] = useState([]); // Store ALL vacations (Admin Calendar)
    const [employees, setEmployees] = useState([]); // Store employees for filtering
    const [loading, setLoading] = useState(true);
    const user = api.getCurrentUser();
    const isAdmin = user?.role === 'admin';

    // Modal State
    const [openVacationModal, setOpenVacationModal] = useState(false);
    const [activeVacations, setActiveVacations] = useState([]);

    const handleVacationCardClick = () => {
        if (!allVacations || allVacations.length === 0) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const current = allVacations.filter(v =>
            v.status === 'approved' &&
            v.start_date <= todayStr &&
            v.end_date >= todayStr
        );
        setActiveVacations(current);
        setOpenVacationModal(true);
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            console.group('🏠 Dashboard Load');
            console.time('Total Load Time');

            try {
                console.log('👤 User Role:', isAdmin ? 'Admin' : 'Employee');

                // Fetch ALL vacations for calendar for EVERYONE
                console.time('Calendar Data Fetch');
                const [allVacs, allEmps] = await Promise.all([
                    api.getAllVacations().catch(err => { console.error("Calendar fetch error", err); return []; }),
                    api.getEmployees().catch(err => { console.warn("Employees fetch error (msg optional)", err); return []; })
                ]);
                console.timeEnd('Calendar Data Fetch');
                console.log(`📅 Loaded ${allVacs?.length || 0} calendar events`);

                setAllVacations(allVacs || []);
                setEmployees(allEmps || []);

                if (isAdmin) {
                    console.time('Dashboard Stats');
                    const data = await api.getDashboardStats();
                    console.timeEnd('Dashboard Stats');
                    console.log('📊 Stats Loaded:', data);
                    setStats(data);
                } else {
                    // Optimized: Fetch personal info and vacations in parallel, then calculate stats
                    console.time('Personal Data');
                    const [myVacations, myProfile] = await Promise.all([
                        api.getVacations(user.id),
                        api.getEmployeeById(user.id)
                    ]);
                    console.timeEnd('Personal Data');

                    const statsData = await api.getVacationStats(user.id, {
                        vacations: myVacations,
                        employee: myProfile
                    });

                    setVacations(myVacations || []);
                    setVacStats(statsData);
                }
            } catch (err) {
                console.error("❌ Failed to load dashboard data:", err);
            } finally {
                setLoading(false);
                console.timeEnd('Total Load Time');
                console.groupEnd();
            }
        };

        fetchData();
    }, [isAdmin, user?.id]);

    // Remove loading spinner - show stale data while revalidating
    // if (loading) {
    //     return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    // }

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}.${m}.${y}`;
    };

    // Helper for status chip color
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success.main';
            case 'rejected': return 'error.main';
            default: return 'warning.main';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved': return 'Təsdiqlənib';
            case 'rejected': return 'İmtina';
            default: return 'Gözləmədə';
        }
    };

    const handleCalendarClick = (vacation) => {
        if (!vacation || !user) return;

        if (isAdmin) {
            // Admin goes to employee page with highlight
            navigate(`/dashboard/employees/${vacation.employee_id}?highlight=${vacation.id}`);
        } else if (vacation.employee_id === user.id) {
            // User goes to own details page (NOT profile settings)
            navigate(`/dashboard/employees/${user.id}?highlight=${vacation.id}`);
        }
    };

    return (
        <Box>
            <Box mb={!isAdmin ? 4 : 2} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {!isAdmin && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<FlightTakeoff />}
                        sx={{ borderRadius: 2, px: 3, py: 1 }}
                        onClick={() => navigate(`/dashboard/employees/${user.id}`)}
                    >
                        Yeni Məzuniyyət Sorğusu
                    </Button>
                )}
            </Box>

            {/* Dashboard Stats */}
            <Grid container spacing={3}>
                {isAdmin ? (
                    // Admin Stats
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Ümumi İşçi"
                                value={stats?.total_employees}
                                loading={loading}
                                icon={<People fontSize="large" />}
                                color="#2563eb"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Aktiv İşçilər"
                                value={stats?.active_employees}
                                loading={loading}
                                icon={<Work fontSize="large" />}
                                color="#10b981"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box
                                onClick={handleVacationCardClick}
                                sx={{ cursor: 'pointer', height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                            >
                                <StatCard
                                    title="Məzuniyyətdə"
                                    value={stats?.employees_on_vacation}
                                    loading={loading}
                                    icon={<FlightTakeoff fontSize="large" />}
                                    color="#f59e0b"
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box
                                onClick={() => navigate('/dashboard/vacations?filter=pending')}
                                sx={{ cursor: 'pointer', height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                            >
                                <StatCard
                                    title="Gözləyən Sorğular"
                                    value={stats?.pending_requests}
                                    loading={loading}
                                    icon={<PendingActions fontSize="large" />}
                                    color="#ef4444"
                                />
                            </Box>
                        </Grid>
                    </>
                ) : (
                    // Employee Stats
                    <>
                        <Grid item xs={12} sm={4}>
                            <StatCard
                                title="Verilən Günlər"
                                value={vacStats?.total_days_given}
                                loading={loading}
                                icon={<Work fontSize="large" />}
                                color="#2563eb"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <StatCard
                                title="İstifadə Edilən"
                                value={vacStats?.used_paid}
                                loading={loading}
                                icon={<FlightTakeoff fontSize="large" />}
                                color="#f59e0b"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <StatCard
                                title="Qalan Məzuniyyət"
                                value={vacStats?.remaining}
                                loading={loading}
                                icon={<PendingActions fontSize="large" />}
                                color="#10b981"
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Calendar Widget - Visible to Everyone */}
            <Box mt={6}>
                <VacationCalendar
                    vacations={allVacations}
                    employees={employees}
                    onVacationClick={handleCalendarClick}
                    currentUser={user}
                    focusDate={focusDate}
                    highlightVacationId={highlightVacationId}
                />
            </Box>

            {/* Recent Activity Section */}
            {!isAdmin && (
                <Box mt={6}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Son Müraciətləriniz</Typography>
                    {vacations.filter(v => v.status === 'pending').length === 0 ? (
                        <Card variant="outlined" sx={{ borderStyle: 'dashed', bgcolor: 'transparent', p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">Gözləmədə olan sorğunuz yoxdur.</Typography>
                        </Card>
                    ) : (
                        <Grid container spacing={2}>
                            {vacations.filter(v => v.status === 'pending').slice(0, 3).map((vac) => (
                                <Grid item xs={12} key={vac.id}>
                                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, '&:last-child': { pb: 2 } }}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {vac.vacation_type === 'paid' ? 'Ödənişli Məzuniyyət' : vac.vacation_type === 'sick' ? 'Xəstəlik' : 'Ödənişsiz'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(vac.start_date)} - {formatDate(vac.end_date)} ({vac.days_count} gün)
                                                </Typography>
                                            </Box>
                                            <Box sx={{
                                                px: 2, py: 0.5, borderRadius: 10,
                                                bgcolor: `${getStatusColor(vac.status)}20`,
                                                color: getStatusColor(vac.status),
                                                fontSize: '0.875rem',
                                                fontWeight: 'bold',
                                                textTransform: 'capitalize'
                                            }}>
                                                {getStatusLabel(vac.status)}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}
            {/* Active Vacations Modal */}
            <Dialog open={openVacationModal} onClose={() => setOpenVacationModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Hazırda Məzuniyyətdə Olanlar</Typography>
                    <IconButton size="small" onClick={() => setOpenVacationModal(false)}>
                        <People fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    {activeVacations.length === 0 ? (
                        <Typography color="text.secondary" align="center" py={3}>
                            Hazırda məzuniyyətdə olan işçi yoxdur.
                        </Typography>
                    ) : (
                        <List>
                            {activeVacations.map((vac) => (
                                <ListItem
                                    key={vac.id}
                                    button
                                    onClick={() => navigate(`/dashboard/employees/${vac.employee_id}`)}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'orange' }}>
                                            {vac.employee_name ? vac.employee_name.charAt(0) : 'U'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={vac.employee_name || "Naməlum İşçi"}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {formatDate(vac.start_date)} - {formatDate(vac.end_date)}
                                                </Typography>
                                                <br />
                                                {`${vac.days_count} gün`}
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Home;
