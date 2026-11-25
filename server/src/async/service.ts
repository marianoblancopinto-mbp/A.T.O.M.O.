/**
 * Servicio de partidas por correspondencia. Independiente del transporte: lo
 * usan la función de Vercel y el servidor local de desarrollo.
 *
 * Cada operación: carga la partida, identifica al jugador por su token,
 * aplica los plazos vencidos, ejecuta y guarda con control de versión.
 */

import {
    createGame, executeCommand, projectFor, applyDeadlines, sanitizeSettings, rollProxyWarCountry,
    DEFAULT_SETTINGS, MAX_PLAYERS, MIN_PLAYERS, type GameSettings, type GameState,
} from '@atomo/shared';
import type { GameStore, StoredGame } from './store';
import {
    hashToken, newToken, newPlayerId, newGameId, serializeState, deserializeState,
    type AsyncGameRecord, type AsyncSeat,
} from './record';

export class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
}

export interface Clock { now(): number; random(): number }
export const systemClock: Clock = { now: () => Date.now(), random: Math.random };

export interface GameView {
    gameId: string;
    phase: AsyncGameRecord['phase'];
    you: { playerId: string; isHost: boolean };
    lobby: { players: { playerId: string; name: string; isHost: boolean }[]; settings: GameSettings };
    /** Vista proyectada para este jugador (gameDate en epoch ms). null en el lobby. */
    state: unknown | null;
    version: number;
}

const cleanName = (v: unknown) =>
    (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 24) : '') || 'Comandante';

const MAX_RETRIES = 4;

export class AsyncGameService {
    constructor(private store: GameStore, private clock: Clock = systemClock) {}

    // ------------------------------------------------------------ helpers

    private async load(id: unknown): Promise<StoredGame> {
        if (typeof id !== 'string' || !/^c[a-z0-9]{6,20}$/.test(id)) throw new ApiError(404, 'Partida inexistente.');
        const found = await this.store.get(id);
        if (!found) throw new ApiError(404, 'Partida inexistente.');
        return found;
    }

    private seatFor(record: AsyncGameRecord, token: unknown): AsyncSeat {
        if (typeof token !== 'string' || token.length < 16) throw new ApiError(401, 'Falta tu credencial de jugador.');
        const h = hashToken(token);
        const seat = record.seats.find(s => s.tokenHash === h);
        if (!seat) throw new ApiError(403, 'Credencial inválida para esta partida.');
        return seat;
    }

    private view(record: AsyncGameRecord, seat: AsyncSeat, version: number): GameView {
        const state = record.state ? deserializeState(record.state) : null;
        const projected = state ? projectFor(state, seat.playerId) : null;
        return {
            gameId: record.id,
            phase: record.phase,
            you: { playerId: seat.playerId, isHost: seat.playerId === record.hostId },
            lobby: {
                players: record.seats.map(s => ({ playerId: s.playerId, name: s.name, isHost: s.playerId === record.hostId })),
                settings: record.settings,
            },
            state: projected ? serializeState(projected) : null,
            version,
        };
    }

