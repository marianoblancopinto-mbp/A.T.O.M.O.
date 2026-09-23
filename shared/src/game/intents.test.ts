/**
 * Tests de validación de reglas e intents (autoridad del servidor).
 */

import { describe, it, expect } from 'vitest';
import { applyIntent, toSerializableAction, isSerializableAction } from './intents';
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

describe('rules — fase de producción (preturno)', () => {
    const prod = { type: 'PRODUCE_SUPPLY', payload: { playerIndex: 0, techId: 't1', rawId: 'r1', supplyType: 'food', originCountry: 'argentina' } } as const;
    const attack = { type: 'INIT_BATTLE', payload: {} as any } as const;

    it('permite PRODUCE_SUPPLY sólo en fase de producción', () => {
        expect(validateAction(baseState({ roundPhase: 'PRODUCTION' }), 'p0', prod).ok).toBe(true);
        expect(validateAction(baseState({ roundPhase: 'ACTION' }), 'p0', prod).ok).toBe(false);
    });

    it('bloquea atacar (INIT_BATTLE) durante la fase de producción', () => {
        expect(validateAction(baseState({ roundPhase: 'PRODUCTION' }), 'p0', attack).ok).toBe(false);
        expect(validateAction(baseState({ roundPhase: 'ACTION' }), 'p0', attack).ok).toBe(true);
    });

    it('permite marcarse LISTO a cualquier jugador', () => {
        const s = baseState({ roundPhase: 'PRODUCTION' });
        expect(validateAction(s, 'p1', { type: 'SET_PRODUCTION_READY', payload: { playerId: 'p1', ready: true } }).ok).toBe(true);
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

describe('toSerializableAction / isSerializableAction', () => {
    it('convierte UPDATE_PLAYERS_FN en SET_PLAYERS evaluando contra el estado', () => {
        const s = baseState();
        const action = toSerializableAction(
            { type: 'UPDATE_PLAYERS_FN', payload: (players) => players.map(p => ({ ...p, name: 'X' })) },
            s
        );
        expect(action.type).toBe('SET_PLAYERS');
        // El resultado ya es data, no una función:
        expect(JSON.stringify(action)).toContain('SET_PLAYERS');
        if (action.type === 'SET_PLAYERS') {
            expect(action.payload.every(p => p.name === 'X')).toBe(true);
        }
    });

    it('convierte UPDATE_OWNERS_FN en SET_OWNERS', () => {
        const s = baseState({ owners: { brasil: 'p0' } });
        const action = toSerializableAction(
            { type: 'UPDATE_OWNERS_FN', payload: (owners) => ({ ...owners, chile: 'p1' }) },
            s
        );
        expect(action.type).toBe('SET_OWNERS');
        if (action.type === 'SET_OWNERS') {
            expect(action.payload).toEqual({ brasil: 'p0', chile: 'p1' });
        }
    });

    it('deja las acciones ya serializables sin cambios', () => {
        const s = baseState();
        const original = { type: 'NEXT_TURN' } as const;
        expect(toSerializableAction(original, s)).toBe(original);
    });

    it('isSerializableAction detecta las acciones con payload-función', () => {
        expect(isSerializableAction({ type: 'NEXT_TURN' })).toBe(true);
        expect(isSerializableAction({ type: 'UPDATE_PLAYERS_FN', payload: (p) => p })).toBe(false);
    });
});
