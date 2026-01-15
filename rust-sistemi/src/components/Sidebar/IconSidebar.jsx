
import React from 'react';
import { Box, IconButton, Tooltip, Avatar, Typography, Button, useTheme } from '@mui/material';
import { Home, Group, Settings, Logout, Person, Notifications, AdminPanelSettings, Delete, PhotoCamera, Chat, BugReport, ReportProblem } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';

import api from '../../services/api';

import { useSound } from '../../context/SoundContext';

// Keyframes for Shake Animation
const shakeKeyframes = `
@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}
`;

const IconSidebar = ({ onToggleDebug }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { playClick, playSuccess, playMessageReceived } = useSound(); // Use Sound
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [notifications, setNotifications] = React.useState([]);
    const [systemErrorCount, setSystemErrorCount] = React.useState(0); // ADDED STATE
    const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
    const hasSynced = React.useRef(false);

    // Chat Notification Logic
    const [totalUnreadMessages, setTotalUnreadMessages] = React.useState(0);
    const [chatAnimating, setChatAnimating] = React.useState(false);
    const prevUnreadCountRef = React.useRef(0);

    const isActive = (path) => location.pathname.startsWith(path);
    const [user, setUser] = React.useState(api.getCurrentUser());
    const isAdmin = user?.role === 'admin';

    React.useEffect(() => {
        const handleStorage = () => {
            setUser(api.getCurrentUser());
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const loadNotifications = React.useCallback(async () => {
        if (!user?.id) return;
        try {
            // Load System Notifications
            const data = await api.getNotifications(user.id);
            let filtered = Array.isArray(data) ? data : [];
            if (!isAdmin) {
                filtered = filtered.filter(n => n.change_type !== 'vacation_created');
            }
            setNotifications(filtered);

            // Admin: Load System Error Count
            if (isAdmin) {
                try {
                    const errorRes = await api.getSystemErrors();
                    if (errorRes && Array.isArray(errorRes.data)) {
                        setSystemErrorCount(errorRes.data.length);
                    }
                } catch (e) {
                    console.error("Failed to load system errors count", e);
                }
            }

            // Load Chat Unread Count
            // Assuming api.chat.getActiveFriends returns friends with `unread_count` properly populated
            // OR if there is a specific endpoint for total unread. 
            // I'll reuse getActiveFriends(true) to force refresh stats
            const friendRes = await api.chat.getActiveFriends(true);
            if (friendRes?.data) {
                const total = friendRes.data.reduce((sum, f) => sum + (f.unread_count || 0), 0);
                setTotalUnreadMessages(total);

                // If count INCREASED, play sound and animate
                if (total > prevUnreadCountRef.current) {
                    playMessageReceived();
                    setChatAnimating(true);
                    setTimeout(() => setChatAnimating(false), 1000); // Stop after 1s
                }
                prevUnreadCountRef.current = total;
            }

        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    }, [user?.id, isAdmin, playMessageReceived]);

    React.useEffect(() => {
        let isMounted = true;

        const init = async () => {
            // 1. Sync User Profile (Image, Name) to ensure sidebar is fresh
            try {
                const freshProfile = await api.getMyProfile();
                if (freshProfile && isMounted) {
                    api.updateLocalUser({
                        name: freshProfile.name,
                        profile_image: freshProfile.profile_image,
                        role: freshProfile.role
                    });
                }
            } catch (e) {
                console.warn("Sidebar profile sync failed", e);
            }

            // 2. Sync Notifications
            if (isAdmin && !hasSynced.current) {
                hasSynced.current = true;
                api.syncNotifications().catch(e => console.error("Sync failed", e));
            }
            if (isMounted) loadNotifications();
        };

        init();
        const handleRefresh = () => {
            if (isMounted) loadNotifications();
        };

        window.addEventListener('notification-update', handleRefresh);
        window.addEventListener('chat-message', handleRefresh);
        window.addEventListener('friend-update', handleRefresh);
        window.addEventListener('friend-request-update', handleRefresh);

        return () => {
            isMounted = false;
            window.removeEventListener('notification-update', handleRefresh);
            window.removeEventListener('chat-message', handleRefresh);
            window.removeEventListener('friend-update', handleRefresh);
            window.removeEventListener('friend-request-update', handleRefresh);
        };
    }, [user?.id, isAdmin, loadNotifications]);

    const handleNotifClick = (event) => {
        playClick(); // Sound
        setAnchorEl(event.currentTarget);
    };
    const handleNotifClose = () => setAnchorEl(null);

    const handleNotifAction = async (notif) => {
        handleNotifClose();
        playClick(); // Sound
        try {
            await api.markNotificationRead(notif.id);
            if (notif.change_type === 'vacation_created' && notif.related_id) {
                // Parse "EMPID:VACID" or just "EMPID" (legacy)
                let empId = notif.related_id;
                let vacId = null;

                if (notif.related_id.includes(':')) {
                    [empId, vacId] = notif.related_id.split(':');
                }

                // Admin: Go to Employee Profile
                let url = `/dashboard/employees/${empId}`;
                if (vacId) url += `?highlight=${vacId}`;

                navigate(url);
            } else if (['status_changed', 'vacation_update', 'vacation_deleted'].includes(notif.change_type)) {
                // Format: "EMPID:VACID"
                let empId = user?.id; // Default to self
                let vacId = null;

                if (notif.related_id && notif.related_id.includes(':')) {
                    [empId, vacId] = notif.related_id.split(':');
                } else if (notif.related_id) {
                    empId = notif.related_id;
                }

                let url = `/dashboard/employees/${empId}`;
                if (vacId) url += `?highlight=${vacId}`;

                navigate(url);
            }
            loadNotifications();
        } catch (error) {
            console.error("Failed to process notification", error);
        }
    };

    const handleDeleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.deleteNotification(id);
            loadNotifications();
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const NavItem = ({ icon: Icon, path, title, hidden, badge, animating }) => {
        if (hidden) return null;
        return (
            <Tooltip title={title} placement="right">
                <IconButton
                    onClick={() => { playClick(); navigate(path); }}
                    sx={{
                        color: isActive(path) ? 'white' : 'rgba(255,255,255,0.6)',
                        bgcolor: isActive(path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                        borderRadius: 2,
                        mb: 2,
                        // Animation Style
                        animation: animating ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
                        // Inject keyframes locally if not global? Actually we added them as string but need a style tag or styled component.
                        // Since I added `const shakeKeyframes` string above, I should render it.
                        // Or better, add 'transform-origin: center'
                        transformOrigin: 'center',

                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white'
                        }
                    }}
                >
                    <Badge badgeContent={badge} color="error" invisible={!badge}>
                        <Icon sx={{ fontSize: 28 }} />
                    </Badge>
                </IconButton>
            </Tooltip>
        );
    };

    const handleProfileMenuOpen = (event) => {
        playClick(); // Sound
        setProfileAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileAnchorEl(null);
    };

    const handleLogout = () => {
        // Notify SocketContext to disconnect
        window.dispatchEvent(new Event('auth-logout'));
        api.logout();
        navigate('/login');
    };

    return (
        <Box
            sx={{
                width: 72,
                height: '100vh',
                bgcolor: theme.custom?.sidebar?.background || 'primary.main', // Custom or fallback
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 3,
                borderRight: '1px solid rgba(255,255,255,0.05)',
                zIndex: 1200,
                position: 'fixed',
                left: 0,
                top: 0
            }}
        >
            <style>{shakeKeyframes}</style>

            {/* User Avatar / Logo Area */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Tooltip title={user?.name || 'İstifadəçi'}>
                    <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
                        <Avatar
                            src={api.getImageUrl(user?.profile_image)}
                            sx={{
                                // bgcolor: isAdmin ? 'primary.main' : 'success.main', // Removed green circle
                                bgcolor: 'rgba(255,255,255,0.1)', // Neutral background
                                width: 44, height: 44,
                                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer'
                            }}
                        >
                            {user?.name?.[0] || 'U'}
                        </Avatar >
                    </IconButton >
                </Tooltip >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 'bold' }}>
                    {user?.role?.toUpperCase()}
                </Typography>
            </Box >

            {/* Profile Dropdown Menu */}
            < Menu
                anchorEl={profileAnchorEl}
                open={Boolean(profileAnchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
            >
                <MenuItem onClick={() => { navigate('/dashboard/profile'); handleProfileMenuClose(); }}>
                    <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                    <ListItemText>Profil</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleLogout(); handleProfileMenuClose(); }}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    <ListItemText>Çıxış</ListItemText>
                </MenuItem>
            </Menu >

            {/* Nav Items */}
            < Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <NavItem icon={Home} path="/dashboard/home" title="Ana Səhifə" />
                <NavItem
                    icon={Chat}
                    path="/dashboard/chat"
                    title="Chat"
                    badge={totalUnreadMessages}
                    animating={chatAnimating}
                />

                {/* Notifications Bell for EVERYONE */}
                <Tooltip title="Bildirişlər" placement="right">
                    <IconButton
                        onClick={handleNotifClick}
                        sx={{
                            color: unreadCount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                            mb: 2,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <Badge badgeContent={unreadCount} color="error">
                            <Notifications sx={{ fontSize: 28 }} />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {/* Admin sees list, User sees only their profile */}
                {
                    isAdmin ? (
                        <NavItem icon={Group} path="/dashboard/employees" title="İşçilər" />
                    ) : (
                        <NavItem icon={Person} path={`/dashboard/employees/${user?.id}`} title="Mənim Profilim" />
                    )
                }

                {
                    isAdmin && (
                        <>
                            <NavItem icon={AdminPanelSettings} path="/dashboard/admin-tools" title="Admin Alətləri" />
                            <NavItem
                                icon={ReportProblem}
                                path="/dashboard/admin-errors"
                                title="Sistem Xətaları"
                                badge={systemErrorCount} // ADDED BADGE
                            />
                        </>
                    )
                }

                {/* Debug Button for Admin - Enabled for ALL now for testing */}
                {
                    (true || isAdmin) && (
                        <Tooltip title="Debug Konsolu" placement="right">
                            <IconButton
                                onClick={onToggleDebug}
                                sx={{
                                    color: 'rgba(255,255,255,0.4)',
                                    mb: 2,
                                    '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                                }}
                            >
                                <BugReport sx={{ fontSize: 28 }} />
                            </IconButton>
                        </Tooltip>
                    )
                }

                <NavItem icon={Settings} path="/dashboard/settings" title="Tənzimləmələr" />
            </Box >

            {/* Notifications Menu */}
            < Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleNotifClose}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                PaperProps={{
                    sx: {
                        ml: 1,
                        width: 500, // Widened from 320 for better visibility
                        maxHeight: 600, // Increased height too
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        borderRadius: 2,
                        zIndex: 2000 // Ensure it is on top
                    }
                }}
            >
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">Bildirişlər ({notifications.length})</Typography>
                    {unreadCount > 0 && <Typography variant="caption" color="primary">{unreadCount} yeni</Typography>}
                </Box>
                <Divider />
                {
                    notifications.length === 0 ? (
                        <Box p={3} textAlign="center">
                            <Typography variant="body2" color="text.secondary">Bildiriş yoxdur ({notifications.length})</Typography>
                        </Box>
                    ) : (
                        notifications.map((n) => (
                            <MenuItem
                                key={n.id}
                                onClick={() => handleNotifAction(n)}
                                sx={{
                                    py: 1.5,
                                    bgcolor: n.is_read ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                                    borderLeft: n.is_read ? '3px solid transparent' : '3px solid #2563eb',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <ListItemText
                                    primary={n.message}
                                    secondary={new Date(n.created_at).toLocaleString('az-AZ')}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: n.is_read ? 'medium' : 'bold' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleDeleteNotification(e, n.id)}
                                    sx={{ ml: 1, color: '#999', '&:hover': { color: '#d32f2f' } }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </MenuItem>
                        ))
                    )
                }

                <Box p={1}>
                    <Button
                        fullWidth
                        variant="text"
                        size="small"
                        onClick={() => { handleNotifClose(); navigate('/dashboard/notifications'); }}
                    >
                        Bütün Bildirişlərə Bax
                    </Button>
                </Box>
            </Menu >

            {/* Logout */}
            < Tooltip title="Çıxış" placement="right" >
                <IconButton
                    onClick={handleLogout}
                    sx={{
                        color: 'rgba(255,255,255,0.4)',
                        mb: 1,
                        '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                    }}
                >
                    <Logout />
                </IconButton>
            </Tooltip >
        </Box >
    );
};

export default IconSidebar;
