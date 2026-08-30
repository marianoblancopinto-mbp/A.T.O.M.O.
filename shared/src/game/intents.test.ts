/**
 * Tests de validación de reglas e intents (autoridad del servidor).
 */

import { describe, it, expect } from 'vitest';
import { applyIntent } from './intents';
import { validateAction } from './rules';
import { initialState, sanitizePlayer, type GameState } from './reducer';
import type { BattleState } from '../gameTypes';

const mkPlayer = (id: string) => sanitizePlayer({ id, name: id.toUpperCase(), color: '#123456' });

const baseState = (over: Partial<GameState> = {}): GameState => ({
    ...initialState,
    gameStarted: true,
    gamePhase: 'playing',
    players: [mkPlayer('p0'), mkPlayer('p1')],
    numPlayers: 2,
    turnOrder: [0, 1],
    turnOrderIndex: 0,
    currentPlayerIndex: 0,
    ...over,
});

describe('rules.validateAction', () => {
    it('permite una acción restringida por turno al jugador activo', () => {
        const s = baseState();
        expect(validateAction(s, 'p0', { type: 'NEXT_TURN' }).ok).toBe(true);
    });

    it('rechaza una acción restringida por turno a quien no es el jugador activo', () => {
        const s = baseState();
        expect(validateAction(s, 'p1', { type: 'NEXT_TURN' }).ok).toBe(false);
    });

    it('permite acciones NO restringidas a cualquier jugador', () => {
        const s = baseState();
        expect(validateAction(s, 'p1', { type: 'SET_NOTIFICATION', payload: null }).ok).toBe(true);
    });

    it('rechaza una acción de batalla a un no participante', () => {
        const battle = { attacker: { id: 'p0' }, defender: { id: 'p1' } } as unknown as BattleState;
        const s = baseState({ battleState: battle });
        expect(validateAction(s, 'p9', { type: 'BATTLE_DEFENDER_SELECT', payload: { cardId: 'x' } }).ok).toBe(false);
    });

    it('permite una acción de batalla a un participante', () => {
        const battle = { attacker: { id: 'p0' }, defender: { id: 'p1' } } as unknown as BattleState;
        const s = baseState({ battleState: battle });
        expect(validateAction(s, 'p1', { type: 'BATTLE_DEFENDER_SELECT', payload: { cardId: 'x' } }).ok).toBe(true);
    });
});

describe('intents.applyIntent', () => {
    it('aplica un intent ACTION válido y avanza el estado', () => {
        const s = baseState();
        const res = applyIntent(s, 'p0', { kind: 'ACTION', action: { type: 'NEXT_TURN' } });
        expect(res.ok).toBe(true);
        expect(res.state.currentPlayerIndex).toBe(1);
    });

    it('rechaza un intent inválido y deja el estado intacto', () => {
        const s = baseState();
        const res = applyIntent(s, 'p1', { kind: 'ACTION', action: { type: 'NEXT_TURN' } });
        expect(res.ok).toBe(false);
        expect(res.state).toBe(s); // mismo objeto, sin cambios
        expect(res.reason).toBeDefined();
    });
});
