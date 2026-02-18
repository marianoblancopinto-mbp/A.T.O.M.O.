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
    targetPlayerId?: string | number;
    missionId?: string;
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
            proxyWarCountry: string;
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
        }
    };




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
    usedAttackSources: []
};

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
            const nextIndex = (state.turnOrderIndex + 1) % state.turnOrder.length;
            const nextPlayerIndex = state.turnOrder[nextIndex] ?? 0;
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
                proxyWarCountry: action.payload.proxyWarCountry,
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
            if (defCard.regiment === 'A') terrainBonus = defenderBonuses.air;
            if (defCard.regiment === 'B') terrainBonus = defenderBonuses.inf;
            if (defCard.regiment === 'C') terrainBonus = defenderBonuses.art;

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

        case 'SYNC_STATE':
            return {
                ...state,
                ...action.payload,
                gameDate: action.payload.gameDate ? new Date(action.payload.gameDate) : state.gameDate,
                winner: action.payload.winner !== undefined ? action.payload.winner : state.winner,
                endgameChoice: action.payload.endgameChoice !== undefined ? action.payload.endgameChoice : state.endgameChoice,
                usedAttackSources: action.payload.usedAttackSources !== undefined ? action.payload.usedAttackSources : state.usedAttackSources
            };

        case 'PROCESS_TURN_CHANGE':
            return {
                ...state,
                players: action.payload.players,
                gameDate: new Date(action.payload.gameDate),
                turnOrderIndex: action.payload.turnOrderIndex,
                currentPlayerIndex: action.payload.currentPlayerIndex,
                turnOrder: action.payload.turnOrder ?? state.turnOrder,
                owners: action.payload.owners ?? state.owners,
                notification: action.payload.notification ?? state.notification,
                winner: action.payload.winner ?? state.winner,
                endgameChoice: action.payload.endgameChoice ?? state.endgameChoice,
                usedAttackSources: action.payload.usedAttackSources ?? []
            };

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

    // Sync Multiplayer Players to Game State and Start Game
    React.useEffect(() => {
        if (multiplayer.connectionStatus === 'PLAYING' && !state.gameStarted) {

            const fetchGameState = async (attempts = 0) => {
                const { supabase } = await import('../supabaseClient');
                if (!multiplayer.gameId) return;

                console.log(`[GameContext] Intentando obtener estado inicial... (Intento ${attempts + 1})`);

                const { data, error } = await supabase
                    .from('game_states')
                    .select('full_state')
                    .eq('game_id', multiplayer.gameId)
                    .single();

                if (error) {
                    console.error("[GameContext] Error al consultar game_states:", error);
                }

                if (data && data.full_state && Object.keys(data.full_state).length > 0) {
                    const fullState = data.full_state;
                    console.log("[GameContext] Estado inicial recibido y sincronizado.");

                    // Initialize the entire game engine with synchronised data
                    dispatch({
                        type: 'START_GAME',
                        payload: {
                            players: fullState.players,
                            owners: fullState.owners,
                            proxyWarCountry: fullState.proxyWarCountry || 'País Desconocido'
                        }
                    });

                    // Sync other complex state objects
                    if (fullState.productionDeck) {
                        dispatch({ type: 'SET_PRODUCTION_DECK', payload: fullState.productionDeck });
                    }
                    if (fullState.regionResources) {
                        dispatch({ type: 'SET_REGION_RESOURCES', payload: fullState.regionResources });
                    }
                    if (fullState.turnOrder) {
                        dispatch({ type: 'SET_TURN_ORDER', payload: fullState.turnOrder });
                    }
                    if (fullState.currentPlayerIndex !== undefined) {
                        dispatch({ type: 'SET_CURRENT_PLAYER', payload: fullState.currentPlayerIndex });
                    }
                    if (fullState.gameDate) {
                        dispatch({ type: 'SET_GAME_DATE', payload: new Date(fullState.gameDate) });
                    }

                } else {
                    if (attempts < 10) { // Try for ~5 seconds
                        console.warn(`[GameContext] Estado no encontrado. Reintentando en 500ms...`);
                        setTimeout(() => fetchGameState(attempts + 1), 500);
                    } else {
                        console.error("[GameContext] Error crítico: No se pudo obtener el estado inicial después de varios intentos.");
                    }
                }
            };

            fetchGameState();
        }
    }, [multiplayer.connectionStatus, state.gameStarted, multiplayer.gameId]);

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
                        const isMyTurn = state.players[state.currentPlayerIndex]?.id === multiplayer.playerId;
                        if (isMyTurn) return;

                        dispatch({
                            type: 'SYNC_STATE',
                            payload: {
                                players: remoteState.players,
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
                                endgameChoice: remoteState.endgameChoice
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
        'SET_ENDGAME_CHOICE'
    ]);

    const dispatchWithSync = (action: GameAction) => {
        // 1. TURN VALIDATION (The "Wrong Window" Fix)
        // If we in a multiplayer game, ensure we are the Active Player before doing state-changing actions.
        if (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId && state.gameStarted) {
            const currentPlayer = state.players[state.currentPlayerIndex];
            const isMyTurn = currentPlayer?.id === multiplayer.playerId;

            // Block gameplay actions if it's not my turn
            // Exception: SYNC_STATE (incoming from remote) is always allowed.
            // Exception: Battle Defender Actions (BATTLE_DEFENDER_SELECT) allowed for the defender.

            const isBattleDefenderAction = action.type === 'BATTLE_DEFENDER_SELECT';
            // We need to check if we are the defender in the current battle
            // NOTE: state.battleState might be null if we are not in battle, but if we are sending this action we presumably are.
            // Safely check:
            const isDefender = state.battleState && state.battleState.defender.id === multiplayer.playerId;

            const isAllowedException = (isBattleDefenderAction && isDefender);

            if (SYNCABLE_ACTIONS.has(action.type) && !isMyTurn && action.type !== 'SYNC_STATE' && !isAllowedException) {
                console.warn(`[GameContext] 🚫 Action BLOCKED: ${action.type}. It is ${currentPlayer?.name}'s turn (ID: ${currentPlayer?.id}), but you are ${multiplayer.playerId}.`);
                return; // DROP ACTION LOCALLY
            }
        }

        // 2. Dispatch locally
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
        if (multiplayer.lastBroadcastedAction) {
            const action = multiplayer.lastBroadcastedAction;
            console.log('[GameContext] Received Remote Action:', action.type);
            dispatch(action);
        }
    }, [multiplayer.lastBroadcastedAction]);


    // REAL-TIME SYNC: Push local changes to remote
    const lastSyncedStateRef = React.useRef<string>("");

    React.useEffect(() => {
        if (!multiplayer.gameId || multiplayer.connectionStatus !== 'PLAYING' || !state.gameStarted) return;

        // Only the "Active Player" (whose turn it is) should push state updates
        // to avoid race conditions and redundant writes.
        // Exception: During INIT_BATTLE or END_BATTLE, maybe the attacker pushes?
        // Simple heuristic: If it's my turn, I push.

        const isMyTurn = state.players[state.currentPlayerIndex]?.id === multiplayer.playerId;
        if (!isMyTurn) return;

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
            usedAttackSources: state.usedAttackSources
        };

        const stateString = JSON.stringify(syncableState);
        if (stateString !== lastSyncedStateRef.current) {
            lastSyncedStateRef.current = stateString;

            // Push to Supabase after a small delay (debouncing)
            const timeout = setTimeout(() => {
                multiplayer.syncGameState(syncableState);
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [state, multiplayer.gameId, multiplayer.connectionStatus, state.gameStarted, multiplayer.playerId]);

    return (
        <GameContext.Provider value={{ state, dispatch: dispatchWithSync, multiplayer }}>
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
