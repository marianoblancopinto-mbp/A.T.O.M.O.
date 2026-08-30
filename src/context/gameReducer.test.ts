/**
 * Tests de caracterización del reducer puro.
 *
 * Fijan el comportamiento ACTUAL del reducer (no el "ideal") para que sirvan de
 * red de seguridad al moverlo a @atomo/shared y al volverlo determinista en las
 * fases siguientes. Si un cambio altera el resultado de una jugada, estos tests
 * lo detectan.
 */

import { describe, it, expect } from 'vitest';
import { gameReducer, initialState, sanitizePlayer, type GameState } from './gameReducer';
import type { PlayerData } from '../types/playerTypes';
import type { BattleState } from '../types/gameTypes';

// Helper: construye un PlayerData válido con defaults sanos.
const mkPlayer = (id: string, over: Partial<PlayerData> = {}): PlayerData =>
    sanitizePlayer({ id, name: id.toUpperCase(), color: '#123456', ...over });

// Helper: estado base jugable con N jugadores en orden natural.
const baseState = (players: PlayerData[], over: Partial<GameState> = {}): GameState => ({
    ...initialState,
    gameStarted: true,
    gamePhase: 'playing',
    players,
    numPlayers: players.length,
    turnOrder: players.map((_, i) => i),
    turnOrderIndex: 0,
    currentPlayerIndex: 0,
    ...over,
});

describe('initialState', () => {
    it('tiene la forma esperada por defecto', () => {
        expect(initialState.gamePhase).toBe('splash');
        expect(initialState.gameStarted).toBe(false);
        expect(initialState.players).toEqual([]);
        expect(initialState.settings.abandonmentMode).toBe('redistribute');
    });
});

describe('NEXT_TURN', () => {
    it('avanza al siguiente jugador y limpia usedAttackSources', () => {
        const s = baseState([mkPlayer('p0'), mkPlayer('p1')], { usedAttackSources: ['argentina'] });
        const next = gameReducer(s, { type: 'NEXT_TURN' });
        expect(next.currentPlayerIndex).toBe(1);
        expect(next.turnOrderIndex).toBe(1);
        expect(next.usedAttackSources).toEqual([]);
    });

    it('saltea jugadores eliminados', () => {
        const s = baseState([mkPlayer('p0'), mkPlayer('p1', { isEliminated: true }), mkPlayer('p2')]);
        const next = gameReducer(s, { type: 'NEXT_TURN' });
        // p1 está eliminado → debe caer en p2
        expect(next.currentPlayerIndex).toBe(2);
    });

    it('da la vuelta al final del orden', () => {
        const s = baseState([mkPlayer('p0'), mkPlayer('p1')], { turnOrderIndex: 1, currentPlayerIndex: 1 });
        const next = gameReducer(s, { type: 'NEXT_TURN' });
        expect(next.currentPlayerIndex).toBe(0);
    });
});

describe('UPDATE_OWNER y ADD_SUPPLY', () => {
    it('UPDATE_OWNER asigna el dueño de una región', () => {
        const s = baseState([mkPlayer('p0')]);
        const next = gameReducer(s, { type: 'UPDATE_OWNER', payload: { regionId: 'brasil', ownerIndex: 'p0' } });
        expect(next.owners.brasil).toBe('p0');
    });

    it('ADD_SUPPLY agrega un suministro al jugador correcto', () => {
        const s = baseState([mkPlayer('p0'), mkPlayer('p1')]);
        const supply = { id: 's1', type: 'food' as const, originCountry: 'argentina' };
        const next = gameReducer(s, { type: 'ADD_SUPPLY', payload: { playerIndex: 1, supply } });
        expect(next.players[1].supplies.food).toHaveLength(1);
        expect(next.players[0].supplies.food).toHaveLength(0);
    });
});

describe('BATTLE_DEFENDER_SELECT (resolución de choque)', () => {
    const mkBattle = (over: Partial<BattleState> = {}): BattleState => ({
        isActive: true,
        attacker: mkPlayer('atk'),
        defender: mkPlayer('def'),
        attackerHand: [],
        defenderHand: [{ id: 'd1', regiment: 'B', tier: 2, variant: 0 }],
        attackerBonuses: { art: 0, inf: 1 },
        defenderBonuses: { art: 0, air: 0, inf: 0 },
        attackSourceId: 'argentina',
        targetRegionId: 'chile',
        deck: [],
        phase: 'DEFENDER_SELECTION',
        currentAttackerCard: { id: 'a1', regiment: 'B', tier: 3, variant: 0 },
        currentDefenderCard: null,
        clashResult: null,
        roundCount: 0,
        attackerWins: 0,
        defenderWins: 0,
        ...over,
    });

    it('el atacante gana cuando su score supera al defensor', () => {
        // atacante: tier 3 + inf 1 = 4 ; defensor: tier 2 (mismo regimiento B) + terreno inf 0 = 2
        const s = baseState([mkPlayer('atk')], { battleState: mkBattle() });
        const next = gameReducer(s, { type: 'BATTLE_DEFENDER_SELECT', payload: { cardId: 'd1' } });
        expect(next.battleState?.clashResult?.winner).toBe('attacker');
        expect(next.battleState?.attackerWins).toBe(1);
        expect(next.battleState?.phase).toBe('RESOLUTION');
        expect(next.battleState?.defenderHand).toHaveLength(0);
    });

    it('el defensor gana si el regimiento no coincide (carta ignorada)', () => {
        // defensor juega regimiento A contra atacante B → baseDefenderTier=0, terreno inf 0 → 0
        const battle = mkBattle({ defenderHand: [{ id: 'd1', regiment: 'A', tier: 4, variant: 0 }] });
        const s = baseState([mkPlayer('atk')], { battleState: battle });
        const next = gameReducer(s, { type: 'BATTLE_DEFENDER_SELECT', payload: { cardId: 'd1' } });
        // atacante 4 > defensor 0 → igual gana atacante (el tier alto del defensor no cuenta por regimiento distinto)
        expect(next.battleState?.clashResult?.winner).toBe('attacker');
    });
});

describe('KICK_PLAYER (modo neutralize)', () => {
    it('elimina al jugador y neutraliza sus regiones', () => {
        const s = baseState([mkPlayer('p0'), mkPlayer('p1')], {
            owners: { argentina: 'p0', brasil: 'p1' },
            settings: { ...initialState.settings, abandonmentMode: 'neutralize' },
        });
        const next = gameReducer(s, { type: 'KICK_PLAYER', payload: { playerId: 'p0' } });
        expect(next.players.find(p => p.id === 'p0')?.isEliminated).toBe(true);
        expect(next.owners.argentina).toBeNull();
        expect(next.owners.brasil).toBe('p1');
        expect(next.notification?.type).toBe('NEUTRALIZED');
    });
});

describe('SYNC_STATE (guardas defensivas)', () => {
    it('ignora un currentPlayerIndex inválido (NaN) y conserva el actual', () => {
        const s = baseState([mkPlayer('p0'), mkPlayer('p1')], { currentPlayerIndex: 1 });
        const next = gameReducer(s, { type: 'SYNC_STATE', payload: { currentPlayerIndex: 'abc' as any } });
        expect(next.currentPlayerIndex).toBe(1);
    });

    it('sanitiza jugadores con campos faltantes', () => {
        const s = baseState([mkPlayer('p0')]);
        const next = gameReducer(s, { type: 'SYNC_STATE', payload: { players: [{ id: 'p9', name: 'P9' } as any] } });
        expect(next.players[0].specialCards).toEqual([]);
        expect(next.players[0].supplies.food).toEqual([]);
    });
});
