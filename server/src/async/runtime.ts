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
let pool: pg.Pool | null = null;

/** Error de configuración del despliegue: se le muestra al cliente (no contiene secretos). */
export class ConfigError extends Error {}

const POOLED_NAMES = ['DATABASE_URL', 'POSTGRES_URL'];

/**
 * Busca la conexión a Postgres. Acepta los nombres estándar y los que crean las
 * integraciones con prefijo (p. ej. STORAGE_DATABASE_URL de Neon en Vercel).
 * Devuelve el NOMBRE de la variable, nunca su valor.
 */
export function findDatabaseEnv(env: NodeJS.ProcessEnv = process.env): string | null {
    for (const name of POOLED_NAMES) if (env[name]) return name;
    const candidates = Object.keys(env)
        .filter(k => /(^|_)(DATABASE_URL|POSTGRES_URL)$/.test(k) && /^postgres(ql)?:\/\//.test(env[k] ?? ''))
        .sort();
    return candidates[0] ?? null;
}

/** Estado de la configuración, para /api/health. */
export function databaseStatus(): { database: 'postgres' | 'memory' | 'missing'; variable: string | null } {
    const variable = findDatabaseEnv();
    if (variable) return { database: 'postgres', variable };
    return { database: process.env.VERCEL ? 'missing' : 'memory', variable: null };
}

/** Estado completo para /api/health: configuración y una consulta mínima a la base. */
export async function healthInfo(): Promise<Record<string, unknown>> {
    const status = databaseStatus();
    if (status.database !== 'postgres') return status;
    try {
        getService();
        await pool!.query('select 1');
        return { ...status, connection: 'ok' };
    } catch (e) {
        return { ...status, database: 'unreachable', connection: e instanceof Error ? e.message : String(e) };
    }
}

export function getService(): AsyncGameService {
    if (service) return service;
    const variable = findDatabaseEnv();
    const url = variable ? process.env[variable] : undefined;
    let store: GameStore;
    if (url) {
        pool = new pg.Pool({
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
        if (process.env.VERCEL) throw new ConfigError('El servidor no tiene base de datos: falta DATABASE_URL en el proyecto de Vercel (Production) o hay que volver a desplegar.');
        console.warn('[api] Sin DATABASE_URL: usando almacenamiento en memoria (sólo desarrollo).');
        store = new MemoryStore();
    }
    service = new AsyncGameService(store);
    return service;
}
