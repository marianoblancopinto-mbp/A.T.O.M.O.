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
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#aaff00', letterSpacing: '1px' }}>
                            REQUISITOS ESTRATÉGICOS:
                        </div>

                        {/* Control Check */}
                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em', marginBottom: '5px' }}>{hasControl ? '✅' : '❌'}</div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px' }}>CONTROL DE ARGENTINA (BASE)</div>
                        </div>

                        {/* Food Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>SUMINISTRO DE ALIMENTOS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {foodSupplies.length > 0 ? (
                                    foodSupplies.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setSelectedAndesFoodId(s.id)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: selectedAndesFoodId === s.id ? '#aaff00' : '#112200',
                                                color: selectedAndesFoodId === s.id ? '#000' : '#aaff00',
                                                border: `1px solid #aaff00`,
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                textAlign: 'center', transition: 'all 0.2s'
                                            }}
                                        >
                                            ALIMENTOS ({s.originCountry.toUpperCase()})
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(170,255,0,0.05)', border: '1px dashed #ff4444' }}>
                                        No disponible.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onOpenInventory}
                            style={{
                                width: '100%', padding: '12px',
                                backgroundColor: 'transparent', color: '#aaff00', border: '1px solid #aaff00',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                                textTransform: 'uppercase', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(170, 255, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Fabricar Suministros
                        </button>
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '300px', borderLeft: '1px solid #aaff00', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#aaff00' }}>CRUCE DE LOS ANDES</h3>
                        <div style={{ backgroundColor: 'rgba(170, 255, 0, 0.1)', padding: '15px', border: '1px dashed #aaff00' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '10px' }}>
                                FLANQUEO ANDINO
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                Permite realizar un ataque sorpresa desde Argentina hacia Chile con bonificación de infantería.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85em', color: '#ccffaa' }}>
                                <li>+1 Infantería (Al atacar Chile)</li>
                                <li>Requiere activación manual</li>
                                <li>Duración: 1 Turno por activación</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
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
