import { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    TextField,
    InputAdornment,
    Button,
    Paper,
    Avatar,
} from '@mui/material';
import { Search, Add, CalendarMonth, CheckCircle, HourglassEmpty, Cancel } from '@mui/icons-material';
import { motion } from 'framer-motion';

const VacationCard = ({ vacation }) => {
    const statusConfig = {
        approved: { color: '#4caf50', label: 'Təsdiqləndi', icon: <CheckCircle /> },
        pending: { color: '#ff9800', label: 'Gözləyir', icon: <HourglassEmpty /> },
        rejected: { color: '#f44336', label: 'Rədd edildi', icon: <Cancel /> },
    };

    const config = statusConfig[vacation.status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)' }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>{vacation.employeeName.charAt(0)}</Avatar>
                            <Box>
                                <Typography variant="h6" fontSize={16} fontWeight={600}>
                                    {vacation.employeeName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {vacation.position}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip
                            icon={config.icon}
                            label={config.label}
                            size="small"
                            sx={{
                                backgroundColor: `${config.color}20`,
                                color: config.color,
                                '& .MuiChip-icon': { color: config.color },
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Başlama
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {vacation.startDate}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Bitmə
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {vacation.endDate}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Müddət
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {vacation.days} gün
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Səbəb
                        </Typography>
                        <Typography variant="body2">{vacation.reason}</Typography>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const VacationList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    // Mock data
    const vacations = [
        {
            id: 1,
            employeeName: 'Əli Məmmədov',
            position: 'Senior Developer',
            startDate: '15 Yan 2025',
            endDate: '22 Yan 2025',
            days: 7,
            reason: 'Ailə ilə istirahət',
            status: 'approved',
        },
        {
            id: 2,
            employeeName: 'Ayşə Həsənova',
            position: 'UI/UX Designer',
            startDate: '18 Yan 2025',
            endDate: '25 Yan 2025',
            days: 7,
            reason: 'Xaricdə səyahət',
            status: 'pending',
        },
        {
            id: 3,
            employeeName: 'Rəşad Quliyev',
            position: 'Backend Developer',
            startDate: '20 Yan 2025',
            endDate: '27 Yan 2025',
            days: 7,
            reason: 'Şəxsi işlər',
            status: 'approved',
        },
        {
            id: 4,
            employeeName: 'Səbinə Əliyeva',
            position: 'Project Manager',
            startDate: '22 Yan 2025',
            endDate: '29 Yan 2025',
            days: 7,
            reason: 'İstirahət',
            status: 'pending',
        },
        {
            id: 5,
            employeeName: 'Elvin Musayev',
            position: 'QA Engineer',
            startDate: '10 Yan 2025',
            endDate: '14 Yan 2025',
            days: 4,
            reason: 'Təcili ailə işi',
            status: 'rejected',
        },
    ];

    const filteredVacations = vacations.filter((vac) => {
        const matchesSearch = vac.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || vac.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Məzuniyyətlər
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Cəmi {vacations.length} müraciət
                    </Typography>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{
                            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                            boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
                        }}
                    >
                        Yeni Müraciət
                    </Button>
                </motion.div>
            </Box>

            {/* Search & Filter */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                placeholder="Axtar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant={filter === 'all' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setFilter('all')}
                                    fullWidth
                                >
                                    Hamısı
                                </Button>
                                <Button
                                    variant={filter === 'pending' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setFilter('pending')}
                                    fullWidth
                                >
                                    Gözləyir
                                </Button>
                                <Button
                                    variant={filter === 'approved' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setFilter('approved')}
                                    fullWidth
                                >
                                    Təsdiqləndi
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </motion.div>

            {/* Vacation Cards */}
            <Grid container spacing={3}>
                {filteredVacations.map((vacation, index) => (
                    <Grid item xs={12} md={6} key={vacation.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <VacationCard vacation={vacation} />
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {filteredVacations.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        Heç bir müraciət tapılmadı
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default VacationList;
