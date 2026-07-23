import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BackgroundEffects } from '../components/BackgroundEffects';

export const LoginPage = () => {
    const { login, isLoading } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    // Form state initialized with demo user Sanchya
    const [username, setUsername] = useState('sanchya');
    const [password, setPassword] = useState('sanchauth');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [expiresInMins, setExpiresInMins] = useState(60);
    const [errorMsg, setErrorMsg] = useState('');

    const from = location.state?.from?.pathname || '/dashboard';

    const handleAutofill = () => {
        setUsername('sanchya');
        setPassword('sanchauth');
        addToast('Demo credentials for Sanchya autofilled!', 'info');
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        addToast('Password reset link sent to sachyaauth1@gmail.com', 'info');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!username.trim() || !password.trim()) {
            const err = 'Please enter both username and password.';
            setErrorMsg(err);
            addToast(err, 'error');
            return;
        }

        try {
            const user = await login(username.trim(), password.trim(), Number(expiresInMins));
            addToast(`Welcome back, ${user.firstName || user.username || 'Sanchya'}! Session created.`, 'success');
            navigate(from, { replace: true });
        } catch (err) {
            console.error('[LOGIN ERROR]', err);
            const message = err.message || 'Invalid username or password';
            setErrorMsg(message);
            addToast(`Login failed: ${message}`, 'error');
        }
    };

    return (
        <div className="login-page-wrapper">
            <BackgroundEffects />

            <div className="login-card-container">
                {/* Brand Logo Header */}
                <div className="login-brand-header">
                    <div className="login-logo-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 7V12C3 17.52 7.02 22.5 12 24C16.98 22.5 21 17.5 21 12V7L12 2Z" fill="var(--accent-primary)" fillOpacity="0.15" stroke="var(--accent-primary)" strokeWidth="2" strokeLinejoin="round"/>
                            <path d="M9 12L11 14L15 10" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="login-brand-name">
                        <strong className="brand-auth">Auth</strong>
                        <span className="brand-bridge">Bridge</span>
                    </h1>
                </div>

                {/* Main Login Card */}
                <div className="login-card">
                    <div className="login-card-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to access your AuthBridge session workspace</p>
                    </div>

                    {errorMsg && (
                        <div className="login-error-alert" role="alert">
                            <span className="alert-icon">⚠</span>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        {/* Username Input */}
                        <div className="form-group">
                            <label htmlFor="username-input">Username</label>
                            <input
                                id="username-input"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. sanchya"
                                required
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input with Visibility Toggle */}
                        <div className="form-group">
                            <div className="label-with-action">
                                <label htmlFor="password-input">Password</label>
                                <a href="#forgot" onClick={handleForgotPassword} className="forgot-link">
                                    Forgot Password?
                                </a>
                            </div>
                            <div className="password-input-wrapper">
                                <input
                                    id="password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '👁' : '👁‍🗨'}
                                </button>
                            </div>
                        </div>

                        {/* Session Duration Selector */}
                        <div className="form-group">
                            <label htmlFor="session-duration-select">Access Token Lifetime (Demo)</label>
                            <select
                                id="session-duration-select"
                                value={expiresInMins}
                                onChange={(e) => setExpiresInMins(Number(e.target.value))}
                                disabled={isLoading}
                                className="session-select"
                            >
                                <option value={1}>⚡ 1 minute (Fast Silent Refresh Demo)</option>
                                <option value={5}>⏱ 5 minutes</option>
                                <option value={30}>⏳ 30 minutes</option>
                                <option value={60}>🔒 60 minutes (Default)</option>
                            </select>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="form-checkbox-row">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span className="checkmark"></span>
                                <span className="checkbox-label">Remember Me on this device</span>
                            </label>
                        </div>

                        {/* Submit Button with Loading Spinner State */}
                        <button
                            type="submit"
                            className="btn-primary btn-full login-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="btn-loading-state">
                                    <span className="spinner-dot"></span>
                                    Authenticating...
                                </span>
                            ) : (
                                <span>Sign In →</span>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials Box */}
                    <div className="demo-credentials-card">
                        <div className="demo-credentials-header">
                            <span className="demo-icon">🔑</span>
                            <span className="demo-title">Demo Credentials</span>
                        </div>
                        <div className="demo-credentials-body">
                            <div className="credential-pair">
                                <span className="cred-label">Username:</span>
                                <code>sanchya</code>
                            </div>
                            <div className="credential-pair">
                                <span className="cred-label">Password:</span>
                                <code>sanchauth</code>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAutofill}
                            className="autofill-btn"
                            disabled={isLoading}
                        >
                            ⚡ Click to Autofill Credentials
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
