/**
 * GameRoom — sala autoritativa de A.T.O.M.O.
 *
 * El servidor es la ÚNICA fuente de verdad. Maneja dos fases:
 *  - LOBBY: los jugadores se unen con su nombre; el primero es el anfitrión.
 *  - PLAYING: el anfitrión inicia la partida (manda el estado inicial que generó);
 *    a partir de ahí los clientes mandan Intents y el servidor valida (rules),
 *    aplica (reducer de @atomo/shared) y difunde el estado.
 *
 * Sincronización por mensajes (sin @colyseus/schema); alcanza para un juego por turnos.
 */

import colyseus, { type Client } from 'colyseus';
import type { GameState, Intent } from '@atomo/shared';
import {
    createInitialState,
    adoptInitialState,
    applyIntent,
    toWire,
    addLobbyPlayer,
    removeLobbyPlayer,
    isHost,
    type LobbyPlayer,
} from './roomLogic';

const { Room } = colyseus;

interface JoinOptions {
    playerId?: string | number;
    playerName?: string;
}

export class GameRoom extends Room {
    private gameState: GameState = createInitialState();
    private lobby: LobbyPlayer[] = [];
    private phase: 'lobby' | 'playing' = 'lobby';
    // Qué jugador del juego controla cada conexión (sessionId -> playerId).
    private playerBySession = new Map<string, string | number>();

    onCreate() {
        console.log(`[GameRoom] Sala creada: ${this.roomId}`);

        // El anfitrión inicia la partida con el estado inicial que generó localmente.
        this.onMessage('start', (client: Client, payload: { state: unknown }) => {
            const playerId = this.playerBySession.get(client.sessionId);
            if (playerId == null || !isHost(this.lobby, playerId)) {
                client.send('rejected', { reason: 'Sólo el anfitrión puede iniciar la partida.' });
                return;
            }
            this.gameState = adoptInitialState(payload?.state);
            this.phase = 'playing';
            this.broadcast('lobby', { players: this.lobby, phase: this.phase });
            this.broadcast('state', toWire(this.gameState));
            console.log(`[GameRoom] Partida iniciada en ${this.roomId}`);
        });

        // El cliente manda un intent; el servidor lo valida, lo aplica y difunde.
        this.onMessage('intent', (client: Client, intent: Intent) => {
            const playerId = this.playerBySession.get(client.sessionId);
            if (playerId == null) {
                client.send('rejected', { reason: 'Conexión sin jugador identificado.' });
                return;
            }
            const result = applyIntent(this.gameState, playerId, intent);
            if (result.ok) {
                this.gameState = result.state;
                this.broadcast('state', toWire(this.gameState));
            } else {
                console.log(`[GameRoom] Intent rechazado de ${playerId}: ${result.reason}`);
                client.send('rejected', { reason: result.reason });
            }
        });
    }

    onJoin(client: Client, options?: JoinOptions) {
        const playerId = options?.playerId ?? client.sessionId;
        const name = options?.playerName ?? 'Comandante';
        this.playerBySession.set(client.sessionId, playerId);
        this.lobby = addLobbyPlayer(this.lobby, playerId, name);

        console.log(`[GameRoom] ${name} (${playerId}) se unió a ${this.roomId} [${this.phase}]`);
        this.broadcast('lobby', { players: this.lobby, phase: this.phase });

        // Si la partida ya arrancó, entregar el estado actual al que se une (late-join).
        if (this.phase === 'playing') {
            client.send('state', toWire(this.gameState));
        }
    }

    onLeave(client: Client) {
        const playerId = this.playerBySession.get(client.sessionId);
        this.playerBySession.delete(client.sessionId);
        if (playerId != null) {
            this.lobby = removeLobbyPlayer(this.lobby, playerId);
            this.broadcast('lobby', { players: this.lobby, phase: this.phase });
        }
        console.log(`[GameRoom] ${client.sessionId} salió de ${this.roomId}`);
        // TODO (Fase 4): allowReconnection para que retome su lugar sin perder el turno.
    }
}
