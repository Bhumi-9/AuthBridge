import React, { useEffect, useRef } from 'react';
import './Particles.css';

const hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map((char) => char + char).join('');
    }
    const int = parseInt(hex, 16);
    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255
    };
};

export const Particles = ({
    particleColors = ["#5B8DEF", "#8FB996", "#E5E7EB"],
    particleCount = 120,
    particleSpread = 12,
    speed = 0.08,
    particleBaseSize = 45,
    moveParticlesOnHover = true,
    alphaParticles = true,
    disableRotation = false,
    pixelRatio = 1,
    className = ""
}) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const dpr = pixelRatio || window.devicePixelRatio || 1;
        let width = (canvas.width = canvas.parentElement.offsetWidth * dpr);
        let height = (canvas.height = canvas.parentElement.offsetHeight * dpr);

        const handleResize = () => {
            if (!canvas || !canvas.parentElement) return;
            width = canvas.width = canvas.parentElement.offsetWidth * dpr;
            height = canvas.height = canvas.parentElement.offsetHeight * dpr;
        };

        window.addEventListener('resize', handleResize);

        const handleMouseMove = (e) => {
            if (!moveParticlesOnHover || !canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.targetX = (e.clientX - rect.left) * dpr;
            mouseRef.current.targetY = (e.clientY - rect.top) * dpr;
        };

        const handleMouseLeave = () => {
            mouseRef.current.targetX = -1000;
            mouseRef.current.targetY = -1000;
        };

        const parent = canvas.parentElement;
        if (moveParticlesOnHover && parent) {
            parent.addEventListener('mousemove', handleMouseMove);
            parent.addEventListener('mouseleave', handleMouseLeave);
        }

        // Initialize particles
        const colorsRgb = particleColors.map(hexToRgb);

        const particles = Array.from({ length: particleCount }, () => {
            const rgb = colorsRgb[Math.floor(Math.random() * colorsRgb.length)] || { r: 37, g: 99, b: 235 };
            const size = (Math.random() * 0.4 + 0.3) * (particleBaseSize / 15) * dpr;
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * speed * dpr * 2,
                vy: (Math.random() - 0.5) * speed * dpr * 2,
                radius: size,
                baseRadius: size,
                color: rgb,
                alpha: alphaParticles ? Math.random() * 0.45 + 0.25 : 0.7,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: disableRotation ? 0 : (Math.random() - 0.5) * 0.02
            };
        });

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Smooth mouse interpolation
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.angle += p.rotationSpeed;

                // Mouse interaction distance
                if (moveParticlesOnHover && mouseRef.current.x > 0) {
                    const dx = mouseRef.current.x - p.x;
                    const dy = mouseRef.current.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 140 * dpr;

                    if (dist < maxDist) {
                        const force = (1 - dist / maxDist) * 1.5;
                        p.x -= (dx / dist) * force;
                        p.y -= (dy / dist) * force;
                    }
                }

                // Wrap boundaries
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.save();
                ctx.translate(p.x, p.y);
                if (!disableRotation) {
                    ctx.rotate(p.angle);
                }

                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
                ctx.fill();

                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (parent) {
                parent.removeEventListener('mousemove', handleMouseMove);
                parent.removeEventListener('mouseleave', handleMouseLeave);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleColors, particleCount, particleSpread, speed, particleBaseSize, moveParticlesOnHover, alphaParticles, disableRotation, pixelRatio]);

    return (
        <div className={`particles-container ${className}`}>
            <canvas ref={canvasRef} className="particles-canvas" />
        </div>
    );
};

export default Particles;
