import { describe, it, expect } from 'vitest';
import { seededRandom } from '@atomo/shared';
import { GameSession } from './session';

function lobbyOf2() {
    const s = new GameSession(seededRandom(5));
    const a = s.join(undefined, 'Ana');
    const b = s.join(undefined, 'Beto');
    if (a.kind !== 'seat' || b.kind !== 'seat') throw new Error('sin asiento');
    return { s, a: a.seat, b: b.seat };
}

describe('GameSession: identidad', () => {
    it('el servidor asigna playerId y token; el primero es anfitrión', () => {
        const { s, a, b } = lobbyOf2();
        expect(a.playerId).not.toBe(b.playerId);
        expect(a.token).toHaveLength(48);
        expect(s.isHost(a.playerId)).toBe(true);
        expect(s.isHost(b.playerId)).toBe(false);
    });
    it('reconectar con el token devuelve el MISMO asiento', () => {
        const { s, a } = lobbyOf2();
        const again = s.join(a.token, 'Ana');
        expect(again.kind === 'seat' && again.seat.playerId).toBe(a.playerId);
    });
    it('un token inventado no da acceso a un asiento ajeno durante la partida', () => {
        const { s, a } = lobbyOf2();
        expect(s.start(a.playerId)).toBeNull();
        expect(s.join('token-falso', 'Intruso').kind).toBe('spectator');
        expect(s.join(a.playerId, 'Intruso').kind).toBe('spectator'); // el playerId no sirve como token
    });
    it('si el anfitrión se va del lobby, asume el siguiente', () => {
        const { s, a, b } = lobbyOf2();
        s.leave(a.playerId);
        expect(s.isHost(b.playerId)).toBe(true);
    });
});

describe('GameSession: lobby e inicio', () => {
    it('sólo el anfitrión cambia ajustes e inicia', () => {
        const { s, a, b } = lobbyOf2();
        expect(s.updateSettings(b.playerId, { gameMode: 'chaos' })).toMatch(/anfitrión/);
        expect(s.updateSettings(a.playerId, { gameMode: 'chaos', aiDifficulty: 999 })).toBeNull();
        expect(s.lobbyView().settings.aiDifficulty).toBe(100);
        expect(s.start(b.playerId)).toMatch(/anfitrión/);
        expect(s.start(a.playerId)).toBeNull();
        expect(s.state!.settings.gameMode).toBe('chaos');
    });
    it('no arranca con un solo jugador', () => {
        const s = new GameSession(seededRandom(1));
        const a = s.join(undefined, 'Solo');
        expect(a.kind === 'seat' && s.start(a.seat.playerId)).toMatch(/al menos/);
    });
});

describe('GameSession: difusión filtrada', () => {
    it('cada jugador recibe sólo su mineral; el espectador ninguno', () => {
        const { s, a, b } = lobbyOf2();
        s.start(a.playerId);
        const va = s.viewFor(a.playerId)!, vb = s.viewFor(b.playerId)!, vs = s.viewFor(null)!;
        const mineral = (v: typeof va, id: string) => v.players.find(p => p.id === id)!.secretMineralLocation;
        expect(mineral(va, a.playerId)).toBeTruthy();
        expect(mineral(va, b.playerId)).toBeNull();
        expect(mineral(vb, a.playerId)).toBeNull();
        expect(vs.players.every(p => p.secretMineralLocation === null)).toBe(true);
        expect(typeof va.gameDate).toBe('number');
    });
    it('los comandos inválidos se rechazan con motivo y no cambian el estado', () => {
        const { s, a } = lobbyOf2();
        s.start(a.playerId);
        const before = s.state;
        expect(s.command(a.playerId, { type: 'SET_OWNERS', payload: {} })).toMatch(/desconocido/);
        expect(s.state).toBe(before);
    });
});
