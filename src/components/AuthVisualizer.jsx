import React, { useState } from 'react';

export const AuthVisualizer = () => {
    const [logs, setLogs] = useState([
        { id: 1, type: 'info', text: 'System ready. Click below to simulate concurrent API requests.' }
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [queueCount, setQueueCount] = useState(0);
    const [tokenStatus, setTokenStatus] = useState('Valid (exp in 15s)');

    const logEvent = (text, type = 'info') => {
        setLogs((prev) => [
            { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString().split(' ')[0], text, type },
            ...prev.slice(0, 7)
        ]);
    };

    const handleSimulateExpiredToken = async () => {
        if (isRefreshing) return;
        setTokenStatus('Expired (401 Unauthorized)');
        logEvent('Access token expired. Simulating 3 concurrent protected API calls...', 'warn');
        
        setIsRefreshing(true);
        setQueueCount(3);

        logEvent('HTTP GET /api/user-profile ➔ 401 (Enqueued #1)', 'error');
        logEvent('HTTP GET /api/dashboard ➔ 401 (Enqueued #2)', 'error');
        logEvent('HTTP GET /api/notifications ➔ 401 (Enqueued #3)', 'error');

        setTimeout(() => {
            logEvent('Executing Silent Refresh: POST /auth/refresh...', 'info');
        }, 600);

        setTimeout(() => {
            logEvent('Silent Refresh Success! Received new access token.', 'success');
            setTokenStatus('Refreshed (Valid)');
            setQueueCount(0);
            setIsRefreshing(false);

            logEvent('Flushing queue: Resending 3 requests with new token ➔ 200 OK!', 'success');
        }, 1800);
    };

    return (
        <div className="auth-visualizer-card">
            <div className="visualizer-header">
                <div className="header-title">
                    <span className="live-indicator"></span>
                    <h3>Interactive Silent Refresh & Queue Visualizer</h3>
                </div>
                <div className="token-badge">
                    Status: <strong>{tokenStatus}</strong>
                </div>
            </div>

            <div className="visualizer-body">
                <div className="visualizer-controls">
                    <button 
                        onClick={handleSimulateExpiredToken} 
                        disabled={isRefreshing}
                        className="btn-primary simulate-btn"
                    >
                        {isRefreshing ? 'Refreshing Token & Processing Queue...' : '⚡ Trigger 401 Token Refresh Scenario'}
                    </button>
                    <div className="queue-metric">
                        <span>Request Queue:</span>
                        <span className={`queue-badge ${queueCount > 0 ? 'active' : ''}`}>{queueCount} Pending</span>
                    </div>
                </div>

                <div className="visualizer-console">
                    <div className="console-top">
                        <div className="window-dots">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <span className="console-label">authbridge-interceptor.js</span>
                    </div>
                    <div className="console-logs">
                        {logs.map((log) => (
                            <div key={log.id} className={`log-line log-${log.type}`}>
                                {log.time && <span className="log-timestamp">[{log.time}]</span>}
                                <span className="log-text">{log.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
