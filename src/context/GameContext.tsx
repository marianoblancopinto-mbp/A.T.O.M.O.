/**
 * GameContext - Gestión centralizada del estado de juego (capa React).
 *
 * Los tipos de estado, el initialState, los sanitizadores y el reducer PURO
 * ahora viven en ./gameReducer (Fase 1 de la migración a servidor autoritativo).
 * Este archivo conserva el Provider de React, los hooks y el cableado de
 * sincronización multiplayer. Los tipos se re-exportan acá para no romper los
 * imports existentes.
 */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { PlayerData } from '../types/playerTypes';
import { gameReducer, initialState, sanitizePlayers } from './gameReducer';
import type { GamePhase, GameState, GameAction } from './gameReducer';

// Re-export de tipos de estado para compatibilidad con imports existentes.
export type { GamePhase, MissionNotification, GameSettings, GameState, GameAction } from './gameReducer';

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
    const remoteActionTriggeredRef = React.useRef(false);
    const isSyncingRef = React.useRef(false);

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
            remoteActionTriggeredRef.current = true; // authoritative source
            localActionTriggeredRef.current = false;

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

    const handleBroadcastAction = React.useCallback((action: any) => {
        console.log(`[GameContext] 📥 Handling Remote Action: ${action.type}`);
        remoteActionTriggeredRef.current = true;
        localActionTriggeredRef.current = false;
        dispatch(action);
    }, []);

    const handleRemoteState = React.useCallback((remoteState: any) => {
        const players = state.players;
        const currentPlayerIndex = state.currentPlayerIndex;
        if (!players || players.length === 0) return;

        const currentPlayer = players[currentPlayerIndex];
        const isMyTurn = currentPlayer && String(currentPlayer.id) === String(multiplayer.playerId);
        
        const remoteBattle = remoteState.battleState;
        const isBattleParticipant = remoteBattle && (
            String(remoteBattle.attacker?.id) === String(multiplayer.playerId) ||
            String(remoteBattle.defender?.id) === String(multiplayer.playerId)
        );

        // Autoritative Check: If it's my turn, I ONLY accept the remote state if I'm NOT currently syncing.
        if (isMyTurn && !isBattleParticipant && !isSyncingRef.current && state.gameStarted) {
            console.log('[GameContext] 🛡️ Ignoring remote sync because it is MY turn.');
            return;
        }

        console.log('[GameContext] 📥 Handling Remote DB Sync');
        remoteActionTriggeredRef.current = true;
        localActionTriggeredRef.current = false;
        dispatch({ type: 'SYNC_STATE', payload: remoteState });
    }, [state.players, state.currentPlayerIndex, multiplayer.playerId, state.gameStarted]);

    // Connect handlers
    React.useEffect(() => {
        multiplayer.setOnBroadcastReceived(handleBroadcastAction);
        multiplayer.setOnStateReceived(handleRemoteState);
    }, [multiplayer.setOnBroadcastReceived, multiplayer.setOnStateReceived, handleBroadcastAction, handleRemoteState]);

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
        'KICK_PLAYER',
        'UPDATE_PLAYER'
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
        remoteActionTriggeredRef.current = false; // This is a local action
        dispatch(action);

        // 3. Broadcast if syncable
        if (multiplayer.gameId && multiplayer.connectionStatus === 'PLAYING') {
            if (SYNCABLE_ACTIONS.has(action.type) && action.type !== 'SYNC_STATE') {
                console.log(`[GameContext] 📡 Broadcasting Action: ${action.type}`);
                multiplayer.broadcastAction(action);
            }
        }
    };


    // REAL-TIME SYNC: Push local changes to remote
    const lastSyncedStateRef = React.useRef<string>("");

    const validateSyncState = (stateObj: any) => {
        const validated = { ...stateObj };
        // Ensure indices are numbers
        if (validated.currentPlayerIndex === null || validated.currentPlayerIndex === undefined || isNaN(Number(validated.currentPlayerIndex))) {
            console.warn("[GameContext] 🛡️ Fixed null/invalid currentPlayerIndex before sync");
            validated.currentPlayerIndex = 0;
        } else {
            validated.currentPlayerIndex = Number(validated.currentPlayerIndex);
        }

        if (validated.turnOrderIndex === null || validated.turnOrderIndex === undefined || isNaN(Number(validated.turnOrderIndex))) {
            validated.turnOrderIndex = 0;
        } else {
            validated.turnOrderIndex = Number(validated.turnOrderIndex);
        }

        // Ensure date is a number (timestamp)
        if (validated.gameDate && typeof validated.gameDate !== 'number') {
            validated.gameDate = new Date(validated.gameDate).getTime();
        }

        return validated;
    };

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

        // Anti-Flicker Fix: In a battle, multiple participants might broadcast actions.
        // We MUST rely on broadcastAction for real-time battle updates, and ONLY the Active Player
        // (whose turn it actually is) should persist the final resolved state to Supabase.
        // If we let the defender also push SYNC_STATE, they might overwrite the DB with an older state snapshot.
        if (state.battleState?.isActive && !isMyTurn) {
            return;
        }

        // Authority Check: If this was a remote change, SKIP SYNCING BACK
        if (remoteActionTriggeredRef.current) {
            console.log('[GameContext] 🛡️ Ignoring remote change for sync sync (Prevent Loop)');
            remoteActionTriggeredRef.current = false;
            // Catch up lastSyncedStateRef to avoid redundant syncs later
            // But we must serialize the current state first.
        }

        if (!isMyTurn && !isBattleParticipant && !wasLocallyTriggered) {
            return;
        }

        // Serialize relevant parts of state to check for changes
        const syncableState = validateSyncState({
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
        });

        const stateString = JSON.stringify(syncableState);
        
        // If it was a remote change, we just update the ref and return
        if (!wasLocallyTriggered && !isMyTurn && !isBattleParticipant) {
             lastSyncedStateRef.current = stateString;
             return;
        }

        if (stateString !== lastSyncedStateRef.current) {
            // Prevent parallel syncs
            if (isSyncingRef.current) {
                console.warn('[GameContext] ⏳ Already syncing, skipping this tick...');
                return;
            }

            lastSyncedStateRef.current = stateString;

            // CRITICAL: If this was a local action (like ending a turn), sync IMMEDIATELY
            // to prevent race conditions and ensure next player gets the state.
            if (wasLocallyTriggered) {
                console.log('[GameContext] ⚡ SYNCING IMMEDIATELY (Local Action)');
                isSyncingRef.current = true;
                multiplayer.syncGameState(syncableState).finally(() => {
                    isSyncingRef.current = false;
                });
            } else {
                // Push to Supabase after a small delay (debouncing) for background changes
                const timeout = setTimeout(() => {
                    console.log('[GameContext] 📦 Triggering debounced sync...');
                    isSyncingRef.current = true;
                    multiplayer.syncGameState(syncableState).finally(() => {
                        isSyncingRef.current = false;
                    });
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
