import { describe, it, expect } from 'vitest';
import {
    createGame, DEFAULT_SETTINGS, executeCommand, projectFor, seededRandom, validAttackSources, applyDeadlines,
    type GameState,
} from '../index';

const MIN = 60_000;
const T0 = Date.UTC(2026, 0, 1);
const settings = { ...DEFAULT_SETTINGS, pace: 'async' as const, turnMinutes: 60 };
const seats = [{ playerId: 'A', name: 'Ana' }, { playerId: 'B', name: 'Beto' }];
const newGame = (seed = 7) => createGame(seats, 'A', settings, seededRandom(seed), T0);

function run(s: GameState, actor: string, cmd: unknown, now = T0, seed = 3): GameState {
    const r = executeCommand(s, actor, cmd, { random: seededRandom(seed), now });
    if (!r.ok) throw new Error(r.reason);
    return r.state;
}
function rejects(s: GameState, actor: string, cmd: unknown, now = T0): string {
    const r = executeCommand(s, actor, cmd, { random: seededRandom(1), now });
    if (r.ok) throw new Error('se esperaba un rechazo');
    return r.reason;
}
const cur = (s: GameState) => String(s.players[s.currentPlayerIndex].id);
const other = (s: GameState) => (cur(s) === 'A' ? 'B' : 'A');
const toAction = (s: GameState) => run(run(s, 'A', { type: 'SET_PRODUCTION_READY', ready: true }), 'B', { type: 'SET_PRODUCTION_READY', ready: true });
function anAttack(s: GameState, neutral = false) {
    const me = cur(s);
    for (const t of Object.keys(s.owners)) {
        if (String(s.owners[t]) === me) continue;
        const src = validAttackSources(neutral ? { ...s, owners: { ...s.owners, [t]: null } } : s, me, t);
        if (src.length) return { sourceId: src[0], targetId: t };
    }
    throw new Error('sin ataques');
}

describe('correspondencia: plazos', () => {
    it('la partida arranca con plazo de preturno', () => {
        const s = newGame();
        expect(s.deadline).toEqual({ kind: 'production', at: T0 + 60 * MIN });
    });
    it('al cerrarse el preturno arranca el plazo del turno', () => {
        const s = toAction(newGame());
        expect(s.deadline?.kind).toBe('turn');
    });
    it('si vence el preturno, la ronda empieza sola', () => {
        const s = applyDeadlines(newGame(), T0 + 61 * MIN, seededRandom(1));
        expect(s.roundPhase).toBe('ACTION');
        expect(s.deadline).toEqual({ kind: 'turn', at: T0 + 120 * MIN });
    });
    it('si vence el turno, pasa al siguiente jugador', () => {
        const s = toAction(newGame());
        const before = cur(s);
        const after = applyDeadlines(s, T0 + 61 * MIN, seededRandom(1));
        expect(cur(after)).not.toBe(before);
        expect(after.notifications.at(-1)?.title).toBe('TURNO VENCIDO');
    });
    it('aplica en orden varios plazos vencidos mientras nadie miraba', () => {
        const s = toAction(newGame());
        const later = applyDeadlines(s, T0 + 10 * 60 * MIN, seededRandom(1));
        expect(later.gameDate.getFullYear()).toBeGreaterThan(2100);
        expect(later.deadline!.at).toBeGreaterThan(T0 + 10 * 60 * MIN);
    });
});

describe('correspondencia: combate comprometido', () => {
    it('el atacante compromete 3 cartas y el defensor ve sólo los regimientos', () => {
        let s = toAction(newGame());
        const attacker = cur(s), defender = other(s);
        s = run(s, attacker, { type: 'ATTACK', ...anAttack(s) });
        expect(s.battleState!.phase).toBe('ATTACKER_COMMIT');
        expect(rejects(s, attacker, { type: 'BATTLE_COMMIT', cardIds: [s.battleState!.attackerHand[0].id] })).toMatch(/exactamente 3/);
        const ids = s.battleState!.attackerHand.slice(0, 3).map(c => c.id);
        s = run(s, attacker, { type: 'BATTLE_COMMIT', cardIds: ids }, T0 + 10 * MIN);
        expect(s.battleState!.phase).toBe('DEFENDER_COMMIT');
        expect(s.deadline).toEqual({ kind: 'defense', at: T0 + 70 * MIN });

        const vDef = projectFor(s, defender).battleState!;
        expect(vDef.attackerCommit).toBeNull();
        expect(vDef.incomingRegiments).toHaveLength(3);
        expect(vDef.attackerHand).toEqual([]);
        expect(projectFor(s, attacker).battleState!.attackerCommit).toHaveLength(3);
    });

    it('al defender se resuelven las 3 rondas, queda un informe y el turno sigue con su tiempo', () => {
        let s = toAction(newGame());
        const attacker = cur(s), defender = other(s);
        const atk = anAttack(s);
        s = run(s, attacker, { type: 'ATTACK', ...atk });
        s = run(s, attacker, { type: 'BATTLE_COMMIT', cardIds: s.battleState!.attackerHand.slice(0, 3).map(c => c.id) }, T0 + 10 * MIN);
        s = run(s, defender, { type: 'BATTLE_COMMIT', cardIds: s.battleState!.defenderHand.slice(0, 3).map(c => c.id) }, T0 + 40 * MIN);
        expect(s.battleState).toBeNull();
        const r = s.battleReports.at(-1)!;
        expect(r.clashes).toHaveLength(3);
        expect(String(s.owners[atk.targetId])).toBe(r.winner === 'attacker' ? attacker : defender);
        // Al atacante le quedaban 50 min de turno cuando empezó a esperar: se reanudan.
        expect(s.deadline).toEqual({ kind: 'turn', at: T0 + 90 * MIN });
    });

    it('si el defensor no responde, defiende el sistema', () => {
        let s = toAction(newGame());
        const attacker = cur(s);
        s = run(s, attacker, { type: 'ATTACK', ...anAttack(s) });
        s = run(s, attacker, { type: 'BATTLE_COMMIT', cardIds: s.battleState!.attackerHand.slice(0, 3).map(c => c.id) });
        s = applyDeadlines(s, T0 + 61 * MIN, seededRandom(2));
        expect(s.battleState).toBeNull();
        expect(s.battleReports.at(-1)!.autoDefense).toBe(true);
    });

    it('contra un país neutral la batalla se resuelve al comprometer', () => {
        let s = toAction(newGame());
        const attacker = cur(s);
        const atk = anAttack(s, true);
        s = { ...s, owners: { ...s.owners, [atk.targetId]: null } };
        s = run(s, attacker, { type: 'ATTACK', ...atk });
        s = run(s, attacker, { type: 'BATTLE_COMMIT', cardIds: s.battleState!.attackerHand.slice(0, 3).map(c => c.id) });
        expect(s.battleState).toBeNull();
        expect(s.battleReports).toHaveLength(1);
    });

    it('el modo en vivo no tiene plazos y sigue usando el combate interactivo', () => {
        let s = createGame(seats, 'A', { ...DEFAULT_SETTINGS }, seededRandom(7), T0);
        expect(s.deadline).toBeNull();
        s = toAction(s);
        s = run(s, cur(s), { type: 'ATTACK', ...anAttack(s) });
        expect(s.battleState!.phase).toBe('ATTACKER_SELECTION');
    });
});
