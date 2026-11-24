/**
 * Utilidades puras del motor: búsqueda de jugadores, cartas disponibles,
 * consumo de cartas, rutas de suministro y notificaciones.
 */

import type { GameState, MissionNotification } from '../game/state';
import type { PlayerData } from '../playerTypes';
import type { PlayerRef } from '../gameTypes';
import type { TerritoryCard, SupplyItem, SupplyType } from '../productionTypes';
import { REGIONS } from '../data/mapRegions';
import { checkSupplyRoute } from '../data/mapData';
import type { Random } from './rng';

export interface EngineContext {
    random: Random;
    /** Timestamp del servidor (para createdAt de cartas, etc.). */
    now: number;
}

export type EngineResult = { ok: true; state: GameState } | { ok: false; reason: string };

export const ok = (state: GameState): EngineResult => ({ ok: true, state });
export const fail = (reason: string): EngineResult => ({ ok: false, reason });

export const sameId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b);

export const regionTitle = (id: string | null | undefined) =>
    (id && REGIONS.find(r => r.id === id)?.title) || id || 'Desconocido';

export const isRegion = (id: unknown): id is string =>
    typeof id === 'string' && REGIONS.some(r => r.id === id);

export function playerIndex(state: GameState, id: unknown): number {
    return state.players.findIndex(p => sameId(p.id, id));
}

export function getPlayer(state: GameState, id: unknown): PlayerData | undefined {
    return state.players.find(p => sameId(p.id, id));
}

export function playerRef(p: Pick<PlayerData, 'id' | 'name' | 'color'>): PlayerRef {
    return { id: p.id, name: p.name, color: p.color };
}

export function currentPlayer(state: GameState): PlayerData | undefined {
    return state.players[state.currentPlayerIndex];
}

export function isCurrentPlayer(state: GameState, id: unknown): boolean {
    return sameId(currentPlayer(state)?.id, id);
}

export function owns(state: GameState, playerId: unknown, regionId: string): boolean {
    return sameId(state.owners[regionId], playerId);
}

export function ownedRegions(state: GameState, playerId: unknown): string[] {
    return Object.keys(state.owners).filter(r => owns(state, playerId, r));
}

export function updatePlayer(state: GameState, playerId: unknown, fn: (p: PlayerData) => PlayerData): GameState {
    return { ...state, players: state.players.map(p => (sameId(p.id, playerId) ? fn(p) : p)) };
}

// ============================================================================
// Cartas de producción
// ============================================================================

/**
 * Cartas de las que dispone un jugador: las de sus territorios (mazo global
 * indexado por país) + las de su inventario (cedidas, duplicadas, especiales).
 */
export function availableCards(state: GameState, playerId: unknown): { technologies: TerritoryCard[]; rawMaterials: TerritoryCard[] } {
    const player = getPlayer(state, playerId);
    if (!player) return { technologies: [], rawMaterials: [] };
    const owned = new Set(ownedRegions(state, playerId));
    const deck = state.productionDeck;
    return {
        technologies: [
            ...(deck?.technologies.filter(c => owned.has(c.country)) ?? []),
            ...(player.inventory.technologies ?? []),
        ],
        rawMaterials: [
            ...(deck?.rawMaterials.filter(c => owned.has(c.country)) ?? []),
            ...(player.inventory.rawMaterials ?? []),
        ],
    };
}

export type CardCategory = 'technology' | 'rawMaterial';

/** Requisito de una carta: tipo exacto y (opcional) ruta desde su país hasta `routeTo`. */
export interface CardRequirement {
    id: unknown;
    category: CardCategory;
    type?: string | readonly string[];
    routeTo?: string;
}

/**
 * Valida un conjunto de cartas elegidas por el jugador. Devuelve el motivo del
 * rechazo, o null si todas son válidas, disponibles, no consumidas y distintas.
 */
export function checkCards(state: GameState, playerId: unknown, reqs: CardRequirement[]): string | null {
    const avail = availableCards(state, playerId);
    const seen = new Set<string>();
    for (const r of reqs) {
        if (typeof r.id !== 'string' || !r.id) return 'Falta seleccionar una carta.';
        if (seen.has(r.id)) return 'No se puede usar la misma carta dos veces.';
        seen.add(r.id);
        const pool = r.category === 'technology' ? avail.technologies : avail.rawMaterials;
        const card = pool.find(c => c.id === r.id);
        if (!card) return 'Esa carta no está a tu disposición.';
        if (card.usedThisTurn) return 'Esa carta ya fue consumida esta ronda.';
        if (r.type) {
            const types = typeof r.type === 'string' ? [r.type] : r.type;
            if (!types.includes(card.type)) return 'La carta elegida no es del tipo requerido.';
        }
        if (r.routeTo && !hasRoute(state, playerId, card.country, r.routeTo)) {
            return `No hay ruta de suministro desde ${regionTitle(card.country)} hasta ${regionTitle(r.routeTo)}.`;
        }
    }
    return null;
}

