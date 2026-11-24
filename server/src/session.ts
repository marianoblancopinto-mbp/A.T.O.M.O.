/**
 * GameSession — una partida del lado del servidor, SIN depender del transporte.
 *
 * Maneja asientos (identidad), lobby, ajustes, inicio y comandos. GameRoom
 * (Colyseus) es sólo un adaptador fino sobre esta clase; si el día de mañana el
 * transporte cambia (otro hosting, HTTP + realtime administrado), esta lógica
 * se reutiliza tal cual.
 *
 * Identidad: el servidor genera el playerId y un token secreto por asiento. El
 * cliente sólo guarda el token para reconectarse; nunca elige su playerId, así
 * que no puede hacerse pasar por otro jugador.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import {
    createGame, executeCommand, projectFor, needsAiMove, aiMove, reconcile, sanitizeSettings,
    rollProxyWarCountry, DEFAULT_SETTINGS, MAX_PLAYERS, MIN_PLAYERS,
    type GameState, type GameSettings, type Random,
} from '@atomo/shared';

export interface Seat {
    playerId: string;
    token: string;
    name: string;
    connected: boolean;
}

export interface LobbyView {
    players: { playerId: string; name: string; isHost: boolean; connected: boolean }[];
    phase: 'lobby' | 'playing';
    settings: GameSettings;
}

export type JoinResult =
    | { kind: 'seat'; seat: Seat; reconnected: boolean }
    | { kind: 'spectator' }
    | { kind: 'rejected'; reason: string };

const cleanName = (v: unknown) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 24) : '') || 'Comandante';

export class GameSession {
    private seats: Seat[] = [];
    private hostId: string | null = null;
    private settings: GameSettings;
    phase: 'lobby' | 'playing' = 'lobby';
    state: GameState | null = null;

    constructor(private random: Random = Math.random) {
        this.settings = { ...DEFAULT_SETTINGS, proxyWarCountry: rollProxyWarCountry(random) };
    }

    // ------------------------------------------------------------------ asientos

    join(token: unknown, name: unknown): JoinResult {
        const known = typeof token === 'string' ? this.seats.find(s => s.token === token) : undefined;
        if (known) {
            known.connected = true;
            if (this.phase === 'lobby' && name) known.name = cleanName(name);
            return { kind: 'seat', seat: known, reconnected: true };
        }
        if (this.phase === 'playing') return { kind: 'spectator' };
        if (this.seats.length >= MAX_PLAYERS) return { kind: 'rejected', reason: 'La sala está llena.' };

        const seat: Seat = { playerId: randomUUID(), token: randomBytes(24).toString('hex'), name: cleanName(name), connected: true };
        this.seats.push(seat);
        this.hostId ??= seat.playerId;
        return { kind: 'seat', seat, reconnected: false };
    }

    /** Desconexión. En el lobby libera el asiento; en partida lo conserva para reconectar. */
    leave(playerId: string) {
        const seat = this.seats.find(s => s.playerId === playerId);
        if (!seat) return;
        if (this.phase === 'lobby') {
            this.seats = this.seats.filter(s => s !== seat);
            if (this.hostId === playerId) this.hostId = this.seats[0]?.playerId ?? null;
        } else {
            seat.connected = false;
        }
    }

    isHost(playerId: string | null) {
        return !!playerId && playerId === this.hostId;
    }

    lobbyView(): LobbyView {
        return {
            players: this.seats.map(s => ({ playerId: s.playerId, name: s.name, isHost: s.playerId === this.hostId, connected: s.connected })),
            phase: this.phase,
            settings: this.settings,
        };
    }

    // ------------------------------------------------------------------ lobby

    updateSettings(playerId: string, input: unknown): string | null {
        if (!this.isHost(playerId)) return 'Sólo el anfitrión puede cambiar la configuración.';
        if (this.phase !== 'lobby') return 'La partida ya empezó.';
        this.settings = sanitizeSettings(input, this.settings);
        return null;
    }

    start(playerId: string): string | null {
        if (!this.isHost(playerId)) return 'Sólo el anfitrión puede iniciar la partida.';
        if (this.phase !== 'lobby') return 'La partida ya empezó.';
        if (this.seats.length < MIN_PLAYERS) return `Se necesitan al menos ${MIN_PLAYERS} jugadores.`;
        this.state = createGame(this.seats.map(s => ({ playerId: s.playerId, name: s.name })), this.hostId!, this.settings, this.random);
        this.phase = 'playing';
        return null;
    }

    // ------------------------------------------------------------------ partida

    command(playerId: string, command: unknown): string | null {
        if (!this.state || this.phase !== 'playing') return 'La partida no empezó.';
        const result = executeCommand(this.state, playerId, command, { random: this.random, now: Date.now() });
        if (!result.ok) return result.reason;
        this.state = result.state;
        return null;
    }

    needsAiMove(): boolean {
        return !!this.state && needsAiMove(this.state);
    }

    runAiMove() {
        if (!this.state || !needsAiMove(this.state)) return;
        this.state = reconcile(this.state, aiMove(this.state));
    }

    /** Estado listo para enviar a `playerId` (null = espectador). */
    viewFor(playerId: string | null) {
        if (!this.state) return null;
        const view = projectFor(this.state, playerId);
        return { ...view, gameDate: view.gameDate.getTime() };
    }
}
