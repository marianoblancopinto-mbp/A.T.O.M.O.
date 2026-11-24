/**
 * Tratados: propuesta / contraoferta / respuesta / cancelación, y la ejecución
 * de cláusulas al empezar cada año. Todo validado en el servidor: un jugador
 * sólo puede comprometer lo que realmente tiene.
 */

import type { GameState } from '../game/state';
import type { Treaty, TreatyClause, TreatyType } from '../treatyTypes';
import type { TerritoryCard } from '../productionTypes';
import { makeId, type Random } from './rng';
import {
    fail, ok, sameId, getPlayer, owns, isRegion, availableCards, notify, updatePlayer,
    type EngineContext, type EngineResult,
} from './helpers';

const CLAUSE_TYPES: TreatyType[] = ['REGION_CESSION', 'RAW_MATERIAL_CESSION', 'TECH_LOAN', 'TECH_DUPLICATE', 'NON_AGGRESSION'];
const MAX_CLAUSES = 20;

interface ClauseInput {
    type?: unknown;
    duration?: unknown;
    sourcePlayerId?: unknown;
    targetPlayerId?: unknown;
    data?: { cardId?: unknown; regionId?: unknown; regionIds?: unknown };
}

function validateClauses(state: GameState, a: unknown, b: unknown, input: unknown, random: Random): TreatyClause[] | string {
    if (!Array.isArray(input) || input.length === 0) return 'El tratado no tiene cláusulas.';
    if (input.length > MAX_CLAUSES) return 'Demasiadas cláusulas.';
    const out: TreatyClause[] = [];
    for (const raw of input as ClauseInput[]) {
        const type = raw?.type as TreatyType;
        if (!CLAUSE_TYPES.includes(type)) return 'Tipo de cláusula inválido.';
        const src = raw.sourcePlayerId, dst = raw.targetPlayerId;
        const pair = (sameId(src, a) && sameId(dst, b)) || (sameId(src, b) && sameId(dst, a));
        if (!pair) return 'Las cláusulas sólo pueden involucrar a las dos partes del tratado.';
        const duration = typeof raw.duration === 'number' && Number.isInteger(raw.duration) && (raw.duration === -1 || (raw.duration >= 1 && raw.duration <= 50))
            ? raw.duration : -1;
        const source = getPlayer(state, src)!;
        const data: TreatyClause['data'] = {};

        if (type === 'REGION_CESSION') {
            const rid = raw.data?.regionId;
            if (!isRegion(rid) || !owns(state, source.id, rid)) return 'Sólo se puede ceder un territorio propio.';
            data.regionId = rid;
        } else if (type === 'NON_AGGRESSION') {
            const ids = raw.data?.regionIds;
            if (!Array.isArray(ids) || ids.length === 0 || !ids.every(r => isRegion(r) && owns(state, source.id, r as string))) {
                return 'El pacto de no agresión debe listar territorios propios.';
            }
            data.regionIds = [...new Set(ids as string[])];
        } else {
            const cid = raw.data?.cardId;
            const pool = type === 'RAW_MATERIAL_CESSION' ? availableCards(state, source.id).rawMaterials : availableCards(state, source.id).technologies;
            if (typeof cid !== 'string' || !pool.some(c => c.id === cid)) return 'Sólo se pueden comprometer cartas propias.';
            data.cardId = cid;
        }
        out.push({ id: makeId('clause', random), type, duration, sourcePlayerId: source.id, targetPlayerId: getPlayer(state, dst)!.id, data });
    }
    return out;
}

/**
 * Propone un tratado nuevo o manda una contraoferta (con `treatyId`). En la
 * contraoferta, quien la manda pasa a ser el "creador" y el otro debe responder.
 */
