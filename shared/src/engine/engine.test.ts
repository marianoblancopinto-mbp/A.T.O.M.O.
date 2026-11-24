import { describe, it, expect } from 'vitest';
import { createGame, DEFAULT_SETTINGS, executeCommand, projectFor, seededRandom, needsAiMove, aiMove, validAttackSources,
    availableCards, reconcile, type GameState, type EngineContext } from '../index';
import { TECHNOLOGY_REQUIREMENTS, type TechnologyType } from '../productionTypes';

const ctx = (seed = 1): EngineContext => ({ random: seededRandom(seed), now: 0 });
const seats = [{ playerId: 'A', name: 'Ana' }, { playerId: 'B', name: 'Beto' }];
const newGame = (seed = 7): GameState => createGame(seats, 'A', { ...DEFAULT_SETTINGS }, seededRandom(seed));

function run(state: GameState, actor: string, cmd: unknown, seed = 3): GameState {
    const r = executeCommand(state, actor, cmd, ctx(seed));
    if (!r.ok) throw new Error(r.reason);
    return r.state;
}
function rejects(state: GameState, actor: string, cmd: unknown): string {
    const r = executeCommand(state, actor, cmd, ctx());
    if (r.ok) throw new Error('se esperaba un rechazo');
    return r.reason;
}
const current = (s: GameState) => String(s.players[s.currentPlayerIndex].id);
const other = (s: GameState) => (current(s) === 'A' ? 'B' : 'A');
const toAction = (s: GameState) => run(run(s, 'A', { type: 'SET_PRODUCTION_READY', ready: true }), 'B', { type: 'SET_PRODUCTION_READY', ready: true });

/** Busca un ataque posible del jugador activo (origen propio limítrofe a un país rival). */
function findAttack(s: GameState): { sourceId: string; targetId: string } {
    const me = current(s);
    for (const targetId of Object.keys(s.owners)) {
        if (String(s.owners[targetId]) === me) continue;
        const src = validAttackSources(s, me, targetId);
        if (src.length) return { sourceId: src[0], targetId };
    }
    throw new Error('sin ataques posibles');
}

describe('setup (servidor)', () => {
    it('es determinista con la misma semilla y reparte todo el mapa', () => {
        const a = newGame(11), b = newGame(11);
        expect(a.owners).toEqual(b.owners);
        expect(Object.values(a.owners).every(o => o === 'A' || o === 'B')).toBe(true);
        expect(a.hostId).toBe('A');
        expect(a.roundPhase).toBe('PRODUCTION');
    });
    it('el mineral secreto de cada jugador está en un país que no es suyo', () => {
        const s = newGame();
        for (const p of s.players) expect(s.owners[p.secretMineralLocation!]).not.toBe(p.id);
    });
});

describe('proyección por jugador', () => {
    it('no filtra los secretos de los rivales', () => {
        const s = newGame();
        const view = projectFor(s, 'A');
        const me = view.players.find(p => p.id === 'A')!;
        const rival = view.players.find(p => p.id === 'B')!;
        expect(me.secretMineralLocation).toBe(s.players.find(p => p.id === 'A')!.secretMineralLocation);
        expect(rival.secretMineralLocation).toBeNull();
        expect(rival.inventory.rawMaterials).toEqual([]);
        expect(rival.specialCards).toEqual([]);
    });
    it('el espectador no ve ningún secreto', () => {
        const view = projectFor(newGame(), null);
        expect(view.players.every(p => p.secretMineralLocation === null)).toBe(true);
    });
    it('en batalla cada uno ve sólo su mano y nadie ve el mazo ni la trampa de la IA', () => {
        const s0 = toAction(newGame());
        const atk = findAttack(s0);
        const s = run(s0, current(s0), { type: 'ATTACK', ...atk });
        const vAtt = projectFor(s, current(s));
        const vDef = projectFor(s, other(s));
        expect(vAtt.battleState!.attackerHand).toHaveLength(5);
        expect(vAtt.battleState!.defenderHand).toEqual([]);
        expect(vAtt.battleState!.opponentHandSize).toBe(5);
        expect(vDef.battleState!.attackerHand).toEqual([]);
        expect(vDef.battleState!.deck).toEqual([]);
        expect('isAiCheating' in vAtt.battleState!).toBe(false);
    });
});

describe('autoridad: quién puede hacer qué', () => {
    it('rechaza comandos desconocidos o mal formados', () => {
        expect(rejects(newGame(), 'A', { type: 'SET_PLAYERS', payload: [] })).toMatch(/desconocido/);
        expect(rejects(newGame(), 'A', null)).toMatch(/inválido/);
    });
    it('no se puede atacar en el preturno ni fuera del turno propio', () => {
        const s = newGame();
        const atk = findAttack(toAction(s));
        expect(rejects(s, current(s), { type: 'ATTACK', ...atk })).toMatch(/producción/);
        const a = toAction(s);
        expect(rejects(a, other(a), { type: 'ATTACK', ...atk })).toMatch(/turno/);
    });
    it('no se puede atacar desde un país ajeno', () => {
        const s = toAction(newGame());
        const atk = findAttack(s);
        expect(rejects(s, current(s), { type: 'ATTACK', sourceId: atk.targetId, targetId: atk.sourceId })).toBeTruthy();
    });
    it('sólo el jugador activo termina el turno', () => {
        const s = toAction(newGame());
        expect(rejects(s, other(s), { type: 'END_TURN' })).toMatch(/turno/);
        const next = run(s, current(s), { type: 'END_TURN' });
        expect(current(next)).toBe(other(s));
    });
    it('sólo el anfitrión expulsa o finaliza', () => {
        const s = newGame();
        expect(rejects(s, 'B', { type: 'END_GAME' })).toMatch(/anfitrión/);
        expect(rejects(s, 'B', { type: 'KICK_PLAYER', playerId: 'A' })).toMatch(/anfitrión/);
        expect(run(s, 'A', { type: 'END_GAME' }).gameOver).toBe(true);
    });
});

