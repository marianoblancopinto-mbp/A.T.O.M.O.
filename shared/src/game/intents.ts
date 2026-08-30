/**
 * Intents — lo que el cliente MANDA al servidor autoritativo.
 *
 * El cliente ya no muta estado ni sincroniza: manda una intención, el servidor la
 * valida (rules) y la aplica con el reducer puro, y difunde el estado resultante.
 *
 * Etapa actual (Fase 2b): el intent es una acción ya computada por el cliente
 * (`kind: 'ACTION'`). Es el puente que permite recablear el cliente sin reescribir
 * toda su lógica de golpe. En fases siguientes se agregarán intents NOMBRADOS
 * (p.ej. `{ kind: 'ATTACK', from, to }`) que el servidor expandirá a acciones,
 * generando el azar (cartas, etc.) del lado del servidor.
 */

import { gameReducer, type GameState, type GameAction } from './reducer';
import { validateAction } from './rules';

export type Intent = { kind: 'ACTION'; action: GameAction };

export type ApplyResult = { state: GameState; ok: boolean; reason?: string };

/**
 * Convierte una acción con payload-función (no serializable) en su equivalente
 * serializable, evaluando la función contra `state`. Las demás acciones pasan
 * sin cambios.
 *
 * Sirve para que el cliente pueda MANDAR sus acciones al servidor: las de tipo
 * `*_FN` llevan una función que no viaja por la red. Se resuelven acá contra el
 * estado actual y se mandan como SET_* (que sí es serializable).
 *
 * OJO: para handlers que despachan VARIAS `*_FN` de forma secuencial e
 * interdependiente en un mismo tick, convertir cada una contra el mismo `state`
 * pierde los cambios previos. Esos handlers deben acumular y despachar una sola
 * acción serializable (ver processTreatyStatus). El resto (una sola *_FN por
 * handler) es seguro.
 */
export function toSerializableAction(action: GameAction, state: GameState): GameAction {
    switch (action.type) {
        case 'UPDATE_PLAYERS_FN':
            return { type: 'SET_PLAYERS', payload: action.payload(state.players) };
        case 'UPDATE_OWNERS_FN':
            return { type: 'SET_OWNERS', payload: action.payload(state.owners) };
        case 'UPDATE_PRODUCTION_DECK_FN':
            return { type: 'SET_PRODUCTION_DECK', payload: action.payload(state.productionDeck) };
        case 'UPDATE_GAME_DATE_FN':
            return { type: 'SET_GAME_DATE', payload: action.payload(state.gameDate) };
        default:
            return action;
    }
}

/**
 * Una acción es serializable si no lleva payload-función (no viaja por la red
 * tal cual). Útil para validar en el borde de envío.
 */
export function isSerializableAction(action: GameAction): boolean {
    return (
        action.type !== 'UPDATE_PLAYERS_FN' &&
        action.type !== 'UPDATE_OWNERS_FN' &&
        action.type !== 'UPDATE_PRODUCTION_DECK_FN' &&
        action.type !== 'UPDATE_GAME_DATE_FN'
    );
}

/**
 * Punto ÚNICO de autoridad: valida y aplica un intent contra el estado.
 * Si la validación falla, devuelve el estado sin cambios y el motivo.
 */
export function applyIntent(
    state: GameState,
    playerId: string | number,
    intent: Intent
): ApplyResult {
    if (intent.kind === 'ACTION') {
        const check = validateAction(state, playerId, intent.action);
        if (!check.ok) {
            return { state, ok: false, reason: check.reason };
        }
        return { state: gameReducer(state, intent.action), ok: true };
    }
    return { state, ok: false, reason: 'Intent desconocido.' };
}
