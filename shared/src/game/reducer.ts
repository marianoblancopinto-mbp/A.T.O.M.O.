/**
 * gameReducer — Núcleo puro del estado de juego.
 *
 * Extraído de GameContext.tsx y movido a @atomo/shared (Fases 1a/1b de la
 * migración a servidor autoritativo). Este módulo NO depende de React: son tipos
 * + estado inicial + reducer puro, de modo que la misma lógica corra en el
 * cliente y (en fases futuras) en el servidor. No cambia el comportamiento.
 *
 * TODO (fase de reglas): hacerlo determinista (quitar Math.random de KICK_PLAYER,
 * pasar un rng inyectado) cuando se arme el servidor.
 */

import type { PlayerData, SpecialCard } from '../playerTypes';
import type { ProductionDeck, SupplyItem, ActiveProviders } from '../productionTypes';
import type { Treaty } from '../treatyTypes';
import { REGIONS } from '../data/mapRegions';

// ============================================================================
// Types
// ============================================================================

export type GamePhase = 'splash' | 'menu' | 'history' | 'mission' | 'setup' | 'playing';

export interface MissionNotification {
    type: 'ESPIONAJE' | 'NUCLEAR_DESIGN' | 'NUCLEAR_ALERT' | 'GAME_OVER' | 'NEUTRALIZED' | 'ROUTE_BROKEN' | 'ROUTE_RESTORED' | 'SECONDARY_MISSION' | 'CONQUEST';
    title: string;
    message: string;
    color: string;
    playerName?: string;
    targetPlayerId?: string | number | null;
    missionId?: string;
}

export interface GameSettings {
    proxyWarCountry: string;
    abandonmentMode: 'redistribute' | 'neutralize';
    aiActive: boolean;
    aiDifficulty: number;
    gameMode: 'classic' | 'chaos';
}

export interface GameState {
    // Core game state
    gamePhase: GamePhase;
    gameStarted: boolean;
    numPlayers: number;

    // Players
    players: PlayerData[];
    currentPlayerIndex: number;

    // Map ownership (null = neutral, value = player ID (number or string))
    owners: Record<string, string | number | null>;

    // Production
    productionDeck: ProductionDeck | null;
    regionResources: ActiveProviders | null;

    // Time/Turn management
    gameDate: Date;
    turnOrder: number[];
    turnOrderIndex: number;

    // UI / Notifications
    notification: MissionNotification | null;

    // Active Battle State (Global)
    battleState: import('../gameTypes').BattleState | null;

    // Lore / Narrative
    proxyWarCountry: string;

    // Victory State (Global Sync)
    winner: PlayerData | null;
    endgameChoice: 'victory' | 'destruction' | null;

    // Turn tracking
    usedAttackSources: string[];
    treaties: Treaty[];
    settings: GameSettings;
}

// ============================================================================
// Actions
// ============================================================================

