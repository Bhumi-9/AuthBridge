import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * AppRoutes Component
 * Central route map configuring public routes, protected routes, and wildcards.
 */
export const AppRoutes = () => {
    const { isAuthenticated, isInitialized } = useAuth();

    if (!isInitialized) {
        return <LoadingSpinner message="Initializing Authentication Engine..." />;
    }

    return (
        <Routes>
            {/* Public Landing Page */}
            <Route
                path="/"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />}
            />

            {/* Public Route: Login */}
            <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
            />

            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Default Catch-All Fallback */}
            <Route 
                path="*" 
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
            />
        </Routes>
    );
};
