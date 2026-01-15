import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton,
    Collapse, CircularProgress, Card, CardContent
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Delete, BugReport, Refresh, ContentCopy } from '@mui/icons-material';
import api from '../services/api';
import { errorReporter } from '../services/errorReporter';

const Row = ({ row, onDelete }) => {
    const [open, setOpen] = useState(false);

    // Parse timestamp
    const date = new Date(row.timestamp);
    const dateStr = date.toLocaleDateString('az-AZ') + ' ' + date.toLocaleTimeString('az-AZ');

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: open ? 'action.hover' : 'inherit' }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell>{row.user?.name || 'Unknown'}</TableCell>
                <TableCell>{row.error?.message?.substring(0, 50)}...</TableCell>
                <TableCell>{dateStr}</TableCell>
                <TableCell>
                    <IconButton color="error" size="small" onClick={() => onDelete(row.originalMessageId)}>
                        <Delete />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" gutterBottom component="div" color="error">
                                    Xəta Detalları
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        const text = `Error: ${row.error?.message}\nUser: ${row.user?.name}\nURL: ${row.url}\n\nStack:\n${row.error?.stack}\n\nComponent Stack:\n${row.error?.componentStack}`;
                                        navigator.clipboard.writeText(text);
                                        alert("Xəta detalları kopyalandı!");
                                    }}
                                    title="Bütün detalları kopyala"
                                >
                                    <ContentCopy />
                                </IconButton>
                            </Box>
                            <Table size="small" aria-label="purchases">
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row">İstifadəçi:</TableCell>
                                        <TableCell>{row.user?.name} (@{row.user?.username}) (ID: {row.user?.id})</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row">URL:</TableCell>
                                        <TableCell>{row.url}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row">Browser:</TableCell>
                                        <TableCell>{row.userAgent}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" valign="top">
                                            Stack Trace:
                                        </TableCell>
                                        <TableCell>
                                            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#ff5252', overflow: 'auto', maxHeight: 300, position: 'relative' }}>
                                                <IconButton
                                                    size="small"
                                                    sx={{ position: 'absolute', right: 5, top: 5, color: 'white' }}
                                                    onClick={() => navigator.clipboard.writeText(row.error?.stack)}
                                                    title="Stack Trace-i kopyala"
                                                >
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                                <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                                                    {row.error?.stack || 'No Stack Trace'}
                                                </pre>
                                                <br />
                                                <Typography variant="subtitle2" color="primary">Component Stack:</Typography>
                                                <pre style={{ margin: 0, fontSize: '0.8rem', color: '#64b5f6' }}>
                                                    {row.error?.componentStack || 'No Component Stack'}
                                                </pre>
                                            </Paper>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const AdminErrorLogs = () => {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadErrors = async () => {
        setLoading(true);
        try {
            const response = await api.getSystemErrors();
            if (response && response.data) {
                // Map DB format to expected UI format
                // UI expects: { originalMessageId, user: {name, username, id}, error: {message, stack, componentStack}, timestamp, url, userAgent }
                // DB returns: { id, user_id, username, message, stack, component_stack, url, user_agent, created_at, is_resolved }

                const mapped = response.data.map(err => ({
                    originalMessageId: err.id, // using DB ID
                    user: {
                        id: err.user_id,
                        name: err.username || 'Unknown', // We don't have full name stored, just username or ID
                        username: err.username
                    },
                    error: {
                        message: err.message,
                        stack: err.stack,
                        componentStack: err.component_stack
                    },
                    timestamp: err.created_at,
                    url: err.url,
                    userAgent: err.user_agent
                }));

                setErrors(mapped);
            } else {
                setErrors([]);
            }
        } catch (err) {
            console.error("Failed to load error logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadErrors();
    }, []);

    const handleDelete = async (msgId) => {
        if (!confirm("Bu xəta hesabatını silmək istəyirsiniz?")) return;
        try {
            await api.resolveSystemError(msgId);
            setErrors(prev => prev.filter(e => e.originalMessageId !== msgId));
        } catch (err) {
            alert("Silinmə xətası: " + err);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("Bütün xəta hesabatlarını silməkdən əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.")) return;
        try {
            await api.resolveAllSystemErrors();
            setErrors([]);
            alert("Bütün xətalar silindi.");
        } catch (err) {
            alert("Silinmə xətası: " + err);
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                    <BugReport fontSize="large" color="error" />
                    Sistem Xətaları
                </Typography>
                <Box>
                    {errors.length > 0 && (
                        <IconButton onClick={handleDeleteAll} color="error" title="Bütün xətaları sil">
                            <Delete />
                        </IconButton>
                    )}
                    <IconButton onClick={loadErrors}><Refresh /></IconButton>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justify="center" p={5}><CircularProgress /></Box>
            ) : errors.length === 0 ? (
                <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                    <CardContent>
                        <Typography variant="h6" align="center">
                            Əla! Heç bir xəta tapılmadı.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table aria-label="collapsible table">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>İstifadəçi</TableCell>
                                <TableCell>Xəta Mesajı</TableCell>
                                <TableCell>Zaman</TableCell>
                                <TableCell>Əməliyyat</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {errors.map((error) => (
                                <Row key={error.originalMessageId} row={error} onDelete={handleDelete} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default AdminErrorLogs;
