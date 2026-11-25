/**
 * Proyección del estado por jugador: lo que el servidor le manda a CADA
 * cliente. Misma forma que GameState, con lo ajeno redactado.
 *
 * Regla general: de un rival sólo se ve lo que se vería en la mesa (nombre,
 * color, países en el mapa, si fue eliminado y si inició un despliegue nuclear,
 * que se anuncia a todos). Su mano de cartas, suministros, mineral secreto,
 * silos, misiones y redes de espionaje NO viajan: para conocerlos hay que
 * espiar (el informe llega en `intelReports`, sólo al espía).
 */

import type { GameState } from '../game/state';
import type { PlayerData } from '../playerTypes';
import type { BattleState } from '../gameTypes';
import { sameId } from './helpers';

/**
 * El defensor ve la carta del atacante antes de responder. Es el comportamiento
 * actual del juego (y sobre el que está calibrada la IA neutral), aunque el
 * manual dice lo contrario. Queda como bandera explícita para la etapa de reglas.
 */
export const REVEAL_ATTACKER_CARD_TO_DEFENDER = true;

export function redactPlayer(p: PlayerData): PlayerData {
    return {
        id: p.id,
        name: p.name,
        color: p.color,
        isEliminated: p.isEliminated,
        nuclearDeploymentActive: p.nuclearDeploymentActive,
        supplies: { food: [], manufacture: [], energy: [] },
        resources: { rawMaterials: 0, technology: 0 },
        inventory: { rawMaterials: [], technologies: [] },
        specialCards: [],
        secretMineralLocation: null,
        silos: [],
        siloStatus: {},
        siloFuelCards: {},
        mineralUsedThisTurn: false,
        usedEspionageHqs: [],
        usedNuclearSilos: [],
        activeSpecialMissions: [],
        secretWarData: [],
        intelReports: [],
    };
}

function projectBattle(b: BattleState, viewerId: unknown): BattleState {
    const isAttacker = sameId(b.attacker.id, viewerId);
    const isDefender = sameId(b.defender.id, viewerId);
    const { isAiCheating: _hidden, ...rest } = b;
    const view: BattleState = { ...rest, deck: [] };
    // Correspondencia: el ataque comprometido sólo lo ve el atacante; los demás ven el regimiento de cada ronda.
    if (!isAttacker) view.attackerCommit = null;
    if (isAttacker) {
        view.defenderHand = [];
        view.opponentHandSize = b.defenderHand.length;
    } else if (isDefender) {
        view.attackerHand = [];
        view.opponentHandSize = b.attackerHand.length;
        if (!REVEAL_ATTACKER_CARD_TO_DEFENDER && b.phase === 'DEFENDER_SELECTION') view.currentAttackerCard = null;
    } else {
        view.attackerHand = [];
        view.defenderHand = [];
        if (b.phase === 'DEFENDER_SELECTION') view.currentAttackerCard = null;
    }
    return view;
}

/** `viewerId` null = espectador (no ve nada privado de nadie). */
export function projectFor(state: GameState, viewerId: string | number | null): GameState {
    const notifications = state.notifications.filter(n => n.targetPlayerId == null || sameId(n.targetPlayerId, viewerId));
    return {
        ...state,
        players: state.players.map(p => (sameId(p.id, viewerId) ? p : redactPlayer(p))),
        treaties: state.treaties.filter(t => sameId(t.creatorId, viewerId) || sameId(t.targetPlayerId, viewerId)),
        battleState: state.battleState ? projectBattle(state.battleState, viewerId) : null,
        notifications,
        notification: notifications[notifications.length - 1] ?? null,
    };
}
