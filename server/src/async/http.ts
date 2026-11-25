/**
 * API HTTP de partidas por correspondencia.
 *
 *   POST /api/games                 { name, settings? }  → { token, view }   crea la partida (sos anfitrión)
 *   POST /api/games/:id/join        { name }             → { token, view }   tomar asiento en el lobby
 *   GET  /api/games/:id                                  → view              estado (aplica plazos vencidos)
 *   POST /api/games/:id/settings    { settings }         → view              sólo anfitrión, en el lobby
 *   POST /api/games/:id/start                            → view              sólo anfitrión
 *   POST /api/games/:id/command     { command }          → view              una jugada
 *   GET  /api/health
 *
 * La identidad viaja en `Authorization: Bearer <token>`. El token lo genera el
 * servidor al crear o unirse; en la base sólo queda su hash.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { AsyncGameService, ApiError } from './service';

export const MAX_BODY_BYTES = 64 * 1024;

export interface ApiRequest { method: string; path: string; token?: string; body: unknown }
export interface ApiResponse { status: number; body: unknown }

export async function handleApi(service: AsyncGameService, req: ApiRequest): Promise<ApiResponse> {
    const parts = req.path.replace(/^\/+|\/+$/g, '').split('/');
    if (parts[0] === 'api') parts.shift();
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    try {
        if (req.method === 'GET' && parts[0] === 'health') return { status: 200, body: { ok: true } };
        if (parts[0] !== 'games') throw new ApiError(404, 'Ruta inexistente.');

        const [, id, action] = parts;
        if (!id && req.method === 'POST') return { status: 201, body: await service.create(body.name, body.settings) };
        if (!id) throw new ApiError(404, 'Ruta inexistente.');
        if (!action && req.method === 'GET') return { status: 200, body: await service.get(id, req.token) };
        if (req.method === 'POST') {
            switch (action) {
                case 'join': return { status: 201, body: await service.join(id, body.name) };
                case 'settings': return { status: 200, body: await service.updateSettings(id, req.token, body.settings) };
                case 'start': return { status: 200, body: await service.start(id, req.token) };
                case 'command': return { status: 200, body: await service.command(id, req.token, body.command) };
            }
        }
        throw new ApiError(404, 'Ruta inexistente.');
    } catch (e) {
        if (e instanceof ApiError) return { status: e.status, body: { error: e.message } };
        console.error('[api] error inesperado:', e);
        return { status: 500, body: { error: 'Error interno del servidor.' } };
    }
}

// ---------------------------------------------------------------- adaptador Node (Vercel y servidor local)

async function readBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
        size += (chunk as Buffer).length;
        if (size > MAX_BODY_BYTES) throw new ApiError(413, 'Pedido demasiado grande.');
        chunks.push(chunk as Buffer);
    }
    if (!chunks.length) return {};
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'JSON inválido.'); }
}

export function nodeHandler(getService: () => AsyncGameService) {
    return async (req: IncomingMessage, res: ServerResponse) => {
        const send = (status: number, body: unknown) => {
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(body));
        };
        try {
            const url = new URL(req.url ?? '/', 'http://localhost');
            // En Vercel la ruta original llega como ?__path=… (ver build-vercel.mjs).
            const path = url.searchParams.get('__path') ? `/api/${url.searchParams.get('__path')}` : url.pathname;
            const auth = req.headers.authorization ?? '';
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
            const body = req.method === 'POST' ? await readBody(req) : {};
            const result = await handleApi(getService(), { method: req.method ?? 'GET', path, token, body });
            send(result.status, result.body);
        } catch (e) {
            if (e instanceof ApiError) return send(e.status, { error: e.message });
            console.error('[api] error inesperado:', e);
            send(500, { error: 'Error interno del servidor.' });
        }
    };
}
