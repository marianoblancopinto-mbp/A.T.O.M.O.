/**
 * Lógica pura del servidor autoritativo, separada de Colyseus para testearla.
 *
 * La autoridad real vive en @atomo/shared (`applyIntent` valida turno + reglas y
 * corre el reducer). Acá sólo se re-exporta y se agregan helpers del servidor.
 */

import { initialState, applyIntent, type GameState } from '@atomo/shared';

export { applyIntent };

export function createInitialState(): GameState {
    return initialState;
}

/**
 * Snapshot serializable para enviar por la red (Date -> timestamp).
 */
export function toWire(state: GameState) {
    return { ...state, gameDate: state.gameDate.getTime() };
}
