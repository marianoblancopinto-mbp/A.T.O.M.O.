/**
 * Modelo de estado de la partida (autoritativo).
 *
 * El servidor guarda el GameState COMPLETO y es el único que lo modifica, a
 * través de los comandos del motor (engine/commands). Cada cliente recibe sólo
 * su VISTA filtrada (engine/view): la misma forma, con la información ajena
 * redactada.
 *
 * Este módulo sólo define tipos, el estado inicial y saneadores. No tiene
 * acciones genéricas del estilo SET_PLAYERS: no existe forma de que un cliente
 * reescriba el estado.
 */

import type { PlayerData } from '../playerTypes';
import type { ProductionDeck, ActiveProviders } from '../productionTypes';
import type { Treaty } from '../treatyTypes';
import type { BattleState, PlayerRef, Card } from '../gameTypes';

export type GamePhase = 'splash' | 'menu' | 'history' | 'mission' | 'setup' | 'playing';

export type NotificationType =
    | 'ESPIONAJE' | 'NUCLEAR_DESIGN' | 'NUCLEAR_ALERT' | 'GAME_OVER' | 'NEUTRALIZED'
    | 'ROUTE_BROKEN' | 'ROUTE_RESTORED' | 'SECONDARY_MISSION' | 'CONQUEST';

export interface MissionNotification {
    /** Secuencial, lo asigna el servidor. El cliente lo usa para descartarla localmente. */
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    color: string;
    playerName?: string;
    /** Si está definido, la notificación es PRIVADA: sólo la recibe ese jugador. */
    targetPlayerId?: string | number | null;
    missionId?: string;
}

export interface GameSettings {
    proxyWarCountry: string;
    abandonmentMode: 'redistribute' | 'neutralize';
    aiActive: boolean;
    aiDifficulty: number;
    gameMode: 'classic' | 'chaos';
    /**
     * Ritmo de la partida. 'live': todos conectados a la vez, combate interactivo
     * ronda por ronda. 'async' (correspondencia): cada jugador tiene un plazo
     * para actuar y el combate se resuelve con cartas comprometidas.
     */
    pace: 'live' | 'async';
    /** Plazo para actuar en modo correspondencia, en minutos (turno, preturno, defensa). */
    turnMinutes: number;
}

/** Plazo vigente en modo correspondencia. Vencido, el motor resuelve por el jugador. */
export interface Deadline {
    kind: 'production' | 'turn' | 'defense';
    /** Epoch ms. */
    at: number;
}

/** Resultado de una batalla resuelta con cartas comprometidas (público tras la resolución). */
export interface BattleReport {
    id: string;
    at: number;
    attacker: PlayerRef;
    defender: PlayerRef;
    sourceId: string;
    targetId: string;
    clashes: {
        attackerCard: Card;
        defenderCard: Card | null;
        attackerScore: number;
        defenderScore: number;
        winner: 'attacker' | 'defender';
    }[];
    winner: 'attacker' | 'defender';
    /** La defensa la eligió el sistema (defensor neutral o plazo vencido). */
    autoDefense: boolean;
}

export interface GameState {
    gamePhase: GamePhase;
    gameStarted: boolean;
    numPlayers: number;

    players: PlayerData[];
    currentPlayerIndex: number;
    /** Id del anfitrión (puede finalizar la partida, expulsar y forzar la ronda). */
    hostId: string | number | null;

    /** region -> id del dueño (null/ausente = neutral). */
    owners: Record<string, string | number | null>;

    productionDeck: ProductionDeck | null;
    regionResources: ActiveProviders | null;

    gameDate: Date;
    turnOrder: number[];
    turnOrderIndex: number;

    /**
     * Registro de notificaciones (las últimas N). En la VISTA de un jugador sólo
     * quedan las que puede ver; `notification` es la más reciente de ellas.
     */
    notifications: MissionNotification[];
    notification: MissionNotification | null;
    nextNotificationId: number;

