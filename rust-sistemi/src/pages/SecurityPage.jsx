import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert
} from '@mui/material';
import { Block, CheckCircle, Refresh, Security, History } from '@mui/icons-material';
import api from '../services/api';

const SecurityPage = () => {
    const [loginHistory, setLoginHistory] = useState([]);
    const [blockedIps, setBlockedIps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Block Dialog State
    const [openBlockDialog, setOpenBlockDialog] = useState(false);
    const [blockIpAddress, setBlockIpAddress] = useState('');
    const [blockReason, setBlockReason] = useState('Suspicious activity');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [historyData, blockedData] = await Promise.all([
                api.getLoginHistory(),
                api.getBlockedIps()
            ]);
            setLoginHistory(historyData || []);
            setBlockedIps(blockedData || []);
        } catch (err) {
            console.error("Security load error:", err);
            setError("Məlumatları yükləmək mümkün olmadı. Admin hüququnuz olduğundan əmin olun.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBlockIp = async () => {
        if (!blockIpAddress) return;
        try {
            await api.blockIp(blockIpAddress, blockReason);
            setOpenBlockDialog(false);
            setBlockIpAddress('');
            fetchData(); // Refresh
        } catch (err) {
            alert("Bloklama xətası: " + err);
        }
    };

    const handleUnblockIp = async (ip) => {
        if (!window.confirm(`IP ${ip} blokdan çıxarılsın?`)) return;
        try {
            await api.unblockIp(ip);
            fetchData(); // Refresh
        } catch (err) {
            alert("Xəta: " + err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'success';
            case 'failed': return 'error';
            case 'blocked': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security fontSize="large" color="primary" />
                    Təhlükəsizlik Paneli
                </Typography>
                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>
                    Yenilə
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Sol Tərəf - Giriş Tarixçəsi */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <History />
                                Son Giriş Cəhdləri (Live)
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 600, border: '1px solid #eee' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Status</TableCell>
                                            <TableCell>İstifadəçi</TableCell>
                                            <TableCell>IP Ünvan</TableCell>
                                            <TableCell>Vaxt</TableCell>
                                            <TableCell>Browser</TableCell>
                                            <TableCell>Əməliyyat</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loginHistory.map((log) => (
                                            <TableRow key={log.id} hover>
                                                <TableCell>
                                                    <Chip
                                                        label={log.status}
                                                        color={getStatusColor(log.status)}
                                                        size="small"
                                                        variant={log.status === 'success' ? 'outlined' : 'filled'}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{log.username}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>{log.ip_address}</TableCell>
                                                <TableCell>{log.created_at}</TableCell>
                                                <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_agent}>
                                                    {log.user_agent?.substring(0, 20)}...
                                                </TableCell>
                                                <TableCell>
                                                    {log.status !== 'success' && (
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            title="Bu IP-ni blokla"
                                                            onClick={() => {
                                                                setBlockIpAddress(log.ip_address);
                                                                setOpenBlockDialog(true);
                                                            }}
                                                        >
                                                            <Block fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {loginHistory.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">Məlumat yoxdur</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sağ Tərəf - Bloklanmış IP-lər */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', bgcolor: '#fff4f4' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" fontWeight="bold" color="error">
                                    Bloklanmış IP-lər
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    startIcon={<Block />}
                                    onClick={() => setOpenBlockDialog(true)}
                                >
                                    Manual Blok
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {blockedIps.map((b) => (
                                    <Paper key={b.ip_address} sx={{ p: 2, borderLeft: '4px solid #d32f2f' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="start">
                                            <Typography variant="subtitle1" fontFamily="monospace" fontWeight="bold">
                                                {b.ip_address}
                                            </Typography>
                                            <IconButton size="small" onClick={() => handleUnblockIp(b.ip_address)}>
                                                <CheckCircle color="success" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Səbəb: {b.reason}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.disabled">
                                            Tarix: {b.banned_at} (Admin: {b.banned_by})
                                        </Typography>
                                    </Paper>
                                ))}
                                {blockedIps.length === 0 && (
                                    <Typography color="text.secondary" align="center" mt={2}>
                                        Bloklanmış IP yoxdur.
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Block Dialog */}
            <Dialog open={openBlockDialog} onClose={() => setOpenBlockDialog(false)}>
                <DialogTitle>IP Adresini Blokla</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="IP Ünvan"
                        fullWidth
                        variant="outlined"
                        value={blockIpAddress}
                        onChange={(e) => setBlockIpAddress(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Səbəb"
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBlockDialog(false)}>Ləğv et</Button>
                    <Button onClick={handleBlockIp} variant="contained" color="error">Blokla</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SecurityPage;
