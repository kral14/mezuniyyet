import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNotification } from '../context/NotificationContext';
import { alpha } from '@mui/material/styles';

const Footer = () => {
    const { notification } = useNotification();

    return (
        <Box
            component="footer"
            sx={{
                py: 1,
                px: 2,
                minHeight: '40px',
                mt: 'auto',
                backgroundColor: '#e0e0e0', // Simple gray
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s ease'
            }}
        >
            {notification.open && (
                <Typography
                    variant="body2"
                    sx={{
                        color: notification.severity === 'error' ? 'error.main' : 'success.main',
                        fontWeight: 600
                    }}
                >
                    {notification.message}
                </Typography>
            )}
        </Box>
    );
};

export default Footer;
