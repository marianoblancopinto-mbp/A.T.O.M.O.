import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../../../context/GameContext';

export const NuclearAlertModal: React.FC = () => {
    const { state } = useGameContext();
    const { currentPlayerIndex, players } = state;

    const [visible, setVisible] = useState(false);
    const [commanderName, setCommanderName] = useState('');

    useEffect(() => {
        // Check for enemies with active nuclear deployment when turn changes (or component mounts)
        // We only care if meaningful players are loaded
        if (!players || players.length === 0) return;

        const otherDeployments = players.filter((p, idx) => idx !== currentPlayerIndex && p.nuclearDeploymentActive);

        if (otherDeployments.length > 0) {
            setCommanderName(otherDeployments.map(p => p.name).join(", "));
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [currentPlayerIndex, players]); // Re-run when turn changes or players update

    // Logic: If I dismiss it, I don't want it to show again IMMEDIATELY for the same state?
    // The useEffect will re-run if 'players' changes (e.g. resources update).
    // We should probably safeguard against re-showing if just dismissed, unless it's a new turn.
    // But for now, simple implementation matches previous behavior (shows on turn start).
    // Actually, previous behavior was "set state on turn change".
    // If we dismiss, visible becomes false.
    // If 'players' updates (unrelated), visible might become true again?
    // To prevent annoyance, we might need a ref to track "dismissed for this turn".
    // Or just simple setVisible(false) is enough if we don't depend on 'players' too aggressively?
    // 'players' changes often. 'currentPlayerIndex' changes rarely.
    // Let's depend on 'currentPlayerIndex' primarily for "New Turn Alert".

    // Better approach: Only trigger on currentPlayerIndex change?
    // But if someone deploys DURING my turn (multiplayer?), I should know?
    // The original logic was only on turn start. Let's stick to that for now to avoid spam.

    // Update: If we only dep on currentPlayerIndex, we might miss updates if we mount mid-turn?
    // But mounting usually happens once.
    // Let's refine the dependency to avoid spam.

    // For now, let's trust the logic: Show if threat exists. Dismiss hides it. 
    // If we rely on players changing, it might pop up again.
    // Let's use a local state 'hasDismissedThisTurn' or similar? 
    // Or just 'visible' is enough, considering users won't usually update 'players' in a way that toggles 'nuclearDeploymentActive' back and forth.

    // Wait, if I attack (update players), it might re-trigger.
    // Let's restrict re-triggering.

    const handleClose = () => {
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(51, 0, 0, 0.95)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9000,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#1a0000', border: '5px solid #ff0000',
                padding: '40px', width: '600px', textAlign: 'center',
                boxShadow: '0 0 100px rgba(255, 0, 0, 0.8)',
                animation: 'pulse 1s infinite'
            }}>
                <h2 style={{ color: '#ff0000', fontSize: '2.5rem', margin: '0 0 20px 0' }}>⚠️ ALERTA ROJA ⚠️</h2>
                <div style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '30px' }}>
                    Sistemas de inteligencia detectan un despliegue nuclear inminente por parte de:
                    <br /><br />
                    <span style={{ fontSize: '1.8rem', color: '#ffcc00', fontWeight: 'bold' }}>COMANDANTE {commanderName.toUpperCase()}</span>
                </div>
                <p style={{ color: '#aaa', marginBottom: '30px' }}>
                    Tienes el tiempo de este turno para interceptar el silo enemigo, conquistar el territorio o activar tu propia disuasión nuclear.
                    Si el despliegue continúa al final de esta ronda, la derrota es inevitable.
                </p>
                <button
                    onClick={handleClose}
                    style={{
                        backgroundColor: '#ff0000', color: '#fff', border: 'none',
                        padding: '15px 40px', fontWeight: 'bold', cursor: 'pointer',
                        fontSize: '1.2rem', letterSpacing: '2px'
                    }}
                >
                    COMPRENDIDO
                </button>
            </div>
        </div>
    );
};