    /**
     * Lee-modifica-escribe con reintento: si otro pedido guardó en el medio,
     * vuelve a cargar y reaplica `mutate` sobre el estado nuevo.
     */
    private async mutate(id: string, mutate: (r: AsyncGameRecord) => AsyncGameRecord | null): Promise<{ record: AsyncGameRecord; version: number }> {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const { record, version } = await this.load(id);
            const next = mutate(structuredClone(record));
            if (!next) return { record, version };
            if (await this.store.update(next, version)) return { record: next, version: version + 1 };
        }
        throw new ApiError(409, 'La partida está muy concurrida: probá de nuevo.');
    }

    /** Aplica plazos vencidos al registro (no guarda). null si no cambió nada. */
    private withDeadlines(record: AsyncGameRecord): AsyncGameRecord | null {
        if (record.phase !== 'playing' || !record.state) return null;
        const state = deserializeState(record.state);
        const next = applyDeadlines(state, this.clock.now(), this.clock.random);
        if (next === state) return null;
        return { ...record, state: serializeState(next), phase: next.winner || next.gameOver ? 'finished' : 'playing' };
    }

    // ------------------------------------------------------------ operaciones

    async create(name: unknown, settings: unknown) {
        const playerId = newPlayerId();
        const token = newToken();
        const base: GameSettings = { ...DEFAULT_SETTINGS, pace: 'async', proxyWarCountry: rollProxyWarCountry(this.clock.random) };
        const record: AsyncGameRecord = {
            id: newGameId(),
            phase: 'lobby',
            seats: [{ playerId, name: cleanName(name), tokenHash: hashToken(token) }],
            hostId: playerId,
            settings: { ...sanitizeSettings(settings, base), pace: 'async' },
            state: null,
            createdAt: this.clock.now(),
        };
        await this.store.insert(record);
        return { token, view: this.view(record, record.seats[0], 1) };
    }

    async join(id: string, name: unknown) {
        const token = newToken();
        const playerId = newPlayerId();
        const { record, version } = await this.mutate(id, r => {
            if (r.phase !== 'lobby') throw new ApiError(409, 'La partida ya empezó.');
            if (r.seats.length >= MAX_PLAYERS) throw new ApiError(409, 'La partida está completa.');
            r.seats.push({ playerId, name: cleanName(name), tokenHash: hashToken(token) });
            return r;
        });
        return { token, view: this.view(record, record.seats.find(s => s.playerId === playerId)!, version) };
    }

    async get(id: string, token: unknown) {
        const loaded = await this.load(id);
        const seat = this.seatFor(loaded.record, token);
        // Al consultar se aplican los plazos vencidos (y se guardan para todos).
        const { record, version } = this.withDeadlines(loaded.record)
            ? await this.mutate(id, r => this.withDeadlines(r))
            : loaded;
        return this.view(record, seat, version);
    }

    async updateSettings(id: string, token: unknown, settings: unknown) {
        let seat!: AsyncSeat;
        const { record, version } = await this.mutate(id, r => {
            seat = this.seatFor(r, token);
            if (seat.playerId !== r.hostId) throw new ApiError(403, 'Sólo el anfitrión puede cambiar la configuración.');
            if (r.phase !== 'lobby') throw new ApiError(409, 'La partida ya empezó.');
            r.settings = { ...sanitizeSettings(settings, r.settings), pace: 'async' };
            return r;
        });
        return this.view(record, seat, version);
    }

    async start(id: string, token: unknown) {
        let seat!: AsyncSeat;
        const { record, version } = await this.mutate(id, r => {
            seat = this.seatFor(r, token);
            if (seat.playerId !== r.hostId) throw new ApiError(403, 'Sólo el anfitrión puede iniciar la partida.');
            if (r.phase !== 'lobby') throw new ApiError(409, 'La partida ya empezó.');
            if (r.seats.length < MIN_PLAYERS) throw new ApiError(409, `Se necesitan al menos ${MIN_PLAYERS} jugadores.`);
            const state: GameState = createGame(r.seats.map(s => ({ playerId: s.playerId, name: s.name })), r.hostId, r.settings, this.clock.random, this.clock.now());
            return { ...r, phase: 'playing', state: serializeState(state) };
        });
        return this.view(record, seat, version);
    }

    async command(id: string, token: unknown, command: unknown) {
        let seat!: AsyncSeat;
        const { record, version } = await this.mutate(id, r => {
            seat = this.seatFor(r, token);
            if (r.phase === 'lobby' || !r.state) throw new ApiError(409, 'La partida no empezó.');
            const result = executeCommand(deserializeState(r.state), seat.playerId, command, { random: this.clock.random, now: this.clock.now() });
            if (!result.ok) throw new ApiError(422, result.reason);
            return { ...r, state: serializeState(result.state), phase: result.state.winner || result.state.gameOver ? 'finished' : 'playing' };
        });
        return this.view(record, seat, version);
    }
}
