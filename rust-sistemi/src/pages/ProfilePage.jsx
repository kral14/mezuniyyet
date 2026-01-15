import React, { useState, useEffect } from 'react';
import {
    Box, Container, Paper, Tabs, Tab, Typography,
    TextField, Button, Grid, Avatar, IconButton,
    Alert, Snackbar, CircularProgress, Divider, Dialog
} from '@mui/material';
import { PhotoCamera, Save, Lock, Delete, Close } from '@mui/icons-material';
import { api } from '../services/api';

const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const ProfilePage = () => {
    const [tabValue, setTabValue] = useState(0);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        father_name: '',
        email: '',
        phone: '',
        address: '',
        birth_date: '',
        fin_code: ''
    });
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const currentUser = api.getCurrentUser();
            const isApp = api.isTauri ? api.isTauri() : "undefined";
            console.log(`🔍 ProfilePage: Loading profile. isTauri=${isApp}. User:`, currentUser);

            if (!currentUser || !currentUser.id) {
                console.error("❌ ProfilePage: No user ID found in local storage!");
                showSnackbar('İstifadəçi məlumatları tapılmadı', 'error');
                return;
            }

            console.log("🚀 ProfilePage: Calling api.getMyProfile()...");
            const data = await api.getMyProfile();
            console.log("✅ ProfilePage: Data received:", data);

            if (!data) {
                throw new Error("API-dən boş məlumat gəldi");
            }

            setProfile(data);
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                father_name: data.father_name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                birth_date: data.birth_date || '',
                fin_code: data.fin_code || ''
            });

            // Update local storage user object so sidebar updates
            api.updateLocalUser({
                name: data.name,
                profile_image: data.profile_image
            });
        } catch (err) {
            console.error("❌ Profile Load Error (Full):", err);
            showSnackbar(`Profil yükləmə xətası: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleDeleteImage = async () => {
        if (!window.confirm('Şəkli silmək istədiyinizə əminsiniz?')) return;
        try {
            setSaving(true);
            await api.deleteProfileImage();
            showSnackbar('Şəkil silindi');
            loadProfile();
        } catch (err) {
            showSnackbar(err.message || 'Xəta baş verdi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            await api.updateProfile(formData);
            showSnackbar('Profil uğurla yeniləndi');
            loadProfile(); // Reload to get updated data
        } catch (err) {
            showSnackbar(err.message || 'Xəta baş verdi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            showSnackbar('Şifrələr uyğun gəlmir', 'error');
            return;
        }

        if (passwordData.new_password.length < 2) {
            showSnackbar('Yeni şifrə ən azı 2 simvol olmalıdır', 'error');
            return;
        }

        try {
            setSaving(true);
            await api.changePassword(passwordData.old_password, passwordData.new_password);
            showSnackbar('Şifrə uğurla dəyişdirildi');
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            showSnackbar(err.message || 'Şifrə dəyişdirilmədi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setSaving(true);
            // Resize to 300x300 roughly
            const base64 = await resizeImage(file, 300, 300);
            await api.uploadProfileImage(base64);
            showSnackbar('Şəkil uğurla yükləndi');
            loadProfile();
        } catch (err) {
            showSnackbar(err.message || 'Şəkil yüklənmədi', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3}>
                {/* Header with Avatar */}
                <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: '4px 4px 0 0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={api.getImageUrl(profile?.profile_image)}
                                onError={(e) => {
                                    console.error("Image load failed:", profile?.profile_image?.substring(0, 50));
                                    e.target.src = null; // Clear if broken
                                }}
                                sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: 'white',
                                    color: 'primary.main',
                                    fontSize: '2rem',
                                    cursor: profile?.profile_image ? 'pointer' : 'default',
                                    border: '2px solid white'
                                }}
                                onClick={() => profile?.profile_image && setImageModalOpen(true)}
                            >
                                {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                            </Avatar>
                            <IconButton
                                component="label"
                                sx={{
                                    position: 'absolute',
                                    bottom: -5,
                                    right: -5,
                                    bgcolor: 'white',
                                    '&:hover': { bgcolor: 'grey.100' },
                                    boxShadow: 2
                                }}
                                size="small"
                            >
                                <PhotoCamera fontSize="small" color="primary" />
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </IconButton>
                            {profile?.profile_image && (
                                <IconButton
                                    onClick={handleDeleteImage}
                                    sx={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        bgcolor: 'white',
                                        '&:hover': { bgcolor: 'grey.100' },
                                        boxShadow: 2
                                    }}
                                    size="small"
                                >
                                    <Delete fontSize="small" color="error" />
                                </IconButton>
                            )}
                        </Box>
                        <Box>
                            <Typography variant="h5">{profile?.name}</Typography>
                            <Typography variant="body2">{profile?.department} • {profile?.position}</Typography>
                            <Typography variant="caption">@{profile?.username}</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Tabs */}
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Şəxsi Məlumatlar" />
                    <Tab label="Hesab Ayarları" />
                </Tabs>

                {/* Tab 1: Personal Info */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Ad"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Soyad"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Ata adı"
                                name="father_name"
                                value={formData.father_name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Telefon"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Doğum tarixi"
                                name="birth_date"
                                type="date"
                                value={formData.birth_date}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="FIN Kod"
                                name="fin_code"
                                value={formData.fin_code}
                                onChange={handleChange}
                                helperText="Şəxsiyyət vəsiqəsinin FIN kodu"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="İşə qəbul tarixi"
                                value={profile?.hire_date || ''}
                                disabled
                                helperText="Read-only"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Şöbə"
                                value={profile?.department || ''}
                                disabled
                                helperText="Admin tərəfindən dəyişdirilir"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Vəzifə"
                                value={profile?.position || ''}
                                disabled
                                helperText="Admin tərəfindən dəyişdirilir"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Maaş"
                                value={profile?.salary ? `${profile.salary} AZN` : ''}
                                disabled
                                helperText="Cari maaş"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Ünvan"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                >
                                    {saving ? 'Saxlanılır...' : 'Yadda saxla'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Tab 2: Password */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info">
                                Təhlükəsizlik üçün köhnə şifrənizi təsdiqləməlisiniz
                            </Alert>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="İstifadəçi adı"
                                value={profile?.username || ''}
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Köhnə şifrə"
                                name="old_password"
                                type="password"
                                value={passwordData.old_password}
                                onChange={handlePasswordChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Yeni şifrə"
                                name="new_password"
                                type="password"
                                value={passwordData.new_password}
                                onChange={handlePasswordChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Şifrəni təsdiq edin"
                                name="confirm_password"
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={handlePasswordChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<Lock />}
                                    onClick={handleChangePassword}
                                    disabled={saving || !passwordData.old_password || !passwordData.new_password}
                                >
                                    {saving ? 'Dəyişdirilir...' : 'Şifrəni dəyişdir'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Image Preview Modal */}
            <Dialog
                open={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                maxWidth="md"
            >
                <Box sx={{ position: 'relative', p: 1, bgcolor: 'black' }}>
                    <IconButton
                        onClick={() => setImageModalOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
                    >
                        <Close />
                    </IconButton>
                    <img
                        src={api.getImageUrl(profile?.profile_image)}
                        alt="Profile"
                        style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }}
                    />
                </Box>
            </Dialog>
        </Container>
    );
};

export default ProfilePage;
