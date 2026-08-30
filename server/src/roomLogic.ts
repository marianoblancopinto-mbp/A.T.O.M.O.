/**
 * Lógica pura del servidor autoritativo, separada de Colyseus para testearla.
 *
 * La autoridad de JUEGO vive en @atomo/shared (`applyIntent` valida turno + reglas
 * y corre el reducer). Acá se re-exporta y se agrega la lógica de LOBBY (previa a
 * la partida) y helpers del servidor.
 */

import { initialState, applyIntent, sanitizePlayers, type GameState } from '@atomo/shared';

export { applyIntent };

export function createInitialState(): GameState {
    return initialState;
}

/**
 * Snapshot serializable para enviar por la red (Date -> timestamp).
 */
export function toWire(state: GameState) {
    return { ...state, gameDate: state.gameDate.getTime() };
}

/**
 * Coacciona un valor de fecha recibido por la red a un Date válido.
 * OJO: msgpack (Colyseus) codifica los enteros grandes como BigInt, y
 * `new Date(bigint)` lanza excepción — por eso se pasa por Number() primero.
 */
function toGameDate(v: any): Date {
    const fallback = new Date(2100, 0, 1);
    if (v == null) return fallback;
    if (v instanceof Date) return v;
    const n = Number(v); // BigInt o number -> number
    if (Number.isFinite(n) && n > 0) return new Date(n);
    const d = new Date(v); // último intento: string ISO
    return Number.isNaN(d.getTime()) ? fallback : d;
}

/**
 * Rehidrata un estado inicial recibido del anfitrión a un GameState completo y
 * saneado, listo para ser autoritativo.
 */
export function adoptInitialState(payload: any): GameState {
    return {
        ...initialState,
        ...payload,
        gameStarted: true,
        gamePhase: 'playing',
        players: sanitizePlayers(payload?.players ?? []),
        owners: payload?.owners ?? {},
        gameDate: toGameDate(payload?.gameDate),
    };
}

// ============================================================================
// Lobby (previo a la partida)
// ============================================================================

export interface LobbyPlayer {
    playerId: string | number;
    name: string;
    isHost: boolean;
}

/**
 * Agrega (o actualiza) un jugador al lobby. El primero en entrar es el anfitrión.
 */
export function addLobbyPlayer(
    players: LobbyPlayer[],
    playerId: string | number,
    name: string
): LobbyPlayer[] {
    const exists = players.some(p => String(p.playerId) === String(playerId));
    if (exists) {
        return players.map(p =>
            String(p.playerId) === String(playerId) ? { ...p, name } : p
        );
    }
    return [...players, { playerId, name, isHost: players.length === 0 }];
}

/**
 * Quita un jugador del lobby. Si se va el anfitrión, promueve al primero que quede.
 */
export function removeLobbyPlayer(
    players: LobbyPlayer[],
    playerId: string | number
): LobbyPlayer[] {
    const remaining = players.filter(p => String(p.playerId) !== String(playerId));
    if (remaining.length > 0 && !remaining.some(p => p.isHost)) {
        remaining[0] = { ...remaining[0], isHost: true };
    }
    return remaining;
}

export function isHost(players: LobbyPlayer[], playerId: string | number): boolean {
    return players.some(p => String(p.playerId) === String(playerId) && p.isHost);
}
