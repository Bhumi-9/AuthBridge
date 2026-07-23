import React, { useEffect, useState, useRef } from 'react';

const statsData = [
    { target: 100, suffix: '%', label: 'Session Continuity', description: 'Zero session drops during token rotation' },
    { target: 1, suffix: '', label: 'Refresh Request at a Time', description: 'Strict mutex locks single refresh call' },
    { target: 0, suffix: '', label: 'Duplicate Refresh Calls', description: 'Queued requests reuse active refresh response' }
];

export const StatsCounter = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [counts, setCounts] = useState(statsData.map(() => 0));
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const duration = 1200; // ms
        const steps = 40;
        const stepTime = duration / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out

            setCounts(
                statsData.map((stat) => Math.round(stat.target * easeProgress))
            );

            if (step >= steps) {
                clearInterval(timer);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [isVisible]);

    return (
        <section ref={sectionRef} className="stats-section" aria-label="Authentication Performance Metrics">
            <div className="stats-container">
                {statsData.map((stat, idx) => (
                    <div className="stat-card" key={stat.label}>
                        <div className="stat-number">
                            <span>{counts[idx]}</span>
                            <span className="stat-suffix">{stat.suffix}</span>
                        </div>
                        <h4 className="stat-label">{stat.label}</h4>
                        <p className="stat-description">{stat.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
