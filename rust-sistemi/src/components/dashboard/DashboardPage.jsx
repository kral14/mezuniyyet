import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress } from '@mui/material';
import { People, BeachAccess, HourglassEmpty, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color, progress }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ type: 'spring', stiffness: 300 }}
    >
        <Card
            sx={{
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
                height: '100%',
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={color}>
                            {value}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}20`,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
                {progress !== undefined && (
                    <Box sx={{ mt: 2 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: `${color}10`,
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: color,
                                },
                            }}
                        />
                    </Box>
                )}
            </CardContent>
        </Card>
    </motion.div>
);

const RecentVacationItem = ({ employee, startDate, endDate, status }) => {
    const statusColors = {
        approved: '#4caf50',
        pending: '#ff9800',
        rejected: '#f44336',
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
            }}
        >
            <Box>
                <Typography variant="body2" fontWeight={600}>
                    {employee}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {startDate} - {endDate}
                </Typography>
            </Box>
            <Box
                sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: `${statusColors[status]}20`,
                }}
            >
                <Typography variant="caption" fontWeight={600} sx={{ color: statusColors[status] }}>
                    {status === 'approved' ? 'Təsdiqləndi' : status === 'pending' ? 'Gözləyir' : 'Rədd edildi'}
                </Typography>
            </Box>
        </Box>
    );
};

const DashboardPage = () => {
    const stats = [
        {
            title: 'Cəmi İşçilər',
            value: '45',
            icon: <People sx={{ fontSize: 32, color: '#667eea' }} />,
            color: '#667eea',
            progress: 75,
        },
        {
            title: 'Aktiv Məzuniyyətlər',
            value: '8',
            icon: <BeachAccess sx={{ fontSize: 32, color: '#4caf50' }} />,
            color: '#4caf50',
            progress: 60,
        },
        {
            title: 'Gözləyən Müraciətlər',
            value: '12',
            icon: <HourglassEmpty sx={{ fontSize: 32, color: '#ff9800' }} />,
            color: '#ff9800',
            progress: 40,
        },
        {
            title: 'Bu Ay Təsdiqləndi',
            value: '23',
            icon: <CheckCircle sx={{ fontSize: 32, color: '#764ba2' }} />,
            color: '#764ba2',
            progress: 85,
        },
    ];

    const recentVacations = [
        { employee: 'Əli Məmmədov', startDate: '15 Yan', endDate: '22 Yan', status: 'approved' },
        { employee: 'Ayşə Həsənova', startDate: '18 Yan', endDate: '25 Yan', status: 'pending' },
        { employee: 'Rəşad Quliyev', startDate: '20 Yan', endDate: '27 Yan', status: 'approved' },
        { employee: 'Səbinə Əliyeva', startDate: '22 Yan', endDate: '29 Yan', status: 'pending' },
        { employee: 'Elvin Musayev', startDate: '10 Yan', endDate: '14 Yan', status: 'rejected' },
    ];

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Məzuniyyət sisteminin ümumi görünüşü
                </Typography>
            </motion.div>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <StatCard {...stat} />
                    </Grid>
                ))}
            </Grid>

            {/* Recent Activity */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Son Məzuniyyət Müraciətləri
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                {recentVacations.map((vacation, index) => (
                                    <RecentVacationItem key={index} {...vacation} />
                                ))}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>

                <Grid item xs={12} md={4}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Qarşıdan Gələn Məzuniyyətlər
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    Bu həftə 3 işçi məzuniyyətə çıxacaq
                                </Typography>
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
