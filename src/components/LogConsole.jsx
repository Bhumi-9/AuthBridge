import React, { useState, useEffect, useRef } from 'react';

/**
 * LogConsole Component
 * Renders a real-time scrolling developer terminal logging interceptor events, request queuing, and refresh logs.
 */
export const LogConsole = () => {
    const [logs, setLogs] = useState([
        { id: 1, time: new Date().toLocaleTimeString(), text: '[SYSTEM] Auth Engine Initialized. Interceptors active.', type: 'info' }
    ]);
    const consoleEndRef = useRef(null);

    useEffect(() => {
        // Intercept console.log/warn/error for demo visibility
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const addLog = (text, type = 'info') => {
            const time = new Date().toLocaleTimeString();
            setLogs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), time, text: String(text), type }]);
        };

        console.log = (...args) => {
            originalLog(...args);
            const msg = args.join(' ');
            if (msg.includes('[AXIOS') || msg.includes('[AUTH')) {
                addLog(msg, msg.includes('successful') ? 'success' : 'info');
            }
        };

        console.warn = (...args) => {
            originalWarn(...args);
            const msg = args.join(' ');
            if (msg.includes('[AXIOS') || msg.includes('[AUTH')) {
                addLog(msg, 'warn');
            }
        };

        console.error = (...args) => {
            originalError(...args);
            const msg = args.join(' ');
            if (msg.includes('[AXIOS') || msg.includes('[AUTH')) {
                addLog(msg, 'error');
            }
        };

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, []);

    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="log-console-card">
            <div className="console-header">
                <div className="console-title">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span>Live Network & Interceptor Console</span>
                </div>
                <button onClick={() => setLogs([])} className="btn-clear">Clear</button>
            </div>
            <div className="console-body">
                {logs.map(log => (
                    <div key={log.id} className={`log-entry ${log.type}`}>
                        <span className="log-time">[{log.time}]</span>
                        <span className="log-text">{log.text}</span>
                    </div>
                ))}
                <div ref={consoleEndRef} />
            </div>
        </div>
    );
};
