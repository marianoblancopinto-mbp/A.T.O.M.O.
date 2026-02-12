import React, { useEffect } from 'react';
import { useGameContext } from '../../../context/GameContext';

export const MissionNotificationOverlay: React.FC = () => {
    const { state, dispatch } = useGameContext();
    const notification = state.notification;

    const onClose = () => {
        dispatch({ type: 'SET_NOTIFICATION', payload: null });
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // 5 seconds display
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!notification) return null;

    // Use current notification properties
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '20px',
                zIndex: 9000,
                pointerEvents: 'none',
                display: 'flex',
                justifyContent: 'center',
                animation: 'slideDown 0.5s ease-out'
            }}
        >
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: `2px solid ${notification.color}`,
                padding: '20px 40px',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: `0 0 30px ${notification.color}66`,
                maxWidth: '600px',
                pointerEvents: 'auto'
            }}>
                <div style={{ color: notification.color, fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '5px' }}>
                    {notification.playerName ? `TRANSMISIÓN DE: ${notification.playerName.toUpperCase()}` : 'TRANSMISIÓN PRIORITARIA'}
                </div>
                <h3 style={{ margin: '5px 0 10px 0', color: '#fff', fontSize: '1.5rem', textTransform: 'uppercase' }}>
                    {notification.title}
                </h3>
                <p style={{ color: '#ccc', margin: 0, fontSize: '1.1rem' }}>
                    {notification.message}
                </p>
            </div>
        </div>
    );
};
