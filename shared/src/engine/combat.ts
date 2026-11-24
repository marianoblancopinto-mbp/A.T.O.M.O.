/**
 * Combate autoritativo. El servidor valida el ataque, calcula los bonos, baraja
 * el mazo, reparte las manos, resuelve cada choque y juega por la IA neutral.
 * El cliente sólo elige cartas de SU mano.
 */

import type { GameState } from '../game/state';
import type { BattleState, Card, Regiment, Tier } from '../gameTypes';
import type { PlayerData } from '../playerTypes';
import { REGION_ADJACENCY, MARITIME_ROUTES, isMaritimeConnection } from '../data/mapData';
import { calculateRegionBonuses } from '../data/biomeData';
import { calculateAttackerScore, calculateDefenderScore, selectBestDefenderCard } from './ai';
import { shuffled, type Random } from './rng';
import {
    fail, ok, sameId, getPlayer, currentPlayer, owns, playerRef, regionTitle, isRegion,
    notify, pickSupplies, updatePlayer, removeSupplies, hasRoute, type EngineResult,
} from './helpers';

export const NEUTRAL_AI_ID = 'neutral_ai';
export const NEUTRAL_AI_REF = { id: NEUTRAL_AI_ID, name: 'Fuerzas Locales', color: '#ffffff' };
export const HAND_SIZE = 5;

const hasCard = (p: PlayerData, type: string) => p.specialCards.some(c => c.type === type);

/** Países desde los que se puede atacar `targetId` (sin filtrar por dueño). */
export function neighborsOf(attacker: PlayerData, targetId: string): string[] {
    const n = new Set<string>(REGION_ADJACENCY[targetId] ?? []);
    for (const [a, b] of MARITIME_ROUTES) {
        if (a === targetId) n.add(b);
        if (b === targetId) n.add(a);
    }
    const wrap: Record<string, string> = { alaska: 'kamchakta', kamchakta: 'alaska', chile: 'australia', australia: 'chile' };
    if (wrap[targetId]) n.add(wrap[targetId]);
    if (hasCard(attacker, 'ALEJANDRO_MAGNO') || hasCard(attacker, 'LEGADO_OTOMANO')) {
        if (targetId === 'grecia') n.add('turquia');
        if (targetId === 'turquia') n.add('grecia');
    }
    return [...n];
}

/** Regiones desde las que un Pacto de No Agresión le prohíbe a `attackerId` atacar a `defenderId`. */
function restrictedByTreaties(state: GameState, attackerId: unknown, defenderId: unknown): Set<string> {
    const out = new Set<string>();
    if (defenderId == null) return out;
    for (const t of state.treaties) {
        if (t.status !== 'ACTIVE') continue;
        for (const c of t.clauses) {
            if (c.type === 'NON_AGGRESSION' && sameId(c.sourcePlayerId, attackerId) && sameId(c.targetPlayerId, defenderId)) {
                c.data.regionIds?.forEach(r => out.add(r));
            }
        }
    }
    return out;
}

/** Orígenes válidos para que el jugador activo ataque `targetId` ahora. */
export function validAttackSources(state: GameState, attackerId: unknown, targetId: string): string[] {
    const attacker = getPlayer(state, attackerId);
    if (!attacker || !isRegion(targetId) || owns(state, attackerId, targetId)) return [];
    const restricted = restrictedByTreaties(state, attackerId, state.owners[targetId]);
    return neighborsOf(attacker, targetId).filter(src =>
        owns(state, attackerId, src) && !state.usedAttackSources.includes(src) && !restricted.has(src));
}

