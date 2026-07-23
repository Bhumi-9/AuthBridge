import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parseJwt } from '../utils/tokenUtils';

export const Navbar = () => {
    const { isAuthenticated, user, accessToken, logout } = useAuth();
    const { currentTheme, setCurrentTheme, themes } = useTheme();
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

    // Countdown timer for access token expiration
    useEffect(() => {
        if (!accessToken) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const payload = parseJwt(accessToken);
            if (!payload || !payload.exp) {
                setTimeLeft(null);
                return;
            }

            const diffMs = (payload.exp * 1000) - Date.now();
            if (diffMs <= 0) {
                setTimeLeft('Expired');
            } else {
                const secs = Math.ceil(diffMs / 1000);
                const mins = Math.floor(secs / 60);
                const remSecs = secs % 60;
                setTimeLeft(mins > 0 ? `${mins}m ${remSecs}s` : `${secs}s`);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [accessToken]);

    const handleLogout = () => {
        logout('Header logout clicked');
        navigate('/login');
        setMobileMenuOpen(false);
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                {/* Brand Logo & Name */}
                <NavLink to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
                    <div className="brand-logo-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 7V12C3 17.52 7.02 22.5 12 24C16.98 22.5 21 17.5 21 12V7L12 2Z" fill="var(--accent-primary)" fillOpacity="0.15" stroke="var(--accent-primary)" strokeWidth="2" strokeLinejoin="round"/>
                            <path d="M9 12L11 14L15 10" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className="brand-title">
                        <strong className="brand-auth">Auth</strong>
                        <span className="brand-bridge">Bridge</span>
                    </span>
                </NavLink>

                {/* Desktop Navigation Links */}
                <nav className="nav-links-desktop">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
                        Home
                    </NavLink>
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                Dashboard
                            </NavLink>
                            <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                Profile
                            </NavLink>
                        </>
                    ) : (
                        <a href="#features" className="nav-item">
                            Features
                        </a>
                    )}
                </nav>

                {/* Right Side Actions: Theme Switcher, Token Timer, Auth Buttons */}
                <div className="nav-right-actions">
                    {/* Theme Switcher Dropdown */}
                    <div className="theme-switcher-wrapper">
                        <button 
                            className="theme-switcher-btn"
                            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                            title="Change UI Theme"
                            aria-expanded={themeDropdownOpen}
                            aria-label="Theme selector"
                        >
                            <span>{themes[currentTheme].icon}</span>
                            <span className="theme-name">{themes[currentTheme].name}</span>
                            <span className="dropdown-chevron">▾</span>
                        </button>

                        {themeDropdownOpen && (
                            <div className="theme-dropdown-menu" onMouseLeave={() => setThemeDropdownOpen(false)}>
                                {Object.values(themes).map((t) => (
                                    <button
                                        key={t.id}
                                        className={`theme-option ${currentTheme === t.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setCurrentTheme(t.id);
                                            setThemeDropdownOpen(false);
                                        }}
                                    >
                                        <span className="theme-option-icon">{t.icon}</span>
                                        <span className="theme-option-label">{t.name}</span>
                                        {currentTheme === t.id && <span className="theme-check">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Authenticated Token Timer */}
                    {isAuthenticated && accessToken && (
                        <div className="token-timer-badge" title="Access Token Lifetime Countdown">
                            <span className="timer-pulse"></span>
                            <span className="timer-text">Token: {timeLeft || 'Active'}</span>
                        </div>
                    )}

                    {/* User Profile Pill or Login Button */}
                    {isAuthenticated && user ? (
                        <div className="user-profile-pill">
                            <img 
                                src={user.image || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80'} 
                                alt={user.username} 
                                className="nav-avatar"
                            />
                            <span className="user-name">{user.username}</span>
                            <button onClick={handleLogout} className="btn-logout-small" title="Sign out of session">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <NavLink to="/login" className="btn-primary nav-login-btn">
                            Sign In
                        </NavLink>
                    )}

                    {/* Mobile Menu Toggle Button */}
                    <button 
                        className="mobile-hamburger-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="mobile-nav-drawer">
                    <NavLink to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                        Home
                    </NavLink>
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                Dashboard
                            </NavLink>
                            <NavLink to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                Profile
                            </NavLink>
                            <button onClick={handleLogout} className="mobile-logout-btn">
                                Sign Out ({user?.username})
                            </button>
                        </>
                    ) : (
                        <NavLink to="/login" className="mobile-nav-link primary" onClick={() => setMobileMenuOpen(false)}>
                            Sign In
                        </NavLink>
                    )}
                </div>
            )}
        </header>
    );
};
