/**
 * JWT Token Utilities & Payload Parsing Helper
 * 
 * Purpose: Provides pure, side-effect-free helper functions for parsing JWT tokens,
 * decoding Base64 payload claims, checking expiration timestamps, and managing local storage.
 */

// Key constants for localStorage
export const ACCESS_TOKEN_KEY = 'jwt_access_token';
export const REFRESH_TOKEN_KEY = 'jwt_refresh_token';
export const USER_KEY = 'jwt_user_info';

/**
 * Parses an unencrypted Base64URL encoded JWT token string.
 * Extracts the payload JSON object containing standard claims like 'exp', 'sub', 'iat'.
 * 
 * @param {string} token - JWT string (header.payload.signature)
 * @returns {object|null} Decoded payload object or null if invalid
 */
export function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to parse JWT token payload:', error);
        return null;
    }
}

/**
 * Checks whether a given JWT token is expired or close to expiring within a buffer window.
 * 
 * @param {string} token - JWT string
 * @param {number} bufferSeconds - Safety margin in seconds (default 10s)
 * @returns {boolean} True if token is expired or expires within bufferSeconds
 */
export function isTokenExpired(token, bufferSeconds = 10) {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;

    const currentTimeMs = Date.now();
    const expirationTimeMs = payload.exp * 1000;
    const bufferMs = bufferSeconds * 1000;

    return currentTimeMs >= expirationTimeMs - bufferMs;
}

/**
 * Storage helpers for persisting state across browser reloads.
 */
export const storage = {
    getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
    setAccessToken: (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
    
    getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    setRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),

    getUser: () => {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),

    clearAll: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
};
