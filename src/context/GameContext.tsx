/**
 * GameContext — estado de juego en el cliente.
 *
 * El cliente NO calcula el estado: muestra la vista que le manda el servidor
 * (su proyección: lo propio completo, lo ajeno redactado) y manda comandos con
 * `send`. No hay reducer local ni actualizaciones optimistas: para un juego por
 * turnos, la ida y vuelta al servidor es imperceptible y evita desincronías.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { PlayerData } from '../types/playerTypes';
import { initialState, sanitizePlayers, toGameDate } from '@atomo/shared';
import type { GamePhase, GameState, Command } from '@atomo/shared';
import { useTransport } from '../hooks/useTransport';

export type { GamePhase, MissionNotification, GameSettings, GameState, Command } from '@atomo/shared';

interface GameContextValue {
    state: GameState;
    /** Manda una intención al servidor. */
    send: (command: Command) => void;
    multiplayer: ReturnType<typeof useTransport>;
    /** Notificaciones que este cliente ya cerró (el descarte es local). */
    dismissNotification: (id: number) => void;
    dismissedNotificationIds: ReadonlySet<number>;
}

const GameContext = createContext<GameContextValue | null>(null);

/** Rehidrata la vista que llega por la red (fechas, campos faltantes). */
function hydrate(remote: any): GameState {
    return {
        ...initialState,
        ...remote,
        gameDate: toGameDate(remote.gameDate),
        players: sanitizePlayers(remote.players ?? []),
        owners: remote.owners ?? {},
        notifications: remote.notifications ?? [],
        notification: remote.notification ?? null,
    };
}

interface GameProviderProps {
    children: ReactNode;
    /** Modo espectador (pantalla de mapa) */
    initialPhase?: GamePhase;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children, initialPhase }) => {
    const multiplayer = useTransport();
    const [state, setState] = useState<GameState>({
        ...initialState,
        gamePhase: initialPhase ?? initialState.gamePhase,
    });
    const [dismissed, setDismissed] = useState<Set<number>>(() => new Set());

    // Recordar (por pestaña) la última notificación cerrada, para que no reaparezcan al recargar.
    const seenKey = multiplayer.gameId ? `atomo_seen_${multiplayer.gameId}` : null;
    const lastSeen = (() => {
        try { return seenKey ? Number(sessionStorage.getItem(seenKey) || 0) : 0; } catch { return 0; }
    })();

    const handleRemoteState = useCallback((remote: any) => {
        if (remote) setState(hydrate(remote));
    }, []);

    useEffect(() => {
        multiplayer.setOnStateReceived(handleRemoteState);
    }, [multiplayer.setOnStateReceived, handleRemoteState]);

    const dismissNotification = useCallback((id: number) => {
        setDismissed(prev => new Set(prev).add(id));
        try { if (seenKey && id > Number(sessionStorage.getItem(seenKey) || 0)) sessionStorage.setItem(seenKey, String(id)); } catch { /* sin storage */ }
    }, [seenKey]);

    const isDismissed = useMemo(() => ({
        has: (id: number) => id <= lastSeen || dismissed.has(id),
    }) as ReadonlySet<number>, [dismissed, lastSeen]);

    return (
        <GameContext.Provider value={{
            state,
            send: multiplayer.sendCommand,
            multiplayer,
            dismissNotification,
            dismissedNotificationIds: isDismissed,
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameContext = (): GameContextValue => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGameContext must be used within a GameProvider');
    return context;
};

export const useGameState = (): GameState => useGameContext().state;

/** El jugador de turno (puede no ser yo). */
export const useCurrentPlayer = (): PlayerData | null => {
    const { state } = useGameContext();
    return state.players[state.currentPlayerIndex] ?? null;
};

export const usePlayer = (index: number): PlayerData | null => useGameContext().state.players[index] ?? null;

export const useMultiplayerContext = () => useGameContext().multiplayer;

export { GameContext };
