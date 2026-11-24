/**
 * GameRoom — adaptador Colyseus de GameSession.
 *
 * Protocolo (cliente → servidor):
 *   join options { token?, playerName }   reconectar con el token guardado o tomar asiento nuevo
 *   'settings'  { ...GameSettings }        sólo anfitrión, en el lobby
 *   'start'                                sólo anfitrión
 *   'command'   Command                    una intención de juego (ver engine/commands)
 *
 * Servidor → cliente:
 *   'seat'      { playerId, token }        PRIVADO: identidad asignada por el servidor
 *   'lobby'     LobbyView                  a todos
 *   'state'     vista proyectada           a CADA cliente la suya (nunca el estado completo)
 *   'rejected'  { reason }                 sólo a quien mandó algo inválido
 */

import colyseus, { type Client } from 'colyseus';
import { GameSession } from './session';

const { Room } = colyseus;

const AI_DELAY_MS = 1200;
const RECONNECT_SECONDS = 60;
// Límite simple de mensajes por conexión (protege al servidor de clientes rotos o abusivos).
const RATE_WINDOW_MS = 1000;
const RATE_MAX = 25;

export class GameRoom extends Room {
    private session = new GameSession();
    private playerBySession = new Map<string, string | null>(); // sessionId -> playerId (null = espectador)
    private rate = new Map<string, { start: number; count: number }>();
    private aiTimer: { clear(): void } | null = null;

    onCreate() {
        this.maxClients = 16;
        console.log(`[GameRoom] Sala creada: ${this.roomId}`);

        this.onMessage('settings', (client: Client, payload: unknown) => this.guard(client, playerId => {
            const err = this.session.updateSettings(playerId, payload);
            if (err) return this.reject(client, err);
            this.broadcastLobby();
        }));

        this.onMessage('start', (client: Client) => this.guard(client, playerId => {
            const err = this.session.start(playerId);
            if (err) return this.reject(client, err);
            this.lock();
            console.log(`[GameRoom] Partida iniciada en ${this.roomId}`);
            this.broadcastLobby();
            this.broadcastState();
        }));

        this.onMessage('command', (client: Client, command: unknown) => this.guard(client, playerId => {
            const err = this.session.command(playerId, command);
            if (err) return this.reject(client, err);
            this.broadcastState();
            this.scheduleAi();
        }));
    }

    onJoin(client: Client, options?: { token?: unknown; playerName?: unknown }) {
        const result = this.session.join(options?.token, options?.playerName);
        if (result.kind === 'rejected') throw new Error(result.reason);
        if (result.kind === 'spectator') {
            this.playerBySession.set(client.sessionId, null);
        } else {
            this.playerBySession.set(client.sessionId, result.seat.playerId);
            client.send('seat', { playerId: result.seat.playerId, token: result.seat.token });
        }
        this.broadcastLobby();
        if (this.session.phase === 'playing') this.sendState(client);
    }

    async onLeave(client: Client, consented?: boolean) {
        const playerId = this.playerBySession.get(client.sessionId) ?? null;
        this.playerBySession.delete(client.sessionId);
        this.rate.delete(client.sessionId);

        if (playerId && this.session.phase === 'playing' && !consented) {
            try {
                await this.allowReconnection(client, RECONNECT_SECONDS);
                this.playerBySession.set(client.sessionId, playerId);
                this.sendState(client);
                return;
            } catch { /* venció el margen */ }
        }
        if (playerId) this.session.leave(playerId);
        this.broadcastLobby();
    }

    onDispose() {
        this.aiTimer?.clear();
    }

    // ------------------------------------------------------------------ helpers

    /** Identifica al remitente por su conexión y aplica el límite de mensajes. */
    private guard(client: Client, fn: (playerId: string) => void) {
        const now = Date.now();
        const r = this.rate.get(client.sessionId);
        if (!r || now - r.start > RATE_WINDOW_MS) this.rate.set(client.sessionId, { start: now, count: 1 });
        else if (++r.count > RATE_MAX) return this.reject(client, 'Demasiados mensajes.');

        const playerId = this.playerBySession.get(client.sessionId);
        if (!playerId) return this.reject(client, 'Estás mirando como espectador.');
        try {
            fn(playerId);
        } catch (e) {
            console.error('[GameRoom] Error procesando mensaje:', e);
            this.reject(client, 'Error procesando la acción en el servidor.');
        }
    }

    private reject(client: Client, reason: string) {
        client.send('rejected', { reason });
    }

    private broadcastLobby() {
        this.broadcast('lobby', this.session.lobbyView());
    }

    private sendState(client: Client) {
        const view = this.session.viewFor(this.playerBySession.get(client.sessionId) ?? null);
        if (view) client.send('state', view);
    }

    /** Cada cliente recibe SU proyección; nadie recibe el estado completo. */
    private broadcastState() {
        for (const client of this.clients) this.sendState(client);
    }

    private scheduleAi() {
        if (this.aiTimer || !this.session.needsAiMove()) return;
        this.aiTimer = this.clock.setTimeout(() => {
            this.aiTimer = null;
            this.session.runAiMove();
            this.broadcastState();
        }, AI_DELAY_MS);
    }
}
