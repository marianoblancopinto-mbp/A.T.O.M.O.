/**
 * GameRoom — sala autoritativa de A.T.O.M.O.
 *
 * El servidor es la ÚNICA fuente de verdad: sostiene el GameState, valida y aplica
 * los Intents con @atomo/shared (applyIntent) y difunde el estado resultante.
 * Los clientes sólo mandan intents y dibujan lo que reciben.
 *
 * Esqueleto (Fase 2a/2b): sincronización por mensajes (sin @colyseus/schema).
 * La validación de turno + reglas ya corre en el servidor (Fase 2b).
 */

import colyseus, { type Client } from 'colyseus';
import type { GameState, Intent } from '@atomo/shared';
import { createInitialState, applyIntent, toWire } from './roomLogic';

const { Room } = colyseus;

interface JoinOptions {
    playerId?: string | number;
}

export class GameRoom extends Room {
    private gameState: GameState = createInitialState();
    // Qué jugador del juego controla cada conexión (sessionId -> playerId).
    private playerBySession = new Map<string, string | number>();

    onCreate() {
        console.log(`[GameRoom] Sala creada: ${this.roomId}`);

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
        if (options?.playerId != null) {
            this.playerBySession.set(client.sessionId, options.playerId);
        }
        console.log(`[GameRoom] ${client.sessionId} se unió a ${this.roomId} (jugador: ${options?.playerId ?? 'sin id'})`);
        // Entregar el estado actual al que se une (late-join).
        client.send('state', toWire(this.gameState));
    }

    onLeave(client: Client) {
        this.playerBySession.delete(client.sessionId);
        console.log(`[GameRoom] ${client.sessionId} salió de ${this.roomId}`);
        // TODO (Fase 4): allowReconnection para que retome su lugar.
    }
}
