import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { SpecialCard } from '../../../../types/playerTypes';

interface LegadoOtomanoMissionModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (playerName: string) => void;
    onOpenInventory: () => void;
    playerIndex: number;
}

export const LegadoOtomanoMissionModal: React.FC<LegadoOtomanoMissionModalProps> = ({
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

    const hasTurkey = owners['turquia'] === player.id || owners['turquia'] === playerIndex;
    const foodSupplies = player.supplies.food || [];
    const manufactureSupplies = player.supplies.manufacture || [];
    const energySupplies = player.supplies.energy || [];

    const canComplete = hasTurkey && selectedFoodId && selectedManufactureId && selectedEnergyId;

    const handleComplete = () => {
        if (!canComplete) return;

        // Create new special card
        const newSpecialCard: SpecialCard = {
            id: `otomano-${Date.now()}`,
            type: 'LEGADO_OTOMANO',
            name: 'OPERACIÓN LEGADO OTOMANO',
            description: 'Bonus +1 Infantería en Turquía, Egipto, Arabia y Grecia.',
            originCountry: 'turquia',
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
                    legadoOtomanoActive: true,
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
                backgroundColor: '#00051a',
                border: '2px solid #0088ff',
                boxShadow: '0 0 50px rgba(0, 136, 255, 0.3)',
                color: '#ccddee',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #0088ff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(0, 136, 255, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        OPERACIÓN LEGADO OTOMANO
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#0088ff' }}>
                        RESTAURACIÓN DEL IMPERIO
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#0088ff', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Turkey Control */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasTurkey ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE TURQUÍA (BASE)</div>
                        </div>

                        {/* Food Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ALIMENTOS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.filter(s => checkRoute(s.originCountry, 'turquia', playerIndex)).length > 0 ? (
                                    foodSupplies.filter(s => checkRoute(s.originCountry, 'turquia', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedFoodId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedFoodId === s.id ? '#0088ff' : '#001122',
                                                color: selectedFoodId === s.id ? '#000' : '#0088ff',
                                                border: `1px solid #0088ff`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ALIMENTOS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(0,136,255,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manufacture Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE MANUFACTURAS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {manufactureSupplies.filter(s => checkRoute(s.originCountry, 'turquia', playerIndex)).length > 0 ? (
                                    manufactureSupplies.filter(s => checkRoute(s.originCountry, 'turquia', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedManufactureId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedManufactureId === s.id ? '#0088ff' : '#001122',
                                                color: selectedManufactureId === s.id ? '#000' : '#0088ff',
                                                border: `1px solid #0088ff`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            MANUFACTURAS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(0,136,255,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Energy Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ENERGÍA:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {energySupplies.filter(s => checkRoute(s.originCountry, 'turquia', playerIndex)).length > 0 ? (
                                    energySupplies.filter(s => checkRoute(s.originCountry, 'turquia', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedEnergyId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedEnergyId === s.id ? '#0088ff' : '#001122',
                                                color: selectedEnergyId === s.id ? '#000' : '#0088ff',
                                                border: `1px solid #0088ff`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ENERGÍA ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(0,136,255,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#0088ff', border: '1px solid #0088ff',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 136, 255, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #0088ff', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#0088ff' }}>LEGADO OTOMANO</h3>
                        <div style={{ backgroundColor: 'rgba(0, 136, 255, 0.1)', padding: '15px', border: '1px dashed #0088ff' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                RESTAURACIÓN DEL IMPERIO
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Recupera el control sobre los tres continentes.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#66aaff' }}>
                                <li>+1 Infantería (Fijo)</li>
                                <li>Duración: Permanente (Hasta perder batalla)</li>
                                <li>Países: Turquía, Egipto, Arabia, Grecia</li>
                                <li>Pérdida: Al perder batalla atacando o defendiendo con estos países</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', color: '#0088ff', border: '1px solid #004488', cursor: 'pointer' }}
                    >
                        CANCELAR
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={handleComplete}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canComplete ? '#002233' : '#0088ff',
                            color: !canComplete ? '#004466' : '#000',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer'
                        }}
                    >
                        INICIAR CONQUISTA
                    </button>
                </div>
            </div>
        </div>
    );
};
