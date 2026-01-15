import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import api from '../services/api';

const initialFormState = {
    first_name: '',
    last_name: '',
    father_name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    fin_code: '',
    department: '',
    position: '',
    salary: '',
    hire_date: '',
    birth_date: '',
    role: 'user'
};

const EmployeeFormDialog = ({ open, onClose, employee, onSuccess }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isEditMode = !!employee;

    useEffect(() => {
        if (open && employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                father_name: employee.father_name || '',
                username: employee.username || '',
                email: employee.email || '',
                phone: employee.phone || '',
                address: employee.address || '',
                fin_code: employee.fin_code || '',
                department: employee.department || '',
                position: employee.position || '',
                salary: employee.salary ? employee.salary.toString() : '',
                hire_date: employee.hire_date || '',
                birth_date: employee.birth_date || '',
                role: employee.role || 'user'
            });
        } else if (open) {
            setFormData(initialFormState);
        }
        setError('');
    }, [open, employee]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.first_name || !formData.last_name || !formData.username) {
            setError("Ad, Soyad və İstifadəçi adı mütləqdir!");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                salary: formData.salary ? parseFloat(formData.salary) : null
            };

            if (isEditMode) {
                await api.updateEmployee(employee.id, payload);
            } else {
                await api.createEmployee(payload);
            }

            if (onSuccess) onSuccess(isEditMode ? 'updated' : 'created');
            onClose();
        } catch (err) {
            console.error('Operation failed:', err);
            setError(err.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
                {isEditMode ? 'İşçi Məlumatlarını Yenilə' : 'Yeni İşçi Əlavə Et'}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Box component="form" sx={{ mt: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Ad" name="first_name" value={formData.first_name} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Soyad" name="last_name" value={formData.last_name} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Ata adı" name="father_name" value={formData.father_name} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="İstifadəçi adı (Login)" name="username" value={formData.username} onChange={handleChange} required disabled={isEditMode} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Rol</InputLabel>
                                <Select name="role" value={formData.role} label="Rol" onChange={handleChange}>
                                    <MenuItem value="user">İşçi (User)</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Telefon" name="phone" value={formData.phone} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Şöbə" name="department" value={formData.department} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Vəzifə" name="position" value={formData.position} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Maaş (AZN)" name="salary" type="number" value={formData.salary} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="FIN Kod" name="fin_code" value={formData.fin_code} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth label="İşə qəbul tarixi" name="hire_date" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.hire_date} onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth label="Doğum tarixi" name="birth_date" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.birth_date} onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField fullWidth label="Ünvan" name="address" value={formData.address} onChange={handleChange} multiline rows={2} />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={loading}>Ləğv et</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Yadda saxla' : 'Əlavə et')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EmployeeFormDialog;
