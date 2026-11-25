/**
 * Construye el servicio según el entorno:
 *  - DATABASE_URL (Neon, Supabase, Vercel Postgres…) → Postgres.
 *  - sin DATABASE_URL → memoria (sólo desarrollo; se pierde al reiniciar).
 * En Vercel sin DATABASE_URL se niega a arrancar, para no perder partidas en silencio.
 */

import pg from 'pg';
import { AsyncGameService } from './service';
import { MemoryStore, PostgresStore, type GameStore } from './store';

let service: AsyncGameService | null = null;

export function getService(): AsyncGameService {
    if (service) return service;
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    let store: GameStore;
    if (url) {
        const pool = new pg.Pool({
            connectionString: url,
            max: 3,
            // TLS verificado por defecto (Neon/Vercel Postgres). PGSSLMODE=disable sólo para una base local;
            // PGSSL_ALLOW_UNVERIFIED=1 sólo si el proveedor usa una CA propia y no podés instalarla.
            ssl: process.env.PGSSLMODE === 'disable' ? false
                : process.env.PGSSL_ALLOW_UNVERIFIED === '1' ? { rejectUnauthorized: false }
                : true,
        });
        store = new PostgresStore(pool);
    } else {
        if (process.env.VERCEL) throw new Error('Falta DATABASE_URL: configurá una base Postgres en el proyecto de Vercel.');
        console.warn('[api] Sin DATABASE_URL: usando almacenamiento en memoria (sólo desarrollo).');
        store = new MemoryStore();
    }
    service = new AsyncGameService(store);
    return service;
}
