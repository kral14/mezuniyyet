import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

const ThemeContext = createContext();

export const useThemeSettings = () => useContext(ThemeContext);

// Predefined Color Presets
const themePresets = {
    default: {
        name: 'Standart (Mavi)',
        primary: '#2563eb', // Blue-600
        secondary: '#64748b',
        background: '#f1f5f9',
        paper: '#ffffff',
    },
    ocean: {
        name: 'Okean',
        primary: '#0891b2', // Cyan-600
        secondary: '#475569',
        background: '#ecfeff', // Cyan-50
        paper: '#ffffff',
    },
    sunset: {
        name: 'Qürub',
        primary: '#ea580c', // Orange-600
        secondary: '#57534e',
        background: '#fff7ed', // Orange-50
        paper: '#ffffff',
    },
    forest: {
        name: 'Meşə',
        primary: '#16a34a', // Green-600
        secondary: '#525252',
        background: '#f0fdf4', // Green-50
        paper: '#ffffff',
    },
    purple: {
        name: 'Bənövşəyi',
        primary: '#9333ea', // Purple-600
        secondary: '#581c87',
        background: '#faf5ff', // Purple-50
        paper: '#ffffff',
    },
    lavender: {
        name: 'Lavanda',
        primary: '#8b5cf6', // Violet-500
        secondary: '#a78bfa',
        background: '#f5f3ff', // Violet-50
        paper: '#ffffff',
    },
    mint: {
        name: 'Nanə',
        primary: '#10b981', // Emerald-500
        secondary: '#34d399',
        background: '#ecfdf5', // Emerald-50
        paper: '#ffffff',
    },
    rose: {
        name: 'Qızılgül',
        primary: '#ec4899', // Pink-500
        secondary: '#f472b6',
        background: '#fdf2f8', // Pink-50
        paper: '#ffffff',
    },
    coffee: {
        name: 'Qəhvə',
        primary: '#d97706', // Amber-600
        secondary: '#b45309',
        background: '#fffbeb', // Amber-50
        paper: '#ffffff',
    },
    corporate: {
        name: 'Korporativ',
        primary: '#334155', // Slate-700
        secondary: '#64748b',
        background: '#f8fafc', // Slate-50
        paper: '#ffffff',
    },
    midnight: {
        name: 'Gecə Yarısı',
        primary: '#6366f1', // Indigo-500
        secondary: '#818cf8',
        background: '#1e1b4b', // Indigo-950
        paper: '#312e81', // Indigo-900
        mode: 'dark'
    },
    dark: {
        name: 'Qaranlıq Mod',
        primary: '#3b82f6',
        secondary: '#94a3b8',
        background: '#0f172a', // Slate-900
        paper: '#1e293b', // Slate-800
        text: '#f8fafc',
        mode: 'dark'
    }
};

