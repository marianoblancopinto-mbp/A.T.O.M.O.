import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useMyPlayer } from '../../../../hooks/useMyPlayer';
import { MissionModalBase } from '../MissionModalBase';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { RegionData } from '../../../../data/mapRegions';

interface DesalinizacionMissionModalProps {
    show: boolean;
    targetCountry: string;
    REGIONS: RegionData[];
    onClose: () => void;
    onSuccess: (countryName: string) => void;
    onOpenInventory: () => void;
}

export const DesalinizacionMissionModal: React.FC<DesalinizacionMissionModalProps> = ({
    show,
    targetCountry,
    REGIONS,
    onClose,
    onSuccess,
    onOpenInventory
}) => {
    const { state } = useGameContext();
    const actions = useGameActions();
    const { myPlayerIndex } = useMyPlayer();
    const { players } = state; // owners not needed explicitly for supplies if using hook? hook uses state.owners internally
    const { checkRoute } = useSupplyRoute();

    const [selectedEnergySupplyId, setSelectedEnergySupplyId] = useState<string | null>(null);

    const countryName = REGIONS.find(r => r.id === targetCountry)?.title || targetCountry;

    const player = players[myPlayerIndex];

    // Check existing plant
    // "hasExistingPlant" logic
    // We check if any rawMaterial is a desalinization plant in this country
    const alreadyHasPlant = player?.inventory.rawMaterials.some(
        c => c.type === 'AGUA_DULCE' && c.country === targetCountry
    ) || false;

    // Get energy supplies with route check
    const energySupplies = player?.supplies.energy.filter(supply => {
        // useSupplyRoute hook
        return checkRoute(supply.originCountry, targetCountry, myPlayerIndex);
    }) || [];

    const selectedSupply = energySupplies.find(s => s.id === selectedEnergySupplyId);
    const canComplete = !alreadyHasPlant && selectedSupply;

    const handleComplete = () => {
        if (!canComplete || !selectedSupply) return;
        actions.activateMission({ missionId: 'planta_desalinizacion', baseRegionId: targetCountry, supplyIds: [selectedSupply.id] });

        onSuccess(countryName);
        setSelectedEnergySupplyId(null);
        onClose();
    };

    if (!show) return null;

    return (
        <MissionModalBase title="💧 PLANTA DE DESALINIZACIÓN" type="activation" onClose={onClose} width="700px">
            <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#00aaff', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Location Status */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{alreadyHasPlant ? '❌' : '✅'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>ESPACIO DISPONIBLE EN {countryName.toUpperCase()}</div>
                        </div>

                        {/* Energy Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ENERGÍA:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {energySupplies.length > 0 ? (
                                    energySupplies.map(supply => (
                                        <div
                                            key={supply.id}
                                            onClick={() => setSelectedEnergySupplyId(supply.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedEnergySupplyId === supply.id ? '#00aaff' : '#001122',
                                                color: selectedEnergySupplyId === supply.id ? '#000' : '#00aaff',
                                                border: `1px solid #00aaff`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ENERGÍA ({supply.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(0,170,255,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible con ruta válida.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#00aaff', border: '1px solid #00aaff',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 170, 255, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #00aaff', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#00aaff' }}>DESALINIZACIÓN</h3>
                        <div style={{ backgroundColor: 'rgba(0, 170, 255, 0.1)', padding: '15px', border: '1px dashed #00aaff' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                AGUA DULCE
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Transforma agua de mar en agua potable para el territorio.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#66ccff' }}>
                                <li>Genera Recurso: AGUA DULCE</li>
                                <li>Ubicación: {countryName}</li>
                                <li>Requisito: Suministro Energía</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={() => {
                            setSelectedEnergySupplyId(null);
                            onClose();
                        }}
                        style={{
                            flex: 1,
                            padding: '15px',
                            backgroundColor: 'transparent',
                            color: '#ccc',
                            border: '1px solid #666',
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
                            flex: 1,
                            padding: '15px',
                            backgroundColor: !canComplete ? '#002233' : '#00aaff',
                            color: !canComplete ? '#004466' : '#000',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer',
                            fontFamily: 'monospace',
                            boxShadow: !canComplete ? 'none' : '0 0 20px rgba(0, 170, 255, 0.4)'
                        }}
                    >
                        CONSTRUIR PLANTA
                    </button>
                </div>
                    </MissionModalBase>
    );
};
