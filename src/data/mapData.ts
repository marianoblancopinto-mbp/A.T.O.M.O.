export const MARITIME_ROUTES: string[][] = [
    // Atlantic
    ['brasil', 'costa_de_marfil'],
    ['espana', 'marruecos'],
    ['reino_unido', 'islandia'],
    ['islandia', 'groenlandia'],
    ['noruega', 'islandia'],
    ['suecia', 'alemania'],
    ['groenlandia', 'quebec'],
    ['groenlandia', 'canada'],
    ['reino_unido', 'francia'],
    // Caribbean
    ['flordia', 'cuba'],
    ['cuba', 'venezuela'],
    // Pacific (Americas)
    ['mejico', 'peru'],
    // Pacific Chain (Asia)
    ['kamchakta', 'japon'],
    ['japon', 'filipinas'],
    ['japon', 'korea'],
    ['filipinas', 'java'],
    ['tailandia', 'borneo'],
    // Indian Ocean / Oceania
    ['arabia', 'sumatra'],
    ['arabia', 'etiopia'],
    ['turquia', 'egipto'],
    ['sudafrica', 'madagascar'],
    ['madagascar', 'etiopia'],
    ['australia', 'java'],
    ['australia', 'borneo'],
    ['australia', 'sumatra'],
    ['alaska', 'kamchakta'],
    ['chile', 'australia'],
];

// Special routes that go off-screen
// format: [regionId, exitPointX, exitPointY] (approximate)
export const WRAPAROUND_ROUTES = [
    { id: 'alaska', x: 0, y: 100 }, // Goes Left
    { id: 'kamchakta', x: 1700, y: 100 }, // Goes Right
    { id: 'chile', x: 0, y: 700 }, // Goes Left
    { id: 'australia', x: 1700, y: 700 }, // Goes Right
];

export const REGION_ADJACENCY: Record<string, string[]> = {
    // America del Sur
    'argentina': ['chile', 'uruguay', 'brasil', 'peru', 'paraguay', 'bolivia'],
    'chile': ['argentina', 'peru', 'australia'], // + Maritime to Australia? Check map. Usually Wraparound.
    'peru': ['argentina', 'chile', 'brasil', 'colombia', 'ecuador', 'bolivia'],
    'brasil': ['argentina', 'uruguay', 'peru', 'colombia', 'venezuela'], // Removed sahara, costa_de_marfil (now maritime only)
    'uruguay': ['argentina', 'brasil'],
    'colombia': ['peru', 'brasil', 'venezuela', 'panama'], // Panama/Mexico borders - FIXED: Removed Mexico, added Panama
    'venezuela': ['colombia', 'brasil', 'mexico'], // Keeping Mexico to avoid breaking unrecognized logic if any, but logic says Panama handles crossing
    // America del Norte
    'mejico': ['california', 'texas', 'panama'], // FIXED: Linked to Panama
    'panama': ['mejico', 'colombia'], // NEW: Panama Region
    'california': ['mejico', 'texas', 'canada'],
    'texas': ['mejico', 'california', 'nueva_york', 'flordia'],
    'nueva_york': ['california', 'texas', 'canada', 'quebec', 'flordia'],
    'alaska': ['canada', 'kamchakta'],
    'canada': ['california', 'nueva_york', 'groenlandia', 'alaska', 'quebec'],
    'quebec': ['nueva_york', 'groenlandia', 'canada'],
    'flordia': ['texas', 'nueva_york', 'cuba'],
    'groenlandia': ['quebec', 'canada', 'islandia'],
    // Europa
    'noruega': ['suecia', 'islandia'],
    'islandia': ['groenlandia', 'noruega', 'reino_unido'],
    'reino_unido': ['islandia', 'alemania', 'francia'],
    'suecia': ['noruega', 'rusia', 'alemania'],
    'rusia': ['suecia', 'polonia', 'rumania', 'turquia', 'iran', 'kazajistan', 'siberia'],
    'polonia': ['rusia', 'alemania', 'rumania', 'yugoslavia'],
    'alemania': ['francia', 'polonia', 'italia', 'yugoslavia'],
    'francia': ['alemania', 'italia', 'espana', 'reino_unido'],
    'espana': ['francia'], // marruecos and algeria are now maritime only
    'italia': ['francia', 'alemania', 'yugoslavia'],
    'yugoslavia': ['italia', 'polonia', 'rumania', 'grecia', 'alemania'],
    'rumania': ['polonia', 'rusia', 'yugoslavia', 'grecia'],
    'grecia': ['yugoslavia', 'rumania'],
    // Africa
    // Africa (Updated per manual list)
    'marruecos': ['sahel', 'costa_de_marfil', 'algeria'], // Removed espana
    'sahel': ['marruecos', 'algeria', 'costa_de_marfil', 'congo', 'mozambique'],
    'egipto': ['etiopia', 'algeria'], // Turquía is maritime
    'etiopia': ['egipto', 'algeria', 'mozambique'], // Madagascar and Arabia are maritime
    'congo': ['mozambique', 'sahel', 'costa_de_marfil', 'sudafrica'],
    'sudafrica': ['mozambique', 'congo'], // Madagascar is maritime
    'madagascar': ['sudafrica'], // Etiopia is maritime
    'costa_de_marfil': ['sahel', 'marruecos', 'congo'], // Brasil is maritime
    'algeria': ['marruecos', 'sahel', 'egipto', 'etiopia', 'mozambique'], // Removed espana
    'mozambique': ['sahel', 'algeria', 'etiopia', 'congo', 'sudafrica'],
    // Asia
    'turquia': ['rusia', 'iran', 'arabia'],
    'arabia': ['turquia', 'iran'],
    'iran': ['rusia', 'kazajistan', 'tibet', 'arabia', 'turquia', 'india'],
    'kazajistan': ['rusia', 'iran', 'china', 'mongolia', 'siberia', 'tibet'],
    'siberia': ['rusia', 'kazajistan', 'mongolia', 'kamchakta'],
    'mongolia': ['siberia', 'kazajistan', 'iran', 'china', 'kamchakta'],
    'china': ['mongolia', 'tibet', 'india', 'korea', 'japon', 'kamchakta', 'vietnam', 'tailandia'],
    'korea': ['china', 'japon'],
    'japon': ['korea', 'china', 'kamchakta', 'filipinas'],
    'kamchakta': ['alaska', 'siberia', 'mongolia', 'china'],
    'india': ['iran', 'china', 'tibet', 'tailandia'],
    'vietnam': ['china', 'tailandia'],
    'tibet': ['china', 'iran', 'kazajistan', 'india'],
    'tailandia': ['india', 'vietnam', 'china', 'borneo'],
    'filipinas': ['japon', 'java'],
    // Oceania
    'australia': ['chile', 'borneo', 'sumatra', 'java'],
    'borneo': ['australia', 'tailandia'],
    'sumatra': ['arabia', 'australia'],
    'java': ['australia', 'filipinas'],
};

