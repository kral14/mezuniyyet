import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudSync, Storage, Terminal, LocalCafe, CheckCircle, Person, Weekend, TouchApp, Dns, Visibility } from '@mui/icons-material';
import CreepyButton from '../components/CreepyButton'; // Import custom button

const AnimationShowcase = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5', p: 4, overflow: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom textAlign="center" mb={5}>
                Server Oyanma Animasiyaları
            </Typography>

            <Grid container spacing={4} justifyContent="center">
                {/* Variant 1: Pulse Server */}
                <Grid item xs={12} md={6}>
                    <AnimationCard title="Variant 1: Pulse Server (Sade)" icon={<Storage />}>
                        <PulseServerAnimation />
                    </AnimationCard>
                </Grid>

                {/* Variant 2: Cloud Sync */}
                <Grid item xs={12} md={6}>
                    <AnimationCard title="Variant 2: Cloud Sync (Müasir)" icon={<CloudSync />}>
                        <CloudSyncAnimation />
                    </AnimationCard>
                </Grid>

                {/* Variant 3: Terminal Boot */}
                <Grid item xs={12} md={6}>
                    <AnimationCard title="Variant 3: Terminal Boot (Texniki)" icon={<Terminal />}>
                        <TerminalBootAnimation />
                    </AnimationCard>
                </Grid>

                {/* Variant 4: Creepy Button (User Choice) */}
                <Grid item xs={12} md={6}>
                    <AnimationCard title="Variant 4: Gözləyən Düymə (Custom)" icon={<Visibility />}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                Kursoru düymənin üzərinə gətirin
                            </Typography>
                            <CreepyButton onClick={() => alert("Giriş Edildi!")}>
                                Giriş
                            </CreepyButton>
                        </Box>
                    </AnimationCard>
                </Grid>

                {/* Variant 5: Story Mode */}
                <Grid item xs={12} md={8}>
                    <AnimationCard title="Variant 5: Interactive Story (Hekayəli)" icon={<Person />}>
                        <StoryLoginAnimation />
                    </AnimationCard>
                </Grid>
            </Grid>
        </Box>
    );
};

const AnimationCard = ({ title, icon, children }) => (
    <Card elevation={4} sx={{ borderRadius: 4, height: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant="h6" fontWeight="bold">{title}</Typography>
        </Box>
        <CardContent sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', position: 'relative', overflow: 'hidden' }}>
            {children}
        </CardContent>
    </Card>
);

// --- 1. Pulse Server Animation ---
const PulseServerAnimation = () => {
    return (
        <Box sx={{ textAlign: 'center', position: 'relative' }}>
            {/* Ripples */}
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        x: '-50%',
                        y: '-50%',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: '2px solid #3b82f6',
                        opacity: 0,
                    }}
                    animate={{
                        scale: [1, 2.5],
                        opacity: [0.6, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeOut"
                    }}
                />
            ))}

            {/* Central Icon */}
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <Box sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <Storage sx={{ fontSize: 50, color: '#3b82f6' }} />
                </Box>
            </motion.div>

            <Typography mt={4} variant="h6" color="primary.main" fontWeight="bold">
                Server Oyanır...
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Zəhmət olmasa 30-40 saniyə gözləyin
            </Typography>
        </Box>
    );
};

// --- 2. Cloud Sync Animation ---
const CloudSyncAnimation = () => {
    return (
        <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                <CloudSync sx={{ fontSize: 100, color: '#e0e7ff' }} />

                {/* Spinning Circle */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        borderTop: '4px solid #6366f1',
                        borderRight: '4px solid transparent',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Blinking Data Dots */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: 60,
                            left: 40 + (i * 15),
                            width: 8,
                            height: 8,
                            bgcolor: '#6366f1',
                            borderRadius: '50%',
                            backgroundColor: '#6366f1'
                        }}
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </Box>

            <Typography mt={3} variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold' }}>
                Buludla Əlaqə Qurulur...
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                Server aktivləşdirilir
            </Typography>
        </Box>
    );
};

// --- 3. Terminal Boot Animation ---
const TerminalBootAnimation = () => {
    const [lines, setLines] = useState([]);

    useEffect(() => {
        const bootLines = [
            "> System.init()",
            "> Connecting to Render Cloud...",
            "> Allocation memory...",
            "> Starting services...",
            "> Loading modules...",
            "> Est. time: 30s...",
            "> Please wait..."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < bootLines.length) {
                setLines(prev => [...prev, bootLines[i]]);
                i++;
            } else {
                setLines([]);
                i = 0;
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <Box sx={{
            width: '100%',
            maxWidth: 350,
            height: 250,
            bgcolor: '#1e293b',
            borderRadius: 2,
            p: 3,
            fontFamily: 'monospace',
            color: '#10b981',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ borderBottom: '1px solid #334155', pb: 1, mb: 2, display: 'flex', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {lines.map((line, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {line}
                        </Typography>
                    </motion.div>
                ))}
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                >
                    _
                </motion.span>
            </Box>
        </Box>
    );
};

// --- 4. Coffee Wait Animation ---
const CoffeeAnimation = () => {
    return (
        <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', width: 100, height: 120, mx: 'auto', mb: 2 }}>
                <LocalCafe sx={{ fontSize: 100, color: '#78350f' }} />

                {/* Steam */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: -20,
                            left: 20 + i * 25,
                            width: 6,
                            height: 20,
                            backgroundColor: '#d1d5db',
                            borderRadius: 4,
                            opacity: 0.6
                        }}
                        animate={{
                            y: [-10, -30],
                            opacity: [0.6, 0],
                            scaleY: [1, 1.5]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.4
                        }}
                    />
                ))}
            </Box>

            <Typography variant="h6" sx={{ color: '#92400e', fontWeight: 'bold' }}>
                Server Kofesini İçir...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Oyanmaq üçün enerjiyə ehtiyacı var. <br /> Bir az səbirli olun :)
            </Typography>

            <Box sx={{ width: '80%', height: 4, bgcolor: '#e5e7eb', borderRadius: 2, mx: 'auto', mt: 3, overflow: 'hidden' }}>
                <motion.div
                    style={{ width: '100%', height: '100%', backgroundColor: '#d97706' }}
                    animate={{ x: ['-100%', '0%'] }}
                    transition={{ duration: 45, ease: "linear" }}
                />
            </Box>
        </Box>
    );
};

