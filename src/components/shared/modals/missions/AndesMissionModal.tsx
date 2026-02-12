import React, { useState } from 'react';
import type { PlayerData } from '../../../../types/playerTypes';
interface AndesMissionModalProps {
    show: boolean;
    onClose: () => void;
    player: PlayerData;
    currentPlayerIndex: number;
    owners: Record<string, string | number | null>;
    onComplete: (foodSupplyId: string) => void;
    onOpenInventory: () => void;
}

export const AndesMissionModal: React.FC<AndesMissionModalProps> = ({
    show,
    onClose,
    player,
    currentPlayerIndex,
    owners,
    onComplete,
    onOpenInventory
}) => {
    const [selectedAndesFoodId, setSelectedAndesFoodId] = useState<string | null>(null);

    const hasControl = owners['argentina'] === currentPlayerIndex;
    const foodSupplies = player.supplies.food || [];
    const canComplete = hasControl && selectedAndesFoodId !== null;

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '800px',
                backgroundColor: '#051a00',
                border: '2px solid #aaff00',
                boxShadow: '0 0 50px rgba(170, 255, 0, 0.3)',
                color: '#eeffcc',
                fontFamily: 'monospace',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #aaff00',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(170, 255, 0, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        OPERACIÓN: CRUCE DE LOS ANDES
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#aaff00' }}>
                        LOGÍSTICA MILITAR
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.1em', color: '#fff' }}>
                            REQUISITOS DE OPERACIÓN:
                        </div>

                        {/* Control Check */}
                        <div style={{
                            padding: '10px', marginBottom: '10px',
                            backgroundColor: hasControl ? '#003300' : '#330000',
                            border: `1px solid ${hasControl ? '#00ff00' : '#ff0000'}`,
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <span>{hasControl ? '✅' : '❌'}</span>
                            <span>CONTROL ESTRATÉGICO (ARGENTINA)</span>
                        </div>

                        {/* Food Selection */}
                        <div>
                            <div style={{ color: '#aaa', marginBottom: '5px' }}>SUMINISTRO REQUERIDO:</div>
                            <div style={{ color: '#aaff00', fontSize: '0.9em', marginBottom: '10px' }}>
                                Se requiere entregar 1 Suministro de Alimentos para abastecer las tropas.
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.length > 0 ? foodSupplies.map(supply => (
                                    <div
                                        key={supply.id}
                                        onClick={() => setSelectedAndesFoodId(supply.id)}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: selectedAndesFoodId === supply.id ? '#aaff00' : '#112200',
                                            color: selectedAndesFoodId === supply.id ? '#000' : '#aaff00',
                                            border: '1px solid #aaff00',
                                            cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between'
                                        }}
                                    >
                                        <span>ALIMENTOS ({supply.originCountry})</span>
                                    </div>
                                )) : (
                                    <div style={{ color: '#ff4444', fontStyle: 'italic', padding: '10px', border: '1px dashed #442200' }}>
                                        No tienes suministros de Alimentos disponibles. Produce o comercia para obtenerlos.
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    onClick={onOpenInventory}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: '#112200',
                                        color: '#aaff00',
                                        border: '1px solid #aaff00',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        width: '100%',
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ABRIR INVENTARIO ESTRATÉGICO
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #aaff00', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#aaff00' }}>BENEFICIO TÁCTICO</h3>
                        <div style={{ backgroundColor: 'rgba(170, 255, 0, 0.1)', padding: '15px', border: '1px dashed #aaff00' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                FLANQUEO ANDINO
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Permite realizar un ataque sorpresa desde Argentina hacia Chile con bonificación de infantería.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.9em', color: '#ccffaa' }}>
                                <li>+1 Infantería (Al atacar Chile)</li>
                                <li>Requiere activación manual</li>
                                <li>Duración: 1 Turno por activación</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex', gap: '20px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: 'transparent',
                            color: '#aaff00',
                            border: '1px solid #446600',
                            cursor: 'pointer',
                            fontFamily: 'monospace'
                        }}
                    >
                        CANCELAR OPERACIÓN
                    </button>
                    <button
                        disabled={!canComplete}
                        onClick={() => {
                            if (canComplete && selectedAndesFoodId) {
                                onComplete(selectedAndesFoodId);
                            }
                        }}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: !canComplete ? '#112200' : '#aaff00',
                            color: !canComplete ? '#334400' : '#000',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            cursor: !canComplete ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ASEGURAR PASO
                    </button>
                </div>
            </div>
        </div>
    );
};