// --- SUPPLY ROUTE LOGIC ---

/**
 * Checks if a valid supply route exists between two regions for a specific player.
 * A route is valid if:
 * 1. Both start and end regions are owned by the player.
 * 2. There is a path of connected regions (land adjacency OR maritime) entirely owned by the player.
 */
export const checkSupplyRoute = (
    startRegionId: string,
    endRegionId: string,
    playerIndex: number | string,
    owners: Record<string, number | string | null>,
    extraAdjacency?: Record<string, string[]>
): boolean => {
    // 0. Basic validation
    if (!startRegionId || !endRegionId) return false;
    if (startRegionId === endRegionId) return true; // Already there
    if (owners[startRegionId] !== playerIndex || owners[endRegionId] !== playerIndex) return false;

    // 1. Build Adjacency List (including Maritime) just for this check?
    // Efficient approach: Use BFS with on-the-fly neighbor discovery.

    const queue: string[] = [startRegionId];
    const visited = new Set<string>();
    visited.add(startRegionId);

    while (queue.length > 0) {
        const current = queue.shift()!;

        if (current === endRegionId) return true;

        // Get neighbors from Land Adjacency
        let landNeighbors = REGION_ADJACENCY[current] || [];

        // Add extra adjacency if provided (e.g., from Special Missions)
        if (extraAdjacency && extraAdjacency[current]) {
            landNeighbors = [...landNeighbors, ...extraAdjacency[current]];
        }

        // Get neighbors from Maritime Routes
        // Maritime routes are pairs [A, B]. If current is A, add B. If current is B, add A.
        const maritimeNeighbors = MARITIME_ROUTES
            .filter(route => route.includes(current))
            .map(route => route[0] === current ? route[1] : route[0]);

        const allNeighbors = [...landNeighbors, ...maritimeNeighbors];

        for (const neighbor of allNeighbors) {
            // Check ownership and visitation
            if (!visited.has(neighbor) && owners[neighbor] === playerIndex) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    return false;
};

export const isMaritimeConnection = (id1: string, id2: string): boolean => {
    const direct = MARITIME_ROUTES.find(pair => (pair[0] === id1 && pair[1] === id2) || (pair[0] === id2 && pair[1] === id1));
    return !!direct;
};
