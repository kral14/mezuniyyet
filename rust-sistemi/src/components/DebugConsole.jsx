import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, IconButton, Box, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Close as CloseIcon, Delete as ClearIcon, DragHandle as DragIcon, ContentCopy as CopyIcon } from '@mui/icons-material';

const DebugConsole = ({ open, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!open) return;

        const maxLogs = 50;
        const addLog = (type, data) => {
            const time = new Date().toLocaleTimeString();
            setLogs(prev => [{ time, type, data }, ...prev].slice(0, maxLogs));
        };

        // 1. Hook into Console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const formatLogData = (data) => {
            if (data instanceof Error) return `${data.name}: ${data.message}`;
            if (typeof data === 'object') {
                try {
                    return JSON.stringify(data, Object.getOwnPropertyNames(data));
                } catch (e) {
                    return String(data);
                }
            }
            return String(data);
        };

        console.log = (...args) => {
            originalLog(...args);
            addLog('LOG', args.map(formatLogData).join(' '));
        };

        console.warn = (...args) => {
            originalWarn(...args);
            addLog('WARN', args.map(formatLogData).join(' '));
        };

        console.error = (...args) => {
            originalError(...args);
            addLog('ERROR', args.map(formatLogData).join(' '));
        };

        // 2. Catch Global Errors
        const handleGlobalError = (event) => {
            const error = event.reason || event.message || "Unknown Global Error";
            addLog('CRITICAL', formatLogData(error));
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleGlobalError);

        // 3. Keep existing listeners for custom events if needed
        const handleAuthLogin = () => addLog('AUTH', 'Login Event Fired');
        const handleAuthLogout = () => addLog('AUTH', 'Logout Event Fired');
        const handleChatMessage = (e) => addLog('SOCKET', { type: 'chat-message', ...e.detail });
        const handleFriendUpdate = (e) => addLog('SOCKET', { type: 'friend-update', ...e.detail });

        window.addEventListener('auth-login', handleAuthLogin);
        window.addEventListener('auth-logout', handleAuthLogout);
        window.addEventListener('chat-message', handleChatMessage);
        window.addEventListener('friend-update', handleFriendUpdate);

        addLog('SYSTEM', 'Debug Console Attached & Listening...');

        return () => {
            // Restore console
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;

            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleGlobalError);

            window.removeEventListener('auth-login', handleAuthLogin);
            window.removeEventListener('auth-logout', handleAuthLogout);
            window.removeEventListener('chat-message', handleChatMessage);
            window.removeEventListener('friend-update', handleFriendUpdate);
        };
    }, [open]);

    // Drag Logic
    const handleMouseDown = (e) => {
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        setPosition({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
        });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    if (!open) return null;

    return (
        <Paper
            elevation={10}
            sx={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                width: 400,
                height: 500,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'rgba(0,0,0,0.85)',
                color: '#fff',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            {/* Header / Drag Handle */}
            <Box
                onMouseDown={handleMouseDown}
                sx={{
                    p: 1,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    '&:active': { cursor: 'grabbing' }
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <DragIcon sx={{ fontSize: 18, color: '#aaa' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>System Monitor</Typography>
                </Box>
                <Box>
                    <IconButton size="small" onClick={() => {
                        const text = logs.map(l => `[${l.time}] ${l.type}: ${JSON.stringify(l.data)}`).join('\n');
                        navigator.clipboard.writeText(text);
                        alert("Loglar kopyalandı!");
                    }} sx={{ color: '#aaa', '&:hover': { color: '#fff' } }}>
                        <CopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setLogs([])} sx={{ color: '#aaa', '&:hover': { color: '#fff' } }}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={onClose} sx={{ color: '#aaa', '&:hover': { color: '#ef4444' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Log Content */}
            <List sx={{ flex: 1, overflowY: 'auto', p: 1, fontSize: '0.8rem' }}>
                {logs.length === 0 && (
                    <Typography variant="caption" sx={{ color: '#666', textAlign: 'center', display: 'block', mt: 4 }}>
                        Siqnal gözlənilir...
                    </Typography>
                )}
                {logs.map((log, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <ListItemText
                            primary={
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography variant="caption" sx={{ color: '#888', minWidth: 60 }}>{log.time}</Typography>
                                    <Chip
                                        label={log.type}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: '0.6rem',
                                            bgcolor: log.type === 'SOCKET' ? '#2563eb' : log.type === 'AUTH' ? '#d97706' : '#555',
                                            color: '#fff'
                                        }}
                                    />
                                </Box>
                            }
                            secondary={
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#ccc',
                                        display: 'block',
                                        wordBreak: 'break-all',
                                        mt: 0.5,
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}
                                </Typography>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default DebugConsole;