export function findAvailableCard(state: GameState, playerId: unknown, id: string, category: CardCategory): TerritoryCard | undefined {
    const avail = availableCards(state, playerId);
    return (category === 'technology' ? avail.technologies : avail.rawMaterials).find(c => c.id === id);
}

/** Marca cartas como consumidas esta ronda (en el mazo global y en el inventario). */
export function consumeCards(state: GameState, playerId: unknown, ids: string[]): GameState {
    const set = new Set(ids);
    const mark = (cards: TerritoryCard[]) => cards.map(c => (set.has(c.id) ? { ...c, usedThisTurn: true } : c));
    const next = state.productionDeck
        ? { ...state, productionDeck: { technologies: mark(state.productionDeck.technologies), rawMaterials: mark(state.productionDeck.rawMaterials) } }
        : state;
    return updatePlayer(next, playerId, p => ({
        ...p,
        inventory: { technologies: mark(p.inventory.technologies), rawMaterials: mark(p.inventory.rawMaterials) },
    }));
}

// ============================================================================
// Suministros
// ============================================================================

const SUPPLY_TYPES: SupplyType[] = ['food', 'manufacture', 'energy'];

export function findSupply(player: PlayerData, id: unknown): SupplyItem | undefined {
    for (const t of SUPPLY_TYPES) {
        const s = player.supplies[t].find(x => x.id === id);
        if (s) return s;
    }
    return undefined;
}

/**
 * Valida suministros elegidos: que existan, sean distintos y (opcional) de un tipo.
 * Devuelve los ítems o el motivo del rechazo.
 */
export function pickSupplies(player: PlayerData, ids: unknown, expectedTypes?: SupplyType[]): SupplyItem[] | string {
    if (!Array.isArray(ids)) return 'Selección de suministros inválida.';
    if (new Set(ids).size !== ids.length) return 'No se puede usar el mismo suministro dos veces.';
    const items: SupplyItem[] = [];
    for (const id of ids) {
        const s = findSupply(player, id);
        if (!s) return 'No tenés ese suministro.';
        items.push(s);
    }
    if (expectedTypes) {
        const want = [...expectedTypes].sort().join(',');
        const got = items.map(s => s.type).sort().join(',');
        if (want !== got) return 'Los suministros elegidos no son los requeridos.';
    }
    return items;
}

export function removeSupplies(player: PlayerData, ids: string[]): PlayerData {
    const set = new Set(ids);
    return {
        ...player,
        supplies: {
            food: player.supplies.food.filter(s => !set.has(s.id)),
            manufacture: player.supplies.manufacture.filter(s => !set.has(s.id)),
            energy: player.supplies.energy.filter(s => !set.has(s.id)),
        },
    };
}

// ============================================================================
// Rutas de suministro (con conexiones extra de misiones)
// ============================================================================

export function extraAdjacencyFor(state: GameState, player: PlayerData): Record<string, string[]> {
    const extra: Record<string, string[]> = {};
    const link = (a: string, b: string) => {
        (extra[a] ??= []).push(b);
        (extra[b] ??= []).push(a);
    };
    const ownsAll = (ids: string[]) => ids.every(id => owns(state, player.id, id));

    if (player.activeSpecialMissions.some(m => m.id === 'ruta_antartica') && ownsAll(['chile', 'argentina', 'australia', 'sudafrica'])) {
        link('argentina', 'sudafrica');
        link('chile', 'australia');
        link('sudafrica', 'australia');
    }
    if (player.specialCards.some(c => c.type === 'PUENTE_BOSFORO') && ownsAll(['turquia', 'grecia'])) {
        link('turquia', 'grecia');
    }
    return extra;
}

export function hasRoute(state: GameState, playerId: unknown, from: string, to: string): boolean {
    const player = getPlayer(state, playerId);
    if (!player) return false;
    return checkSupplyRoute(from, to, player.id, state.owners, extraAdjacencyFor(state, player));
}

// ============================================================================
// Notificaciones
// ============================================================================

const MAX_NOTIFICATIONS = 30;

/** Agrega una notificación (pública, o privada si trae targetPlayerId). */
export function notify(state: GameState, n: Omit<MissionNotification, 'id'>): GameState {
    const entry: MissionNotification = { ...n, id: state.nextNotificationId };
    return {
        ...state,
        nextNotificationId: state.nextNotificationId + 1,
        notifications: [...state.notifications, entry].slice(-MAX_NOTIFICATIONS),
    };
}
