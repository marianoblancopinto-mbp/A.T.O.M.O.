/**
 * Flujo de ronda: preturno de producción, fin de turno (con cambio de año,
 * condición de victoria, timers de silos) y acciones del anfitrión.
 */

import type { GameState } from '../game/state';
import type { SupplyItem, TechnologyType, RawMaterialType } from '../productionTypes';
import { TECHNOLOGY_REQUIREMENTS, TECHNOLOGY_PRODUCES } from '../productionTypes';
import { shuffled, makeId, type Random } from './rng';
import { processTreatiesForNewYear } from './treaties';
import {
    fail, ok, sameId, getPlayer, currentPlayer, findAvailableCard, consumeCards, notify,
    playerRef, updatePlayer, type EngineContext, type EngineResult,
} from './helpers';

// ============================================================================
// Preturno de producción
// ============================================================================

export function produceSupply(state: GameState, actorId: unknown, techId: unknown, rawId: unknown, ctx: EngineContext): EngineResult {
    if (state.roundPhase !== 'PRODUCTION') return fail('Sólo se pueden producir suministros durante la fase de producción (preturno).');
    const player = getPlayer(state, actorId);
    if (!player || player.isEliminated) return fail('Jugador inválido.');
    if (typeof techId !== 'string' || typeof rawId !== 'string') return fail('Cartas inválidas.');

    const tech = findAvailableCard(state, actorId, techId, 'technology');
    const raw = findAvailableCard(state, actorId, rawId, 'rawMaterial');
    if (!tech || !raw) return fail('Esa carta no está a tu disposición.');
    if (tech.usedThisTurn || raw.usedThisTurn) return fail('Esa carta ya fue consumida esta ronda.');
    const required = TECHNOLOGY_REQUIREMENTS[tech.type as TechnologyType];
    if (required !== (raw.type as RawMaterialType)) return fail('La tecnología no es compatible con esa materia prima.');

    const supply: SupplyItem = { id: makeId('supply', ctx.random), type: TECHNOLOGY_PRODUCES[tech.type as TechnologyType], originCountry: raw.country };
    let next = consumeCards(state, actorId, [techId, rawId]);
    next = updatePlayer(next, actorId, p => ({ ...p, supplies: { ...p.supplies, [supply.type]: [...p.supplies[supply.type], supply] } }));
    return ok(next);
}

export function setProductionReady(state: GameState, actorId: unknown, ready: unknown): EngineResult {
    if (state.roundPhase !== 'PRODUCTION') return fail('No estamos en la fase de producción.');
    const player = getPlayer(state, actorId);
    if (!player || player.isEliminated) return fail('Jugador inválido.');
    const ids = new Set(state.productionReadyIds.map(String));
    if (ready) ids.add(String(player.id)); else ids.delete(String(player.id));
    const active = state.players.filter(p => !p.isEliminated).map(p => String(p.id));
    if (active.length > 0 && active.every(id => ids.has(id))) {
        return ok({ ...state, roundPhase: 'ACTION', productionReadyIds: [] });
    }
    return ok({ ...state, productionReadyIds: [...ids] });
}

// ============================================================================
// Fin de turno
// ============================================================================

function unlockCards(state: GameState): GameState {
    const unlock = <T extends { usedThisTurn?: boolean }>(cards: T[]) => cards.map(c => ({ ...c, usedThisTurn: false }));
    return {
        ...state,
        productionDeck: state.productionDeck
            ? { technologies: unlock(state.productionDeck.technologies), rawMaterials: unlock(state.productionDeck.rawMaterials) }
            : null,
        players: state.players.map(p => ({ ...p, inventory: { technologies: unlock(p.inventory.technologies), rawMaterials: unlock(p.inventory.rawMaterials) } })),
    };
}

export function endTurn(state: GameState, actorId: unknown, ctx: EngineContext): EngineResult {
    if (state.winner || state.gameOver) return fail('La partida terminó.');
    if (state.roundPhase !== 'ACTION') return fail('Todavía es el preturno de producción.');
    if (state.battleState) return fail('Hay una batalla en curso.');
    const me = currentPlayer(state);
    if (!me || !sameId(me.id, actorId)) return fail('No es tu turno.');
    return ok(advanceTurn(state, ctx.random));
}

