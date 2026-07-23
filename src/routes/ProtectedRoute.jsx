import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { isTokenExpired, storage } from '../utils/tokenUtils';

/**
 * ProtectedRoute Component
 * 
 * Fulfills Requirement 7 & 18:
 * - Checks authentication status prior to rendering protected routes (/dashboard, /profile).
 * - If access token is expired or missing, it DOES NOT redirect preemptively.
 * - Performs a silent token refresh first.
 * - Redirects to /login ONLY after refresh genuinely fails.
 */
export const ProtectedRoute = () => {
    const { isAuthenticated, isInitialized, accessToken, refreshTokens, logout } = useAuth();
    const location = useLocation();
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const verifySession = async () => {
            // 1. If context is not initialized yet, wait
            if (!isInitialized) return;

            // 2. If access token exists and is active -> valid!
            if (accessToken && !isTokenExpired(accessToken, 5)) {
                if (isMounted) {
                    setIsVerified(true);
                    setIsVerifying(false);
                }
                return;
            }

            // 3. If access token is expired or missing, check if refresh token exists
            const refreshToken = storage.getRefreshToken();
            if (!refreshToken) {
                // No tokens at all -> genuine authorization failure
                if (isMounted) {
                    setIsVerified(false);
                    setIsVerifying(false);
                }
                return;
            }

            // 4. DO NOT REDIRECT PREEMPTIVELY! Attempt silent refresh first
            if (isMounted) setIsVerifying(true);

            try {
                console.log('[PROTECTED ROUTE] Access token invalid/expired. Attempting silent refresh before navigation...');
                await refreshTokens();
                if (isMounted) {
                    setIsVerified(true);
                }
            } catch (error) {
                console.error('[PROTECTED ROUTE] Silent refresh genuinely failed:', error.message);
                logout('Protected route refresh failed');
                if (isMounted) {
                    setIsVerified(false);
                }
            } finally {
                if (isMounted) setIsVerifying(false);
            }
        };

        verifySession();

        return () => {
            isMounted = false;
        };
    }, [isInitialized, accessToken, refreshTokens, logout]);

    // Show spinner during initial app boot or during silent refresh check
    if (!isInitialized || isVerifying) {
        return <LoadingSpinner message="Verifying protected session..." />;
    }

    // Render protected route if verified, otherwise redirect to /login
    if (isAuthenticated || isVerified) {
        return <Outlet />;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
};