// --- 5. Story Mode Animation ---
const StoryLoginAnimation = () => {
    const [step, setStep] = useState(0);
    // 0: Start
    // 1: Walk to Button
    // 2: Press Button
    // 3: Loading Spinner
    // 4: Look at watch/wait (Reaction)
    // 5: Walk to Coffee
    // 6: Get Coffee
    // 7: Walk to Chair
    // 8: Sit

    useEffect(() => {
        const sequence = async () => {
            // Loop implementation using recursion or async loop
            while (true) {
                setStep(0); await wait(1000); // Start
                setStep(1); await wait(2000); // Walk to PC
                setStep(2); await wait(500);  // Press
                setStep(3); await wait(2500); // Spinner waiting...
                setStep(4); await wait(1500); // Realize it's slow
                setStep(5); await wait(2000); // Walk to coffee
                setStep(6); await wait(1500); // Pour coffee
                setStep(7); await wait(2000); // Walk to chair
                setStep(8); await wait(8000); // Sit and wait
            }
        };
        sequence();
    }, []);

    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    return (
        <Box sx={{
            width: '100%', height: '100%', position: 'relative',
            bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden',
            borderBottom: '4px solid #cbd5e1' // Floor
        }}>

            {/* --- Scene Elements --- */}

            {/* Server/PC Screen on Left */}
            <Box sx={{ position: 'absolute', top: '30%', left: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Dns sx={{ fontSize: 60, color: step >= 2 ? '#3b82f6' : '#94a3b8' }} />
                <Box sx={{ width: 80, height: 40, bgcolor: 'white', borderRadius: 1, mt: 1, border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {step === 0 && <Typography variant="caption">Login</Typography>}
                    {step === 1 && <Typography variant="caption">Login</Typography>}
                    {step === 2 && <Typography variant="caption">...</Typography>}
                    {step >= 3 && step < 8 && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 14, height: 14, border: '2px solid blue', borderRadius: '50%', borderTopColor: 'transparent' }} />}
                    {step === 8 && <Typography variant="caption" color="warning.main">Waking...</Typography>}
                </Box>
            </Box>

            {/* Coffee Machine on Right */}
            <Box sx={{ position: 'absolute', top: '35%', right: '10%', opacity: 0.8 }}>
                <LocalCafe sx={{ fontSize: 50, color: '#78350f' }} />
            </Box>

            {/* Chair in Center-Right */}
            <Box sx={{ position: 'absolute', bottom: '20%', right: '30%', opacity: 0.9 }}>
                <Weekend sx={{ fontSize: 60, color: '#475569' }} />
            </Box>

            {/* --- Character --- */}
            <motion.div
                animate={{
                    x: step === 0 ? 0 :
                        step === 1 || step === 2 || step === 3 || step === 4 ? -80 : // At PC
                            step === 5 || step === 6 ? 120 : // At Coffee
                                step === 7 || step === 8 ? 60 : 0, // At Chair
                    y: step === 8 ? 10 : 0, // Sit down
                    opacity: 1
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    bottom: '22%',
                    left: '45%', // Start center
                    zIndex: 10
                }}
            >
                <Box sx={{ position: 'relative' }}>
                    {/* Person Icon */}
                    <Person sx={{ fontSize: 50, color: '#0f172a' }} />

                    {/* Interaction Icon Bubble */}
                    <AnimatePresence>
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ position: 'absolute', top: -20, right: -10 }}
                            >
                                <TouchApp sx={{ color: '#ec4899' }} />
                            </motion.div>
                        )}
                        {(step === 4) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ position: 'absolute', top: -30, right: 0, background: 'white', padding: '2px 5px', borderRadius: 4, border: '1px solid #ccc' }}
                            >
                                <Typography variant="caption">🤔</Typography>
                            </motion.div>
                        )}
                        {(step >= 6) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ position: 'absolute', top: 15, right: -10 }}
                            >
                                <LocalCafe sx={{ fontSize: 16, color: '#d97706' }} />
                            </motion.div>
                        )}
                        {(step === 8) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: -20 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ position: 'absolute', top: -40, left: -40, whiteSpace: 'nowrap', background: 'white', padding: '4px 8px', borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                            >
                                <Typography variant="caption" fontWeight="bold" color="primary">Server Oyanır ☕</Typography>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </motion.div>

        </Box>
    );
};

export default AnimationShowcase;
