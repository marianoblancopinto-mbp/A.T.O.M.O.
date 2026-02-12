import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { RegionData } from '../../../../data/mapRegions';
import type { SupplyItem } from '../../../../types/productionTypes';
import type { SpecialCard } from '../../../../types/playerTypes';

interface GeothermalMissionModalProps {
    show: boolean;
    onClose: () => void;
    targetCountry: string;
    REGIONS: RegionData[];
    onOpenInventory: () => void;
    onSuccess: (countryName: string) => void;
}

export const GeothermalMissionModal: React.FC<GeothermalMissionModalProps> = ({
    show,
    onClose,
    targetCountry,
    REGIONS,
    onOpenInventory,
    onSuccess
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners, productionDeck } = state;
    const { checkRoute } = useSupplyRoute();

    const [selectedGeothermalTechId, setSelectedGeothermalTechId] = useState<string | null>(null);
    const [selectedGeothermalIronId, setSelectedGeothermalIronId] = useState<string | null>(null);

    const countryName = REGIONS.find(r => r.id === targetCountry)?.title || targetCountry;

    // Requirements
    const hasControl = owners[targetCountry] === currentPlayerIndex;
    const player = players[currentPlayerIndex];

    // Filter available resources
    // Logic moved from TegMap.tsx
    // 1. Get cards from ProductionDeck that belong to owned territories + Inventory cards
    const ownedTerritories = Object.entries(owners)
        .filter(([_, ownerIdx]) => ownerIdx === currentPlayerIndex)
        .map(([regionId]) => regionId);

    const territoryTechs = productionDeck?.technologies.filter(card =>
        ownedTerritories.includes(card.country)) || [];
    const territoryRaws = productionDeck?.rawMaterials.filter(card =>
        ownedTerritories.includes(card.country)) || [];

    const allTechnologies = [...territoryTechs, ...(player?.inventory.technologies || [])];
    const allRawMaterials = [...territoryRaws, ...(player?.inventory.rawMaterials || [])];

    // 2. Filter specific types
    const heavyTechs = allTechnologies.filter(c => c.type === 'INDUSTRIA_PESADA' && !c.usedThisTurn);

    // 3. Filter Iron with Route Check using the new Hook
    const ironMaterials = allRawMaterials.filter(c => {
        if (c.type !== 'HIERRO' || c.usedThisTurn) return false;
        // Use the new hook!
        return checkRoute(c.country!, targetCountry, currentPlayerIndex);
    });

    const canComplete = hasControl && selectedGeothermalTechId !== null && selectedGeothermalIronId !== null;

    const handleComplete = () => {
        if (!canComplete || !selectedGeothermalTechId || !selectedGeothermalIronId) return;

        // 1. Consume cards
        dispatch({ type: 'MARK_CARD_AS_USED', payload: { cardId: selectedGeothermalTechId, category: 'technology' } });
        dispatch({ type: 'MARK_CARD_AS_USED', payload: { cardId: selectedGeothermalIronId, category: 'rawMaterial' } });

        // 2. Generate Energy Supply
        const newSupply: SupplyItem = {
            id: `energy-geo-${targetCountry}-${Date.now()}`,
            type: 'energy',
            originCountry: targetCountry
        };
        dispatch({ type: 'ADD_SUPPLY', payload: { playerIndex: currentPlayerIndex, supply: newSupply } });

        // 3. Generate Special Card (Persistence)
        const newSpecialCard: SpecialCard = {
            id: `geo-plant-${targetCountry}-${Date.now()}`,
            type: 'PLANTA_GEOTERMICA',
            name: 'PLANTA GEOTÉRMICA',
            originCountry: targetCountry,
            description: 'Genera 1 suministro de Energía al inicio de cada turno.',
            createdAt: Date.now()
        };
        dispatch({ type: 'ADD_SPECIAL_CARD', payload: { playerIndex: currentPlayerIndex, card: newSpecialCard } });

        // 4. Notify & Close
        onSuccess(countryName);
        onClose();
    };

    if (!show) return null;

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
                backgroundColor: '#1a0500',
                border: '2px solid #ff4400',
                boxShadow: '0 0 50px rgba(255, 68, 0, 0.3)',
                color: '#ffccaa',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #ff4400',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(255, 68, 0, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        OPERACIÓN: ENERGÍA GEOTÉRMICA
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#ff4400' }}>
                        PROYECTO DE INFRAESTRUCTURA
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.1em', color: '#fff' }}>
                            REQUISITOS DE CONSTRUCCIÓN:
                        </div>

                        {/* Control Check */}
                        <div style={{
                            padding: '10px', marginBottom: '10px',
                            backgroundColor: hasControl ? '#331100' : '#220000',
                            border: `1px solid ${hasControl ? '#ff4400' : '#ff0000'}`,
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <span>{hasControl ? '✅' : '❌'}</span>
                            <span>CONTROL DE {countryName.toUpperCase()} (TERRITORIO BASE)</span>
                        </div>

                        {/* Tech Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.8rem' }}>TECNOLOGÍA (INDUST. PESADA):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {heavyTechs.map(card => (
                                    <div
                                        key={card.id}
                                        onClick={() => setSelectedGeothermalTechId(card.id)}
                                        style={{
                                            padding: '8px',
                                            backgroundColor: selectedGeothermalTechId === card.id ? '#ff4400' : '#331100',
                                            color: selectedGeothermalTechId === card.id ? '#000' : '#ffccaa',
                                            border: '1px solid #ff4400',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        INDUSTRIA PESADA ({card.country})
                                    </div>
                                ))}
                                {heavyTechs.length === 0 && <div style={{ color: '#ff4444', fontSize: '0.8rem' }}>No disponible.</div>}
                            </div>
                        </div>

                        {/* Raw Material Selection */}
                        <div>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.8rem' }}>MATERIA PRIMA (HIERRO):</div>
                            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                {ironMaterials.length > 0 ? ironMaterials.map(card => (
                                    <div
                                        key={card.id}
                                        onClick={() => setSelectedGeothermalIronId(card.id)}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: selectedGeothermalIronId === card.id ? '#ff4400' : '#331100',
                                            color: selectedGeothermalIronId === card.id ? '#000' : '#ffccaa',
                                            border: '1px solid #ff4400',
                                            cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between',
                                            marginBottom: '5px'
                                        }}
                                    >
                                        <span>HIERRO ({card.country})</span>
                                        <span style={{ fontSize: '0.8em' }}>RUTA OK</span>
                                    </div>
                                )) : (
                                    <div style={{ color: '#ff4444', fontStyle: 'italic' }}>
                                        No hay Hierro disponible con ruta válida a {countryName}.
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    onClick={onOpenInventory}
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#331100',
                                        color: '#ff4400',
                                        border: '1px solid #ff4400',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        width: '100%'
                                    }}
                                >
                                    ABRIR INVENTARIO GLOBAL
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #ff4400', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#ff8844' }}>RESULTADO</h3>
                        <div style={{ backgroundColor: 'rgba(255, 68, 0, 0.1)', padding: '15px', border: '1px dashed #ff4400' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                SUMINISTRO ENERGÉTICO
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Se generará una unidad de energía aprovechando el calor volcánico de {countryName}.
                            </p>

                            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#aa5500' }}>
                                COSTO DE OPERACIÓN:
                                <ul style={{ paddingLeft: '20px' }}>
                                    <li>1x Industria Pesada (Consumible)</li>
                                    <li>1x Hierro (Consumible)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex', gap: '20px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: 'transparent',
                            color: '#ff4400',
                            border: '1px solid #666',
                            cursor: 'pointer',
                            fontFamily: 'monospace'
                        }}
                    >
                        IMPOSIBLE AHORA
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={handleComplete}
                        style={{
                            flex: 1,
                            padding: '15px',
                            backgroundColor: !canComplete ? '#331100' : '#ff4400',
                            color: !canComplete ? '#662200' : '#000',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer',
                            fontFamily: 'monospace',
                            boxShadow: !canComplete ? 'none' : '0 0 20px rgba(255, 68, 0, 0.4)'
                        }}
                    >
                        INICIAR EXTRACCIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};
