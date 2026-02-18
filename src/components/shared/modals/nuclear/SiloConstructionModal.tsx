import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { REGIONS } from '../../../../data/mapRegions';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';


interface SiloConstructionModalProps {
    show: boolean;
    onClose: () => void;
    playerIndex?: number;
}


interface SelectedSiloCards {
    targetRegionId: string | null;
    techLightId: string | null;
    techHeavyId: string | null;
    techElecId: string | null;
    ironId: string | null;
    alumId: string | null;
    semiId: string | null;
}

export const SiloConstructionModal: React.FC<SiloConstructionModalProps> = ({
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


    const [selectedSiloCards, setSelectedSiloCards] = useState<SelectedSiloCards>({
        targetRegionId: null,
        techLightId: null,
        techHeavyId: null,
        techElecId: null,
        ironId: null,
        alumId: null,
        semiId: null
    });

    useEffect(() => {
        if (!show) {
            setSelectedSiloCards({
                targetRegionId: null,
                techLightId: null,
                techHeavyId: null,
                techElecId: null,
                ironId: null,
                alumId: null,
                semiId: null
            });
        }
    }, [show]);

    if (!show) return null;

    const player = players[effectivePlayerIndex];
    if (!player) return null;


    const playerOwnedRegions = Object.entries(owners)
        .filter(([_, oid]) => oid === player.id)
        .map(([rid]) => rid)
        .filter(rid => !player.silos.includes(rid));

    const targetId = selectedSiloCards.targetRegionId || '';
    const hasTarget = !!targetId;

    // Techs
    const lightIndCards = technologies.filter(t => t.type === 'INDUSTRIA_LIGERA' && !t.usedThisTurn);
    const heavyIndCards = technologies.filter(t => t.type === 'INDUSTRIA_PESADA' && !t.usedThisTurn);
    const elecCards = technologies.filter(t => t.type === 'INDUSTRIA_ELECTRONICA' && !t.usedThisTurn);

    // Materials (Need Routes to Target)
    const ironCards = rawMaterials.filter(r => r.type === 'HIERRO' && !r.usedThisTurn && (!hasTarget || checkRoute(r.country, targetId, effectivePlayerIndex)));
    const alumCards = rawMaterials.filter(r => r.type === 'ALUMINIO' && !r.usedThisTurn && (!hasTarget || checkRoute(r.country, targetId, effectivePlayerIndex)));
    const semiCards = rawMaterials.filter(r => r.type === 'CONDUCTORES_SEMICONDUCTORES' && !r.usedThisTurn && (!hasTarget || checkRoute(r.country, targetId, effectivePlayerIndex)));


    const canBuild = selectedSiloCards.techLightId && selectedSiloCards.techHeavyId && selectedSiloCards.techElecId &&
        selectedSiloCards.ironId && selectedSiloCards.alumId && selectedSiloCards.semiId &&
        selectedSiloCards.targetRegionId;

    const handleConfirm = () => {
        if (!canBuild || !targetId) return;

        gameActions.constructSilo(targetId, {
            techLightId: selectedSiloCards.techLightId!,
            techHeavyId: selectedSiloCards.techHeavyId!,
            techElecId: selectedSiloCards.techElecId!,
            ironId: selectedSiloCards.ironId!,
            alumId: selectedSiloCards.alumId!,
            semiId: selectedSiloCards.semiId!
        });

        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 6000
        }}>
            <div style={{
                backgroundColor: '#110a00',
                padding: '30px',
                borderRadius: '10px',
                border: '2px solid #ff9100',
                maxWidth: '1000px',
                width: '95%',
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h1 style={{ color: '#ff9100', textAlign: 'center', margin: 0 }}>CONSTRUCCIÓN DE SILO DE LANZAMIENTO</h1>

                {/* 1. Select Target */}
                <div style={{ borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                    <h3 style={{ color: '#fff' }}>1. Seleccionar Ubicación del Silo</h3>
                    <select
                        value={targetId}
                        onChange={(e) => setSelectedSiloCards(prev => ({ ...prev, targetRegionId: e.target.value, ironId: null, alumId: null, semiId: null }))}
                        style={{
                            width: '100%', padding: '10px', fontSize: '1rem', backgroundColor: '#000', color: '#ff9100', border: '1px solid #ff9100'
                        }}
                    >
                        <option value="">-- Seleccionar Territorio Propio --</option>
                        {playerOwnedRegions.map(rid => (
                            <option key={rid} value={rid}>{REGIONS.find(r => r.id === rid)?.title}</option>
                        ))}
                    </select>
                    {!hasTarget && <div style={{ color: '#aaa', marginTop: '5px' }}>Selecciona una ubicación para validar las rutas de suministro.</div>}
                </div>

                {/* 2. Select Components */}
                <div style={{ opacity: hasTarget ? 1 : 0.5, pointerEvents: hasTarget ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                    <h3 style={{ color: '#fff' }}>2. Seleccionar Componentes (Tecnología + Materiales)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {/* Techs - Light */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '10px' }}>
                            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Tecnología</div>
                            <div style={{ color: '#ff9100', fontWeight: 'bold' }}>INDUSTRIA LIGERA</div>
                            {lightIndCards.map(c => (
                                <div key={c.id} onClick={() => setSelectedSiloCards(prev => ({ ...prev, techLightId: c.id }))}
                                    style={{ marginTop: '5px', padding: '5px', cursor: 'pointer', border: selectedSiloCards.techLightId === c.id ? '1px solid #ff9100' : '1px solid #333', backgroundColor: selectedSiloCards.techLightId === c.id ? '#331a00' : 'transparent', color: '#fff' }}>
                                    {c.country}
                                </div>
                            ))}
                            {lightIndCards.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No disponible</div>}
                        </div>
                        {/* Techs - Heavy */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '10px' }}>
                            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Tecnología</div>
                            <div style={{ color: '#ff9100', fontWeight: 'bold' }}>INDUSTRIA PESADA</div>
                            {heavyIndCards.map(c => (
                                <div key={c.id} onClick={() => setSelectedSiloCards(prev => ({ ...prev, techHeavyId: c.id }))}
                                    style={{ marginTop: '5px', padding: '5px', cursor: 'pointer', border: selectedSiloCards.techHeavyId === c.id ? '1px solid #ff9100' : '1px solid #333', backgroundColor: selectedSiloCards.techHeavyId === c.id ? '#331a00' : 'transparent', color: '#fff' }}>
                                    {c.country}
                                </div>
                            ))}
                            {heavyIndCards.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No disponible</div>}
                        </div>
                        {/* Techs - Elec */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '10px' }}>
                            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Tecnología</div>
                            <div style={{ color: '#ff9100', fontWeight: 'bold' }}>ELECTRÓNICA</div>
                            {elecCards.map(c => (
                                <div key={c.id} onClick={() => setSelectedSiloCards(prev => ({ ...prev, techElecId: c.id }))}
                                    style={{ marginTop: '5px', padding: '5px', cursor: 'pointer', border: selectedSiloCards.techElecId === c.id ? '1px solid #ff9100' : '1px solid #333', backgroundColor: selectedSiloCards.techElecId === c.id ? '#331a00' : 'transparent', color: '#fff' }}>
                                    {c.country}
                                </div>
                            ))}
                            {elecCards.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No disponible</div>}
                        </div>

                        {/* Materials */}
                        {/* Iron */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '10px' }}>
                            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Material (Ruta Req)</div>
                            <div style={{ color: '#00ffff', fontWeight: 'bold' }}>HIERRO</div>
                            {ironCards.map(c => (
                                <div key={c.id} onClick={() => setSelectedSiloCards(prev => ({ ...prev, ironId: c.id }))}
                                    style={{ marginTop: '5px', padding: '5px', cursor: 'pointer', border: selectedSiloCards.ironId === c.id ? '1px solid #00ffff' : '1px solid #333', backgroundColor: selectedSiloCards.ironId === c.id ? '#002222' : 'transparent', color: '#fff' }}>
                                    {c.country}
                                </div>
                            ))}
                            {ironCards.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No disponible</div>}
                        </div>
                        {/* Alum */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '10px' }}>
                            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Material (Ruta Req)</div>
                            <div style={{ color: '#00ffff', fontWeight: 'bold' }}>ALUMINIO</div>
                            {alumCards.map(c => (
                                <div key={c.id} onClick={() => setSelectedSiloCards(prev => ({ ...prev, alumId: c.id }))}
                                    style={{ marginTop: '5px', padding: '5px', cursor: 'pointer', border: selectedSiloCards.alumId === c.id ? '1px solid #00ffff' : '1px solid #333', backgroundColor: selectedSiloCards.alumId === c.id ? '#002222' : 'transparent', color: '#fff' }}>
                                    {c.country}
                                </div>
                            ))}
                            {alumCards.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No disponible</div>}
                        </div>
                        {/* Semi */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '10px' }}>
                            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Material (Ruta Req)</div>
                            <div style={{ color: '#00ffff', fontWeight: 'bold' }}>SEMICONDUCTORES</div>
                            {semiCards.map(c => (
                                <div key={c.id} onClick={() => setSelectedSiloCards(prev => ({ ...prev, semiId: c.id }))}
                                    style={{ marginTop: '5px', padding: '5px', cursor: 'pointer', border: selectedSiloCards.semiId === c.id ? '1px solid #00ffff' : '1px solid #333', backgroundColor: selectedSiloCards.semiId === c.id ? '#002222' : 'transparent', color: '#fff' }}>
                                    {c.country}
                                </div>
                            ))}
                            {semiCards.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No disponible</div>}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                    <button onClick={onClose} style={{ padding: '15px 30px', background: 'transparent', border: '1px solid #666', color: '#aaa', cursor: 'pointer' }}>CANCELAR</button>
                    <button onClick={handleConfirm} disabled={!canBuild}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: canBuild ? '#ff9100' : '#222',
                            color: canBuild ? '#000' : '#666',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: canBuild ? 'pointer' : 'not-allowed',
                            fontSize: '1.2rem'
                        }}
                    >
                        CONFIRMAR CONSTRUCCIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};
