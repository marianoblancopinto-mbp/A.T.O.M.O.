/**
 * Tests de la lógica del servidor autoritativo.
 * Verifican que el servidor corre la MISMA autoridad (applyIntent) de shared.
 */

import { describe, it, expect } from 'vitest';
import {
    createInitialState, applyIntent, toWire,
    addLobbyPlayer, removeLobbyPlayer, isHost, adoptInitialState,
} from './roomLogic';

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

    it('adoptInitialState rehidrata gameDate y marca la partida iniciada', () => {
        const s = adoptInitialState({ players: [], owners: { brasil: 'p0' }, gameDate: Date.UTC(2101, 0, 1) });
        expect(s.gameStarted).toBe(true);
        expect(s.gamePhase).toBe('playing');
        expect(s.gameDate instanceof Date).toBe(true);
        expect(s.owners.brasil).toBe('p0');
    });
});

describe('lobby', () => {
    it('el primero en unirse es el anfitrión', () => {
        let lobby = addLobbyPlayer([], 'p0', 'Ana');
        expect(lobby).toHaveLength(1);
        expect(lobby[0].isHost).toBe(true);
        lobby = addLobbyPlayer(lobby, 'p1', 'Beto');
        expect(lobby[1].isHost).toBe(false);
        expect(isHost(lobby, 'p0')).toBe(true);
        expect(isHost(lobby, 'p1')).toBe(false);
    });

    it('reunirse con el mismo id no duplica, sólo actualiza el nombre', () => {
        let lobby = addLobbyPlayer([], 'p0', 'Ana');
        lobby = addLobbyPlayer(lobby, 'p0', 'Ana María');
        expect(lobby).toHaveLength(1);
        expect(lobby[0].name).toBe('Ana María');
    });

    it('si se va el anfitrión, se promueve al siguiente', () => {
        let lobby = addLobbyPlayer(addLobbyPlayer([], 'p0', 'Ana'), 'p1', 'Beto');
        lobby = removeLobbyPlayer(lobby, 'p0');
        expect(lobby).toHaveLength(1);
        expect(lobby[0].playerId).toBe('p1');
        expect(lobby[0].isHost).toBe(true);
    });
});
