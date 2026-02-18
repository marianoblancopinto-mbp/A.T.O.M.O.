import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { SpecialCard } from '../../../../types/playerTypes';

interface GengisKhanMissionModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (playerName: string) => void;
    onOpenInventory: () => void;
    playerIndex: number;
}

export const GengisKhanMissionModal: React.FC<GengisKhanMissionModalProps> = ({
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

    const hasMongolia = owners['mongolia'] === player.id || owners['mongolia'] === playerIndex;
    const foodSupplies = player.supplies.food || [];
    const manufactureSupplies = player.supplies.manufacture || [];
    const energySupplies = player.supplies.energy || [];

    const canComplete = hasMongolia && selectedFoodId && selectedManufactureId && selectedEnergyId;

    const handleComplete = () => {
        if (!canComplete) return;

        // Create new special card
        const newSpecialCard: SpecialCard = {
            id: `gengis-${Date.now()}`,
            type: 'GENGIS_KHAN',
            name: 'OPERACIÓN GENGIS KHAN',
            description: 'Bonus +1 Infantería en Mongolia, Kazajistán, China y Rusia.',
            originCountry: 'mongolia',
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
                    gengisKhanActive: true,
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
                backgroundColor: '#1a0505',
                border: '2px solid #ff4444',
                boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
                color: '#eeddcc',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #ff4444',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        OPERACIÓN GENGIS KHAN
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#ff4444' }}>
                        EL RUGIDO DEL LOBO
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#ff4444', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Mongolia Control */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasMongolia ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE MONGOLIA (BASE)</div>
                        </div>

                        {/* Food Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ALIMENTOS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.filter(s => checkRoute(s.originCountry, 'mongolia', playerIndex)).length > 0 ? (
                                    foodSupplies.filter(s => checkRoute(s.originCountry, 'mongolia', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedFoodId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedFoodId === s.id ? '#ff4444' : '#221111',
                                                color: selectedFoodId === s.id ? '#000' : '#ff4444',
                                                border: `1px solid #ff4444`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ALIMENTOS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,68,68,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manufacture Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE MANUFACTURAS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {manufactureSupplies.filter(s => checkRoute(s.originCountry, 'mongolia', playerIndex)).length > 0 ? (
                                    manufactureSupplies.filter(s => checkRoute(s.originCountry, 'mongolia', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedManufactureId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedManufactureId === s.id ? '#ff4444' : '#221111',
                                                color: selectedManufactureId === s.id ? '#000' : '#ff4444',
                                                border: `1px solid #ff4444`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            MANUFACTURAS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,68,68,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Energy Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ENERGÍA:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {energySupplies.filter(s => checkRoute(s.originCountry, 'mongolia', playerIndex)).length > 0 ? (
                                    energySupplies.filter(s => checkRoute(s.originCountry, 'mongolia', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedEnergyId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedEnergyId === s.id ? '#ff4444' : '#221111',
                                                color: selectedEnergyId === s.id ? '#000' : '#ff4444',
                                                border: `1px solid #ff4444`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ENERGÍA ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,68,68,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #ff4444',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #ff4444', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#ff4444' }}>GENGIS KHAN</h3>
                        <div style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', padding: '15px', border: '1px dashed #ff4444' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                EL IMPERIO ETERNO
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Domina las estepas centrales.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#ffaaaa' }}>
                                <li>+1 Infantería (Fijo)</li>
                                <li>Duración: Permanente (Hasta perder batalla)</li>
                                <li>Países: Mongolia, Kazajistán, China, Rusia</li>
                                <li>Pérdida: Al perder batalla atacando o defendiendo con estos países</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #884444', cursor: 'pointer' }}
                    >
                        CANCELAR
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={handleComplete}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canComplete ? '#330a0a' : '#ff4444',
                            color: !canComplete ? '#662222' : '#000',
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
