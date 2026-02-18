import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { RegionData } from '../../../../data/mapRegions';
import type { TerritoryCard } from '../../../../types/productionTypes';
import type { SpecialCard } from '../../../../types/playerTypes';

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
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex } = state; // owners not needed explicitly for supplies if using hook? hook uses state.owners internally
    const { checkRoute } = useSupplyRoute();

    const [selectedEnergySupplyId, setSelectedEnergySupplyId] = useState<string | null>(null);

    const countryName = REGIONS.find(r => r.id === targetCountry)?.title || targetCountry;

    const player = players[currentPlayerIndex];

    // Check existing plant
    // "hasExistingPlant" logic
    // We check if any rawMaterial is a desalinization plant in this country
    const alreadyHasPlant = player?.inventory.rawMaterials.some(
        c => c.type === 'AGUA_DULCE' && c.country === targetCountry
    ) || false;

    // Get energy supplies with route check
    const energySupplies = player?.supplies.energy.filter(supply => {
        // useSupplyRoute hook
        return checkRoute(supply.originCountry, targetCountry, currentPlayerIndex);
    }) || [];

    const selectedSupply = energySupplies.find(s => s.id === selectedEnergySupplyId);
    const canComplete = !alreadyHasPlant && selectedSupply;

    const handleComplete = () => {
        if (!canComplete || !selectedSupply) return;

        // 1. Consume energy supply - Update Player State
        // In the original, it filtered the supply out.
        // We can't easily "remove one supply" via a generic reducer action unless we update the whole player or have a REMOVE_SUPPLY action.
        // The original used setPlayers with a map.
        // GameContext has 'UPDATE_PLAYER'.

        // Let's use UPDATE_PLAYERS_FN style or similar if available, or just construct the new player object and use UPDATE_PLAYER.

        // Actually, let's look at GameContext actions.
        // We don't have a "REMOVE_SUPPLY" action. We have "ADD_SUPPLY".
        // We can use "UPDATE_PLAYER" to set the new supplies list.

        const newEnergySupplies = player.supplies.energy.filter(s => s.id !== selectedSupply.id);

        const newRawMaterial: TerritoryCard = {
            id: `desalinization-${targetCountry}-${Date.now()}`,
            type: 'AGUA_DULCE',
            category: 'rawMaterial',
            country: targetCountry,
            usedThisTurn: false
        };

        const newSpecialCard: SpecialCard = {
            id: `special-desalination-${targetCountry}-${Date.now()}`,
            type: 'PLANTA_DESALINIZADORA',
            name: 'PLANTA DESALINIZADORA',
            description: `Planta de desalinización operativa en ${countryName}. Genera AGUA DULCE.`,
            originCountry: targetCountry,
            createdAt: Date.now()
        };

        // Dispatch comprehensive update
        // We can do it in one big UPDATE_PLAYER
        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    supplies: {
                        ...player.supplies,
                        energy: newEnergySupplies
                    },
                    inventory: {
                        ...player.inventory,
                        rawMaterials: [...player.inventory.rawMaterials, newRawMaterial]
                    },
                    specialCards: [...player.specialCards, newSpecialCard]
                }
            }
        });

        onSuccess(countryName);
        setSelectedEnergySupplyId(null);
        onClose();
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 8200,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#001a33',
                border: '3px solid #00aaff',
                padding: '40px',
                width: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(0, 170, 255, 0.3)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#00aaff', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>
                        💧 PLANTA DE DESALINIZACIÓN
                    </h2>
                    <button
                        onClick={() => {
                            setSelectedEnergySupplyId(null);
                            onClose();
                        }}
                        style={{ background: 'none', border: 'none', color: '#00aaff', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

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
            </div>
        </div>
    );
};
