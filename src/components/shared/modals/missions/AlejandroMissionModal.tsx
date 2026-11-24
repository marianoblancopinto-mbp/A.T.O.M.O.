import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useMyPlayer } from '../../../../hooks/useMyPlayer';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { MissionModalBase } from '../MissionModalBase';

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
    const { state } = useGameContext();
    const actions = useGameActions();
    const { myPlayerIndex } = useMyPlayer();
    const { players, owners } = state;
    const { checkRoute } = useSupplyRoute();

    const [selectedAlejandroFoodId, setSelectedAlejandroFoodId] = useState<string | null>(null);
    const [selectedAlejandroManufactureId, setSelectedAlejandroManufactureId] = useState<string | null>(null);
    const [selectedAlejandroEnergyId, setSelectedAlejandroEnergyId] = useState<string | null>(null);

    const player = players[myPlayerIndex];
    if (!player) return null;

    const hasGreece = String(owners['grecia']) === String(player.id);
    const foodSupplies = player.supplies.food || [];
    const manufactureSupplies = player.supplies.manufacture || [];
    const energySupplies = player.supplies.energy || [];

    const canComplete = hasGreece && selectedAlejandroFoodId && selectedAlejandroManufactureId && selectedAlejandroEnergyId;

    const handleComplete = () => {
        if (!canComplete) return;
        actions.activateMission({ missionId: 'alejandro_magno', supplyIds: [selectedAlejandroFoodId!, selectedAlejandroManufactureId!, selectedAlejandroEnergyId!] });

        onSuccess(player.name);
        onClose();
    };

    if (!show) return null;

    return (
        <MissionModalBase title="OPERACIÓN ALEJANDRO MAGNO" type="activation" onClose={onClose} width="900px">
            <div style={{ textAlign: 'center', color: '#ff8800', fontSize: '0.9em', marginBottom: '20px' }}>
                CONQUISTA DE ORIENTE
            </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px', overflowY: 'auto', overflowX: 'auto', flex: 1, flexWrap: 'wrap' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#ff8800', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Greece Control */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasGreece ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE GRECIA (BASE)</div>
                        </div>

                        {/* Food Supply Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ALIMENTOS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.filter(s => checkRoute(s.originCountry, 'grecia', myPlayerIndex)).length > 0 ? (
                                    foodSupplies.filter(s => checkRoute(s.originCountry, 'grecia', myPlayerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedAlejandroFoodId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedAlejandroFoodId === s.id ? '#ff8800' : '#221100',
                                                color: selectedAlejandroFoodId === s.id ? '#000' : '#ff8800',
                                                border: `1px solid #ff8800`,
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

                        {/* Manufacture Supply Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE MANUFACTURAS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {manufactureSupplies.filter(s => checkRoute(s.originCountry, 'grecia', myPlayerIndex)).length > 0 ? (
                                    manufactureSupplies.filter(s => checkRoute(s.originCountry, 'grecia', myPlayerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedAlejandroManufactureId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedAlejandroManufactureId === s.id ? '#ff8800' : '#221100',
                                                color: selectedAlejandroManufactureId === s.id ? '#000' : '#ff8800',
                                                border: `1px solid #ff8800`,
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

                        {/* Energy Supply Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ENERGÍA:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {energySupplies.filter(s => checkRoute(s.originCountry, 'grecia', myPlayerIndex)).length > 0 ? (
                                    energySupplies.filter(s => checkRoute(s.originCountry, 'grecia', myPlayerIndex)).map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedAlejandroEnergyId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedAlejandroEnergyId === s.id ? '#ff8800' : '#221100',
                                                color: selectedAlejandroEnergyId === s.id ? '#000' : '#ff8800',
                                                border: `1px solid #ff8800`,
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

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#ff8800', border: '1px solid #ff8800',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 136, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
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
        </MissionModalBase>
    );
};
