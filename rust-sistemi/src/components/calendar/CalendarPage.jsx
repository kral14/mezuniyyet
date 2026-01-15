import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Chip,
    Grid,
    Card,
    CardContent,
} from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarMonth } from '@mui/icons-material';
import { motion } from 'framer-motion';

const CalendarPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Generate calendar days
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    // Mock vacation data
    const vacations = [
        { day: 15, employee: 'Əli M.', type: 'approved' },
        { day: 16, employee: 'Əli M.', type: 'approved' },
        { day: 17, employee: 'Əli M.', type: 'approved' },
        { day: 18, employee: 'Ayşə H.', type: 'pending' },
        { day: 19, employee: 'Ayşə H.', type: 'pending' },
        { day: 20, employee: 'Rəşad Q.', type: 'approved' },
        { day: 21, employee: 'Rəşad Q.', type: 'approved' },
    ];

    const getVacationsForDay = (day) => {
        return vacations.filter(v => v.day === day);
    };

    const monthNames = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
        'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    const weekDays = ['Bz', 'B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş'];

    const days = getDaysInMonth(currentMonth);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Təqvim
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Məzuniyyət təqvimi
                </Typography>
            </motion.div>

            <Grid container spacing={3}>
                {/* Calendar */}
                <Grid item xs={12} md={8}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Paper sx={{ p: 3 }}>
                            {/* Month Navigation */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <IconButton onClick={prevMonth}>
                                    <ChevronLeft />
                                </IconButton>
                                <Typography variant="h5" fontWeight={600}>
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </Typography>
                                <IconButton onClick={nextMonth}>
                                    <ChevronRight />
                                </IconButton>
                            </Box>

                            {/* Week Day Headers */}
                            <Grid container spacing={1} sx={{ mb: 1 }}>
                                {weekDays.map((day) => (
                                    <Grid item xs={12 / 7} key={day}>
                                        <Box sx={{ textAlign: 'center', py: 1 }}>
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                {day}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Calendar Days */}
                            <Grid container spacing={1}>
                                {days.map((day, index) => {
                                    const dayVacations = day ? getVacationsForDay(day) : [];
                                    const isToday = day === new Date().getDate() &&
                                        currentMonth.getMonth() === new Date().getMonth() &&
                                        currentMonth.getFullYear() === new Date().getFullYear();

                                    return (
                                        <Grid item xs={12 / 7} key={index}>
                                            <Box
                                                sx={{
                                                    minHeight: 80,
                                                    p: 1,
                                                    border: '1px solid',
                                                    borderColor: isToday ? 'primary.main' : 'divider',
                                                    borderRadius: 1,
                                                    backgroundColor: day ? 'background.paper' : 'background.default',
                                                    position: 'relative',
                                                    '&:hover': day ? { borderColor: 'primary.light', cursor: 'pointer' } : {},
                                                }}
                                            >
                                                {day && (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={isToday ? 700 : 400}
                                                            color={isToday ? 'primary.main' : 'text.primary'}
                                                        >
                                                            {day}
                                                        </Typography>
                                                        <Box sx={{ mt: 0.5 }}>
                                                            {dayVacations.map((vac, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={vac.employee}
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize: 9,
                                                                        height: 16,
                                                                        mb: 0.5,
                                                                        width: '100%',
                                                                        backgroundColor: vac.type === 'approved' ? '#4caf5020' : '#ff980020',
                                                                        color: vac.type === 'approved' ? '#4caf50' : '#ff9800',
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </>
                                                )}
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Legend & Stats */}
                <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Rənglər
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 1 }} />
                                        <Typography variant="body2">Təsdiqlənmiş</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 1 }} />
                                        <Typography variant="body2">Gözləyən</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: 1 }} />
                                        <Typography variant="body2">Rədd edilmiş</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Bu Ay
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Cəmi Məzuniyyət
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700} color="primary.main">
                                            12
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Aktiv İşçilər
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            8
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CalendarPage;
