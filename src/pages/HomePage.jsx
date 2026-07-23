import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Particles from '../components/Particles';
import { BackgroundEffects } from '../components/BackgroundEffects';
import { StatsCounter } from '../components/StatsCounter';
import { AuthVisualizer } from '../components/AuthVisualizer';

const features = [
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="3" stroke="var(--accent-primary)" strokeWidth="2"/>
                <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="var(--accent-primary)"/>
            </svg>
        ),
        title: '🔐 Secure Login',
        description: 'JWT Authentication using access and refresh tokens stored safely with granular expiration handling.'
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5V9H8" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 13A8.1 8.1 0 0 0 19.5 15M20 19V15H16" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
        title: '🔄 Silent Token Refresh',
        description: 'Automatically renew expired sessions in the background without interrupting active user workflows or forcing re-logins.'
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L11 14L15 10" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
        title: '🛡 Protected Routes',
        description: 'Only authenticated users can access private routes, while unauthenticated requests are gracefully redirected.'
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
        title: '⚡ Request Queue',
        description: 'Prevent duplicate refresh requests using strict response promise locks that hold failed requests until new tokens arrive.'
    }
];

const themeParticleColors = {
    light: ["#2563EB", "#3B82F6", "#1E40AF", "#10B981", "#475569"],
    warm: ["#E07A5F", "#D97706", "#B45309", "#C2410C", "#334155"],
    ocean: ["#1D4ED8", "#0284C7", "#0369A1", "#0F766E", "#1E293B"],
    sage: ["#2D6A4F", "#52796F", "#1B4332", "#3A5A40", "#334155"]
};

export const HomePage = () => {
    const { currentTheme } = useTheme();
    const activeParticleColors = themeParticleColors[currentTheme] || themeParticleColors.light;

    return (
        <div className="landing-page">
            <BackgroundEffects />

            {/* HERO SECTION WITH REACTBITS PARTICLES */}
            <section className="hero-section" aria-labelledby="hero-title">
                {/* Theme-Aware ReactBits Particles Background */}
                <div className="hero-background">
                    <Particles
                        particleColors={activeParticleColors}
                        particleCount={95}
                        particleSpread={10}
                        speed={0.09}
                        particleBaseSize={32}
                        moveParticlesOnHover={true}
                        alphaParticles={true}
                        disableRotation={false}
                        pixelRatio={1}
                    />
                </div>

                <div className="hero-content-wrapper">
                    <div className="hero-badge hero-animate-1">
                        <span className="hero-badge-dot"></span>
                        <span>Production-Ready JWT Authentication Suite</span>
                    </div>

                    <div className="hero-logo-wrapper hero-animate-2">
                        <div className="floating-logo">
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 7V12C3 17.52 7.02 22.5 12 24C16.98 22.5 21 17.5 21 12V7L12 2Z" fill="var(--accent-primary)" fillOpacity="0.1" stroke="var(--accent-primary)" strokeWidth="2" strokeLinejoin="round"/>
                                <path d="M9 12L11 14L15 10" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>

                    <h1 id="hero-title" className="hero-title hero-animate-3">
                        <span className="title-auth">Auth</span>
                        <span className="title-bridge">Bridge</span>
                    </h1>

                    <p className="hero-tagline hero-animate-4">
                        Secure Access. Seamless Sessions.
                    </p>

                    <p className="hero-description hero-animate-5">
                        Experience secure JWT authentication with silent token refresh, protected routes,
                        request queueing, and uninterrupted user sessions designed for modern web applications.
                    </p>

                    <div className="hero-actions hero-animate-6">
                        <Link to="/login" className="btn-primary hero-btn-primary">
                            Get Started <span className="btn-arrow" aria-hidden="true">→</span>
                        </Link>
                        <a href="#features" className="btn-secondary hero-btn-secondary">
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* INTERACTIVE DEMO VISUALIZER */}
            <section className="section-container" aria-label="Interactive Architecture Visualizer">
                <AuthVisualizer />
            </section>

            {/* FEATURE SECTION */}
            <section id="features" className="section-container features-section" aria-labelledby="features-title">
                <div className="section-header">
                    <span className="section-kicker">Architectural Highlights</span>
                    <h2 id="features-title">Everything Your Session Needs</h2>
                    <p className="section-subtitle">
                        Built from the ground up to prevent authentication race conditions, expired token dropouts, and redundant HTTP requests.
                    </p>
                </div>

                <div className="feature-cards-grid">
                    {features.map((feature, idx) => (
                        <div key={feature.title} className="feature-card" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="feature-card-icon" aria-hidden="true">
                                {feature.icon}
                            </div>
                            <h3 className="feature-card-title">{feature.title}</h3>
                            <p className="feature-card-desc">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* STATISTICS SECTION */}
            <StatsCounter />

            {/* CALL TO ACTION */}
            <section className="section-container cta-section" aria-labelledby="cta-title">
                <div className="cta-glass-card">
                    <div className="cta-content">
                        <span className="section-kicker">Interactive Playground</span>
                        <h2 id="cta-title">Ready to Explore AuthBridge?</h2>
                        <p>
                            Experience modern authentication built using React, Axios, JWT, Context API, and React Router.
                        </p>
                        <Link to="/login" className="btn-primary cta-btn">
                            Sign In Now <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <strong>AuthBridge</strong> © 2026
                    </div>
                    <div className="footer-tech-stack">
                        Built using React • Vite • Axios • React Router • Context API
                    </div>
                </div>
            </footer>
        </div>
    );
};
