/**
 * JWT Auth Flow with Silent Token Refresh & Request Queue
 * 
 * Fulfills PDF Requirements:
 * 1. Token storage + automatic refresh before expiry or on 401.
 * 2. Request queueing while refresh is in-flight; deduplicated refresh calls.
 * 3. Protected route guards redirect only after refresh fails (not preemptively).
 * 4. Immediate state invalidation & mid-flight request cancellation on logout.
 */

export class JWTAuthManager {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://dummyjson.com';
        
        // Token State (In-Memory + Optional Storage)
        this.accessToken = localStorage.getItem('jwt_access_token') || null;
        this.refreshToken = localStorage.getItem('jwt_refresh_token') || null;
        this.user = JSON.parse(localStorage.getItem('jwt_user_data') || 'null');
        
        // Expiration & Timers
        this.tokenExpiresAt = parseInt(localStorage.getItem('jwt_exp') || '0', 10);
        this.refreshTimer = null;
        
        // Queue & Concurrency Lock
        this.isRefreshing = false;
        this.failedQueue = [];
        
        // Mid-Flight Request Tracking for Immediate Teardown
        this.activeAbortControllers = new Set();
        
        // Event Listeners (UI updates, logs)
        this.onLogCallback = options.onLog || (() => {});
        this.onStateChangeCallback = options.onStateChange || (() => {});

        // Simulated Mode Settings (for testing short expiries like 8s)
        this.simulatedMode = false;
        this.simulatedTokenLifespanMs = 10000; // 10 seconds for rapid testing
        