export function computeBonuses(state: GameState, attacker: PlayerData, sourceId: string, targetId: string) {
    const isMaritime = isMaritimeConnection(sourceId, targetId);
    const zone = (ids: string[]) => ids.includes(sourceId) && ids.includes(targetId);
    const isAndesCrossing = hasCard(attacker, 'CRUCE_ANDES') && sourceId === 'argentina' && targetId === 'chile';
    const isNormandy = hasCard(attacker, 'NORMANDY_LANDING') && sourceId === 'reino_unido' && targetId === 'francia';
    const isAlejandroBonus = hasCard(attacker, 'ALEJANDRO_MAGNO') && zone(['grecia', 'turquia', 'egipto', 'iran']);
    const isOtomanoBonus = hasCard(attacker, 'LEGADO_OTOMANO') && zone(['turquia', 'egipto', 'arabia', 'grecia']);
    const isGengisBonus = hasCard(attacker, 'GENGIS_KHAN') && zone(['mongolia', 'kazajistan', 'china', 'rusia']);
    const isBolivarBonus = hasCard(attacker, 'BOLIVAR') && zone(['venezuela', 'colombia', 'panama', 'peru']);
    const isPacificFireBonus = hasCard(attacker, 'PACIFIC_FIRE') && zone(['japon', 'korea', 'kamchakta', 'filipinas']);

    const defender = getPlayer(state, state.owners[targetId]);
    const isGoldenDomeBonus = ['nueva_york', 'california', 'texas', 'flordia', 'alaska'].includes(targetId) &&
        !!defender?.activeSpecialMissions.some(m => m.id === 'golden_dome');

    const attackerBonuses = {
        art: (isMaritime ? 1 : 0) + (isNormandy ? 1 : 0),
        inf: (isMaritime ? -1 : 0) + (isAndesCrossing ? 1 : 0) + (isNormandy ? (isMaritime ? 2 : 1) : 0)
            + (isAlejandroBonus ? 1 : 0) + (isOtomanoBonus ? 1 : 0) + (isGengisBonus ? 1 : 0) + (isBolivarBonus ? 1 : 0),
        isMaritime, isAndesCrossing, isNormandy, isAlejandroBonus, isOtomanoBonus,
        isGengisBonus, isBolivarBonus, isPacificFireBonus,
    };
    const terrain = calculateRegionBonuses(targetId);
    const defenderBonuses = { ...terrain, air: terrain.air + (isGoldenDomeBonus ? 1 : 0), isGoldenDomeBonus };
    return { attackerBonuses, defenderBonuses };
}

export function buildDeck(random: Random): Card[] {
    const deck: Card[] = [];
    let n = 0;
    for (const regiment of ['A', 'B', 'C'] as Regiment[]) {
        for (const tier of [1, 2, 3, 4] as Tier[]) {
            for (let variant = 0; variant < 5; variant++) {
                deck.push({ id: `card-${n++}`, regiment, tier, variant });
            }
        }
    }
    return shuffled(deck, random);
}

// ============================================================================
// Comandos de batalla
// ============================================================================

export function attack(state: GameState, actorId: unknown, sourceId: unknown, targetId: unknown, random: Random): EngineResult {
    if (state.roundPhase !== 'ACTION') return fail('No se puede atacar durante la fase de producción (preturno).');
    if (state.battleState) return fail('Ya hay una batalla en curso.');
    const attacker = currentPlayer(state);
    if (!attacker || !sameId(attacker.id, actorId)) return fail('Sólo podés atacar en tu turno.');
    if (!isRegion(sourceId) || !isRegion(targetId)) return fail('Región inválida.');
    if (!validAttackSources(state, actorId, targetId).includes(sourceId)) {
        return fail('No podés atacar ese país desde ese origen (no es limítrofe, ya atacó este turno o lo impide un tratado).');
    }

    const defenderId = state.owners[targetId];
    const defenderPlayer = defenderId == null ? undefined : getPlayer(state, defenderId);
    if (defenderId != null && (!defenderPlayer || defenderPlayer.isEliminated)) return fail('Defensor inválido.');
    const defender = defenderPlayer ? playerRef(defenderPlayer) : { ...NEUTRAL_AI_REF };

    const { attackerBonuses, defenderBonuses } = computeBonuses(state, attacker, sourceId, targetId);
    const deck = buildDeck(random);
    const attackerHand = deck.splice(0, HAND_SIZE);
    const defenderHand = deck.splice(0, HAND_SIZE);

    const isNeutral = defender.id === NEUTRAL_AI_ID;
    const isAiCheating = isNeutral && Math.floor(random() * 100) + 1 <= (state.settings.aiDifficulty ?? 50);

    const battle: BattleState = {
        isActive: true,
        attacker: playerRef(attacker),
        defender,
        attackerHand,
        defenderHand,
        attackerBonuses,
        defenderBonuses,
        attackSourceId: sourceId,
        targetRegionId: targetId,
        deck,
        phase: 'ATTACKER_SELECTION',
        currentAttackerCard: null,
        currentDefenderCard: null,
        clashResult: null,
        roundCount: 0,
        attackerWins: 0,
        defenderWins: 0,
        isAiCheating,
    };
    return ok({ ...state, battleState: battle, usedAttackSources: [...state.usedAttackSources, sourceId] });
}

