import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { ThemeProviderWrapper } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import AnimationShowcase from "./pages/AnimationShowcase";
import Home from "./pages/Home";
import EmployeeDetails from "./pages/EmployeeDetails";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import ChatPage from "./pages/ChatPage";
import AdminToolsPage from "./pages/AdminTools/AdminToolsPage";
import ProfilePage from "./pages/ProfilePage";
import VacationRequestsPage from "./pages/VacationRequestsPage";
import SettingsPage from "./pages/SettingsPage";

import AdminErrorLogs from "./pages/AdminErrorLogs";

import ErrorBoundary from './components/ErrorBoundary';

// Components
import ServerAwakening from './components/common/ServerAwakening';
import api from './services/api';

const App = () => {
    // Prevent Global Context Menu
    React.useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    // Server Health Check State
    const [isServerReady, setIsServerReady] = React.useState(false);
    const [connectionError, setConnectionError] = React.useState(null);

    React.useEffect(() => {
        let mounted = true;
        const check = async () => {
            try {
                // api.checkHealth now returns true or throws error/returns false
                // customized to throw detail if we change api.js, but for now assuming it returns bool
                // We'll modify this to actually try fetch here or rely on api.checkHealth

                // Let's do a direct fetch here for clearer debugging, or force api.checkHealth to be more verbose
                // For now, let's wrap api.checkHealth logic here locally for debug visibility if needed, 
                // OR we update api.checkHealth. Let's update api.checkHealth first actually?
                // No, let's just do a direct fetch attempt here FOR DEBUGGING purposes
                const response = await fetch(`${api.API_URL.replace('/api', '')}/`);
                if (response.ok) {
                    if (mounted) {
                        setIsServerReady(true);
                        setConnectionError(null);
                    }
                } else {
                    throw new Error(`Status: ${response.status}`);
                }
            } catch (err) {
                console.error("Health Check Failed:", err);
                if (mounted) {
                    setConnectionError(err.message || "Bilinməyən xəta");
                    // Retry
                    setTimeout(check, 4000);
                }
            }
        };
        check();
        return () => { mounted = false; };
    }, []);

    if (!isServerReady) {
        return <ServerAwakening error={connectionError} />;
    }

    return (
        <ThemeProviderWrapper>
            <CssBaseline />
            <NotificationProvider>
                <SoundProvider>
                    <SocketProvider>
                        <ErrorBoundary>
                            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/animations" element={<AnimationShowcase />} />

                                    {/* New Main Layout with Double Sidebar */}
                                    <Route path="/dashboard" element={<MainLayout />}>
                                        {/* Default Redirect to Home */}
                                        <Route index element={<Navigate to="/dashboard/home" replace />} />

                                        {/* Home Tab */}
                                        <Route path="home" element={<Home />} />

                                        {/* Employees Tab - List is in Sidebar, Details in Main Area */}
                                        <Route path="employees" element={<EmployeeDetails />} />
                                        <Route path="employees/:id" element={<EmployeeDetails />} />

                                        {/* Notifications Tab */}
                                        <Route path="notifications" element={<NotificationsPage />} />

                                        {/* Vacation Requests */}
                                        <Route path="vacations" element={<VacationRequestsPage />} />

                                        {/* Profile Page */}
                                        <Route path="profile" element={<ProfilePage />} />

                                        {/* Chat Page */}
                                        <Route path="chat" element={<ChatPage />} />

                                        {/* Settings Tab */}
                                        <Route path="settings" element={<SettingsPage />} />

                                        {/* Admin Protected Routes */}
                                        <Route element={<ProtectedRoute roles={['admin']} />}>
                                            <Route path="admin-tools" element={<AdminToolsPage />} />
                                            <Route path="admin-errors" element={<AdminErrorLogs />} />
                                        </Route>
                                    </Route>

                                    {/* Fallback & Root */}
                                    <Route path="/" element={<Navigate to="/login" replace />} />
                                    <Route path="*" element={<Navigate to="/login" replace />} />
                                </Routes>
                            </Router>
                        </ErrorBoundary>
                    </SocketProvider>
                </SoundProvider>
            </NotificationProvider>
        </ThemeProviderWrapper>
    );
};

export default App;
