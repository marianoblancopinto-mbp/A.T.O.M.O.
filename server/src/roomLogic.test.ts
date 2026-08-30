/**
 * Tests de la lógica del servidor autoritativo.
 * Verifican que el servidor corre la MISMA autoridad (applyIntent) de shared.
 */

import { describe, it, expect } from 'vitest';
import { createInitialState, applyIntent, toWire } from './roomLogic';

describe('roomLogic (servidor autoritativo)', () => {
    it('createInitialState devuelve el estado inicial del juego', () => {
        const s = createInitialState();
        expect(s.gameStarted).toBe(false);
        expect(s.players).toEqual([]);
    });

    it('applyIntent valida y aplica (START_GAME arranca la partida)', () => {
        const s0 = createInitialState();
        const res = applyIntent(s0, 'host', {
            kind: 'ACTION',
            action: { type: 'START_GAME', payload: { players: [], owners: {}, settings: s0.settings } },
        });
        expect(res.ok).toBe(true);
        expect(res.state.gameStarted).toBe(true);
        expect(res.state.gamePhase).toBe('playing');
    });

    it('toWire serializa gameDate como timestamp', () => {
        const s = createInitialState();
        const wire = toWire(s);
        expect(typeof wire.gameDate).toBe('number');
        expect(wire.gameDate).toBe(s.gameDate.getTime());
    });
});
