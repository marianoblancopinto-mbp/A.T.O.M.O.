import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { SpecialCard } from '../../../../types/playerTypes';

interface PacificFireMissionModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (playerName: string) => void;
    onOpenInventory: () => void;
    playerIndex: number;
}

export const PacificFireMissionModal: React.FC<PacificFireMissionModalProps> = ({
    show,
    onClose,
    onSuccess,
    onOpenInventory,
    playerIndex
}) => {
    const { state, dispatch } = useGameContext();
    const { players, owners } = state;
    const { checkRoute } = useSupplyRoute();

    const [selectedEnergyId, setSelectedEnergyId] = useState<string | null>(null);
    const [selectedManufactureId, setSelectedManufactureId] = useState<string | null>(null);
    const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

    const player = players[playerIndex];
    if (!player) return null;

    const hasJapan = owners['japon'] === player.id || owners['japon'] === playerIndex;
    const energySupplies = player.supplies.energy || [];
    const manufactureSupplies = player.supplies.manufacture || [];
    const foodSupplies = player.supplies.food || [];

    const canComplete = hasJapan && selectedEnergyId && selectedManufactureId && selectedFoodId;

    const handleComplete = () => {
        if (!canComplete) return;

        // Create new special card
        const newSpecialCard: SpecialCard = {
            id: `pacific-fire-${Date.now()}`,
            type: 'PACIFIC_FIRE',
            name: 'FUEGO DEL PACÍFICO',
            description: 'Bonus +1 Fuerza Aérea en Japón, Corea, Kamchatka y Filipinas.',
            originCountry: 'japon',
            createdAt: Date.now()
        };

        // Prepare new supplies lists
        const newEnergy = player.supplies.energy.filter(s => s.id !== selectedEnergyId);
        const newManufacture = player.supplies.manufacture.filter(s => s.id !== selectedManufactureId);
        const newFood = player.supplies.food.filter(s => s.id !== selectedFoodId);

        // Dispatch Update
        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: playerIndex,
                data: {
                    supplies: {
                        energy: newEnergy,
                        manufacture: newManufacture,
                        food: newFood
                    },
                    pacificFireActive: true,
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
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 8200,
            backdropFilter: 'blur(5px)',
            fontFamily: 'monospace'
        }}>
            <div style={{
                width: '900px',
                backgroundColor: '#001a33',
                border: '2px solid #00ffff',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.2)',
                color: '#ccf2ff',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header - Tactical Air Force Style */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #00ffff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(0, 255, 255, 0.05)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px', color: '#00ffff' }}>
                        FUEGO DEL PACÍFICO
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#00ffff', fontWeight: 'bold' }}>
                        SUPERIORIDAD TÁCTICA AÉREA
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#00ffff', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Japan Control */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasJapan ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE JAPÓN (BASE)</div>
                        </div>

                        {/* Energy Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ENERGÍA:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {energySupplies.filter(s => checkRoute(s.originCountry, 'japon', playerIndex)).length > 0 ? (
                                    energySupplies.filter(s => checkRoute(s.originCountry, 'japon', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedEnergyId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedEnergyId === s.id ? '#00ffff' : '#002b4d',
                                                color: selectedEnergyId === s.id ? '#000' : '#00ffff',
                                                border: `1px solid #00ffff`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ENERGÍA ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,0,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manufacture Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE MANUFACTURAS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {manufactureSupplies.filter(s => checkRoute(s.originCountry, 'japon', playerIndex)).length > 0 ? (
                                    manufactureSupplies.filter(s => checkRoute(s.originCountry, 'japon', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedManufactureId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedManufactureId === s.id ? '#00ffff' : '#002b4d',
                                                color: selectedManufactureId === s.id ? '#000' : '#00ffff',
                                                border: `1px solid #00ffff`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            MANUFACTURAS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,0,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Food Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ALIMENTOS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.filter(s => checkRoute(s.originCountry, 'japon', playerIndex)).length > 0 ? (
                                    foodSupplies.filter(s => checkRoute(s.originCountry, 'japon', playerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedFoodId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedFoodId === s.id ? '#00ffff' : '#002b4d',
                                                color: selectedFoodId === s.id ? '#000' : '#00ffff',
                                                border: `1px solid #00ffff`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ALIMENTOS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,0,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#00ffff', border: '1px solid #00ffff',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
                    </div>

                    {/* Info Panel - Tactical Briefing */}
                    <div style={{ width: '300px', borderLeft: '1px solid #00ffff', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#00ffff' }}>BRIEFING TÁCTICO</h3>
                        <div style={{ backgroundColor: 'rgba(0, 255, 255, 0.05)', padding: '15px', border: '1px dashed #00ffff' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                ASIA ORIENTAL
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4', color: '#88aabb' }}>
                                El despliegue aéreo asegura la superioridad sobre los cielos del Mar de Japón.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#00ffff' }}>
                                <li>+1 Fuerza Aérea (Dominio)</li>
                                <li>Regiones: Japón, Corea, Kamchatka, Filipinas</li>
                                <li>Efecto: Activo en ataque y defensa</li>
                                <li>Persistencia: Hasta derrota aérea/terrestre en zona</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', color: '#00ffff', border: '1px solid #008888', cursor: 'pointer' }}
                    >
                        ABORTAR
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={handleComplete}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canComplete ? '#003333' : '#00ffff',
                            color: !canComplete ? '#005555' : '#001a33',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase'
                        }}
                    >
                        DESPLEGAR FLOTA
                    </button>
                </div>
            </div>
        </div>
    );
};
