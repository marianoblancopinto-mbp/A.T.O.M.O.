/**
 * Tests de la lógica del servidor autoritativo.
 * Verifican que el servidor corre el MISMO reducer puro que el cliente (shared).
 */

import { describe, it, expect } from 'vitest';
import { createInitialState, applyAction, toWire } from './roomLogic';

describe('roomLogic (servidor autoritativo)', () => {
    it('createInitialState devuelve el estado inicial del juego', () => {
        const s = createInitialState();
        expect(s.gameStarted).toBe(false);
        expect(s.players).toEqual([]);
    });

    it('applyAction corre el reducer de shared (START_GAME arranca la partida)', () => {
        const s0 = createInitialState();
        const s1 = applyAction(s0, {
            type: 'START_GAME',
            payload: { players: [], owners: {}, settings: s0.settings },
        });
        expect(s1.gameStarted).toBe(true);
        expect(s1.gamePhase).toBe('playing');
    });

    it('toWire serializa gameDate como timestamp', () => {
        const s = createInitialState();
        const wire = toWire(s);
        expect(typeof wire.gameDate).toBe('number');
        expect(wire.gameDate).toBe(s.gameDate.getTime());
    });
});
