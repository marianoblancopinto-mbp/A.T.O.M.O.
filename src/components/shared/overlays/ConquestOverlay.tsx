import React from 'react';
import type { PlayerData } from '../../../types/playerTypes';

interface ConquestData {
    player: PlayerData;
    regionName: string;
}

interface ConquestOverlayProps {
    data: ConquestData;
    type: 'conquest' | 'defense';
    onClose: () => void;
}

export const ConquestOverlay: React.FC<ConquestOverlayProps> = ({ data, type, onClose }) => {
    const isDefense = type === 'defense';
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                cursor: 'pointer'
            }}
        >
            <h2 style={{
                color: data.player.color,
                fontSize: '3rem',
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '5px',
                textShadow: `0 0 10px ${data.player.color} `
            }}>
                {isDefense ? 'TERRITORIO DEFENDIDO' : 'TERRITORIO ADQUIRIDO'}
            </h2>
            <h1 style={{
                color: '#fff',
                fontSize: '4rem',
                textTransform: 'uppercase',
                letterSpacing: '5px',
                marginBottom: '10px',
                textShadow: '0 0 5px #fff'
            }}>
                {data.regionName}
            </h1>
            <h3 style={{
                color: data.player.color,
                fontSize: '2rem',
                textTransform: 'uppercase',
                marginTop: '20px'
            }}>
                Comandante {data.player.name}
            </h3>
            <p style={{
                color: '#fff',
                marginTop: '50px',
                fontSize: '1.2rem',
                animation: 'blink 1s infinite'
            }}>
                &gt; CLICK PARA CONTINUAR &lt;
            </p>
        </div>
    );
};
