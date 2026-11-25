import { useEffect, useState } from 'react';

/** Texto de tiempo restante hasta `at` (epoch ms), actualizado cada 30 s. */
export function formatRemaining(ms: number): string {
    if (ms <= 0) return 'vencido';
    const min = Math.ceil(ms / 60_000);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60), m = min % 60;
    if (h < 48) return m ? `${h} h ${m} min` : `${h} h`;
    return `${Math.floor(h / 24)} días ${h % 24} h`;
}

export function useCountdown(at: number | null | undefined): string | null {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!at) return;
        const t = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(t);
    }, [at]);
    return at ? formatRemaining(at - now) : null;
}
