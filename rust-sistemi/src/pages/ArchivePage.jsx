import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Checkbox,
    FormControl, InputLabel, Select, MenuItem, Chip,
    Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Tabs, Tab,
    Accordion, AccordionSummary, AccordionDetails, Autocomplete, TextField, IconButton
} from '@mui/material';
import { Archive, Refresh, ArrowForward, History as HistoryIcon, ExpandMore, Delete, RestoreFromTrash } from '@mui/icons-material';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

const ArchivePage = () => {
    const { showNotification } = useNotification();
    const [tabValue, setTabValue] = useState(0);
    const [year, setYear] = useState(new Date().getFullYear() - 1); // Default to previous year
    const [stats, setStats] = useState([]);
    const [history, setHistory] = useState([]); // For History Tab
    const [selected, setSelected] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState([]); // New state for history selection
    const [loading, setLoading] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [error, setError] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [employeeFilter, setEmployeeFilter] = useState(null); // For autocomplete
    const [expanded, setExpanded] = useState(false); // For accordion control

    const loadPreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getArchivePreview(year);
            setStats(data);
            setSelected([]);
        } catch (err) {
            console.error("Failed to load archive preview", err);
            setError("Məlumatları yükləmək mümkün olmadı: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getArchiveHistory(year);
            setHistory(data);
        } catch (err) {
            console.error("Failed to load history", err);
            setError("Tarixçəni yükləmək mümkün olmadı: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tabValue === 0) loadPreview();
        else loadHistory();
    }, [year, tabValue]);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelected(stats.map(n => n.employee_id));
        } else {
            setSelected([]);
        }
    };

    const handleSelect = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }
        setSelected(newSelected);
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [vacationToDelete, setVacationToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        setVacationToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!vacationToDelete) return;
        try {
            await api.deleteVacation(vacationToDelete);
            setDeleteDialogOpen(false);
            setVacationToDelete(null);
            loadHistory();
            showNotification("Sorğu uğurla silindi", "success");
        } catch (err) {
            showNotification("Xəta: " + err.message, "error");
        }
    };

    const handleArchive = async () => {
        setArchiving(true);
        try {
            const res = await api.archiveVacations({ year: year.toString(), employee_ids: selected });
            showNotification(`Uğurla arxivləndi! cəmi ${res.archived_count} sənəd.`, "success");
            setConfirmOpen(false);
            loadPreview(); // Refresh list
        } catch (err) {
            showNotification("Arxivləmə xətası: " + (err.response?.data || err.message), "error");
        } finally {
            setArchiving(false);
        }
    };

    const handleUnarchive = async (vacation) => {
        if (!window.confirm("Bu sorğunu arxivdən çıxarmaq istədiyinizə əminsiniz?")) return;
        try {
            await api.unarchiveVacation(vacation);
            showNotification("Sorğu aktiv siyahıya qaytarıldı", "success");
            loadHistory();
        } catch (err) {
            showNotification("Xəta: " + err.message, "error");
        }
    };

    const handleBulkUnarchive = async () => {
        if (!window.confirm(`${selectedHistory.length} sorğunu arxivdən çıxarmaq istədiyinizə əminsiniz?`)) return;
        setLoading(true);
        let successCount = 0;
        try {
            // Find objects from history
            const vacationsToRestore = history.filter(h => selectedHistory.includes(h.id));
            // Sequential to avoid overwhelming server, or Promise.all for speed. Promise.all is better for 10-50 items.
            await Promise.all(vacationsToRestore.map(v => api.unarchiveVacation(v)));
            successCount = selectedHistory.length;
            showNotification(`${successCount} sorğu aktiv siyahıya qaytarıldı`, "success");
            setSelectedHistory([]);
            loadHistory();
        } catch (err) {
            showNotification("Bəzi sorğuları qaytarmaq mümkün olmadı: " + err.message, "warning");
            loadHistory(); // Refresh to see what's left
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAllHistory = () => {
        if (selectedHistory.length === history.length) {
            setSelectedHistory([]);
        } else {
            setSelectedHistory(history.map(h => h.id));
        }
    };

    const handleSelectHistory = (id) => {
        const index = selectedHistory.indexOf(id);
        if (index === -1) {
            setSelectedHistory([...selectedHistory, id]);
        } else {
            setSelectedHistory(selectedHistory.filter(item => item !== id));
        }
    };

    return (
        <Box p={3} sx={{ minHeight: '100vh', bgcolor: '#0f172a' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" color="white">
                    İl Sonu Arxivləmə
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                    {tabValue === 1 && (
                        <Autocomplete
                            options={Array.from(new Set(history.map(h => h.employee_id))).map(id => {
                                const emp = history.find(h => h.employee_id === id);
                                return { label: emp.employee_name, id: emp.employee_id };
                            })}
                            value={employeeFilter}
                            onChange={(event, newValue) => {
                                setEmployeeFilter(newValue);
                                setExpanded(newValue ? newValue.id : false);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="İşçi axtar"
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        width: 250,
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 1,
                                        '& .MuiInputBase-root': { color: 'white' },
                                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
                                    }}
                                />
                            )}
                        />
                    )}
                    <FormControl variant="outlined" sx={{ minWidth: 120, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            sx={{ color: 'white' }}
                            size="small"
                        >
                            {[2023, 2024, 2025, 2026, 2027].map(y => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                Seçilmiş ilin ({year}) təsdiqlənmiş sorğuları arxivlənərək sıfırlanacaq.
                Bu əməliyyat geri qaytarıla bilməz, lakin arxivdə tarixçə kimi qalacaq.
            </Alert>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="inherit">
                    <Tab label="Arxivləmə" sx={{ color: 'white' }} />
                    <Tab label="Tarixçə" sx={{ color: 'white' }} />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <Paper sx={{ width: '100%', mb: 2, bgcolor: '#1e293b', color: 'white' }}>
                    {/* ... Active Archive Table Code ... */}
                    {loading ? (
                        <Box p={4} textAlign="center"><CircularProgress /></Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={selected.length > 0 && selected.length < stats.length}
                                                checked={stats.length > 0 && selected.length === stats.length}
                                                onChange={handleSelectAll}
                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Ad Soyad</TableCell>
                                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)' }}>Aktiv Sorğular ({year})</TableCell>
                                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ color: 'rgba(255,255,255,0.5)', py: 3 }}>
                                                Bu il üçün aktiv sorğu tapılmadı.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stats.map((row) => {
                                            const isSelected = selected.indexOf(row.employee_id) !== -1;
                                            return (
                                                <TableRow
                                                    hover
                                                    onClick={() => handleSelect(row.employee_id)}
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    tabIndex={-1}
                                                    key={row.employee_id}
                                                    selected={isSelected}
                                                    sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'rgba(37, 99, 235, 0.1)' } }}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            sx={{ color: 'rgba(255,255,255,0.5)' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ color: 'white' }}>{row.name}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>{row.vacation_count}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip label="Aktiv" color="warning" size="small" />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor="rgba(0,0,0,0.2)">
                        <Typography color="rgba(255,255,255,0.7)">
                            {selected.length} işçi seçilib
                        </Typography>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<Archive />}
                            disabled={selected.length === 0 || loading}
                            onClick={() => setConfirmOpen(true)}
                        >
                            Arxivlə
                        </Button>
                    </Box>
                </Paper>
            )}

            {tabValue === 1 && (
                <Box>
                    {/* Bulk Actions for History */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} p={2} bgcolor="rgba(255,255,255,0.05)" borderRadius={1}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Checkbox
                                checked={history.length > 0 && selectedHistory.length === history.length}
                                indeterminate={selectedHistory.length > 0 && selectedHistory.length < history.length}
                                onChange={handleSelectAllHistory}
                                sx={{ color: 'rgba(255,255,255,0.7)' }}
                            />
                            <Typography color="white">
                                {selectedHistory.length > 0 ? `${selectedHistory.length} seçilib` : 'Hamısını seç'}
                            </Typography>
                        </Box>
                        {selectedHistory.length > 0 && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<RestoreFromTrash />}
                                onClick={handleBulkUnarchive}
                            >
                                Seçilənləri Qaytar
                            </Button>
                        )}
                    </Box>
                    {loading ? (
                        <Box p={4} textAlign="center"><CircularProgress /></Box>
                    ) : (
                        <Box>
                            {Object.entries(history.reduce((acc, curr) => {
                                if (!acc[curr.employee_id]) acc[curr.employee_id] = [];
                                acc[curr.employee_id].push(curr);
                                return acc;
                            }, {})).filter(([empId]) => !employeeFilter || parseInt(empId) === employeeFilter.id)
                                .map(([empId, empHistory]) => (
                                    <Accordion
                                        key={empId}
                                        expanded={expanded === parseInt(empId)}
                                        onChange={(event, isExpanded) => setExpanded(isExpanded ? parseInt(empId) : false)}
                                        sx={{ bgcolor: '#1e293b', color: 'white', mb: 1, border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                                            <HistoryIcon sx={{ mr: 2, color: 'rgba(255,255,255,0.5)' }} />
                                            <Typography variant="h6">
                                                {empHistory[0].employee_name} ({empHistory.length} arxivlənmiş sorğu)
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell padding="checkbox">
                                                                <Checkbox
                                                                    disabled // Header checkbox inside accordion is tricky, rely on global select
                                                                    checked={false}
                                                                    sx={{ display: 'none' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Başlama</TableCell>
                                                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Bitmə</TableCell>
                                                            <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)' }}>Gün</TableCell>
                                                            <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)' }}>Arxivlənmə Tarixi</TableCell>
                                                            <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)' }}>Əməliyyatlar</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {empHistory.map((row) => (
                                                            <TableRow key={row.id} hover onClick={() => handleSelectHistory(row.id)} sx={{ cursor: 'pointer', bgcolor: selectedHistory.includes(row.id) ? 'rgba(37, 99, 235, 0.1)' : 'transparent' }}>
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox
                                                                        checked={selectedHistory.includes(row.id)}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSelectHistory(row.id);
                                                                        }}
                                                                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell sx={{ color: 'white' }}>{row.start_date}</TableCell>
                                                                <TableCell sx={{ color: 'white' }}>{row.end_date}</TableCell>
                                                                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>{row.days}</TableCell>
                                                                <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                                                    {row.archived_at}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <IconButton
                                                                        color="primary"
                                                                        size="small"
                                                                        title="Arxivdən çıxar"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUnarchive(row);
                                                                        }}
                                                                    >
                                                                        <RestoreFromTrash />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        color="error"
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteClick(row.id);
                                                                        }}
                                                                    >
                                                                        <Delete />
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            {history.length === 0 && (
                                <Typography textAlign="center" color="rgba(255,255,255,0.5)" mt={4}>
                                    Bu il üçün arxivlənmiş məlumat yoxdur.
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            )
            }

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Arxivləməni təsdiqləyirsiniz?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Siz {selected.length} işçinin {year}-ci il üzrə bütün təsdiqlənmiş sorğularını arxivləmək üzrəsiniz.
                        Bu əməliyyat işçilərin istifadə edilən gün sayını azaldacaq (limiti bərpa etməyəcək, sadəcə keçmişə atacaq).
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Ləğv et</Button>
                    <Button onClick={handleArchive} color="error" autoFocus disabled={archiving}>
                        {archiving ? <CircularProgress size={24} /> : "Təsdiqlə"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Silmək istədiyinizə əminsiniz?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bu arxivlənmiş sorğu tamamilə silinəcək və geri qaytarıla bilməyəcək.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#aaa' }}>Ləğv et</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default ArchivePage;
