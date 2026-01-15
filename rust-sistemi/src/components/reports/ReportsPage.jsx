import { Box, Grid, Paper, Typography, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, People, BeachAccess } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ReportsPage = () => {
    // Mock data for charts
    const monthlyData = [
        { month: 'Yan', approved: 23, pending: 5, rejected: 2 },
        { month: 'Fev', approved: 18, pending: 8, rejected: 3 },
        { month: 'Mar', approved: 25, pending: 4, rejected: 1 },
        { month: 'Apr', approved: 30, pending: 6, rejected: 2 },
        { month: 'May', approved: 28, pending: 7, rejected: 4 },
        { month: 'İyun', approved: 22, pending: 5, rejected: 2 },
    ];

    const departmentData = [
        { name: 'IT', value: 45 },
        { name: 'HR', value: 20 },
        { name: 'Satış', value: 25 },
        { name: 'Maliyyə', value: 15 },
        { name: 'Marketinq', value: 18 },
    ];

    const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

    const stats = [
        {
            title: 'Bu Aylıq Artım',
            value: '+12%',
            icon: <TrendingUp sx={{ fontSize: 32, color: '#4caf50' }} />,
            color: '#4caf50',
            change: 'positive',
        },
        {
            title: 'Orta Müddət',
            value: '8.5 gün',
            icon: <BeachAccess sx={{ fontSize: 32, color: '#667eea' }} />,
            color: '#667eea',
            change: 'neutral',
        },
        {
            title: 'Ən Aktiv Şöbə',
            value: 'IT',
            icon: <People sx={{ fontSize: 32, color: '#764ba2' }} />,
            color: '#764ba2',
            change: 'neutral',
        },
        {
            title: 'İmtina Dərəcəsi',
            value: '-3%',
            icon: <TrendingDown sx={{ fontSize: 32, color: '#f44336' }} />,
            color: '#f44336',
            change: 'negative',
        },
    ];

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Hesabatlar
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Məzuniyyət statistikası və analitika
                </Typography>
            </motion.div>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <Card
                                sx={{
                                    background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                                    border: `1px solid ${stat.color}30`,
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {stat.title}
                                            </Typography>
                                            <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
                                                {stat.value}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                backgroundColor: `${stat.color}20`,
                                                borderRadius: 2,
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {stat.icon}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                {/* Monthly Trend */}
                <Grid item xs={12} lg={8}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Aylıq Trend
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Son 6 ayın məzuniyyət statistikası
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="approved" fill="#4caf50" name="Təsdiqləndi" />
                                    <Bar dataKey="pending" fill="#ff9800" name="Gözləyir" />
                                    <Bar dataKey="rejected" fill="#f44336" name="Rədd edildi" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Department Distribution */}
                <Grid item xs={12} lg={4}>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Şöbə üzrə Bölgü
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                İşçi sayı
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={departmentData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {departmentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReportsPage;
