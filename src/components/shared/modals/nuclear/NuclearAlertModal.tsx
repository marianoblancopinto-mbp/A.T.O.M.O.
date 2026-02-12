import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../../../context/GameContext';

export const NuclearAlertModal: React.FC = () => {
    const { state, multiplayer } = useGameContext();
    const { players } = state;

    const [visible, setVisible] = useState(false);
    const [commanderName, setCommanderName] = useState('');
    const [hasDismissedForCurrentThreats, setHasDismissedForCurrentThreats] = useState<Set<string | number>>(new Set());

    useEffect(() => {
        if (!players || players.length === 0) return;

        // My ID as a player index (or actual ID if they match)
        // In this game, player indices are often used as IDs.
        const myPlayerId = multiplayer.playerId !== null ? multiplayer.playerId : -1;

        // Find all OTHER players who have an active deployment
        const otherDeployments = players.filter((p) =>
            p.nuclearDeploymentActive && p.id !== myPlayerId
        );

        if (otherDeployments.length > 0) {
            // Filter out deployments we've already dismissed
            const newThreats = otherDeployments.filter(p => !hasDismissedForCurrentThreats.has(p.id));

            if (newThreats.length > 0) {
                setCommanderName(newThreats.map(p => p.name).join(", "));
                setVisible(true);
            }
        } else {
            // Reset dismissals if no one is deploying anymore
            if (hasDismissedForCurrentThreats.size > 0) {
                setHasDismissedForCurrentThreats(new Set());
            }
            setVisible(false);
        }
    }, [players, multiplayer.playerId, hasDismissedForCurrentThreats]);

    const handleClose = () => {
        // Mark all current active deployments as dismissed for this client
        const currentThreatIds = players
            .filter(p => p.nuclearDeploymentActive)
            .map(p => p.id);

        setHasDismissedForCurrentThreats(new Set(currentThreatIds as (string | number)[]));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(70, 0, 0, 0.9)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000,
            fontFamily: 'monospace',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#1a0000', border: '5px solid #ff0000',
                padding: '40px', width: '90%', maxWidth: '700px', textAlign: 'center',
                boxShadow: '0 0 100px rgba(255, 0, 0, 0.8)',
                animation: 'pulse 1.5s infinite'
            }}>
                <h2 style={{ color: '#ff0000', fontSize: '2.5rem', margin: '0 0 20px 0', textShadow: '0 0 10px #ff0000' }}>⚠️ ALERTA ROJA ⚠️</h2>

                <div style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '30px', lineHeight: '1.4' }}>
                    <span style={{ color: '#ff4444', fontWeight: 'bold' }}>ALERTA:</span> El comandante <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{commanderName.toUpperCase()}</span> ha iniciado su proceso de despliegue.
                    <br /><br />
                    Tenemos hasta que termine este año para iniciar nuestro propio procedimiento de despliegue o destruir su silo de lanzamiento.
                </div>

                <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', padding: '15px', borderRadius: '5px', marginBottom: '30px', borderLeft: '4px solid #ff0000' }}>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem', textAlign: 'left' }}>
                        <strong>Directiva Estratégica:</strong> Si el despliegue continúa al final de la ronda actual, la victoria del Comandante {commanderName} será absoluta e irreversible.
                    </p>
                </div>

                <button
                    onClick={handleClose}
                    style={{
                        backgroundColor: '#ff0000', color: '#fff', border: '2px solid #fff',
                        padding: '15px 50px', fontWeight: 'bold', cursor: 'pointer',
                        fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase',
                        boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cc0000'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff0000'}
                >
                    COMPRENDIDO
                </button>
            </div>
        </div>
    );
};
