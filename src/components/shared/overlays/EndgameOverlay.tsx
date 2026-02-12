import React from 'react';
import type { PlayerData as PlayerDataType } from '../../../types/playerTypes';

interface EndgameOverlayProps {
    winner: PlayerDataType | null;
    endgameChoice: 'victory' | 'destruction' | null;
    onEndgameChoice: (choice: 'victory' | 'destruction') => void;
    onNewOperation: () => void;
    animationIndex: number;
    REGIONS_LENGTH: number;
}

export const EndgameOverlay: React.FC<EndgameOverlayProps> = ({
    winner,
    endgameChoice,
    onEndgameChoice,
    onNewOperation,
    animationIndex,
    REGIONS_LENGTH
}) => {
    if (!winner) return null;

    return (
        <>
            {/* Victory Message / Decision Modal */}
            {!endgameChoice && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: '#000', color: winner.color, zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
                    fontFamily: '"Courier New", Courier, monospace', textAlign: 'left', padding: '10%'
                }}>
                    <h1 style={{
                        fontSize: '4rem',
                        margin: '0 0 20px 0',
                        borderBottom: `2px solid ${winner.color}`,
                        width: '100%',
                        letterSpacing: '5px'
                    }}>
                        NUEVO MENSAJE
                    </h1>
                    <p style={{
                        fontSize: '1.8rem',
                        color: '#fff',
                        maxWidth: '900px',
                        marginTop: '20px',
                        lineHeight: '1.4',
                        textShadow: `0 0 10px ${winner.color}44`
                    }}>
                        Felicitaciones, Comandante {winner.name.toUpperCase()}. Hemos construido y desplegado nuestro protocolo nuclear antes que nuestros enemigos. Ya contamos con sus rendiciones incondicionales. Misión Cumplida.
                    </p>

                    <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '40px', width: '100%', maxWidth: '900px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: '1.2rem', color: '#aaa', margin: 0, flex: 1, fontStyle: 'italic' }}>
                                "Fue un honor. El mundo prosperará bajo nuestro liderazgo."
                            </p>
                            <button
                                onClick={() => onEndgameChoice('victory')}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: winner.color, color: '#000',
                                    border: 'none', fontWeight: 'bold', cursor: 'pointer',
                                    fontSize: '1rem', boxShadow: `0 0 20px ${winner.color}`,
                                    minWidth: '250px'
                                }}
                            >
                                FINALIZAR OPERACIÓN
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: '1.2rem', color: '#aaa', margin: 0, flex: 1, fontStyle: 'italic' }}>
                                "Tras años de guerra, las diferencias son insalvables. Nuestros salvajes enemigos no pueden ser reformados."
                            </p>
                            <button
                                onClick={() => onEndgameChoice('destruction')}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: '#333', color: winner.color,
                                    border: `1px solid ${winner.color}`, fontWeight: 'bold', cursor: 'pointer',
                                    fontSize: '1rem', boxShadow: `0 0 20px #ff000044`,
                                    minWidth: '250px'
                                }}
                            >
                                INICIAR SECUENCIA DE ATAQUE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Operation Button (After animation) */}
            {endgameChoice && animationIndex >= REGIONS_LENGTH && (
                <div style={{
                    position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 10000, display: 'flex', gap: '20px'
                }}>
                    <button
                        onClick={onNewOperation}
                        style={{
                            padding: '15px 40px',
                            backgroundColor: winner.color, color: '#000',
                            border: 'none', fontWeight: 'bold', cursor: 'pointer',
                            fontSize: '1.2rem', boxShadow: `0 0 20px ${winner.color}`
                        }}
                    >
                        NUEVA OPERACIÓN
                    </button>
                </div>
            )}
        </>
    );
};
