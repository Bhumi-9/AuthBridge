import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { storage, parseJwt, isTokenExpired } from '../utils/tokenUtils';

// Create React Context instance
const AuthContext = createContext(null);

// Base API URL for DummyJSON auth
const AUTH_BASE_URL = 'https://dummyjson.com/auth';

// Demo User Information Override
const DEMO_USER_INFO = {
    username: 'sanchya',
    firstName: 'Sanchya',
    lastName: '',
    email: 'sachyaauth1@gmail.com',
    gender: 'Male'
};

const mapUserToSanchya = (userData) => {
    if (!userData) return null;
    return {
        ...userData,
        username: DEMO_USER_INFO.username,
        firstName: DEMO_USER_INFO.firstName,
        lastName: DEMO_USER_INFO.lastName,
        email: DEMO_USER_INFO.email,
        gender: DEMO_USER_INFO.gender,
        image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80'
    };
};

/**
 * AuthProvider Component
 * Encloses the application and exposes global authentication state & actions.
 */
export const AuthProvider = ({ children }) => {
    // -------------------------------------------------------------
    // 1. STATE DEFINITIONS
    // -------------------------------------------------------------
    const [user, setUser] = useState(() => {
        const stored = storage.getUser();
        return stored ? mapUserToSanchya(stored) : null;
    });
    const [accessToken, setAccessToken] = useState(() => storage.getAccessToken());
    const [refreshToken, setRefreshToken] = useState(() => storage.getRefreshToken());
    
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Track active AbortControllers to cancel mid-flight requests on logout
    const activeAbortControllersRef = useRef(new Set());
    
    // Pre-emptive refresh timer ref
    const refreshTimerRef = useRef(null);

    // -------------------------------------------------------------
    // 2. HELPER TO REGISTER/UNREGISTER ABORT CONTROLLERS
    // -------------------------------------------------------------
    const createAbortSignal = useCallback(() => {
        const controller = new AbortController();
        activeAbortControllersRef.current.add(controller);
        return controller;
    }, []);

    const removeAbortSignal = useCallback((controller) => {
        if (controller) {
            activeAbortControllersRef.current.delete(controller);
        }
    }, []);

    // -------------------------------------------------------------
    // 3. SILENT TOKEN REFRESH LOGIC
    // -------------------------------------------------------------
    const refreshTokens = useCallback(async () => {
        const currentRefreshToken = refreshToken || storage.getRefreshToken();
        
        if (!currentRefreshToken) {
            throw new Error('No refresh token available');
        }

        const controller = createAbortSignal();

        try {
            const response = await fetch(`${AUTH_BASE_URL}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refreshToken: currentRefreshToken,
                    expiresInMins: 30
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Refresh failed with HTTP status ${response.status}`);
            }

            const data = await response.json();
            const newAccessToken = data.accessToken || data.token;
            const newRefreshToken = data.refreshToken || currentRefreshToken;

            // Update in-memory state
            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);

            // Persist to storage
            storage.setAccessToken(newAccessToken);
            storage.setRefreshToken(newRefreshToken);

            return newAccessToken;
        } finally {
            removeAbortSignal(controller);
        }
    }, [refreshToken, createAbortSignal, removeAbortSignal]);

    // -------------------------------------------------------------
    // 4. LOGOUT & IMMEDIATE SESSION TEARDOWN
    // -------------------------------------------------------------
    const logout = useCallback((reason = 'User initiated logout') => {
        console.warn(`[AUTH TEARDOWN] Logging out (${reason})...`);

        // 1. Abort ALL active mid-flight HTTP requests immediately
        if (activeAbortControllersRef.current.size > 0) {
            console.log(`[AUTH TEARDOWN] Aborting ${activeAbortControllersRef.current.size} active HTTP requests...`);
            activeAbortControllersRef.current.forEach((controller) => {
                controller.abort();
            });
            activeAbortControllersRef.current.clear();
        }

        // 2. Clear preemptive timer
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        // 3. Invalidate local state
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);

        // 4. Clear browser storage
        storage.clearAll();
    }, []);

    // -------------------------------------------------------------
    // 5. LOGIN ACTION
    // -------------------------------------------------------------
    const login = useCallback(async (username, password, expiresInMins = 60) => {
        setIsLoading(true);
        const controller = createAbortSignal();

        // Support 'sanchya' and password 'sanchauth' for DummyJSON backend authentication
        const authUsername = (username === 'sanchya') ? 'emilys' : username;
        const authPassword = (password === 'sanchauth' || password === 'sanchyapass' || password === 'emilyspass' || password === 'emilypass') ? 'emilyspass' : password;

        try {
            const response = await fetch(`${AUTH_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: authUsername, password: authPassword, expiresInMins }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Invalid credentials');
            }

            const data = await response.json();
            
            const newAccessToken = data.accessToken || data.token;
            const newRefreshToken = data.refreshToken;
            
            // Map frontend user data to Sanchya
            const userData = {
                id: data.id,
                username: DEMO_USER_INFO.username,
                email: DEMO_USER_INFO.email,
                firstName: DEMO_USER_INFO.firstName,
                lastName: DEMO_USER_INFO.lastName,
                gender: DEMO_USER_INFO.gender,
                image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80'
            };

            // Set state
            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
            setUser(userData);

            // Persist
            storage.setAccessToken(newAccessToken);
            storage.setRefreshToken(newRefreshToken);
            storage.setUser(userData);

            return userData;
        } finally {
            setIsLoading(false);
            removeAbortSignal(controller);
        }
    }, [createAbortSignal, removeAbortSignal]);

    // -------------------------------------------------------------
    // 6. INITIALIZATION & RE-HYDRATION ON MOUNT
    // -------------------------------------------------------------
    useEffect(() => {
        const initializeAuth = async () => {
            const storedAccess = storage.getAccessToken();
            const storedRefresh = storage.getRefreshToken();
            const storedUser = storage.getUser();

            if (storedAccess && storedRefresh && storedUser) {
                const mapped = mapUserToSanchya(storedUser);
                setUser(mapped);
                storage.setUser(mapped);

                // If access token is expired on app startup, attempt silent refresh before rendering!
                if (isTokenExpired(storedAccess, 10)) {
                    console.log('[AUTH INIT] Stored access token expired. Attempting silent startup refresh...');
                    try {
                        await refreshTokens();
                    } catch (err) {
                        console.error('[AUTH INIT] Startup silent refresh failed:', err.message);
                        logout('Startup refresh failed');
                    }
                }
            } else if (!storedRefresh) {
                // Clear inconsistent residual storage
                storage.clearAll();
            }

            setIsInitialized(true);
        };

        initializeAuth();
    }, []); // Run once on app mount

    // -------------------------------------------------------------
    // 7. CONTEXT VALUE EXPOSITION
    // -------------------------------------------------------------
    const value = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        isLoading,
        isInitialized,
        login,
        logout,
        refreshTokens,
        createAbortSignal,
        removeAbortSignal
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom Hook to consume AuthContext cleanly.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an <AuthProvider>');
    }
    return context;
};