describe('preturno de producción', () => {
    it('produce con cartas propias compatibles y las consume', () => {
        const s = newGame();
        const { technologies, rawMaterials } = availableCards(s, 'A');
        const pair = technologies.map(t => ({ t, r: rawMaterials.find(r => r.type === TECHNOLOGY_REQUIREMENTS[t.type as TechnologyType]) })).find(x => x.r);
        if (!pair) return; // reparto sin pares compatibles para esta semilla
        const next = run(s, 'A', { type: 'PRODUCE_SUPPLY', techId: pair.t.id, rawId: pair.r!.id });
        const a = next.players.find(p => p.id === 'A')!;
        expect(a.supplies.food.length + a.supplies.manufacture.length + a.supplies.energy.length).toBe(1);
        expect(rejects(next, 'A', { type: 'PRODUCE_SUPPLY', techId: pair.t.id, rawId: pair.r!.id })).toMatch(/consumida/);
    });
    it('no se pueden usar cartas de otro jugador', () => {
        const s = newGame();
        const theirs = availableCards(s, 'B');
        expect(rejects(s, 'A', { type: 'PRODUCE_SUPPLY', techId: theirs.technologies[0]?.id, rawId: theirs.rawMaterials[0]?.id })).toBeTruthy();
    });
    it('la ronda arranca cuando todos marcan LISTO', () => {
        const s = run(newGame(), 'A', { type: 'SET_PRODUCTION_READY', ready: true });
        expect(s.roundPhase).toBe('PRODUCTION');
        expect(toAction(newGame()).roundPhase).toBe('ACTION');
    });
});

describe('combate', () => {
    it('el servidor reparte, cada uno juega de su mano y el resultado lo calcula el servidor', () => {
        let s = toAction(newGame());
        const attacker = current(s), defender = other(s);
        const atk = findAttack(s);
        s = run(s, attacker, { type: 'ATTACK', ...atk });
        const b = s.battleState!;
        expect(rejects(s, attacker, { type: 'BATTLE_PLAY_CARD', cardId: b.defenderHand[0].id })).toBeTruthy();
        expect(rejects(s, defender, { type: 'BATTLE_PLAY_CARD', cardId: b.defenderHand[0].id })).toMatch(/atacante/);
        for (let i = 0; i < 3 && s.battleState!.phase !== 'VICTORY' && s.battleState!.phase !== 'DEFEAT'; i++) {
            s = run(s, attacker, { type: 'BATTLE_PLAY_CARD', cardId: s.battleState!.attackerHand[0].id });
            s = run(s, defender, { type: 'BATTLE_PLAY_CARD', cardId: s.battleState!.defenderHand[0].id });
            s = run(s, attacker, { type: 'BATTLE_NEXT_ROUND' });
        }
        const won = s.battleState!.phase === 'VICTORY';
        expect(String(s.owners[atk.targetId])).toBe(won ? attacker : defender);
        expect(rejects(s, attacker, { type: 'ATTACK', ...atk })).toMatch(/batalla/);
        s = run(s, defender, { type: 'BATTLE_CLOSE' });
        expect(s.battleState).toBeNull();
    });
    it('la IA neutral la juega el servidor, no el atacante', () => {
        let s = toAction(newGame());
        const attacker = current(s);
        const atk = findAttack(s);
        s = { ...s, owners: { ...s.owners, [atk.targetId]: null } };
        s = run(s, attacker, { type: 'ATTACK', ...atk });
        s = run(s, attacker, { type: 'BATTLE_PLAY_CARD', cardId: s.battleState!.attackerHand[0].id });
        expect(needsAiMove(s)).toBe(true);
        expect(rejects(s, attacker, { type: 'BATTLE_PLAY_CARD', cardId: s.battleState!.defenderHand[0].id })).toMatch(/defensor/);
        s = aiMove(s);
        expect(s.battleState!.phase).toBe('RESOLUTION');
    });
});

describe('ronda y privacidad de notificaciones', () => {
    it('al cerrar la ronda empieza un año nuevo con preturno', () => {
        let s = toAction(newGame());
        s = run(s, current(s), { type: 'END_TURN' });
        s = run(s, current(s), { type: 'END_TURN' });
        expect(s.gameDate.getFullYear()).toBe(2101);
        expect(s.roundPhase).toBe('PRODUCTION');
    });
    it('perder el país de un silo destruye el silo y avisa sólo a su dueño', () => {
        let s = toAction(newGame());
        const rid = Object.keys(s.owners).find(r => s.owners[r] === 'B')!;
        s = { ...s, players: s.players.map(p => (p.id === 'B' ? { ...p, silos: [rid], siloStatus: { [rid]: { status: 'active', turnsRemaining: 0 } } } : p)) };
        const conquered = { ...s, owners: { ...s.owners, [rid]: 'A' } };
        const r = reconcile(s, conquered);
        expect(r.players.find(p => p.id === 'B')!.silos).toEqual([]);
        const n = r.notifications[r.notifications.length - 1];
        expect(n.title).toBe('SILO DESTRUIDO');
        expect(projectFor(r, 'B').notification?.title).toBe('SILO DESTRUIDO');
        expect(projectFor(r, 'A').notification?.title).not.toBe('SILO DESTRUIDO');
    });
});