        // Initialize preemptive timer if token exists
        if (this.accessToken && this.tokenExpiresAt) {
            this._schedulePreemptiveRefresh();
        }
    }

    // ==========================================
    // 1. LOGGING & UTILS
    // ==========================================
    log(message, type = 'info', meta = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`, meta || '');
        if (this.onLogCallback) {
            this.onLogCallback({ timestamp, message, type, meta });
        }
    }

    _notifyStateChange() {
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback({
                isAuthenticated: !!this.accessToken,
                user: this.user,
                tokenExpiresAt: this.tokenExpiresAt,
                isRefreshing: this.isRefreshing,
                queueLength: this.failedQueue.length
            });
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            if (!base64Url) return null;
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    // ==========================================
    // 2. AUTHENTICATION & LOGIN
    // ==========================================
    async login(username, password) {
        this.log(`Initiating login for user: ${username}...`, 'info');
        
        const controller = new AbortController();
        this.activeAbortControllers.add(controller);

        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, expiresInMins: 30 }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Invalid credentials');
            }

            const data = await response.json();
            
            // Extract tokens and payload
            this.accessToken = data.accessToken || data.token;
            this.refreshToken = data.refreshToken;
            this.user = {
                id: data.id,
                username: data.username,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                image: data.image
            };

            // Calculate Expiry
            if (this.simulatedMode) {
                this.tokenExpiresAt = Date.now() + this.simulatedTokenLifespanMs;
            } else {
                const decoded = this.parseJwt(this.accessToken);
                if (decoded && decoded.exp) {
                    this.tokenExpiresAt = decoded.exp * 1000;
                } else {
                    // Fallback to 30 mins
                    this.tokenExpiresAt = Date.now() + 30 * 60 * 1000;
                }
            }

            // Persist locally
            this._persistState();

            this.log(`Login successful! Logged in as ${this.user.username}. Access token expires at ${new Date(this.tokenExpiresAt).toLocaleTimeString()}`, 'success');

            // Schedule preemptive silent refresh
            this._schedulePreemptiveRefresh();
            this._notifyStateChange();

            return { success: true, user: this.user };
        } catch (err) {
            if (err.name === 'AbortError') {
                this.log('Login request was aborted.', 'warn');
                throw new Error('Login cancelled');
            }
            this.log(`Login failed: ${err.message}`, 'error');
            throw err;
        } finally {
            this.activeAbortControllers.delete(controller);
        }
    }

    // ==========================================
    // 3. SILENT REFRESH & QUEUE LOGIC
    // ==========================================
    
    /**
     * Deduplicated Silent Token Refresh.
     * Guarantees only 1 refresh request is in-flight at any given time.
     */
    async refreshTokens() {
        // If refresh is already in-flight, do not trigger a duplicate call!
        if (this.isRefreshing) {
            this.log('Refresh already in-flight. Waiting for existing refresh promise...', 'warn');
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        if (!this.refreshToken) {
            this.log('No refresh token available in local state.', 'error');
            this.logout('No refresh token available');
            throw new Error('No refresh token available');
        }

        this.isRefreshing = true;
        this.log('Starting silent token refresh...', 'process');
        this._notifyStateChange();

        const controller = new AbortController();
        this.activeAbortControllers.add(controller);

        try {
            let data;

            if (this.simulatedMode) {
                // Artificial delay to demonstrate queueing during in-flight refresh
                await new Promise(res => setTimeout(res, 1200));
                data = {
                    accessToken: `simulated_access_token_${Date.now()}`,
                    refreshToken: `simulated_refresh_token_${Date.now()}`
                };
            } else {
                const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        refreshToken: this.refreshToken,
                        expiresInMins: 30
                    }),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}));
                    throw new Error(errBody.message || `Refresh failed with status ${response.status}`);
                }

                data = await response.json();
            }

            // Update tokens
            this.accessToken = data.accessToken || data.token;
            if (data.refreshToken) {
                this.refreshToken = data.refreshToken;
            }

            // Recalculate expiry
            if (this.simulatedMode) {
                this.tokenExpiresAt = Date.now() + this.simulatedTokenLifespanMs;
            } else {
                const decoded = this.parseJwt(this.accessToken);
                if (decoded && decoded.exp) {
                    this.tokenExpiresAt = decoded.exp * 1000;
                } else {
                    this.tokenExpiresAt = Date.now() + 30 * 60 * 1000;
                }
            }

            this._persistState();
            this.log(`Token refreshed successfully! New expiry: ${new Date(this.tokenExpiresAt).toLocaleTimeString()}`, 'success');

            // Schedule next pre-emptive refresh
            this._schedulePreemptiveRefresh();

            // Replay / Resolve all queued requests
            this.log(`Replaying ${this.failedQueue.length} queued request(s)...`, 'info');
            this._processQueue(null, this.accessToken);

            return this.accessToken;

        } catch (error) {
            if (error.name === 'AbortError') {
                this.log('Token refresh request aborted due to session logout.', 'warn');
                this._processQueue(new Error('Session closed during refresh'), null);
                throw error;
            }

            this.log(`Token refresh genuinely failed: ${error.message}. Invalidating session.`, 'error');
            this._processQueue(error, null);
            
            // Teardown session cleanly on genuine refresh failure
            this.logout(`Token refresh failed: ${error.message}`);
            throw error;

        } finally {
            this.isRefreshing = false;
            this.activeAbortControllers.delete(controller);
            this._notifyStateChange();
        }
    }

    /**
     * Process all queued subscriber requests.
     */
    _processQueue(error, token = null) {
        this.failedQueue.forEach(promise => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    /**
     * Schedules automatic token refresh before expiration.
     * Fires 15 seconds prior to exp timestamp (or immediately if close).
     */
    _schedulePreemptiveRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        if (!this.tokenExpiresAt) return;

        const timeUntilExpiry = this.tokenExpiresAt - Date.now();
        // Refresh 15 seconds before expiry, or immediately if less than 15s remaining
        const leadTime = 15 * 1000;
        const refreshDelay = Math.max(0, timeUntilExpiry - leadTime);

        this.log(`Pre-emptive refresh scheduled in ${(refreshDelay / 1000).toFixed(1)}s (at ${new Date(Date.now() + refreshDelay).toLocaleTimeString()})`, 'info');

        this.refreshTimer = setTimeout(() => {
            this.log('Pre-emptive refresh timer triggered!', 'process');
            this.refreshTokens().catch(err => {
                this.log(`Pre-emptive refresh attempt failed: ${err.message}`, 'error');
            });
        }, refreshDelay);
    }

    // ==========================================
    // 4. AUTHENTICATED FETCH WITH INTERCEPTOR & QUEUE
    // ==========================================
    
    /**
     * Wrapper for API calls that automatically attaches bearer token,
     * queues calls during refresh, and retries on 401.
     */
    async authenticatedFetch(url, options = {}) {
        // If logout occurred, reject immediately
        if (!this.accessToken && !this.refreshToken) {
            throw new Error('Not authenticated');
        }

        // Create AbortController tied to current session
        const controller = new AbortController();
        this.activeAbortControllers.add(controller);

        // Combine signal if user passed options.signal
        if (options.signal) {
            options.signal.addEventListener('abort', () => controller.abort());
        }
        const requestOptions = { ...options, signal: controller.signal };

        // Check if token is nearing expiration (under 5 seconds) before firing call
        const isNearExpiry = this.tokenExpiresAt && (this.tokenExpiresAt - Date.now() < 5000);

        if (isNearExpiry || this.isRefreshing) {
            this.log(`Token is near expiry/refreshing. Queueing request for: ${url}`, 'warn');
            
            // Queue request until refresh resolves
            try {
                const freshToken = await this.refreshTokens();
                requestOptions.headers = {
                    ...requestOptions.headers,
                    'Authorization': `Bearer ${freshToken}`
                };
            } catch (err) {
                this.activeAbortControllers.delete(controller);
                throw new Error(`Request failed because refresh failed: ${err.message}`);
            }
        } else {
            // Attach existing access token
            requestOptions.headers = {
                ...requestOptions.headers,
                'Authorization': `Bearer ${this.accessToken}`
            };
        }

        try {
            let response = await fetch(url, requestOptions);

            // Handle 401 Unauthorized (Reactive Token Refresh)
            if (response.status === 401) {
                this.log(`Received 401 Unauthorized from ${url}. Attempting reactive refresh...`, 'warn');
                
                try {
                    const newToken = await this.refreshTokens();
                    
                    // Replay request with new token
                    const retryOptions = {
                        ...requestOptions,
                        headers: {
                            ...requestOptions.headers,
                            'Authorization': `Bearer ${newToken}`
                        }
                    };
                    
                    this.log(`Replaying request to ${url} with new access token...`, 'process');
                    response = await fetch(url, retryOptions);
                } catch (refreshErr) {
                    this.log(`401 retry failed: ${refreshErr.message}`, 'error');
                    throw new Error('Session expired. Please log in again.');
                }
            }

            return response;

        } catch (error) {
            if (error.name === 'AbortError') {
                this.log(`Mid-flight request to ${url} was aborted by session teardown.`, 'warn');
            }
            throw error;
        } finally {
            this.activeAbortControllers.delete(controller);
        }
    }

    // ==========================================
    // 5. PROTECTED ROUTE GAURD LOGIC
    // ==========================================
    
    /**
     * Protected routes (/dashboard, /profile) redirect to /login ONLY after refresh has genuinely failed.
     * Never preemptively redirect if refresh token is present.
     */
    async checkProtectedAuth() {
        this.log('Checking protected route authorization...', 'info');

        // Case 1: No tokens at all -> redirect immediately
        if (!this.accessToken && !this.refreshToken) {
            this.log('No authentication tokens found. Access denied.', 'warn');
            return { authorized: false, reason: 'No tokens found' };
        }

        // Case 2: Access token exists & is valid (not expired)
        const now = Date.now();
        if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > now + 3000) {
            this.log('Access token is valid and active. Access granted.', 'success');
            return { authorized: true, user: this.user };
        }

        // Case 3: Token expired or missing, but refresh token exists -> DO NOT REDIRECT PREEMPTIVELY!
        this.log('Access token expired or nearing expiry. Attempting silent refresh before route access...', 'process');

        try {
            await this.refreshTokens();
            this.log('Silent refresh succeeded for route navigation. Access granted.', 'success');
            return { authorized: true, user: this.user };
        } catch (err) {
            // ONLY redirect now after refresh has genuinely failed
            this.log(`Silent refresh failed during route check: ${err.message}. Redirecting to login.`, 'error');
            return { authorized: false, reason: err.message };
        }
    }

    // ==========================================
    // 6. IMMEDIATE LOGOUT & SESSION TEARDOWN
    // ==========================================
    
    /**
     * Requirement 4: Logout must invalidate local state immediately, even if a request is mid-flight.
     */
    logout(reason = 'User initiated logout') {
        this.log(`TEARDOWN: Logging out immediately (${reason})...`, 'warn');

        // 1. Abort ALL active mid-flight HTTP requests instantly!
        if (this.activeAbortControllers.size > 0) {
            this.log(`Aborting ${this.activeAbortControllers.size} active mid-flight HTTP request(s)...`, 'process');
            for (const controller of this.activeAbortControllers) {
                controller.abort();
            }
            this.activeAbortControllers.clear();
        }

        // 2. Clear preemptive refresh timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        // 3. Reject any queued requests waiting for refresh
        if (this.failedQueue.length > 0) {
            this.log(`Rejecting ${this.failedQueue.length} queued request(s) due to teardown...`, 'warn');
            this._processQueue(new Error('Session terminated by logout'), null);
        }

        // 4. Wipe token & user state instantly
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
        this.tokenExpiresAt = 0;
        this.isRefreshing = false;

        // 5. Clear localStorage
        localStorage.removeItem('jwt_access_token');
        localStorage.removeItem('jwt_refresh_token');
        localStorage.removeItem('jwt_user_data');
        localStorage.removeItem('jwt_exp');

        this.log('Session teardown complete. All local state invalidated.', 'success');
        this._notifyStateChange();
    }

    _persistState() {
        if (this.accessToken) localStorage.setItem('jwt_access_token', this.accessToken);
        if (this.refreshToken) localStorage.setItem('jwt_refresh_token', this.refreshToken);
        if (this.user) localStorage.setItem('jwt_user_data', JSON.stringify(this.user));
        if (this.tokenExpiresAt) localStorage.setItem('jwt_exp', this.tokenExpiresAt.toString());
    }

    // Toggle simulation mode for fast 10-second token expiries
    setSimulatedMode(enabled) {
        this.simulatedMode = enabled;
        this.log(`Simulated Rapid-Expiry Mode: ${enabled ? 'ENABLED (10s expiry)' : 'DISABLED (Standard DummyJSON)'}`, 'info');
        if (this.accessToken) {
            this.tokenExpiresAt = Date.now() + (enabled ? this.simulatedTokenLifespanMs : 30 * 60 * 1000);
            this._schedulePreemptiveRefresh();
            this._notifyStateChange();
        }
    }
}
