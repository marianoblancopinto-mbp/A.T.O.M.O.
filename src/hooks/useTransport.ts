/**
 * Elige el transporte según el tipo de partida:
 *  - en vivo        → Colyseus (WebSockets, todos conectados a la vez).
 *  - correspondencia → HTTP + base de datos (cada uno juega cuando puede).
 * La UI sólo ve esta interfaz común.
 */

import { useCallback, useState } from 'react';
import type { GameSettings } from '@atomo/shared';
import { useColyseus } from './useColyseus';
import { useAsyncGame, isAsyncGameId } from './useAsyncGame';

export type GamePace = 'live' | 'async';

export const useTransport = () => {
    const live = useColyseus();
    const corr = useAsyncGame();
    const [chosen, setChosen] = useState<GamePace>('live');

    const active = corr.gameId ? corr : live.gameId ? live : chosen === 'async' ? corr : live;
    const pace: GamePace = active === corr ? 'async' : 'live';

    const createGame = useCallback(async (name: string, mode: GamePace = 'live', settings?: Partial<GameSettings>) => {
        setChosen(mode);
        return mode === 'async' ? corr.createGame(name, settings) : live.createGame(name);
    }, [corr, live]);

    const joinGame = useCallback(async (code: string, name: string) => {
        const mode: GamePace = isAsyncGameId(code) ? 'async' : 'live';
        setChosen(mode);
        return mode === 'async' ? corr.joinGame(code, name) : live.joinGame(code, name);
    }, [corr, live]);

    const { setOnStateReceived: setLive } = live;
    const { setOnStateReceived: setCorr } = corr;
    const setOnStateReceived = useCallback((cb: (state: unknown) => void) => { setLive(cb); setCorr(cb); }, [setLive, setCorr]);

    return {
        pace,
        gameId: active.gameId,
        playerId: active.playerId,
        isHost: active.isHost,
        connectionStatus: active.connectionStatus,
        error: active.error,
        clearError: active.clearError,
        lobbyPlayers: active.lobbyPlayers,
        gameSettings: active.gameSettings,
        createGame,
        joinGame,
        openSavedGame: corr.openGame,
        startGame: active.startGame,
        updateSettings: active.updateSettings,
        sendCommand: active.sendCommand,
        leaveGame: active.leaveGame,
        personalLink: pace === 'async' ? corr.personalLink : () => null,
        setOnStateReceived,
    };
};
