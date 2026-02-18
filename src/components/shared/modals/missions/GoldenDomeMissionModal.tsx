import React, { useState } from 'react';
import { MissionModalBase } from '../MissionModalBase';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { REGIONS } from '../../../../data/mapRegions';
import type { SpecialCard } from '../../../../types/playerTypes';

interface GoldenDomeMissionModalProps {
    onClose: () => void;
    onSuccess: (playerName: string) => void;
}

export const GoldenDomeMissionModal: React.FC<GoldenDomeMissionModalProps> = ({
    onClose,
    onSuccess
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);

    const [selectedBase, setSelectedBase] = useState<string | null>(null);
    const [selectedCards, setSelectedCards] = useState<{
        lightIndId: string | null;
        elecIndId: string | null;
        alumId: string | null;
        semiId: string | null;
    }>({ lightIndId: null, elecIndId: null, alumId: null, semiId: null });

    const player = players[currentPlayerIndex];
    if (!player) return null;

    const requiredRegions = ['nueva_york', 'california', 'texas', 'flordia', 'alaska'];
    const hasControl = requiredRegions.every(id => owners[id] === player.id);

    // Technologies
    const lightIndCards = technologies.filter(c => c.type === 'INDUSTRIA_LIGERA' && !c.usedThisTurn);
    const elecIndCards = technologies.filter(c => c.type === 'INDUSTRIA_ELECTRONICA' && !c.usedThisTurn);

    // Raw Materials
    const alumCards = rawMaterials.filter(c => c.type === 'ALUMINIO' && !c.usedThisTurn);
    const semiCards = rawMaterials.filter(c => c.type === 'CONDUCTORES_SEMICONDUCTORES' && !c.usedThisTurn);

    const canComplete = hasControl &&
        selectedBase &&
        selectedCards.lightIndId &&
        selectedCards.elecIndId &&
        selectedCards.alumId &&
        selectedCards.semiId;

    const handleComplete = () => {
        if (!canComplete) return;

        // Consume Cards
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedCards.lightIndId!, category: 'technology' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedCards.elecIndId!, category: 'technology' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedCards.alumId!, category: 'rawMaterial' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedCards.semiId!, category: 'rawMaterial' }
        });

        // Add Special Card
        const newCard: SpecialCard = {
            id: `special-goldendome-${Date.now()}`,
            type: 'SECONDARY_MISSION',
            name: 'CÚPULA DORADA',
            originCountry: selectedBase!,
            description: 'Sistema de defensa aérea hemisférica activo.',
            createdAt: Date.now()
        };

        const updatedSpecialCards = [...player.specialCards, newCard];
        const updatedActiveMissions = [...player.activeSpecialMissions, { id: 'golden_dome', baseRegionId: selectedBase!, startTime: Date.now() }];

        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    specialCards: updatedSpecialCards,
                    activeSpecialMissions: updatedActiveMissions
                }
            }
        });

        onSuccess(player.name);
        onClose();
    };

    return (
        <MissionModalBase title="CÚPULA DORADA" type="activation" onClose={onClose}>
            <div style={{ textAlign: 'center', color: '#ffd700', fontStyle: 'italic', marginBottom: '20px' }}>
                "Establecer una red de defensa aérea impenetrable sobre el continente."
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. SELECCIÓN DE BASE */}
                <div style={{ backgroundColor: '#1a1a00', padding: '20px', border: '1px solid #ffd700', borderRadius: '4px' }}>
                    <div style={{ color: '#ffd700', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ffd70040', paddingBottom: '5px' }}>
                        1. SELECCIONE BASE DE COMANDO
                    </div>
                    <select
                        value={selectedBase || ''}
                        onChange={(e) => {
                            setSelectedBase(e.target.value);
                            setSelectedCards(prev => ({ ...prev, alumId: null, semiId: null }));
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#000',
                            color: '#ffd700',
                            border: '1px solid #ffd700',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">-- Seleccionar Base Controlada --</option>
                        {requiredRegions.map(id => (
                            <option key={id} value={id} disabled={owners[id] !== player.id}>
                                {REGIONS.find(r => r.id === id)?.title} {owners[id] !== player.id ? '(SIN CONTROL)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. RECURSOS */}
                <div style={{
                    opacity: selectedBase ? 1 : 0.5,
                    pointerEvents: selectedBase ? 'auto' : 'none',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ color: '#ffd700', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ffd70040', paddingBottom: '5px' }}>
                        2. ASIGNACIÓN DE RECURSOS
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                        {/* Tecnologías */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #665500', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>TECNOLOGÍA</div>
                                <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>INDUSTRIA LIGERA</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {lightIndCards.map(c => (
                                        <button key={c.id}
                                            onClick={() => setSelectedCards(p => ({ ...p, lightIndId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: selectedCards.lightIndId === c.id ? '#ffd700' : '#1a1a00',
                                                color: selectedCards.lightIndId === c.id ? '#000' : '#ffd700',
                                                border: `1px solid ${selectedCards.lightIndId === c.id ? '#ffd700' : '#665500'}`,
                                                cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left', borderRadius: '2px'
                                            }}>
                                            LOCAL: {REGIONS.find(r => r.id === c.country)?.title || c.country}
                                        </button>
                                    ))}
                                    {lightIndCards.length === 0 && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>Sin tarjetas disponibles</div>}
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #665500', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>TECNOLOGÍA</div>
                                <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>ELECTRÓNICA</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {elecIndCards.map(c => (
                                        <button key={c.id}
                                            onClick={() => setSelectedCards(p => ({ ...p, elecIndId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: selectedCards.elecIndId === c.id ? '#ffd700' : '#1a1a00',
                                                color: selectedCards.elecIndId === c.id ? '#000' : '#ffd700',
                                                border: `1px solid ${selectedCards.elecIndId === c.id ? '#ffd700' : '#665500'}`,
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
                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #665500', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>MATERIA PRIMA (Ruta Req.)</div>
                                <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>ALUMINIO</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {alumCards.map(c => {
                                        const hasRoute = selectedBase ? checkRoute(c.country, selectedBase, player.id) : false;
                                        return (
                                            <button key={c.id}
                                                disabled={!hasRoute}
                                                onClick={() => setSelectedCards(p => ({ ...p, alumId: c.id }))}
                                                style={{
                                                    padding: '8px',
                                                    backgroundColor: selectedCards.alumId === c.id ? '#ffd700' : (hasRoute ? '#1a1a00' : '#220000'),
                                                    color: selectedCards.alumId === c.id ? '#000' : (hasRoute ? '#ffd700' : '#660000'),
                                                    border: `1px solid ${selectedCards.alumId === c.id ? '#ffd700' : (hasRoute ? '#665500' : '#440000')}`,
                                                    cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.8rem', textAlign: 'left', borderRadius: '2px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                <span>{REGIONS.find(r => r.id === c.country)?.title || c.country}</span>
                                                {!hasRoute && <span style={{ fontSize: '0.7rem', color: '#ff4444' }}>⚠️ SIN RUTA</span>}
                                            </button>
                                        );
                                    })}
                                    {alumCards.length === 0 && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>Sin tarjetas disponibles</div>}
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #665500', borderRadius: '4px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>MATERIA PRIMA (Ruta Req.)</div>
                                <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>SEMICONDUCTORES</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {semiCards.map(c => {
                                        const hasRoute = selectedBase ? checkRoute(c.country, selectedBase, player.id) : false;
                                        return (
                                            <button key={c.id}
                                                disabled={!hasRoute}
                                                onClick={() => setSelectedCards(p => ({ ...p, semiId: c.id }))}
                                                style={{
                                                    padding: '8px',
                                                    backgroundColor: selectedCards.semiId === c.id ? '#ffd700' : (hasRoute ? '#1a1a00' : '#220000'),
                                                    color: selectedCards.semiId === c.id ? '#000' : (hasRoute ? '#ffd700' : '#660000'),
                                                    border: `1px solid ${selectedCards.semiId === c.id ? '#ffd700' : (hasRoute ? '#665500' : '#440000')}`,
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
                    CANCELAR
                </button>
                <button
                    disabled={!canComplete}
                    onClick={handleComplete}
                    style={{
                        flex: 1, padding: '15px',
                        backgroundColor: !canComplete ? '#332b00' : '#ffd700',
                        color: !canComplete ? '#665500' : '#000',
                        border: 'none', fontWeight: 'bold', fontSize: '1rem',
                        cursor: !canComplete ? 'not-allowed' : 'pointer',
                        borderRadius: '4px',
                        boxShadow: !canComplete ? 'none' : '0 0 20px rgba(255, 215, 0, 0.4)',
                        textTransform: 'uppercase', letterSpacing: '2px'
                    }}>
                    ACTIVAR CÚPULA
                </button>
            </div>
        </MissionModalBase>
    );
};
