import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useMyPlayer } from '../../../../hooks/useMyPlayer';
import { MissionModalBase } from '../MissionModalBase';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { RegionData } from '../../../../data/mapRegions';

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
    const { state } = useGameContext();
    const actions = useGameActions();
    const { myPlayerIndex } = useMyPlayer();
    const { players, owners, productionDeck } = state;
    const { checkRoute } = useSupplyRoute();

    const [selectedGeothermalTechId, setSelectedGeothermalTechId] = useState<string | null>(null);
    const [selectedGeothermalIronId, setSelectedGeothermalIronId] = useState<string | null>(null);

    const countryName = REGIONS.find(r => r.id === targetCountry)?.title || targetCountry;

    // Requirements
    const hasControl = String(owners[targetCountry]) === String(players[myPlayerIndex]?.id);
    const player = players[myPlayerIndex];

    // Filter available resources
    // Logic moved from TegMap.tsx
    // 1. Get cards from ProductionDeck that belong to owned territories + Inventory cards
    const ownedTerritories = Object.entries(owners)
        .filter(([_, ownerId]) => String(ownerId) === String(players[myPlayerIndex]?.id))
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
        return checkRoute(c.country!, targetCountry, myPlayerIndex);
    });

    const canComplete = hasControl && selectedGeothermalTechId !== null && selectedGeothermalIronId !== null;

    const handleComplete = () => {
        if (!canComplete || !selectedGeothermalTechId || !selectedGeothermalIronId) return;
        actions.activateMission({ missionId: 'energia_geotermica', baseRegionId: targetCountry, techIds: [selectedGeothermalTechId!], rawIds: [selectedGeothermalIronId!] });

        onSuccess(countryName);
        onClose();
    };

    if (!show) return null;

    return (
        <MissionModalBase title="OPERACIÓN: ENERGÍA GEOTÉRMICA" type="activation" onClose={onClose} width="900px">
            <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#ff4400', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Control Check */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasControl ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE {countryName.toUpperCase()}</div>
                        </div>

                        {/* Tech Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>TECNOLOGÍA (IND. PESADA):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {heavyTechs.length > 0 ? (
                                    heavyTechs.map(card => (
                                        <div
                                            key={card.id}
                                            onClick={() => setSelectedGeothermalTechId(card.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedGeothermalTechId === card.id ? '#ff4400' : '#331100',
                                                color: selectedGeothermalTechId === card.id ? '#000' : '#ff4400',
                                                border: `1px solid #ff4400`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            INDUSTRIA PESADA ({card.country.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,68,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Iron Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>MATERIA PRIMA (HIERRO):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {ironMaterials.length > 0 ? (
                                    ironMaterials.map(card => (
                                        <div
                                            key={card.id}
                                            onClick={() => setSelectedGeothermalIronId(card.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedGeothermalIronId === card.id ? '#ff4400' : '#331100',
                                                color: selectedGeothermalIronId === card.id ? '#000' : '#ff4400',
                                                border: `1px solid #ff4400`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            HIERRO ({card.country.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,68,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible con ruta válida.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#ff4400', border: '1px solid #ff4400',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 68, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #ff4400', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#ff4400' }}>ENERGÍA GEOTÉRMICA</h3>
                        <div style={{ backgroundColor: 'rgba(255, 68, 0, 0.1)', padding: '15px', border: '1px dashed #ff4400' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                EXTRACCIÓN DE CALOR
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Aprovecha el calor volcánico para generar energía infinita.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#ffccaa' }}>
                                <li>Genera 1 Energía por turno</li>
                                <li>Ubicación: {countryName}</li>
                                <li>Requiere: Indust. Pesada + Hierro</li>
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
                    </MissionModalBase>
    );
};
