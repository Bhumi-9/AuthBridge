import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
    light: {
        id: 'light',
        name: 'Light',
        icon: '☀',
        vars: {
            '--bg-app': '#FAF9F6',
            '--bg-card': '#FFFFFF',
            '--accent-primary': '#5B8DEF',
            '--accent-primary-hover': '#497BE4',
            '--accent-primary-light': '#EFF5FF',
            '--accent-secondary': '#8FB996',
            '--accent-secondary-light': '#F2F8F3',
            '--text-primary': '#1F2937',
            '--text-secondary': '#6B7280',
            '--border-color': '#E5E7EB',
            '--shadow-sm': '0 1px 3px rgba(31, 41, 55, 0.04)',
            '--shadow-card': '0 10px 25px -10px rgba(31, 41, 55, 0.06), 0 2px 6px -2px rgba(31, 41, 55, 0.03)',
            '--shadow-hover': '0 20px 40px -15px rgba(91, 141, 239, 0.18), 0 4px 12px -2px rgba(31, 41, 55, 0.04)'
        }
    },
    warm: {
        id: 'warm',
        name: 'Warm',
        icon: '🌅',
        vars: {
            '--bg-app': '#FDFBF7',
            '--bg-card': '#FFFFFF',
            '--accent-primary': '#E07A5F',
            '--accent-primary-hover': '#D06548',
            '--accent-primary-light': '#FDF3F0',
            '--accent-secondary': '#F2CC8F',
            '--accent-secondary-light': '#FEFAF2',
            '--text-primary': '#2B2D42',
            '--text-secondary': '#6C757D',
            '--border-color': '#EBE5DF',
            '--shadow-sm': '0 1px 3px rgba(43, 45, 66, 0.04)',
            '--shadow-card': '0 10px 25px -10px rgba(224, 122, 95, 0.08), 0 2px 6px -2px rgba(43, 45, 66, 0.03)',
            '--shadow-hover': '0 20px 40px -15px rgba(224, 122, 95, 0.2), 0 4px 12px -2px rgba(43, 45, 66, 0.04)'
        }
    },
    sage: {
        id: 'sage',
        name: 'Sage',
        icon: '🌿',
        vars: {
            '--bg-app': '#F7F9F7',
            '--bg-card': '#FFFFFF',
            '--accent-primary': '#52796F',
            '--accent-primary-hover': '#354F52',
            '--accent-primary-light': '#EEF4F1',
            '--accent-secondary': '#84A98C',
            '--accent-secondary-light': '#F2F7F3',
            '--text-primary': '#1F2937',
            '--text-secondary': '#64748B',
            '--border-color': '#E1E8E3',
            '--shadow-sm': '0 1px 3px rgba(31, 41, 55, 0.04)',
            '--shadow-card': '0 10px 25px -10px rgba(82, 121, 111, 0.08), 0 2px 6px -2px rgba(31, 41, 55, 0.03)',
            '--shadow-hover': '0 20px 40px -15px rgba(82, 121, 111, 0.2), 0 4px 12px -2px rgba(31, 41, 55, 0.04)'
        }
    },
    ocean: {
        id: 'ocean',
        name: 'Ocean',
        icon: '🌊',
        vars: {
            '--bg-app': '#F4F8FA',
            '--bg-card': '#FFFFFF',
            '--accent-primary': '#3A86C8',
            '--accent-primary-hover': '#2B6EB3',
            '--accent-primary-light': '#EDF5FD',
            '--accent-secondary': '#57CC99',
            '--accent-secondary-light': '#F0FAF5',
            '--text-primary': '#0F172A',
            '--text-secondary': '#64748B',
            '--border-color': '#E2EAF0',
            '--shadow-sm': '0 1px 3px rgba(15, 23, 42, 0.04)',
            '--shadow-card': '0 10px 25px -10px rgba(58, 134, 200, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.03)',
            '--shadow-hover': '0 20px 40px -15px rgba(58, 134, 200, 0.2), 0 4px 12px -2px rgba(15, 23, 42, 0.04)'
        }
    }
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('authbridge_theme') || 'light';
    });

    useEffect(() => {
        const themeConfig = THEMES[currentTheme] || THEMES.light;
        const root = document.documentElement;
        
        Object.entries(themeConfig.vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        localStorage.setItem('authbridge_theme', currentTheme);
    }, [currentTheme]);

    return (
        <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
