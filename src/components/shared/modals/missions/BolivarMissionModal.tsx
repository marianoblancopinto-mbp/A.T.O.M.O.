import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { SpecialCard } from '../../../../types/playerTypes';

interface BolivarMissionModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (playerName: string) => void;
    onOpenInventory: () => void;
    playerIndex: number;
}

export const BolivarMissionModal: React.FC<BolivarMissionModalProps> = ({
    show,
    onClose,
    onSuccess,
    onOpenInventory,
    playerIndex
}) => {
    const { state, dispatch } = useGameContext();
    const { players, owners } = state;
    const { checkRoute } = useSupplyRoute();

    const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
    const [selectedManufactureId, setSelectedManufactureId] = useState<string | null>(null);
    const [selectedEnergyId, setSelectedEnergyId] = useState<string | null>(null);

    const player = players[playerIndex];
    if (!player) return null;

    const hasVenezuela = owners['venezuela'] === player.id || owners['venezuela'] === playerIndex;
    const foodSupplies = player.supplies.food || [];
    const manufactureSupplies = player.supplies.manufacture || [];
    const energySupplies = player.supplies.energy || [];

    const canComplete = hasVenezuela && selectedFoodId && selectedManufactureId && selectedEnergyId;

    const handleComplete = () => {
        if (!canComplete) return;

        // Create new special card
        const newSpecialCard: SpecialCard = {
            id: `bolivar-${Date.now()}`,
            type: 'BOLIVAR',
            name: 'OPERACIÓN BOLÍVAR',
            description: 'Bonus +1 Infantería en Venezuela, Colombia, Panamá y Perú.',
            originCountry: 'venezuela',
            createdAt: Date.now()
        };

        // Prepare new supplies lists
        const newFood = player.supplies.food.filter(s => s.id !== selectedFoodId);
        const newManufacture = player.supplies.manufacture.filter(s => s.id !== selectedManufactureId);
        const newEnergy = player.supplies.energy.filter(s => s.id !== selectedEnergyId);

        // Dispatch Update
        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: playerIndex,
                data: {
                    supplies: {
                        food: newFood,
                        manufacture: newManufacture,
                        energy: newEnergy
                    },
                    bolivarActive: true,
                    specialCards: [...player.specialCards, newSpecialCard]
                }
            }
        });

        onSuccess(player.name);
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
                backgroundColor: '#1a1a00',
                border: '2px solid #ffcc00',
                boxShadow: '0 0 50px rgba(255, 204, 0, 0.3)',
                color: '#eeddcc',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header - Cleaned up to match Gengis/Alejandro style */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #ffcc00',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(255, 204, 0, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px', color: '#ffcc00' }}>
                        OPERACIÓN BOLÍVAR
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#ffcc00' }}>
                        EL SUEÑO DEL LIBERTADOR
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#ffcc00', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Venezuela Control */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasVenezuela ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE VENEZUELA (BASE)</div>
                        </div>

                        {/* Food Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ALIMENTOS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.filter(s => checkRoute(s.originCountry, 'venezuela', playerIndex)).length > 0 ? (
                                    foodSupplies.filter(s => checkRoute(s.originCountry, 'venezuela', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedFoodId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedFoodId === s.id ? '#ffcc00' : '#221111',
                                                color: selectedFoodId === s.id ? '#000' : '#ffcc00',
                                                border: `1px solid #ffcc00`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ALIMENTOS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ffcc00', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,204,0,0.05)', border: '1px dashed #ffcc00' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manufacture Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE MANUFACTURAS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {manufactureSupplies.filter(s => checkRoute(s.originCountry, 'venezuela', playerIndex)).length > 0 ? (
                                    manufactureSupplies.filter(s => checkRoute(s.originCountry, 'venezuela', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedManufactureId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedManufactureId === s.id ? '#ffcc00' : '#221111',
                                                color: selectedManufactureId === s.id ? '#000' : '#ffcc00',
                                                border: `1px solid #ffcc00`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            MANUFACTURAS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ffcc00', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,204,0,0.05)', border: '1px dashed #ffcc00' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Energy Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ENERGÍA:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {energySupplies.filter(s => checkRoute(s.originCountry, 'venezuela', playerIndex)).length > 0 ? (
                                    energySupplies.filter(s => checkRoute(s.originCountry, 'venezuela', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedEnergyId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedEnergyId === s.id ? '#ffcc00' : '#221111',
                                                color: selectedEnergyId === s.id ? '#000' : '#ffcc00',
                                                border: `1px solid #ffcc00`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ENERGÍA ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ffcc00', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,204,0,0.05)', border: '1px dashed #ffcc00' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#ffcc00', border: '1px solid #ffcc00',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 204, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #ffcc00', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#ffcc00' }}>OPERACIÓN BOLÍVAR</h3>
                        <div style={{ backgroundColor: 'rgba(255, 204, 0, 0.1)', padding: '15px', border: '1px dashed #ffcc00' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                LA GRAN COLOMBIA
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Une a las naciones bajo un solo estandarte.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#ffcc88' }}>
                                <li>+1 Infantería (Estratégico)</li>
                                <li>Permanencia: Hasta derrota militar</li>
                                <li>Regiones: Venezuela, Colombia, Panamá, Perú</li>
                                <li>Pérdida: Al perder batalla atacando/defendiendo en estas zonas</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', color: '#ffcc00', border: '1px solid #886600', cursor: 'pointer' }}
                    >
                        CANCELAR
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={handleComplete}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canComplete ? '#332a00' : '#ffcc00',
                            color: !canComplete ? '#665500' : '#000',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer'
                        }}
                    >
                        UNIFICAR NACIONES
                    </button>
                </div>
            </div>
        </div>
    );
};
