import React, { useState, useEffect } from 'react';
import { REGIONS } from '../../../../data/mapRegions';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { TECHNOLOGY_DATA } from '../../../../data/productionData';
import type { TechnologyType } from '../../../../types/productionTypes';

interface EspionageActivationModalProps {
    show: boolean;
    onClose: () => void;
    playerIndex?: number;
}

export const EspionageActivationModal: React.FC<EspionageActivationModalProps> = ({
    show,
    onClose,
    playerIndex
}) => {
    const { state } = useGameContext();
    const { players, currentPlayerIndex: stateCurrentPlayerIndex, owners } = state;
    const effectivePlayerIndex = playerIndex ?? stateCurrentPlayerIndex;
    const gameActions = useGameActions();
    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(effectivePlayerIndex);
    const currentPlayer = players[effectivePlayerIndex];

    const [selectedHqId, setSelectedHqId] = useState<string | null>(null);
    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
    const [selectedSemiId, setSelectedSemiId] = useState<string | null>(null);

    useEffect(() => {
        if (!show) {
            setSelectedHqId(null);
            setSelectedTechId(null);
            setSelectedSemiId(null);
        }
    }, [show]);

    if (!show) return null;

    const espionageHqIds = ['nueva_york', 'reino_unido', 'china', 'rusia'];
    const playerOwnedHqs = espionageHqIds.filter(hqId => owners[hqId] === currentPlayer.id);

    const availableTech = technologies.filter(c => c.type === 'INDUSTRIA_ELECTRONICA' && !c.usedThisTurn);
    const availableSemi = rawMaterials.filter(c => c.type === 'CONDUCTORES_SEMICONDUCTORES' && !c.usedThisTurn);

    const canActivate = selectedHqId && selectedTechId && selectedSemiId;

    const handleActivate = () => {
        if (canActivate) {
            gameActions.createEspionageCard(selectedHqId, {
                techId: selectedTechId,
                semiId: selectedSemiId
            }, effectivePlayerIndex);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 9500,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#001a1a', border: '3px solid #00ffff',
                padding: '30px', width: '800px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.3)', borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ color: '#00ffff', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>🕵️ ACTIVAR AGENCIA DE ESPIONAJE</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#00ffff', fontSize: '1.5rem', cursor: 'pointer' }}>X</button>
                </div>

                {/* HQ Selection Dropdown */}
                <div style={{ marginBottom: '25px', borderBottom: '1px solid #00ffff', paddingBottom: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '10px' }}>1. Seleccionar Sede Operativa</h3>
                    <select
                        value={selectedHqId || ''}
                        onChange={(e) => {
                            setSelectedHqId(e.target.value || null);
                            setSelectedSemiId(null); // Reset semi because route depends on HQ
                        }}
                        style={{
                            width: '100%', padding: '12px', fontSize: '1rem', backgroundColor: '#000', color: '#00ffff', border: '1px solid #00ffff'
                        }}
                    >
                        <option value="">-- Seleccionar Sede de Inteligencia --</option>
                        {playerOwnedHqs.map(rid => (
                            <option key={rid} value={rid}>{REGIONS.find(r => r.id === rid)?.title}</option>
                        ))}
                    </select>
                    {playerOwnedHqs.length === 0 && (
                        <div style={{ color: '#ff4444', marginTop: '10px', fontSize: '0.8rem' }}>
                            No controlas ninguna sede de espionaje (NY, UK, China, Rusia).
                        </div>
                    )}
                </div>

                {/* Resource Selection */}
                <div style={{ opacity: selectedHqId ? 1 : 0.5, pointerEvents: selectedHqId ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '15px' }}>2. Seleccionar Recursos Requeridos</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                        {/* Technology Column */}
                        <div>
                            <div style={{ color: '#00ffff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>INDUSTRIA ELECTRÓNICA</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {availableTech.length === 0 ? (
                                    <div style={{ color: '#ff4444', fontSize: '0.8rem', border: '1px dashed #ff4444', padding: '10px' }}>
                                        Sin disponibilidad.
                                    </div>
                                ) : (
                                    availableTech.map(card => {
                                        const isSelected = selectedTechId === card.id;
                                        return (
                                            <div
                                                key={card.id}
                                                onClick={() => setSelectedTechId(card.id)}
                                                style={{
                                                    padding: '10px',
                                                    border: isSelected ? '2px solid #00ffff' : '1px solid #333',
                                                    backgroundColor: isSelected ? '#003333' : '#0a0a0a',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    color: isSelected ? '#fff' : '#aaa'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{TECHNOLOGY_DATA[card.type as TechnologyType]?.name || card.type}</span>
                                                    {isSelected && <span style={{ color: '#00ffff' }}>✓</span>}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>
                                                    Origen: {REGIONS.find(r => r.id === card.country)?.title}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Raw Material Column */}
                        <div>
                            <div style={{ color: '#00ffff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>SEMICONDUCTORES</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {availableSemi.length === 0 ? (
                                    <div style={{ color: '#ff4444', fontSize: '0.8rem', border: '1px dashed #ff4444', padding: '10px' }}>
                                        Sin disponibilidad.
                                    </div>
                                ) : (
                                    availableSemi.map(card => {
                                        const isSelected = selectedSemiId === card.id;
                                        const hasRoute = selectedHqId ? checkRoute(card.country!, selectedHqId, effectivePlayerIndex) : false;
                                        const isSelectable = hasRoute;

                                        return (
                                            <div
                                                key={card.id}
                                                onClick={() => isSelectable && setSelectedSemiId(card.id)}
                                                style={{
                                                    padding: '10px',
                                                    border: isSelected ? '2px solid #00ffff' : (isSelectable ? '1px solid #333' : '1px solid #300'),
                                                    backgroundColor: isSelected ? '#003333' : (isSelectable ? '#0a0a0a' : '#1a0000'),
                                                    cursor: isSelectable ? 'pointer' : 'not-allowed',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    color: isSelectable ? (isSelected ? '#fff' : '#aaa') : '#600',
                                                    textDecoration: isSelectable ? 'none' : 'line-through'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{REGIONS.find(r => r.id === card.country)?.title}</span>
                                                    {isSelected && <span style={{ color: '#00ffff' }}>✓</span>}
                                                </div>
                                                {!hasRoute && <div style={{ fontSize: '0.6rem', color: '#ff4444' }}>SIN RUTA A SEDE</div>}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ color: '#888', fontSize: '0.8rem', margin: '25px 0', fontStyle: 'italic', borderLeft: '3px solid #00ffff', paddingLeft: '10px' }}>
                    * El establecimiento de una red de inteligencia requiere el control de una sede operativa, industria electrónica especializada y semiconductores con logística de suministro activa a la sede.
                </div>

                <button
                    disabled={!canActivate}
                    onClick={handleActivate}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: canActivate ? '#00ffff' : '#222',
                        color: canActivate ? '#000' : '#444',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: canActivate ? 'pointer' : 'not-allowed',
                        fontSize: '1.1rem',
                        letterSpacing: '5px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s'
                    }}
                >
                    ESTABLECER AGENCIA
                </button>
            </div>
        </div>
    );
};
