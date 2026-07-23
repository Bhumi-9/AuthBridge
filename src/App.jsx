import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import { Navbar } from './components/Navbar';

/**
 * AppContent Component
 * Listens for global 'auth:logout' events dispatched by Axios response interceptors.
 */
const AppContent = () => {
    const { logout } = useAuth();

    useEffect(() => {
        const handleGlobalLogout = (e) => {
            console.warn('[APP] Received global auth:logout event:', e.detail);
            logout(e.detail || 'Global interceptor logout event');
        };

        window.addEventListener('auth:logout', handleGlobalLogout);
        return () => window.removeEventListener('auth:logout', handleGlobalLogout);
    }, [logout]);

    return (
        <div className="app-layout">
            <Navbar />
            <main className="main-content">
                <AppRoutes />
            </main>
        </div>
    );
};

/**
 * Root App Component
 */
export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <AppContent />
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
