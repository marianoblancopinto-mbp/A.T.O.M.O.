export type BiomeType = 'MOUNTAIN' | 'PLAIN' | 'JUNGLE' | 'URBAN';

export interface BiomeDisplay {
    types: BiomeType[];
    description: string;
}

export interface BiomeDetailData {
    label: string;
    bonusArt: number;
    bonusAir: number;
    bonusInf: number;
}

export const REGION_BIOMES: Record<string, BiomeDisplay> = {
    // Multi-Biome Regions (Priority Definitions)
    'japon': {
        types: ['MOUNTAIN', 'JUNGLE', 'URBAN'],
        description: 'Alpes Japoneses / Bosque templado / Alta densidad costera'
    },
    'korea': {
        types: ['MOUNTAIN', 'JUNGLE', 'URBAN'],
        description: 'Península accidentada / Bosque denso / Promedio habitacional alto'
    },
    'islandia': {
        types: ['MOUNTAIN', 'PLAIN'],
        description: 'Tierras altas volcánicas / Tundra y campos de lava'
    },

    // Mountains (Remaining 7 of 10)
    'tibet': { types: ['MOUNTAIN'], description: 'Himalaya y la Meseta del Tíbet' },
    'chile': { types: ['MOUNTAIN'], description: 'Cordillera de los Andes' },
    'grecia': { types: ['MOUNTAIN'], description: 'Montes Pindo y Peloponeso' },
    'turquia': { types: ['MOUNTAIN'], description: 'Meseta de Anatolia y Montes Tauro' },
    'noruega': { types: ['MOUNTAIN'], description: 'Alpes Escandinavos' },
    'yugoslavia': { types: ['MOUNTAIN'], description: 'Alpes Dináricos y Montes Balcanes' },
    'iran': { types: ['MOUNTAIN'], description: 'Montes Zagros y Elburz' },

    // Plains (Remaining 9 of 10)
    'arabia': { types: ['PLAIN'], description: 'Desierto de arena y mesetas áridas' },
    'sahel': { types: ['PLAIN'], description: 'Desierto hiperárido y llanuras rocosas' },
    'egipto': { types: ['PLAIN'], description: 'Desierto fuera del Nilo' },
    'uruguay': { types: ['PLAIN'], description: 'Pasturas naturales (Pampa)' },
    'algeria': { types: ['PLAIN'], description: 'Desierto del Sahara norte' },
    'groenlandia': { types: ['PLAIN'], description: 'Tundra costera y desierto polar' },
    'kazajistan': { types: ['PLAIN'], description: 'Estepa central y desiertos' },
    'australia': { types: ['PLAIN'], description: 'Desierto (Outback) y pasturas' },
    'argentina': { types: ['PLAIN'], description: 'Llanura Pampeana y Patagonia' },
    'rusia': { types: ['PLAIN'], description: 'Gran llanura europea y cuencas fluviales' },
    'siberia': { types: ['PLAIN'], description: 'Llanura siberiana occidental y tundra' },
    'mongolia': { types: ['PLAIN'], description: 'Estepa de Asia Central y altiplanicies' },
    'polonia': { types: ['PLAIN'], description: 'Gran Llanura Europea' },
    'rumania': { types: ['PLAIN'], description: 'Llanura del Danubio' },
    'canada': { types: ['PLAIN'], description: 'LLanuras en el interior del país' },

    // Jungle (Remaining 8 of 10)
    'suecia': { types: ['JUNGLE'], description: 'Bosque boreal denso (Taiga)' },
    'congo': { types: ['JUNGLE'], description: 'Selva ecuatorial y pantanos' },
    'panama': { types: ['JUNGLE'], description: 'Selva tropical virgen' },
    'brasil': { types: ['JUNGLE'], description: 'Selva Amazónica y Pantanal' },
    'peru': { types: ['JUNGLE'], description: 'Selva alta y baja' },
    'borneo': { types: ['JUNGLE'], description: 'Selva tropical y pantanos' },
    'colombia': { types: ['JUNGLE'], description: 'Selva del Chocó y Amazonía' },
    'sumatra': { types: ['JUNGLE'], description: 'Selva tropical y zonas pantanosas' },
    'flordia': { types: ['JUNGLE'], description: 'Pantanos y selvas subtropicales (everglades)' },

    // Urban (Remaining 7 of 10 - Replaced Israel with Nueva York)
    'java': { types: ['URBAN'], description: 'La isla más densa del mundo' },
    'india': { types: ['URBAN'], description: 'Alta densidad poblacional' },
    'filipinas': { types: ['URBAN'], description: 'Crecimiento sostenido' },
    'vietnam': { types: ['URBAN', 'JUNGLE'], description: 'Alta densidad en Indochina / Cobertura selvática' },
    'reino_unido': { types: ['URBAN'], description: 'Alta concentración en Inglaterra' },
    'alemania': { types: ['URBAN'], description: 'Nación densa de Europa continental' },
    'italia': { types: ['URBAN'], description: 'Alta densidad peninsular' },
    'nueva_york': { types: ['URBAN'], description: 'Megalópolis del noreste' },
    'espana': { types: ['URBAN'], description: 'Alta urbanización mediterránea' },
    'francia': { types: ['URBAN'], description: 'Alta densidad y centros urbanos' },
    'china': { types: ['URBAN'], description: 'Alta densidad poblaciona en la región oriental' },
};

export const BIOME_DETAILS: Record<BiomeType, BiomeDetailData> = {
    'MOUNTAIN': { label: 'Montaña', bonusArt: 1, bonusAir: 0, bonusInf: 0 }, // +1 Def vs Artillery
    'PLAIN': { label: 'Llanura', bonusArt: 0, bonusAir: 0, bonusInf: 1 }, // +1 Def vs Infantry (Ground)
    'JUNGLE': { label: 'Selva', bonusArt: 1, bonusAir: 1, bonusInf: 0 }, // +1 Def vs Artillery AND +1 vs Air
    'URBAN': { label: 'Urbano', bonusArt: 0, bonusAir: 1, bonusInf: 0 }, // +1 Def vs Air
};

export const calculateRegionBonuses = (regionId: string) => {
    const data = REGION_BIOMES[regionId];
    if (!data) return { art: 0, air: 0, inf: 0 };

    let art = 0;
    let air = 0;
    let inf = 0;
    data.types.forEach(t => {
        art += BIOME_DETAILS[t].bonusArt;
        air += BIOME_DETAILS[t].bonusAir;
        inf += BIOME_DETAILS[t].bonusInf;
    });

    return { art, air, inf };
};
