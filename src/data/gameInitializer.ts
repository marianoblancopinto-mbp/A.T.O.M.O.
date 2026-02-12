
import { REGIONS } from './mapRegions';
import { generateProductionDeck, assignRegionResources } from './productionData';
import type { PlayerData } from '../types/playerTypes';
import type { ProductionDeck } from '../types/productionTypes';

const PLAYER_PALETTE = [
    '#ff0000', // Red
    '#0088ff', // Blue
    '#00ff00', // Green
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ff8800', // Orange
    '#8800ff'  // Purple
];

const COMMANDER_NAMES = [
    "Vance", "Sokolov", "Zhang", "Richter",
    "Cavalcanti", "Singh", "Al-Fayed", "Okoro",
    "Tanaka", "Thorne", "Romano", "Dubois",
    "Velázquez", "Lindberg", "Park", "Bakayev",
    "Mansour", "Montgomery", "Reyes", "Kai",
    "Petrov", "Nguyen", "Silva", "Schmidt",
    "Cohen", "Ibrahim", "Murphy", "Papadopoulos",
    "Ozdemir", "Kim", "Jensen", "Ferrari",
    "Lebedev", "Yamamoto", "Santos", "Fischer",
    "Morales", "Khan", "Diallo", "Sullivan"
];

export interface InitialGameState {
    players: PlayerData[];
    owners: Record<string, string | number>;
    productionDeck: ProductionDeck;
    regionResources: any;
    turnOrder: number[];
    currentPlayerIndex: number;
    gameDate: Date;
    proxyWarCountry: string;
}

export function generateInitialGameState(
    numPlayers: number,
    playerNames: string[] = [],
    playerIds: (string | number)[] = [],
    proxyWarCountry: string = 'País Desconocido'
): InitialGameState {

    // Shuffle commander names for random selection
    const shuffledNames = [...COMMANDER_NAMES].sort(() => 0.5 - Math.random());

    const newPlayers: PlayerData[] = Array.from({ length: numPlayers }, (_, i) => {
        const id = playerIds[i] !== undefined ? playerIds[i] : i;
        const name = playerNames[i] && playerNames[i].trim() !== '' ? playerNames[i] : shuffledNames[i];

        return {
            id: id,
            name: name,
            color: PLAYER_PALETTE[i % PLAYER_PALETTE.length],
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
            crossingAndesActive: false,
            normandyLandingActive: false,
            secretWarData: []
        };
    });

    // Resource Distribution
    const resources = assignRegionResources(numPlayers);

    // Generate Production Deck
    const deck = generateProductionDeck(resources, numPlayers);

    // Randomly distribute regions
    const shuffledRegions = [...REGIONS].map(r => r.id);
    for (let i = shuffledRegions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledRegions[i], shuffledRegions[j]] = [shuffledRegions[j], shuffledRegions[i]];
    }

    const initialOwners: Record<string, string | number> = {};
    shuffledRegions.forEach((regionId, index) => {
        const playerIndex = index % numPlayers;
        initialOwners[regionId] = newPlayers[playerIndex].id;
    });

    // Assign Secret Minerals
    const playerMineralLocations: Record<string | number, string> = {};
    const availableCountries = [...shuffledRegions];

    newPlayers.forEach(p => {
        const enemies = availableCountries.filter(rid => initialOwners[rid] !== p.id);
        if (enemies.length > 0) {
            const target = enemies[Math.floor(Math.random() * enemies.length)];
            playerMineralLocations[p.id] = target;
        }
    });

    const finalPlayers = newPlayers.map(p => ({
        ...p,
        secretMineralLocation: playerMineralLocations[p.id] || null
    }));

    // Initialize Randomized Turn Order
    // Note: If using UUIDs, we need to map indices or just shuffle the player IDs
    const initialOrderIndices = Array.from({ length: numPlayers }, (_, i) => i);
    for (let i = initialOrderIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialOrderIndices[i], initialOrderIndices[j]] = [initialOrderIndices[j], initialOrderIndices[i]];
    }

    // Convert indices to player IDs? 
    // The game engine currently uses indices for turnOrder in some places, but check GameContext.
    // GameContext turnOrder is number[] (indices into players array).
    const initialOrder = initialOrderIndices;

    return {
        players: finalPlayers,
        owners: initialOwners,
        productionDeck: deck,
        regionResources: resources,
        turnOrder: initialOrder,
        currentPlayerIndex: initialOrder[0],
        gameDate: new Date(2100, 0, 1),
        proxyWarCountry: proxyWarCountry
    };
}
