import React, { useEffect } from 'react';
import { useGameContext } from '../../../context/GameContext';

export const MissionNotificationOverlay: React.FC = () => {
    const { state, dismissNotification, dismissedNotificationIds } = useGameContext();
    // El servidor ya decidió quién ve cada notificación (las privadas sólo le
    // llegan a su destinatario). Acá sólo se muestra la última no descartada.
    const latest = state.notification;
    const notification = latest && !dismissedNotificationIds.has(latest.id) ? latest : null;

    const onClose = () => {
        if (notification) dismissNotification(notification.id);
    };

    useEffect(() => {
        if (notification) {
            const displayTime = notification.type === 'NEUTRALIZED' ? 10000 : 5000;
            const timer = setTimeout(onClose, displayTime);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notification?.id]);

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

                <button
                    onClick={onClose}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = notification.color;
                        e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = notification.color;
                    }}
                    style={{
                        marginTop: '20px',
                        padding: '8px 25px',
                        backgroundColor: 'transparent',
                        color: notification.color,
                        border: `1px solid ${notification.color}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        transition: 'all 0.2s ease',
                        fontFamily: 'monospace'
                    }}
                >
                    ENTENDIDO
                </button>
            </div>
        </div>
    );
};
