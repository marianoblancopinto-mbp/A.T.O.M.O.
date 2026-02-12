import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import type { SpecialCard } from '../../../../types/playerTypes';

interface AlejandroMissionModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (playerName: string) => void;
    onOpenInventory: () => void;
}

export const AlejandroMissionModal: React.FC<AlejandroMissionModalProps> = ({
    show,
    onClose,
    onSuccess,
    onOpenInventory
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const { checkRoute } = useSupplyRoute();

    const [selectedAlejandroFoodId, setSelectedAlejandroFoodId] = useState<string | null>(null);
    const [selectedAlejandroManufactureId, setSelectedAlejandroManufactureId] = useState<string | null>(null);
    const [selectedAlejandroEnergyId, setSelectedAlejandroEnergyId] = useState<string | null>(null);

    const player = players[currentPlayerIndex];
    if (!player) return null;

    const hasGreece = owners['grecia'] === currentPlayerIndex;
    const foodSupplies = player.supplies.food || [];
    const manufactureSupplies = player.supplies.manufacture || [];
    const energySupplies = player.supplies.energy || [];

    const canComplete = hasGreece && selectedAlejandroFoodId && selectedAlejandroManufactureId && selectedAlejandroEnergyId;

    const handleComplete = () => {
        if (!canComplete) return;

        // Create new special card
        const newSpecialCard: SpecialCard = {
            id: `alejandro-${Date.now()}`,
            type: 'ALEJANDRO_MAGNO',
            name: 'OPERACIÓN ALEJANDRO MAGNO',
            description: 'Bonus +1 Infantería y paso libre Grecia-Turquía.',
            originCountry: 'grecia',
            createdAt: Date.now()
        };

        // Prepare new supplies lists
        const newFood = player.supplies.food.filter(s => s.id !== selectedAlejandroFoodId);
        const newManufacture = player.supplies.manufacture.filter(s => s.id !== selectedAlejandroManufactureId);
        const newEnergy = player.supplies.energy.filter(s => s.id !== selectedAlejandroEnergyId);

        // Dispatch Update
        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    supplies: {
                        food: newFood,
                        manufacture: newManufacture,
                        energy: newEnergy
                    },
                    alejandroMagnoActive: true,
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
                backgroundColor: '#1a0500',
                border: '2px solid #ff8800',
                boxShadow: '0 0 50px rgba(255, 136, 0, 0.3)',
                color: '#ffddcc',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #ff8800',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(255, 136, 0, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        OPERACIÓN ALEJANDRO MAGNO
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#ff8800' }}>
                        CONQUISTA DE ORIENTE
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.1em', color: '#fff' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Greece Control */}
                        <div style={{
                            padding: '10px', marginBottom: '10px',
                            backgroundColor: hasGreece ? '#003300' : '#330000',
                            border: `1px solid ${hasGreece ? '#00ff00' : '#ff0000'}`,
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <span>{hasGreece ? '✅' : '❌'}</span>
                            <span>CONTROL DE GRECIA (BASE)</span>
                        </div>

                        {/* Food Supply Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.8rem' }}>SUMINISTRO DE ALIMENTOS:</div>
                            <div style={{ maxHeight: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.map(s => {
                                    // useSupplyRoute hook
                                    const hasRoute = checkRoute(s.originCountry, 'grecia', currentPlayerIndex);
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => hasRoute && setSelectedAlejandroFoodId(s.id)}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: !hasRoute ? '#220a00' : (selectedAlejandroFoodId === s.id ? '#ff8800' : '#221100'),
                                                color: !hasRoute ? '#553322' : (selectedAlejandroFoodId === s.id ? '#000' : '#ff8800'),
                                                border: `1px solid ${!hasRoute ? '#331100' : '#ff8800'}`,
                                                cursor: !hasRoute ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
                                                display: 'flex', justifyContent: 'space-between',
                                                opacity: !hasRoute ? 0.6 : 1
                                            }}
                                        >
                                            <span>Alimentos ({s.originCountry})</span>
                                            {!hasRoute && <span style={{ fontSize: '0.7em', color: '#883300' }}>SIN RUTA</span>}
                                        </div>
                                    );
                                })}
                                {foodSupplies.length === 0 && <div style={{ color: '#ff4444', fontSize: '0.8rem' }}>No disponible.</div>}
                            </div>
                            <button
                                onClick={onOpenInventory}
                                style={{
                                    marginTop: '10px', width: '100%', padding: '8px',
                                    backgroundColor: '#221100', color: '#ff8800', border: '1px solid #ff8800',
                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                                }}
                            >
                                ABRIR INVENTARIO ESTRATÉGICO
                            </button>
                        </div>

                        {/* Manufacture Supply Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.8rem' }}>SUMINISTRO DE MANUFACTURAS:</div>
                            <div style={{ maxHeight: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {manufactureSupplies.map(s => {
                                    const hasRoute = checkRoute(s.originCountry, 'grecia', currentPlayerIndex);
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => hasRoute && setSelectedAlejandroManufactureId(s.id)}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: !hasRoute ? '#220a00' : (selectedAlejandroManufactureId === s.id ? '#ff8800' : '#221100'),
                                                color: !hasRoute ? '#553322' : (selectedAlejandroManufactureId === s.id ? '#000' : '#ff8800'),
                                                border: `1px solid ${!hasRoute ? '#331100' : '#ff8800'}`,
                                                cursor: !hasRoute ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
                                                display: 'flex', justifyContent: 'space-between',
                                                opacity: !hasRoute ? 0.6 : 1
                                            }}
                                        >
                                            <span>Manufacturas ({s.originCountry})</span>
                                            {!hasRoute && <span style={{ fontSize: '0.7em', color: '#883300' }}>SIN RUTA</span>}
                                        </div>
                                    );
                                })}
                                {manufactureSupplies.length === 0 && <div style={{ color: '#ff4444', fontSize: '0.8rem' }}>No disponible.</div>}
                            </div>
                            <button
                                onClick={onOpenInventory}
                                style={{
                                    marginTop: '10px', width: '100%', padding: '8px',
                                    backgroundColor: '#221100', color: '#ff8800', border: '1px solid #ff8800',
                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                                }}
                            >
                                ABRIR INVENTARIO ESTRATÉGICO
                            </button>
                        </div>

                        {/* Energy Supply Selection */}
                        <div>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.8rem' }}>SUMINISTRO DE ENERGÍA:</div>
                            <div style={{ maxHeight: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {energySupplies.map(s => {
                                    const hasRoute = checkRoute(s.originCountry, 'grecia', currentPlayerIndex);
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => hasRoute && setSelectedAlejandroEnergyId(s.id)}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: !hasRoute ? '#220a00' : (selectedAlejandroEnergyId === s.id ? '#ff8800' : '#221100'),
                                                color: !hasRoute ? '#553322' : (selectedAlejandroEnergyId === s.id ? '#000' : '#ff8800'),
                                                border: `1px solid ${!hasRoute ? '#331100' : '#ff8800'}`,
                                                cursor: !hasRoute ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
                                                display: 'flex', justifyContent: 'space-between',
                                                opacity: !hasRoute ? 0.6 : 1
                                            }}
                                        >
                                            <span>Energía ({s.originCountry})</span>
                                            {!hasRoute && <span style={{ fontSize: '0.7em', color: '#883300' }}>SIN RUTA</span>}
                                        </div>
                                    );
                                })}
                                {energySupplies.length === 0 && <div style={{ color: '#ff4444', fontSize: '0.8rem' }}>No disponible.</div>}
                            </div>
                            <button
                                onClick={onOpenInventory}
                                style={{
                                    marginTop: '10px', width: '100%', padding: '8px',
                                    backgroundColor: '#221100', color: '#ff8800', border: '1px solid #ff8800',
                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                                }}
                            >
                                ABRIR INVENTARIO ESTRATÉGICO
                            </button>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #ff8800', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#ff8800' }}>LEGADO MACEDONIO</h3>
                        <div style={{ backgroundColor: 'rgba(255, 136, 0, 0.1)', padding: '15px', border: '1px dashed #ff8800' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                CONQUISTA DE ORIENTE
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Revive el espíritu del conquistador macedonio. Domina las rutas hacia Oriente.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#ffaa66' }}>
                                <li>+1 Infantería (Fijo)</li>
                                <li>Duración: Permanente (Hasta perder batalla)</li>
                                <li>Países: Grecia, Turquía, Egipto, Irán</li>
                                <li>Pérdida: Al perder batalla atacando o defendiendo con estos países</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', color: '#ff8800', border: '1px solid #884400', cursor: 'pointer' }}
                    >
                        CANCELAR
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={handleComplete}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canComplete ? '#332200' : '#ff8800',
                            color: !canComplete ? '#664400' : '#000',
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