/** Pasa al siguiente jugador; al cerrar la ronda resuelve victoria y abre el año nuevo. */
export function advanceTurn(state: GameState, random: Random): GameState {
    const { turnOrder, players } = state;
    let next: GameState = { ...state, usedAttackSources: [] };

    const monthsMax = Math.floor(12 / (players.length || 1));
    const date = new Date(state.gameDate);
    date.setMonth(date.getMonth() + Math.floor(random() * (monthsMax + 1)));
    next.gameDate = date;

    // Siguiente jugador no eliminado dentro de la ronda.
    let idx = state.turnOrderIndex + 1;
    while (idx < turnOrder.length && players[turnOrder[idx]]?.isEliminated) idx++;
    const endOfRound = idx >= turnOrder.length;
    let nextPlayerIdx = turnOrder[idx] ?? 0;

    if (endOfRound) {
        const deploying = next.players.filter(p => p.nuclearDeploymentActive && !p.isEliminated);
        if (deploying.length === 1) {
            const w = deploying[0];
            next = { ...next, winner: playerRef(w) };
            return notify(next, {
                type: 'GAME_OVER',
                title: '¡DOMINIO TOTAL!',
                message: `${w.name} ha completado el despliegue nuclear. La guerra ha terminado.`,
                color: w.color,
                playerName: w.name,
            });
        }
        if (deploying.length > 1) {
            next = notify(next, {
                type: 'NEUTRALIZED',
                title: 'DETENCIÓN MUTUA',
                message: `${deploying.map(p => p.name).join(' y ')} desplegaron su arsenal al mismo tiempo: ningún lanzamiento es posible.`,
                color: '#ffaa00',
            });
            // Sólo los silos USADOS en el despliegue entran en enfriamiento por 1 ronda.
            next.players = next.players.map(p => {
                if (!p.nuclearDeploymentActive) return p;
                const siloStatus = { ...p.siloStatus };
                (p.usedNuclearSilos ?? []).forEach(sid => { if (siloStatus[sid]) siloStatus[sid] = { status: 'cooldown', turnsRemaining: 1 }; });
                return { ...p, nuclearDeploymentActive: false, siloStatus };
            });
        }

        // Año nuevo: orden aleatorio, preturno de producción y desbloqueo de cartas.
        const activeIdx = next.players.map((p, i) => ({ p, i })).filter(x => !x.p.isEliminated).map(x => x.i);
        const order = shuffled(activeIdx, random);
        next = {
            ...next,
            gameDate: new Date(state.gameDate.getFullYear() + 1, 0, 1),
            turnOrder: order,
            turnOrderIndex: 0,
            roundPhase: 'PRODUCTION',
            productionReadyIds: [],
        };
        nextPlayerIdx = order[0] ?? 0;
        idx = 0;
        next = unlockCards(next);
        next = processTreatiesForNewYear(next, random);
    }

    // Timers del jugador entrante: silos y energía geotérmica.
    next = {
        ...next,
        turnOrderIndex: idx,
        currentPlayerIndex: nextPlayerIdx,
        players: next.players.map((p, i) => {
            if (i !== nextPlayerIdx) return p;
            const siloStatus: typeof p.siloStatus = {};
            for (const [sid, st] of Object.entries(p.siloStatus)) {
                const turnsRemaining = Math.max(0, st.turnsRemaining - 1);
                siloStatus[sid] = st.turnsRemaining > 0
                    ? { status: turnsRemaining === 0 ? 'active' : st.status, turnsRemaining }
                    : st;
            }
            const geo: SupplyItem[] = p.specialCards
                .filter(c => c.type === 'PLANTA_GEOTERMICA')
                .map(c => ({ id: makeId('geo-energy', random), type: 'energy', originCountry: c.originCountry }));
            return {
                ...p,
                siloStatus,
                mineralUsedThisTurn: false,
                usedNuclearSilos: [],
                supplies: { ...p.supplies, energy: [...p.supplies.energy, ...geo] },
            };
        }),
    };
    return next;
}

// ============================================================================
// Anfitrión
// ============================================================================

const isHost = (state: GameState, actorId: unknown) => sameId(state.hostId, actorId);

