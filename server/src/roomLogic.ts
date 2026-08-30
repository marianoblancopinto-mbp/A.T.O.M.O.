/**
 * Lógica pura del servidor autoritativo, separada de Colyseus para poder testearla.
 *
 * Por ahora aplica las acciones directamente con el reducer de @atomo/shared.
 * En la Fase 2b, `applyAction` será el ÚNICO punto donde se valida turno + reglas
 * (a partir de Intents del cliente) antes de correr el reducer.
 */

import { gameReducer, initialState, type GameState, type GameAction } from '@atomo/shared';

export function createInitialState(): GameState {
    return initialState;
}

/**
 * Aplica una acción al estado autoritativo. Punto único de autoridad del servidor.
 * TODO (Fase 2b): recibir Intents, validar turno + legalidad, y recién ahí reducir.
 */
export function applyAction(state: GameState, action: GameAction): GameState {
    return gameReducer(state, action);
}

/**
 * Snapshot serializable para enviar por la red (Date -> timestamp).
 */
export function toWire(state: GameState) {
    return { ...state, gameDate: state.gameDate.getTime() };
}
