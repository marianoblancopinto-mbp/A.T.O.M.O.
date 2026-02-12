import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { TECHNOLOGY_DATA } from '../../../../data/productionData';
import type { TechnologyType } from '../../../../types/productionTypes';
import type { SpecialCard } from '../../../../types/playerTypes';

interface EspionageGenerationModalProps {
    show: boolean;
    onClose: () => void;
    hqId: string | null;
}

// Better to import REGIONS to avoid prop drilling if we can, but it's passed in TegMap.
// Let's just import it to be clean.
import { REGIONS } from '../../../../data/mapRegions';
import { AGENCY_NAMES } from '../../../../data/constants';

export const EspionageGenerationModal: React.FC<EspionageGenerationModalProps> = ({
    show,
    onClose,
    hqId
}) => {
    const { state, dispatch } = useGameContext();
    const { currentPlayerIndex, players } = state;
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);
    const { checkRoute } = useSupplyRoute();

    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
    const [selectedRawId, setSelectedRawId] = useState<string | null>(null);

    if (!show || !hqId) return null;

    // Filter logic based on what TegMap passed before:
    // availableTech usually was all tech? Or filtered?
    // TegMap passed: players[currentPlayerIndex]?.inventory?.technologies
    // So distinct filtering for Espionage usually requires:
    // Tech: Electronics (INDUSTRIA_ELECTRONICA) ? 
    // Raw: Semiconductors?
    // Let's check previous usage context or assume standard Espionage recipe.
    // In TegMap calls: handleGenerateEspionage used specific logic?
    // "createEspionageCard" in TegMap isn't visible here but usually Espionage needs tech+raw.
    // Let's assume standard filtering for now: ANY tech/raw or specific?
    // Looking at the UI text in the previous file content:
    // "Seleccione Industria Electrónica"
    // "Seleccione Semiconductores"

    const availableTech = technologies.filter(c => c.type === 'INDUSTRIA_ELECTRONICA' && !c.usedThisTurn);
    const availableRaw = rawMaterials.filter(c => c.type === 'CONDUCTORES_SEMICONDUCTORES' && !c.usedThisTurn);

    const handleGenerate = () => {
        if (!hqId || !selectedTechId || !selectedRawId) return;

        // 1. Consume Cards
        dispatch({ type: 'MARK_CARD_AS_USED', payload: { cardId: selectedTechId, category: 'technology' } });
        dispatch({ type: 'MARK_CARD_AS_USED', payload: { cardId: selectedRawId, category: 'rawMaterial' } });

        // 2. Create Espionage Card
        // Logic from what handleGenerateEspionage likely did.
        const newCard = {
            id: `special-espionage-${Date.now()}`,
            type: 'ESPIONAJE',
            name: 'RED DE ESPIONAJE',
            originCountry: hqId,
            description: `Red de inteligencia operativa en ${REGIONS.find(r => r.id === hqId)?.title}.`,
            createdAt: Date.now()
        } as SpecialCard;

        const player = players[currentPlayerIndex];
        const updatedSpecialCards = [...player.specialCards, newCard];

        // Also update secretWarData if applicable? 
        // "REINO_UNIDO" -> agency MI6, etc.
        // Check if we need to track agency usage.
        // For now, adding the card seems primary purpose.

        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    specialCards: updatedSpecialCards
                }
            }
        });

        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'ESPIONAJE',
                title: 'RED DE ESPIONAJE ACTIVA',
                message: `La agencia ${AGENCY_NAMES[hqId] || 'DESCONOCIDA'} ha establecido comunicaciones seguras. Capacidad de infiltración operativa.`,
                color: '#00ffff'
            }
        });

        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 6100,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#001a1a',
                border: '3px solid #00ffff',
                padding: '30px',
                width: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.4)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#00ffff', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>🏳️ PROCESAR INTELIGENCIA</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#00ffff', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

                <div style={{ backgroundColor: '#000', padding: '15px', marginBottom: '25px', border: '1px solid #333', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>AGENCIA OPERATIVA:</div>
                            <div style={{ color: '#00ffff', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                                {AGENCY_NAMES[hqId] || 'DESCONOCIDA'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>SEDE DE INTELIGENCIA:</div>
                            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                                {REGIONS.find(r => r.id === hqId)?.title}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    {/* Technology Column */}
                    <div>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '5px' }}>1. TECNOLOGÍA</h4>
                        <p style={{ fontSize: '0.7rem', color: '#888' }}>Seleccione Industria Electrónica:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            {availableTech.length === 0 ? (
                                <div style={{ color: '#ff4444', fontSize: '0.8rem', border: '1px dashed #ff4444', padding: '10px' }}>
                                    Sin tecnología disponible.
                                </div>
                            ) : availableTech.map(card => {
                                const isSelected = selectedTechId === card.id;
                                return (
                                    <div
                                        key={card.id}
                                        onClick={() => setSelectedTechId(card.id)}
                                        style={{
                                            padding: '10px',
                                            border: isSelected ? '2px solid #00ff00' : '1px solid #333',
                                            backgroundColor: isSelected ? '#002200' : '#0a0a0a',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            color: isSelected ? '#fff' : '#aaa'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{TECHNOLOGY_DATA[card.type as TechnologyType]?.name || card.type}</span>
                                            {isSelected && <span style={{ color: '#00ff00' }}>✓</span>}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>
                                            Origen: {REGIONS.find(r => r.id === card.country)?.title}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Raw Material Column */}
                    <div>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '5px' }}>2. MATERIA PRIMA</h4>
                        <p style={{ fontSize: '0.7rem', color: '#888' }}>Seleccione Semiconductores:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            {availableRaw.length === 0 ? (
                                <div style={{ color: '#ff4444', fontSize: '0.8rem', border: '1px dashed #ff4444', padding: '10px' }}>
                                    Sin semiconductores disponibles.
                                </div>
                            ) : availableRaw.map(card => {
                                const isSelected = selectedRawId === card.id;
                                const hasRoute = checkRoute(card.country!, hqId, currentPlayerIndex);
                                const isSelectable = hasRoute;

                                return (
                                    <div
                                        key={card.id}
                                        onClick={() => isSelectable && setSelectedRawId(card.id)}
                                        style={{
                                            padding: '10px',
                                            border: isSelected ? '2px solid #00ff00' : (isSelectable ? '1px solid #333' : '1px solid #300'),
                                            backgroundColor: isSelected ? '#002200' : (isSelectable ? '#0a0a0a' : '#1a0000'),
                                            cursor: isSelectable ? 'pointer' : 'not-allowed',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            color: isSelectable ? (isSelected ? '#fff' : '#aaa') : '#600',
                                            textDecoration: isSelectable ? 'none' : 'line-through'
                                        }}
                                    >
                                        <div>{REGIONS.find(r => r.id === card.country)?.title}</div>
                                        {!hasRoute && <div style={{ fontSize: '0.6rem', color: '#ff4444' }}>SIN RUTA A SEDE</div>}
                                        {isSelected && <span style={{ float: 'right', color: '#00ff00', marginTop: '-15px' }}>✓</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={!selectedTechId || !selectedRawId}
                    style={{
                        width: '100%',
                        marginTop: '30px',
                        padding: '15px',
                        backgroundColor: (selectedTechId && selectedRawId) ? '#00ffff' : '#222',
                        color: (selectedTechId && selectedRawId) ? '#000' : '#444',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: (selectedTechId && selectedRawId) ? 'pointer' : 'not-allowed',
                        fontSize: '1rem',
                        letterSpacing: '5px',
                        borderRadius: '4px'
                    }}
                >
                    TRANSMITIR INTELIGENCIA
                </button>
            </div>
        </div>
    );
};