export function proposeTreaty(state: GameState, actorId: unknown, input: { treatyId?: unknown; targetPlayerId?: unknown; clauses?: unknown }, ctx: EngineContext): EngineResult {
    const me = getPlayer(state, actorId);
    if (!me || me.isEliminated) return fail('Jugador inválido.');
    const existing = input.treatyId != null ? state.treaties.find(t => t.id === input.treatyId) : undefined;
    if (input.treatyId != null && !existing) return fail('Tratado inexistente.');

    const otherId = existing ? (sameId(existing.creatorId, me.id) ? existing.targetPlayerId : existing.creatorId) : input.targetPlayerId;
    const other = getPlayer(state, otherId);
    if (!other || other.isEliminated || sameId(other.id, me.id)) return fail('Destinatario inválido.');
    if (existing && (existing.status !== 'PENDING_APPROVAL' || !(sameId(existing.creatorId, me.id) || sameId(existing.targetPlayerId, me.id)))) {
        return fail('Ese tratado ya no se puede modificar.');
    }

    const clauses = validateClauses(state, me.id, other.id, input.clauses, ctx.random);
    if (typeof clauses === 'string') return fail(clauses);

    const entry = { date: new Date(ctx.now), action: existing ? 'MODIFIED' : 'CREATED', actorId: me.id };
    const treaty: Treaty = existing
        ? { ...existing, creatorId: me.id, targetPlayerId: other.id, clauses, status: 'PENDING_APPROVAL', history: [...existing.history, entry] }
        : {
            id: makeId('treaty', ctx.random),
            creatorId: me.id,
            targetPlayerId: other.id,
            status: 'PENDING_APPROVAL',
            clauses,
            createdAtMonth: state.turnOrderIndex,
            createdAtYear: state.gameDate.getFullYear(),
            history: [entry],
        };
    const treaties = existing ? state.treaties.map(t => (t.id === treaty.id ? treaty : t)) : [...state.treaties, treaty];
    return ok(notify({ ...state, treaties }, {
        type: 'SECONDARY_MISSION',
        title: existing ? 'CONTRAOFERTA DIPLOMÁTICA' : 'OFERTA DIPLOMÁTICA',
        message: `${me.name} te propone un tratado.`,
        color: '#00ffff',
        targetPlayerId: other.id,
    }));
}

export function respondTreaty(state: GameState, actorId: unknown, treatyId: unknown, accept: unknown, ctx: EngineContext): EngineResult {
    const t = state.treaties.find(x => x.id === treatyId);
    if (!t) return fail('Tratado inexistente.');
    if (t.status !== 'PENDING_APPROVAL' || !sameId(t.targetPlayerId, actorId)) return fail('No te corresponde responder este tratado.');
    const entry = { date: new Date(ctx.now), action: accept ? 'ACCEPTED' : 'REJECTED', actorId: t.targetPlayerId };
    // Las cláusulas se ejecutan al comenzar el año siguiente.
    const updated: Treaty = accept
        ? { ...t, status: 'PENDING_START', createdAtYear: state.gameDate.getFullYear() + 1, history: [...t.history, entry] }
        : { ...t, status: 'REJECTED', history: [...t.history, entry] };
    return ok(notify({ ...state, treaties: state.treaties.map(x => (x.id === t.id ? updated : x)) }, {
        type: 'SECONDARY_MISSION',
        title: accept ? 'TRATADO ACEPTADO' : 'TRATADO RECHAZADO',
        message: accept ? 'Las cláusulas entran en vigor el año próximo.' : 'La contraparte rechazó la oferta.',
        color: accept ? '#00ff00' : '#ff4444',
        targetPlayerId: t.creatorId,
    }));
}

export function cancelTreaty(state: GameState, actorId: unknown, treatyId: unknown): EngineResult {
    const t = state.treaties.find(x => x.id === treatyId);
    if (!t) return fail('Tratado inexistente.');
    if (t.status !== 'PENDING_APPROVAL' || !sameId(t.creatorId, actorId)) return fail('Sólo podés retirar una oferta propia pendiente.');
    return ok({ ...state, treaties: state.treaties.filter(x => x.id !== t.id) });
}

// ============================================================================
// Ejecución anual de cláusulas
// ============================================================================

