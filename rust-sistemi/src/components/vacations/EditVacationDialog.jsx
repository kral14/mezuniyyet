import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Alert
} from '@mui/material';
import api from '../../services/api';

const EditVacationDialog = ({ open, onClose, vacation, onSave }) => {
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (vacation) {
            setFormData({
                start_date: vacation.start_date || '',
                end_date: vacation.end_date || '',
                reason: vacation.reason || ''
            });
            setError('');
        }
    }, [vacation]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!vacation) return;

        // Basic Validation
        if (!formData.start_date || !formData.end_date) {
            setError('Başlanğıc və bitmə tarixlərini seçin.');
            return;
        }

        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            setError('Bitmə tarixi başlanğıc tarixindən tez ola bilməz.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await api.updateVacation(vacation.id, formData);
            onSave(); // Refresh parent list
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Yadda saxlamaq mümkün olmadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={loading ? null : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Məzuniyyət Sorğusunu Redaktə Et</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Başlama Tarixi"
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Bitmə Tarixi"
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Səbəb"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            placeholder="Məzuniyyət səbəbini qeyd edin..."
                            disabled={loading}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Ləğv et
                </Button>
                <Button onClick={handleSave} disabled={loading} variant="contained" color="primary">
                    {loading ? 'Saxlanılır...' : 'Yadda Saxla'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditVacationDialog;
