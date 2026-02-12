import React from 'react';
import { useGameContext } from '../../context/GameContext';

interface SidebarPanelProps {
    onEndTurn: () => void;
    onOpenInventory: () => void;
    onOpenRawMaterials: () => void;
    onOpenTechnologies: () => void;
    onOpenConfidential: () => void;
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
    onEndTurn,
    onOpenInventory,
    onOpenRawMaterials,
    onOpenTechnologies,
    onOpenConfidential,
    mobileOpen = false,
    onCloseMobile,
}) => {
    const { state, multiplayer } = useGameContext();
    const { players, currentPlayerIndex, gameDate } = state;
    const currentPlayer = players[currentPlayerIndex];

    if (!currentPlayer) return null;

    // Check if it is the local player's turn (Multiplayer guard)
    const isMyTurn = (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId)
        ? currentPlayer.id === multiplayer.playerId
        : true;

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

    // Mobile specific logic
    const isMobile = window.innerWidth <= 768;

    return (
        <div
            className={`sidebar-panel ${mobileOpen ? 'mobile-open' : ''}`}
            style={{
                width: '300px',
                height: '100vh',
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.98)',
                borderRight: '2px solid #00ff00',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: '20px',
                color: '#00ff00',
                boxShadow: '5px 0 10px rgba(0, 255, 0, 0.1)',
                zIndex: 100,
                boxSizing: 'border-box',
                transition: 'transform 0.3s ease',
                ...(isMobile ? {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                } : {})
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #00ff00',
                paddingBottom: '20px',
                marginTop: '10px'
            }}>
                <div style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    letterSpacing: '3px',
                    textShadow: '0 0 5px #00ff00',
                }}>
                    A.T.O.M.O.
                </div>
                {isMobile && (
                    <button
                        onClick={onCloseMobile}
                        style={{
                            background: 'transparent',
                            border: '1px solid #00ff00',
                            color: '#00ff00',
                            padding: '5px 10px',
                            cursor: 'pointer'
                        }}
                    >
                        X
                    </button>
                )}
            </div>

            {/* Active Player Info */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #00ff00',
                padding: '20px',
                backgroundColor: '#001100'
            }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.8 }}>
                    JUGADOR ACTIVO
                </span>
                <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '2px',
                    border: '2px solid #fff',
                    backgroundColor: currentPlayer.color,
                }} />
                <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: currentPlayer.color,
                    textShadow: `0 0 5px ${currentPlayer.color}`
                }}>
                    {currentPlayer.name}
                </span>
            </div>

            {/* Action Buttons Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {isMyTurn && (
                    <button
                        onClick={() => {
                            onEndTurn();
                            if (isMobile) onCloseMobile?.();
                        }}
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
                    >
                        FINALIZAR OPERACIÓN
                    </button>
                )}

                <button onClick={() => { onOpenInventory(); if (isMobile) onCloseMobile?.(); }} style={greenBtnStyle} onMouseEnter={greenHoverIn} onMouseLeave={greenHoverOut}>
                    INVENTARIO
                </button>

                <button onClick={() => { onOpenRawMaterials(); if (isMobile) onCloseMobile?.(); }} style={greenBtnStyle} onMouseEnter={greenHoverIn} onMouseLeave={greenHoverOut}>
                    MATERIAS PRIMAS
                </button>

                <button onClick={() => { onOpenTechnologies(); if (isMobile) onCloseMobile?.(); }} style={greenBtnStyle} onMouseEnter={greenHoverIn} onMouseLeave={greenHoverOut}>
                    TECNOLOGÍAS
                </button>

                <button
                    onClick={() => { onOpenConfidential(); if (isMobile) onCloseMobile?.(); }}
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
                >
                    INFO CONFIDENCIAL
                </button>
            </div>

            <div style={{
                marginTop: 'auto',
                borderTop: '1px solid #333',
                paddingTop: '15px',
                fontSize: '0.7rem',
                letterSpacing: '1px',
                opacity: 0.8,
                textAlign: 'center'
            }}>
                &gt;&gt; FECHA: {(new Date(gameDate).getMonth() + 1).toString().padStart(2, '0')}/{new Date(gameDate).getFullYear()}<br />
                &gt;&gt; SISTEMA ONLINE
            </div>
        </div>
    );
};