export type GameAction =
    | { type: 'SET_GAME_PHASE'; payload: GamePhase }
    | { type: 'SET_GAME_STARTED'; payload: boolean }
    | { type: 'SET_NUM_PLAYERS'; payload: number }
    | { type: 'SET_PLAYERS'; payload: PlayerData[] }
    | { type: 'UPDATE_PLAYER'; payload: { index: number; data: Partial<PlayerData> } }
    | { type: 'SET_OWNERS'; payload: Record<string, string | number | null> }
    | { type: 'UPDATE_OWNER'; payload: { regionId: string; ownerIndex: string | number | null } }
    | { type: 'SET_CURRENT_PLAYER'; payload: number }
    | { type: 'SET_PRODUCTION_DECK'; payload: ProductionDeck | null }
    | { type: 'SET_REGION_RESOURCES'; payload: ActiveProviders | null }
    | { type: 'SET_GAME_DATE'; payload: Date }
    | { type: 'ADVANCE_MONTH' }
    | { type: 'SET_TURN_ORDER'; payload: number[] }
    | { type: 'SET_TURN_ORDER_INDEX'; payload: number }
    | { type: 'NEXT_TURN' }
    | {
        type: 'START_GAME'; payload: {
            players: PlayerData[];
            owners: Record<string, string | number | null>;
            settings: GameSettings;
        }
    }
    | { type: 'RESET_GAME' }
    | { type: 'MARK_CARD_AS_USED'; payload: { cardId: string; category: 'technology' | 'rawMaterial'; playerIndex?: number } }
    | { type: 'ADD_SPECIAL_CARD'; payload: { playerIndex: number; card: SpecialCard } }
    | { type: 'ADD_SUPPLY'; payload: { playerIndex: number; supply: SupplyItem } }
    | { type: 'UPDATE_PLAYERS_FN'; payload: (players: PlayerData[]) => PlayerData[] }
    | { type: 'UPDATE_OWNERS_FN'; payload: (owners: Record<string, string | number | null>) => Record<string, string | number | null> }
    | { type: 'UPDATE_PRODUCTION_DECK_FN'; payload: (deck: ProductionDeck | null) => ProductionDeck | null }
    | { type: 'UPDATE_GAME_DATE_FN'; payload: (date: Date) => Date }
    | { type: 'SET_NOTIFICATION'; payload: MissionNotification | null }
    // Battle Actions
    | { type: 'INIT_BATTLE'; payload: import('../gameTypes').BattleState }
    | { type: 'UPDATE_BATTLE'; payload: Partial<import('../gameTypes').BattleState> }
    | { type: 'END_BATTLE' }
    | { type: 'BATTLE_ATTACKER_SELECT'; payload: { cardId: string } }
    | { type: 'BATTLE_DEFENDER_SELECT'; payload: { cardId: string } }
    | { type: 'BATTLE_NEXT_ROUND' }
    // Sync Action
    | { type: 'SYNC_STATE'; payload: Partial<GameState> }
    | { type: 'SET_ENDGAME_CHOICE'; payload: 'victory' | 'destruction' | null }
    | {
        type: 'PROCESS_TURN_CHANGE';
        payload: {
            players: PlayerData[];
            gameDate: Date | string | number;
            turnOrderIndex: number;
            currentPlayerIndex: number;
            turnOrder?: number[];
            owners?: Record<string, string | number | null>;
            notification?: MissionNotification | null;
            winner?: PlayerData | null;
            endgameChoice?: 'victory' | 'destruction' | null;
            usedAttackSources?: string[];
            treaties?: Treaty[];
            settings?: GameSettings;
        }
    }
    | { type: 'CREATE_TREATY_OFFER'; payload: Treaty }
    | { type: 'UPDATE_TREATY'; payload: Treaty }
    | { type: 'CANCEL_TREATY'; payload: { treatyId: string } }
    | { type: 'KICK_PLAYER'; payload: { playerId: string | number } };

// ============================================================================
// Initial State
// ============================================================================

export const initialState: GameState = {
    gamePhase: 'splash',
    gameStarted: false,
    numPlayers: 2,
    players: [],
    currentPlayerIndex: 0,
    owners: {},
    productionDeck: null,
    regionResources: null,
    gameDate: new Date(2100, 0, 1),
    turnOrder: [],
    turnOrderIndex: 0,
    notification: null,
    battleState: null,
    proxyWarCountry: 'País Desconocido',
    winner: null,
    endgameChoice: null,
    usedAttackSources: [],
    treaties: [],
    settings: {
        proxyWarCountry: 'País Desconocido',
        abandonmentMode: 'redistribute',
        aiActive: false,
        aiDifficulty: 50,
        gameMode: 'classic'
    }
};

// ============================================================================
// Player Sanitization (Defensive layer for Supabase sync)
// ============================================================================

/**
 * Ensures all array/object fields on PlayerData have safe defaults.
 * Prevents "Cannot read properties of undefined (reading 'filter')" errors
 * when data arrives from Supabase with null/missing fields.
 */
