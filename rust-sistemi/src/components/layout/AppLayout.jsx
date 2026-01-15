import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Badge,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    People,
    BeachAccess,
    CalendarMonth,
    Assessment,
    Settings,
    Notifications,
    Logout,
    ChevronLeft,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 260;
const drawerWidthClosed = 65;

const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'İşçilər', icon: <People />, path: '/employees' },
    { text: 'Məzuniyyətlər', icon: <BeachAccess />, path: '/vacations' },
    { text: 'Təqvim', icon: <CalendarMonth />, path: '/calendar' },
    { text: 'Hesabatlar', icon: <Assessment />, path: '/reports' },
    { text: 'Parametrlər', icon: <Settings />, path: '/settings' },
];

const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleUserMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${sidebarOpen ? drawerWidth : drawerWidthClosed}px)`,
                    ml: `${sidebarOpen ? drawerWidth : drawerWidthClosed}px`,
                    transition: 'all 0.3s ease',
                    backgroundColor: 'background.paper',
                    backgroundImage: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={toggleSidebar}
                        sx={{ mr: 2 }}
                    >
                        {sidebarOpen ? <ChevronLeft /> : <MenuIcon />}
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
                        {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
                    </Typography>

                    <IconButton color="inherit" sx={{ mr: 2 }}>
                        <Badge badgeContent={3} color="error">
                            <Notifications sx={{ color: 'text.primary' }} />
                        </Badge>
                    </IconButton>

                    <IconButton onClick={handleUserMenuOpen}>
                        <Avatar
                            sx={{
                                bgcolor: 'primary.main',
                                width: 36,
                                height: 36,
                            }}
                        >
                            {user?.name?.charAt(0) || 'A'}
                        </Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleUserMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.name}</Typography>
                        </MenuItem>
                        <MenuItem disabled>
                            <Typography variant="caption" color="text.secondary">
                                {user?.role}
                            </Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Çıxış
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: sidebarOpen ? drawerWidth : drawerWidthClosed,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: sidebarOpen ? drawerWidth : drawerWidthClosed,
                        boxSizing: 'border-box',
                        transition: 'width 0.3s ease',
                        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                        borderRight: '1px solid rgba(102, 126, 234, 0.1)',
                        overflowX: 'hidden',
                    },
                }}
            >
                {/* Logo */}
                <Toolbar
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 2,
                    }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                    >
                        <BeachAccess sx={{ fontSize: 40, color: 'primary.main', mr: sidebarOpen ? 1 : 0 }} />
                    </motion.div>
                    <AnimatePresence>
                        {sidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                            >
                                <Typography variant="h6" fontWeight={700} color="white" noWrap>
                                    Məzuniyyət
                                </Typography>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Toolbar>

                <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.2)' }} />

                {/* Menu Items */}
                <List sx={{ px: 1, py: 2 }}>
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <motion.div
                                key={item.path}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        backgroundColor: isActive ? 'rgba(102, 126, 234, 0.15)' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                        },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: isActive ? 'primary.main' : 'text.secondary',
                                            minWidth: sidebarOpen ? 40 : 'auto',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <AnimatePresence>
                                        {sidebarOpen && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <ListItemText
                                                    primary={item.text}
                                                    primaryTypographyProps={{
                                                        fontSize: 14,
                                                        fontWeight: isActive ? 600 : 400,
                                                        color: isActive ? 'primary.main' : 'text.primary',
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </ListItemButton>
                            </motion.div>
                        );
                    })}
                </List>
            </Drawer>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: `calc(100% - ${sidebarOpen ? drawerWidth : drawerWidthClosed}px)`,
                    transition: 'all 0.3s ease',
                    mt: 8,
                    backgroundColor: 'background.default',
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default AppLayout;
