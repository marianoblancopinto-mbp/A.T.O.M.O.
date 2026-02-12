import React, { useState } from 'react';
import { getSpecialMissions, type SpecialMission } from '../../../../data/missionData';
import { WAR_SECRETS_RESOURCES } from '../../../../data/productionData';
import { useGameContext } from '../../../../context/GameContext';
import { REGIONS } from '../../../../data/mapRegions';
import type { RawMaterialType } from '../../../../types/productionTypes';

interface WarSecretsModalProps {
    onClose: () => void;
    // We pass proxyWarCountry name or ID. Based on previous usage it was name (title).
    // Let's expect title for backward compatibility or change to ID if possible.
    // Previous code found ID from title: REGIONS.find(r => r.title === proxyWarCountry)?.id
    // Let's pass the Title as before to match usage in TegMap, or better, pass the ID if available.
    // TegMap has proxyWarCountry state which is likely a Name/Title.
    proxyWarCountryName: string;
    onSuccess: (playerName: string, countryName: string) => void;
}

export const WarSecretsModal: React.FC<WarSecretsModalProps> = ({
    onClose,
    proxyWarCountryName,
    onSuccess
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex } = state;
    const [selectedAgency, setSelectedAgency] = useState<'CIA' | 'MSS' | null>(null);

    const player = players[currentPlayerIndex];
    if (!player) return null;

    // Determine availability of Agencies
    // CIA requires control of New York (nueva_york) OR having the CIA card?
    // Previous code checked for Espionage Card with origin 'nueva_york' or 'china'.
    const hasCIACard = player.specialCards.some(c => c.type === 'ESPIONAJE' && c.originCountry === 'nueva_york');
    const hasMSSCard = player.specialCards.some(c => c.type === 'ESPIONAJE' && c.originCountry === 'china');

    // If only one card, auto-select? Or let user choose? 
    // Previous UI allowed switching if both available.

    // Mission Data
    const mission = getSpecialMissions(proxyWarCountryName).find((m: SpecialMission) => m.id === 'secretos_guerra');
    const countryId = REGIONS.find(r => r.title === proxyWarCountryName)?.id;

    if (!countryId) return null;

    const handleConfirm = (resourceType: RawMaterialType) => {
        if (!selectedAgency) return;

        // Verify card again just in case
        const techCard = player.specialCards.find(c =>
            c.type === 'ESPIONAJE' &&
            c.originCountry === (selectedAgency === 'CIA' ? 'nueva_york' : 'china')
        );

        if (!techCard) {
            alert("Error: No se encontró la carta de espionaje requerida.");
            return;
        }

        // 1. Consume Espionage Card
        dispatch({
            type: 'MARK_CARD_AS_USED', // We might need a generic remove special card action or use UPDATE_PLAYER
            // MARK_CARD_AS_USED is for territory cards usually.
            // Let's check if we have REMOVE_SPECIAL_CARD or similar.
            // If not, we construct new state and UPDATE_PLAYER.
            // TegMap used: newPlayers[pIndex].specialCards = ...filter...
            // So we'll use UPDATE_PLAYER.
            payload: { cardId: techCard.id, category: 'technology' } // Fallback if it works, but better manual update.
        });

        // Actually, let's build the new player object parts.
        const updatedSpecialCards = player.specialCards.filter(c => c.id !== techCard.id);

        // 2. Add Special Mission Badge
        updatedSpecialCards.push({
            id: `mission_badge_${Date.now()}`,
            name: `SECRETOS DE ${proxyWarCountryName.toUpperCase()}`,
            description: `Operación de inteligencia exitosa en ${proxyWarCountryName}. Recursos asegurados: ${WAR_SECRETS_RESOURCES.find(r => r.type === resourceType)?.label}.`,
            type: 'SECRETOS_GUERRA',
            originCountry: countryId,
            createdAt: Date.now()
        });

        // 3. Add Raw Material Card
        const newRawMaterial = {
            id: `secret_resource_${Date.now()}`,
            type: resourceType,
            category: 'rawMaterial' as const,
            country: countryId,
            usedThisTurn: false
        };
        const updatedRawMaterials = [...player.inventory.rawMaterials, newRawMaterial];

        // 4. Update secretWarData
        const newSecretData = {
            countryId: countryId,
            resourceType: resourceType,
            agency: selectedAgency,
            isActive: true
        };
        const updatedSecretWarData = [...player.secretWarData, newSecretData];

        // 5. Update activeSpecialMissions
        const updatedActiveMissions = [...player.activeSpecialMissions, {
            id: 'secretos_guerra',
            baseRegionId: countryId
        }];

        // Dispatch Update
        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    specialCards: updatedSpecialCards,
                    inventory: {
                        ...player.inventory,
                        rawMaterials: updatedRawMaterials
                    },
                    secretWarData: updatedSecretWarData,
                    activeSpecialMissions: updatedActiveMissions
                }
            }
        });

        // Notify Parent
        onSuccess(player.name, proxyWarCountryName);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 8500,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#001a1a',
                border: '3px solid #00ffff',
                padding: '40px',
                width: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.3)',
                borderRadius: '8px'
            }}>
                <h2 style={{ color: '#00ffff', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px' }}>
                    {mission?.title || 'SECRETOS DE GUERRA'}
                </h2>
                <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '30px', fontStyle: 'italic' }}>
                    "{mission?.lore}"
                </p>

                <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #004444', backgroundColor: '#000' }}>
                    <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px' }}>AGENCIA DE INTELIGENCIA ACTIVA:</div>

                    {(() => {
                        if (hasCIACard && hasMSSCard) {
                            return (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <button
                                        onClick={() => setSelectedAgency('CIA')}
                                        style={{
                                            flex: 1, padding: '10px',
                                            backgroundColor: selectedAgency === 'CIA' ? '#00ffff' : '#003333',
                                            color: selectedAgency === 'CIA' ? '#000' : '#00ffff',
                                            border: '1px solid #00ffff', fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        USAR CIA (NUEVA YORK)
                                    </button>
                                    <button
                                        onClick={() => setSelectedAgency('MSS')}
                                        style={{
                                            flex: 1, padding: '10px',
                                            backgroundColor: selectedAgency === 'MSS' ? '#00ffff' : '#003333',
                                            color: selectedAgency === 'MSS' ? '#000' : '#00ffff',
                                            border: '1px solid #00ffff', fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        USAR MSS (CHINA)
                                    </button>
                                </div>
                            );
                        }

                        if (hasCIACard) {
                            if (selectedAgency !== 'CIA') setSelectedAgency('CIA');
                            return <div style={{ color: '#00ffff', fontWeight: 'bold' }}>CIA (CENTRAL INTELLIGENCE AGENCY)</div>;
                        }
                        if (hasMSSCard) {
                            if (selectedAgency !== 'MSS') setSelectedAgency('MSS');
                            return <div style={{ color: '#00ffff', fontWeight: 'bold' }}>MSS (MINISTRY OF STATE SECURITY)</div>;
                        }

                        return (
                            <div style={{ color: '#ff4444', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                NINGUNA AGENCIA DISPONIBLE (REQUIERE CARTA DE ESPIONAJE)
                            </div>
                        );
                    })()}

                    <div style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '5px' }}>
                        ⚠ ADVERTENCIA: Esta red de espionaje será desmantelada (cartas consumidas) tras esta operación.
                    </div>
                </div>

                <h3 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>IDENTIFICAR RECURSO ESTRATÉGICO</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                    {WAR_SECRETS_RESOURCES.map(res => (
                        <button
                            key={res.type}
                            disabled={!selectedAgency}
                            onClick={() => {
                                handleConfirm(res.type);
                                // We can trigger callback here if we add onSuccess prop
                            }}
                            style={{
                                padding: '15px',
                                backgroundColor: !selectedAgency ? '#111' : '#003333',
                                color: !selectedAgency ? '#444' : '#00ffff',
                                border: `1px solid ${!selectedAgency ? '#333' : '#00ffff'}`,
                                cursor: !selectedAgency ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedAgency) {
                                    e.currentTarget.style.backgroundColor = '#00ffff';
                                    e.currentTarget.style.color = '#000';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedAgency) {
                                    e.currentTarget.style.backgroundColor = '#003333';
                                    e.currentTarget.style.color = '#00ffff';
                                }
                            }}
                        >
                            {res.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: '40px',
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: '1px solid #666',
                        color: '#666',
                        cursor: 'pointer'
                    }}
                >
                    CANCELAR OPERACIÓN
                </button>
            </div>
        </div>
    );
};
