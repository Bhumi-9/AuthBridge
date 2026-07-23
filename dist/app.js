import { JWTAuthManager } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const navLogin = document.getElementById('nav-login');
    const navDashboard = document.getElementById('nav-dashboard');
    const navProfile = document.getElementById('nav-profile');
    const navButtons = [navLogin, navDashboard, navProfile];

    const viewLogin = document.getElementById('view-login');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewProfile = document.getElementById('view-profile');
    const viewPanels = { login: viewLogin, dashboard: viewDashboard, profile: viewProfile };

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const btnSubmitLogin = document.getElementById('btn-submit-login');

    const userPill = document.getElementById('user-pill');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const btnLogout = document.getElementById('btn-logout');

    const simModeToggle = document.getElementById('sim-mode-toggle');

    // Monitor UI Elements
    const authStatusDot = document.getElementById('auth-status-dot');
    const authStatusText = document.getElementById('auth-status-text');
    const tokenExpiryTimer = document.getElementById('token-expiry-timer');
    const tokenTimerFill = document.getElementById('token-timer-fill');
    const refreshLockBadge = document.getElementById('refresh-lock-badge');
    const queueCountBadge = document.getElementById('queue-count');
    const tokenPayloadBox = document.getElementById('token-payload');

    // Dashboard UI
    const dashAvatar = document.getElementById('dash-avatar');
    const dashName = document.getElementById('dash-name');
    const dashEmail = document.getElementById('dash-email');
    const apiOutput = document.getElementById('api-output');
    const btnFetchMe = document.getElementById('btn-fetch-me');
    const profileDetails = document.getElementById('profile-details');

    // Stress Test Controls
    const btnTestParallel = document.getElementById('btn-test-parallel');
    const btnForceExpire = document.getElementById('btn-force-expire');
    const btnTest401 = document.getElementById('btn-test-401');
    const btnTestMidflightLogout = document.getElementById('btn-test-midflight-logout');

    // Console
    const consoleLogs = document.getElementById('console-logs');
    const btnClearLog = document.getElementById('btn-clear-log');

    let currentView = 'login';
    let countdownInterval = null;

    // Initialize Auth Manager with event callbacks
    const authManager = new JWTAuthManager({
        baseUrl: 'https://dummyjson.com',
        onLog: (logData) => appendConsoleLog(logData),
        onStateChange: (state) => updateMonitorUI(state)
    });

    // ==========================================
    // 1. CONSOLE LOGGING UI
    // ==========================================
    function appendConsoleLog({ timestamp, message, type }) {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        line.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">${escapeHtml(message)}</span>`;
        consoleLogs.appendChild(line);
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    if (btnClearLog) {
        btnClearLog.addEventListener('click', () => {
            consoleLogs.innerHTML = '<div class="log-line info">[SYSTEM] Console cleared.</div>';
        });
    }

    // ==========================================
    // 2. MONITOR & TIMER UI UPDATES
    // ==========================================
    function updateMonitorUI(state = {}) {
        const isAuth = authManager.accessToken;
        
        // Status Dot & Text
        authStatusDot.className = `status-dot ${isAuth ? 'active' : 'inactive'}`;
        authStatusText.textContent = isAuth ? `Authenticated (${authManager.user?.username || ''})` : 'Unauthenticated';

        // User Pill Header
        if (isAuth && authManager.user) {
            userPill.classList.remove('hidden');
            userAvatar.src = authManager.user.image || 'https://dummyjson.com/icon/emilys/128';
            userName.textContent = authManager.user.username;
        } else {
            userPill.classList.add('hidden');
        }

        // Refresh Lock Badge
        if (authManager.isRefreshing) {
            refreshLockBadge.className = 'status-badge badge-active';
            refreshLockBadge.textContent = 'Refreshing Token (In-flight)...';
        } else {
            refreshLockBadge.className = 'status-badge badge-idle';
            refreshLockBadge.textContent = 'Idle (No Refresh in-flight)';
        }

        // Queue Badge
        queueCountBadge.textContent = authManager.failedQueue.length;

        // Decoded Token Inspector
        if (authManager.accessToken) {
            const payload = authManager.parseJwt(authManager.accessToken);
            tokenPayloadBox.textContent = JSON.stringify(payload || { token: authManager.accessToken }, null, 2);
        } else {
            tokenPayloadBox.textContent = 'Log in to view decoded JWT';
        }

        // Start/Update Expiry Countdown Timer
        startTimerCountdown();
    }

    function startTimerCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);

        function tick() {
            if (!authManager.accessToken || !authManager.tokenExpiresAt) {
                tokenExpiryTimer.textContent = 'No Active Token';
                tokenTimerFill.style.width = '0%';
                return;
            }

            const remainingMs = authManager.tokenExpiresAt - Date.now();
            const totalLifespanMs = authManager.simulatedMode ? authManager.simulatedTokenLifespanMs : 30 * 60 * 1000;

            if (remainingMs <= 0) {
                tokenExpiryTimer.textContent = 'EXPIRED (Awaiting Refresh)';
                tokenExpiryTimer.className = 'metric-value expired';
                tokenTimerFill.style.width = '0%';
            } else {
                const seconds = (remainingMs / 1000).toFixed(1);
                tokenExpiryTimer.textContent = `${seconds}s remaining`;
                tokenExpiryTimer.className = 'metric-value';
                
                const percentage = Math.min(100, Math.max(0, (remainingMs / totalLifespanMs) * 100));
                tokenTimerFill.style.width = `${percentage}%`;

                if (percentage < 25) {
                    tokenTimerFill.style.backgroundColor = 'var(--danger-color)';
                } else if (percentage < 50) {
                    tokenTimerFill.style.backgroundColor = 'var(--warning-color)';
                } else {
                    tokenTimerFill.style.backgroundColor = 'var(--success-color)';
                }
            }
        }

        tick();
        countdownInterval = setInterval(tick, 200);
    }

    // ==========================================
    // 3. ROUTE GUARD & NAVIGATION
    // ==========================================
    async function navigateTo(targetRoute) {
        authManager.log(`Navigation requested to: /${targetRoute}`, 'info');

        if (targetRoute === 'dashboard' || targetRoute === 'profile') {
            // Protected Route Guard (Requirement 3: Redirect to /login ONLY after refresh fails)
            const authResult = await authManager.checkProtectedAuth();

            if (!authResult.authorized) {
                authManager.log(`Access denied for /${targetRoute}: ${authResult.reason}. Redirecting to /login.`, 'warn');
                switchView('login');
                alert(`Protected Route Access Denied: ${authResult.reason}`);
                return;
            }
        }

        switchView(targetRoute);
    }

    function switchView(viewName) {
        currentView = viewName;

        // Update nav buttons
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === viewName);
        });

        // Update view panels
        Object.keys(viewPanels).forEach(key => {
            viewPanels[key].classList.toggle('hidden', key !== viewName);
            viewPanels[key].classList.toggle('active', key === viewName);
        });

        if (viewName === 'dashboard') {
            populateDashboardUI();
        } else if (viewName === 'profile') {
            populateProfileUI();
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            navigateTo(target);
        });
    });

    // ==========================================
    // 4. LOGIN & LOGOUT HANDLERS
    // ==========================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        btnSubmitLogin.disabled = true;
        btnSubmitLogin.innerHTML = '<span>Signing In...</span>';

        try {
            await authManager.login(username, password);
            switchView('dashboard');
        } catch (err) {
            alert(`Login Failed: ${err.message}`);
        } finally {
            btnSubmitLogin.disabled = false;
            btnSubmitLogin.innerHTML = '<span>Sign In to Auth Engine</span>';
        }
    });

    btnLogout.addEventListener('click', () => {
        authManager.logout('User clicked Logout');
        switchView('login');
    });

    simModeToggle.addEventListener('change', (e) => {
        authManager.setSimulatedMode(e.target.checked);
    });

    // ==========================================
    // 5. VIEW POPULATION LOGIC
    // ==========================================
    function populateDashboardUI() {
        if (!authManager.user) return;
        dashAvatar.src = authManager.user.image || 'https://dummyjson.com/icon/emilys/128';
        dashName.textContent = `${authManager.user.firstName || ''} ${authManager.user.lastName || ''}`.trim() || authManager.user.username;
        dashEmail.textContent = authManager.user.email || 'emily.johnson@x.dummyjson.com';
    }

    async function populateProfileUI() {
        profileDetails.innerHTML = '<div class="loading-spinner">Fetching protected user profile...</div>';
        
        try {
            const res = await authManager.authenticatedFetch('https://dummyjson.com/auth/me');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const data = await res.json();
            profileDetails.innerHTML = `
                <div class="profile-item"><label>ID</label><span>${data.id}</span></div>
                <div class="profile-item"><label>Username</label><span>${data.username}</span></div>
                <div class="profile-item"><label>Email</label><span>${data.email}</span></div>
                <div class="profile-item"><label>First Name</label><span>${data.firstName}</span></div>
                <div class="profile-item"><label>Last Name</label><span>${data.lastName}</span></div>
                <div class="profile-item"><label>Gender</label><span>${data.gender}</span></div>
            `;
        } catch (err) {
            profileDetails.innerHTML = `<div class="error-box">Failed to load profile: ${err.message}</div>`;
        }
    }

    // ==========================================
    // 6. PROTECTED API FETCH & STRESS TESTBED
    // ==========================================
    btnFetchMe.addEventListener('click', async () => {
        apiOutput.textContent = 'Fetching protected endpoint /auth/me...';
        try {
            const res = await authManager.authenticatedFetch('https://dummyjson.com/auth/me');
            const data = await res.json();
            apiOutput.textContent = JSON.stringify(data, null, 2);
        } catch (err) {
            apiOutput.textContent = `Error: ${err.message}`;
        }
    });

    // Requirement 2 Test: Fire 5 parallel requests while token is expired to test queueing
    btnTestParallel.addEventListener('click', async () => {
        authManager.log('--- STRESS TEST: Firing 5 Parallel Requests Simultaneously ---', 'process');
        
        // Artificially expire token first to force refresh on all 5 requests
        authManager.tokenExpiresAt = Date.now() - 1000;
        authManager._notifyStateChange();

        const requests = [
            authManager.authenticatedFetch('https://dummyjson.com/auth/me').then(r => r.json()),
            authManager.authenticatedFetch('https://dummyjson.com/auth/me').then(r => r.json()),
            authManager.authenticatedFetch('https://dummyjson.com/auth/me').then(r => r.json()),
            authManager.authenticatedFetch('https://dummyjson.com/auth/me').then(r => r.json()),
            authManager.authenticatedFetch('https://dummyjson.com/auth/me').then(r => r.json())
        ];

        try {
            const results = await Promise.allSettled(requests);
            authManager.log(`All 5 parallel requests completed! Total successful: ${results.filter(r => r.status === 'fulfilled').length}/5`, 'success');
            apiOutput.textContent = `Parallel Stress Test Results:\n${JSON.stringify(results.map(r => r.value || r.reason?.message), null, 2)}`;
        } catch (err) {
            authManager.log(`Parallel stress test error: ${err.message}`, 'error');
        }
    });

    // Force Token Expiry Test
    btnForceExpire.addEventListener('click', () => {
        authManager.tokenExpiresAt = Date.now() - 1000;
        authManager.log('Access token expiration manually set to PAST timestamp (0s remaining). Next request will trigger refresh.', 'warn');
        authManager._notifyStateChange();
    });

    // Test 401 Interceptor Retry
    btnTest401.addEventListener('click', async () => {
        authManager.log('--- STRESS TEST: Simulating 401 Unauthorized Response ---', 'process');
        // Temporarily corrupt access token to guarantee 401 from server
        const originalToken = authManager.accessToken;
        authManager.accessToken = 'invalid_corrupted_token_12345';
        
        apiOutput.textContent = 'Sending request with corrupted token to trigger 401...';
        try {
            const res = await authManager.authenticatedFetch('https://dummyjson.com/auth/me');
            const data = await res.json();
            apiOutput.textContent = `401 Interceptor Auto-Recovery Success!\nData returned: ${JSON.stringify(data, null, 2)}`;
        } catch (err) {
            apiOutput.textContent = `401 Interceptor Test Result: ${err.message}`;
            authManager.accessToken = originalToken; // restore if failed
        }
    });

    // Requirement 4 Test: Mid-Flight Request + Immediate Logout
    btnTestMidflightLogout.addEventListener('click', async () => {
        authManager.log('--- STRESS TEST: Mid-Flight Request + Immediate Logout Teardown ---', 'process');
        
        // Dispatch slow request to dummyjson (or delay)
        authManager.log('Dispatching mid-flight request...', 'info');
        const slowRequest = authManager.authenticatedFetch('https://dummyjson.com/products?delay=3000');

        // Instantly trigger logout mid-flight!
        setTimeout(() => {
            authManager.log('Triggering immediate Logout while request is still in-flight...', 'warn');
            authManager.logout('Testbed mid-flight abort verification');
            switchView('login');
        }, 300);

        try {
            await slowRequest;
            authManager.log('ERROR: Request completed despite logout! (Abort failed)', 'error');
        } catch (err) {
            authManager.log(`SUCCESS: Mid-flight request threw error as expected: "${err.message}"`, 'success');
        }
    });

    // Initial State Sync
    updateMonitorUI();
    if (authManager.accessToken) {
        switchView('dashboard');
    }
});