export const ThemeProviderWrapper = ({ children }) => {
    // Load saved settings or default
    const [currentPreset, setCurrentPreset] = useState(() => localStorage.getItem('theme_preset') || 'default');
    const [bgPattern, setBgPattern] = useState(() => localStorage.getItem('theme_bg') || 'none');
    const [bgOpacity, setBgOpacity] = useState(() => parseFloat(localStorage.getItem('theme_opacity')) || 0.2);

    // Custom Colors State (Initialized from preset or localStorage)
    const [customColors, setCustomColors] = useState(() => {
        const saved = localStorage.getItem('theme_custom_colors');
        if (saved) return JSON.parse(saved);
        // Default to the 'default' preset values if nothing saved
        const p = themePresets.default;
        return {
            primary: p.primary,
            secondary: p.secondary,
            background: p.background,
            paper: p.paper,
            textMain: '#1e293b',
            textSecondary: '#64748b',
            sidebarBg: '#000000', // Default sidebar (Black)
            sidebarText: '#ffffff',
            tableText: '#1e293b' // Default table text
        };
    });

    // When preset changes, update custom colors to match that preset (RESET)
    const applyPreset = (presetKey) => {
        setCurrentPreset(presetKey);
        const p = themePresets[presetKey];
        const isDark = p.mode === 'dark';

        const newColors = {
            primary: p.primary,
            secondary: p.secondary,
            background: p.background,
            paper: p.paper,
            textMain: isDark ? '#f8fafc' : '#1e293b',
            textSecondary: isDark ? '#94a3b8' : '#64748b',
            sidebarBg: isDark ? '#1e293b' : '#000000', // Default black for all
            sidebarText: isDark ? '#f8fafc' : '#ffffff',
            tableText: isDark ? '#f8fafc' : '#1e293b'
        };
        setCustomColors(newColors);
        localStorage.setItem('theme_preset', presetKey);
        // Also clear custom overrides flag if we had one? For now just overwrite.
    };

    // Update specific color
    const updateCustomColor = (key, value) => {
        setCustomColors(prev => {
            const newColors = { ...prev, [key]: value };
            return newColors;
        });
        setCurrentPreset('custom'); // Switch to custom mode indicator
    };

    // Persist changes
    useEffect(() => {
        localStorage.setItem('theme_preset', currentPreset);
        localStorage.setItem('theme_bg', bgPattern);
        localStorage.setItem('theme_opacity', bgOpacity);
        localStorage.setItem('theme_custom_colors', JSON.stringify(customColors));
    }, [currentPreset, bgPattern, bgOpacity, customColors]);

    const isDark = currentPreset === 'dark'; // Or maybe derive from background brightness? Keep simple for now.

    // Helper to add opacity to hex color
    const hexToRgba = (hex, alpha) => {
        if (!hex) return 'rgba(0,0,0,0)';
        let r, g, b;
        if (hex.startsWith('#')) {
            const hexVal = hex.substring(1);
            if (hexVal.length === 3) {
                r = parseInt(hexVal[0] + hexVal[0], 16);
                g = parseInt(hexVal[1] + hexVal[1], 16);
                b = parseInt(hexVal[2] + hexVal[2], 16);
            } else {
                r = parseInt(hexVal.substring(0, 2), 16);
                g = parseInt(hexVal.substring(2, 4), 16);
                b = parseInt(hexVal.substring(4, 6), 16);
            }
        } else {
            return hex; // Already rgba or named?
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Dynamic patterns based on current primary color and opacity
    const getDynamicPatterns = (primary, bg) => {
        const dotColor = hexToRgba(primary, bgOpacity + 0.2);
        const gradColor = hexToRgba(primary, bgOpacity);
        const meshPrimary = hexToRgba(primary, bgOpacity + 0.1);
        const meshSecondary = hexToRgba(customColors.secondary, bgOpacity + 0.1);

        return {
            none: 'none',
            subtle_dots: `radial-gradient(${dotColor} 1px, transparent 1px)`,
            slate_gradient: `linear-gradient(to bottom right, ${bg}, ${gradColor})`,
            mesh: `radial-gradient(at 40% 20%, ${meshPrimary} 0px, transparent 50%), radial-gradient(at 80% 0%, ${meshSecondary} 0px, transparent 50%), radial-gradient(at 0% 50%, ${hexToRgba(primary, 0.05)} 0px, transparent 50%)`,
        };
    };

    const activePatterns = useMemo(() => getDynamicPatterns(customColors.primary, customColors.background), [customColors, bgOpacity]);

    const theme = useMemo(() => createTheme({
        palette: {
            mode: isDark ? 'dark' : 'light',
            primary: { main: customColors.primary },
            secondary: { main: customColors.secondary },
            background: {
                default: customColors.background,
                paper: customColors.paper,
            },
            text: {
                primary: customColors.textMain,
                secondary: customColors.textSecondary
            },
        },
        // Custom variables for non-MUI parts
        custom: {
            sidebar: {
                background: customColors.sidebarBg,
                text: customColors.sidebarText
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 700 },
            h2: { fontWeight: 700 },
            h3: { fontWeight: 700 },
            h4: { fontWeight: 700 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundImage: bgPattern !== 'none' && !isDark ? activePatterns[bgPattern] : 'none',
                        backgroundSize: bgPattern === 'subtle_dots' ? '20px 20px' : 'cover',
                        backgroundAttachment: 'fixed',
                        backgroundColor: customColors.background,
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        textTransform: 'none',
                        fontWeight: 600,
                    },
                },
            },

            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    }
                }
            }
        },
    }), [currentPreset, bgPattern, isDark, customColors, activePatterns]);

    const value = {
        currentPreset,
        currentBg: bgPattern,
        currentOpacity: bgOpacity,
        customColors,
        themePresets,
        backgroundPatterns: activePatterns,
        setTheme: applyPreset, // Use new logic
        setBackground: setBgPattern,
        setOpacity: setBgOpacity,
        updateCustomColor
    };

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
