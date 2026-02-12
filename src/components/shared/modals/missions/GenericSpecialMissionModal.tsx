import React, { useState } from 'react';
import type { SpecialMission } from '../../../../data/missionData';
import type { TerritoryCard, TechnologyType, RawMaterialType } from '../../../../types/productionTypes';
import { REGIONS } from '../../../../data/mapRegions';
import { TECHNOLOGY_DATA, RAW_MATERIAL_DATA } from '../../../../data/productionData';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';

import type { SpecialCard } from '../../../../types/playerTypes';

interface GenericSpecialMissionModalProps {
    mission: SpecialMission;
    onClose: () => void;
    inventoryCards: { technologies: TerritoryCard[]; rawMaterials: TerritoryCard[]; };
    onSuccess: (missionId: string, title: string, baseId: string) => void;
}


export const GenericSpecialMissionModal: React.FC<GenericSpecialMissionModalProps> = ({
    mission,
    onClose,
    inventoryCards,
    onSuccess
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const { checkRoute } = useSupplyRoute();


    const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
    const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
    const [selectedRawIds, setSelectedRawIds] = useState<string[]>([]);

    // Eligible bases from control requirements
    const eligibleBases = mission.requirements.control.filter(id => owners[id] === currentPlayerIndex);

    const handleActivate = () => {
        if (!selectedBaseId) return;

        // Mark selected cards as used
        [...selectedTechIds, ...selectedRawIds].filter(Boolean).forEach(cardId => {
            const isTech = inventoryCards.technologies.some(t => t.id === cardId);
            dispatch({
                type: 'MARK_CARD_AS_USED',
                payload: { cardId, category: isTech ? 'technology' : 'rawMaterial' }
            });
        });

        // Generate Special Card
        const newSpecialCard: SpecialCard = {
            id: `special-${mission.id}-${Date.now()}`,
            type: mission.id === 'alejandro_magno' ? 'ALEJANDRO_MAGNO' : 'SECONDARY_MISSION',
            name: mission.title,
            originCountry: selectedBaseId,
            description: mission.description,
            createdAt: Date.now()
        };

        const player = players[currentPlayerIndex];
        const updatedSpecialCards = [...player.specialCards, newSpecialCard];
        const updatedActiveMissions = [...player.activeSpecialMissions, { id: mission.id, baseRegionId: selectedBaseId }];

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

        onSuccess(mission.id, mission.title, selectedBaseId);
        onClose();
    };

    // Check completion of slots
    const techSlotsFilled = mission.requirements.technology.every((_, idx) => selectedTechIds[idx] !== undefined);
    const rawSlotsFilled = mission.requirements.rawMaterials.every((_, idx) => selectedRawIds[idx] !== undefined);
    const baseSelected = !!selectedBaseId;

    // Specific control requirement check for Antarctic (though Generic might not be used for Antarctic if specialized exists)
    const isAntartic = mission.id === 'ruta_antartica';
    const requiredControl = mission.requirements.control || [];
    const hasFullControl = requiredControl.every(id => owners[id] === currentPlayerIndex);

    const canActivate = baseSelected && techSlotsFilled && rawSlotsFilled && (!isAntartic || hasFullControl);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 4000
        }}>
            <div style={{
                backgroundColor: '#001a00',
                border: '2px solid #00ff00',
                padding: '30px',
                maxWidth: '800px',
                width: '95%',
                maxHeight: '90vh',
                overflowY: 'auto',
                fontFamily: 'monospace',
                color: '#00ff00',
                boxShadow: '0 0 50px rgba(0, 255, 0, 0.3)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '20px',
                        background: 'transparent', border: 'none', color: '#005500',
                        fontSize: '2rem', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >X</button>

                <h2 style={{
                    borderBottom: '1px solid #00ff00', paddingBottom: '10px',
                    marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px'
                }}>
                    {mission.title}
                </h2>

                <div style={{
                    marginBottom: '20px', fontSize: '0.9rem', color: '#aaffaa',
                    fontStyle: 'italic', borderLeft: '3px solid #005500', paddingLeft: '15px'
                }}>
                    {mission.lore}
                </div>

                {/* Base Selection Step */}
                <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#000', border: '1px solid #004400' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>1. BASE DE OPERACIONES</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {eligibleBases.length === 0 ? (
                            <div style={{ color: '#ff4444' }}>No controlas ninguna región válida para esta misión.</div>
                        ) : eligibleBases.map(baseId => (
                            <button
                                key={baseId}
                                onClick={() => setSelectedBaseId(baseId)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: selectedBaseId === baseId ? '#00ff00' : '#002200',
                                    color: selectedBaseId === baseId ? '#000' : '#00ff00',
                                    border: '1px solid #00ff00',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {REGIONS.find(r => r.id === baseId)?.title}
                            </button>
                        ))}
                    </div>
                    {!selectedBaseId && eligibleBases.length > 0 && (
                        <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#aaa' }}>* Selecciona desde dónde coordinar la operación.</div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '20px', opacity: selectedBaseId ? 1 : 0.5, pointerEvents: selectedBaseId ? 'auto' : 'none' }}>
                    {/* Technology Slots */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#00aa00', borderBottom: '1px solid #004400', paddingBottom: '5px' }}>2. TECNOLOGÍA</h4>
                        {mission.requirements.technology.map((reqType, idx) => {
                            const selectedId = selectedTechIds[idx];
                            const selectedData = selectedId ? inventoryCards.technologies.find(t => t.id === selectedId) : null;

                            return (
                                <div key={idx} style={{ marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>REQUERIDO: {TECHNOLOGY_DATA[reqType].name}</div>

                                    {selectedData ? (
                                        <div
                                            onClick={() => {
                                                const newIds = [...selectedTechIds];
                                                delete newIds[idx];
                                                setSelectedTechIds(newIds);
                                            }}
                                            style={{
                                                padding: '10px', backgroundColor: '#003300', border: '1px solid #00ff00',
                                                color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                                            }}
                                        >
                                            <span>{TECHNOLOGY_DATA[selectedData.type as TechnologyType].name}</span>
                                            <span style={{ color: '#00ff00' }}>[X]</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {inventoryCards.technologies.filter(t => t.type === reqType && !t.usedThisTurn && !selectedTechIds.includes(t.id)).length === 0 ? (
                                                <div style={{ color: '#555', fontStyle: 'italic', fontSize: '0.8rem' }}>No disponible en inventario</div>
                                            ) : (inventoryCards.technologies
                                                .filter(t => t.type === reqType && !t.usedThisTurn && !selectedTechIds.includes(t.id))
                                                .map(card => (
                                                    <button
                                                        key={card.id}
                                                        onClick={() => {
                                                            const newIds = [...selectedTechIds];
                                                            newIds[idx] = card.id;
                                                            setSelectedTechIds(newIds);
                                                        }}
                                                        style={{
                                                            padding: '8px', backgroundColor: '#0a0a0a', border: '1px dashed #444',
                                                            color: '#aaa', cursor: 'pointer', textAlign: 'left'
                                                        }}
                                                    >
                                                        {REGIONS.find(r => r.id === card.country)?.title} - Usar carta
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Raw Material Slots */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#00aa00', borderBottom: '1px solid #004400', paddingBottom: '5px' }}>3. MATERIA PRIMA</h4>
                        {mission.requirements.rawMaterials.map((reqType, idx) => {
                            const selectedId = selectedRawIds[idx];
                            const selectedData = selectedId ? inventoryCards.rawMaterials.find(r => r.id === selectedId) : null;

                            return (
                                <div key={idx} style={{ marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>REQUERIDO: {RAW_MATERIAL_DATA[reqType].name}</div>

                                    {selectedData ? (
                                        <div
                                            onClick={() => {
                                                const newIds = [...selectedRawIds];
                                                delete newIds[idx];
                                                setSelectedRawIds(newIds);
                                            }}
                                            style={{
                                                padding: '10px', backgroundColor: '#003300', border: '1px solid #00ff00',
                                                color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                                            }}
                                        >
                                            <span>{RAW_MATERIAL_DATA[selectedData.type as RawMaterialType].name}</span>
                                            <span style={{ color: '#00ff00' }}>[X]</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {inventoryCards.rawMaterials.filter(m => m.type === reqType && !m.usedThisTurn && !selectedRawIds.includes(m.id)).length === 0 ? (
                                                <div style={{ color: '#555', fontStyle: 'italic', fontSize: '0.8rem' }}>No disponible en inventario</div>
                                            ) : (
                                                inventoryCards.rawMaterials
                                                    .filter(m => m.type === reqType && !m.usedThisTurn && !selectedRawIds.includes(m.id))
                                                    .map(card => {
                                                        const hasRoute = selectedBaseId ? checkRoute(card.country!, selectedBaseId, currentPlayerIndex) : false;
                                                        return (

                                                            <button
                                                                key={card.id}
                                                                disabled={!hasRoute}
                                                                onClick={() => {
                                                                    if (!hasRoute) return;
                                                                    const newIds = [...selectedRawIds];
                                                                    newIds[idx] = card.id;
                                                                    setSelectedRawIds(newIds);
                                                                }}
                                                                style={{
                                                                    padding: '8px',
                                                                    backgroundColor: hasRoute ? '#0a0a0a' : '#220000',
                                                                    border: hasRoute ? '1px dashed #444' : '1px solid #550000',
                                                                    color: hasRoute ? '#aaa' : '#660000',
                                                                    cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                                    textAlign: 'left',
                                                                    display: 'flex', justifyContent: 'space-between'
                                                                }}
                                                            >
                                                                <span>Desde: {REGIONS.find(r => r.id === card.country)?.title}</span>
                                                                {!hasRoute && <span style={{ fontSize: '0.6rem' }}>SIN RUTA</span>}
                                                            </button>
                                                        );
                                                    })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={handleActivate}
                    disabled={!canActivate}
                    style={{
                        width: '100%',
                        marginTop: '30px',
                        padding: '15px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        backgroundColor: canActivate ? '#00ff00' : '#002200',
                        color: canActivate ? '#000' : '#004400',
                        border: canActivate ? '2px solid #00ff00' : '2px solid #004400',
                        cursor: canActivate ? 'pointer' : 'not-allowed',
                        textTransform: 'uppercase',
                        boxShadow: canActivate ? '0 0 20px rgba(0, 255, 0, 0.5)' : 'none',
                        transition: 'all 0.3s'
                    }}
                >
                    {canActivate ? 'INICIAR OPERACIÓN ESPECIAL' : (isAntartic && !hasFullControl ? 'REQUISITOS DE TERRITORIO PENDIENTES' : 'PENDIENTE DE RECURSOS')}
                </button>
                {!hasFullControl && isAntartic && (
                    <div style={{ color: '#ff4444', fontSize: '0.8rem', textAlign: 'center', marginTop: '10px' }}>
                        Requiere control total de: Chile, Argentina, Australia y Sudáfrica.
                    </div>
                )}
            </div>
        </div>
    );
};
