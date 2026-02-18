import React from 'react';
import type { PlayerData } from '../../../types/playerTypes';

interface MADOverlayProps {
    involvedPlayers: PlayerData[];
    currentPlayerId: string | number;
    onClose: () => void;
}

export const MADOverlay: React.FC<MADOverlayProps> = ({
    involvedPlayers,
    currentPlayerId,
    onClose
}) => {
    if (involvedPlayers.length === 0) return null;

    // Filter out the current player to name the "opponent" who blocked them
    const otherPlayers = involvedPlayers.filter(p => p.id !== currentPlayerId);
    const names = otherPlayers.length > 0
        ? otherPlayers.map(p => p.name).join(' y ')
        : 'otro comandante';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(20, 0, 0, 0.95)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            zIndex: 20000, fontFamily: 'monospace',
            animation: 'fadeIn 0.5s ease-out',
            color: '#ff0000'
        }}>
            <div style={{
                textAlign: 'center',
                borderTop: '3px solid #ff0000',
                borderBottom: '3px solid #ff0000',
                padding: '60px 80px',
                backgroundColor: 'rgba(40, 0, 0, 0.6)',
                boxShadow: '0 0 100px rgba(255, 0, 0, 0.4)',
                maxWidth: '800px'
            }}>
                <div style={{ fontSize: '1.5rem', letterSpacing: '8px', marginBottom: '30px', fontWeight: 'bold' }}>
                    ☢️ ALERTA DE DESTRUCCIÓN MUTUA ASEGURADA ☢️
                </div>

                <div style={{
                    color: '#fff',
                    fontSize: '1.2rem',
                    lineHeight: '1.6',
                    textAlign: 'justify',
                    marginBottom: '30px',
                    borderLeft: '4px solid #ff0000',
                    paddingLeft: '20px'
                }}>
                    <p>
                        <strong>PROTOCOLOS DE LANZAMIENTO ABORTADOS.</strong>
                    </p>
                    <p>
                        No podemos usar nuestro arsenal nuclear porque el comandante <strong>{names}</strong> ha logrado desarrollar un sistema nuclear funcional al mismo tiempo.
                    </p>
                    <p>
                        Tenemos que destruir sus silos o interrumpir su ruta de suministro para poder usar nuestras armas.
                    </p>
                    <p style={{ color: '#ffaaaa' }}>
                        El silo que habíamos puesto en proceso de despliegue ahora está en <strong>enfriamiento (cooldown)</strong>. No lo podremos usar hasta el año que viene.
                    </p>
                </div>

                <div style={{ color: '#ff0000', fontSize: '1rem', marginTop: '20px', letterSpacing: '2px', fontStyle: 'italic' }}>
                    SISTEMA DE EQUILIBRIO DE TERROR CIVILIZATORIO: ACTIVADO
                </div>
            </div>

            <button
                onClick={onClose}
                style={{
                    marginTop: '50px',
                    padding: '15px 60px',
                    backgroundColor: '#ff0000',
                    color: '#000',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    letterSpacing: '5px',
                    transition: 'all 0.3s',
                    boxShadow: '0 0 30px rgba(255, 0, 0, 0.6)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#ff0000';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff0000';
                    e.currentTarget.style.color = '#000';
                }}
            >
                ENTENDIDO
            </button>
        </div>
    );
};
