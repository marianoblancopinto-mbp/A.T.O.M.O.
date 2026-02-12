import React from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { RAW_MATERIAL_DATA } from '../../../../data/productionData';
import { REGIONS } from '../../../../data/mapRegions';
import type { RawMaterialType } from '../../../../types/productionTypes';

interface SiloFuelSelectionModalProps {
    show: boolean;
    onClose: () => void;
    siloRegionId: string | null;
}

export const SiloFuelSelectionModal: React.FC<SiloFuelSelectionModalProps> = ({
    show,
    onClose,
    siloRegionId
}) => {
    const { state, dispatch } = useGameContext();
    const { currentPlayerIndex, players } = state;
    const { rawMaterials } = usePlayerResources(currentPlayerIndex);
    const { checkRoute } = useSupplyRoute();

    if (!show || !siloRegionId) return null;

    const player = players[currentPlayerIndex];
    const currentAssignedCardId = player.siloFuelCards?.[siloRegionId];

    const handleAssign = (cardId: string) => {
        // Dispatch update to assign fuel
        // We might not have a specific action for this, so we update the player's siloFuelCards map
        const updatedSiloFuelCards = {
            ...player.siloFuelCards,
            [siloRegionId]: cardId
        };

        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    siloFuelCards: updatedSiloFuelCards
                }
            }
        });

        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 6000,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#1a1a00',
                border: '3px solid #ff9900',
                padding: '30px',
                width: '700px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(255, 153, 0, 0.6)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#ff9900', margin: 0, fontSize: '1.5rem' }}>☢️ SELECCIONAR COMBUSTIBLE NUCLEAR</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#ff9900', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

                <div style={{ backgroundColor: '#000', padding: '12px', marginBottom: '20px', border: '1px solid #666', borderRadius: '4px' }}>
                    <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Silo de Destino:</div>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {REGIONS.find(r => r.id === siloRegionId)?.title}
                    </div>
                </div>

                <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>
                    Seleccione una carta de Combustible Nuclear de su inventario:
                </div>

                {rawMaterials.length === 0 ? (
                    <div style={{ color: '#ff4444', padding: '20px', textAlign: 'center', border: '1px dashed #ff4444', borderRadius: '4px' }}>
                        No tienes materias primas en tu inventario.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                        {rawMaterials.map(card => {
                            // Filter logic: Must be nuclear fuel (Is 'URANIO' the type? Or 'COMBUSTIBLE_NUCLEAR'?
                            // Let's check logic: original code checked `card.type === 'COMBUSTIBLE_NUCLEAR'`
                            // But Wait, `availableRaw` uses `RAW_MATERIAL_DATA`.
                            // Let's assume the type is literally 'COMBUSTIBLE_NUCLEAR' based on previous code.
                            // But usually raw materials are stuff like URANIO.
                            // Looking at the original code: `const isNuclear = card.type === 'COMBUSTIBLE_NUCLEAR';`
                            // If so, I should stick to that.

                            const isNuclear = (card.type as string) === 'COMBUSTIBLE_NUCLEAR'; // Cast to be safe if type is narrow

                            // Check route
                            const hasRoute = isNuclear ? checkRoute(card.country!, siloRegionId, currentPlayerIndex) : false;

                            const isSelectable = isNuclear && hasRoute && !card.usedThisTurn;
                            const isSelected = currentAssignedCardId === card.id;

                            // If not nuclear, maybe we shouldn't even show it? 
                            // Original showed it as "INCOMPATIBLE". I'll keep it for consistency or filter?
                            // Original mapped `inventory` which was ALL raw materials.
                            // So I will map `rawMaterials` (which is all raw materials).

                            // BUT, showing irrelevant stuff like IRON as "Incompatible" might be noisy if there are many.
                            // Original code did it, so I will too.

                            return (
                                <div
                                    key={card.id}
                                    onClick={() => {
                                        if (isSelectable) {
                                            handleAssign(card.id);
                                        }
                                    }}
                                    style={{
                                        padding: '15px',
                                        border: isSelected ? '3px solid #00ff00' : `2px solid ${isNuclear ? '#ff9900' : '#444'}`,
                                        backgroundColor: isSelected ? '#003300' : (isSelectable ? '#1a1a1a' : '#0a0a0a'),
                                        cursor: isSelectable ? 'pointer' : 'not-allowed',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 0 20px rgba(0, 255, 0, 0.5)' : 'none',
                                        opacity: isSelectable || isSelected ? 1 : 0.6
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', textAlign: 'center', color: isNuclear ? '#ff9900' : '#444' }}>
                                        {isNuclear ? '☢️' : '✗'}
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: isNuclear ? '#00ff00' : '#888',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        textDecoration: !isNuclear ? 'line-through' : 'none'
                                    }}>
                                        {RAW_MATERIAL_DATA[card.type as RawMaterialType]?.name || card.type}
                                    </div>

                                    {!isNuclear && (
                                        <div style={{ fontSize: '0.65rem', color: '#ff4444', textAlign: 'center', fontWeight: 'bold' }}>
                                            INCOMPATIBLE
                                        </div>
                                    )}

                                    {isNuclear && !hasRoute && (
                                        <div style={{ fontSize: '0.65rem', color: '#ff4444', textAlign: 'center', fontWeight: 'bold' }}>
                                            SIN RUTA DE SUMINISTRO
                                        </div>
                                    )}

                                    {card.country && (
                                        <div style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'center', borderTop: '1px solid #444', paddingTop: '6px' }}>
                                            Origen: {REGIONS.find(r => r.id === card.country)?.title || card.country}
                                        </div>
                                    )}

                                    {isSelected && (
                                        <div style={{ fontSize: '0.75rem', color: '#00ff00', textAlign: 'center', fontWeight: 'bold' }}>
                                            ASIGNADO
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
