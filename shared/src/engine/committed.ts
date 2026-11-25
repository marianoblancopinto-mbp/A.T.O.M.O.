/**
 * Combate COMPROMETIDO (modo correspondencia).
 *
 *  1. ATTACK: el servidor reparte las manos (igual que en vivo).
 *  2. El atacante compromete 3 cartas EN ORDEN (BATTLE_COMMIT).
 *  3. El defensor ve el regimiento de cada ronda, pero no el tier, y
 *     compromete sus 3 cartas en orden (o lo hace el sistema si es neutral o
 *     se le vence el plazo).
 *  4. Se resuelven las 3 rondas de una vez y se publica un informe.
 *
 * Puntaje (igual que en vivo): atacante = tier + bonus; defensor = tier sólo si
 * coincide el regimiento + bonus de terreno. El empate es del defensor.
 */

import type { GameState, BattleReport } from '../game/state';
import type { BattleState, Card, Regiment } from '../gameTypes';
import { calculateAttackerScore, calculateDefenderScore } from './ai';
import { makeId, type Random } from './rng';
import { fail, ok, sameId, regionTitle, notify, type EngineResult } from './helpers';
import { NEUTRAL_AI_ID } from './combat';

export const COMMIT_SIZE = 3;
const MAX_REPORTS = 20;

/** Estimación de los tiers que suele jugar un atacante (cartas altas). */
const TIER_PRIOR: Record<number, number> = { 1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4 };

function pickCards(hand: Card[], ids: unknown): Card[] | string {
    if (!Array.isArray(ids) || ids.length !== COMMIT_SIZE) return `Elegí exactamente ${COMMIT_SIZE} cartas.`;
    if (new Set(ids).size !== ids.length) return 'No se puede repetir una carta.';
    const cards: Card[] = [];
    for (const id of ids) {
        const c = hand.find(x => x.id === id);
        if (!c) return 'Esa carta no está en tu mano.';
        cards.push(c);
    }
    return cards;
}

/**
 * Defensa automática: elige y ordena 3 cartas maximizando la probabilidad de
 * ganar 2 de 3 rondas, conociendo sólo el regimiento de cada ronda.
 */
export function autoDefense(b: BattleState): Card[] {
    const regs = (b.incomingRegiments ?? b.attackerCommit?.map(c => c.regiment) ?? []) as Regiment[];
    const hand = b.defenderHand;
    const pWin = (d: Card, r: Regiment) => {
        const terrain = r === 'A' ? b.defenderBonuses.air : r === 'B' ? b.defenderBonuses.inf : b.defenderBonuses.art;
        const dv = (d.regiment === r ? d.tier : 0) + terrain;
        const bonus = r === 'C' ? b.attackerBonuses.art : r === 'B' ? b.attackerBonuses.inf : (b.attackerBonuses.isPacificFireBonus ? 1 : 0);
        return Object.entries(TIER_PRIOR).reduce((s, [t, p]) => s + (dv >= Number(t) + bonus ? p : 0), 0);
    };
    let best: Card[] = hand.slice(0, COMMIT_SIZE);
    let bestValue = -1;
    for (let i = 0; i < hand.length; i++) for (let j = 0; j < hand.length; j++) for (let k = 0; k < hand.length; k++) {
        if (i === j || i === k || j === k) continue;
        const [a, bb, c] = [pWin(hand[i], regs[0]), pWin(hand[j], regs[1]), pWin(hand[k], regs[2])];
        const v = a * bb + a * c + bb * c - 2 * a * bb * c; // P(ganar al menos 2 de 3)
        if (v > bestValue) { bestValue = v; best = [hand[i], hand[j], hand[k]]; }
    }
    return best;
}

