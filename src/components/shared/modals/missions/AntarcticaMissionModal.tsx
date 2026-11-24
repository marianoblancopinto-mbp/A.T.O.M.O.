import React, { useState } from 'react';
import { MissionModalBase } from '../MissionModalBase';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useMyPlayer } from '../../../../hooks/useMyPlayer';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { REGIONS } from '../../../../data/mapRegions';

interface AntarcticaMissionModalProps {
    onClose: () => void;
    onSuccess: (playerName: string) => void;
}

export const AntarcticaMissionModal: React.FC<AntarcticaMissionModalProps> = ({
    onClose,
    onSuccess
}) => {
    const { state } = useGameContext();
    const actions = useGameActions();
    const { myPlayerIndex } = useMyPlayer();
    const { players, owners } = state;
    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(myPlayerIndex);

    const [selectedAntarcticaBase, setSelectedAntarcticaBase] = useState<string | null>(null);
    const [selectedAntarcticaCards, setSelectedAntarcticaCards] = useState<{
        heavyIndId: string | null;
        elecIndId: string | null;
        ironId: string | null;
        semiId: string | null;
    }>({ heavyIndId: null, elecIndId: null, ironId: null, semiId: null });

    const player = players[myPlayerIndex];
    if (!player) return null;

    const hasControl = ['chile', 'argentina', 'australia', 'sudafrica'].every(id => owners[id] === player.id);

    // Technologies - No route validation
    const heavyIndCards = technologies.filter(c => c.type === 'INDUSTRIA_PESADA' && !c.usedThisTurn);
    const elecIndCards = technologies.filter(c => c.type === 'INDUSTRIA_ELECTRONICA' && !c.usedThisTurn);

    // Raw Materials - Filter only by type (Route validation happens in UI)
    const ironCards = rawMaterials.filter(c => c.type === 'HIERRO' && !c.usedThisTurn);
    const semiCards = rawMaterials.filter(c => c.type === 'CONDUCTORES_SEMICONDUCTORES' && !c.usedThisTurn);

    const canComplete = hasControl &&
        selectedAntarcticaBase &&
        selectedAntarcticaCards.heavyIndId &&
        selectedAntarcticaCards.elecIndId &&
        selectedAntarcticaCards.ironId &&
        selectedAntarcticaCards.semiId;

    const handleComplete = () => {
        if (!canComplete) return;
        actions.activateMission({ missionId: 'ruta_antartica', baseRegionId: selectedAntarcticaBase!, techIds: [selectedAntarcticaCards.heavyIndId!, selectedAntarcticaCards.elecIndId!], rawIds: [selectedAntarcticaCards.ironId!, selectedAntarcticaCards.semiId!] });

        onSuccess(player.name);
        onClose();
    };

    return (
        <MissionModalBase title="RUTA ANTÁRTICA" type="activation" onClose={onClose}>
            <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', marginBottom: '20px' }}>
                "Establecer una ruta comercial segura a través del Océano Antártico para garantizar el flujo de suministros estratégicos."
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. SELECCIÓN DE BASE */}
                <div style={{ backgroundColor: '#000', padding: '20px', border: '1px solid #00ffff40', borderRadius: '4px' }}>
                    <div style={{ color: '#00ffff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #00ffff40', paddingBottom: '5px' }}>
                        1. SELECCIONE BASE DE OPERACIONES
                    </div>
                    <select
                        value={selectedAntarcticaBase || ''}
                        onChange={(e) => {
                            setSelectedAntarcticaBase(e.target.value);
                            setSelectedAntarcticaCards(prev => ({ ...prev, ironId: null, semiId: null }));
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#001a1a',
                            color: '#00ffff',
                            border: '1px solid #00ffff',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">-- Seleccionar Base Controlada --</option>
                        {['chile', 'argentina', 'australia', 'sudafrica'].map(id => (
                            <option key={id} value={id} disabled={owners[id] !== player.id}>
                                {REGIONS.find(r => r.id === id)?.title} {owners[id] !== player.id ? '(SIN CONTROL)' : ''}
                            </option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px', fontStyle: 'italic' }}>
                        La base elegida debe tener una ruta de suministro activa hacia las materias primas.
                    </p>
                </div>

                {/* 2. COMPONENTES Y RECURSOS */}
                <div style={{
                    opacity: selectedAntarcticaBase ? 1 : 0.5,
                    pointerEvents: selectedAntarcticaBase ? 'auto' : 'none',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ color: '#00ffff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #00ffff40', paddingBottom: '5px' }}>
                        2. ASIGNACIÓN DE RECURSOS ESTRATÉGICOS
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                        {/* Tecnologías */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Heavy Ind */}
                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #004444', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>TECNOLOGÍA</div>
                                <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>INDUSTRIA PESADA</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {heavyIndCards.map(c => (
                                        <button key={c.id}
                                            onClick={() => setSelectedAntarcticaCards(p => ({ ...p, heavyIndId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: selectedAntarcticaCards.heavyIndId === c.id ? '#00ff00' : '#001a00',
                                                color: selectedAntarcticaCards.heavyIndId === c.id ? '#000' : '#00ff00',
                                                border: `1px solid ${selectedAntarcticaCards.heavyIndId === c.id ? '#00ff00' : '#004400'}`,
                                                cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left', borderRadius: '2px'
                                            }}>
                                            LOCAL: {REGIONS.find(r => r.id === c.country)?.title || c.country}
                                        </button>
                                    ))}
                                    {heavyIndCards.length === 0 && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>Sin tarjetas disponibles</div>}
                                </div>
                            </div>

                            {/* Elec Ind */}
                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #004444', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>TECNOLOGÍA</div>
                                <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>ELECTRÓNICA</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {elecIndCards.map(c => (
                                        <button key={c.id}
                                            onClick={() => setSelectedAntarcticaCards(p => ({ ...p, elecIndId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: selectedAntarcticaCards.elecIndId === c.id ? '#00ff00' : '#001a00',
                                                color: selectedAntarcticaCards.elecIndId === c.id ? '#000' : '#00ff00',
                                                border: `1px solid ${selectedAntarcticaCards.elecIndId === c.id ? '#00ff00' : '#004400'}`,
                                                cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left', borderRadius: '2px'
                                            }}>
                                            LOCAL: {REGIONS.find(r => r.id === c.country)?.title || c.country}
                                        </button>
                                    ))}
                                    {elecIndCards.length === 0 && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>Sin tarjetas disponibles</div>}
                                </div>
                            </div>
                        </div>

                        {/* Materias Primas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Iron */}
                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #004444', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>MATERIA PRIMA (Ruta Req.)</div>
                                <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>HIERRO</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {ironCards.map(c => {
                                        const hasRoute = selectedAntarcticaBase ? checkRoute(c.country, selectedAntarcticaBase, player.id) : false;
                                        return (
                                            <button key={c.id}
                                                disabled={!hasRoute}
                                                onClick={() => setSelectedAntarcticaCards(p => ({ ...p, ironId: c.id }))}
                                                style={{
                                                    padding: '8px',
                                                    backgroundColor: selectedAntarcticaCards.ironId === c.id ? '#00ffff' : (hasRoute ? '#001a1a' : '#1a0000'),
                                                    color: selectedAntarcticaCards.ironId === c.id ? '#000' : (hasRoute ? '#00ffff' : '#440000'),
                                                    border: `1px solid ${selectedAntarcticaCards.ironId === c.id ? '#00ffff' : (hasRoute ? '#004444' : '#440000')}`,
                                                    cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.8rem', textAlign: 'left', borderRadius: '2px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                <span>{REGIONS.find(r => r.id === c.country)?.title || c.country}</span>
                                                {!hasRoute && <span style={{ fontSize: '0.7rem', color: '#ff4444' }}>⚠️ SIN RUTA</span>}
                                            </button>
                                        );
                                    })}
                                    {ironCards.length === 0 && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>Sin tarjetas disponibles</div>}
                                </div>
                            </div>

                            {/* Semi */}
                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #004444', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>MATERIA PRIMA (Ruta Req.)</div>
                                <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>SEMICONDUCTORES</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {semiCards.map(c => {
                                        const hasRoute = selectedAntarcticaBase ? checkRoute(c.country, selectedAntarcticaBase, player.id) : false;
                                        return (
                                            <button key={c.id}
                                                disabled={!hasRoute}
                                                onClick={() => setSelectedAntarcticaCards(p => ({ ...p, semiId: c.id }))}
                                                style={{
                                                    padding: '8px',
                                                    backgroundColor: selectedAntarcticaCards.semiId === c.id ? '#00ffff' : (hasRoute ? '#001a1a' : '#1a0000'),
                                                    color: selectedAntarcticaCards.semiId === c.id ? '#000' : (hasRoute ? '#00ffff' : '#440000'),
                                                    border: `1px solid ${selectedAntarcticaCards.semiId === c.id ? '#00ffff' : (hasRoute ? '#004444' : '#440000')}`,
                                                    cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.8rem', textAlign: 'left', borderRadius: '2px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                <span>{REGIONS.find(r => r.id === c.country)?.title || c.country}</span>
                                                {!hasRoute && <span style={{ fontSize: '0.7rem', color: '#ff4444' }}>⚠️ SIN RUTA</span>}
                                            </button>
                                        );
                                    })}
                                    {semiCards.length === 0 && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>Sin tarjetas disponibles</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
                <button
                    onClick={onClose}
                    style={{
                        flex: 1, padding: '15px', backgroundColor: 'transparent',
                        color: '#666', border: '1px solid #333', cursor: 'pointer',
                        fontWeight: 'bold', fontSize: '0.9rem', borderRadius: '4px'
                    }}>
                    RECHAZAR OPERACIÓN
                </button>
                <button
                    disabled={!canComplete}
                    onClick={handleComplete}
                    style={{
                        flex: 1, padding: '15px',
                        backgroundColor: !canComplete ? '#002222' : '#00ffff',
                        color: !canComplete ? '#004444' : '#000',
                        border: 'none', fontWeight: 'bold', fontSize: '1rem',
                        cursor: !canComplete ? 'not-allowed' : 'pointer',
                        borderRadius: '4px',
                        boxShadow: !canComplete ? 'none' : '0 0 20px rgba(0, 255, 255, 0.4)',
                        textTransform: 'uppercase', letterSpacing: '2px'
                    }}>
                    ESTABLECER RUTA
                </button>
            </div>
        </MissionModalBase>
    );
};
