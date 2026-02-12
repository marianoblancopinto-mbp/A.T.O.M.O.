import React from 'react';
import type { PlayerData } from '../../../types/playerTypes';

interface TurnOverlayProps {
    player: PlayerData;
    onClose: () => void;
}

export const TurnOverlay: React.FC<TurnOverlayProps> = ({ player, onClose }) => {
    if (!player) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', // Fixed to cover entire viewport comfortably
                top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                cursor: 'pointer'
            }}
        >
            <h2 style={{
                color: '#00ff00',
                fontSize: '3rem',
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '5px'
            }}>
                TURNO DE
            </h2>
            <h1 style={{
                color: player.color || '#fff',
                fontSize: '5rem',
                textTransform: 'uppercase',
                textShadow: `0 0 20px ${player.color || '#fff'} `,
                letterSpacing: '10px',
                fontWeight: 'bold'
            }}>
                Comandante {player.name || 'Desconocido'}
            </h1>
            <p style={{
                color: '#fff',
                marginTop: '50px',
                fontSize: '1.2rem',
                animation: 'blink 1s infinite'
            }}>
                &gt; CLICK PARA CONTINUAR &lt;
            </p>
            <style>{`
@keyframes blink {
    0 % { opacity: 1; }
    50 % { opacity: 0; }
    100 % { opacity: 1; }
}
`}</style>
        </div>
    );
};
