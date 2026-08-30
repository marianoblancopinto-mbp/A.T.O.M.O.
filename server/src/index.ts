/**
 * Punto de entrada del servidor de juego autoritativo (Colyseus).
 *
 * Dev:   npm run dev   (dentro de server/, con recarga)
 * Prod:  npm run start
 */

// colyseus es CommonJS: importamos el default y desestructuramos (ver GameRoom.ts).
import colyseus from 'colyseus';
import { GameRoom } from './GameRoom';

const { Server } = colyseus;

const port = Number(process.env.PORT) || 2567;

const gameServer = new Server();

// Registra el tipo de sala. Los clientes se unen por este nombre.
gameServer.define('atomo', GameRoom);

gameServer.listen(port);
console.log(`[ATOMO] Servidor autoritativo escuchando en ws://localhost:${port}`);
