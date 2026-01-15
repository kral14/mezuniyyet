import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { Archive, Security, ListAlt } from '@mui/icons-material';
import ArchivePage from '../ArchivePage';
import SecurityPage from '../SecurityPage';
import DictionaryManager from './DictionaryManager';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const AdminToolsPage = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', px: 3, pt: 2 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1e293b' }}>
                    Admin Alətləri
                </Typography>
                <Tabs value={value} onChange={handleChange} aria-label="admin tools tabs">
                    <Tab icon={<Archive />} iconPosition="start" label="Arxivləmə" />
                    <Tab icon={<Security />} iconPosition="start" label="Təhlükəsizlik" />
                    <Tab icon={<ListAlt />} iconPosition="start" label="Şöbə & Vəzifələr" />
                </Tabs>
            </Box>

            <TabPanel value={value} index={0}>
                <ArchivePage />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <SecurityPage />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <DictionaryManager />
            </TabPanel>
        </Box>
    );
};

export default AdminToolsPage;
