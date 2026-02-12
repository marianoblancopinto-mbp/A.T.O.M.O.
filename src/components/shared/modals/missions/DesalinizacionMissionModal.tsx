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

                <div style={{ backgroundColor: '#000', padding: '15px', marginBottom: '20px', border: '1px solid #004466', borderRadius: '4px' }}>
                    <div style={{ color: '#00aaff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        UBICACIÓN: {countryName}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: '1.5' }}>
                        "Las costas áridas del mundo esconden un recurso vital: el mar. Con la tecnología adecuada y suficiente energía, podemos convertir agua salada en el recurso más preciado: AGUA DULCE."
                    </div>
                </div>

                {alreadyHasPlant ? (
                    <div style={{
                        backgroundColor: '#332200',
                        padding: '20px',
                        border: '2px solid #ff9900',
                        borderRadius: '4px',
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        <div style={{ color: '#ff9900', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            ⚠️ INFRAESTRUCTURA EXISTENTE
                        </div>
                        <div style={{ color: '#ffcc66', fontSize: '0.9rem', marginTop: '10px' }}>
                            Ya existe una planta de desalinización en este territorio.
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            backgroundColor: '#001a1a',
                            padding: '20px',
                            border: '1px solid #00aaff',
                            borderRadius: '4px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ color: '#00aaff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                                REQUISITO: SUMINISTRO ENERGÉTICO
                            </div>

                            {energySupplies.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {energySupplies.map(supply => {
                                        const originName = REGIONS.find(r => r.id === supply.originCountry)?.title || supply.originCountry;
                                        const isSelected = selectedEnergySupplyId === supply.id;
                                        return (
                                            <button
                                                key={supply.id}
                                                onClick={() => setSelectedEnergySupplyId(supply.id)}
                                                style={{
                                                    padding: '12px 15px',
                                                    backgroundColor: isSelected ? '#00aaff' : '#002233',
                                                    color: isSelected ? '#000' : '#00aaff',
                                                    border: `2px solid ${isSelected ? '#00aaff' : '#004466'}`,
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontFamily: 'monospace',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.3rem' }}>⚡</span>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>Energía</div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Origen: {originName}</div>
                                                </div>
                                                {isSelected && <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ color: '#ff6666', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                                    No tienes suministros de energía con ruta válida a {countryName}.
                                </div>
                            )}
                        </div>

                        <div style={{
                            backgroundColor: '#1a1a00',
                            padding: '15px',
                            border: '1px solid #aaaa00',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#aaaa00', fontSize: '0.85rem', marginBottom: '10px' }}>
                                ¿No tienes suministros de energía?
                            </div>
                            <button
                                onClick={onOpenInventory}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#333300',
                                    color: '#ffff00',
                                    border: '1px solid #ffff00',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold'
                                }}
                            >
                                ABRIR INVENTARIO PARA PRODUCIR
                            </button>
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', gap: '20px' }}>
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
