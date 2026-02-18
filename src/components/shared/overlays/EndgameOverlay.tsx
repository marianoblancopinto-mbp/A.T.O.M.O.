import React from 'react';
import type { PlayerData as PlayerDataType } from '../../../types/playerTypes';

interface EndgameOverlayProps {
    winner: PlayerDataType | null;
    endgameChoice: 'victory' | 'destruction' | null;
    onEndgameChoice: (choice: 'victory' | 'destruction') => void;
    onNewOperation: () => void;
    animationIndex: number;
    REGIONS_LENGTH: number;
    isLocalPlayerWinner?: boolean;
}

export const EndgameOverlay: React.FC<EndgameOverlayProps> = ({
    winner,
    endgameChoice,
    onEndgameChoice,
    onNewOperation,
    animationIndex,
    REGIONS_LENGTH,
    isLocalPlayerWinner = true
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
                    <div style={{
                        marginTop: '20px',
                        maxWidth: '900px',
                        maxHeight: '40vh',
                        overflowY: 'auto',
                        paddingRight: '20px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${winner.color} #222`
                    }}>
                        <p style={{
                            fontSize: '1.8rem',
                            color: '#fff',
                            lineHeight: '1.4',
                            textShadow: `0 0 10px ${winner.color}44`,
                            margin: 0
                        }}>
                            {isLocalPlayerWinner
                                ? `Felicitaciones, Comandante ${winner.name.toUpperCase()}. Hemos construido y desplegado nuestro protocolo nuclear antes que nuestros enemigos. Ya contamos con sus rendiciones incondicionales. Misión Cumplida.`
                                : `ATENCIÓN: EL COMANDANTE ${winner.name.toUpperCase()} HA DESPLEGADO SU PROTOCOLO NUCLEAR. LA PAZ MUNDIAL ESTÁ SIENDO RENEGOCIADA BAJO SUS TÉRMINOS.`
                            }
                        </p>
                    </div>

                    {isLocalPlayerWinner ? (
                        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', maxWidth: '900px' }}>
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
                    ) : (
                        <div style={{ marginTop: '40px', color: '#666', fontSize: '1.2rem', fontStyle: 'italic', borderTop: '1px solid #333', paddingTop: '20px', width: '100%', maxWidth: '900px' }}>
                            ESPERANDO DECISIÓN FINAL DEL COMANDANTE VICTORIOSO...
                        </div>
                    )}
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
