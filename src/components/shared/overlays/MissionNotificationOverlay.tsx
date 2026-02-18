import React, { useEffect } from 'react';
import { useGameContext } from '../../../context/GameContext';

export const MissionNotificationOverlay: React.FC = () => {
    const { state, dispatch, multiplayer } = useGameContext();
    const notification = state.notification;
    const { players, currentPlayerIndex } = state;

    const onClose = () => {
        dispatch({ type: 'SET_NOTIFICATION', payload: null });
    };

    useEffect(() => {
        if (notification) {
            const displayTime = notification.type === 'NEUTRALIZED' ? 10000 : 5000;
            const timer = setTimeout(() => {
                onClose();
            }, displayTime);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!notification) return null;

    // Visibility Logic: 
    // 1. If targetPlayerId is set, only that specific player sees it.
    // 2. Otherwise:
    //    a. CONQUEST notifications are global.
    //    b. Others are only for the player whose turn it is.
    const localPlayerId = multiplayer.playerId;

    if (notification.targetPlayerId !== undefined) {
        // Multi-player: must match my ID
        if (localPlayerId !== undefined && notification.targetPlayerId !== localPlayerId) return null;
        // Hot-seat/Solo: only show if it matches the current player's ID (or just show it anyway?)
        // Usually, in hot-seat, the 'victim' isn't at the screen, so showing it during the attacker's turn 
        // is okay but not 'private'. However, the attacker should know they destroyed something.
        // But the user specifically asked for 'private overlays'.
        // So for the attacker to NOT see it, we check if target !== current player.
        if (multiplayer.connectionStatus !== 'PLAYING' && players[currentPlayerIndex]?.id !== notification.targetPlayerId) return null;
    } else {
        const isGlobal = notification.type === 'CONQUEST';
        const isMyTurn = (multiplayer.connectionStatus === 'PLAYING' && localPlayerId)
            ? players[currentPlayerIndex]?.id === localPlayerId
            : true;

        if (!isGlobal && !isMyTurn) return null;
    }
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