export function sanitizePlayer(p: any): PlayerData {
    if (!p) {
        return {
            id: 'unknown',
            name: 'Desconocido',
            color: '#888888',
            supplies: { manufacture: [], food: [], energy: [] },
            resources: { rawMaterials: 0, technology: 0 },
            inventory: { rawMaterials: [], technologies: [] },
            specialCards: [],
            silos: [],
            siloStatus: {},
            siloFuelCards: {},
            usedEspionageHqs: [],
            usedNuclearSilos: [],
            activeSpecialMissions: [],
            secretWarData: [],
            mineralUsedThisTurn: false,
            secretMineralLocation: null
        };
    }
    return {
        ...p,
        specialCards: p.specialCards ?? [],
        silos: p.silos ?? [],
        siloStatus: p.siloStatus ?? {},
        siloFuelCards: p.siloFuelCards ?? {},
        usedEspionageHqs: p.usedEspionageHqs ?? [],
        usedNuclearSilos: p.usedNuclearSilos ?? [],
        activeSpecialMissions: p.activeSpecialMissions ?? [],
        secretWarData: p.secretWarData ?? [],
        supplies: {
            manufacture: p.supplies?.manufacture ?? [],
            food: p.supplies?.food ?? [],
            energy: p.supplies?.energy ?? [],
        },
        resources: {
            rawMaterials: p.resources?.rawMaterials ?? 0,
            technology: p.resources?.technology ?? 0,
        },
        inventory: {
            rawMaterials: p.inventory?.rawMaterials ?? [],
            technologies: p.inventory?.technologies ?? [],
        },
    };
}

export function sanitizePlayers(players: any[]): PlayerData[] {
    if (!Array.isArray(players)) return [];
    return players.map(sanitizePlayer);
}

