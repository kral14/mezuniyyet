import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Grid, Tab, Tabs, Alert,
    FormControl, InputLabel, Select, MenuItem, Box,
    Checkbox, FormControlLabel, FormGroup, FormLabel // Added imports
} from '@mui/material';
import api from '../services/api';

const EditEmployeeModal = ({ open, onClose, employee, onSave }) => {
    const [formData, setFormData] = useState({});
    const [passwordData, setPasswordData] = useState({ new_password: '', confirm_password: '' });
    const [tabValue, setTabValue] = useState(0);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);

    useEffect(() => {
        if (open) {
            loadDictionaries();
        }
    }, [open]);

    const loadDictionaries = async () => {
        try {
            const [depts, poss] = await Promise.all([
                api.getDepartments(),
                api.getPositions()
            ]);
            setDepartments(depts);
            setPositions(poss);
        } catch (err) {
            console.error("Failed to load dictionaries:", err);
        }
    };

    useEffect(() => {
        if (employee) {
            setFormData({
                username: employee.username || '',
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                father_name: employee.father_name || '',
                email: employee.email || '',
                phone_number: employee.phone_number || employee.phone || '', // Check both
                address: employee.address || '',
                birth_date: employee.birth_date || '',
                department_id: employee.department_id || '',
                position_id: employee.position_id || '',
                fin_code: employee.fin_code || '',
                hire_date: employee.hire_date || '',
                salary: employee.salary || '',
                total_vacation_days: employee.total_vacation_days || 21,
                max_sessions: employee.max_sessions || 4,
                role: employee.role || 'user',
                permissions: employee.permissions || [] // Init permissions
            });
        }
    }, [employee]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        let newPermissions = [...(formData.permissions || [])];
        if (checked) {
            if (!newPermissions.includes(name)) newPermissions.push(name);
        } else {
            newPermissions = newPermissions.filter(p => p !== name);
        }
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleSaveProfile = () => {
        const payload = {
            ...formData,
            salary: formData.salary !== '' ? parseFloat(formData.salary) : null,
            total_vacation_days: formData.total_vacation_days ? parseInt(formData.total_vacation_days, 10) : null,
            max_sessions: formData.max_sessions ? parseInt(formData.max_sessions, 10) : null,
            department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
            position_id: formData.position_id ? parseInt(formData.position_id, 10) : null,
            birth_date: formData.birth_date === '' ? null : formData.birth_date,
            hire_date: formData.hire_date === '' ? null : formData.hire_date,
            // Sync 'name' with First + Last
            name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || formData.username,
            // Backend expects 'phone' not 'phone_number'
            phone: formData.phone_number,
            role: formData.role,
            permissions: formData.permissions // Send permissions
        };
        console.log("DEBUG: Sending profile update payload:", payload);
        onSave('profile', payload, employee?.id);
    };

    const handleSavePassword = () => {
        if (!passwordData.new_password) {
            alert('Şifrəni daxil edin');
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            alert('Şifrələr uyğun gəlmir');
            return;
        }
        onSave('password', passwordData.new_password, employee?.id);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                İşçi məlumatlarını redaktə et
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                    <Tab label="Şəxsi Məlumatlar" />
                    <Tab label="Şifrə" />
                    <Tab label="İcazələr (Permissions)" />
                </Tabs>

                {tabValue === 0 && (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="İstifadəçi adı (Login)" name="username" value={formData.username || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Ad" name="first_name" value={formData.first_name || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Soyad" name="last_name" value={formData.last_name || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Ata adı" name="father_name" value={formData.father_name || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Email" name="email" value={formData.email || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Telefon" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Doğum tarixi" name="birth_date" type="date" value={formData.birth_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Şöbə</InputLabel>
                                <Select
                                    name="department_id"
                                    value={formData.department_id || ''}
                                    label="Şöbə"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">Seçin</MenuItem>
                                    {departments.map(d => (
                                        <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Vəzifə</InputLabel>
                                <Select
                                    name="position_id"
                                    value={formData.position_id || ''}
                                    label="Vəzifə"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">Seçin</MenuItem>
                                    {positions.map(p => (
                                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role || 'user'}
                                    label="Rol"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="user">İstifadəçi</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="hr">HR</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="FIN Kod" name="fin_code" value={formData.fin_code || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="İşə qəbul tarixi" name="hire_date" type="date" value={formData.hire_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Maaş (AZN)" name="salary" type="number" value={formData.salary || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Məzuniyyət haqqı (gün)" name="total_vacation_days" type="number" value={formData.total_vacation_days || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Maks. Hissə" name="max_sessions" type="number" value={formData.max_sessions || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Ünvan" name="address" value={formData.address || ''} onChange={handleChange} multiline rows={2} />
                        </Grid>
                    </Grid>
                )}

                {tabValue === 1 && (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 2 }}>Admin köhnə şifrə olmadan dəyişdirə bilər</Alert>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Yeni şifrə" name="new_password" type="password" value={passwordData.new_password || ''} onChange={handlePasswordChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Şifrəni təsdiq edin" name="confirm_password" type="password" value={passwordData.confirm_password || ''} onChange={handlePasswordChange} />
                        </Grid>
                    </Grid>
                )}

                {/* Permissions Tab */}
                {tabValue === 2 && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            İstifadəçiyə xüsusi icazələr verin (Rolundan asılı olmayaraq)
                        </Alert>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Profil İcazələri</FormLabel>
                                    <FormGroup>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={formData.permissions?.includes('view_other_profiles') || false}
                                                    onChange={handlePermissionChange}
                                                    name="view_other_profiles"
                                                />
                                            }
                                            label="Bütün Profillərə Baxış (View All Profiles)"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={formData.permissions?.includes('edit_other_profiles') || false}
                                                    onChange={handlePermissionChange}
                                                    name="edit_other_profiles"
                                                />
                                            }
                                            label="Başqasını Redaktə Etmək (Edit Profiles)"
                                        />
                                    </FormGroup>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Məzuniyyət İcazələri</FormLabel>
                                    <FormGroup>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={formData.permissions?.includes('manage_vacations') || false}
                                                    onChange={handlePermissionChange}
                                                    name="manage_vacations"
                                                />
                                            }
                                            label="Məzuniyyətləri İdarə Etmək"
                                        />
                                    </FormGroup>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Ləğv et</Button>
                <Button
                    variant="contained"
                    onClick={tabValue === 1 ? handleSavePassword : handleSaveProfile}
                    color="primary"
                >
                    Yadda saxla
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditEmployeeModal;
