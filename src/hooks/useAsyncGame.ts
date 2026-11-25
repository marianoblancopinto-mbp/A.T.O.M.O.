/**
 * useAsyncGame — transporte de las partidas por CORRESPONDENCIA.
 *
 * Misma interfaz que useColyseus, pero por HTTP: cada jugada es un pedido a
 * /api y la vista se refresca consultando cada cierto tiempo mientras la
 * pestaña está visible. La partida vive en la base de datos, no en el
 * dispositivo: se puede cerrar todo y volver días después.
 *
 * Identidad: el servidor entrega un token por jugador. Se guarda en este
 * dispositivo y además se puede abrir en otro con el "enlace personal"
 * (/?partida=<id>#t=<token>).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Command, GameSettings } from '@atomo/shared';
import type { LobbyPlayer } from './useColyseus';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const POLL_MS = 15_000;

export interface AsyncGameSummary { id: string; name: string; joinedAt: number }

interface View {
    gameId: string;
    phase: 'lobby' | 'playing' | 'finished';
    you: { playerId: string; isHost: boolean };
    lobby: { players: LobbyPlayer[]; settings: GameSettings };
    state: unknown;
    version: number;
}

const store = {
    get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } },
    del: (k: string) => { try { localStorage.removeItem(k); } catch { /* sin storage */ } },
};
const tokenKey = (id: string) => `atomo_async_token_${id}`;

export function listSavedGames(): AsyncGameSummary[] {
    try { return JSON.parse(store.get('atomo_async_games') || '[]'); } catch { return []; }
}
function rememberGame(id: string, name: string) {
    const games = listSavedGames().filter(g => g.id !== id);
    store.set('atomo_async_games', JSON.stringify([{ id, name, joinedAt: Date.now() }, ...games].slice(0, 20)));
}
function forgetGame(id: string) {
    store.set('atomo_async_games', JSON.stringify(listSavedGames().filter(g => g.id !== id)));
    store.del(tokenKey(id));
}

/** Toma el enlace personal (?partida=…#t=…) si viene en la URL y lo guarda. */
function consumePersonalLink(): string | null {
    try {
        const url = new URL(window.location.href);
        const id = url.searchParams.get('partida');
        const token = new URLSearchParams(url.hash.slice(1)).get('t');
        if (id && token) {
            store.set(tokenKey(id), token);
            rememberGame(id, 'Partida');
            url.searchParams.delete('partida');
            url.hash = '';
            window.history.replaceState(null, '', url.toString());
            return id;
        }
    } catch { /* URL inválida */ }
    return null;
}