function moveCard(state: GameState, fromId: unknown, toId: unknown, cardId: string, category: 'rawMaterials' | 'technologies'): GameState {
    const inInventory = getPlayer(state, fromId)?.inventory[category].find(c => c.id === cardId);
    const inDeck = state.productionDeck?.[category].find(c => c.id === cardId);
    let next = state;
    let card: TerritoryCard;
    if (inInventory) {
        card = inInventory;
        next = updatePlayer(next, fromId, p => ({ ...p, inventory: { ...p.inventory, [category]: p.inventory[category].filter(c => c.id !== cardId) } }));
    } else if (inDeck && state.productionDeck && owns(state, fromId, inDeck.country)) {
        // Carta territorial: sale del mazo global y pasa al inventario del receptor.
        card = inDeck;
        next = { ...next, productionDeck: { ...state.productionDeck, [category]: state.productionDeck[category].filter(c => c.id !== cardId) } };
    } else {
        return state; // el cedente ya no la tiene: la cláusula no tiene efecto
    }
    return updatePlayer(next, toId, p => ({ ...p, inventory: { ...p.inventory, [category]: [...p.inventory[category], card] } }));
}

export function processTreatiesForNewYear(state: GameState, random: Random): GameState {
    const year = state.gameDate.getFullYear();
    let next = state;
    for (const treaty of state.treaties) {
        if (treaty.status === 'PENDING_START' && year >= treaty.createdAtYear) {
            for (const c of treaty.clauses) {
                if (c.type === 'REGION_CESSION' && c.data.regionId && owns(next, c.sourcePlayerId, c.data.regionId)) {
                    next = { ...next, owners: { ...next.owners, [c.data.regionId]: c.targetPlayerId } };
                } else if ((c.type === 'RAW_MATERIAL_CESSION' || c.type === 'TECH_LOAN') && c.data.cardId) {
                    next = moveCard(next, c.sourcePlayerId, c.targetPlayerId, c.data.cardId, c.type === 'RAW_MATERIAL_CESSION' ? 'rawMaterials' : 'technologies');
                } else if (c.type === 'TECH_DUPLICATE' && c.data.cardId) {
                    const original = availableCards(next, c.sourcePlayerId).technologies.find(x => x.id === c.data.cardId);
                    if (original) {
                        const dup = { ...original, id: makeId(`dup-${original.id}`, random) };
                        next = updatePlayer(next, c.targetPlayerId, p => ({ ...p, inventory: { ...p.inventory, technologies: [...p.inventory.technologies, dup] } }));
                    }
                }
            }
            next = { ...next, treaties: next.treaties.map(t => (t.id === treaty.id ? { ...t, status: 'ACTIVE' as const, history: [...t.history, { date: new Date(year, 0, 1), action: 'ACTIVATED', actorId: 'SYSTEM' }] } : t)) };
            continue;
        }
        if (treaty.status === 'ACTIVE') {
            const yearsActive = year - treaty.createdAtYear;
            for (const c of treaty.clauses) {
                if (c.duration === -1 || yearsActive !== c.duration) continue;
                if ((c.type === 'RAW_MATERIAL_CESSION' || c.type === 'TECH_LOAN') && c.data.cardId) {
                    next = moveCard(next, c.targetPlayerId, c.sourcePlayerId, c.data.cardId, c.type === 'RAW_MATERIAL_CESSION' ? 'rawMaterials' : 'technologies');
                } else if (c.type === 'REGION_CESSION' && c.data.regionId && owns(next, c.targetPlayerId, c.data.regionId)) {
                    next = { ...next, owners: { ...next.owners, [c.data.regionId]: c.sourcePlayerId } };
                }
            }
            const max = Math.max(...treaty.clauses.map(c => c.duration));
            if (max !== -1 && yearsActive >= max) {
                next = { ...next, treaties: next.treaties.map(t => (t.id === treaty.id ? { ...t, status: 'EXPIRED' as const } : t)) };
            }
        }
    }
    return next;
}
