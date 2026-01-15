import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button,
    List, ListItem, ListItemText, IconButton,
    Grid, Divider, Alert, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Delete, Add, Edit } from '@mui/icons-material';
import api from '../../services/api';

const DictionaryManager = () => {
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [newDept, setNewDept] = useState('');
    const [newPos, setNewPos] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Edit State
    const [editOpen, setEditOpen] = useState(false);
    const [editType, setEditType] = useState(''); // 'dept' or 'pos'
    const [editItem, setEditItem] = useState(null); // { id, name }
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [depts, posts] = await Promise.all([
                api.getDepartments(),
                api.getPositions()
            ]);
            setDepartments(depts);
            setPositions(posts);
        } catch (err) {
            setError("Failed to load data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDept = async () => {
        if (!newDept.trim()) return;
        try {
            await api.addDepartment(newDept);
            setNewDept('');
            loadData();
        } catch (err) {
            setError("Error adding department: " + err.message);
        }
    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm("Bu şöbəni silmək istədiyinizə əminsiniz?")) return;
        try {
            await api.deleteDepartment(id);
            loadData();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const handleAddPos = async () => {
        if (!newPos.trim()) return;
        try {
            await api.addPosition(newPos);
            setNewPos('');
            loadData();
        } catch (err) {
            setError("Error adding position: " + err.message);
        }
    };

    const handleDeletePos = async (id) => {
        if (!window.confirm("Bu vəzifəni silmək istədiyinizə əminsiniz?")) return;
        try {
            await api.deletePosition(id);
            loadData();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    // Edit Handlers
    const openEdit = (type, item) => {
        setEditType(type);
        setEditItem(item);
        setEditValue(item.name);
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editValue.trim()) return;
        try {
            if (editType === 'dept') {
                await api.updateDepartment(editItem.id, editValue);
            } else {
                await api.updatePosition(editItem.id, editValue);
            }
            setEditOpen(false);
            loadData();
        } catch (err) {
            alert("Update Error: " + err.message);
        }
    };

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Departments */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Şöbələr</Typography>
                        <Box display="flex" gap={1} mb={2}>
                            <TextField
                                fullWidth size="small" label="Yeni Şöbə"
                                value={newDept} onChange={e => setNewDept(e.target.value.toUpperCase())}
                            />
                            <Button variant="contained" onClick={handleAddDept}><Add /></Button>
                        </Box>
                        <Divider />
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {departments.map(d => (
                                <ListItem key={d.id} secondaryAction={
                                    <Box>
                                        <IconButton size="small" onClick={() => openEdit('dept', d)} sx={{ mr: 1 }}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton edge="end" color="error" onClick={() => handleDeleteDept(d.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }>
                                    <ListItemText primary={d.name} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Positions */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Vəzifələr</Typography>
                        <Box display="flex" gap={1} mb={2}>
                            <TextField
                                fullWidth size="small" label="Yeni Vəzifə"
                                value={newPos} onChange={e => setNewPos(e.target.value.toUpperCase())}
                            />
                            <Button variant="contained" onClick={handleAddPos}><Add /></Button>
                        </Box>
                        <Divider />
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {positions.map(p => (
                                <ListItem key={p.id} secondaryAction={
                                    <Box>
                                        <IconButton size="small" onClick={() => openEdit('pos', p)} sx={{ mr: 1 }}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton edge="end" color="error" onClick={() => handleDeletePos(p.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }>
                                    <ListItemText primary={p.name} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                <DialogTitle>Düzəliş Et: {editType === 'dept' ? 'Şöbə' : 'Vəzifə'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Ad"
                        fullWidth
                        variant="outlined"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Ləğv et</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Yadda Saxla</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DictionaryManager;