function resolveClash(b: BattleState, defCardId: string): BattleState {
    const att = b.currentAttackerCard!;
    const def = b.defenderHand.find(c => c.id === defCardId)!;
    const attackerScore = calculateAttackerScore(att, b.attackerBonuses);
    const defenderScore = calculateDefenderScore(att, def, b.defenderBonuses);
    const attackerWins = attackerScore > defenderScore;
    const name = (r: Regiment) => (r === 'A' ? 'Aéreo' : r === 'B' ? 'Inf.' : 'Art.');
    return {
        ...b,
        defenderHand: b.defenderHand.filter(c => c.id !== defCardId),
        currentDefenderCard: def,
        phase: 'RESOLUTION',
        aiPending: false,
        clashResult: {
            winner: attackerWins ? 'attacker' : 'defender',
            reason: attackerWins
                ? `VICTORIA ATACANTE: ${name(att.regiment)} (${attackerScore}) vs ${name(def.regiment)} (${defenderScore})`
                : `DEFENSA EXITOSA: ${name(def.regiment)} (${defenderScore}) vs ${name(att.regiment)} (${attackerScore})`,
        },
        attackerWins: b.attackerWins + (attackerWins ? 1 : 0),
        defenderWins: b.defenderWins + (attackerWins ? 0 : 1),
    };
}

export function playCard(state: GameState, actorId: unknown, cardId: unknown): EngineResult {
    const b = state.battleState;
    if (!b) return fail('No hay batalla en curso.');
    if (typeof cardId !== 'string') return fail('Carta inválida.');

    if (b.phase === 'ATTACKER_SELECTION') {
        if (!sameId(b.attacker.id, actorId)) return fail('Ahora elige el atacante.');
        const card = b.attackerHand.find(c => c.id === cardId);
        if (!card) return fail('Esa carta no está en tu mano.');
        const isNeutral = b.defender.id === NEUTRAL_AI_ID;
        return ok({
            ...state,
            battleState: {
                ...b,
                attackerHand: b.attackerHand.filter(c => c.id !== cardId),
                currentAttackerCard: card,
                phase: 'DEFENDER_SELECTION',
                aiPending: isNeutral,
            },
        });
    }
    if (b.phase === 'DEFENDER_SELECTION') {
        if (b.defender.id === NEUTRAL_AI_ID || !sameId(b.defender.id, actorId)) return fail('Ahora elige el defensor.');
        if (!b.defenderHand.some(c => c.id === cardId)) return fail('Esa carta no está en tu mano.');
        return ok({ ...state, battleState: resolveClash(b, cardId) });
    }
    return fail('No es momento de jugar una carta.');
}

/** ¿El servidor tiene que jugar por la IA neutral? */
export function needsAiMove(state: GameState): boolean {
    const b = state.battleState;
    return !!b && b.phase === 'DEFENDER_SELECTION' && b.defender.id === NEUTRAL_AI_ID && b.defenderHand.length > 0;
}

/** La IA neutral elige su carta (la ejecuta el servidor, nunca el atacante). */
export function aiMove(state: GameState): GameState {
    const b = state.battleState;
    if (!b || !needsAiMove(state) || !b.currentAttackerCard) return state;
    let card: Card;
    try {
        card = selectBestDefenderCard(
            b.currentAttackerCard, b.attackerBonuses, b.defenderHand, b.defenderBonuses,
            b.attackerHand, !!b.isAiCheating,
            { attackerWins: b.attackerWins, defenderWins: b.defenderWins, roundCount: b.roundCount },
        );
    } catch {
        card = b.defenderHand[0];
    }
    if (!b.defenderHand.some(c => c.id === card?.id)) card = b.defenderHand[0];
    return { ...state, battleState: resolveClash(b, card.id) };
}

