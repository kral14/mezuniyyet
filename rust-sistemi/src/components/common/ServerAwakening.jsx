import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Button } from '@mui/material';
import { Cloud, CloudQueue, Coffee, PowerSettingsNew } from '@mui/icons-material';

const phrases = [
    { text: "Server yatıb... Zzz...", icon: <CloudQueue sx={{ fontSize: 80, color: '#94a3b8' }} /> },
    { text: "Server dürtməklənir...", icon: <Cloud sx={{ fontSize: 80, color: '#60a5fa' }} /> },
    { text: "Sistemlər qızışır...", icon: <PowerSettingsNew sx={{ fontSize: 80, color: '#f59e0b' }} /> },
    { text: "Kofe süzülür...", icon: <Coffee sx={{ fontSize: 80, color: '#795548' }} /> },
    { text: "Demək olar ki, hazırdır!", icon: <Cloud sx={{ fontSize: 80, color: '#10b981' }} /> },
];

const ServerAwakening = ({ onRetry, error }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Change phrase every 4 seconds to keep it interesting
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const currentPhrase = phrases[index];

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                bgcolor: '#0f172a', // sleek dark blue-ish background
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            <AnimatePresence mode='wait'>
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {currentPhrase.icon}
                    </motion.div>

                    <Typography variant="h5" sx={{ mt: 3, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' }}>
                        {currentPhrase.text}
                    </Typography>
                </motion.div>
            </AnimatePresence>

            <Box sx={{ mt: 6, width: '300px', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    Pulsuz serverlərdə bu proses 30-50 saniyə çəkə bilər. Səbirli olduğunuz üçün təşəkkürlər.
                </Typography>

                <motion.div
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                        borderRadius: '2px'
                    }}
                />
            </Box>

            {/* Debug Error Message */}
            {error && (
                <Box sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: 2,
                    maxWidth: '80%'
                }}>
                    <Typography variant="caption" sx={{ color: '#ef4444', fontFamily: 'monospace' }}>
                        DEBUG: {error}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#94a3b8', mt: 0.5 }}>
                        (İnternet bağlantısını yoxlayın və ya VPN/Proxy-ni söndürün)
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ServerAwakening;
