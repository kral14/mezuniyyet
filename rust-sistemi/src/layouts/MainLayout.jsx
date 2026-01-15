import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../services/api';
import IconSidebar from '../components/Sidebar/IconSidebar';
import EmployeeListSidebar from '../components/Sidebar/EmployeeListSidebar';
import Footer from '../components/Footer';

import DebugConsole from '../components/DebugConsole';

const MainLayout = () => {
    const location = useLocation();
    const user = api.getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const [debugOpen, setDebugOpen] = React.useState(false);

    // Determine if we need the secondary sidebar
    // Only show employee list sidebar for ADMINS on employees route
    const showEmployeeList = isAdmin && location.pathname.includes('/employees');

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
            {/* 1. Primary Icon Sidebar (Fixed 72px) */}
            <IconSidebar onToggleDebug={() => setDebugOpen(!debugOpen)} />

            <DebugConsole open={debugOpen} onClose={() => setDebugOpen(false)} />

            {/* 2. Secondary Sidebar (Fixed 300px) - Conditional */}
            {showEmployeeList && <EmployeeListSidebar />}

            {/* 3. Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: showEmployeeList ? '372px' : '72px',
                    height: '100vh',
                    transition: 'margin-left 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: location.pathname.includes('/chat') ? 'hidden' : 'auto',
                        p: location.pathname.includes('/chat') ? 0 : 3,
                        ...(location.pathname.includes('/employees') && { pt: 0, pl: 3, pr: '2px', pb: '2px' })
                    }}
                >
                    <Outlet />
                </Box>
                <Footer />
            </Box>
        </Box>
    );
};

export default MainLayout;
