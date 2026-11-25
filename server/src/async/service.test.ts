import { describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { AsyncGameService, ApiError, type Clock } from './service';
import { MemoryStore, PostgresStore, type GameStore } from './store';
import { handleApi } from './http';

const T0 = Date.UTC(2026, 0, 1);
function clock(start = T0): Clock & { advance(ms: number): void } {
    let t = start; let seed = 1;
    return { now: () => t, random: () => ((seed = (seed * 16807) % 2147483647) / 2147483647), advance(ms) { t += ms; } };
}
const err = async (p: Promise<unknown>) => { try { await p; } catch (e) { return e as ApiError; } throw new Error('se esperaba error'); };

async function lobby(store: GameStore = new MemoryStore(), c = clock()) {
    const svc = new AsyncGameService(store, c);
    const host = await svc.create('Ana', { turnMinutes: 60 });
    const guest = await svc.join(host.view.gameId, 'Beto');
    return { svc, c, id: host.view.gameId, ana: host.token, beto: guest.token };
}

for (const [name, makeStore] of [
    ['memoria', () => new MemoryStore()],
    ['Postgres (PGlite)', () => new PostgresStore(new PGlite())],
] as const) {
    describe(`servicio de correspondencia · ${name}`, () => {
        it('crea, une y arranca la partida en modo correspondencia', async () => {
            const { svc, id, ana } = await lobby(makeStore());
            expect(id).toMatch(/^c[a-z0-9]{8}$/);
            const v = await svc.start(id, ana);
            expect(v.phase).toBe('playing');
            const st = v.state as any;
            expect(st.settings.pace).toBe('async');
            expect(st.deadline.kind).toBe('production');
        });

        it('cada jugador ve sólo su información', async () => {
            const { svc, id, ana, beto } = await lobby(makeStore());
            await svc.start(id, ana);
            const va = await svc.get(id, ana);
            const vb = await svc.get(id, beto);
            const mine = (v: any) => v.state.players.find((p: any) => p.id === v.you.playerId).secretMineralLocation;
            const theirs = (v: any) => v.state.players.find((p: any) => p.id !== v.you.playerId).secretMineralLocation;
            expect(mine(va)).toBeTruthy();
            expect(theirs(va)).toBeNull();
            expect(mine(vb)).toBeTruthy();
            expect(theirs(vb)).toBeNull();
        });

        it('rechaza credenciales ajenas o inventadas', async () => {
            const { svc, id } = await lobby(makeStore());
            expect((await err(svc.get(id, 'x'.repeat(32)))).status).toBe(403);
            expect((await err(svc.get(id, undefined))).status).toBe(401);
            expect((await err(svc.get('cnoexiste', 'x'.repeat(32)))).status).toBe(404);
        });

        it('sólo el anfitrión inicia; los comandos inválidos devuelven el motivo', async () => {
            const { svc, id, ana, beto } = await lobby(makeStore());
            expect((await err(svc.start(id, beto))).status).toBe(403);
            await svc.start(id, ana);
            const e = await err(svc.command(id, beto, { type: 'SET_OWNERS', owners: {} }));
            expect(e.status).toBe(422);
            expect(e.message).toMatch(/desconocido/);
        });

        it('al consultar se aplican los plazos vencidos y quedan guardados', async () => {
            const c = clock();
            const { svc, id, ana, beto } = await lobby(makeStore(), c);
            await svc.start(id, ana);
            c.advance(61 * 60_000);
            const v = await svc.get(id, beto);
            expect((v.state as any).roundPhase).toBe('ACTION');
            const again = await svc.get(id, ana);
            expect(again.version).toBe(v.version);
        });

        it('dos jugadas simultáneas no se pisan', async () => {
            const { svc, id, ana, beto } = await lobby(makeStore());
            await svc.start(id, ana);
            await Promise.all([
                svc.command(id, ana, { type: 'SET_PRODUCTION_READY', ready: true }),
                svc.command(id, beto, { type: 'SET_PRODUCTION_READY', ready: true }),
            ]);
            expect(((await svc.get(id, ana)).state as any).roundPhase).toBe('ACTION');
        });
    });
}

describe('rutas HTTP', () => {
    it('crea, consulta y rechaza rutas desconocidas', async () => {
        const svc = new AsyncGameService(new MemoryStore(), clock());
        const created = await handleApi(svc, { method: 'POST', path: '/api/games', body: { name: 'Ana' } });
        expect(created.status).toBe(201);
        const { token, view } = created.body as any;
        const got = await handleApi(svc, { method: 'GET', path: `/api/games/${view.gameId}`, token, body: {} });
        expect(got.status).toBe(200);
        expect((await handleApi(svc, { method: 'GET', path: '/api/nada', body: {} })).status).toBe(404);
        expect((await handleApi(svc, { method: 'GET', path: '/api/health', body: {} })).body).toEqual({ ok: true });
    });
});