async function call(path: string, init: { method?: string; token?: string | null; body?: unknown } = {}) {
    const res = await fetch(`${API}${path}`, {
        method: init.method ?? 'GET',
        headers: {
            ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `Error ${res.status}`), { status: res.status });
    return data;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const errStatus = (e: unknown) => (e as { status?: number })?.status;

export const isAsyncGameId = (code: string) => /^c[a-z0-9]{6,20}$/.test(code.trim());

export const useAsyncGame = () => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [view, setView] = useState<View | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'PLAYING' | 'ERROR'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const onStateRef = useRef<((state: unknown) => void) | null>(null);
    const versionRef = useRef(-1);
    const tokenRef = useRef<string | null>(null);

    const apply = useCallback((v: View) => {
        setView(v);
        setGameId(v.gameId);
        setStatus(v.phase === 'lobby' ? 'CONNECTED' : 'PLAYING');
        if (v.state && v.version !== versionRef.current) {
            versionRef.current = v.version;
            onStateRef.current?.(v.state);
        }
    }, []);

    const open = useCallback(async (id: string) => {
        const token = store.get(tokenKey(id));
        if (!token) return false;
        tokenRef.current = token;
        setStatus('CONNECTING');
        try {
            apply(await call(`/games/${id}`, { token }));
            store.set('atomo_async_current', id);
            return true;
        } catch (e) {
            setError(errMsg(e));
            setStatus('ERROR');
            if (errStatus(e) === 403 || errStatus(e) === 404) { forgetGame(id); store.del('atomo_async_current'); }
            return false;
        }
    }, [apply]);

    // Al montar: enlace personal o partida en curso de este dispositivo.
    useEffect(() => {
        const fromLink = consumePersonalLink();
        const id = fromLink ?? store.get('atomo_async_current');
        // Diferido: no actualizar estado sincrónicamente dentro del efecto.
        if (id) queueMicrotask(() => { void open(id); });
    }, [open]);

    // Refresco periódico mientras la pestaña está visible.
    useEffect(() => {
        if (!gameId) return;
        const refresh = () => {
            if (document.visibilityState !== 'visible' || !tokenRef.current) return;
            call(`/games/${gameId}`, { token: tokenRef.current }).then(apply).catch(() => { /* se reintenta en el próximo ciclo */ });
        };
        const timer = setInterval(refresh, POLL_MS);
        document.addEventListener('visibilitychange', refresh);
        return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
    }, [gameId, apply]);

    const enter = useCallback((token: string, v: View, name: string) => {
        tokenRef.current = token;
        store.set(tokenKey(v.gameId), token);
        store.set('atomo_async_current', v.gameId);
        rememberGame(v.gameId, name);
        apply(v);
    }, [apply]);

    const createGame = useCallback(async (name: string, settings?: Partial<GameSettings>) => {
        setStatus('CONNECTING'); setError(null);
        try {
            const { token, view: v } = await call('/games', { method: 'POST', body: { name, settings } });
            enter(token, v, `Partida de ${name}`);
            return v.gameId as string;
        } catch (e) { setError(errMsg(e)); setStatus('ERROR'); return null; }
    }, [enter]);

    const joinGame = useCallback(async (id: string, name: string) => {
        id = id.trim();
        if (store.get(tokenKey(id))) return open(id); // ya tengo asiento en esa partida
        setStatus('CONNECTING'); setError(null);
        try {
            const { token, view: v } = await call(`/games/${id}/join`, { method: 'POST', body: { name } });
            enter(token, v, `Partida ${id}`);
            return true;
        } catch (e) { setError(errMsg(e)); setStatus('ERROR'); return false; }
    }, [enter, open]);

    const post = useCallback(async (action: string, body: unknown) => {
        if (!gameId || !tokenRef.current) return;
        setError(null);
        try { apply(await call(`/games/${gameId}/${action}`, { method: 'POST', token: tokenRef.current, body })); }
        catch (e) { setError(errMsg(e)); }
    }, [gameId, apply]);

    const startGame = useCallback(() => { void post('start', {}); }, [post]);
    const updateSettings = useCallback((settings: Partial<GameSettings>) => { void post('settings', { settings }); }, [post]);
    const sendCommand = useCallback((command: Command) => { void post('command', { command }); }, [post]);

    const leaveGame = useCallback(() => {
        store.del('atomo_async_current');
        setGameId(null); setView(null); setStatus('IDLE'); versionRef.current = -1; tokenRef.current = null;
    }, []);

    const personalLink = useCallback(() => {
        if (!gameId || !tokenRef.current) return null;
        return `${window.location.origin}/?partida=${gameId}#t=${tokenRef.current}`;
    }, [gameId]);

    return {
        mode: 'async' as const,
        gameId,
        playerId: view?.you.playerId ?? null,
        isHost: !!view?.you.isHost,
        connectionStatus: status,
        error,
        clearError: useCallback(() => setError(null), []),
        lobbyPlayers: view?.lobby.players ?? [],
        gameSettings: view?.lobby.settings ?? null,
        createGame,
        joinGame,
        openGame: open,
        startGame,
        updateSettings,
        sendCommand,
        leaveGame,
        personalLink,
        setOnStateReceived: useCallback((cb: (state: unknown) => void) => { onStateRef.current = cb; }, []),
    };
};
