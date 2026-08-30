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
import type { Treaty } from '../types/treatyTypes';
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
    createEspionageCard: (hqRegionId: string, resources: { techId: string, semiId: string }, playerIndex?: number) => void;
    executeEspionage: (targetPlayerId: number, infoType: 'silos' | 'mineral', cardId: string) => import('../types/playerTypes').EspionageReport | null;
    activateNuclearArsenal: (regionId: string, activationCards: { techId: string, rawId: string }, playerIndex?: number) => void;
    extractSecretMineral: (regionId: string, resources: { techId: string, ironId: string, waterId: string }, playerIndex?: number) => void;
    constructSilo: (targetRegionId: string, resources: { techLightId: string, techHeavyId: string, techElecId: string, ironId: string, alumId: string, semiId: string }, playerIndex?: number) => void;
    initiateNuclearDeployment: (fuelCardId: string, siloRegionId: string, playerIndex?: number) => void;
    generateNuclearDesign: (locationId: string, resources: { techId: string, rawId: string }, playerIndex?: number) => void;
    acceptTreaty: (treaty: Treaty) => void;
    processTreatyStatus: () => void;
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

                    // If defender is AI, there are no cards to lose or transfers to process
                    if (defenderId === 'neutral_ai') return currentPlayers;

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
                            const transferrableCards = allGainedCards.filter((c: SpecialCard) =>
                                !c.name.includes("SECRETOS DE") &&
                                c.type !== 'SECRETOS_GUERRA' &&
                                c.name !== 'SILO DE LANZAMIENTO'
                            );

                            if (transferrableCards.length > 0) {
                                return {
                                    ...p,
                                    specialCards: [...p.specialCards, ...transferrableCards]
                                };
                            }
                        }

                        // 3. Logic for 'Alejandro Magno' loss (Global check)
                        if (p.alejandroMagnoActive || p.specialCards.some(c => c.type === 'ALEJANDRO_MAGNO')) {
                            const alejandroCountries = ['grecia', 'turquia', 'egipto', 'iran'];
                            if (p.id === defenderId && alejandroCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    alejandroMagnoActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'ALEJANDRO_MAGNO')
                                };
                            }
                        }

                        // 4. Logic for 'Legado Otomano' loss
                        if (p.legadoOtomanoActive || p.specialCards.some(c => c.type === 'LEGADO_OTOMANO')) {
                            const otomanoCountries = ['turquia', 'egipto', 'arabia', 'grecia'];
                            if (p.id === defenderId && otomanoCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    legadoOtomanoActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'LEGADO_OTOMANO')
                                };
                            }
                        }

                        // 5. Logic for 'Gengis Khan' loss
                        if (p.gengisKhanActive || p.specialCards.some(c => c.type === 'GENGIS_KHAN')) {
                            const gengisCountries = ['mongolia', 'kazajistan', 'china', 'rusia'];
                            if (p.id === defenderId && gengisCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    gengisKhanActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'GENGIS_KHAN')
                                };
                            }
                        }

                        // 6. Logic for 'Bolívar' loss
                        if (p.bolivarActive || p.specialCards.some(c => c.type === 'BOLIVAR')) {
                            const bolivarCountries = ['venezuela', 'colombia', 'panama', 'peru'];
                            if (p.id === defenderId && bolivarCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    bolivarActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'BOLIVAR')
                                };
                            }
                        }

                        // 7. Logic for 'Pacific Fire' loss
                        if (p.pacificFireActive || p.specialCards.some(c => c.type === 'PACIFIC_FIRE')) {
                            const pacificCountries = ['japon', 'korea', 'kamchakta', 'filipinas'];
                            if (p.id === defenderId && pacificCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    pacificFireActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'PACIFIC_FIRE')
                                };
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
                        if (p.id === attacker.id && (p.alejandroMagnoActive || p.specialCards.some(c => c.type === 'ALEJANDRO_MAGNO'))) {
                            const alejandroCountries = ['grecia', 'turquia', 'egipto', 'iran'];
                            if (alejandroCountries.includes(attackSourceId) || alejandroCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    alejandroMagnoActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'ALEJANDRO_MAGNO')
                                };
                            }
                        }

                        if (p.id === attacker.id && (p.legadoOtomanoActive || p.specialCards.some(c => c.type === 'LEGADO_OTOMANO'))) {
                            const otomanoCountries = ['turquia', 'egipto', 'arabia', 'grecia'];
                            if (otomanoCountries.includes(attackSourceId) || otomanoCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    legadoOtomanoActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'LEGADO_OTOMANO')
                                };
                            }
                        }

                        if (p.id === attacker.id && (p.gengisKhanActive || p.specialCards.some(c => c.type === 'GENGIS_KHAN'))) {
                            const gengisCountries = ['mongolia', 'kazajistan', 'china', 'rusia'];
                            if (gengisCountries.includes(attackSourceId) || gengisCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    gengisKhanActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'GENGIS_KHAN')
                                };
                            }
                        }

                        if (p.id === attacker.id && (p.bolivarActive || p.specialCards.some(c => c.type === 'BOLIVAR'))) {
                            const bolivarCountries = ['venezuela', 'colombia', 'panama', 'peru'];
                            if (bolivarCountries.includes(attackSourceId) || bolivarCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    bolivarActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'BOLIVAR')
                                };
                            }
                        }

                        if (p.id === attacker.id && (p.pacificFireActive || p.specialCards.some(c => c.type === 'PACIFIC_FIRE'))) {
                            const pacificCountries = ['japon', 'korea', 'kamchakta', 'filipinas'];
                            if (pacificCountries.includes(attackSourceId) || pacificCountries.includes(targetRegionId)) {
                                return {
                                    ...p,
                                    pacificFireActive: false,
                                    specialCards: p.specialCards.filter(c => c.type !== 'PACIFIC_FIRE')
                                };
                            }
                        }
                        return p;
                    });
                }
            });
        }

        dispatch({ type: 'END_BATTLE' });
    };

    const createEspionageCard = (hqRegionId: string, resources: { techId: string, semiId: string }, playerIndex?: number) => {
        const effectivePlayerIndex = playerIndex ?? currentPlayerIndex;
        // 1. Consume Cards
        // 1. Mark cards as used
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.techId, category: 'technology', playerIndex: effectivePlayerIndex }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.semiId, category: 'rawMaterial', playerIndex: effectivePlayerIndex }
        });

        // 2. Create Espionage Card
        const newCard: SpecialCard = {
            id: `espionage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'ESPIONAJE',
            name: 'RED DE ESPIONAJE ACTIVADA',
            originCountry: hqRegionId,
            description: `Operación de inteligencia dirigida desde la sede en ${REGIONS.find(r => r.id === hqRegionId)?.title || hqRegionId}.`,
            createdAt: Date.now()
        };

        // 3. Add to Player
        dispatch({
            type: 'ADD_SPECIAL_CARD',
            payload: {
                playerIndex: effectivePlayerIndex,
                card: newCard
            }
        });

        // 4. Notification
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'SECONDARY_MISSION',
                title: 'OPERACIÓN DE ESPIONAJE',
                message: `Se ha establecido una red de inteligencia en ${REGIONS.find(r => r.id === hqRegionId)?.title || hqRegionId}.`,
                color: '#00ffff',
                playerName: players[effectivePlayerIndex].name
            }
        });
    };

    const executeEspionage = (targetPlayerId: number, infoType: 'silos' | 'mineral', cardId: string): import('../types/playerTypes').EspionageReport | null => {
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

        // Consume the specific espionage card
        dispatch({
            type: 'UPDATE_PLAYERS_FN',
            payload: (currentPlayers) => {
                return currentPlayers.map(p => {
                    if (p.id === players[currentPlayerIndex].id) {
                        return {
                            ...p,
                            specialCards: p.specialCards.filter(c => c.id !== cardId)
                        };
                    }
                    return p;
                });
            }
        });

        return { type: infoType, data: result };
    };

    const activateNuclearArsenal = (regionId: string, activationCards: { techId: string, rawId: string }, playerIndex?: number) => {
        const effectivePlayerIndex = playerIndex ?? currentPlayerIndex;
        // 1. Mark cards as used
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: activationCards.techId, category: 'technology', playerIndex: effectivePlayerIndex }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: activationCards.rawId, category: 'rawMaterial', playerIndex: effectivePlayerIndex }
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
                playerIndex: effectivePlayerIndex,
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
                playerName: players[effectivePlayerIndex].name
            }
        });
    };

    const extractSecretMineral = (regionId: string, resources: { techId: string, ironId: string, waterId: string }, playerIndex?: number) => {
        const effectivePlayerIndex = playerIndex ?? currentPlayerIndex;
        // 1. Mark cards as used
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.techId, category: 'technology', playerIndex: effectivePlayerIndex }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.ironId, category: 'rawMaterial', playerIndex: effectivePlayerIndex }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.waterId, category: 'rawMaterial', playerIndex: effectivePlayerIndex }
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
                playerIndex: effectivePlayerIndex,
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
                playerName: players[effectivePlayerIndex].name
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
        },
        playerIndex?: number
    ) => {
        const effectivePlayerIndex = playerIndex ?? currentPlayerIndex;
        // 1. Consume Cards
        const cardsToConsume = [
            { id: resources.techLightId, type: 'technology' },
            { id: resources.techHeavyId, type: 'technology' },
            { id: resources.techElecId, type: 'technology' },
            { id: resources.ironId, type: 'rawMaterial' },
            { id: resources.alumId, type: 'rawMaterial' },
            { id: resources.semiId, type: 'rawMaterial' }
        ];

        // 1. Mark cards as used
        cardsToConsume.forEach(c => {
            dispatch({
                type: 'MARK_CARD_AS_USED',
                payload: { cardId: c.id, category: c.type as any, playerIndex: effectivePlayerIndex }
            });
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
                    if (p.id === players[effectivePlayerIndex].id) {
                        return {
                            ...p,
                            silos: [...p.silos, targetRegionId],
                            siloStatus: {
                                ...p.siloStatus,
                                [targetRegionId]: {
                                    status: 'construction',
                                    turnsRemaining: 2,
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
                playerName: players[effectivePlayerIndex].name
            }
        });
    };

    const initiateNuclearDeployment = (fuelCardId: string, siloRegionId: string, playerIndex?: number) => {
        const effectivePlayerIndex = playerIndex ?? currentPlayerIndex;
        const player = players[effectivePlayerIndex];

        // 1. Consume Fuel Card
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: fuelCardId, category: 'rawMaterial', playerIndex: effectivePlayerIndex }
        });

        // 2. Track Silo Usage and Activate Nuclear Deployment
        const updatedUsedSilos = [...(player.usedNuclearSilos || []), siloRegionId];

        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: effectivePlayerIndex,
                data: {
                    nuclearDeploymentActive: true,
                    usedNuclearSilos: updatedUsedSilos
                }
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

    const acceptTreaty = (treaty: Treaty) => {
        // 1. Determine Start Date (Next Turn/Year?)
        // User said "Turno que viene". If duration is Years, likely starts Next Year.
        // Or literally next player turn?
        // Let's assume Next Year for simplicity and consistency with Duration.
        const startYear = state.gameDate.getFullYear() + 1;

        // 2. Update Treaty Status
        const activeTreaty: Treaty = {
            ...treaty,
            status: 'PENDING_START',
            createdAtYear: startYear,
            history: [...treaty.history, { date: new Date(), action: 'ACCEPTED', actorId: players[currentPlayerIndex]?.id }]
        };
        dispatch({ type: 'UPDATE_TREATY', payload: activeTreaty });

        // NOTE: We do NOT execute clauses here anymore. 
        // They will be executed when the Game Year matches `startYear`.
        // We need to ensure `advanceGameDate` (or similar) checks for this.
        console.log(`[AcceptTreaty] Treaty ${treaty.id} accepted. Starts in ${startYear}. Clauses queued.`);
    };

    const generateNuclearDesign = (locationId: string, resources: { techId: string, rawId: string }, playerIndex?: number) => {
        const effectivePlayerIndex = playerIndex ?? currentPlayerIndex;

        // 1. Consume cards
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.techId, category: 'technology', playerIndex: effectivePlayerIndex }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: resources.rawId, category: 'rawMaterial', playerIndex: effectivePlayerIndex }
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
                playerIndex: effectivePlayerIndex,
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

    const processTreatyStatus = () => {
        const currentYear = state.gameDate.getFullYear();

        state.treaties.forEach(treaty => {
            // 1. Activation Check
            if (treaty.status === 'PENDING_START' && currentYear >= treaty.createdAtYear) {
                // Activate!
                dispatch({
                    type: 'UPDATE_TREATY',
                    payload: { ...treaty, status: 'ACTIVE', history: [...treaty.history, { date: new Date(), action: 'ACTIVATED', actorId: 'SYSTEM' }] }
                });

                // Execute Clauses
                treaty.clauses.forEach(clause => {
                    if (clause.type === 'REGION_CESSION') {
                        if (clause.data.regionId) {
                            dispatch({
                                type: 'UPDATE_OWNER',
                                payload: {
                                    regionId: clause.data.regionId,
                                    ownerIndex: clause.targetPlayerId
                                }
                            });
                        }
                    } else if (clause.type === 'RAW_MATERIAL_CESSION' || clause.type === 'TECH_LOAN') {
                        // Transfer Logic (Copy-Pasted and adapted from previous acceptTreaty)
                        if (clause.data.cardId) {
                            const sourcePlayer = state.players.find(p => p.id === clause.sourcePlayerId);
                            let cardInInventory = sourcePlayer?.inventory.rawMaterials.find(c => c.id == clause.data.cardId);
                            if (!cardInInventory) {
                                cardInInventory = sourcePlayer?.inventory.technologies.find(c => c.id == clause.data.cardId);
                            }

                            if (cardInInventory) {
                                dispatch({
                                    type: 'UPDATE_PLAYERS_FN',
                                    payload: (currentPlayers) => {
                                        const spIndex = currentPlayers.findIndex(p => p.id === clause.sourcePlayerId);
                                        const tpIndex = currentPlayers.findIndex(p => p.id === clause.targetPlayerId);
                                        if (spIndex === -1 || tpIndex === -1) return currentPlayers;

                                        return currentPlayers.map((p, idx) => {
                                            if (idx === spIndex) {
                                                const newInv = { ...p.inventory };
                                                if (clause.type === 'RAW_MATERIAL_CESSION') {
                                                    newInv.rawMaterials = p.inventory.rawMaterials.filter(c => c.id != clause.data.cardId);
                                                } else {
                                                    newInv.technologies = p.inventory.technologies.filter(c => c.id != clause.data.cardId);
                                                }
                                                return { ...p, inventory: newInv };
                                            }
                                            if (idx === tpIndex) {
                                                const newInv = { ...p.inventory };
                                                if (clause.type === 'RAW_MATERIAL_CESSION') {
                                                    newInv.rawMaterials = [...p.inventory.rawMaterials, cardInInventory!];
                                                } else {
                                                    newInv.technologies = [...p.inventory.technologies, cardInInventory!];
                                                }
                                                return { ...p, inventory: newInv };
                                            }
                                            return p;
                                        });
                                    }
                                });
                            } else {
                                // Passive/Deck Check
                                const cardInDeckRaw = state.productionDeck?.rawMaterials.find(c => c.id == clause.data.cardId);
                                const cardInDeckTech = state.productionDeck?.technologies.find(c => c.id == clause.data.cardId);
                                const cardInDeck = cardInDeckRaw || cardInDeckTech;

                                if (cardInDeck) {
                                    dispatch({
                                        type: 'UPDATE_PRODUCTION_DECK_FN',
                                        payload: (deck) => {
                                            if (!deck) return null;
                                            return {
                                                ...deck,
                                                rawMaterials: deck.rawMaterials.filter(c => c.id != clause.data.cardId),
                                                technologies: deck.technologies.filter(c => c.id != clause.data.cardId)
                                            };
                                        }
                                    });
                                    dispatch({
                                        type: 'UPDATE_PLAYERS_FN',
                                        payload: (currentPlayers) => {
                                            const tpIndex = currentPlayers.findIndex(p => p.id === clause.targetPlayerId);
                                            if (tpIndex === -1) return currentPlayers;
                                            return currentPlayers.map((p, idx) => {
                                                if (idx === tpIndex) {
                                                    const newInv = { ...p.inventory };
                                                    if (clause.type === 'RAW_MATERIAL_CESSION') {
                                                        newInv.rawMaterials = [...p.inventory.rawMaterials, cardInDeck];
                                                    } else {
                                                        newInv.technologies = [...p.inventory.technologies, cardInDeck];
                                                    }
                                                    return { ...p, inventory: newInv };
                                                }
                                                return p;
                                            });
                                        }
                                    });
                                }
                            }
                        }
                    } else if (clause.type === 'TECH_DUPLICATE') {
                        if (clause.data.cardId) {
                            dispatch({
                                type: 'UPDATE_PLAYERS_FN',
                                payload: (currentPlayers) => {
                                    const sourcePlayer = currentPlayers.find(p => p.id === clause.sourcePlayerId);
                                    if (!sourcePlayer) return currentPlayers;
                                    let originalCard = sourcePlayer.inventory.technologies.find(c => c.id == clause.data.cardId);
                                    if (!originalCard) {
                                        originalCard = state.productionDeck?.technologies.find(c => c.id == clause.data.cardId);
                                    }
                                    if (!originalCard) return currentPlayers;

                                    const newCard = { ...originalCard, id: `dup-${Date.now()}-${originalCard.id}` };
                                    return currentPlayers.map(p => {
                                        if (p.id === clause.targetPlayerId) {
                                            return {
                                                ...p,
                                                inventory: { ...p.inventory, technologies: [...p.inventory.technologies, newCard] }
                                            };
                                        }
                                        return p;
                                    });
                                }
                            });
                        }
                    }
                });
            }

            // 2. Expiration Check
            if (treaty.status === 'ACTIVE') {
                // Calculate Active Years based on currentYear and createdAtYear
                const yearsActive = currentYear - treaty.createdAtYear;

                treaty.clauses.forEach(clause => {
                    // Check if expiration year is reached
                    if (clause.duration !== -1 && yearsActive >= clause.duration) {

                        // Executing Expiration Logic (Only once)
                        if (yearsActive === clause.duration) {
                            console.log(`[Treaty] Expiring Clause ${clause.id} (Duration ${clause.duration}). Reverting items.`);

                            if (clause.type === 'RAW_MATERIAL_CESSION' || clause.type === 'TECH_LOAN') {
                                // Revert Transfer
                                dispatch({
                                    type: 'UPDATE_PLAYERS_FN',
                                    payload: (currentPlayers) => {
                                        const tpIndex = currentPlayers.findIndex(p => p.id === clause.targetPlayerId);
                                        const spIndex = currentPlayers.findIndex(p => p.id === clause.sourcePlayerId);
                                        if (tpIndex === -1) return currentPlayers;

                                        // 1. Find Card in Target
                                        const targetPlayer = currentPlayers[tpIndex];
                                        const tech = targetPlayer.inventory.technologies.find(c => c.id == clause.data.cardId);
                                        const raw = targetPlayer.inventory.rawMaterials.find(c => c.id == clause.data.cardId);
                                        const cardToReturn = tech || raw;

                                        if (!cardToReturn) {
                                            console.warn(`[Treaty] Card ${clause.data.cardId} not found in Target ${clause.targetPlayerId} inventory during reversion.`);
                                            return currentPlayers;
                                        }

                                        // 2. Remove from Target & Add to Source (if Source exists)
                                        return currentPlayers.map((p, idx) => {
                                            if (idx === tpIndex) {
                                                const newInv = { ...p.inventory };
                                                newInv.rawMaterials = p.inventory.rawMaterials.filter(c => c.id != clause.data.cardId);
                                                newInv.technologies = p.inventory.technologies.filter(c => c.id != clause.data.cardId);
                                                return { ...p, inventory: newInv };
                                            }
                                            if (idx === spIndex) {
                                                const newInv = { ...p.inventory };
                                                if (clause.type === 'RAW_MATERIAL_CESSION') {
                                                    newInv.rawMaterials = [...p.inventory.rawMaterials, cardToReturn];
                                                } else {
                                                    newInv.technologies = [...p.inventory.technologies, cardToReturn];
                                                }
                                                return { ...p, inventory: newInv };
                                            }
                                            return p;
                                        });
                                    }
                                });
                            } else if (clause.type === 'REGION_CESSION') {
                                if (clause.data.regionId) {
                                    dispatch({
                                        type: 'UPDATE_OWNER',
                                        payload: {
                                            regionId: clause.data.regionId,
                                            ownerIndex: clause.sourcePlayerId
                                        }
                                    });
                                }
                            }
                        }
                    }
                });

                // Check global treaty expiration
                const maxDuration = Math.max(...treaty.clauses.map(c => c.duration));
                if (maxDuration !== -1 && yearsActive >= maxDuration) {
                    dispatch({ type: 'UPDATE_TREATY', payload: { ...treaty, status: 'EXPIRED' } });
                }
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
        createEspionageCard,
        activateNuclearArsenal,
        extractSecretMineral,
        constructSilo,
        initiateNuclearDeployment,
        generateNuclearDesign,
        acceptTreaty,
        processTreatyStatus // Exported
    }), [dispatch, owners, players, currentPlayerIndex]);

    return actions;
};
