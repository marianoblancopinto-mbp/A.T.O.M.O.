/**
 * Azar inyectable. El motor NUNCA llama a Math.random directamente: recibe un
 * `Random` desde el servidor. Así el azar vive SÓLO en el servidor (el cliente
 * no puede elegir sus cartas) y los tests pueden usar una semilla fija.
 */
export type Random = () => number;

/** PRNG determinista (mulberry32) para tests y repeticiones. */
export function seededRandom(seed: number): Random {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function shuffled<T>(items: readonly T[], random: Random): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export function pick<T>(items: readonly T[], random: Random): T | undefined {
    return items.length ? items[Math.floor(random() * items.length)] : undefined;
}

/** Id único y no adivinable desde el cliente (lo genera el servidor). */
export function makeId(prefix: string, random: Random): string {
    return `${prefix}-${Math.floor(random() * 2 ** 48).toString(36)}${Math.floor(random() * 2 ** 48).toString(36)}`;
}
