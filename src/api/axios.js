import axios from 'axios';
import { storage } from '../utils/tokenUtils';
import { refreshApi } from './authApi';

/**
 * ------------------------------------------------------------------
 * PRODUCTION AXIOS CLIENT WITH REQUEST QUEUING & INTERCEPTORS
 * ------------------------------------------------------------------
 * Fulfills Requirement 8 & 9:
 * - isRefreshing lock flag
 * - failedQueue promise subscriber array
 * - Promise resolution & request retries
 * - Guaranteed zero duplicate refresh HTTP calls
 */

// Create standard Axios instance
export const apiClient = axios.create({
    baseURL: 'https://dummyjson.com',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Single concurrency flag lock
let isRefreshing = false;

// Queue holding pending subscriber promises: Array<{ resolve: Function, reject: Function }>
let failedQueue = [];

/**
 * Resolves or rejects all subscriber promises queued during an in-flight refresh.
 * 
 * @param {Error|null} error - Error if refresh failed, otherwise null
 * @param {string|null} token - New access token if refresh succeeded
 */
const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

// ==================================================================
// 1. REQUEST INTERCEPTOR
// Dynamic Bearer Token Injection
// ==================================================================
apiClient.interceptors.request.use(
    (config) => {
        const token = storage.getAccessToken();
        
        // Inject Bearer token into Authorization header if available
        if (token && !config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==================================================================
// 2. RESPONSE INTERCEPTOR
// Global 401 Catch, Queueing, & Single-Flight Token Refresh
// ==================================================================
apiClient.interceptors.response.use(
    (response) => {
        // Pass successful responses through directly
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error has no response (e.g. network failure / connection drop)
        if (!error.response) {
            console.error('[AXIOS INTERCEPTOR] Network Failure / Connection Error:', error.message);
            return Promise.reject(error);
        }

        // Only handle 401 Unauthorized errors that haven't been retried yet
        if (error.response.status === 401 && !originalRequest._retry) {
            
            // Check if refresh is ALREADY in-flight from another parallel request
            if (isRefreshing) {
                console.warn('[AXIOS INTERCEPTOR] Refresh already in-flight. Queueing request:', originalRequest.url);
                
                // Return an unresolved Promise that joins the failedQueue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        console.log('[AXIOS INTERCEPTOR] Replaying queued request to:', originalRequest.url);
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            // Mark this request as retried to prevent infinite loops
            originalRequest._retry = true;
            isRefreshing = true;

            console.log('[AXIOS INTERCEPTOR] Received 401. Starting single silent refresh...');

            const refreshToken = storage.getRefreshToken();

            if (!refreshToken) {
                console.error('[AXIOS INTERCEPTOR] No refresh token found. Logging out...');
                isRefreshing = false;
                processQueue(new Error('No refresh token available'), null);
                storage.clearAll();
                window.dispatchEvent(new CustomEvent('auth:logout', { detail: 'No refresh token' }));
                return Promise.reject(error);
            }

            try {
                // Call raw refresh API (bypasses Axios interceptors to avoid loops)
                const data = await refreshApi(refreshToken);
                const newAccessToken = data.accessToken || data.token;
                const newRefreshToken = data.refreshToken || refreshToken;

                // Save new tokens to storage
                storage.setAccessToken(newAccessToken);
                storage.setRefreshToken(newRefreshToken);

                console.log('[AXIOS INTERCEPTOR] Refresh successful! Replaying initial request & queued subscribers...');

                // Replay initial request with fresh token
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Process all subscriber promises in queue with new token
                processQueue(null, newAccessToken);

                // Retry original failed request
                return apiClient(originalRequest);

            } catch (refreshError) {
                console.error('[AXIOS INTERCEPTOR] Token refresh genuinely failed:', refreshError.message);

                // Reject all queued subscriber promises
                processQueue(refreshError, null);

                // Wipe local state
                storage.clearAll();

                // Dispatch global logout event so AuthContext / UI can respond immediately
                window.dispatchEvent(new CustomEvent('auth:logout', { detail: 'Refresh failed' }));

                return Promise.reject(refreshError);

            } finally {
                // Release concurrency lock
                isRefreshing = false;
            }
        }

        // Return all non-401 errors directly to caller
        return Promise.reject(error);
    }
);