export function forceActionPhase(state: GameState, actorId: unknown): EngineResult {
    if (!isHost(state, actorId)) return fail('Sólo el anfitrión puede forzar el inicio de la ronda.');
    if (state.roundPhase !== 'PRODUCTION') return fail('La ronda ya empezó.');
    return ok({ ...state, roundPhase: 'ACTION', productionReadyIds: [] });
}

export function endGame(state: GameState, actorId: unknown): EngineResult {
    if (!isHost(state, actorId)) return fail('Sólo el anfitrión puede finalizar la partida.');
    return ok({ ...state, gameOver: true });
}

export function setEndgameChoice(state: GameState, actorId: unknown, choice: unknown): EngineResult {
    if (!state.winner || !sameId(state.winner.id, actorId)) return fail('Sólo el ganador elige el desenlace.');
    if (choice !== 'victory' && choice !== 'destruction') return fail('Opción inválida.');
    if (state.endgameChoice) return fail('El desenlace ya fue elegido.');
    return ok({ ...state, endgameChoice: choice });
}

export function kickPlayer(state: GameState, actorId: unknown, targetId: unknown, random: Random): EngineResult {
    if (!isHost(state, actorId)) return fail('Sólo el anfitrión puede expulsar jugadores.');
    const kicked = getPlayer(state, targetId);
    if (!kicked || kicked.isEliminated) return fail('Jugador inválido.');
    if (sameId(kicked.id, actorId)) return fail('No podés expulsarte a vos mismo.');

    const overrides: Record<string, string | number | null> = {};
    let battleState = state.battleState;
    if (battleState) {
        if (sameId(battleState.defender.id, kicked.id)) {
            overrides[battleState.targetRegionId] = battleState.attacker.id;
            battleState = null;
        } else if (sameId(battleState.attacker.id, kicked.id)) {
            battleState = null;
        }
    }

    const players = state.players.map(p => (sameId(p.id, kicked.id) ? { ...p, isEliminated: true, nuclearDeploymentActive: false } : p));
    const owners = { ...state.owners, ...overrides };
    const theirs = Object.keys(owners).filter(r => sameId(owners[r], kicked.id));
    const active = players.filter(p => !p.isEliminated);
    const mode = state.settings.abandonmentMode;
    if (mode === 'redistribute' && active.length > 0) {
        shuffled(theirs, random).forEach((r, i) => { owners[r] = active[i % active.length].id; });
    } else {
        theirs.forEach(r => { owners[r] = null; });
    }

    const kickedIdx = state.players.findIndex(p => sameId(p.id, kicked.id));
    const turnOrder = state.turnOrder.filter(i => i !== kickedIdx);
    let next: GameState = { ...state, players, owners, battleState, turnOrder };

    if (sameId(currentPlayer(state)?.id, kicked.id)) {
        const pos = turnOrder.length ? state.turnOrderIndex % turnOrder.length : 0;
        next = { ...next, turnOrderIndex: pos, currentPlayerIndex: turnOrder[pos] ?? 0, usedAttackSources: [] };
    } else {
        const kickedPos = state.turnOrder.indexOf(kickedIdx);
        if (kickedPos !== -1 && kickedPos < state.turnOrderIndex) next = { ...next, turnOrderIndex: Math.max(0, state.turnOrderIndex - 1) };
    }
    next = { ...next, productionReadyIds: next.productionReadyIds.filter(id => !sameId(id, kicked.id)) };
    // Si el expulsado era el único que faltaba marcar LISTO, arranca la ronda.
    if (next.roundPhase === 'PRODUCTION') {
        const act = next.players.filter(p => !p.isEliminated).map(p => String(p.id));
        if (act.length && act.every(id => next.productionReadyIds.includes(id))) next = { ...next, roundPhase: 'ACTION', productionReadyIds: [] };
    }
    return ok(notify(next, {
        type: 'NEUTRALIZED',
        title: 'JUGADOR EXPULSADO',
        message: `EL COMANDANTE ${kicked.name.toUpperCase()} HA SIDO EXPULSADO. SUS REGIONES AHORA SON ${mode === 'neutralize' ? 'NEUTRALES' : 'ADMINISTRADAS POR EL RESTO'}.`,
        color: '#ff4444',
    }));
}
