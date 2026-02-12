import React, { useState } from 'react';
import type { EspionageReport } from '../../../../types/playerTypes';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';

interface EspionageTargetSelectionModalProps {
    show: boolean;
    onClose: () => void;
}

export const EspionageTargetSelectionModal: React.FC<EspionageTargetSelectionModalProps> = ({
    show,
    onClose
}) => {
    const { state } = useGameContext();
    const { players, currentPlayerIndex } = state;
    const gameActions = useGameActions();

    const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
    const [result, setResult] = useState<EspionageReport | null>(null);

    const handleExecute = (targetId: number, type: 'silos' | 'mineral') => {
        const report = gameActions.executeEspionage(targetId, type);
        setResult(report);
    };

    const handleClose = () => {
        setResult(null);
        setSelectedTargetId(null);
        onClose();
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 7000,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#001a1a', border: '2px solid #00ffff',
                padding: '30px', width: '500px',
                boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)'
            }}>
                <h2 style={{ color: '#00ffff', textAlign: 'center', marginBottom: '25px' }}>OPERACIÓN DE ESPIONAJE</h2>

                {!result ? (
                    <>
                        <div style={{ color: '#aaa', marginBottom: '15px', fontSize: '0.9rem' }}>Seleccionar Objetivo:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                            {players.map((p, idx) => (
                                idx !== currentPlayerIndex && (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedTargetId(idx)}
                                        style={{
                                            backgroundColor: selectedTargetId === idx ? '#00ffff' : '#003333',
                                            color: selectedTargetId === idx ? '#000' : '#fff',
                                            border: '1px solid #00ffff',
                                            padding: '10px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontWeight: selectedTargetId === idx ? 'bold' : 'normal'
                                        }}
                                    >
                                        {p.name}
                                    </button>
                                )
                            ))}
                        </div>

                        {selectedTargetId !== null && (
                            <>
                                <div style={{ color: '#aaa', marginBottom: '15px', fontSize: '0.9rem' }}>Tipo de Inteligencia:</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleExecute(selectedTargetId, 'silos')}
                                        style={{ flex: 1, backgroundColor: '#00ffff', color: '#000', border: 'none', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        LOCALIZAR SILOS
                                    </button>
                                    <button
                                        onClick={() => handleExecute(selectedTargetId, 'mineral')}
                                        style={{ flex: 1, backgroundColor: '#00ffff', color: '#000', border: 'none', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        RASTREAR MINERAL
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            onClick={handleClose}
                            style={{ width: '100%', marginTop: '30px', background: 'none', border: '1px solid #666', color: '#666', padding: '8px', cursor: 'pointer' }}
                        >
                            ABORTAR MISIÓN
                        </button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#00ff00', marginBottom: '20px' }}>INTELIGENCIA RECUPERADA</h3>

                        <div style={{ backgroundColor: '#000', padding: '20px', borderRadius: '5px', border: '1px solid #004444', marginBottom: '25px', textAlign: 'left' }}>
                            {result.type === 'silos' ? (
                                <>
                                    <div style={{ color: '#00ffff', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>RED DE SILOS ENEMIGA:</div>
                                    {result.data.length === 0 ? (
                                        <div style={{ color: '#666' }}>No se detectan silos construidos.</div>
                                    ) : (
                                        (result.data as any[]).map((s: any, i: number) => (
                                            <div key={i} style={{ color: '#fff', marginBottom: '8px', fontSize: '1rem' }}>
                                                \u2B22 {s.location}: <span style={{ color: s.status === 'active' ? '#00ff00' : '#ff9900' }}>{s.status.toUpperCase()}</span>
                                            </div>
                                        ))
                                    )}
                                </>
                            ) : (
                                <>
                                    <div style={{ color: '#00ffff', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>RECURSO ESTRATÉGICO:</div>
                                    <div style={{ color: '#fff', marginBottom: '10px' }}>
                                        Ubicación del Mineral: <span style={{ color: '#00ff00' }}>{(result.data as any).location}</span>
                                    </div>
                                    <div style={{ color: '#fff' }}>
                                        Estado: <span style={{ color: (result.data as any).isExtracted ? '#00ff00' : '#ff9900' }}>
                                            {(result.data as any).isExtracted ? 'EXTRAÍDO / EN POSESIÓN' : 'SIN EXTRAER'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleClose}
                            style={{ backgroundColor: '#00ffff', color: '#000', border: 'none', padding: '12px 30px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            CERRAR INFORME
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
