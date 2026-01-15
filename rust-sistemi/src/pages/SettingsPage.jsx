import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Divider, Chip, Slider, Tabs, Tab, Switch, Button, Alert } from '@mui/material';
import { useThemeSettings } from '../context/ThemeContext';
import { useSound } from '../context/SoundContext';
import { CheckCircle, Opacity, VolumeUp, ColorLens, BugReport } from '@mui/icons-material';
import { errorReporter } from '../services/errorReporter';

const SettingsPage = () => {
    const {
        currentPreset, currentBg, currentOpacity, customColors,
        themePresets, backgroundPatterns,
        setTheme, setBackground, setOpacity, updateCustomColor
    } = useThemeSettings();

    const { soundEnabled, toggleSound, playSuccess } = useSound();

    const [tabValue, setTabValue] = useState(0);

    const handleOpacityChange = (event, newValue) => {
        setOpacity(newValue);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };


    return (
        <Box maxWidth="xl" mx="auto">
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
                Tənzimləmələr
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
                    <Tab icon={<ColorLens />} iconPosition="start" label="Görünüş & Tema" />
                    <Tab icon={<VolumeUp />} iconPosition="start" label="Səs və Bildirişlər" />

                </Tabs>
            </Box>

            {/* TAB 0: THEME SETTINGS (Existing Content) */}
            <div role="tabpanel" hidden={tabValue !== 0}>
                {tabValue === 0 && (
                    <Box>
                        {/* Theme Section */}
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Rəng Teması
                        </Typography>
                        <Grid container spacing={3} sx={{ mb: 6 }}>
                            {Object.entries(themePresets).map(([key, config]) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                                    <Card
                                        sx={{
                                            border: currentPreset === key ? `2px solid ${config.primary} ` : '2px solid transparent',
                                            position: 'relative',
                                            overflow: 'visible'
                                        }}
                                    >
                                        {currentPreset === key && (
                                            <Box sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white', borderRadius: '50%' }}>
                                                <CheckCircle sx={{ color: config.primary, fontSize: 30 }} />
                                            </Box>
                                        )}
                                        <CardActionArea onClick={() => setTheme(key)} sx={{ height: '100%' }}>
                                            <CardContent>
                                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: config.primary }} />
                                                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: config.secondary }} />
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold">{config.name}</Typography>
                                                <Box sx={{ mt: 2, p: 2, bgcolor: config.background, borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <Typography variant="body2" sx={{ color: key === 'dark' ? '#fff' : '#000' }}>Arxa fon nümunəsi</Typography>
                                                </Box>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Divider sx={{ mb: 4 }} />

                        {/* Background Section */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight="bold">
                                Arxa Fon Naxışı
                            </Typography>

                            {currentBg !== 'none' && (
                                <Box sx={{ width: 200, mr: 2 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        Naxışın Şəffaflığı (Tonu): {Math.round(currentOpacity * 100)}%
                                    </Typography>
                                    <Slider
                                        value={currentOpacity}
                                        onChange={handleOpacityChange}
                                        min={0.05}
                                        max={1}
                                        step={0.05}
                                        size="small"
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(v) => `${Math.round(v * 100)}% `}
                                    />
                                </Box>
                            )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Qeyd: Arxa fon naxışları yalnız işıqlı (light) temalarda görünür.
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ border: currentBg === 'none' ? '2px solid #2563eb' : '2px solid transparent' }}>
                                    <CardActionArea onClick={() => setBackground('none')}>
                                        <Box sx={{ height: 100, bgcolor: themePresets[currentPreset]?.background || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography color="text.secondary">Sadə</Typography>
                                        </Box>
                                        <CardContent>
                                            <Typography fontWeight="bold">Yoxdur</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ border: currentBg === 'subtle_dots' ? '2px solid #2563eb' : '2px solid transparent' }}>
                                    <CardActionArea onClick={() => setBackground('subtle_dots')}>
                                        <Box sx={{
                                            height: 100,
                                            bgcolor: themePresets[currentPreset]?.background || '#f1f5f9',
                                            backgroundImage: backgroundPatterns.subtle_dots,
                                            backgroundSize: '20px 20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                        </Box>
                                        <CardContent>
                                            <Typography fontWeight="bold">Nöqtələr (Rəngli)</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ border: currentBg === 'slate_gradient' ? '2px solid #2563eb' : '2px solid transparent' }}>
                                    <CardActionArea onClick={() => setBackground('slate_gradient')}>
                                        <Box sx={{
                                            height: 100,
                                            background: backgroundPatterns.slate_gradient,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                        </Box>
                                        <CardContent>
                                            <Typography fontWeight="bold">Qradient (Rəngli)</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ border: currentBg === 'mesh' ? '2px solid #2563eb' : '2px solid transparent' }}>
                                    <CardActionArea onClick={() => setBackground('mesh')}>
                                        <Box sx={{
                                            height: 100,
                                            background: backgroundPatterns.mesh,
                                            bgcolor: themePresets[currentPreset]?.paper || '#ffffff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                        </Box>
                                        <CardContent>
                                            <Typography fontWeight="bold">Canlı Tor</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Custom Colors Section */}
                        <Box mt={6} mb={4}>
                            <Divider sx={{ mb: 4 }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                                Ətraflı Fərdiləşdirmə (Manual)
                            </Typography>
                            <Grid container spacing={3}>
                                {[
                                    { label: 'Kart və Cədvəl Fonu', key: 'paper', desc: 'Kartların və cədvəllərin arxa fon rəngi' },
                                    { label: 'Sol Panel Rəngi', key: 'sidebarBg', desc: 'Sol tərəfdəki menyu panellərinin rəngi' },
                                    { label: 'Əsas Yazı Rəngi', key: 'textMain', desc: 'Başlıqlar və əsas mətnlərin rəngi' },
                                    { label: 'Cədvəl Yazı Rəngi', key: 'tableText', desc: 'Cədvəl daxilindəki yazıların rəngi' },
                                    { label: 'Əsas Rəng', key: 'primary', desc: 'Düymələr və ikonların rəngi' }
                                ].map((item) => (
                                    <Grid item xs={12} sm={6} md={3} key={item.key}>
                                        <Card>
                                            <CardContent>
                                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                    <Typography fontWeight="bold" variant="subtitle1">{item.label}</Typography>
                                                    <Box
                                                        component="label"
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            bgcolor: customColors?.[item.key] || '#000',
                                                            border: '2px solid #e2e8f0',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={customColors?.[item.key] || '#000000'}
                                                            onChange={(e) => updateCustomColor(item.key, e.target.value)}
                                                            style={{
                                                                position: 'absolute',
                                                                top: -10, left: -10,
                                                                width: 60, height: 60,
                                                                padding: 0, margin: 0,
                                                                opacity: 0
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.desc}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                )}
            </div>

            {/* TAB 1: SOUND & NOTIFICATIONS */}
            <div role="tabpanel" hidden={tabValue !== 1}>
                {tabValue === 1 && (
                    <Box>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Səs Effektləri
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Proqram daxilində keçidlər və əməliyyatlar zamanı səsli bildirişləri idarə edin.
                                </Typography>

                                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <VolumeUp color={soundEnabled ? "primary" : "disabled"} />
                                        <Box>
                                            <Typography fontWeight="bold">Səsləri Aktivləşdir</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Klikləmə və naviqasiya səsləri
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Switch
                                        checked={soundEnabled}
                                        onChange={(e) => toggleSound(e.target.checked)}
                                    />
                                </Box>

                                <Box mt={3}>
                                    <Button variant="outlined" size="small" onClick={playSuccess} disabled={!soundEnabled}>
                                        Səsi Yoxla (Test)
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </div>


        </Box>
    );
};

export default SettingsPage;

