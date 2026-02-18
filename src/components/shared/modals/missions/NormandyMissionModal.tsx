import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import type { SpecialCard } from '../../../../types/playerTypes';

interface NormandyMissionModalProps {
    show: boolean;
    onClose: () => void;
    // Removed old props
}

export const NormandyMissionModal: React.FC<NormandyMissionModalProps> = ({
    show,
    onClose
}) => {
    const { state, dispatch } = useGameContext();
    const { currentPlayerIndex, players, owners } = state;
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);
    const { checkRoute } = useSupplyRoute();

    const [selectedNormandyTechId, setSelectedNormandyTechId] = useState<string | null>(null);
    const [selectedNormandyIronId, setSelectedNormandyIronId] = useState<string | null>(null);

    if (!show) return null;

    const hasUK = owners['reino_unido'] === currentPlayerIndex;
    const franceOwner = owners['francia'];
    const germanyOwner = owners['alemania'];

    // Check if France and Germany are owned by the SAME enemy (someone else)
    const sameEnemyOwner = franceOwner === germanyOwner &&
        franceOwner !== currentPlayerIndex &&
        franceOwner !== null &&
        franceOwner !== undefined;

    // Filter Resources
    const heavyTechs = technologies.filter(c => c.type === 'INDUSTRIA_PESADA' && !c.usedThisTurn);
    const ironMaterials = rawMaterials.filter(c => {
        if ((c.type as string) !== 'HIERRO' || c.usedThisTurn) return false;
        // Check route to UK
        return checkRoute(c.country!, 'reino_unido', currentPlayerIndex);
    });

    const canComplete = hasUK && sameEnemyOwner && selectedNormandyTechId && selectedNormandyIronId;

    const handleComplete = () => {
        if (!canComplete || !selectedNormandyTechId || !selectedNormandyIronId) return;

        // 1. Consume Cards
        dispatch({ type: 'MARK_CARD_AS_USED', payload: { cardId: selectedNormandyTechId, category: 'technology' } });
        dispatch({ type: 'MARK_CARD_AS_USED', payload: { cardId: selectedNormandyIronId, category: 'rawMaterial' } });

        // 2. Create Special Card
        const newCard: SpecialCard = {
            id: `normandy-card-${Date.now()}`,
            type: 'NORMANDY_LANDING',
            name: 'DESEMBARCO DE NORMANDÍA',
            originCountry: 'reino_unido',
            description: 'Bonus +1 Artillería y +2 Infantería al atacar Francia desde UK.',
            createdAt: Date.now()
        };

        dispatch({ type: 'ADD_SPECIAL_CARD', payload: { playerIndex: currentPlayerIndex, card: newCard } });

        // 3. Notify
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'SECONDARY_MISSION',
                title: 'DESEMBARCO DE NORMANDÍA',
                message: 'La invasión ha comenzado. Las fuerzas aliadas han desembarcado en las playas de Francia.',
                color: '#00aaff',
                playerName: players[currentPlayerIndex].name
            }
        });

        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 8200,
            backdropFilter: 'blur(5px)',
            fontFamily: 'monospace'
        }}>
            <div style={{
                width: '900px',
                backgroundColor: '#00051a',
                border: '2px solid #00aaff',
                boxShadow: '0 0 50px rgba(0, 170, 255, 0.3)',
                color: '#cceeff',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #00aaff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(0, 170, 255, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        OPERACIÓN: DESEMBARCO DE NORMANDÍA
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#00aaff' }}>
                        INVASIÓN ANFIBIA
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#00aaff', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* UK Control */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasUK ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE REINO UNIDO (BASE)</div>
                        </div>

                        {/* Occupation Check */}
                        <div style={{
                            padding: '10px', marginBottom: '15px',
                            backgroundColor: sameEnemyOwner ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                            border: `1px solid ${sameEnemyOwner ? '#00ff00' : '#ffaa00'}`,
                            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem'
                        }}>
                            <span>{sameEnemyOwner ? '✅' : '⚠️'}</span>
                            <span>FRANCIA Y ALEMANIA OCUPADAS POR MISMO ENEMIGO</span>
                        </div>

                        {/* Tech Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>TECNOLOGÍA (IND. PESADA):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {heavyTechs.length > 0 ? heavyTechs.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedNormandyTechId(c.id)}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: selectedNormandyTechId === c.id ? '#00aaff' : '#001122',
                                            color: selectedNormandyTechId === c.id ? '#000' : '#00aaff',
                                            border: `1px solid #00aaff`,
                                            cursor: 'pointer', fontSize: '0.85rem',
                                            textAlign: 'center', transition: 'all 0.2s'
                                        }}
                                    >
                                        INDUSTRIA PESADA ({c.country?.toUpperCase()})
                                    </div>
                                )) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(0,170,255,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Iron Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>MATERIA PRIMA (HIERRO):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {ironMaterials.length > 0 ? ironMaterials.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedNormandyIronId(c.id)}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: selectedNormandyIronId === c.id ? '#00aaff' : '#001122',
                                            color: selectedNormandyIronId === c.id ? '#000' : '#00aaff',
                                            border: `1px solid #00aaff`,
                                            cursor: 'pointer', fontSize: '0.85rem',
                                            textAlign: 'center', transition: 'all 0.2s'
                                        }}
                                    >
                                        HIERRO ({c.country?.toUpperCase()})
                                    </div>
                                )) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(0,170,255,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible con ruta a UK.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #00aaff', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#00aaff' }}>SUPREMACÍA ALIADA</h3>
                        <div style={{ backgroundColor: 'rgba(0, 170, 255, 0.1)', padding: '15px', border: '1px dashed #00aaff' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                INVASIÓN TOTAL
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Anula la penalización de desembarco y otorga bonificaciones masivas.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#88ccff' }}>
                                <li>+1 Artillería (Fijo)</li>
                                <li>+1 Infantería (Revierte -1)</li>
                                <li>Duración: 1 Turno</li>
                                <li>Objetivo: FRANCIA</li>
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
                            color: '#00aaff',
                            border: '1px solid #336688',
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
                            backgroundColor: !canComplete ? '#002233' : '#00aaff',
                            color: !canComplete ? '#004466' : '#000',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer',
                            boxShadow: !canComplete ? 'none' : '0 0 20px rgba(0, 170, 255, 0.4)'
                        }}
                    >
                        LANZAR INVASIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};
