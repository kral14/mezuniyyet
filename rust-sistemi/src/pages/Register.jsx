import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Divider,
    IconButton,
    CircularProgress,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Paper
} from '@mui/material';
import { ArrowBack, Person, Work, VpnKey, ChevronRight, ChevronLeft } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api, { isTauri } from '../services/api';

// ... (TabPanel component restored)
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const Register = () => {
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        father_name: '',
        phone: '',
        address: '',
        birth_date: '1990-01-01',
        email: '',
        fin_code: '',
        department_id: '',
        position_id: '',
        username: '',
        password: '',
        confirm_password: ''
    });

    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const loadCatalogs = async (retryCount = 0) => {
        try {
            const depts = await api.getDepartments();
            const posts = await api.getPositions();
            console.log('📦 Departments loaded:', depts);
            setDepartments(depts);
            setPositions(posts);
            setError('');
        } catch (err) {
            console.error(`Catalogs load failed (Attempt ${retryCount + 1}):`, err);

            // If error is "Tenant not selected", retry a few times
            if (retryCount < 3) {
                console.log("⏳ Retrying catalog load in 1s...");
                setTimeout(() => loadCatalogs(retryCount + 1), 1000);
            } else {
                // Only show error after retries failed
                // setError('Məlumatları yükləmək olmadı: ' + (err.message || err));
            }
        }
    };

    useEffect(() => {
        loadCatalogs();

        if (isTauri()) {
            const handler = () => {
                console.log("🔄 Auth restored, reloading catalogs...");
                loadCatalogs();
            };
            window.addEventListener('auth-restored', handler);
            return () => window.removeEventListener('auth-restored', handler);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleDateChange = (value) => {
        let finalDate = value;
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

        if (/^\d{1,2}$/.test(value)) {
            const day = String(value).padStart(2, '0');
            finalDate = `${currentYear}-${currentMonth}-${day}`;
        }
        else if (/^\d{1,2}[./-]\d{1,2}$/.test(value)) {
            const [d, m] = value.split(/[./-]/);
            finalDate = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
        setFormData(prev => ({ ...prev, birth_date: finalDate }));
    };

    const validateTab = (index) => {
        if (index === 0) {
            return formData.first_name && formData.last_name && formData.fin_code;
        }
        if (index === 1) {
            return formData.department_id && formData.position_id;
        }
        return true;
    };

    const nextTab = () => {
        if (validateTab(tabValue)) {
            setTabValue(prev => prev + 1);
            setError('');
        } else {
            setError('Zəhmət olmasa vacib sahələri doldurun!');
        }
    }

    const prevTab = () => setTabValue(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Şifrələr uyğun gəlmir!');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                department_id: formData.department_id ? parseInt(formData.department_id) : null,
                position_id: formData.position_id ? parseInt(formData.position_id) : null
            };
            delete payload.confirm_password;

            console.log('🚀 Sending registration request:', payload);
            const response = await api.registerUser(payload);
            console.log('✅ Registration response:', response);

            if (response && response.success) {
                setSuccess(true);
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                console.error('❌ Registration failed:', response);
                setError(response?.message || 'Qeydiyyat uğursuz oldu');
            }
        } catch (err) {
            console.error('💥 Registration error:', err);
            setError('Sistem xətası: ' + err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                p: 2
            }}
        >
            <Card
                sx={{
                    maxWidth: 700,
                    width: '100%',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.98)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    overflow: 'hidden'
                }}
            >
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                        <IconButton onClick={() => navigate('/login')} sx={{ mr: 2, color: 'white' }}>
                            <ArrowBack />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">İşçi Qeydiyyatı</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>AZTRADE şirkətinə yeni üzv əlavə edin</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" centered>
                            <Tab icon={<Person />} label="Şəxsi" disabled={loading} />
                            <Tab icon={<Work />} label="İş" disabled={loading} />
                            <Tab icon={<VpnKey />} label="Sistem" disabled={loading} />
                        </Tabs>
                    </Box>

                    <Box sx={{ p: 4, minHeight: 400 }}>
                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <TabPanel value={tabValue} index={0}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Ad" name="first_name" value={formData.first_name} onChange={handleChange} required variant="outlined" size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Soyad" name="last_name" value={formData.last_name} onChange={handleChange} required variant="outlined" size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Ata adı" name="father_name" value={formData.father_name} onChange={handleChange} variant="outlined" size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="FIN Kod" name="fin_code" value={formData.fin_code} onChange={handleChange} required variant="outlined" size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth label="Doğum tarixi" name="birth_date"
                                            placeholder="YYYY-MM-DD"
                                            value={formData.birth_date}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            variant="outlined" size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Telefon" name="phone" value={formData.phone} onChange={handleChange} variant="outlined" size="small" />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} variant="outlined" size="small" />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Ünvan" name="address" value={formData.address} onChange={handleChange} variant="outlined" size="small" multiline rows={2} />
                                    </Grid>
                                </Grid>
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField select fullWidth label="Şöbə" name="department_id" value={formData.department_id} onChange={handleChange} variant="outlined" required>
                                            <MenuItem value="">— Seçin —</MenuItem>
                                            {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField select fullWidth label="Vəzifə" name="position_id" value={formData.position_id} onChange={handleChange} variant="outlined" required>
                                            <MenuItem value="">— Seçin —</MenuItem>
                                            {positions.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </TabPanel>

                            <TabPanel value={tabValue} index={2}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="İstifadəçi adı" name="username" value={formData.username} onChange={handleChange} required variant="outlined" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Şifrə" name="password" type="password" value={formData.password} onChange={handleChange} required variant="outlined" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Şifrəni təsdiq edin" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} required variant="outlined" />
                                    </Grid>
                                </Grid>
                            </TabPanel>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                                <Button
                                    variant="text"
                                    onClick={tabValue === 0 ? () => navigate('/login') : prevTab}
                                    startIcon={tabValue > 0 ? <ChevronLeft /> : null}
                                >
                                    {tabValue === 0 ? 'Geri' : 'Əvvəlki'}
                                </Button>

                                {tabValue < 2 ? (
                                    <Button variant="contained" onClick={nextTab} endIcon={<ChevronRight />} sx={{ px: 4, borderRadius: 2 }}>
                                        Növbəti
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="success"
                                        disabled={loading}
                                        sx={{ px: 6, fontWeight: 'bold', borderRadius: 2 }}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Qeydiyyatı Tamamla'}
                                    </Button>
                                )}
                            </Box>
                        </form>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar open={success} autoHideDuration={3000}>
                <Alert severity="success">Qeydiyyat uğurla tamamlandı! Dashboard-a keçid edilir...</Alert>
            </Snackbar>
        </Box>
    );
};

export default Register;
