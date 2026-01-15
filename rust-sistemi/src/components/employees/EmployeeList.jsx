import { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Chip,
    TextField,
    InputAdornment,
    Button,
    IconButton,
    Paper,
} from '@mui/material';
import { Search, Add, Edit, Delete, Email, Phone } from '@mui/icons-material';
import { motion } from 'framer-motion';

const EmployeeCard = ({ employee }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -8, boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)' }}
        transition={{ type: 'spring', stiffness: 300 }}
    >
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'visible',
            }}
        >
            <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: 'primary.main',
                            fontSize: 32,
                            fontWeight: 700,
                        }}
                    >
                        {employee.name.charAt(0)}
                    </Avatar>
                </motion.div>

                <Typography variant="h6" fontWeight={600} gutterBottom>
                    {employee.name}
                </Typography>

                <Chip
                    label={employee.position}
                    size="small"
                    sx={{
                        mb: 2,
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        color: 'primary.main',
                    }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                            {employee.email}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                            {employee.phone}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        İllik: <strong>{employee.annualLeaveDays} gün</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Qalıq: <strong>{employee.remainingDays} gün</strong>
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
                    <IconButton size="small" color="primary">
                        <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    </motion.div>
);

const EmployeeList = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data
    const employees = [
        {
            id: 1,
            name: 'Əli Məmmədov',
            position: 'Senior Developer',
            email: 'ali.memmedov@company.az',
            phone: '+994 50 123 45 67',
            annualLeaveDays: 24,
            remainingDays: 18,
        },
        {
            id: 2,
            name: 'Ayşə Həsənova',
            position: 'UI/UX Designer',
            email: 'ayse.hesenova@company.az',
            phone: '+994 55 234 56 78',
            annualLeaveDays: 24,
            remainingDays: 20,
        },
        {
            id: 3,
            name: 'Rəşad Quliyev',
            position: 'Backend Developer',
            email: 'resad.quliyev@company.az',
            phone: '+994 70 345 67 89',
            annualLeaveDays: 24,
            remainingDays: 15,
        },
        {
            id: 4,
            name: 'Səbinə Əliyeva',
            position: 'Project Manager',
            email: 'sebine.eliyeva@company.az',
            phone: '+994 51 456 78 90',
            annualLeaveDays: 28,
            remainingDays: 22,
        },
        {
            id: 5,
            name: 'Elvin Musayev',
            position: 'QA Engineer',
            email: 'elvin.musayev@company.az',
            phone: '+994 55 567 89 01',
            annualLeaveDays: 24,
            remainingDays: 10,
        },
        {
            id: 6,
            name: 'Nigar Hüseynova',
            position: 'DevOps Engineer',
            email: 'nigar.huseynova@company.az',
            phone: '+994 50 678 90 12',
            annualLeaveDays: 24,
            remainingDays: 24,
        },
    ];

    const filteredEmployees = employees.filter(
        (emp) =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        İşçilər
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Cəmi {employees.length} işçi
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
                        Yeni İşçi
                    </Button>
                </motion.div>
            </Box>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Paper sx={{ p: 3, mb: 4 }}>
                    <TextField
                        fullWidth
                        placeholder="İşçi axtar (ad, vəzifə...)"
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
                </Paper>
            </motion.div>

            {/* Employee Cards Grid */}
            <Grid container spacing={3}>
                {filteredEmployees.map((employee, index) => (
                    <Grid item xs={12} sm={6} md={4} key={employee.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <EmployeeCard employee={employee} />
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {filteredEmployees.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        Heç bir işçi tapılmadı
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default EmployeeList;
