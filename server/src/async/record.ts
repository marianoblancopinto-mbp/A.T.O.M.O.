/**
 * Registro persistido de una partida por correspondencia: lo que se guarda en
 * la base. El estado de juego se guarda COMPLETO (con secretos); sólo sale de
 * acá proyectado para cada jugador.
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { toGameDate, initialState, type GameSettings, type GameState } from '@atomo/shared';

export interface AsyncSeat {
    playerId: string;
    name: string;
    /** sha256 del token. El token en sí sólo lo conoce el jugador. */
    tokenHash: string;
}

export interface AsyncGameRecord {
    id: string;
    phase: 'lobby' | 'playing' | 'finished';
    seats: AsyncSeat[];
    hostId: string;
    settings: GameSettings;
    /** GameState serializado (gameDate como número). null en el lobby. */
    state: unknown | null;
    createdAt: number;
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(24).toString('base64url');
export const newPlayerId = () => randomUUID();

/** Id corto y legible; empieza con "c" (correspondencia) para distinguirlo de las salas en vivo. */
export function newGameId(): string {
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    const bytes = randomBytes(8);
    return 'c' + Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export function serializeState(state: GameState): unknown {
    return { ...state, gameDate: state.gameDate.getTime() };
}

export function deserializeState(raw: unknown): GameState {
    const s = raw as GameState & { gameDate: unknown };
    return { ...initialState, ...s, gameDate: toGameDate(s.gameDate) };
}