export function nextRound(state: GameState, actorId: unknown): EngineResult {
    const b = state.battleState;
    if (!b || b.phase !== 'RESOLUTION') return fail('No es momento de pasar de ronda.');
    if (!sameId(b.attacker.id, actorId) && !sameId(b.defender.id, actorId)) return fail('No participás de esta batalla.');

    const over = b.attackerWins >= 2 || b.defenderWins >= 2 || b.roundCount >= 2
        || b.attackerHand.length === 0 || b.defenderHand.length === 0;
    if (!over) {
        return ok({
            ...state,
            battleState: { ...b, currentAttackerCard: null, currentDefenderCard: null, clashResult: null, phase: 'ATTACKER_SELECTION', roundCount: b.roundCount + 1 },
        });
    }

    const attackerWon = b.attackerWins > b.defenderWins;
    let next: GameState = { ...state, battleState: { ...b, phase: attackerWon ? 'VICTORY' : 'DEFEAT' } };
    if (attackerWon) {
        next = { ...next, owners: { ...next.owners, [b.targetRegionId]: b.attacker.id } };
        next = notify(next, {
            type: 'CONQUEST',
            title: 'CONQUISTA REGIONAL',
            message: `LAS FUERZAS DE ${b.attacker.name.toUpperCase()} HAN TOMADO EL CONTROL DE ${regionTitle(b.targetRegionId).toUpperCase()}.`,
            color: b.attacker.color,
            playerName: b.attacker.name,
        });
    }
    return ok(next);
}

/** Cierra la pantalla de batalla (sólo cuando ya terminó). */
export function closeBattle(state: GameState, actorId: unknown): EngineResult {
    const b = state.battleState;
    if (!b) return fail('No hay batalla en curso.');
    if (b.phase !== 'VICTORY' && b.phase !== 'DEFEAT') return fail('La batalla todavía no terminó.');
    if (!sameId(b.attacker.id, actorId) && !sameId(b.defender.id, actorId)) return fail('No participás de esta batalla.');
    return ok({ ...state, battleState: null });
}

/** Gasta suministros en batalla para robar cartas: 1 set completo = 4 cartas, suelto = 1. */
export function useBattleSupplies(state: GameState, actorId: unknown, supplyIds: unknown): EngineResult {
    const b = state.battleState;
    if (!b || b.phase === 'VICTORY' || b.phase === 'DEFEAT') return fail('No hay batalla en curso.');
    const role = sameId(b.attacker.id, actorId) ? 'attacker' : sameId(b.defender.id, actorId) ? 'defender' : null;
    if (!role) return fail('No participás de esta batalla.');
    const player = getPlayer(state, actorId)!;
    const items = pickSupplies(player, supplyIds);
    if (typeof items === 'string') return fail(items);
    if (items.length === 0) return fail('No elegiste suministros.');
    // Los suministros tienen que poder llegar al frente: el país de origen del ataque o el defendido.
    const front = role === 'attacker' ? b.attackSourceId : b.targetRegionId;
    if (items.some(s => !hasRoute(state, actorId, s.originCountry, front))) return fail('Algún suministro no tiene ruta hasta el frente.');

    const count = (t: string) => items.filter(s => s.type === t).length;
    let m = count('manufacture'), f = count('food'), e = count('energy'), sets = 0;
    while (m > 0 && f > 0 && e > 0) { sets++; m--; f--; e--; }
    const drawCount = sets * 4 + m + f + e;

    const deck = [...b.deck];
    const drawn = deck.splice(0, drawCount);
    let next = updatePlayer(state, actorId, p => removeSupplies(p, items.map(s => s.id)));
    next = {
        ...next,
        battleState: {
            ...b,
            deck,
            attackerHand: role === 'attacker' ? [...b.attackerHand, ...drawn] : b.attackerHand,
            defenderHand: role === 'defender' ? [...b.defenderHand, ...drawn] : b.defenderHand,
        },
    };
    return ok(next);
}
