/**
 * useGameActions Hook
 *
 * Connects the GameActions service with React state from GameContext.
 * This is the bridge between UI components and game logic.
 */

import { useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { GameActions } from '../services/gameActions';
import type { PlayerData, SpecialCard } from '../types/playerTypes';
import type { SupplyItem } from '../types/productionTypes';
import type { BattleState } from '../types/gameTypes';
import { REGIONS } from '../data/mapRegions';

/**
 * Hook that provides game actions connected to React state.
 *
 * Usage in TegMap:
 * ```
 * const gameActions = useGameActions();
 *
 * // Then use:
 * gameActions.markCardAsUsed(cardId, 'technology');
 * ```
 */
export const useGameActions = (): GameActions & {
    resolveBattle: (battleState: BattleState, winner: 'attacker' | 'defender') => void;
    executeEspionage: (targetPlayerId: number, infoType: 'silos' | 'mineral') => import('../types/playerTypes').EspionageReport | null;
    activateNuclearArsenal: (regionId: string, activationCards: { techId: string, rawId: string }) => void;
    extractSecretMineral: (regionId: string, resources: { techId: string, ironId: string, waterId: string }) => void;
    constructSilo: (targetRegionId: string, resources: { techLightId: string, techHeavyId: string, techElecId: string, ironId: string, alumId: string, semiId: string }) => void;
    initiateNuclearDeployment: (fuelCardId: string) => void;
    generateNuclearDesign: (locationId: string, resources: { techId: string, rawId: string }) => void;
} => {
    const { state, dispatch } = useGameContext();
    const { owners, players, currentPlayerIndex } = state;

    const resolveBattle = (battleState: BattleState, winner: 'attacker' | 'defender') => {
        const { attackSourceId, targetRegionId, defender, attacker } = battleState;

        if (winner === 'attacker') {
            // Conquest Successful
            dispatch({
                type: 'UPDATE_OWNER',
                payload: { regionId: targetRegionId, ownerIndex: attacker.id }
            });

            // Transfer/Destroy cards logic using UPDATE_PLAYERS_FN
            dispatch({
                type: 'UPDATE_PLAYERS_FN',
                payload: (currentPlayers) => {
                    const attackerId = attacker.id;
                    const defenderId = defender.id;

                    return currentPlayers.map(p => {
                        // 1. Logic for Defender (Loser)
                        if (p.id === defenderId) {
                            const lostCards = p.specialCards.filter((c: SpecialCard) => c.originCountry === targetRegionId);
                            const lostSilo = p.silos.includes(targetRegionId);

                            let newSiloStatus = p.siloStatus;
                            let newNuclearDeploymentActive = p.nuclearDeploymentActive;

                            if (lostSilo) {
                                const { [targetRegionId]: _, ...remainingStatus } = p.siloStatus;
                                newSiloStatus = remainingStatus;
                                if (newNuclearDeploymentActive) {
                                    newNuclearDeploymentActive = false;
                                }
                            }

                            if (lostCards.length > 0) {
                                const lostCrucialCard = lostCards.some((c: SpecialCard) =>
                                    c.name === 'DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES' ||
                                    c.name === 'SILO DE LANZAMIENTO' ||
                                    c.name === 'MINERAL SECRETO'
                                );
                                if (lostCrucialCard && newNuclearDeploymentActive) {
                                    newNuclearDeploymentActive = false;
                                }
                            }

                            const updatedInventory = p.inventory?.rawMaterials
                                ? {
                                    ...p.inventory,
                                    rawMaterials: p.inventory.rawMaterials.filter((r: any) => !(r.country === targetRegionId && r.id.toString().startsWith('secret_resource_')))
                                }
                                : p.inventory;

                            return {
                                ...p,
                                specialCards: p.specialCards.filter((c: SpecialCard) => c.originCountry !== targetRegionId),
                                siloStatus: newSiloStatus,
                                nuclearDeploymentActive: newNuclearDeploymentActive,
                                silos: lostSilo ? p.silos.filter((id: string) => id !== targetRegionId) : p.silos,
                                inventory: updatedInventory,
                                // Type safe check for secretWarData existence
                                secretWarData: (p as any).secretWarData ? (p as any).secretWarData.filter((d: any) => d.countryId !== targetRegionId) : []
                            };
                        }

                        // 2. Logic for Attacker (Winner)
                        if (p.id === attackerId) {
                            // Find the defender in the *current* state (not closure) to get their cards
                            const currentDefender = currentPlayers.find(d => d.id === defenderId);
                            if (!currentDefender) return p;

                            const allGainedCards = currentDefender.specialCards.filter((c: SpecialCard) => c.originCountry === targetRegionId);
                            const transferrableCards = allGainedCards.filter((c: SpecialCard) => !c.name.includes("SECRETOS DE") && c.type !== 'SECRETOS_GUERRA');

                            if (transferrableCards.length > 0) {
                                return {
                                    ...p,
                                    specialCards: [...p.specialCards, ...transferrableCards]
                                };
                            }
                        }

                        // 3. Logic for 'Alejandro Magno' loss (Global check)
                        if (p.alejandroMagnoActive) {
                            const alejandroCountries = ['grecia', 'turquia', 'egipto', 'iran'];
                            if (p.id === defenderId && alejandroCountries.includes(targetRegionId)) {
                                return { ...p, alejandroMagnoActive: false };
                            }
                        }

                        return p;
                    });
                }
            });

        } else {
            // Defender Wins
            // Check if Attacker lost Alejandro Magno bonus
            dispatch({
                type: 'UPDATE_PLAYERS_FN',
                payload: (currentPlayers) => {
                    return currentPlayers.map(p => {
                        if (p.id === attacker.id && p.alejandroMagnoActive) {
                            const alejandroCountries = ['grecia', 'turquia', 'egipto', 'iran'];
                            if (alejandroCountries.includes(attackSourceId) || alejandroCountries.includes(targetRegionId)) {
                                return { ...p, alejandroMagnoActive: false };
                            }
                        }
                        return p;
                    });
                }
            });
        }

        dispatch({ type: 'END_BATTLE' });
    };

    const executeEspionage = (targetPlayerId: number, infoType: 'silos' | 'mineral'): import('../types/playerTypes').EspionageReport | null => {
        const targetPlayer = players[targetPlayerId];
        if (!targetPlayer) return null;

        let result: any = null;

        if (infoType === 'silos') {
            result = targetPlayer.silos.map(sid => ({
                location: REGIONS.find(r => r.id === sid)?.title || sid,
                status: targetPlayer.siloStatus[sid]?.status || 'unknown'
            }));
        } else {
            result = {
                location: REGIONS.find(r => r.id === targetPlayer.secretMineralLocation)?.title || targetPlayer.secretMineralLocation,
                isExtracted: targetPlayer.specialCards.some(c => c.type === 'SECRET_MINERAL')
            };
        }

        // Consume one espionage card
        dispatch({
            type: 'UPDATE_PLAYERS_FN',
            payload: (currentPlayers) => {
                return currentPlayers.map(p => {
                    if (p.id === players[currentPlayerIndex].id) {
                        const cardIndex = p.specialCards.findIndex(c => c.type === 'ESPIONAJE');
                        if (cardIndex !== -1) {
                            const newCards = [...p.specialCards];
                            newCards.splice(cardIndex, 1);
                            return { ...p, specialCards: newCards };
                        }
                    }
                    return p;
                });
            }
        });

        return { type: infoType, data: result };
    };

    const activateNuclearArsenal = (regionId: string, activationCards: { techId: string, rawId: string }) => {
        // 1. Consume Cards
        dispatch({
            type: 'UPDATE_PRODUCTION_DECK_FN',
            payload: (prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    technologies: prev.technologies.map(card =>
                        card.id === activationCards.techId ? { ...card, usedThisTurn: true } : card),
                    rawMaterials: prev.rawMaterials.map(card =>
                        card.id === activationCards.rawId ? { ...card, usedThisTurn: true } : card)
                };
            }
        });

        // 2. Create Nuclear Weapon Card
        const newCard: SpecialCard = {
            id: `nuclear-weapon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'NUCLEAR_WEAPON',
            name: 'ARMA NUCLEAR INTERCONTINENTAL',
            originCountry: regionId,
            description: 'Ojiva nuclear de largo alcance. Capacidad de destrucción masiva.',
            createdAt: Date.now()
        };

        // 3. Add to Player
        dispatch({
            type: 'ADD_SPECIAL_CARD',
            payload: {
                playerIndex: currentPlayerIndex,
                card: newCard
            }
        });

        // 4. Notification
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'SECONDARY_MISSION',
                title: 'ARSENAL NUCLEAR ACTIVADO',
                message: 'Se han fabricado Armas Nucleares Intercontinentales. Capacidad de lanzamiento operativa.',
                color: '#00ff00',
                playerName: players[currentPlayerIndex].name
            }
        });
    };

    const extractSecretMineral = (regionId: string, resources: { techId: string, ironId: string, waterId: string }) => {
        // 1. Consume Cards
        dispatch({
            type: 'UPDATE_PRODUCTION_DECK_FN',
            payload: (prev) => {
                if (!prev) return null;
                const markUsed = (cards: any[], id: string) => cards.map(c => c.id === id ? { ...c, usedThisTurn: true } : c);
                return {
                    ...prev,
                    technologies: markUsed(prev.technologies, resources.techId),
                    rawMaterials: markUsed(markUsed(prev.rawMaterials, resources.ironId), resources.waterId)
                };
            }
        });

        // 2. Create Secret Mineral Card
        const newCard: SpecialCard = {
            id: `special-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'SECRET_MINERAL',
            name: 'MINERAL SECRETO',
            originCountry: regionId,
            description: 'Recurso estratégico extraído mediante minería avanzada.',
            createdAt: Date.now()
        };

        // 3. Add to Player
        dispatch({
            type: 'ADD_SPECIAL_CARD',
            payload: {
                playerIndex: currentPlayerIndex,
                card: newCard
            }
        });

        // 4. Notification
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'SECONDARY_MISSION',
                title: 'EXTRACCIÓN DE MINERAL',
                message: `Se ha extraído Mineral Secreto en ${REGIONS.find(r => r.id === regionId)?.title || regionId}.`,
                color: '#00ffff',
                playerName: players[currentPlayerIndex].name
            }
        });
    };

    const constructSilo = (
        targetRegionId: string,
        resources: {
            techLightId: string,
            techHeavyId: string,
            techElecId: string,
            ironId: string,
            alumId: string,
            semiId: string
        }
    ) => {
        // 1. Consume Cards
        const cardsToConsume = [
            { id: resources.techLightId, type: 'technology' },
            { id: resources.techHeavyId, type: 'technology' },
            { id: resources.techElecId, type: 'technology' },
            { id: resources.ironId, type: 'rawMaterial' },
            { id: resources.alumId, type: 'rawMaterial' },
            { id: resources.semiId, type: 'rawMaterial' }
        ];

        dispatch({
            type: 'UPDATE_PRODUCTION_DECK_FN',
            payload: (prev) => {
                if (!prev) return null;
                const markUsed = (cards: any[], id: string) => cards.map(c => c.id === id ? { ...c, usedThisTurn: true } : c);

                let startTech = prev.technologies;
                let startRaw = prev.rawMaterials;

                cardsToConsume.forEach(c => {
                    if (c.type === 'technology') startTech = markUsed(startTech, c.id);
                    else startRaw = markUsed(startRaw, c.id);
                });

                return { ...prev, technologies: startTech, rawMaterials: startRaw };
            }
        });

        // 2. Update Player State (Silos, Status, Card)
        const newCard: SpecialCard = {
            id: `silo-${Date.now()}`,
            type: 'NUCLEAR_WEAPON', // Using generic type as per existing logic
            name: 'SILO DE LANZAMIENTO',
            originCountry: targetRegionId,
            description: 'Silo para lanzamiento de misiles intercontinentales.',
            createdAt: Date.now()
        };

        dispatch({
            type: 'UPDATE_PLAYERS_FN',
            payload: (currentPlayers) => {
                return currentPlayers.map(p => {
                    if (p.id === players[currentPlayerIndex].id) {
                        return {
                            ...p,
                            silos: [...p.silos, targetRegionId],
                            siloStatus: {
                                ...p.siloStatus,
                                [targetRegionId]: {
                                    status: 'construction',
                                    turnsRemaining: 1,
                                }
                            } as any, // Cast if needed for index signature
                            specialCards: [...p.specialCards, newCard]
                        };
                    }
                    return p;
                });
            }
        });

        // 3. Notification
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'SECONDARY_MISSION',
                title: 'CONSTRUCCIÓN DE SILO',
                message: `Se ha iniciado la construcción de un Silo de Lanzamiento en ${REGIONS.find(r => r.id === targetRegionId)?.title || targetRegionId}.`,
                color: '#ff9100',
                playerName: players[currentPlayerIndex].name
            }
        });
    };

    const initiateNuclearDeployment = (fuelCardId: string) => {
        // 1. Consume Fuel Card
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: fuelCardId, category: 'rawMaterial' }
        });

        // 2. Activate Nuclear Deployment
        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: { nuclearDeploymentActive: true }
            }
        });

        // 3. Notification (Global Alert)
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'NUCLEAR_ALERT',
                title: '☢️ ALERTA GLOBAL ☢️',
                message: 'PROCESO DE DESPLIEGUE NUCLEAR INICIADO. El mundo entra en estado de Defcon 1.',
                color: '#ff0000'
            }
        });
    };

    const generateNuclearDesign = (locationId: string, resources: { techId: string, rawId: string }) => {
        // 1. Consume cards
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.techId, category: 'technology' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.rawId, category: 'rawMaterial' }
        });

        // 2. Create Special Card
        const newCard: SpecialCard = {
            id: `special-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'NUCLEAR_WEAPON', // Or specific type if available, using generic as per existing
            name: 'DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES',
            originCountry: locationId,
            description: 'Capacidad de ataque nuclear global mientras se controle el territorio.',
            createdAt: Date.now()
        };

        // 3. Add to player
        dispatch({
            type: 'ADD_SPECIAL_CARD',
            payload: {
                playerIndex: currentPlayerIndex,
                card: newCard
            }
        });

        // 4. Notification
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'NUCLEAR_DESIGN',
                title: 'DISEÑO COMPLETADO',
                message: `Los archivos de diseño en ${REGIONS.find(r => r.id === locationId)?.title} han sido recuperados y procesados.`,
                color: '#ff9100'
            }
        });
    };

    const actions = useMemo(() => ({
        markCardAsUsed: (cardId: string, category: 'technology' | 'rawMaterial') => {
            dispatch({ type: 'MARK_CARD_AS_USED', payload: { cardId, category } });
        },
        addSpecialCardToPlayer: (playerIndex: number, card: SpecialCard) => {
            dispatch({ type: 'ADD_SPECIAL_CARD', payload: { playerIndex, card } });
        },
        addSupplyToPlayer: (playerIndex: number, supply: SupplyItem) => {
            dispatch({ type: 'ADD_SUPPLY', payload: { playerIndex, supply } });
        },
        updatePlayerField: <K extends keyof PlayerData>(playerIndex: number, field: K, value: PlayerData[K]) => {
            dispatch({ type: 'UPDATE_PLAYER', payload: { index: playerIndex, data: { [field]: value } } });
        },
        resolveBattle,
        executeEspionage,
        activateNuclearArsenal,
        extractSecretMineral,
        constructSilo,
        initiateNuclearDeployment,
        generateNuclearDesign
    }), [dispatch, owners, players, currentPlayerIndex]);

    return actions;
};
