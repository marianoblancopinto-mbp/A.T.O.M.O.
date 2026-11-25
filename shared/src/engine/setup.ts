/**
 * Generación de la partida. La ejecuta el SERVIDOR (antes la hacía el
 * anfitrión en su navegador y el servidor adoptaba lo que le mandaba, lo que le
 * permitía elegir el reparto y conocer los minerales secretos de todos).
 */

import type { PlayerData } from '../playerTypes';
import { REGIONS } from '../data/mapRegions';
import { assignRegionResources, generateProductionDeck } from '../data/productionData';
import { getProxyWarCountry } from '../data/missionData';
import { initialState, DEFAULT_SETTINGS, type GameSettings, type GameState } from '../game/state';
import { shuffled, pick, type Random } from './rng';
import { notify } from './helpers';
import { syncDeadline } from './deadlines';

const PLAYER_PALETTE = [
    '#ff0000', '#0088ff', '#0023beff', '#ffff00',
    '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
];

export interface SeatInfo {
    playerId: string;
    name: string;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = PLAYER_PALETTE.length;

/** Ajustes que el anfitrión puede cambiar en el lobby (con valores válidos). */
export function sanitizeSettings(input: unknown, base: GameSettings = DEFAULT_SETTINGS): GameSettings {
    const s = (input && typeof input === 'object' ? input : {}) as Partial<GameSettings>;
    return {
        proxyWarCountry: base.proxyWarCountry,
        abandonmentMode: s.abandonmentMode === 'neutralize' || s.abandonmentMode === 'redistribute' ? s.abandonmentMode : base.abandonmentMode,
        aiActive: typeof s.aiActive === 'boolean' ? s.aiActive : base.aiActive,
        aiDifficulty: typeof s.aiDifficulty === 'number' && isFinite(s.aiDifficulty)
            ? Math.max(0, Math.min(100, Math.round(s.aiDifficulty)))
            : base.aiDifficulty,
        gameMode: s.gameMode === 'chaos' || s.gameMode === 'classic' ? s.gameMode : base.gameMode,
        pace: s.pace === 'async' || s.pace === 'live' ? s.pace : base.pace,
        turnMinutes: typeof s.turnMinutes === 'number' && isFinite(s.turnMinutes)
            ? Math.max(1, Math.min(7 * 24 * 60, Math.round(s.turnMinutes)))
            : base.turnMinutes,
    };
}

/** Elige el País de la Guerra Proxy (lore) al crear la sala. */
export function rollProxyWarCountry(random: Random): string {
    return getProxyWarCountry(random)?.title ?? 'País Desconocido';
}

export function newPlayer(id: string, name: string, color: string): PlayerData {
    return {
        id,
        name,
        color,
        supplies: { manufacture: [], food: [], energy: [] },
        resources: { rawMaterials: 0, technology: 0 },
        inventory: { rawMaterials: [], technologies: [] },
        specialCards: [],
        secretMineralLocation: null,
        silos: [],
        siloStatus: {},
        siloFuelCards: {},
        mineralUsedThisTurn: false,
        nuclearDeploymentActive: false,
        usedEspionageHqs: [],
        activeSpecialMissions: [],
        usedNuclearSilos: [],
        secretWarData: [],
        intelReports: [],
    };
}

/**
 * Crea el estado inicial completo: jugadores, reparto del mapa, recursos,
 * minerales secretos y orden de turnos. Todo el azar sale de `random`.
 */
export function createGame(seats: SeatInfo[], hostId: string, settings: GameSettings, random: Random, now: number = Date.now()): GameState {
    if (seats.length < MIN_PLAYERS) throw new Error(`Se necesitan al menos ${MIN_PLAYERS} jugadores.`);
    if (seats.length > MAX_PLAYERS) throw new Error(`Máximo ${MAX_PLAYERS} jugadores.`);

    const numPlayers = seats.length;
    const players = seats.map((s, i) => newPlayer(s.playerId, s.name, PLAYER_PALETTE[i]));

    const regionResources = assignRegionResources(numPlayers, random);
    const productionDeck = generateProductionDeck(regionResources, numPlayers);

    const regionIds = shuffled(REGIONS.map(r => r.id), random);
    const owners: Record<string, string | number | null> = {};
    if (settings.gameMode === 'chaos') {
        // Caos: un país por jugador; el resto es neutral.
        players.forEach((p, i) => { owners[regionIds[i]] = p.id; });
    } else {
        regionIds.forEach((rid, i) => { owners[rid] = players[i % numPlayers].id; });
    }

    // Mineral secreto: un país que al inicio NO es del jugador.
    for (const p of players) {
        p.secretMineralLocation = pick(regionIds.filter(rid => owners[rid] !== p.id), random) ?? null;
    }

    const turnOrder = shuffled(players.map((_, i) => i), random);

    let state: GameState = {
        ...initialState,
        gamePhase: 'playing',
        gameStarted: true,
        numPlayers,
        players,
        hostId,
        owners,
        productionDeck,
        regionResources,
        turnOrder,
        turnOrderIndex: 0,
        currentPlayerIndex: turnOrder[0],
        gameDate: new Date(2100, 0, 1),
        settings,
        proxyWarCountry: settings.proxyWarCountry,
        roundPhase: 'PRODUCTION',
    };
    state = notify(state, {
        type: 'SECONDARY_MISSION',
        title: 'OPERACIÓN INICIADA',
        message: 'Preturno de producción: decidí qué suministros vas a necesitar esta ronda.',
        color: '#00ff00',
    });
    return syncDeadline(null, state, now);
}
