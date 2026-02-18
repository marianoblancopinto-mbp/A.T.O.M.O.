import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import type { SpecialCard } from '../../../../types/playerTypes';

interface IstanbulMissionModalProps {
    onClose: () => void;
    onSuccess: (playerName: string, cityName: string) => void;
}

export const IstanbulMissionModal: React.FC<IstanbulMissionModalProps> = ({
    onClose,
    onSuccess
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);

    const [selectedBridgeCards, setSelectedBridgeCards] = useState<{
        techId: string | null;
        rawId: string | null;
    }>({ techId: null, rawId: null });

    const [selectedCityName, setSelectedCityName] = useState<'ESTAMBUL' | 'CONSTANTINOPLA'>('ESTAMBUL');

    const player = players[currentPlayerIndex];
    if (!player) return null;

    const hasTurkey = owners['turquia'] === player.id;
    const hasGreece = owners['grecia'] === player.id;

    // Tecnologías - No route validation required
    const heavyIndustryCards = technologies.filter(c => c.type === 'INDUSTRIA_PESADA' && !c.usedThisTurn);

    // Materias Primas - Validated for Route to Turkey OR Greece
    const ironCards = rawMaterials.filter(c => c.type === 'HIERRO' && !c.usedThisTurn);

    const canComplete = hasTurkey && hasGreece && selectedBridgeCards.techId && selectedBridgeCards.rawId;

    const handleComplete = () => {
        if (!canComplete || !selectedBridgeCards.techId || !selectedBridgeCards.rawId) return;

        // Consume Cards
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedBridgeCards.techId, category: 'technology' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedBridgeCards.rawId, category: 'rawMaterial' }
        });

        // Add Special Card & Active Mission
        const newCard: SpecialCard = {
            id: `special-istanbul-${Date.now()}`,
            type: 'PUENTE_BOSFORO',
            name: `PUENTE DE ${selectedCityName}`,
            originCountry: 'turquia',
            description: `Conexión terrestre permanente entre Grecia y Turquía. La ciudad ha sido refundada como ${selectedCityName}.`,
            createdAt: Date.now()
        };

        const updatedSpecialCards = [...player.specialCards, newCard];
        const updatedActiveMissions = [...player.activeSpecialMissions, { id: 'refundacion_estanbul', baseRegionId: 'turquia', startTime: Date.now() }];

        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    specialCards: updatedSpecialCards,
                    activeSpecialMissions: updatedActiveMissions
                }
            }
        });

        onSuccess(player.name, selectedCityName);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '800px',
                backgroundColor: '#1a0d00',
                border: '2px solid #ff8800',
                boxShadow: '0 0 50px rgba(255, 136, 0, 0.3)',
                color: '#ffeebb',
                fontFamily: 'monospace',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #ff8800',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(255, 136, 0, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        REFUNDACIÓN DE ESTAMBUL
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#ff8800' }}>
                        MEGAPROYECTO URBANO
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#ff8800', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Control Check */}
                        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                            <div>
                                <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasTurkey ? '✅' : '❌'}</div>
                                <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>TURQUÍA</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasGreece ? '✅' : '❌'}</div>
                                <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>GRECIA</div>
                            </div>
                        </div>

                        {/* Tech Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>TECNOLOGÍA (IND. PESADA):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {heavyIndustryCards.length > 0 ? heavyIndustryCards.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedBridgeCards(prev => ({ ...prev, techId: c.id }))}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: selectedBridgeCards.techId === c.id ? '#ff8800' : '#221100',
                                            color: selectedBridgeCards.techId === c.id ? '#000' : '#ff8800',
                                            border: `1px solid #ff8800`,
                                            cursor: 'pointer', fontSize: '0.85rem',
                                            textAlign: 'center', transition: 'all 0.2s'
                                        }}
                                    >
                                        INDUSTRIA PESADA ({c.country?.toUpperCase()})
                                    </div>
                                )) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,136,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Iron Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>MATERIA PRIMA (HIERRO):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {ironCards.length > 0 ? ironCards.map(c => {
                                    const routeToTurkey = owners['turquia'] === player.id ? checkRoute(c.country, 'turquia', player.id) : false;
                                    const routeToGreece = owners['grecia'] === player.id ? checkRoute(c.country, 'grecia', player.id) : false;
                                    const hasRoute = routeToTurkey || routeToGreece;

                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => hasRoute && setSelectedBridgeCards(prev => ({ ...prev, rawId: c.id }))}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedBridgeCards.rawId === c.id ? '#ff8800' : (hasRoute ? '#221100' : 'rgba(255,0,0,0.1)'),
                                                color: selectedBridgeCards.rawId === c.id ? '#000' : (hasRoute ? '#ff8800' : '#666'),
                                                border: `1px solid ${hasRoute ? '#ff8800' : '#440000'}`,
                                                cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                fontSize: '0.85rem', textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            HIERRO ({c.country?.toUpperCase()}) {!hasRoute && '(SIN RUTA)'}
                                        </div>
                                    );
                                }) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,136,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #ff8800', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#ff8800' }}>NOMBRE DE LA CIUDAD</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {['ESTAMBUL', 'CONSTANTINOPLA'].map(name => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedCityName(name as any)}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: selectedCityName === name ? '#ff8800' : '#110a00',
                                        color: selectedCityName === name ? '#000' : '#ff8800',
                                        border: '1px solid #ff8800',
                                        cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                                        fontFamily: 'monospace', textTransform: 'uppercase'
                                    }}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        <h3 style={{ marginTop: '20px', color: '#ff8800' }}>BENEFICIO</h3>
                        <div style={{ backgroundColor: 'rgba(255, 136, 0, 0.1)', padding: '15px', border: '1px dashed #ff8800' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                PUENTE DEL BÓSFORO
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Conexión terrestre permanente entre Grecia y Turquía.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#ffcc88' }}>
                                <li>Elimina penalización mar</li>
                                <li>Conexión directa: GRE/TUR</li>
                                <li>Efecto Permanente</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: 'transparent',
                            color: '#ff8800',
                            border: '1px solid #663300',
                            cursor: 'pointer',
                            fontFamily: 'monospace'
                        }}
                    >
                        CANCELAR
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={handleComplete}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canComplete ? '#221100' : '#ff8800',
                            color: !canComplete ? '#442200' : '#000',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer',
                            boxShadow: !canComplete ? 'none' : '0 0 20px rgba(255, 136, 0, 0.4)'
                        }}
                    >
                        REFUNDAR CIUDAD
                    </button>
                </div>
            </div>
        </div>
    );
};
