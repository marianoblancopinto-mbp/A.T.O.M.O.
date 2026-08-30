/**
 * GameContext - Gestión centralizada del estado de juego (capa React).
 *
 * Los tipos, el initialState, los sanitizadores y el reducer PURO viven en
 * @atomo/shared. Este archivo conserva el Provider de React, los hooks y el
 * cableado con el SERVIDOR AUTORITATIVO (Colyseus).
 *
 * Modelo (Fase 3): el servidor es la única fuente de verdad. El cliente aplica
 * la acción localmente (optimista, para responder rápido) y la manda como Intent
 * al servidor; cuando el servidor difunde el estado autoritativo, se reconcilia
 * con SYNC_STATE. Se eliminó todo el netcode viejo de Supabase (dos canales,
 * refs de autoridad, takeover, forceSyncFromDatabase).
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { PlayerData } from '../types/playerTypes';
import { gameReducer, initialState, sanitizePlayers, toSerializableAction } from '@atomo/shared';
import type { GamePhase, GameState, GameAction } from '@atomo/shared';
import { useColyseus } from '../hooks/useColyseus';

// Re-export de tipos de estado para compatibilidad con imports existentes.
export type { GamePhase, MissionNotification, GameSettings, GameState, GameAction } from '@atomo/shared';

// ============================================================================
// Context
// ============================================================================

interface GameContextValue {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    multiplayer: ReturnType<typeof useColyseus>;
}

const GameContext = createContext<GameContextValue | null>(null);

// Acciones que NUNCA se mandan al servidor (son locales/de reconciliación).
const LOCAL_ONLY_ACTIONS = new Set<GameAction['type']>(['SYNC_STATE', 'RESET_GAME']);

// ============================================================================
// Provider
// ============================================================================

interface GameProviderProps {
    children: ReactNode;
    /** For spectator mode or testing - override initial phase */
    initialPhase?: GamePhase;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children, initialPhase }) => {
    const multiplayer = useColyseus();
    const [state, dispatch] = useReducer(
        gameReducer,
        {
            ...initialState,
            gamePhase: initialPhase ?? initialState.gamePhase,
            gameStarted: initialPhase === 'playing',
        }
    );

    // Ref para saber si ya arrancamos, sin re-crear el handler en cada cambio.
    const gameStartedRef = useRef(state.gameStarted);
    gameStartedRef.current = state.gameStarted;

    // Estado autoritativo que llega del servidor.
    const handleRemoteState = useCallback((remoteState: any) => {
        if (!remoteState) return;

        // Primera vez que llega un estado ya iniciado: entrar en "playing".
        if (!gameStartedRef.current && remoteState.gameStarted) {
            dispatch({
                type: 'START_GAME',
                payload: {
                    players: sanitizePlayers(remoteState.players ?? []),
                    owners: remoteState.owners ?? {},
                    settings: remoteState.settings ?? initialState.settings,
                },
            });
        }

        // Reconciliar el resto del estado (SYNC_STATE sanea y rehidrata gameDate).
        dispatch({ type: 'SYNC_STATE', payload: remoteState });
    }, []);

    useEffect(() => {
        multiplayer.setOnStateReceived(handleRemoteState);
    }, [multiplayer.setOnStateReceived, handleRemoteState]);

    // ============================================================================
    // Dispatch: aplica local (optimista) + envía al servidor autoritativo
    // ============================================================================

    const dispatchWithSync = (action: GameAction) => {
        const isPlaying = multiplayer.connectionStatus === 'PLAYING';

        // Única restricción por turno del lado del cliente: ATACAR. El servidor
        // igual valida (rules), esto sólo evita el flicker optimista.
        if (isPlaying && state.gameStarted && action.type === 'INIT_BATTLE') {
            const currentPlayer = state.players[state.currentPlayerIndex];
            const isMyTurn = currentPlayer && String(currentPlayer.id) === String(multiplayer.playerId);
            if (!isMyTurn) {
                console.warn('[GameContext] 🚫 Ataque bloqueado: no es tu turno.');
                return;
            }
        }

        // 1. Aplicar localmente (optimista).
        dispatch(action);

        // 2. Enviar al servidor autoritativo (convierte las acciones *_FN a serializable).
        if (isPlaying && !LOCAL_ONLY_ACTIONS.has(action.type)) {
            multiplayer.sendAction(toSerializableAction(action, state));
        }
    };

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
