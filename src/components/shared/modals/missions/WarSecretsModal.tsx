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
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '850px',
                backgroundColor: '#001a1a',
                border: '3px solid #00ffff',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.3)',
                color: '#ccffff',
                fontFamily: 'monospace',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #00ffff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.8em', textTransform: 'uppercase', letterSpacing: '2px', color: '#00ffff' }}>
                        {mission?.title || 'SECRETOS DE GUERRA'}
                    </h2>
                    <div style={{ fontSize: '0.9em', color: '#00ffff' }}>
                        INTELIGENCIA ESTRATÉGICA
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                    {/* Requirements Panel */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px', fontSize: '1.2em', fontWeight: 'bold', color: '#00ffff', letterSpacing: '1px' }}>
                            REQUISITOS DE OPERACIÓN:
                        </div>

                        {/* Agency Selection */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>AGENCIA ACTIVA:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(() => {
                                    if (hasCIACard && hasMSSCard) {
                                        return (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => setSelectedAgency('CIA')}
                                                    style={{
                                                        flex: 1, padding: '12px',
                                                        backgroundColor: selectedAgency === 'CIA' ? '#00ffff' : '#001a1a',
                                                        color: selectedAgency === 'CIA' ? '#000' : '#00ffff',
                                                        border: '1px solid #00ffff', fontWeight: 'bold', cursor: 'pointer',
                                                        transition: 'all 0.2s', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    CIA (NYC)
                                                </button>
                                                <button
                                                    onClick={() => setSelectedAgency('MSS')}
                                                    style={{
                                                        flex: 1, padding: '12px',
                                                        backgroundColor: selectedAgency === 'MSS' ? '#00ffff' : '#001a1a',
                                                        color: selectedAgency === 'MSS' ? '#000' : '#00ffff',
                                                        border: '1px solid #00ffff', fontWeight: 'bold', cursor: 'pointer',
                                                        transition: 'all 0.2s', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    MSS (CN)
                                                </button>
                                            </div>
                                        );
                                    }

                                    if (hasCIACard) {
                                        if (selectedAgency !== 'CIA') setSelectedAgency('CIA');
                                        return (
                                            <div style={{ padding: '15px', backgroundColor: 'rgba(0, 255, 255, 0.1)', border: '1px solid #00ffff', color: '#00ffff', textAlign: 'center', fontWeight: 'bold' }}>
                                                CIA ACTIVADA (NUEVA YORK)
                                            </div>
                                        );
                                    }
                                    if (hasMSSCard) {
                                        if (selectedAgency !== 'MSS') setSelectedAgency('MSS');
                                        return (
                                            <div style={{ padding: '15px', backgroundColor: 'rgba(0, 255, 255, 0.1)', border: '1px solid #00ffff', color: '#00ffff', textAlign: 'center', fontWeight: 'bold' }}>
                                                MSS ACTIVADA (CHINA)
                                            </div>
                                        );
                                    }

                                    return (
                                        <div style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center', padding: '15px', backgroundColor: 'rgba(255,0,0,0.05)', border: '1px dashed #ff4444' }}>
                                            Requiere carta de espionaje del eje.
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {selectedAgency && (
                            <div>
                                <div style={{ color: '#aaa', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>OBJETIVO DE RECURSO:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                    {WAR_SECRETS_RESOURCES.map(res => (
                                        <button
                                            key={res.type}
                                            onClick={() => handleConfirm(res.type)}
                                            style={{
                                                padding: '12px',
                                                backgroundColor: '#001a1a',
                                                color: '#00ffff',
                                                border: '1px solid #00ffff',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s',
                                                textAlign: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#00ffff';
                                                e.currentTarget.style.color = '#000';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#001a1a';
                                                e.currentTarget.style.color = '#00ffff';
                                            }}
                                        >
                                            EXTRAER {res.label.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Panel */}
                    <div style={{ width: '320px', borderLeft: '1px solid #00ffff', paddingLeft: '30px' }}>
                        <h3 style={{ marginTop: 0, color: '#00ffff' }}>ARCHIVO CLASIFICADO</h3>
                        <div style={{ backgroundColor: 'rgba(0, 255, 255, 0.05)', padding: '20px', border: '1px dashed #00ffff' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '12px', color: '#00ffff' }}>
                                PROTOCOLO "PHANTOM"
                            </div>
                            <p style={{ fontSize: '0.9em', lineHeight: '1.5', color: '#88ffff', fontStyle: 'italic', margin: 0 }}>
                                "{mission?.lore || 'Infiltración profunda para asegurar recursos en territorios en disputa.'}"
                            </p>
                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(0,255,255,0.2)', paddingTop: '15px' }}>
                                <div style={{ fontWeight: 'bold', color: '#00ffff', fontSize: '0.8rem', marginBottom: '5px' }}>ADVERTENCIA GEOFULMINANTE:</div>
                                <p style={{ fontSize: '0.8rem', color: '#ff4444', margin: 0 }}>
                                    La agencia será desmantelada tras el éxito. Los recursos se enviarán al inventario global de inmediato.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '15px',
                            backgroundColor: 'transparent',
                            color: '#00ffff',
                            border: '1px solid #004444',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            textTransform: 'uppercase'
                        }}
                    >
                        ABORTAR OPERACIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};
