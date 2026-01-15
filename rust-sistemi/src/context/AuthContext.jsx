import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored auth token
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        try {
            // Simulated API call - real dəyərsə backend-ə göndəriləcək
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock user data
            const userData = {
                id: 1,
                username: username,
                name: 'Admin İstifadəçi',
                role: 'admin',
            };

            // Mock token
            const token = 'mock-jwt-token-' + Date.now();

            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setLoading(false);
            return { success: true };
        } catch (error) {
            setLoading(false);
            return { success: false, error: 'Giriş uğursuz oldu' };
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
