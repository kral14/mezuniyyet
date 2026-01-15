import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success'); // success, error, warning, info

    const showNotification = (msg, type = 'success') => {
        setMessage(msg);
        setSeverity(type);
        setOpen(true);
    };

    // Auto-hide after 3 seconds
    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                setOpen(false);
                setMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const hideNotification = () => {
        setOpen(false);
        setMessage('');
    };

    return (
        <NotificationContext.Provider value={{ showNotification, hideNotification, notification: { open, message, severity } }}>
            {children}
        </NotificationContext.Provider>
    );
};
