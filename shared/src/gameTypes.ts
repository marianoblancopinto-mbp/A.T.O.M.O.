export type Regiment = 'A' | 'B' | 'C';
export type Tier = 1 | 2 | 3 | 4;

export interface Card {
    id: string; // Unique ID for React keys
    regiment: Regiment;
    tier: Tier;
    variant: number; // 0-4 for specific unit names
}

export const REGIMENT_NAMES: Record<Regiment, string> = {
    'A': 'Aéreo',
    'B': 'Infantería',
    'C': 'Artillería'
};

export const TIER_NAMES: Record<Tier, string> = {
    1: 'Rookie',
    2: 'Veterano',
    3: 'Elite',
    4: 'Leyenda'
};

// Import PlayerData type here or define a subset if needed to avoid circular deps.
// Better to define BattleState here using minimal types or generics, but for now importing PlayerData might work 
// if PlayerData is in playerTypes.ts which doesn't import gameTypes.ts.
// Let's check playerTypes.ts first. A safer bet is to use 'any' or just standard types for now if circular dep exists,
// but let's assume standard imports work.

/**
 * Datos PÚBLICOS de un jugador (lo que cualquiera puede ver). Las batallas y el
 * ganador guardan sólo esto: nunca una copia completa del jugador (que incluye
 * su inventario y sus secretos).
 */
export interface PlayerRef {
    id: string | number;
    name: string;
    color: string;
}

export interface BattleState {
    isActive: boolean;
    attacker: PlayerRef;
    defender: PlayerRef;
    attackerHand: Card[];
    defenderHand: Card[];
    attackerBonuses: {
        art: number;
        inf: number;
        isMaritime?: boolean;
        isAndesCrossing?: boolean;
        isNormandy?: boolean;
        isAlejandroBonus?: boolean;
        isOtomanoBonus?: boolean;
        isGengisBonus?: boolean;
        isBolivarBonus?: boolean;
        isPacificFireBonus?: boolean;
    };

    defenderBonuses: {
        art: number;
        air: number;
        inf: number;
        isGoldenDomeBonus?: boolean;
    };

    attackSourceId: string;
    targetRegionId: string;
    deck: Card[];

    // New fields for Sync
    /**
     * Modo en vivo: ATTACKER_SELECTION → DEFENDER_SELECTION → RESOLUTION (×3) → VICTORY/DEFEAT.
     * Modo correspondencia: ATTACKER_COMMIT → DEFENDER_COMMIT → (resolución inmediata, se cierra sola).
     */
    phase: 'ATTACKER_SELECTION' | 'DEFENDER_SELECTION' | 'RESOLUTION' | 'VICTORY' | 'DEFEAT' | 'ATTACKER_COMMIT' | 'DEFENDER_COMMIT';
    /** Correspondencia: las 3 cartas del atacante, en orden (sólo las ve el atacante). */
    attackerCommit?: Card[] | null;
    /** Correspondencia: el regimiento de cada ronda del ataque (lo ve el defensor; no el tier). */
    incomingRegiments?: Regiment[] | null;
    /** Correspondencia: tiempo de turno que le quedaba al atacante cuando empezó a esperar la defensa. */
    turnRemainingMs?: number;
    currentAttackerCard: Card | null;
    currentDefenderCard: Card | null;
    clashResult: {
        winner: 'attacker' | 'defender';
        reason: string;
    } | null;
    roundCount: number; // 0, 1, 2 (max 3 rounds)
    attackerWins: number;
    defenderWins: number;
    isAiCheating?: boolean;
    /** El defensor es la IA neutral y todavía no eligió su carta (la elige el servidor). */
    aiPending?: boolean;
    /**
     * Sólo en la VISTA de un jugador: cuántas cartas tiene el rival. La mano rival
     * llega vacía (oculta); este número permite dibujar los dorsos.
     */
    opponentHandSize?: number;
}
