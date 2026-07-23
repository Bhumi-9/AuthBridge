import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { parseJwt } from '../utils/tokenUtils';

export const ProfilePage = () => {
    const { user, accessToken, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tokenMeta, setTokenMeta] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (accessToken) {
                const parsed = parseJwt(accessToken);
                setTokenMeta(parsed);
            }
            setLoading(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [accessToken]);

    if (loading) {
        return (
            <div className="page-container profile-page">
                <div className="profile-card-lg skeleton-card">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-line lg"></div>
                    <div className="skeleton-line md"></div>
                    <div className="skeleton-grid">
                        <div className="skeleton-box"></div>
                        <div className="skeleton-box"></div>
                        <div className="skeleton-box"></div>
                        <div className="skeleton-box"></div>
                    </div>
                </div>
            </div>
        );
    }

    const expTime = tokenMeta?.exp 
        ? new Date(tokenMeta.exp * 1000).toLocaleTimeString() 
        : 'Active Session';

    return (
        <div className="page-container profile-page">
            <div className="profile-card-lg">
                <div className="profile-header-banner">
                    <img 
                        src={user?.image || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80'} 
                        alt={user?.username || 'Sanchya'} 
                        className="profile-avatar-lg"
                    />
                    <div className="profile-header-text">
                        <h2>{user?.firstName || 'Sanchya'}</h2>
                        <span className="profile-role-badge">Verified AuthBridge Account</span>
                    </div>
                </div>

                <div className="profile-details-grid">
                    <div className="detail-item">
                        <label>Username</label>
                        <span>@{user?.username || 'sanchya'}</span>
                    </div>

                    <div className="detail-item">
                        <label>Email Address</label>
                        <span>{user?.email || 'sachyaauth1@gmail.com'}</span>
                    </div>

                    <div className="detail-item">
                        <label>Gender / Identity</label>
                        <span>{user?.gender || 'Male'}</span>
                    </div>

                    <div className="detail-item">
                        <label>Account Status</label>
                        <span className="badge-active">✓ Active & Secured</span>
                    </div>

                    <div className="detail-item">
                        <label>Token Expiration Target</label>
                        <span>{expTime}</span>
                    </div>

                    <div className="detail-item">
                        <label>Authentication Standard</label>
                        <span>JWT (RFC 7519) + Silent Refresh</span>
                    </div>
                </div>

                <div className="profile-actions-footer">
                    <button onClick={() => logout('User logged out from profile page')} className="btn-danger">
                        Sign Out of AuthBridge
                    </button>
                </div>
            </div>
        </div>
    );
};
