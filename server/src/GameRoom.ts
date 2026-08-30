/**
 * GameRoom — sala autoritativa de A.T.O.M.O.
 *
 * El servidor es la ÚNICA fuente de verdad: sostiene el GameState, aplica las
 * acciones con el reducer de @atomo/shared y difunde el estado resultante.
 * Los clientes sólo mandan acciones y dibujan lo que reciben.
 *
 * Esqueleto (Fase 2a): sincronización por mensajes (sin @colyseus/schema).
 * Para un juego por turnos alcanza; el delta-sync por Schema es una optimización
 * posterior. La validación de turno + reglas entra en la Fase 2b (ver roomLogic).
 */

// colyseus es CommonJS: bajo ESM sus named exports no son detectables, así que
// importamos el default (module.exports) y desestructuramos los valores runtime.
// Los tipos (Client) se importan como type-only (se borran en runtime).
import colyseus, { type Client } from 'colyseus';
import type { GameState, GameAction } from '@atomo/shared';
import { createInitialState, applyAction, toWire } from './roomLogic';

const { Room } = colyseus;

export class GameRoom extends Room {
    private gameState: GameState = createInitialState();

    onCreate() {
        console.log(`[GameRoom] Sala creada: ${this.roomId}`);

        // El cliente manda una acción; el servidor la aplica (autoritativo) y difunde.
        this.onMessage('action', (_client: Client, action: GameAction) => {
            this.gameState = applyAction(this.gameState, action);
            this.broadcast('state', toWire(this.gameState));
        });
    }

    onJoin(client: Client) {
        console.log(`[GameRoom] ${client.sessionId} se unió a ${this.roomId}`);
        // Entregar el estado actual al que se une (late-join).
        client.send('state', toWire(this.gameState));
    }

    onLeave(client: Client) {
        console.log(`[GameRoom] ${client.sessionId} salió de ${this.roomId}`);
        // TODO (Fase 4): allowReconnection para que retome su lugar.
    }
}
