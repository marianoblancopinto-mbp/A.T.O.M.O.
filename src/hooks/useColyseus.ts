/**
 * useColyseus — conexión con el servidor autoritativo.
 *
 * El cliente NO elige su identidad: al unirse, el servidor le asigna un asiento
 * (playerId + token secreto). El token se guarda por sala en localStorage y es
 * lo único que permite reconectarse al mismo asiento (recarga, celular que se
 * duerme, red que se cae).
 *
 * El cliente sólo MANDA comandos (intenciones) y RECIBE su vista del estado.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, type Room } from 'colyseus.js';
import type { Command, GameSettings } from '@atomo/shared';

// VITE_SERVER_URL: "ws://localhost:2567", "wss://host" o sólo "host" (se asume wss://).
function resolveServerUrl(): string {
    const raw = (import.meta.env.VITE_SERVER_URL || '').trim();
    if (!raw) return 'ws://localhost:2567';
    if (raw.startsWith('ws://') || raw.startsWith('wss://')) return raw;
    return `wss://${raw}`;
}

const SERVER_URL = resolveServerUrl();
const ROOM_NAME = 'atomo';

export interface LobbyPlayer {
    playerId: string;
    name: string;
    isHost: boolean;
    connected?: boolean;
}

type ConnStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'PLAYING' | 'ERROR';

// ?seat=X separa el almacenamiento para probar varios jugadores en el mismo
// navegador (dos pestañas comparten localStorage). No da ningún privilegio: el
// servidor sigue asignando la identidad.
const SEAT_NS = (() => {
    try { return new URLSearchParams(window.location.search).get('seat') || ''; } catch { return ''; }
})();
const IS_SPECTATOR = typeof window !== 'undefined' && window.location.pathname === '/map';
const key = (k: string) => (SEAT_NS ? `atomo_${SEAT_NS}_${k}` : `atomo_${k}`);

const storage = {
    get(k: string) { try { return localStorage.getItem(key(k)); } catch { return null; } },
    set(k: string, v: string) { try { localStorage.setItem(key(k), v); } catch { /* sin storage */ } },
    del(k: string) { try { localStorage.removeItem(key(k)); } catch { /* sin storage */ } },
};

const saveSession = (roomId: string, name: string) => { storage.set('roomId', roomId); storage.set('playerName', name); };
const clearSession = () => {
    const roomId = storage.get('roomId');
    if (roomId) storage.del(`token_${roomId}`);
    storage.del('roomId');
    storage.del('playerName');
};
const getSession = () => ({ roomId: storage.get('roomId'), playerName: storage.get('playerName') || 'Comandante' });

