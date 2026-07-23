import React, { useEffect, useRef } from 'react';

export const BackgroundEffects = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Particle configuration (extremely minimal and subtle)
        const particleCount = Math.min(25, Math.floor(width / 50));
        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.8,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            opacity: Math.random() * 0.25 + 0.1
        }));

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(91, 141, 239, ${p.opacity})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="bg-effects-wrapper" aria-hidden="true">
            {/* Ambient Blurred Circles */}
            <div className="bg-blur-blob blob-1"></div>
            <div className="bg-blur-blob blob-2"></div>
            <div className="bg-blur-blob blob-3"></div>

            {/* Subtle Dotted Matrix Grid */}
            <div className="bg-dotted-grid"></div>

            {/* Floating Subtle Particle Canvas */}
            <canvas ref={canvasRef} className="bg-particles-canvas" />
        </div>
    );
};
