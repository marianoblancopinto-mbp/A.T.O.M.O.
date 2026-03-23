/**
 * GameContext - Centralized Game State Management
 * 
 * This context centralizes game state using useReducer pattern.
 * Designed to be "Supabase-ready" for future multiplayer support.
 */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { PlayerData, SpecialCard } from '../types/playerTypes';
import type { ProductionDeck, SupplyItem } from '../types/productionTypes';
import type { ActiveProviders } from '../data/productionData';
import type { Treaty } from '../types/treatyTypes';
import { REGIONS } from '../data/mapRegions';

// ============================================================================
// Types
// ============================================================================

// ... (imports)

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
    battleState: import('../types/gameTypes').BattleState | null;

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
    | { type: 'INIT_BATTLE'; payload: import('../types/gameTypes').BattleState }
    | { type: 'UPDATE_BATTLE'; payload: Partial<import('../types/gameTypes').BattleState> }
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

const initialState: GameState = {
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
function sanitizePlayer(p: any): PlayerData {
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

function sanitizePlayers(players: any[]): PlayerData[] {
    if (!Array.isArray(players)) return [];
    return players.map(sanitizePlayer);
}

// ============================================================================
// Reducer
// ============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
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
            const syncPayload = { ...action.payload };
            
            // Critical: Ensure players is always an array
            const sanitizedPlayers = (syncPayload.players !== undefined && syncPayload.players !== null)
                ? sanitizePlayers(syncPayload.players)
                : state.players;

            if (syncPayload.treaties === undefined || syncPayload.treaties === null) {
                syncPayload.treaties = state.treaties;
            }
            if (syncPayload.usedAttackSources === undefined || syncPayload.usedAttackSources === null) {
                syncPayload.usedAttackSources = state.usedAttackSources;
            }
            return {
                ...state,
                ...syncPayload,
                players: sanitizedPlayers,
                gameDate: action.payload.gameDate ? new Date(action.payload.gameDate) : state.gameDate,
                winner: action.payload.winner !== undefined ? action.payload.winner : state.winner,
                endgameChoice: action.payload.endgameChoice !== undefined ? action.payload.endgameChoice : state.endgameChoice,
                usedAttackSources: syncPayload.usedAttackSources,
                treaties: syncPayload.treaties
            };
        }

        case 'PROCESS_TURN_CHANGE': {
            const sanitizedPlayers = (action.payload.players !== undefined && action.payload.players !== null)
                ? sanitizePlayers(action.payload.players)
                : state.players;

            console.log(`[GameContext] 🔄 Processing Turn Change to Index: ${action.payload.currentPlayerIndex}`);

            return {
                ...state,
                players: sanitizedPlayers,
                gameDate: new Date(action.payload.gameDate),
                turnOrderIndex: Number(action.payload.turnOrderIndex),
                currentPlayerIndex: Number(action.payload.currentPlayerIndex),
                turnOrder: action.payload.turnOrder ?? state.turnOrder,
                owners: action.payload.owners ?? state.owners,
                notification: action.payload.notification ?? state.notification,
                winner: action.payload.winner ?? state.winner,
                endgameChoice: action.payload.endgameChoice ?? state.endgameChoice,
                usedAttackSources: action.payload.usedAttackSources ?? [],
                treaties: action.payload.treaties ?? state.treaties
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

            // 3. Advancing the turn if it was their turn
            let newState = {
                ...state,
                players: newPlayers,
                owners: newOwners,
                battleState: clearedBattleState
            };

            const currentPlayer = newState.players[newState.currentPlayerIndex];
            if (currentPlayer && String(currentPlayer.id) === String(playerIdToKick)) {
                // Call NEXT_TURN logic manually since we are inside the reducer
                let nextIndex = newState.turnOrderIndex;
                let nextPlayerIndex: number;
                let nextPlayer: any;
                let loops = 0;
                do {
                    nextIndex = (nextIndex + 1) % newState.turnOrder.length;
                    nextPlayerIndex = newState.turnOrder[nextIndex] ?? 0;
                    nextPlayer = newState.players[nextPlayerIndex];
                    loops++;
                    if (loops > newState.turnOrder.length * 2) break;
                } while (nextPlayer && nextPlayer.isEliminated);
                
                newState.turnOrderIndex = nextIndex;
                newState.currentPlayerIndex = nextPlayerIndex;
                newState.usedAttackSources = [];
            }

            // Notification
            const kickedPlayerInfo = state.players.find(p => String(p.id) === String(playerIdToKick));
            // const abandonmentMode = state.settings?.abandonmentMode || 'redistribute'; // Already declared above
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

// ============================================================================
// Context
// ============================================================================

import { useMultiplayer } from '../hooks/useMultiplayer';

// ... imports

// ============================================================================
// Context
// ============================================================================

interface GameContextValue {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    multiplayer: ReturnType<typeof useMultiplayer>;
    forceSyncFromDatabase: (isInitialStartup?: boolean, attempts?: number) => Promise<void>;
    takeoverRequest: string | null;
    respondToTakeover: (allow: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface GameProviderProps {
    children: ReactNode;
    /** For spectator mode or testing - override initial phase */
    initialPhase?: GamePhase;
}

export const GameProvider: React.FC<GameProviderProps> = ({
    children,
    initialPhase
}) => {
    const multiplayer = useMultiplayer();
    const [state, dispatch] = useReducer(
        gameReducer,
        {
            ...initialState,
            gamePhase: initialPhase ?? initialState.gamePhase,
            gameStarted: initialPhase === 'playing',
        }
    );

    const [takeoverRequest, setTakeoverRequest] = React.useState<string | null>(null);

    // Track actions initiated locally vs received from remote
    const localActionTriggeredRef = React.useRef(false);

    const forceSyncFromDatabase = React.useCallback(async (isInitialStartup: boolean = false, attempts = 0) => {
        const { supabase } = await import('../supabaseClient');
        if (!multiplayer.gameId) return;

        console.log(`[GameContext] Fetching full state from database... (Initial: ${isInitialStartup}, Attempt: ${attempts + 1})`);

        const { data, error } = await supabase
            .from('game_states')
            .select('full_state')
            .eq('game_id', multiplayer.gameId)
            .single();

        if (error) {
            console.error("[GameContext] Error fetching game_states:", error);
        }

        if (data && data.full_state && Object.keys(data.full_state).length > 0) {
            const remoteState = data.full_state;
            console.log("[GameContext] Full state received.");

            if (isInitialStartup) {
                // 1. Enter the "Playing" state
                dispatch({
                    type: 'START_GAME',
                    payload: {
                        players: sanitizePlayers(remoteState.players),
                        owners: remoteState.owners,
                        settings: remoteState.settings || {
                            proxyWarCountry: remoteState.proxyWarCountry || 'País Desconocido',
                            abandonmentMode: 'redistribute',
                            aiActive: false,
                            aiDifficulty: 50,
                            gameMode: 'classic'
                        }
                    }
                });
            }

            // 2. Sync ALL remaining state fields (applies to both initial and background syncs)
            dispatch({
                type: 'SYNC_STATE',
                payload: {
                    players: remoteState.players,
                    owners: remoteState.owners,
                    currentPlayerIndex: remoteState.currentPlayerIndex,
                    gameDate: remoteState.gameDate ? new Date(remoteState.gameDate) : undefined,
                    turnOrder: remoteState.turnOrder,
                    turnOrderIndex: remoteState.turnOrderIndex,
                    productionDeck: remoteState.productionDeck,
                    regionResources: remoteState.regionResources,
                    battleState: remoteState.battleState,
                    notification: remoteState.notification,
                    winner: remoteState.winner,
                    endgameChoice: remoteState.endgameChoice,
                    treaties: remoteState.treaties,
                    settings: remoteState.settings,
                    proxyWarCountry: remoteState.proxyWarCountry,
                    usedAttackSources: remoteState.usedAttackSources
                }
            });
        } else {
            if (isInitialStartup && attempts < 10) {
                console.warn(`[GameContext] State not found. Retrying in 500ms...`);
                setTimeout(() => forceSyncFromDatabase(true, attempts + 1), 500);
            } else if (isInitialStartup) {
                console.error("[GameContext] Critical Error: Could not get initial state.");
            }
        }
    }, [multiplayer.gameId]);

    // Initial Startup Sync
    React.useEffect(() => {
        if (multiplayer.connectionStatus === 'PLAYING' && !state.gameStarted) {
            forceSyncFromDatabase(true);
        }
    }, [multiplayer.connectionStatus, state.gameStarted, forceSyncFromDatabase]);

    // Visibility Change / Reconnect Sync (Fix for mobile sleep/backgrounding)
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && multiplayer.connectionStatus === 'PLAYING' && state.gameStarted) {
                console.log('[GameContext] Returned to foreground, forcing state sync...');
                forceSyncFromDatabase(false);
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [multiplayer.connectionStatus, state.gameStarted, forceSyncFromDatabase]);

    // REAL-TIME SYNC: Subscribe to remote changes
    React.useEffect(() => {
        if (!multiplayer.gameId || multiplayer.connectionStatus !== 'PLAYING') return;



        let channel: any;

        const setupSync = async () => {
            const { supabase } = await import('../supabaseClient');
            channel = supabase
                .channel(`game_state:${multiplayer.gameId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'game_states',
                        filter: `game_id=eq.${multiplayer.gameId}`
                    },
                    (payload: any) => {
                        const remoteState = payload.new.full_state;
                        if (!remoteState) return;

                        // Prevent feedback loop: only sync if we are NOT the active player
                        // Exception: during battle, both participants must receive updates
                        const currentPlayer = state.players[state.currentPlayerIndex];
                        const isMyTurn = currentPlayer && String(currentPlayer.id) === String(multiplayer.playerId);
                        const remoteBattle = remoteState.battleState;
                        const isBattleParticipant = remoteBattle && (
                            String(remoteBattle.attacker?.id) === String(multiplayer.playerId) ||
                            String(remoteBattle.defender?.id) === String(multiplayer.playerId)
                        );
                        if (isMyTurn && !isBattleParticipant) return;

                        dispatch({
                            type: 'SYNC_STATE',
                            payload: {
                                players: remoteState.players, // Trace this
                                owners: remoteState.owners,
                                currentPlayerIndex: remoteState.currentPlayerIndex,
                                gameDate: remoteState.gameDate ? new Date(remoteState.gameDate) : state.gameDate,
                                turnOrder: remoteState.turnOrder,
                                turnOrderIndex: remoteState.turnOrderIndex,
                                productionDeck: remoteState.productionDeck,
                                regionResources: remoteState.regionResources,
                                battleState: remoteState.battleState,
                                notification: remoteState.notification,
                                winner: remoteState.winner,
                                endgameChoice: remoteState.endgameChoice,
                                treaties: remoteState.treaties
                            }
                        });
                    }
                )
                .subscribe();
        };

        setupSync();

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [multiplayer.gameId, multiplayer.connectionStatus, state.currentPlayerIndex, multiplayer.playerId]);

    // ============================================================================
    // Action Sync Middleware
    // ============================================================================

    const SYNCABLE_ACTIONS = new Set([
        'START_GAME',
        'NEXT_TURN',
        'PROCESS_TURN_CHANGE',
        'UPDATE_OWNER',
        'INIT_BATTLE',
        'UPDATE_BATTLE',
        'END_BATTLE',
        'ADD_SPECIAL_CARD',
        'MARK_CARD_AS_USED',
        'ADD_SUPPLY',
        'SET_GAME_PHASE',
        'BATTLE_ATTACKER_SELECT',
        'BATTLE_DEFENDER_SELECT',
        'BATTLE_NEXT_ROUND',
        'SET_ENDGAME_CHOICE',
        'CREATE_TREATY_OFFER',
        'UPDATE_TREATY',
        'CANCEL_TREATY',
        'KICK_PLAYER'
    ]);

    const dispatchWithSync = (action: GameAction) => {
        // 1. TURN VALIDATION (The "Wrong Window" Fix)
        // If we in a multiplayer game, ensure we are the Active Player before doing state-changing actions.
        if (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId && state.gameStarted) {
            const currentPlayer = state.players[state.currentPlayerIndex];
            const isMyTurn = currentPlayer && String(currentPlayer.id) === String(multiplayer.playerId);

            // User request: LA UNICA ACCION BLOQUEDA POR TURNO DEBE SER ATACAR OTRO PAIS. 
            // EL RESTO DE LAS ACCIONES SON EJECUTABLES EN CUALQUIER MOMENTO.
            if (action.type === 'INIT_BATTLE' && !isMyTurn) {
                console.warn(`[GameContext] 🚫 Action BLOCKED: ${action.type}. It is ${currentPlayer?.name}'s turn (ID: ${currentPlayer?.id}), but you are ${multiplayer.playerId}.`);
                return; // DROP ACTION LOCALLY
            }
        }

        // 2. Dispatch locally
        localActionTriggeredRef.current = true;
        dispatch(action);

        // 3. Broadcast if syncable
        if (multiplayer.gameId && multiplayer.connectionStatus === 'PLAYING') {
            if (SYNCABLE_ACTIONS.has(action.type) && action.type !== 'SYNC_STATE') {
                console.log(`[GameContext] 📡 Broadcasting Action: ${action.type}`);
                multiplayer.broadcastAction(action);
            }
        }
    };

    React.useEffect(() => {
        // Register the fast-path broadcast receiver to avoid React batching dropped actions
        multiplayer.setOnBroadcastReceived((action) => {
            console.log('[GameContext] Received Remote Action (Fast Path):', action.type);
            
            // Handle takeover requests outside reducer (if affecting THIS client)
            if (action.type === ('TAKEOVER_REQUEST' as any) && action.payload.playerId === multiplayer.playerId) {
                setTakeoverRequest(multiplayer.playerId);
                return;
            }
            if (action.type === ('TAKEOVER_GRANTED' as any) && action.payload.playerId === multiplayer.playerId) {
                // Someone else successfully took over our player ID. We must disconnect locally.
                setTakeoverRequest(null);
                alert("Tu sesión ha sido transferida a otro dispositivo.");
                localStorage.removeItem('teg_gameId');
                localStorage.removeItem('teg_playerId');
                window.location.reload();
                return;
            }

            dispatch(action);
        });
    }, [multiplayer]);


    // REAL-TIME SYNC: Push local changes to remote
    const lastSyncedStateRef = React.useRef<string>("");

    React.useEffect(() => {
        if (!multiplayer.gameId || multiplayer.connectionStatus !== 'PLAYING' || !state.gameStarted) return;

        // CRITICAL SYNC LOGIC:
        // We only push state updates to the database if:
        // 1. It is our turn (Active Player).
        // 2. We are in an active battle (Both participants push).
        // 3. We JUST finished our turn (The localActionTriggeredRef was set on dispatch,
        //    but isMyTurn is now false because the turn transitioned locally first).

        const currentPlayer = state.players[state.currentPlayerIndex];
        const isMyTurn = currentPlayer && String(currentPlayer.id) === String(multiplayer.playerId);
        const isBattleParticipant = state.battleState && (
            String(state.battleState.attacker?.id) === String(multiplayer.playerId) ||
            String(state.battleState.defender?.id) === String(multiplayer.playerId)
        );

        const wasLocallyTriggered = localActionTriggeredRef.current;
        localActionTriggeredRef.current = false; // Reset for next run

        if (!isMyTurn && !isBattleParticipant && !wasLocallyTriggered) {
            return;
        }

        // Serialize relevant parts of state to check for changes
        const syncableState = {
            players: state.players,
            owners: state.owners,
            currentPlayerIndex: state.currentPlayerIndex,
            gameDate: state.gameDate.getTime(),
            turnOrder: state.turnOrder,
            turnOrderIndex: state.turnOrderIndex,
            productionDeck: state.productionDeck,
            regionResources: state.regionResources,
            battleState: state.battleState,
            notification: state.notification,
            proxyWarCountry: state.proxyWarCountry,
            winner: state.winner,
            endgameChoice: state.endgameChoice,
            usedAttackSources: state.usedAttackSources,
            treaties: state.treaties,
            settings: state.settings
        };

        const stateString = JSON.stringify(syncableState);
        if (stateString !== lastSyncedStateRef.current) {
            lastSyncedStateRef.current = stateString;

            // CRITICAL: If this was a local action (like ending a turn), sync IMMEDIATELY
            // to prevent race conditions and ensure next player gets the state.
            if (wasLocallyTriggered) {
                console.log('[GameContext] ⚡ SYNCING IMMEDIATELY (Local Action)');
                multiplayer.syncGameState(syncableState);
            } else {
                // Push to Supabase after a small delay (debouncing) for background changes
                const timeout = setTimeout(() => {
                    console.log('[GameContext] 📦 Triggering debounced sync...');
                    multiplayer.syncGameState(syncableState);
                }, 100);

                return () => clearTimeout(timeout);
            }
        }
    }, [state, multiplayer.gameId, multiplayer.connectionStatus, state.gameStarted, multiplayer.playerId]);

    // Function to respond to takeover
    const respondToTakeover = React.useCallback((allow: boolean) => {
        if (!takeoverRequest || !multiplayer.playerId) return;
        
        multiplayer.broadcastAction({
            type: allow ? 'TAKEOVER_GRANTED' : 'TAKEOVER_DENIED',
            payload: { playerId: multiplayer.playerId }
        } as any);

        setTakeoverRequest(null);
        
        if (allow) {
            // Disconnect ourselves since we allowed it
            alert("Sesión transferida exitosamente.");
            localStorage.removeItem('teg_gameId');
            localStorage.removeItem('teg_playerId');
            window.location.reload();
        }
    }, [takeoverRequest, multiplayer.playerId, multiplayer]);

    return (
        <GameContext.Provider value={{ 
            state, 
            dispatch: dispatchWithSync, 
            multiplayer,
            forceSyncFromDatabase,
            takeoverRequest,
            respondToTakeover 
        }}>
            {children}
        </GameContext.Provider>
    );
};

// ============================================================================
// Hooks
// ============================================================================

/** Main hook to access state and dispatch */
export const useGameContext = (): GameContextValue => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGameContext must be used within a GameProvider');
    }
    return context;
};

/** Get only the game state (read-only access) */
export const useGameState = (): GameState => {
    const { state } = useGameContext();
    return state;
};

/** Get the current player's data */
export const useCurrentPlayer = (): PlayerData | null => {
    const { state } = useGameContext();
    return state.players[state.currentPlayerIndex] ?? null;
};

/** Get a specific player by index */
export const usePlayer = (index: number): PlayerData | null => {
    const { state } = useGameContext();
    return state.players[index] ?? null;
};

/** Access multiplayer controls */
export const useMultiplayerContext = () => {
    const { multiplayer } = useGameContext();
    return multiplayer;
};

// Re-export for backwards compatibility
export { GameContext };