// ============================================================================
// Reducer
// ============================================================================

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_GAME_PHASE':
            return { ...state, gamePhase: action.payload };

        case 'SET_GAME_STARTED':
            return { ...state, gameStarted: action.payload };

        case 'SET_NUM_PLAYERS':
            return { ...state, numPlayers: action.payload };

        case 'SET_PLAYERS':
            return { ...state, players: action.payload };

        case 'UPDATE_PLAYERS_FN':
            return { ...state, players: action.payload(state.players) };

        case 'UPDATE_PLAYER': {
            const newPlayers = [...state.players];
            if (newPlayers[action.payload.index]) {
                newPlayers[action.payload.index] = {
                    ...newPlayers[action.payload.index],
                    ...action.payload.data,
                };
            }
            return { ...state, players: newPlayers };
        }

        case 'SET_OWNERS':
            return { ...state, owners: action.payload };

        case 'UPDATE_OWNERS_FN':
            return { ...state, owners: action.payload(state.owners) };

        case 'UPDATE_OWNER':
            return {
                ...state,
                owners: {
                    ...state.owners,
                    [action.payload.regionId]: action.payload.ownerIndex,
                },
            };

        case 'SET_CURRENT_PLAYER':
            return { ...state, currentPlayerIndex: action.payload };

        case 'SET_PRODUCTION_DECK':
            return { ...state, productionDeck: action.payload };

        case 'UPDATE_PRODUCTION_DECK_FN':
            return { ...state, productionDeck: action.payload(state.productionDeck) };

        case 'SET_REGION_RESOURCES':
            return { ...state, regionResources: action.payload };

        case 'SET_GAME_DATE':
            return { ...state, gameDate: action.payload };

        case 'UPDATE_GAME_DATE_FN':
            return { ...state, gameDate: action.payload(state.gameDate) };

        case 'ADVANCE_MONTH': {
            const newDate = new Date(state.gameDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return { ...state, gameDate: newDate };
        }

        case 'SET_TURN_ORDER':
            return { ...state, turnOrder: action.payload };

        case 'SET_TURN_ORDER_INDEX':
            return { ...state, turnOrderIndex: action.payload };

        case 'NEXT_TURN': {
            let nextIndex = state.turnOrderIndex;
            let nextPlayerIndex: number;
            let nextPlayer: any;
            let loops = 0;

            // Loop until we find a player who is not eliminated
            do {
                nextIndex = (nextIndex + 1) % state.turnOrder.length;
                nextPlayerIndex = state.turnOrder[nextIndex] ?? 0;
                nextPlayer = state.players[nextPlayerIndex];
                loops++;
                // Emergency break to prevent infinite loop if all players eliminated
                if (loops > state.turnOrder.length * 2) break;
            } while (nextPlayer && nextPlayer.isEliminated);

            return {
                ...state,
                turnOrderIndex: nextIndex,
                currentPlayerIndex: nextPlayerIndex,
                usedAttackSources: []
            };
        }

        case 'START_GAME':
            return {
                ...state,
                gameStarted: true,
                gamePhase: 'playing',
                players: action.payload.players,
                owners: action.payload.owners,
                settings: action.payload.settings,
                proxyWarCountry: action.payload.settings.proxyWarCountry,
            };

        case 'RESET_GAME':
            return { ...initialState };

        case 'MARK_CARD_AS_USED': {
            const { cardId, category, playerIndex } = action.payload;
            let newState = { ...state };

            // 1. Update Production Deck (Legacy/Fallback)
            if (state.productionDeck) {
                const newDeck = { ...state.productionDeck };
                const markUsed = (cards: any[]) => cards.map(c => c.id === cardId ? { ...c, usedThisTurn: true } : c);

                if (category === 'technology') {
                    newDeck.technologies = markUsed(newDeck.technologies);
                } else {
                    newDeck.rawMaterials = markUsed(newDeck.rawMaterials);
                }
                newState.productionDeck = newDeck;
            }

            // 2. Update Player Inventory (Targeted)
            if (playerIndex !== undefined) {
                const newPlayers = [...state.players];
                const p = newPlayers[playerIndex];
                if (p) {
                    const markUsed = (cards: any[]) => (cards || []).map(c => c.id === cardId ? { ...c, usedThisTurn: true } : c);
                    newPlayers[playerIndex] = {
                        ...p,
                        inventory: {
                            ...p.inventory,
                            technologies: category === 'technology' ? markUsed(p.inventory.technologies) : p.inventory.technologies,
                            rawMaterials: category === 'rawMaterial' ? markUsed(p.inventory.rawMaterials) : p.inventory.rawMaterials
                        }
                    };
                    newState.players = newPlayers;
                }
            }

            return newState;
        }

        case 'ADD_SPECIAL_CARD': {
            const { playerIndex, card } = action.payload;
            const newPlayers = [...state.players];
            if (newPlayers[playerIndex]) {
                newPlayers[playerIndex] = {
                    ...newPlayers[playerIndex],
                    specialCards: [...newPlayers[playerIndex].specialCards, card]
                };
            }
            return { ...state, players: newPlayers };
        }

        case 'ADD_SUPPLY': {
            const { playerIndex, supply } = action.payload;
            const newPlayers = [...state.players];
            if (newPlayers[playerIndex]) {
                const supplyType = supply.type;
                newPlayers[playerIndex] = {
                    ...newPlayers[playerIndex],
                    supplies: {
                        ...newPlayers[playerIndex].supplies,
                        [supplyType]: [...newPlayers[playerIndex].supplies[supplyType], supply]
                    }
                };
            }
            return { ...state, players: newPlayers };
        }

        case 'SET_NOTIFICATION':
            return { ...state, notification: action.payload };

        case 'INIT_BATTLE':
            return {
                ...state,
                battleState: action.payload,
                usedAttackSources: [...state.usedAttackSources, action.payload.attackSourceId]
            };

        case 'UPDATE_BATTLE':
            return {
                ...state,
                battleState: state.battleState ? { ...state.battleState, ...action.payload } : null
            };

        case 'BATTLE_ATTACKER_SELECT': {
            if (!state.battleState) return state;
            const cardId = action.payload.cardId;
            const card = state.battleState.attackerHand.find(c => c.id === cardId);
            if (!card) return state;

            return {
                ...state,
                battleState: {
                    ...state.battleState,
                    attackerHand: state.battleState.attackerHand.filter(c => c.id !== cardId),
                    currentAttackerCard: card,
                    phase: 'DEFENDER_SELECTION'
                }
            };
        }

        case 'BATTLE_DEFENDER_SELECT': {
            if (!state.battleState || !state.battleState.currentAttackerCard) return state;
            const cardId = action.payload.cardId;
            const card = state.battleState.defenderHand.find(c => c.id === cardId);
            if (!card) return state;

            const { currentAttackerCard: attCard, attackerBonuses, defenderBonuses } = state.battleState;
            const defCard = card;

            // --- RESOLVE CLASH LOGIC WITH BONUSES ---

            // 1. Calculate Attacker Score
            let attackerScore = attCard.tier;
            if (attCard.regiment === 'C') attackerScore += attackerBonuses.art;
            if (attCard.regiment === 'B') attackerScore += attackerBonuses.inf;
            if (attCard.regiment === 'A') {
                if (attackerBonuses.isPacificFireBonus) attackerScore += 1;
            }

            // 2. Calculate Defender Score
            // Base: Defender card tier counts ONLY if it matches attacker regiment (Fog of War / Tactics)
            let baseDefenderTier = 0;
            if (defCard.regiment === attCard.regiment) {
                baseDefenderTier = defCard.tier;
            }

            // Terrain Bonuses
            let terrainBonus = 0;
            // Fix: Terrain bonuses are "Defense VS [Type]", so we check the ATTACKER'S regiment
            if (attCard.regiment === 'A') terrainBonus = defenderBonuses.air;
            if (attCard.regiment === 'B') terrainBonus = defenderBonuses.inf;
            if (attCard.regiment === 'C') terrainBonus = defenderBonuses.art;

            const defenderScore = baseDefenderTier + terrainBonus;

            // 3. Compare
            const attackerWins = attackerScore > defenderScore;

            // Reason String for UI
            const attRegName = attCard.regiment === 'A' ? 'Aéreo' : (attCard.regiment === 'B' ? 'Inf.' : 'Art.');
            const defRegName = defCard.regiment === 'A' ? 'Aéreo' : (defCard.regiment === 'B' ? 'Inf.' : 'Art.');

            const reason = attackerWins
                ? `VICTORIA ATACANTE: ${attRegName} (${attackerScore}) vs ${defRegName} (${defenderScore})`
                : `DEFENSA EXITOSA: ${defRegName} (${defenderScore}) vs ${attRegName} (${attackerScore})`;

            return {
                ...state,
                battleState: {
                    ...state.battleState,
                    defenderHand: state.battleState.defenderHand.filter(c => c.id !== cardId),
                    currentDefenderCard: card,
                    phase: 'RESOLUTION',
                    clashResult: {
                        winner: attackerWins ? 'attacker' : 'defender',
                        reason
                    },
                    attackerWins: state.battleState.attackerWins + (attackerWins ? 1 : 0),
                    defenderWins: state.battleState.defenderWins + (!attackerWins ? 1 : 0)
                }
            };
        }

        case 'BATTLE_NEXT_ROUND': {
            if (!state.battleState) return state;

            const { attackerWins, defenderWins, roundCount, attacker, targetRegionId } = state.battleState;

            // Check if battle should end
            // Conditions:
            // 1. Someone reached 2 wins (Best of 3)
            // 2. 3 Rounds played (roundCount starts at 0, so after round 2 it's 3 rounds? No, roundCount increments below. If currently 2, next is 3. Max 3 cards.)
            // 3. Hands empty (should match round count)

            if (attackerWins >= 2 || defenderWins >= 2 || roundCount >= 2) {
                const finalWinner = attackerWins > defenderWins ? 'attacker' : 'defender';

                let newState = { ...state };

                // REWARDS / CONSEQUENCES (Sync Logic)
                if (finalWinner === 'attacker') {
                    // Update Owner
                    newState.owners = {
                        ...newState.owners,
                        [targetRegionId]: attacker.id
                    };

                    // Global Notification
                    const regionName = REGIONS.find(r => r.id === targetRegionId)?.title || targetRegionId;
                    newState.notification = {
                        type: 'CONQUEST',
                        title: 'CONQUISTA REGIONAL',
                        message: `LAS FUERZAS DE ${attacker.name.toUpperCase()} HAN TOMADO EL CONTROL DE ${regionName.toUpperCase()}.`,
                        color: attacker.color,
                        playerName: attacker.name
                    };
                }

                return {
                    ...newState,
                    battleState: {
                        ...state.battleState,
                        phase: finalWinner === 'attacker' ? 'VICTORY' : 'DEFEAT'
                    }
                };
            }

            return {
                ...state,
                battleState: {
                    ...state.battleState,
                    currentAttackerCard: null,
                    currentDefenderCard: null,
                    clashResult: null,
                    phase: 'ATTACKER_SELECTION',
                    roundCount: state.battleState.roundCount + 1
                }
            };
        }

        case 'END_BATTLE':
            return { ...state, battleState: null };

        case 'SET_ENDGAME_CHOICE':
            return { ...state, endgameChoice: action.payload };

        case 'SYNC_STATE': {
            const p = action.payload;
            if (!p) return state;

            // Strict sanitization for critical fields
            const sanitizedPlayers = (p.players !== undefined && p.players !== null)
                ? sanitizePlayers(p.players)
                : state.players;

            const nextPlayerIndex = (p.currentPlayerIndex !== undefined && p.currentPlayerIndex !== null)
                ? Number(p.currentPlayerIndex)
                : state.currentPlayerIndex;

            const nextTurnOrderIndex = (p.turnOrderIndex !== undefined && p.turnOrderIndex !== null)
                ? Number(p.turnOrderIndex)
                : state.turnOrderIndex;

            if (isNaN(nextPlayerIndex)) {
                console.error("[GameContext] CRITICAL: Received NaN for currentPlayerIndex in SYNC_STATE. Payload:", p);
            }

            return {
                ...state,
                players: sanitizedPlayers,
                owners: p.owners ?? state.owners,
                currentPlayerIndex: isNaN(nextPlayerIndex) ? state.currentPlayerIndex : nextPlayerIndex,
                turnOrder: p.turnOrder ?? state.turnOrder,
                turnOrderIndex: isNaN(nextTurnOrderIndex) ? state.turnOrderIndex : nextTurnOrderIndex,
                gameDate: p.gameDate ? new Date(p.gameDate) : state.gameDate,
                productionDeck: p.productionDeck ?? state.productionDeck,
                regionResources: p.regionResources ?? state.regionResources,
                battleState: p.battleState !== undefined ? p.battleState : state.battleState,
                notification: p.notification !== undefined ? p.notification : state.notification,
                winner: p.winner !== undefined ? p.winner : state.winner,
                endgameChoice: p.endgameChoice !== undefined ? p.endgameChoice : state.endgameChoice,
                treaties: p.treaties ?? state.treaties,
                proxyWarCountry: p.proxyWarCountry ?? state.proxyWarCountry,
                usedAttackSources: p.usedAttackSources ?? state.usedAttackSources,
                settings: p.settings ?? state.settings
            };
        }

        case 'PROCESS_TURN_CHANGE': {
            const p = action.payload;
            const sanitizedPlayers = (p.players !== undefined && p.players !== null)
                ? sanitizePlayers(p.players)
                : state.players;

            const nextPlayerIndex = (p.currentPlayerIndex !== undefined && p.currentPlayerIndex !== null)
                ? Number(p.currentPlayerIndex)
                : state.currentPlayerIndex;

            const nextTurnOrderIndex = (p.turnOrderIndex !== undefined && p.turnOrderIndex !== null)
                ? Number(p.turnOrderIndex)
                : state.turnOrderIndex;

            console.log(`[GameContext] 🔄 Processing Turn Change to Index: ${nextPlayerIndex} (from payload: ${p.currentPlayerIndex})`);

            return {
                ...state,
                players: sanitizedPlayers,
                gameDate: p.gameDate ? new Date(p.gameDate) : state.gameDate,
                turnOrderIndex: isNaN(nextTurnOrderIndex) ? state.turnOrderIndex : nextTurnOrderIndex,
                currentPlayerIndex: isNaN(nextPlayerIndex) ? state.currentPlayerIndex : nextPlayerIndex,
                turnOrder: p.turnOrder ?? state.turnOrder,
                owners: p.owners ?? state.owners,
                notification: p.notification ?? state.notification,
                winner: p.winner ?? state.winner,
                endgameChoice: p.endgameChoice ?? state.endgameChoice,
                usedAttackSources: p.usedAttackSources ?? [],
                treaties: p.treaties ?? state.treaties
            };
        }

        case 'CREATE_TREATY_OFFER':
            return {
                ...state,
                treaties: [...state.treaties, action.payload]
            };

        case 'UPDATE_TREATY':
            return {
                ...state,
                treaties: state.treaties.map(t => t.id === action.payload.id ? action.payload : t)
            };

        case 'CANCEL_TREATY':
            return {
                ...state,
                treaties: state.treaties.filter(t => t.id !== action.payload.treatyId)
            };

        case 'KICK_PLAYER': {
            const playerIdToKick = action.payload.playerId;

            // 0. BATTLE RESOLUTION: If kicked player is in an active battle, resolve it first
            let battleOwnerOverride: Record<string, string | number | null> = {};
            let clearedBattleState = state.battleState;
            if (state.battleState && state.battleState.isActive) {
                const isKickedDefender = String(state.battleState.defender.id) === String(playerIdToKick);
                const isKickedAttacker = String(state.battleState.attacker.id) === String(playerIdToKick);
                if (isKickedDefender) {
                    // Attacker wins → gets the contested country
                    battleOwnerOverride[state.battleState.targetRegionId] = state.battleState.attacker.id;
                    clearedBattleState = null;
                } else if (isKickedAttacker) {
                    // Defender wins → keeps the country (no owner change needed)
                    clearedBattleState = null;
                }
            }

            // 1. Mark player as eliminated
            const newPlayers = state.players.map(p =>
                p.id === playerIdToKick ? { ...p, isEliminated: true } : p
            );

            // 2. Redistribute their regions among active players
            const newOwners = { ...state.owners, ...battleOwnerOverride };
            const regionsToDistribute: string[] = [];
            Object.keys(newOwners).forEach(regionId => {
                if (String(newOwners[regionId]) === String(playerIdToKick)) {
                    regionsToDistribute.push(regionId);
                }
            });

            const activePlayers = newPlayers.filter(p => !p.isEliminated && String(p.id) !== String(playerIdToKick));
            const abandonmentMode = state.settings?.abandonmentMode || 'redistribute';

            if (abandonmentMode === 'redistribute' && activePlayers.length > 0) {
                // Shuffle for fairness and distribute round-robin
                const shuffledRegions = [...regionsToDistribute].sort(() => Math.random() - 0.5);
                shuffledRegions.forEach((regionId, index) => {
                    const assignedPlayer = activePlayers[index % activePlayers.length];
                    newOwners[regionId] = assignedPlayer.id;
                });
            } else {
                // neutralization mode OR no active players
                regionsToDistribute.forEach(regionId => {
                    newOwners[regionId] = null;
                });
            }

            // 3. Advancing the turn if it was their turn AND cleaning turnOrder
            const kickedPlayerIndexInArray = state.players.findIndex(p => String(p.id) === String(playerIdToKick));
            const newTurnOrder = state.turnOrder.filter(idx => idx !== kickedPlayerIndexInArray);

            let newState = {
                ...state,
                players: newPlayers,
                owners: newOwners,
                battleState: clearedBattleState,
                turnOrder: newTurnOrder
            };

            const currentPlayer = state.players[state.currentPlayerIndex];
            const isKickedCurrent = currentPlayer && String(currentPlayer.id) === String(playerIdToKick);

            if (isKickedCurrent) {
                // Find next in the NEW turn order
                // If we were at the end of turnOrder, wrapping will happen naturally
                let nextIndex = state.turnOrderIndex % newTurnOrder.length;
                let nextPlayerIndex: number;
                let nextPlayer: any;
                let loops = 0;

                // Extra safety: keep skipping if there are more eliminated players (shouldn't be in newTurnOrder but just in case)
                do {
                    nextPlayerIndex = newTurnOrder[nextIndex % newTurnOrder.length] ?? 0;
                    nextPlayer = newState.players[nextPlayerIndex];
                    if (nextPlayer && !nextPlayer.isEliminated) break;
                    nextIndex++;
                    loops++;
                    if (loops > newTurnOrder.length + 1) break;
                } while (true);

                newState.turnOrderIndex = nextIndex % newTurnOrder.length;
                newState.currentPlayerIndex = nextPlayerIndex;
                newState.usedAttackSources = [];
            } else {
                // If the kicked player was BEFORE the current player in turnOrder, we must decrement turnOrderIndex
                // so it keeps pointing to the same current player in the shrunken array.
                const kickedPos = state.turnOrder.indexOf(kickedPlayerIndexInArray);
                if (kickedPos !== -1 && kickedPos < state.turnOrderIndex) {
                    newState.turnOrderIndex = Math.max(0, state.turnOrderIndex - 1);
                }
            }

            // Notification
            const kickedPlayerInfo = state.players.find(p => String(p.id) === String(playerIdToKick));
            newState.notification = {
                type: 'NEUTRALIZED',
                title: 'JUGADOR EXPULSADO',
                message: `EL COMANDANTE ${kickedPlayerInfo?.name.toUpperCase() || 'DESCONOCIDO'} HA SIDO EXPULSADO. SUS REGIONES AHORA SON ${abandonmentMode === 'neutralize' ? 'NEUTRALES' : 'ADMINISTRADAS POR EL RESTO'}.`,
                color: '#ff4444'
            };

            return newState;
        }

        default:
            return state;
    }
}
