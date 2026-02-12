import React from 'react';
import { useGameContext } from '../../context/GameContext';

interface SidebarPanelProps {
    onEndTurn: () => void;
    onOpenInventory: () => void;
    onOpenRawMaterials: () => void;
    onOpenTechnologies: () => void;
    onOpenConfidential: () => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
    onEndTurn,
    onOpenInventory,
    onOpenRawMaterials,
    onOpenTechnologies,
    onOpenConfidential,
}) => {
    const { state, multiplayer } = useGameContext();
    const { players, currentPlayerIndex, gameDate } = state;
    const currentPlayer = players[currentPlayerIndex];

    if (!currentPlayer) return null;

    // Check if it is the local player's turn (Multiplayer guard)
    // In Singleplayer (status !== PLAYING or no playerId), we assume Hotseat or Local, so it's always "your" turn if you are seeing the screen.
    const isMyTurn = (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId)
        ? currentPlayer.id === multiplayer.playerId
        : true;

    // Additional check: In multiplayer, if it's NOT my turn, I shouldn't even see the button or it should be disabled.
    // The user requested "solo sea visible y operable". So we hide it if not my turn.

    const greenBtnStyle: React.CSSProperties = {
        padding: '12px 15px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        backgroundColor: '#002200',
        color: '#00ff00',
        border: '2px solid #00ff00',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontFamily: 'monospace',
        transition: 'all 0.2s',
        boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
    };

    const greenHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = '#00ff00';
        e.currentTarget.style.color = '#000';
    };
    const greenHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = '#002200';
        e.currentTarget.style.color = '#00ff00';
    };

    return (
        <div style={{
            width: '300px',
            height: '100vh',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            borderRight: '2px solid #00ff00',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: '20px',
            color: '#00ff00',
            boxShadow: '5px 0 10px rgba(0, 255, 0, 0.1)',
            zIndex: 10,
            boxSizing: 'border-box'
        }}>
            <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                letterSpacing: '3px',
                textShadow: '0 0 5px #00ff00',
                textAlign: 'center',
                borderBottom: '1px solid #00ff00',
                paddingBottom: '20px',
                marginTop: '20px'
            }}>
                A.T.O.M.O.
            </div>

            {/* Active Player Info */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px',
                border: '1px solid #00ff00',
                padding: '30px 20px',
                backgroundColor: '#001100'
            }}>
                <span style={{
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    JUGADOR ACTIVO
                </span>
                <div style={{
                    width: '40px',
                    height: '40px',
                    overflow: 'hidden',
                    borderRadius: '2px',
                    border: '2px solid #fff'
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: currentPlayer.color,
                        boxShadow: `inset 0 0 10px rgba(0, 0, 0, 0.5)`
                    }} />
                </div>
                <span style={{
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    opacity: 0.7,
                    marginTop: '10px'
                }}>
                    COMANDANTE
                </span>
                <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: currentPlayer.color,
                    textShadow: `0 0 5px ${currentPlayer.color} `
                }}>
                    {currentPlayer.name}
                </span>
            </div>

            {/* Action Buttons Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>

                {isMyTurn && (
                    <button
                        onClick={onEndTurn}
                        style={{
                            padding: '12px 15px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            backgroundColor: '#220000',
                            color: '#ff0000',
                            border: '2px solid #ff0000',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                            boxShadow: '0 0 10px rgba(255, 0, 0, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#440000';
                            e.currentTarget.style.color = '#ff0000';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#220000';
                            e.currentTarget.style.color = '#ff0000';
                        }}
                    >
                        FINALIZAR OPERACIÓN
                    </button>
                )}

                <button onClick={onOpenInventory} style={greenBtnStyle} onMouseEnter={greenHoverIn} onMouseLeave={greenHoverOut}>
                    INVENTARIO
                </button>

                <button onClick={onOpenRawMaterials} style={greenBtnStyle} onMouseEnter={greenHoverIn} onMouseLeave={greenHoverOut}>
                    MATERIAS PRIMAS
                </button>

                <button onClick={onOpenTechnologies} style={greenBtnStyle} onMouseEnter={greenHoverIn} onMouseLeave={greenHoverOut}>
                    TECNOLOGÍAS
                </button>

                <button
                    onClick={onOpenConfidential}
                    style={{
                        padding: '12px 15px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        backgroundColor: '#000033',
                        color: '#00ffff',
                        border: '2px solid #00ffff',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#00ffff';
                        e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#000033';
                        e.currentTarget.style.color = '#00ffff';
                    }}
                >
                    INFORMACIÓN CONFIDENCIAL
                </button>

            </div>

            <div style={{
                marginTop: 'auto',
                borderTop: '1px solid #333',
                paddingTop: '15px',
                fontSize: '0.75rem',
                letterSpacing: '1px',
                opacity: 0.8,
                textAlign: 'center'
            }}>
                &gt;&gt; FECHA: {(new Date(gameDate).getMonth() + 1).toString().padStart(2, '0')} del {new Date(gameDate).getFullYear()}<br />
                &gt;&gt; SISTEMA ONLINE<br />
                &gt;&gt; ESPERANDO ORDENES...
            </div>
        </div>
    );
};
