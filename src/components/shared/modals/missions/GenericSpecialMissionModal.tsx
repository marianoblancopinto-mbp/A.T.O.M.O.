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
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '850px',
                backgroundColor: '#001a00',
                border: '2px solid #00ff00',
                boxShadow: '0 0 50px rgba(0, 255, 0, 0.3)',
                color: '#ccffcc',
                fontFamily: 'monospace',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #00ff00',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        {mission.title}
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#00ff00' }}>
                        OPERACIÓN ESPECIAL
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#00ff00', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Base Selection Step */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>1. BASE DE OPERACIONES:</div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {eligibleBases.length === 0 ? (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,0,0,0.05)', border: '1px dashed #ff4444', width: '100%' }}>
                                        No controlas ninguna región válida.
                                    </div>
                                ) : eligibleBases.map(baseId => (
                                    <button
                                        key={baseId}
                                        onClick={() => setSelectedBaseId(baseId)}
                                        style={{
                                            flex: 1, minWidth: '120px', padding: '10px',
                                            backgroundColor: selectedBaseId === baseId ? '#00ff00' : '#002200',
                                            color: selectedBaseId === baseId ? '#000' : '#00ff00',
                                            border: '1px solid #00ff00',
                                            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {REGIONS.find(r => r.id === baseId)?.title.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ opacity: selectedBaseId ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                            {/* Technology Slots */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>2. RECURSOS TECNOLÓGICOS:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {mission.requirements.technology.map((reqType, idx) => {
                                        const selectedId = selectedTechIds[idx];
                                        const selectedData = selectedId ? inventoryCards.technologies.find(t => t.id === selectedId) : null;
                                        const available = inventoryCards.technologies.filter(t => t.type === reqType && !t.usedThisTurn && !selectedTechIds.includes(t.id));

                                        return (
                                            <div key={idx}>
                                                <div style={{ fontSize: '0.75rem', color: '#66aa66', marginBottom: '4px' }}>REQUERIDO: {TECHNOLOGY_DATA[reqType].name.toUpperCase()}</div>
                                                {selectedData ? (
                                                    <div
                                                        onClick={() => {
                                                            const newIds = [...selectedTechIds];
                                                            newIds.splice(idx, 1);
                                                            setSelectedTechIds(newIds);
                                                        }}
                                                        style={{
                                                            padding: '10px', backgroundColor: '#00ff00', color: '#000',
                                                            border: '1px solid #00ff00', cursor: 'pointer', textAlign: 'center',
                                                            fontWeight: 'bold', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        {TECHNOLOGY_DATA[selectedData.type as TechnologyType].name.toUpperCase()} (SELECCIONADO)
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        {available.length > 0 ? available.map(card => (
                                                            <button
                                                                key={card.id}
                                                                onClick={() => {
                                                                    const newIds = [...selectedTechIds];
                                                                    newIds[idx] = card.id;
                                                                    setSelectedTechIds(newIds);
                                                                }}
                                                                style={{
                                                                    padding: '8px', backgroundColor: '#002200', border: '1px dashed #00ff00',
                                                                    color: '#00ff00', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center'
                                                                }}
                                                            >
                                                                USAR: {REGIONS.find(r => r.id === card.country)?.title.toUpperCase()}
                                                            </button>
                                                        )) : (
                                                            <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '5px' }}>No disponible en inventario.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Raw Material Slots */}
                            <div>
                                <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>3. MATERIAS PRIMAS:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {mission.requirements.rawMaterials.map((reqType, idx) => {
                                        const selectedId = selectedRawIds[idx];
                                        const selectedData = selectedId ? inventoryCards.rawMaterials.find(r => r.id === selectedId) : null;
                                        const available = inventoryCards.rawMaterials.filter(m => m.type === reqType && !m.usedThisTurn && !selectedRawIds.includes(m.id));

                                        return (
                                            <div key={idx}>
                                                <div style={{ fontSize: '0.75rem', color: '#66aa66', marginBottom: '4px' }}>REQUERIDO: {RAW_MATERIAL_DATA[reqType].name.toUpperCase()}</div>
                                                {selectedData ? (
                                                    <div
                                                        onClick={() => {
                                                            const newIds = [...selectedRawIds];
                                                            newIds.splice(idx, 1);
                                                            setSelectedRawIds(newIds);
                                                        }}
                                                        style={{
                                                            padding: '10px', backgroundColor: '#00ff00', color: '#000',
                                                            border: '1px solid #00ff00', cursor: 'pointer', textAlign: 'center',
                                                            fontWeight: 'bold', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        {RAW_MATERIAL_DATA[selectedData.type as RawMaterialType].name.toUpperCase()} (SELECCIONADO)
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        {available.length > 0 ? available.map(card => {
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
                                                                        backgroundColor: hasRoute ? '#002200' : 'rgba(255,0,0,0.05)',
                                                                        border: hasRoute ? '1px dashed #00ff00' : '1px solid #440000',
                                                                        color: hasRoute ? '#00ff00' : '#440000',
                                                                        cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                                        fontSize: '0.8rem', textAlign: 'center'
                                                                    }}
                                                                >
                                                                    {REGIONS.find(r => r.id === card.country)?.title.toUpperCase()} {hasRoute ? '' : '(SIN RUTA)'}
                                                                </button>
                                                            );
                                                        }) : (
                                                            <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '5px' }}>No disponible.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #00ff00', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#00ff00' }}>INFORME DE MISIÓN</h3>
                        <div style={{ backgroundColor: 'rgba(0, 255, 0, 0.1)', padding: '15px', border: '1px dashed #00ff00' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px', textTransform: 'uppercase' }}>
                                OBJETIVO TÁCTICO
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4', color: '#aaffaa' }}>
                                {mission.lore}
                            </p>
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontWeight: 'bold', color: '#00ff00', fontSize: '0.85rem', marginBottom: '5px' }}>RESULTADO ESTIMADO:</div>
                                <p style={{ fontSize: '0.85em', color: '#88cc88', margin: 0 }}>
                                    {mission.description}
                                </p>
                            </div>
                        </div>

                        {isAntartic && (
                            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: hasFullControl ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', border: `1px solid ${hasFullControl ? '#00ff00' : '#ff4444'}` }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>CONTROL TERRITORIAL:</div>
                                <div style={{ fontSize: '0.75rem', color: hasFullControl ? '#00ff00' : '#ff4444' }}>
                                    {hasFullControl ? '✓ Control total de Hemisferio Sur' : '✗ Requiere control: Chile, Argentina, Australia y Sudáfrica.'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: 'transparent',
                            color: '#00ff00',
                            border: '1px solid #004400',
                            cursor: 'pointer',
                            fontFamily: 'monospace'
                        }}
                    >
                        CANCELAR
                    </button>
                    <button
                        disabled={!canActivate}
                        onClick={handleActivate}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canActivate ? '#002200' : '#00ff00',
                            color: !canActivate ? '#004400' : '#000',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            cursor: !canActivate ? 'not-allowed' : 'pointer',
                            boxShadow: !canActivate ? 'none' : '0 0 20px rgba(0, 255, 0, 0.4)',
                            textTransform: 'uppercase'
                        }}
                    >
                        {canActivate ? 'INICIAR OPERACIÓN' : 'RECURSOS PENDIENTES'}
                    </button>
                </div>
            </div>
        </div>
    );
};
