import React, { useEffect, useState } from 'react';
import { useGameContext } from '../../../context/GameContext';

export const TakeoverPromptModal: React.FC = () => {
    const { takeoverRequest, respondToTakeover } = useGameContext();
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (!takeoverRequest) {
            setTimeLeft(5);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // If time runs out, assume AFK and allow takeover
                    respondToTakeover(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [takeoverRequest, respondToTakeover]);

    if (!takeoverRequest) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 999999, // Must stay above absolutely everything
            fontFamily: 'monospace'
        }}>
            <div style={{
                background: '#111',
                border: '2px solid #ff4444',
                padding: '30px',
                maxWidth: '500px',
                textAlign: 'center',
                boxShadow: '0 0 40px rgba(255,0,0,0.5)',
                animation: 'pulse 1s infinite alternate'
            }}>
                <h2 style={{ color: '#ff4444', marginBottom: '20px', fontSize: '1.8rem' }}>
                    ¡ ALERTA DE SEGURIDAD !
                </h2>
                <div style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '30px', lineHeight: '1.5' }}>
                    <p>Un nuevo dispositivo está solicitando tomar control de tu puesto de comandante en esta operación.</p>
                    <p style={{ marginTop: '10px', color: '#aaa' }}>Si no respondes en <strong>{timeLeft}</strong> segundos, el acceso será concedido automáticamente.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button
                        onClick={() => respondToTakeover(false)}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: '#ff4444',
                            color: '#fff',
                            border: 'none',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}
                    >
                        BLOQUEAR
                    </button>
                    <button
                        onClick={() => respondToTakeover(true)}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: 'transparent',
                            color: '#aaa',
                            border: '1px solid #444',
                            fontSize: '1.2rem',
                            cursor: 'pointer'
                        }}
                    >
                        PERMITIR
                    </button>
                </div>
            </div>
        </div>
    );
};
