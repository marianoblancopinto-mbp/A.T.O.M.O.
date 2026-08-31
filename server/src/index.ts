/**
 * Punto de entrada del servidor de juego autoritativo (Colyseus).
 *
 * Dev:   npm run dev   (dentro de server/, con recarga)
 * Prod:  npm run start   (o `npm run server:start` desde la raíz)
 *
 * En producción (Render) escucha en process.env.PORT y expone /health para el
 * health check. El mismo servidor http hospeda el WebSocket de Colyseus.
 */

import { createServer } from 'http';
// colyseus es CommonJS: importamos el default y desestructuramos (ver GameRoom.ts).
import colyseus from 'colyseus';
import wsTransport from '@colyseus/ws-transport';
import { GameRoom } from './GameRoom';

const { Server } = colyseus;
const { WebSocketTransport } = wsTransport;

const port = Number(process.env.PORT) || 2567;

// Servidor http con endpoint de salud (para el health check de Render). El mismo
// servidor recibe los upgrades WebSocket de Colyseus.
const httpServer = createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ATOMO server OK');
        return;
    }
    res.writeHead(404);
    res.end();
});

const gameServer = new Server({
    // El default de Colyseus para el tamaño de mensaje es 4KB — demasiado chico:
    // el estado inicial y las acciones que llevan el estado (SET_PLAYERS, etc.) lo
    // superan. Se sube a 4MB para dar margen holgado.
    transport: new WebSocketTransport({ server: httpServer, maxPayload: 4 * 1024 * 1024 }),
});

// Registra el tipo de sala. Los clientes se unen por este nombre.
gameServer.define('atomo', GameRoom);

gameServer.listen(port);
console.log(`[ATOMO] Servidor autoritativo escuchando en el puerto ${port}`);
