import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import api from '../services/api';

import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_employees: 0,
        active_employees: 0,
        employees_on_vacation: 0,
        pending_requests: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Stats fetching failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { title: 'Ümumi İşçilər', value: stats.total_employees, color: '#3b82f6' },
        { title: 'Aktiv İşçilər', value: stats.active_employees, color: '#10b981' },
        { title: 'Məzuniyyətdə', value: stats.employees_on_vacation, color: '#8b5cf6' },
        { title: 'Gözləyən Sorğular', value: stats.pending_requests, color: '#f59e0b', action: () => navigate('/dashboard/vacations?filter=pending') },
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="text.primary">
                Ana Səhifə
            </Typography>

            <Grid container spacing={3}>
                {/* Stat Cards */}
                {statCards.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Paper
                            elevation={2}
                            onClick={stat.action ? stat.action : undefined}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                borderLeft: `5px solid ${stat.color}`,
                                height: '100%',
                                cursor: stat.action ? 'pointer' : 'default',
                                transition: 'transform 0.2s',
                                '&:hover': stat.action ? { transform: 'scale(1.02)', boxShadow: 3 } : {}
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                {stat.title}
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                {stat.value}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}

                {/* Recent Activity or Calendar placeholder */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                        <Typography variant="h6" gutterBottom>Məzuniyyət Təqvimi</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', bgcolor: '#f8fafc', borderRadius: 2 }}>
                            <Typography color="text.disabled">Calendar Component Widget</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                        <Typography variant="h6" gutterBottom>Son Hərəkətlər</Typography>
                        {/* List */}
                        <Typography variant="body2" color="text.secondary">Hələlik məlumat yoxdur</Typography>
                    </Paper>
                </Grid>

            </Grid>
        </Box>
    );
};

export default Dashboard;
