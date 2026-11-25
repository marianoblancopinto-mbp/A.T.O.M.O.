/**
 * Almacenamiento de partidas por correspondencia.
 *
 * Cada partida es UNA fila: un JSON con asientos, ajustes y estado completo, y
 * un número de versión. Escribir exige la versión leída (control optimista):
 * si otro pedido guardó antes, la escritura falla y el servicio reintenta
 * sobre el estado nuevo. Así dos jugadas simultáneas nunca se pisan.
 */

import type { AsyncGameRecord } from './record';

export interface StoredGame {
    record: AsyncGameRecord;
    version: number;
}

export interface GameStore {
    get(id: string): Promise<StoredGame | null>;
    insert(record: AsyncGameRecord): Promise<void>;
    /** Guarda si la versión sigue siendo `expectedVersion`. Devuelve false si alguien escribió antes. */
    update(record: AsyncGameRecord, expectedVersion: number): Promise<boolean>;
}

// ---------------------------------------------------------------- memoria (desarrollo)

export class MemoryStore implements GameStore {
    private rows = new Map<string, { json: string; version: number }>();

    async get(id: string) {
        const row = this.rows.get(id);
        return row ? { record: JSON.parse(row.json) as AsyncGameRecord, version: row.version } : null;
    }
    async insert(record: AsyncGameRecord) {
        if (this.rows.has(record.id)) throw new Error('La partida ya existe.');
        this.rows.set(record.id, { json: JSON.stringify(record), version: 1 });
    }
    async update(record: AsyncGameRecord, expectedVersion: number) {
        const row = this.rows.get(record.id);
        if (!row || row.version !== expectedVersion) return false;
        this.rows.set(record.id, { json: JSON.stringify(record), version: expectedVersion + 1 });
        return true;
    }
}

// ---------------------------------------------------------------- Postgres (producción)

/** Lo mínimo que se necesita de un cliente Postgres (pg.Pool, PGlite, Neon, Supabase). */
export interface Queryable {
    query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

const SCHEMA = `
create table if not exists atomo_games (
    id text primary key,
    version integer not null,
    phase text not null,
    data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
)`;

export class PostgresStore implements GameStore {
    private ready: Promise<void> | null = null;
    constructor(private db: Queryable) {}

    private init() {
        this.ready ??= this.db.query(SCHEMA).then(() => undefined);
        return this.ready;
    }

    async get(id: string) {
        await this.init();
        const { rows } = await this.db.query('select data, version from atomo_games where id = $1', [id]);
        if (!rows[0]) return null;
        const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
        return { record: data as AsyncGameRecord, version: Number(rows[0].version) };
    }

    async insert(record: AsyncGameRecord) {
        await this.init();
        await this.db.query('insert into atomo_games (id, version, phase, data) values ($1, 1, $2, $3)', [record.id, record.phase, JSON.stringify(record)]);
    }

    async update(record: AsyncGameRecord, expectedVersion: number) {
        await this.init();
        const { rows } = await this.db.query(
            'update atomo_games set data = $1, phase = $2, version = version + 1, updated_at = now() where id = $3 and version = $4 returning version',
            [JSON.stringify(record), record.phase, record.id, expectedVersion],
        );
        return rows.length === 1;
    }
}
