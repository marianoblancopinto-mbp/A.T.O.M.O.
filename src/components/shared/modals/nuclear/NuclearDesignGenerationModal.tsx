import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { REGIONS } from '../../../../data/mapRegions';
import { TECHNOLOGY_DATA } from '../../../../data/productionData';
import type { TechnologyType } from '../../../../types/productionTypes';

interface NuclearDesignGenerationModalProps {
    onClose: () => void;
    locationId: string | null;
}

export const NuclearDesignGenerationModal: React.FC<NuclearDesignGenerationModalProps> = ({
    onClose,
    locationId
}) => {
    const { state } = useGameContext();
    const { currentPlayerIndex, owners } = state;
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);
    const { checkRoute } = useSupplyRoute();
    const gameActions = useGameActions();

    const [selectedFallback, setSelectedFallback] = useState<string | null>(null);
    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
    const [selectedRawId, setSelectedRawId] = useState<string | null>(null);

    // Determine effective location ID
    const effectiveLocationId = locationId === 'SELECTION_NEEDED' ? selectedFallback : locationId;

    // Reset selection when modal opens/closes
    useEffect(() => {
        if (!locationId) {
            setSelectedTechId(null);
            setSelectedRawId(null);
            setSelectedFallback(null);
        }
    }, [locationId]);

    if (!locationId) return null;

    // Filter cards specific to this mission
    // Tech: Electronics (INDUSTRIA_ELECTRONICA)
    const availableTech = technologies.filter(c => c.type === 'INDUSTRIA_ELECTRONICA' && !c.usedThisTurn);
    // Raw: Semiconductors (SEMICONDUCTORES)
    const availableRaw = rawMaterials.filter(c => c.type === 'CONDUCTORES_SEMICONDUCTORES' && !c.usedThisTurn);

    const handleConfirm = () => {
        if (!effectiveLocationId || !selectedTechId || !selectedRawId) return;

        gameActions.generateNuclearDesign(effectiveLocationId, {
            techId: selectedTechId,
            rawId: selectedRawId
        });

        onClose();
    };

    // Region Selection Logic
    // Only countries capable of Nuclear War tech are valid sites for design
    // Use dynamic list from game state (not static provider list)
    const nuclearCapableCountries = state.regionResources?.nuclearWarCapable || [];

    // Get current player ID for strict ownership check
    const currentPlayer = state.players[currentPlayerIndex];
    if (!currentPlayer) return null; // Should not happen

    const playerOwnedRegions = Object.entries(owners)
        .filter(([_, ownerId]) => ownerId === currentPlayer.id)
        .map(([rid]) => rid)
        .filter(rid => nuclearCapableCountries.includes(rid));

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 6100,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#1a0a00',
                border: '3px solid #ff9100',
                padding: '30px',
                width: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(255, 145, 0, 0.4)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#ff9100', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>🏳️ COMPLETAR DISEÑO DE ARMAS NUCLEARES</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#ff9100', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

                {locationId === 'SELECTION_NEEDED' && (
                    <div style={{ marginBottom: '20px', borderBottom: '1px solid #ff9100', paddingBottom: '20px' }}>
                        <h3 style={{ color: '#fff' }}>Seleccionar Sede del Diseño</h3>
                        {playerOwnedRegions.length === 0 ? (
                            <div style={{ color: '#ff4444', fontStyle: 'italic', padding: '10px', border: '1px dashed #ff4444' }}>
                                No controlas ningún territorio con capacidad nuclear (e.g. Potencias Mundiales como Rusia, China, USA, etc.).
                                <br />Debes conquistar uno de estos territorios para iniciar el diseño.
                            </div>
                        ) : (
                            <select
                                value={selectedFallback || ''}
                                onChange={(e) => setSelectedFallback(e.target.value || null)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: '#000',
                                    color: '#ff9100',
                                    border: '1px solid #ff9100',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">-- Seleccionar Territorio Nuclear --</option>
                                {playerOwnedRegions.map(rid => (
                                    <option key={rid} value={rid}>{REGIONS.find(r => r.id === rid)?.title}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {effectiveLocationId ? (
                    <>
                        <div style={{ backgroundColor: '#000', padding: '15px', marginBottom: '25px', border: '1px solid #442200', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>PROYECTO:</div>
                                    <div style={{ color: '#ff9100', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                                        DISEÑO ARMAS NUCLEARES
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>UBICACIÓN:</div>
                                    <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                                        {REGIONS.find(r => r.id === effectiveLocationId)?.title}
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
                                                    border: isSelected ? '2px solid #ff9100' : '1px solid #333',
                                                    backgroundColor: isSelected ? '#331a00' : '#0a0a0a',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    color: isSelected ? '#fff' : '#aaa'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{TECHNOLOGY_DATA[card.type as TechnologyType]?.name || card.type}</span>
                                                    {isSelected && <span style={{ color: '#ff9100' }}>✓</span>}
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
                                        const hasRoute = checkRoute(card.country!, effectiveLocationId, currentPlayerIndex);
                                        const isSelectable = hasRoute;

                                        return (
                                            <div
                                                key={card.id}
                                                onClick={() => isSelectable && setSelectedRawId(card.id)}
                                                style={{
                                                    padding: '10px',
                                                    border: isSelected ? '2px solid #ff9100' : (isSelectable ? '1px solid #333' : '1px solid #300'),
                                                    backgroundColor: isSelected ? '#331a00' : (isSelectable ? '#0a0a0a' : '#1a0000'),
                                                    cursor: isSelectable ? 'pointer' : 'not-allowed',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    color: isSelectable ? (isSelected ? '#fff' : '#aaa') : '#600',
                                                    textDecoration: isSelectable ? 'none' : 'line-through'
                                                }}
                                            >
                                                <div>{REGIONS.find(r => r.id === card.country)?.title}</div>
                                                {!hasRoute && <div style={{ fontSize: '0.6rem', color: '#ff4444' }}>SIN RUTA A UBICACIÓN</div>}
                                                {isSelected && <span style={{ float: 'right', color: '#ff9100', marginTop: '-15px' }}>✓</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!selectedTechId || !selectedRawId}
                            style={{
                                width: '100%',
                                marginTop: '30px',
                                padding: '15px',
                                backgroundColor: (selectedTechId && selectedRawId) ? '#ff9100' : '#222',
                                color: (selectedTechId && selectedRawId) ? '#000' : '#444',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: (selectedTechId && selectedRawId) ? 'pointer' : 'not-allowed',
                                fontSize: '1rem',
                                letterSpacing: '5px',
                                borderRadius: '4px'
                            }}
                        >
                            COMPLETAR DISEÑO
                        </button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '50px' }}>
                        {locationId === 'SELECTION_NEEDED' ? (
                            playerOwnedRegions.length > 0 ? "Selecciona un territorio para comenzar." : "Requisitos no cumplidos."
                        ) : (
                            "Esperando selección..."
                        )}
                        <br /><br />
                        <button onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid #666', color: '#aaa', cursor: 'pointer' }}>CANCELAR</button>
                    </div>
                )}
            </div>
        </div>
    );
};
