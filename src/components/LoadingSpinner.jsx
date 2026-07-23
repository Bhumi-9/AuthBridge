import React from 'react';

/**
 * LoadingSpinner Component
 * Renders a clean loading spinner styled for the light, minimal SaaS theme.
 */
export const LoadingSpinner = ({ message = 'Verifying Session...' }) => {
    return (
        <div style={styles.container}>
            <div style={styles.spinner}></div>
            <p style={styles.text}>{message}</p>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.25rem',
        color: '#64748B'
    },
    spinner: {
        width: '42px',
        height: '42px',
        border: '3px solid #E2E8F0',
        borderTop: '3px solid #5B8DEF',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    },
    text: {
        fontSize: '0.95rem',
        fontWeight: '500',
        color: '#334155'
    }
};

if (typeof document !== 'undefined' && !document.getElementById('spinner-keyframes')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'spinner-keyframes';
    styleEl.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(styleEl);
}
