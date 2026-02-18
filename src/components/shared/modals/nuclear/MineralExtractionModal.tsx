import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { REGIONS } from '../../../../data/mapRegions';


interface MineralExtractionModalProps {
    show: string | null; // regionId or 'SELECTION_NEEDED' or null
    onClose: () => void;
    playerIndex?: number;
}


export const MineralExtractionModal: React.FC<MineralExtractionModalProps> = ({
    show,
    onClose,
    playerIndex
}) => {

    const { state } = useGameContext();
    const { players, currentPlayerIndex: stateCurrentPlayerIndex, owners } = state;
    const effectivePlayerIndex = playerIndex ?? stateCurrentPlayerIndex;
    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(effectivePlayerIndex);
    const gameActions = useGameActions();

    const [selectedFallback, setSelectedFallback] = useState<string | null>(null);

    const [selectedMineralCards, setSelectedMineralCards] = useState<{
        techId: string | null;
        ironId: string | null;
        waterId: string | null;
    }>({ techId: null, ironId: null, waterId: null });

    // Determine effective region ID
    const effectiveRegionId = show === 'SELECTION_NEEDED' ? selectedFallback : show;

    // Reset selection when modal opens/closes
    useEffect(() => {
        if (!show) {
            setSelectedMineralCards({ techId: null, ironId: null, waterId: null });
            setSelectedFallback(null);
        }
    }, [show]);

    if (!show) return null;

    const player = players[effectivePlayerIndex];
    if (!player) return null;

    // Region Selection Logic
    const playerOwnedRegions = Object.entries(owners)
        .filter(([_, oid]) => oid === player.id)
        .map(([rid]) => rid);


    // Valid components (only computed if effectiveRegionId is set)
    const techCards = technologies.filter(t => t.type === 'INDUSTRIA_PESADA' && !t.usedThisTurn);
    const ironCards = effectiveRegionId ? rawMaterials.filter(r => r.type === 'HIERRO' && !r.usedThisTurn && checkRoute(r.country, effectiveRegionId, effectivePlayerIndex)) : [];
    const waterCards = effectiveRegionId ? rawMaterials.filter(r => r.type === 'AGUA_DULCE' && !r.usedThisTurn && checkRoute(r.country, effectiveRegionId, effectivePlayerIndex)) : [];



    const canExtract = selectedMineralCards.techId && selectedMineralCards.ironId && selectedMineralCards.waterId;

    const handleConfirm = () => {
        if (!effectiveRegionId || !selectedMineralCards.techId || !selectedMineralCards.ironId || !selectedMineralCards.waterId) return;

        gameActions.extractSecretMineral(effectiveRegionId, {
            techId: selectedMineralCards.techId,
            ironId: selectedMineralCards.ironId,
            waterId: selectedMineralCards.waterId
        });

        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 6000
        }}>
            <div style={{
                backgroundColor: '#001a1a',
                padding: '30px',
                borderRadius: '10px',
                border: '2px solid #00ffff',
                maxWidth: '900px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <h2 style={{ color: '#00ffff', textAlign: 'center', marginBottom: '20px' }}>EXTRAER MINERAL SECRETO</h2>

                {show === 'SELECTION_NEEDED' && (
                    <div style={{ marginBottom: '20px', borderBottom: '1px solid #00ffff', paddingBottom: '20px' }}>
                        <h3 style={{ color: '#fff' }}>Seleccionar Región de Extracción</h3>
                        <select
                            value={selectedFallback || ''}
                            onChange={(e) => setSelectedFallback(e.target.value || null)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#000',
                                color: '#00ffff',
                                border: '1px solid #00ffff',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="">-- Seleccionar Territorio Propio --</option>
                            {playerOwnedRegions.map(rid => (
                                <option key={rid} value={rid}>{REGIONS.find(r => r.id === rid)?.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                {effectiveRegionId ? (
                    <>
                        <div style={{ textAlign: 'center', color: '#aaa', marginBottom: '10px' }}>
                            Ubicación: <span style={{ color: '#fff', fontWeight: 'bold' }}>{REGIONS.find(r => r.id === effectiveRegionId)?.title}</span>
                        </div>
                        <p style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
                            Selecciona los recursos necesarios para la extracción. Se requieren Rutas de Suministro para las materias primas.
                        </p>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexDirection: 'row' }}>
                            {/* Tech */}
                            <div style={{ flex: 1, backgroundColor: '#000', padding: '10px', borderRadius: '5px' }}>
                                <h4 style={{ color: '#aaa', borderBottom: '1px solid #333', marginBottom: '10px' }}>Tecnología: Ind. Pesada</h4>
                                {techCards.length === 0 ? <div style={{ color: '#ff4444' }}>No disponible</div> :
                                    techCards.map(c => (
                                        <div key={c.id} onClick={() => setSelectedMineralCards(prev => ({ ...prev, techId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                marginBottom: '5px',
                                                backgroundColor: selectedMineralCards.techId === c.id ? '#004444' : '#222',
                                                border: selectedMineralCards.techId === c.id ? '1px solid #00ffff' : '1px solid #444',
                                                cursor: 'pointer',
                                                color: '#fff'
                                            }}>
                                            {c.country}
                                        </div>
                                    ))
                                }
                            </div>
                            {/* Iron */}
                            <div style={{ flex: 1, backgroundColor: '#000', padding: '10px', borderRadius: '5px' }}>
                                <h4 style={{ color: '#aaa', borderBottom: '1px solid #333', marginBottom: '10px' }}>Materia: Hierro (Ruta)</h4>
                                {ironCards.length === 0 ? <div style={{ color: '#ff4444' }}>No disponible</div> :
                                    ironCards.map(c => (
                                        <div key={c.id} onClick={() => setSelectedMineralCards(prev => ({ ...prev, ironId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                marginBottom: '5px',
                                                backgroundColor: selectedMineralCards.ironId === c.id ? '#004444' : '#222',
                                                border: selectedMineralCards.ironId === c.id ? '1px solid #00ffff' : '1px solid #444',
                                                cursor: 'pointer',
                                                color: '#fff'
                                            }}>
                                            {c.country}
                                        </div>
                                    ))
                                }
                            </div>
                            {/* Water */}
                            <div style={{ flex: 1, backgroundColor: '#000', padding: '10px', borderRadius: '5px' }}>
                                <h4 style={{ color: '#aaa', borderBottom: '1px solid #333', marginBottom: '10px' }}>Materia: Agua (Ruta)</h4>
                                {waterCards.length === 0 ? <div style={{ color: '#ff4444' }}>No disponible</div> :
                                    waterCards.map(c => (
                                        <div key={c.id} onClick={() => setSelectedMineralCards(prev => ({ ...prev, waterId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                marginBottom: '5px',
                                                backgroundColor: selectedMineralCards.waterId === c.id ? '#004444' : '#222',
                                                border: selectedMineralCards.waterId === c.id ? '1px solid #00ffff' : '1px solid #444',
                                                cursor: 'pointer',
                                                color: '#fff'
                                            }}>
                                            {c.country}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid #666', color: '#aaa', cursor: 'pointer' }}>CANCELAR</button>
                            <button onClick={handleConfirm} disabled={!canExtract}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: canExtract ? '#00ffff' : '#222',
                                    color: canExtract ? '#000' : '#666',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: canExtract ? 'pointer' : 'not-allowed'
                                }}>
                                CONFIRMAR EXTRACCIÓN
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '50px' }}>
                        Selecciona un territorio para comenzar.
                        <br /><br />
                        <button onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid #666', color: '#aaa', cursor: 'pointer' }}>CANCELAR</button>
                    </div>
                )}
            </div>
        </div>
    );
};
