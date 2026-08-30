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
