import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../services/api';

const ProtectedRoute = ({ roles }) => {
    const user = api.getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard/home" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