export const useColyseus = () => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnStatus>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
    const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

    const roomRef = useRef<Room | null>(null);
    const playerIdRef = useRef<string | null>(null);
    const onStateRef = useRef<((state: any) => void) | null>(null);
    const reconnectingRef = useRef(false);
    const intentionalLeaveRef = useRef(false);
    const attemptReconnectRef = useRef<() => void>(() => {});

    const wireRoom = useCallback((room: Room, playerName: string) => {
        roomRef.current = room;
        setGameId(room.roomId);
        saveSession(room.roomId, playerName);

        room.onMessage('seat', (seat: { playerId: string; token: string }) => {
            playerIdRef.current = seat.playerId;
            setPlayerId(seat.playerId);
            storage.set(`token_${room.roomId}`, seat.token);
        });

        room.onMessage('lobby', (payload: { players: LobbyPlayer[]; phase: string; settings?: GameSettings }) => {
            setLobbyPlayers(payload.players || []);
            if (payload.settings) setGameSettings(payload.settings);
            const me = (payload.players || []).find(p => p.playerId === playerIdRef.current);
            setIsHost(!!me?.isHost);
            if (payload.phase === 'playing') setConnectionStatus('PLAYING');
        });

        room.onMessage('state', (state: any) => {
            setConnectionStatus('PLAYING');
            onStateRef.current?.(state);
        });

        room.onMessage('rejected', (payload: { reason?: string }) => {
            console.warn('[useColyseus] Rechazado por el servidor:', payload?.reason);
            setError(payload?.reason ?? 'Acción rechazada por el servidor.');
        });

        room.onError((code: number, message?: string) => {
            console.error('[useColyseus] Error de sala:', code, message);
            setError(message || `Error de conexión (${code})`);
        });

        room.onLeave((code: number) => {
            roomRef.current = null;
            if (intentionalLeaveRef.current) {
                intentionalLeaveRef.current = false;
                return;
            }
            console.warn(`[useColyseus] Conexión perdida (code ${code}); intentando reconectar…`);
            attemptReconnectRef.current();
        });
    }, []);

    const joinRoom = useCallback(async (roomId: string, playerName: string) => {
        const client = new Client(SERVER_URL);
        const token = storage.get(`token_${roomId}`) ?? undefined;
        return client.joinById(roomId, { token, playerName });
    }, []);

    // Volver a la sala guardada con el token del asiento (recarga o conexión caída).
    const attemptReconnect = useCallback(async () => {
        if (reconnectingRef.current) return;
        const { roomId, playerName } = getSession();
        if (!roomId) return;

        reconnectingRef.current = true;
        setConnectionStatus('CONNECTING');
        setError(null);
        // Reintentos con backoff: el servidor free de Render puede tardar en despertar.
        for (let attempt = 0; attempt < 6; attempt++) {
            try {
                const room = await joinRoom(roomId, playerName);
                wireRoom(room, playerName);
                setConnectionStatus('CONNECTED');
                reconnectingRef.current = false;
                return;
            } catch (e) {
                console.warn(`[useColyseus] Reintento de reconexión ${attempt + 1} falló`, e);
                await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            }
        }
        reconnectingRef.current = false;
        clearSession();
        setConnectionStatus('ERROR');
        setError('No se pudo reconectar a la partida (quizás ya terminó).');
    }, [joinRoom, wireRoom]);

    attemptReconnectRef.current = attemptReconnect;

    useEffect(() => {
        const { roomId } = getSession();
        if (!roomId || roomRef.current) return;
        if (IS_SPECTATOR) {
            // Pantalla de mapa (/map): se une SIN token, así el servidor la trata como
            // espectador y sólo le manda la vista pública (sin secretos de nadie).
            new Client(SERVER_URL).joinById(roomId, { playerName: 'Espectador' })
                .then(room => {
                    roomRef.current = room;
                    setGameId(room.roomId);
                    room.onMessage('state', (st: any) => { setConnectionStatus('PLAYING'); onStateRef.current?.(st); });
                    room.onMessage('lobby', () => { /* sin uso en el espectador */ });
                })
                .catch(e => setError(e?.message ?? 'No se pudo conectar como espectador.'));
            return;
        }
        attemptReconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onVisible = () => {
            if (IS_SPECTATOR || document.visibilityState !== 'visible') return;
            const room = roomRef.current;
            const isOpen = !!room && !!(room as any).connection?.isOpen;
            if (!isOpen && getSession().roomId) attemptReconnect();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [attemptReconnect]);

    const createGame = useCallback(async (hostName: string) => {
        setConnectionStatus('CONNECTING');
        setError(null);
        try {
            const client = new Client(SERVER_URL);
            const room = await client.create(ROOM_NAME, { playerName: hostName });
            wireRoom(room, hostName);
            setConnectionStatus('CONNECTED');
            return room.roomId;
        } catch (e: any) {
            console.error('[useColyseus] Error al crear sala:', e);
            setError(e?.message ?? 'Error al crear la partida.');
            setConnectionStatus('ERROR');
            return null;
        }
    }, [wireRoom]);

    const joinGame = useCallback(async (roomId: string, playerName: string) => {
        setConnectionStatus('CONNECTING');
        setError(null);
        try {
            const room = await joinRoom(roomId.trim(), playerName);
            wireRoom(room, playerName);
            setConnectionStatus('CONNECTED');
            return true;
        } catch (e: any) {
            console.error('[useColyseus] Error al unirse:', e);
            setError(e?.message ?? 'No se pudo unir a la partida (¿código correcto?).');
            setConnectionStatus('ERROR');
            return false;
        }
    }, [joinRoom, wireRoom]);

    /** El anfitrión pide arrancar: el servidor genera la partida. */
    const startGame = useCallback(() => {
        roomRef.current?.send('start');
    }, []);

    const updateSettings = useCallback((settings: Partial<GameSettings>) => {
        roomRef.current?.send('settings', settings);
    }, []);

    /** Manda una intención de juego. El resultado llega como un nuevo 'state' (o 'rejected'). */
    const sendCommand = useCallback((command: Command) => {
        setError(null);
        roomRef.current?.send('command', command);
    }, []);

    const leaveGame = useCallback(() => {
        intentionalLeaveRef.current = true;
        clearSession();
        roomRef.current?.leave(true);
    }, []);

    const setOnStateReceived = useCallback((cb: (state: any) => void) => {
        onStateRef.current = cb;
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return {
        gameId,
        playerId,
        isHost,
        connectionStatus,
        error,
        clearError,
        lobbyPlayers,
        gameSettings,
        createGame,
        joinGame,
        startGame,
        updateSettings,
        sendCommand,
        leaveGame,
        setOnStateReceived,
    };
};
