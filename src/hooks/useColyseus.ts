/**
 * useColyseus — cliente del servidor autoritativo (reemplaza useMultiplayer/Supabase).
 *
 * Conecta a la sala Colyseus, maneja el lobby, el juego y la RECONEXIÓN:
 *  - createGame / joinGame: crea o se une a una sala (matchmaking de Colyseus).
 *  - startGame(initialState): el anfitrión manda el estado inicial que generó.
 *  - sendAction(action): manda un Intent { kind: 'ACTION', action } al servidor.
 *  - setOnStateReceived(cb): se llama con cada estado autoritativo difundido.
 *
 * Reconexión (Fase 4): se guarda la sala actual en localStorage. Si se recarga la
 * página o se pierde la conexión (celular que se apaga/duerme), el cliente se
 * re-une solo a la misma sala con su playerId; el servidor le reenvía el estado
 * actual (incluida una batalla en curso), así no queda en limbo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, type Room } from 'colyseus.js';
import type { GameAction } from '@atomo/shared';

// Resuelve la URL del servidor. VITE_SERVER_URL puede ser:
//  - una URL completa: "ws://localhost:2567" o "wss://atomo-server.onrender.com"
//  - sólo un host: "atomo-server.onrender.com" -> se asume "wss://" (producción)
//  - vacío -> localhost para desarrollo.
function resolveServerUrl(): string {
    const raw = (import.meta.env.VITE_SERVER_URL || '').trim();
    if (!raw) return 'ws://localhost:2567';
    if (raw.startsWith('ws://') || raw.startsWith('wss://')) return raw;
    return `wss://${raw}`;
}

const SERVER_URL = resolveServerUrl();
const ROOM_NAME = 'atomo';

export interface LobbyPlayer {
    playerId: string | number;
    name: string;
    isHost: boolean;
}

type ConnStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'PLAYING' | 'ERROR';

// playerId persistente por dispositivo (para reconexión).
function getOrCreatePlayerId(): string {
    try {
        // Override por URL (?player=X o ?p=X) para testear VARIOS jugadores en el
        // mismo navegador (dos pestañas comparten localStorage). En producción no
        // se usa: cada dispositivo tiene su propio id persistente.
        const override = new URLSearchParams(window.location.search).get('player')
            || new URLSearchParams(window.location.search).get('p');
        if (override) return override;

        let id = localStorage.getItem('atomo_playerId');
        if (!id) {
            id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem('atomo_playerId', id);
        }
        return id;
    } catch {
        return `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
}

// --- Sesión (para reconexión): recordar en qué sala estábamos ---
function saveSession(roomId: string, playerName: string) {
    try {
        localStorage.setItem('atomo_roomId', roomId);
        localStorage.setItem('atomo_playerName', playerName);
    } catch { /* ignore */ }
}
function clearSession() {
    try {
        localStorage.removeItem('atomo_roomId');
        localStorage.removeItem('atomo_playerName');
    } catch { /* ignore */ }
}
function getSession(): { roomId: string | null; playerName: string } {
    try {
        return {
            roomId: localStorage.getItem('atomo_roomId'),
            playerName: localStorage.getItem('atomo_playerName') || 'Comandante',
        };
    } catch {
        return { roomId: null, playerName: 'Comandante' };
    }
}

