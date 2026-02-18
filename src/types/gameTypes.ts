export type Regiment = 'A' | 'B' | 'C';
export type Tier = 1 | 2 | 3 | 4;

export interface Card {
    id: string; // Unique ID for React keys
    regiment: Regiment;
    tier: Tier;
    variant: number; // 0-4 for specific unit names
}

export const REGIMENT_NAMES: Record<Regiment, string> = {
    'A': 'Infantería',
    'B': 'Caballería',
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

import type { PlayerData } from './playerTypes';

export interface BattleState {
    isActive: boolean;
    attacker: PlayerData;
    defender: PlayerData;
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
    phase: 'ATTACKER_SELECTION' | 'DEFENDER_SELECTION' | 'RESOLUTION' | 'VICTORY' | 'DEFEAT';
    currentAttackerCard: Card | null;
    currentDefenderCard: Card | null;
    clashResult: {
        winner: 'attacker' | 'defender';
        reason: string;
    } | null;
    roundCount: number; // 0, 1, 2 (max 3 rounds)
    attackerWins: number;
    defenderWins: number;
}

export interface GameState {
    phase: 'LOBBY' | 'DEPLOYMENT' | 'ATTACK' | 'FORTIFICATION' | 'REGROUP' | 'END';
    turnIndex: number;
    year: number;
    // Add other global state properties here as needed
}
