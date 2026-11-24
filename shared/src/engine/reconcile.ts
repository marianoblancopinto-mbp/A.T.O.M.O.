/**
 * Invariantes que se recalculan tras CADA comando, en el servidor.
 *
 * Antes vivían en useEffect de TegMap y corrían en TODOS los clientes a la vez,
 * cada uno mandando su propio SET_PLAYERS (carreras y pisadas). Ahora corren una
 * sola vez, en un único lugar:
 *  - cartas especiales cuyo país de origen se perdió → se pierden;
 *  - silos en países perdidos → destruidos (aviso privado);
 *  - despliegue nuclear sin silo propio → abortado (aviso privado);
 *  - misiones cuya base se perdió → canceladas (aviso público);
 *  - rutas de combustible/mineral hacia un silo que se cortan → aviso privado.
 */

import type { GameState } from '../game/state';
import type { PlayerData } from '../playerTypes';
import { availableCards, hasRoute, notify, owns, regionTitle, sameId } from './helpers';

function siloRoutes(state: GameState, p: PlayerData): Record<string, { fuel: boolean; mineral: boolean }> {
    const out: Record<string, { fuel: boolean; mineral: boolean }> = {};
    const mineral = p.specialCards.find(c => c.type === 'SECRET_MINERAL');
    const raws = availableCards(state, p.id).rawMaterials;
    for (const siloId of p.silos) {
        const fuelId = p.siloFuelCards?.[siloId];
        const fuel = fuelId ? raws.find(c => c.id === fuelId) ?? p.inventory.rawMaterials.find(c => c.id === fuelId) : undefined;
        out[siloId] = {
            fuel: fuel?.country ? hasRoute(state, p.id, fuel.country, siloId) : true,
            mineral: mineral ? hasRoute(state, p.id, mineral.originCountry, siloId) : true,
        };
    }
    return out;
}

export function reconcile(prev: GameState, next: GameState): GameState {
    if (!next.gameStarted || next.winner) return next;
    let state = next;

    // 1) Propiedad: cartas, silos, despliegue y misiones.
    const players = state.players.map(p => {
        let q = p;
        const lostSilos = q.silos.filter(id => !owns(state, q.id, id));
        if (lostSilos.length) {
            const siloStatus = { ...q.siloStatus };
            const siloFuelCards = { ...q.siloFuelCards };
            lostSilos.forEach(id => { delete siloStatus[id]; delete siloFuelCards[id]; });
            q = { ...q, silos: q.silos.filter(id => !lostSilos.includes(id)), siloStatus, siloFuelCards };
            for (const sid of lostSilos) {
                state = notify(state, {
                    type: 'NEUTRALIZED',
                    title: 'SILO DESTRUIDO',
                    message: `El silo en ${regionTitle(sid)} ha sido capturado y desmantelado. Tendrás que construir otro para recuperar tu capacidad de ataque nuclear.`,
                    color: '#ff4444',
                    targetPlayerId: q.id,
                });
            }
        }

        const validCards = q.specialCards.filter(c => owns(state, q.id, c.originCountry));
        if (validCards.length !== q.specialCards.length) q = { ...q, specialCards: validCards };

        if (q.nuclearDeploymentActive && !q.silos.some(id => owns(state, q.id, id))) {
            q = { ...q, nuclearDeploymentActive: false };
            state = notify(state, {
                type: 'NEUTRALIZED',
                title: 'DESPLIEGUE NEUTRALIZADO',
                message: 'Has perdido tus silos de lanzamiento estratégicos. El despliegue nuclear ha sido abortado.',
                color: '#ff0000',
                targetPlayerId: q.id,
            });
        }

        const lostMissions = q.activeSpecialMissions.filter(m => m.baseRegionId && !owns(state, q.id, m.baseRegionId));
        if (lostMissions.length) {
            q = {
                ...q,
                activeSpecialMissions: q.activeSpecialMissions.filter(m => !lostMissions.includes(m)),
                specialCards: q.specialCards.filter(c =>
                    !lostMissions.some(m => m.id === 'ruta_antartica' && c.name === 'RUTA ANTÁRTICA' && c.originCountry === m.baseRegionId)),
            };
            for (const m of lostMissions) {
                state = notify(state, {
                    type: 'NEUTRALIZED',
                    title: 'OPERACIÓN ESPECIAL ABORTADA',
                    message: `La base de operaciones en ${regionTitle(m.baseRegionId)} ha caído. La misión ${m.id} ha sido cancelada.`,
                    color: '#ff4444',
                    playerName: q.name,
                });
            }
        }
        return q;
    });
    state = { ...state, players };

    // 2) Rutas hacia los silos: avisar sólo cuando una ruta pasa de OK a cortada.
    for (const p of state.players) {
        const before = prev.players.find(x => sameId(x.id, p.id));
        if (!before || p.silos.length === 0) continue;
        const was = siloRoutes(prev, before);
        const now = siloRoutes(state, p);
        for (const siloId of Object.keys(now)) {
            const w = was[siloId] ?? { fuel: true, mineral: true };
            if (w.fuel && !now[siloId].fuel) {
                state = notify(state, {
                    type: 'NEUTRALIZED',
                    title: 'RUTA DE COMBUSTIBLE CORTADA',
                    message: `Se ha perdido la ruta de suministro de combustible hacia el silo en ${regionTitle(siloId)}.`,
                    color: '#ff9900',
                    targetPlayerId: p.id,
                });
            }
            if (w.mineral && !now[siloId].mineral) {
                state = notify(state, {
                    type: 'NEUTRALIZED',
                    title: 'SUMINISTRO DE MINERAL INTERRUMPIDO',
                    message: `La ruta desde el yacimiento de Mineral Secreto hasta el silo en ${regionTitle(siloId)} ha sido bloqueada.`,
                    color: '#ff9900',
                    targetPlayerId: p.id,
                });
            }
        }
    }
    return state;
}