export const useColyseus = () => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [playerId] = useState<string>(getOrCreatePlayerId);
    const [isHost, setIsHost] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnStatus>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
    const [gameSettings, setGameSettings] = useState<any>({});

    const roomRef = useRef<Room | null>(null);
    const onStateRef = useRef<((state: any) => void) | null>(null);
    const reconnectingRef = useRef(false);
    const intentionalLeaveRef = useRef(false);

    // attemptReconnect se define abajo pero wireRoom lo necesita en onLeave.
    const attemptReconnectRef = useRef<() => void>(() => {});

    const wireRoom = useCallback((room: Room, playerName: string) => {
        roomRef.current = room;
        setGameId(room.roomId);
        saveSession(room.roomId, playerName);

        room.onMessage('lobby', (payload: { players: LobbyPlayer[]; phase: string; settings?: any }) => {
            setLobbyPlayers(payload.players || []);
            if (payload.settings) setGameSettings(payload.settings);
            const me = (payload.players || []).find(p => String(p.playerId) === String(playerId));
            setIsHost(!!me?.isHost);
            if (payload.phase === 'playing') setConnectionStatus('PLAYING');
        });

        room.onMessage('state', (state: any) => {
            setConnectionStatus('PLAYING');
            onStateRef.current?.(state);
        });

        room.onMessage('rejected', (payload: { reason?: string }) => {
            console.warn('[useColyseus] Intent rechazado:', payload?.reason);
            setError(payload?.reason ?? 'Acción rechazada por el servidor.');
        });

        room.onError((code: number, message?: string) => {
            console.error('[useColyseus] Error de sala:', code, message);
            setError(message || `Error de conexión (${code})`);
        });

        // Conexión perdida: si no fue una salida intencional, reconectar.
        room.onLeave((code: number) => {
            roomRef.current = null;
            if (intentionalLeaveRef.current) {
                intentionalLeaveRef.current = false;
                return;
            }
            console.warn(`[useColyseus] Conexión perdida (code ${code}); intentando reconectar…`);
            attemptReconnectRef.current();
        });
    }, [playerId]);

    // Re-unirse a la sala guardada (recarga de página o conexión caída).
    const attemptReconnect = useCallback(async () => {
        if (reconnectingRef.current) return;
        const { roomId, playerName } = getSession();
        if (!roomId) return;

        reconnectingRef.current = true;
        setConnectionStatus('CONNECTING');
        setError(null);

        // Reintentos con backoff: el server free de Render puede tardar en despertar.
        for (let attempt = 0; attempt < 6; attempt++) {
            try {
                const client = new Client(SERVER_URL);
                const room = await client.joinById(roomId, { playerId, playerName });
                wireRoom(room, playerName);
                setConnectionStatus('CONNECTED');
                reconnectingRef.current = false;
                console.log('[useColyseus] Reconectado a la sala', roomId);
                return;
            } catch (e) {
                console.warn(`[useColyseus] Reintento de reconexión ${attempt + 1} falló`, e);
                await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            }
        }

        // No se pudo reconectar: la sala ya no existe. Volver al lobby.
        reconnectingRef.current = false;
        clearSession();
        setConnectionStatus('ERROR');
        setError('No se pudo reconectar a la partida (quizás ya terminó).');
    }, [playerId, wireRoom]);

    attemptReconnectRef.current = attemptReconnect;

    // Al montar: si había una sala guardada, re-unirse (caso recarga de página).
    useEffect(() => {
        const { roomId } = getSession();
        if (roomId && !roomRef.current) {
            attemptReconnect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Al volver a primer plano (celular que despierta): si la conexión murió, reconectar.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            const room = roomRef.current;
            const isOpen = !!room && !!(room as any).connection?.isOpen;
            const { roomId } = getSession();
            if (!isOpen && roomId) attemptReconnect();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [attemptReconnect]);

    const createGame = useCallback(async (hostName: string) => {
        setConnectionStatus('CONNECTING');
        setError(null);
        try {
            const client = new Client(SERVER_URL);
            // El anfitrión genera el País de la Guerra Proxy (lore) para el lobby.
            const { getProxyWarCountry } = await import('../data/missionData');
            const proxy = getProxyWarCountry();
            const settings = { proxyWarCountry: proxy?.title ?? 'País Desconocido' };
            const room = await client.create(ROOM_NAME, { playerId, playerName: hostName, settings });
            wireRoom(room, hostName);
            setGameSettings(settings);
            setIsHost(true);
            setConnectionStatus('CONNECTED');
            return room.roomId;
        } catch (e: any) {
            console.error('[useColyseus] Error al crear sala:', e);
            setError(e?.message ?? 'Error al crear la partida.');
            setConnectionStatus('ERROR');
            return null;
        }
    }, [playerId, wireRoom]);

    const joinGame = useCallback(async (roomId: string, playerName: string) => {
        setConnectionStatus('CONNECTING');
        setError(null);
        try {
            const client = new Client(SERVER_URL);
            const room = await client.joinById(roomId.trim(), { playerId, playerName });
            wireRoom(room, playerName);
            setConnectionStatus('CONNECTED');
            return true;
        } catch (e: any) {
            console.error('[useColyseus] Error al unirse:', e);
            setError(e?.message ?? 'No se pudo unir a la partida (¿código correcto?).');
            setConnectionStatus('ERROR');
            return false;
        }
    }, [playerId, wireRoom]);

    // El anfitrión inicia la partida mandando el estado inicial que generó localmente.
    const startGame = useCallback(async (initialState: any) => {
        // gameDate va como timestamp (número) para no mandar un Date por msgpack.
        const wire = (initialState && initialState.gameDate instanceof Date)
            ? { ...initialState, gameDate: initialState.gameDate.getTime() }
            : initialState;
        roomRef.current?.send('start', { state: wire });
    }, []);

    // Envía una acción (ya serializable) como Intent al servidor autoritativo.
    const sendAction = useCallback((action: GameAction) => {
        roomRef.current?.send('intent', { kind: 'ACTION', action });
    }, []);

    const setOnStateReceived = useCallback((cb: (state: any) => void) => {
        onStateRef.current = cb;
    }, []);

    return {
        gameId,
        playerId,
        isHost,
        connectionStatus,
        error,
        lobbyPlayers,
        gameSettings,
        createGame,
        joinGame,
        startGame,
        sendAction,
        setOnStateReceived,
    };
};