/** Resuelve las 3 rondas, aplica la conquista y deja un informe. Cierra la batalla. */
export function resolveCommitted(state: GameState, defense: Card[], autoDefended: boolean, now: number, random: Random): GameState {
    const b = state.battleState!;
    const attack = b.attackerCommit!;
    const clashes = attack.map((att, i) => {
        const def = defense[i] ?? null;
        const attackerScore = calculateAttackerScore(att, b.attackerBonuses);
        const defenderScore = def ? calculateDefenderScore(att, def, b.defenderBonuses) : calculateDefenderScore(att, { ...att, regiment: 'X' as Regiment }, b.defenderBonuses);
        return { attackerCard: att, defenderCard: def, attackerScore, defenderScore, winner: (attackerScore > defenderScore ? 'attacker' : 'defender') as 'attacker' | 'defender' };
    });
    const attackerWins = clashes.filter(c => c.winner === 'attacker').length;
    const winner: 'attacker' | 'defender' = attackerWins >= 2 ? 'attacker' : 'defender';
    const report: BattleReport = {
        id: makeId('battle', random),
        at: now,
        attacker: b.attacker,
        defender: b.defender,
        sourceId: b.attackSourceId,
        targetId: b.targetRegionId,
        clashes,
        winner,
        autoDefense: autoDefended,
    };

    let next: GameState = {
        ...state,
        battleState: null,
        battleReports: [...state.battleReports, report].slice(-MAX_REPORTS),
    };
    const region = regionTitle(b.targetRegionId);
    if (winner === 'attacker') {
        next = { ...next, owners: { ...next.owners, [b.targetRegionId]: b.attacker.id } };
        next = notify(next, {
            type: 'CONQUEST',
            title: 'CONQUISTA REGIONAL',
            message: `LAS FUERZAS DE ${b.attacker.name.toUpperCase()} HAN TOMADO EL CONTROL DE ${region.toUpperCase()} (${attackerWins}-${3 - attackerWins}).`,
            color: b.attacker.color,
            playerName: b.attacker.name,
        });
    } else {
        next = notify(next, {
            type: 'NEUTRALIZED',
            title: 'OFENSIVA REPELIDA',
            message: `${b.defender.name} resistió el ataque de ${b.attacker.name} sobre ${region} (${3 - attackerWins}-${attackerWins}).`,
            color: b.defender.color,
            playerName: b.defender.name,
        });
    }
    return next;
}

/** BATTLE_COMMIT: el atacante y después el defensor comprometen sus cartas. */
export function commitBattle(state: GameState, actorId: unknown, cardIds: unknown, now: number, random: Random): EngineResult {
    const b = state.battleState;
    if (!b) return fail('No hay batalla en curso.');

    if (b.phase === 'ATTACKER_COMMIT') {
        if (!sameId(b.attacker.id, actorId)) return fail('Ahora compromete sus cartas el atacante.');
        const cards = pickCards(b.attackerHand, cardIds);
        if (typeof cards === 'string') return fail(cards);
        const committed: BattleState = {
            ...b,
            attackerCommit: cards,
            attackerHand: b.attackerHand.filter(c => !cards.includes(c)),
            incomingRegiments: cards.map(c => c.regiment),
            phase: 'DEFENDER_COMMIT',
        };
        const next: GameState = { ...state, battleState: committed };
        if (b.defender.id === NEUTRAL_AI_ID) {
            return ok(resolveCommitted(next, autoDefense(committed), true, now, random));
        }
        return ok(notify(next, {
            type: 'NUCLEAR_ALERT',
            title: 'OFENSIVA EN CURSO',
            message: `${b.attacker.name} ataca ${regionTitle(b.targetRegionId)} desde ${regionTitle(b.attackSourceId)}. Organizá la defensa.`,
            color: '#ff4444',
            targetPlayerId: b.defender.id,
        }));
    }

    if (b.phase === 'DEFENDER_COMMIT') {
        if (!sameId(b.defender.id, actorId)) return fail('Ahora organiza la defensa el defensor.');
        const cards = pickCards(b.defenderHand, cardIds);
        if (typeof cards === 'string') return fail(cards);
        return ok(resolveCommitted(state, cards, false, now, random));
    }
    return fail('Esta batalla no se juega con cartas comprometidas.');
}
