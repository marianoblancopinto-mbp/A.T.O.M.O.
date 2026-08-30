/**
 * Punto de entrada del servidor de juego autoritativo (Colyseus).
 *
 * Dev:   npm run dev   (dentro de server/, con recarga)
 * Prod:  npm run start
 */

// colyseus es CommonJS: importamos el default y desestructuramos (ver GameRoom.ts).
import colyseus from 'colyseus';
import wsTransport from '@colyseus/ws-transport';
import { GameRoom } from './GameRoom';

const { Server } = colyseus;
const { WebSocketTransport } = wsTransport;

const port = Number(process.env.PORT) || 2567;

// El default de Colyseus para el tamaño de mensaje es 4KB — demasiado chico:
// el estado inicial y las acciones que llevan el estado (SET_PLAYERS, etc.) lo
// superan. Se sube a 4MB para dar margen holgado.
const gameServer = new Server({
    transport: new WebSocketTransport({ maxPayload: 4 * 1024 * 1024 }),
});

// Registra el tipo de sala. Los clientes se unen por este nombre.
gameServer.define('atomo', GameRoom);

gameServer.listen(port);
console.log(`[ATOMO] Servidor autoritativo escuchando en ws://localhost:${port}`);
