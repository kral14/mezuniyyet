import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Divider,
    Card,
    CardContent,
    Avatar,
    IconButton,
} from '@mui/material';
import { Edit, Save, Cancel, Notifications, Security, Palette, Language } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';

const SettingsPage = () => {
    const [editMode, setEditMode] = useState(false);
    const [settings, setSettings] = useState({
        name: 'Admin İstifadəçi',
        email: 'admin@company.az',
        phone: '+994 50 123 45 67',
        notifications: true,
        emailNotifications: true,
        autoApprove: false,
        darkMode: true,
        language: 'az',
    });

    const handleSave = () => {
        setEditMode(false);
        // Here you would save to backend
    };

    const handleCancel = () => {
        setEditMode(false);
        // Reset to original values
    };

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Parametrlər
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Sistem və profil tənzimləmələri
                </Typography>
            </motion.div>

            <Grid container spacing={3}>
                {/* Profile Settings */}
                <Grid item xs={12} md={8}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Edit sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight={600}>
                                        Profil Məlumatları
                                    </Typography>
                                </Box>
                                <Box>
                                    {editMode ? (
                                        <>
                                            <Button
                                                startIcon={<Save />}
                                                variant="contained"
                                                size="small"
                                                onClick={handleSave}
                                                sx={{ mr: 1 }}
                                            >
                                                Saxla
                                            </Button>
                                            <Button
                                                startIcon={<Cancel />}
                                                variant="outlined"
                                                size="small"
                                                onClick={handleCancel}
                                            >
                                                Ləğv et
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            startIcon={<Edit />}
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setEditMode(true)}
                                        >
                                            Dəyişdir
                                        </Button>
                                    )}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        bgcolor: 'primary.main',
                                        fontSize: 40,
                                        fontWeight: 700,
                                    }}
                                >
                                    A
                                </Avatar>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Ad Soyad"
                                        value={settings.name}
                                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                        disabled={!editMode}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={settings.email}
                                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                        disabled={!editMode}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Telefon"
                                        value={settings.phone}
                                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                        disabled={!editMode}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Notifications */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Notifications sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight={600}>
                                    Bildirişlər
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.notifications}
                                            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                                        />
                                    }
                                    label="Push Bildirişləri"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.emailNotifications}
                                            onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                        />
                                    }
                                    label="Email Bildirişləri"
                                />
                            </Box>
                        </Paper>

                        {/* System Settings */}
                        <Paper sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Security sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight={600}>
                                    Sistem Tənzimləmələri
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.autoApprove}
                                            onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })}
                                        />
                                    }
                                    label="Avtomatik Təsdiqləmə (24 saat qəbul edilməyən müraciətlər)"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.darkMode}
                                            onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                                        />
                                    }
                                    label="Qaranlıq Tema"
                                />
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} color="white" gutterBottom>
                                    Sistem Versiyası
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="white">
                                    v1.0.0
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                                    Son Yeniləmə: 27 Dekabr 2025
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Palette sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight={600}>
                                        Görünüş
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Material-UI v6 Dark Theme
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Language sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight={600}>
                                        Dil
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Azərbaycan dili (AZ)
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SettingsPage;
