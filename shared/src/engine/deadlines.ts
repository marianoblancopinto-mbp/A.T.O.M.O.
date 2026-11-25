/**
 * Plazos del modo correspondencia.
 *
 * No hay un proceso que "despierte" al vencer un plazo: el servidor llama a
 * applyDeadlines cada vez que alguien consulta o modifica la partida. Si pasó
 * el tiempo, el motor actúa por el jugador que no respondió, y si mientras
 * nadie miraba vencieron varios plazos seguidos, los aplica en orden (cada
 * uno a partir del vencimiento anterior, no de "ahora").
 *
 *  - production: el preturno se cierra solo (como si el anfitrión lo forzara).
 *  - turn:       el turno termina solo; un ataque sin comprometer se cancela.
 *  - defense:    el sistema elige la defensa y se resuelve la batalla.
 *
 * Mientras se espera una defensa, el reloj del turno del atacante se pausa.
 */

import type { GameState } from '../game/state';
import { advanceTurn } from './turn';
import { expireTurnBonuses } from './actions';
import { autoDefense, resolveCommitted } from './committed';
import { notify, currentPlayer, regionTitle } from './helpers';
import type { Random } from './rng';

const minutes = (state: GameState) => state.settings.turnMinutes * 60_000;
const isAsync = (state: GameState) => state.settings.pace === 'async';

/**
 * Ajusta el plazo vigente según cómo cambió el estado. Se llama después de
 * cada comando (y de cada plazo aplicado) con el momento en que ocurrió.
 */
export function syncDeadline(prev: GameState | null, next: GameState, now: number): GameState {
    if (!isAsync(next)) return next.deadline ? { ...next, deadline: null } : next;
    if (next.winner || next.gameOver || !next.gameStarted) return next.deadline ? { ...next, deadline: null } : next;

    const T = minutes(next);
    const b = next.battleState;
    const prevB = prev?.battleState ?? null;

    // Empieza a esperarse una defensa: se pausa el reloj del turno.
    if (b?.phase === 'DEFENDER_COMMIT' && prevB?.phase !== 'DEFENDER_COMMIT') {
        const remaining = prev?.deadline?.kind === 'turn' ? Math.max(0, prev.deadline.at - now) : T;
        return { ...next, battleState: { ...b, turnRemainingMs: remaining }, deadline: { kind: 'defense', at: now + T } };
    }
    if (b?.phase === 'DEFENDER_COMMIT') return next;

    // Se resolvió una defensa: el turno sigue con el tiempo que le quedaba.
    if (prevB?.phase === 'DEFENDER_COMMIT' && !b) {
        return { ...next, deadline: { kind: 'turn', at: now + (prevB.turnRemainingMs ?? T) } };
    }

    if (next.roundPhase === 'PRODUCTION') {
        const newRound = !prev || prev.roundPhase !== 'PRODUCTION' || next.gameDate.getFullYear() !== prev.gameDate.getFullYear();
        return newRound || next.deadline?.kind !== 'production' ? { ...next, deadline: { kind: 'production', at: now + T } } : next;
    }

    const turnChanged = !prev || prev.roundPhase !== 'ACTION' || prev.currentPlayerIndex !== next.currentPlayerIndex
        || prev.gameDate.getFullYear() !== next.gameDate.getFullYear() || prev.turnOrderIndex !== next.turnOrderIndex;
    if (turnChanged || next.deadline?.kind !== 'turn') return { ...next, deadline: { kind: 'turn', at: now + T } };
    return next;
}

/** Aplica todos los plazos vencidos hasta `now`. */
export function applyDeadlines(state: GameState, now: number, random: Random): GameState {
    let s = state;
    for (let guard = 0; guard < 500 && isAsync(s) && s.deadline && s.deadline.at <= now && !s.winner && !s.gameOver; guard++) {
        const at = s.deadline.at;
        const prev = s;
        if (s.deadline.kind === 'production') {
            s = { ...s, roundPhase: 'ACTION', productionReadyIds: [] };
            s = notify(s, { type: 'NEUTRALIZED', title: 'PRETURNO CERRADO', message: 'Venció el plazo de producción: empieza la ronda de acciones.', color: '#ffcc00' });
        } else if (s.deadline.kind === 'defense' && s.battleState?.phase === 'DEFENDER_COMMIT') {
            const b = s.battleState;
            s = notify(s, { type: 'NEUTRALIZED', title: 'DEFENSA AUTOMÁTICA', message: `${b.defender.name} no respondió a tiempo: el mando local organizó la defensa de ${regionTitle(b.targetRegionId)}.`, color: '#ffcc00' });
            s = resolveCommitted(s, autoDefense(b), true, at, random);
        } else {
            const p = currentPlayer(s);
            const cancelled = s.battleState ? { ...s, battleState: null } : s;
            s = advanceTurn(cancelled, random);
            if (p) s = { ...s, players: expireTurnBonuses(s, p.id).players };
            s = notify(s, { type: 'NEUTRALIZED', title: 'TURNO VENCIDO', message: `${p?.name ?? 'Un comandante'} no actuó a tiempo y su turno terminó.`, color: '#ffcc00' });
        }
        s = syncDeadline(prev, { ...s, deadline: prev.deadline?.kind === 'production' && s.roundPhase === 'ACTION' ? null : s.deadline }, at);
    }
    return s;
}
