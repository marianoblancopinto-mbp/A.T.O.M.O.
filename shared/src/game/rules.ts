/**
 * Reglas de validación del servidor autoritativo.
 *
 * Deciden si un jugador PUEDE ejecutar una acción en el estado actual. Antes esta
 * lógica vivía dispersa en el cliente (dispatchWithSync); ahora es la autoridad
 * compartida que corre el servidor. Es pura y testeable.
 *
 * Regla del juego: la ÚNICA acción restringida por turno es ATACAR. Terminar el
 * turno también es del jugador activo. Las acciones de batalla sólo las pueden
 * ejecutar los participantes. El resto es libre (sobre los recursos propios;
 * la validación de "propiedad" fina queda como refinamiento futuro).
 */

import type { GameState, GameAction } from './reducer';

export function getCurrentPlayerId(state: GameState): string | number | null {
    const p = state.players[state.currentPlayerIndex];
    return p ? p.id : null;
}

export function isPlayersTurn(state: GameState, playerId: string | number): boolean {
    return String(getCurrentPlayerId(state)) === String(playerId);
}

export function isBattleParticipant(state: GameState, playerId: string | number): boolean {
    const b = state.battleState;
    if (!b) return false;
    return String(b.attacker?.id) === String(playerId) || String(b.defender?.id) === String(playerId);
}

// Acciones que SÓLO puede ejecutar el jugador activo.
const TURN_RESTRICTED: ReadonlySet<GameAction['type']> = new Set([
    'INIT_BATTLE',        // atacar (la única restringida por turno según las reglas)
    'NEXT_TURN',
    'PROCESS_TURN_CHANGE',
]);

// Acciones de batalla: sólo un participante (atacante o defensor) puede ejecutarlas.
const BATTLE_ACTIONS: ReadonlySet<GameAction['type']> = new Set([
    'BATTLE_ATTACKER_SELECT',
    'BATTLE_DEFENDER_SELECT',
    'BATTLE_NEXT_ROUND',
    'UPDATE_BATTLE',
    'END_BATTLE',
]);

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Valida si `playerId` puede ejecutar `action` en `state`.
 */
export function validateAction(
    state: GameState,
    playerId: string | number,
    action: GameAction
): ValidationResult {
    if (TURN_RESTRICTED.has(action.type) && !isPlayersTurn(state, playerId)) {
        return { ok: false, reason: `La acción ${action.type} sólo se permite en tu turno.` };
    }

    // Las acciones de batalla se validan sólo si hay una batalla activa: el que las
    // manda debe ser participante. (INIT_BATTLE ya quedó cubierta por el turno.)
    if (BATTLE_ACTIONS.has(action.type) && state.battleState && !isBattleParticipant(state, playerId)) {
        return { ok: false, reason: `La acción ${action.type} sólo la pueden ejecutar los participantes de la batalla.` };
    }

    return { ok: true };
}