    battleState: BattleState | null;

    proxyWarCountry: string;

    winner: PlayerRef | null;
    endgameChoice: 'victory' | 'destruction' | null;

    usedAttackSources: string[];
    treaties: Treaty[];
    settings: GameSettings;

    /**
     * 'PRODUCTION' = preturno simultáneo al inicio de la ronda (se producen
     * suministros). 'ACTION' = ronda de turnos (no se puede producir).
     */
    roundPhase: 'PRODUCTION' | 'ACTION';
    productionReadyIds: string[];

    /** Partida finalizada por el anfitrión (sin ganador). */
    gameOver: boolean;

    /** Modo correspondencia: plazo vigente (null en modo en vivo o con la partida terminada). */
    deadline: Deadline | null;
    /** Modo correspondencia: últimas batallas resueltas. */
    battleReports: BattleReport[];
}

export const DEFAULT_SETTINGS: GameSettings = {
    proxyWarCountry: 'País Desconocido',
    abandonmentMode: 'redistribute',
    aiActive: false,
    aiDifficulty: 50,
    gameMode: 'classic',
    pace: 'live',
    turnMinutes: 24 * 60,
};

export const initialState: GameState = {
    gamePhase: 'splash',
    gameStarted: false,
    numPlayers: 2,
    players: [],
    currentPlayerIndex: 0,
    hostId: null,
    owners: {},
    productionDeck: null,
    regionResources: null,
    gameDate: new Date(2100, 0, 1),
    turnOrder: [],
    turnOrderIndex: 0,
    notifications: [],
    notification: null,
    nextNotificationId: 1,
    battleState: null,
    proxyWarCountry: 'País Desconocido',
    winner: null,
    endgameChoice: null,
    usedAttackSources: [],
    treaties: [],
    settings: DEFAULT_SETTINGS,
    roundPhase: 'PRODUCTION',
    productionReadyIds: [],
    gameOver: false,
    deadline: null,
    battleReports: [],
};

/** Rellena los campos de PlayerData con defaults seguros (datos que llegan por la red). */
export function sanitizePlayer(p: any): PlayerData {
    const base = p ?? { id: 'unknown', name: 'Desconocido', color: '#888888' };
    return {
        ...base,
        specialCards: base.specialCards ?? [],
        silos: base.silos ?? [],
        siloStatus: base.siloStatus ?? {},
        siloFuelCards: base.siloFuelCards ?? {},
        usedEspionageHqs: base.usedEspionageHqs ?? [],
        usedNuclearSilos: base.usedNuclearSilos ?? [],
        activeSpecialMissions: base.activeSpecialMissions ?? [],
        secretWarData: base.secretWarData ?? [],
        intelReports: base.intelReports ?? [],
        secretMineralLocation: base.secretMineralLocation ?? null,
        mineralUsedThisTurn: base.mineralUsedThisTurn ?? false,
        supplies: {
            manufacture: base.supplies?.manufacture ?? [],
            food: base.supplies?.food ?? [],
            energy: base.supplies?.energy ?? [],
        },
        resources: {
            rawMaterials: base.resources?.rawMaterials ?? 0,
            technology: base.resources?.technology ?? 0,
        },
        inventory: {
            rawMaterials: base.inventory?.rawMaterials ?? [],
            technologies: base.inventory?.technologies ?? [],
        },
    };
}

export function sanitizePlayers(players: any[]): PlayerData[] {
    return Array.isArray(players) ? players.map(sanitizePlayer) : [];
}

/** Convierte un número/BigInt/Date de la red en Date (msgpack manda BigInt). */
export function toGameDate(v: unknown): Date {
    if (v instanceof Date) return v;
    if (typeof v === 'bigint') return new Date(Number(v));
    if (typeof v === 'number' || typeof v === 'string') {
        const d = new Date(typeof v === 'string' ? v : Number(v));
        if (!isNaN(d.getTime())) return d;
    }
    return new Date(2100, 0, 1);
}
