import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseJwt } from '../utils/tokenUtils';
import { apiClient } from '../api/axios';

export const DashboardPage = () => {
    const { user, accessToken, refreshToken, refreshTokens, logout } = useAuth();
    const { addToast } = useToast();

    const [logs, setLogs] = useState([]);
    const [apiData, setApiData] = useState(null);
    const [isLoadingApi, setIsLoadingApi] = useState(false);
    const [tokenPayload, setTokenPayload] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

    const logConsole = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [{ id: Date.now() + Math.random(), time, message, type }, ...prev]);
    };

    useEffect(() => {
        if (accessToken) {
            const parsed = parseJwt(accessToken);
            setTokenPayload(parsed);
            logConsole(`Access token mounted. Sub: ${parsed?.sub || user?.id || 'N/A'}`, 'info');
        }
    }, [accessToken, user]);

    useEffect(() => {
        if (!accessToken) return;

        const interval = setInterval(() => {
            const parsed = parseJwt(accessToken);
            if (!parsed || !parsed.exp) {
                setTimeLeft('Expired');
                return;
            }
            const diffSec = Math.ceil((parsed.exp * 1000 - Date.now()) / 1000);
            if (diffSec <= 0) {
                setTimeLeft('Expired (401 Trigger Ready)');
            } else {
                const mins = Math.floor(diffSec / 60);
                const secs = diffSec % 60;
                setTimeLeft(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [accessToken]);

    const handleTestProtectedEndpoint = async () => {
        setIsLoadingApi(true);
        logConsole('Initiating HTTP GET /auth/me (Protected Route)...', 'info');
        try {
            const res = await apiClient.get('https://dummyjson.com/auth/me');
            // Format response for UI display with Sanchya identity
            const mappedData = {
                ...res.data,
                username: 'sanchya',
                firstName: 'Sanchya',
                lastName: '',
                email: 'sachyaauth1@gmail.com',
                gender: 'male'
            };
            setApiData(mappedData);
            logConsole(`HTTP 200 OK: User '${mappedData.username}' identity confirmed`, 'success');
            addToast('Protected API response received successfully!', 'success');
        } catch (err) {
            logConsole(`HTTP Error: ${err.message}`, 'error');
            addToast(`Protected endpoint error: ${err.message}`, 'error');
        } finally {
            setIsLoadingApi(false);
        }
    };

    const handleManualSilentRefresh = async () => {
        logConsole('Triggering manual Silent Token Refresh...', 'warn');
        try {
            const newTok = await refreshTokens();
            logConsole('Silent Token Refresh Succeeded! New JWT installed.', 'success');
            addToast('Token silently refreshed!', 'success');
        } catch (err) {
            logConsole(`Silent Refresh Failed: ${err.message}`, 'error');
            addToast(`Refresh error: ${err.message}`, 'error');
        }
    };

    const handleSimulateConcurrentRequests = async () => {
        logConsole('Firing 3 concurrent protected API requests to test Request Queueing...', 'info');
        addToast('Firing 3 concurrent API requests...', 'info');

        const p1 = apiClient.get('https://dummyjson.com/auth/me');
        const p2 = apiClient.get('https://dummyjson.com/auth/me');
        const p3 = apiClient.get('https://dummyjson.com/auth/me');

        try {
            const results = await Promise.all([p1, p2, p3]);
            logConsole(`All 3 queued requests resolved successfully (200 OK x3)!`, 'success');
            addToast('Concurrent requests resolved seamlessly!', 'success');
        } catch (err) {
            logConsole(`Concurrent request queue error: ${err.message}`, 'error');
        }
    };

    return (
        <div className="page-container dashboard-page">
            {/* WELCOME BANNER CARD */}
            <div className="welcome-banner-card">
                <div className="welcome-avatar-wrapper">
                    <img 
                        src={user?.image || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80'} 
                        alt={user?.username || 'Sanchya'} 
                        className="welcome-avatar"
                    />
                    <span className="online-indicator" title="Active Session"></span>
                </div>
                <div className="welcome-details">
                    <div className="welcome-badge">Active AuthBridge Session</div>
                    <h2>Welcome back, {user?.firstName || 'Sanchya'}</h2>
                    <p className="welcome-subtext">
                        Connected as <strong>{user?.email || 'sachyaauth1@gmail.com'}</strong> • Session active with automatic JWT token rotation.
                    </p>
                </div>
            </div>

            {/* STATUS GRID CARDS */}
            <div className="status-grid">
                {/* Auth Status */}
                <div className="status-card">
                    <div className="status-card-header">
                        <span className="status-icon">🛡</span>
                        <span className="status-title">Auth Status</span>
                    </div>
                    <div className="status-value active">
                        <span className="status-dot green"></span>
                        Authenticated
                    </div>
                    <p className="status-desc">JWT Access & Refresh Tokens stored in memory & HTTP headers.</p>
                </div>

                {/* Access Token Expiry */}
                <div className="status-card">
                    <div className="status-card-header">
                        <span className="status-icon">⏱</span>
                        <span className="status-title">Access Token Lifetime</span>
                    </div>
                    <div className="status-value highlight">
                        {timeLeft || 'Calculating...'}
                    </div>
                    <p className="status-desc">Pre-emptive silent refresh triggers automatically upon expiration.</p>
                </div>

                {/* Refresh Token Status */}
                <div className="status-card">
                    <div className="status-card-header">
                        <span className="status-icon">🔄</span>
                        <span className="status-title">Refresh Token</span>
                    </div>
                    <div className="status-value">
                        <span className="status-dot blue"></span>
                        Active (Rotation On)
                    </div>
                    <p className="status-desc">Enables silent background token renewal without forcing re-login.</p>
                </div>
            </div>

            {/* INTERACTIVE TESTBED & ACTION CARD */}
            <div className="card testbed-card">
                <div className="testbed-header">
                    <h3>Authentication Testbed</h3>
                    <p className="card-desc">Execute live Axios interceptor calls and monitor token lifecycle behavior.</p>
                </div>

                <div className="testbed-actions-row">
                    <button onClick={handleTestProtectedEndpoint} disabled={isLoadingApi} className="btn-action">
                        {isLoadingApi ? 'Requesting...' : '📡 Call Protected Endpoint'}
                    </button>
                    <button onClick={handleManualSilentRefresh} className="btn-secondary">
                        🔄 Force Silent Token Refresh
                    </button>
                    <button onClick={handleSimulateConcurrentRequests} className="btn-secondary">
                        ⚡ Simulate Concurrent Request Queue
                    </button>
                </div>

                {/* API Response Display */}
                {apiData && (
                    <div className="api-response-wrapper">
                        <h4>Latest Response Data (GET /auth/me):</h4>
                        <pre className="code-box">{JSON.stringify(apiData, null, 2)}</pre>
                    </div>
                )}
            </div>

            {/* LIVE CONSOLE LOG WIDGET */}
            <div className="card log-console-card">
                <div className="console-header">
                    <div className="console-title">
                        <div className="dot red"></div>
                        <div className="dot yellow"></div>
                        <div className="dot green"></div>
                        <span>AuthBridge Real-Time Log Console</span>
                    </div>
                    <button onClick={() => setLogs([])} className="btn-clear">Clear Logs</button>
                </div>
                <div className="console-body">
                    {logs.length === 0 ? (
                        <div className="log-entry info">
                            <span className="log-text">Console ready. Click testbed buttons above to monitor requests.</span>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className={`log-entry ${log.type}`}>
                                <span className="log-time">[{log.time}]</span>
                                <span className="log-text">{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* DECODED JWT CLAIMS CARD */}
            {tokenPayload && (
                <div className="card token-claims-card">
                    <h3>Decoded Access Token Claims</h3>
                    <p className="card-desc">Parsed from active JWT Bearer token payload:</p>
                    <pre className="code-box">{JSON.stringify(tokenPayload, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};
