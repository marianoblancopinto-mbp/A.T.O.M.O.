import React, { useState } from 'react';
import { MissionModalBase } from '../MissionModalBase';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { REGIONS } from '../../../../data/mapRegions';
import type { SpecialCard } from '../../../../types/playerTypes';

interface AntarcticaMissionModalProps {
    onClose: () => void;
    onSuccess: (playerName: string) => void;
}

export const AntarcticaMissionModal: React.FC<AntarcticaMissionModalProps> = ({
    onClose,
    onSuccess
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);

    const [selectedAntarcticaBase, setSelectedAntarcticaBase] = useState<string | null>(null);
    const [selectedAntarcticaCards, setSelectedAntarcticaCards] = useState<{
        heavyIndId: string | null;
        elecIndId: string | null;
        ironId: string | null;
        semiId: string | null;
    }>({ heavyIndId: null, elecIndId: null, ironId: null, semiId: null });

    const player = players[currentPlayerIndex];
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

        // Consume Cards
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedAntarcticaCards.heavyIndId!, category: 'technology' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedAntarcticaCards.elecIndId!, category: 'technology' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedAntarcticaCards.ironId!, category: 'rawMaterial' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedAntarcticaCards.semiId!, category: 'rawMaterial' }
        });

        // Add Special Card
        const newCard: SpecialCard = {
            id: `special-antarctica-${Date.now()}`,
            type: 'SECONDARY_MISSION',
            name: 'RUTA ANTÁRTICA',
            originCountry: selectedAntarcticaBase!, // Base
            description: 'Ruta comercial antártica establecida. Genera bonificaciones pasivas.',
            createdAt: Date.now()
        };

        const updatedSpecialCards = [...player.specialCards, newCard];
        const updatedActiveMissions = [...player.activeSpecialMissions, { id: 'ruta_antartica', baseRegionId: selectedAntarcticaBase!, startTime: Date.now() }];

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
        <MissionModalBase title="RUTA ANTÁRTICA" type="activation" onClose={onClose}>
            <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>
                "Establecer una ruta comercial segura a través del Océano Antártico para garantizar el flujo de suministros estratégicos."
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Requirements Status */}
                <div style={{ flex: 1, backgroundColor: '#000', padding: '15px', border: '1px solid #004444' }}>
                    <div style={{ color: '#00ffff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #00ffff', paddingBottom: '5px' }}>
                        REQUISITOS
                    </div>
                    <div style={{ marginBottom: '10px', color: hasControl ? '#00ff00' : '#ff4444' }}>
                        <span>{hasControl ? '✅' : '❌'} CONTROL AUSTRAL:</span>
                        <div style={{ fontSize: '0.8rem', paddingLeft: '20px', color: '#ccc' }}>
                            Chile, Argentina, Australia, Sudáfrica
                        </div>
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '15px' }}>
                        RECURSOS NECESARIOS:
                    </div>
                    <ul style={{ color: '#ccc', fontSize: '0.85rem', paddingLeft: '20px' }}>
                        <li>1x Industria Pesada: Seleccionar</li>
                        <li>1x Industria Electrónica: Seleccionar</li>
                        <li>1x Hierro: Ruta Válida a Base</li>
                        <li>1x Semiconductores: Ruta Válida a Base</li>
                    </ul>
                </div>

                {/* Selection Panel */}
                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* Base Selection Section */}
                    <div style={{ flex: 1, backgroundColor: '#000', padding: '15px', border: '1px solid #004444', marginBottom: '10px' }}>
                        <div style={{ color: '#ffff00', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ffff00', paddingBottom: '5px' }}>
                            1. SELECCIONE BASE DE OPERACIONES
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['chile', 'argentina', 'australia', 'sudafrica'].map(countryId => (
                                <label key={countryId} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff' }}>
                                    <input
                                        type="radio"
                                        name="antarcticaBase"
                                        value={countryId}
                                        checked={selectedAntarcticaBase === countryId}
                                        onChange={() => {
                                            setSelectedAntarcticaBase(countryId);
                                            // Reset raw materials as validation depends on base
                                            setSelectedAntarcticaCards(prev => ({ ...prev, ironId: null, semiId: null }));
                                        }}
                                        disabled={owners[countryId] !== player.id}
                                    />
                                    {REGIONS.find(r => r.id === countryId)?.title}
                                </label>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '10px' }}>
                            Esta base determinará la validez de los recursos. Si pierde la base, la misión se destruye.
                        </p>
                    </div>

                    {/* Raw Materials Selection with Route Validation */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Iron Selection */}
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.9rem' }}>MATERIA PRIMA: HIERRO</div>
                            <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {ironCards.length > 0 ? ironCards.map(c => {
                                    const hasRoute = selectedAntarcticaBase
                                        ? checkRoute(c.country, selectedAntarcticaBase, player.id)
                                        : false;
                                    return (
                                        <div key={c.id}
                                            onClick={() => hasRoute && setSelectedAntarcticaCards(p => ({ ...p, ironId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: selectedAntarcticaCards.ironId === c.id ? '#0088ff' : (hasRoute ? '#112233' : '#220000'),
                                                color: selectedAntarcticaCards.ironId === c.id ? '#000' : (hasRoute ? '#ccc' : '#666'),
                                                border: `1px solid ${selectedAntarcticaCards.ironId === c.id ? '#0088ff' : (hasRoute ? '#004466' : '#440000')}`,
                                                cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                fontSize: '0.8rem',
                                                display: 'flex', justifyContent: 'space-between'
                                            }}>
                                            <span>{REGIONS.find(r => r.id === c.country)?.title || c.country}</span>
                                            {!hasRoute && selectedAntarcticaBase && <span style={{ color: '#ff4444', fontSize: '0.7em' }}>SIN RUTA</span>}
                                        </div>
                                    );
                                }) : <div style={{ color: '#555', fontSize: '0.8rem' }}>No disponible</div>}
                            </div>
                        </div>

                        {/* Semi Selection */}
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.9rem' }}>MATERIA PRIMA: SEMIC.</div>
                            <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {semiCards.length > 0 ? semiCards.map(c => {
                                    const hasRoute = selectedAntarcticaBase
                                        ? checkRoute(c.country, selectedAntarcticaBase, player.id)
                                        : false;
                                    return (
                                        <div key={c.id}
                                            onClick={() => hasRoute && setSelectedAntarcticaCards(p => ({ ...p, semiId: c.id }))}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: selectedAntarcticaCards.semiId === c.id ? '#0088ff' : (hasRoute ? '#112233' : '#220000'),
                                                color: selectedAntarcticaCards.semiId === c.id ? '#000' : (hasRoute ? '#ccc' : '#666'),
                                                border: `1px solid ${selectedAntarcticaCards.semiId === c.id ? '#0088ff' : (hasRoute ? '#004466' : '#440000')}`,
                                                cursor: hasRoute ? 'pointer' : 'not-allowed',
                                                fontSize: '0.8rem',
                                                display: 'flex', justifyContent: 'space-between'
                                            }}>
                                            <span>{REGIONS.find(r => r.id === c.country)?.title || c.country}</span>
                                            {!hasRoute && selectedAntarcticaBase && <span style={{ color: '#ff4444', fontSize: '0.7em' }}>SIN RUTA</span>}
                                        </div>
                                    );
                                }) : <div style={{ color: '#555', fontSize: '0.8rem' }}>No disponible</div>}
                            </div>
                        </div>
                    </div>


                    {/* Tech Selection (No Route Needed) */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        {/* Heavy Ind */}
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.9rem' }}>TECNOLOGÍA: IND. PESADA</div>
                            <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {heavyIndCards.length > 0 ? heavyIndCards.map(c => (
                                    <button key={c.id}
                                        onClick={() => setSelectedAntarcticaCards(p => ({ ...p, heavyIndId: c.id }))}
                                        style={{
                                            padding: '5px',
                                            backgroundColor: selectedAntarcticaCards.heavyIndId === c.id ? '#00ff00' : '#002200',
                                            color: selectedAntarcticaCards.heavyIndId === c.id ? '#000' : '#00ff00',
                                            border: `1px solid ${selectedAntarcticaCards.heavyIndId === c.id ? '#00ff00' : '#004400'}`,
                                            cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left'
                                        }}>
                                        {REGIONS.find(r => r.id === c.country)?.title || c.country}
                                    </button>
                                )) : <div style={{ color: '#555', fontSize: '0.8rem' }}>No disp.</div>}
                            </div>
                        </div>

                        {/* Elec Ind */}
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.9rem' }}>TECNOLOGÍA: IND. ELEC.</div>
                            <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {elecIndCards.length > 0 ? elecIndCards.map(c => (
                                    <button key={c.id}
                                        onClick={() => setSelectedAntarcticaCards(p => ({ ...p, elecIndId: c.id }))}
                                        style={{
                                            padding: '5px',
                                            backgroundColor: selectedAntarcticaCards.elecIndId === c.id ? '#00ff00' : '#002200',
                                            color: selectedAntarcticaCards.elecIndId === c.id ? '#000' : '#00ff00',
                                            border: `1px solid ${selectedAntarcticaCards.elecIndId === c.id ? '#00ff00' : '#004400'}`,
                                            cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left'
                                        }}>
                                        {REGIONS.find(r => r.id === c.country)?.title || c.country}
                                    </button>
                                )) : <div style={{ color: '#555', fontSize: '0.8rem' }}>No disp.</div>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button
                    onClick={onClose}
                    style={{
                        flex: 1, padding: '15px', backgroundColor: 'transparent',
                        color: '#ccc', border: '1px solid #666', cursor: 'pointer'
                    }}>
                    CANCELAR
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
                        boxShadow: !canComplete ? 'none' : '0 0 20px rgba(0, 255, 255, 0.4)'
                    }}>
                    ESTABLECER RUTA
                </button>
            </div>
        </MissionModalBase>
    );
};
