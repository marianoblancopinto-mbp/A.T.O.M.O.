import type { RawMaterialType, TechnologyType, SupplyType, ProductionInventory, TerritoryCard, ProductionDeck } from '../types/productionTypes';

export const WAR_SECRETS_RESOURCES: { type: RawMaterialType; label: string }[] = [
    { type: 'ALUMINIO', label: 'ALUMINIO' },
    { type: 'HIERRO', label: 'HIERRO' },
    { type: 'CONDUCTORES_SEMICONDUCTORES', label: 'SEMICONDUCTORES' },
    { type: 'COMBUSTIBLE_NUCLEAR', label: 'COMBUSTIBLE NUCLEAR' },
    { type: 'HIDROCARBUROS', label: 'HIDROCARBUROS' },
    { type: 'MINERALES_BATERIAS', label: 'LITIO Y TIERRAS RARAS' }
];

// Provider Lists based on Real World Data
// Extended type to handle the split nuclear lists internally
interface ExtendedProviderLists {
    rawMaterials: Record<RawMaterialType, string[]>;
    technologies: Record<TechnologyType | 'NUCLEAR_WAR' | 'NUCLEAR_ENERGY', string[]>;
}

export const PROVIDER_COUNTRIES: ExtendedProviderLists = {
    rawMaterials: {
        CEREALES: ['china', 'india', 'rusia', 'brasil', 'borneo', 'sudafrica', 'java', 'tailandia', 'vietnam', 'sumatra', 'yugoslavia'],
        OLEAGINOSAS: ['argentina', 'canada', 'rumania', 'etiopia', 'francia', 'australia', 'brasil'],
        AGUA_DULCE: ['rusia', 'congo', 'argentina', 'china', 'india', 'brasil', 'colombia', 'venezuela', 'chile', 'suecia', 'francia', 'canada'],
        HIERRO: ['australia', 'brasil', 'rusia', 'china', 'tailandia', 'vietnam', 'rumania', 'canada', 'sudafrica', 'iran', 'kazajistan', 'suecia', 'mejico', 'peru', 'chile', 'yugoslavia'],
        ALUMINIO: ['brasil', 'india', 'vietnam', 'groenlandia', 'cuba', 'costa_de_marfil', 'java', 'sumatra', 'borneo', 'kazajistan', 'turquia', 'iran', 'venezuela', 'yugoslavia'],
        CONDUCTORES_SEMICONDUCTORES: ['chile', 'china', 'siberia', 'congo', 'vietnam', 'australia', 'peru', 'india', 'mejico', 'filipinas', 'yugoslavia', 'polonia', 'canada'],
        HIDROCARBUROS: ['venezuela', 'arabia', 'iran', 'siberia', 'egipto', 'canada', 'texas', 'argentina', 'costa_de_marfil', 'noruega', 'reino_unido', 'alaska', 'mozambique', 'cuba', 'mexico'],
        COMBUSTIBLE_NUCLEAR: ['australia', 'kazajistan', 'quebec', 'india', 'brasil', 'sudafrica', 'argentina', 'sahel', 'tibet', 'siberia', 'congo'],
        MINERALES_BATERIAS: ['chile', 'tibet', 'argentina', 'mozambique', 'congo', 'siberia', 'california', 'mejico', 'canada', 'florida'],
    },

    technologies: {
        GANADERIA_INTENSIVA: ['brasil', 'argentina', 'california', 'polonia', 'china', 'india', 'alemania'],
        AGROINDUSTRIA_MASIVA: ['china', 'india', 'california', 'rusia', 'brasil', 'argentina', 'rumania', 'grecia', 'vietnam', 'tailandia', 'francia', 'canada', 'yugoslavia', 'mexico', 'italia'],
        DISTRIBUCION_AGUA: ['francia', 'california', 'alemania', 'rusia', 'japon', 'china', 'tailandia', 'argentina', 'espana', 'reino_unido'],
        INDUSTRIA_LIGERA: ['alemania', 'japon', 'polonia', 'nueva_york', 'turquia', 'argentina', 'brasil', 'china', 'korea', 'texas', 'canada', 'mejico', 'noruega', 'yugoslavia', 'filipinas', 'italia'],
        INDUSTRIA_PESADA: ['california', 'china', 'japon', 'india', 'turquia', 'alemania', 'iran', 'rusia', 'yugoslavia', 'texas', 'italia'],
        INDUSTRIA_ELECTRONICA: ['china', 'korea', 'japon', 'california', 'texas', 'alemania', 'vietnam', 'filipinas'],
        CENTRALES_TERMICAS: ['alemania', 'california', 'texas', 'rusia', 'argentina', 'noruega', 'francia', 'egipto', 'algeria'],
        ENERGIAS_RENOVABLES: ['china', 'california', 'texas', 'alemania', 'japon', 'suecia', 'polonia', 'korea', 'espana', 'australia'],

        // Split lists for Centrales Nucleares
        NUCLEAR_WAR: ['francia', 'china', 'rusia', 'california', 'nueva_york', 'texas', 'reino_unido', 'korea'],
        NUCLEAR_ENERGY: ['iran', 'japon', 'alemania', 'canada', 'argentina'],

        // Placeholder for type safety, will be overwritten in assignment logic
        CENTRALES_NUCLEARES: []
    }
};

// Helper to shuffle array
const shuffle = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export interface ActiveProviders {
    rawMaterials: Record<RawMaterialType, string[]>;
    technologies: Record<TechnologyType, string[]>;
    nuclearWarCapable: string[]; // Countries with nuclear tech that can be used for war
}

export const assignRegionResources = (numPlayers: number): ActiveProviders => {
    const assignedRawMaterials: Partial<Record<RawMaterialType, string[]>> = {};
    const assignedTechnologies: Partial<Record<TechnologyType, string[]>> = {};

    // 1. Raw Materials
    (Object.keys(PROVIDER_COUNTRIES.rawMaterials) as RawMaterialType[]).forEach(key => {
        if (key === 'COMBUSTIBLE_NUCLEAR') {
            // EXCEPTION: Exact quantity = numPlayers
            assignedRawMaterials[key] = shuffle(PROVIDER_COUNTRIES.rawMaterials[key]).slice(0, numPlayers);
        } else {
            // General Rule: 6 countries
            const list = PROVIDER_COUNTRIES.rawMaterials[key];
            const count = Math.min(list.length, 6);
            assignedRawMaterials[key] = shuffle(list).slice(0, count);
        }
    });

    // 2. Technologies

    // Nuclear Logic
    // numPlayers from War list + Remainder (to reach 6) from Energy list.
    const warList = shuffle(PROVIDER_COUNTRIES.technologies.NUCLEAR_WAR);
    const energyList = shuffle(PROVIDER_COUNTRIES.technologies.NUCLEAR_ENERGY);

    const warCount = Math.min(warList.length, numPlayers);
    const warProviders = warList.slice(0, warCount);

    const remainingSlots = 6 - warCount;
    const energyProviders = energyList.slice(0, Math.max(0, remainingSlots));

    assignedTechnologies['CENTRALES_NUCLEARES'] = [...warProviders, ...energyProviders];

    // Other Technologies
    const standardTechs: TechnologyType[] = [
        'GANADERIA_INTENSIVA', 'AGROINDUSTRIA_MASIVA', 'DISTRIBUCION_AGUA',
        'INDUSTRIA_LIGERA', 'INDUSTRIA_PESADA', 'INDUSTRIA_ELECTRONICA',
        'CENTRALES_TERMICAS', 'ENERGIAS_RENOVABLES'
    ];

    standardTechs.forEach(key => {
        const list = PROVIDER_COUNTRIES.technologies[key];
        const count = Math.min(list.length, 6);
        assignedTechnologies[key] = shuffle(list).slice(0, count);
    });

    return {
        rawMaterials: assignedRawMaterials as Record<RawMaterialType, string[]>,
        technologies: assignedTechnologies as Record<TechnologyType, string[]>,
        nuclearWarCapable: warProviders, // Track which have war capability
    };
};

/* 
   EXISTING DATA CONSTANTS
*/

export const RAW_MATERIAL_DATA: Record<RawMaterialType, { name: string; category: SupplyType; description: string }> = {
    CEREALES: { name: 'Cereales', category: 'food', description: 'Base de la cadena alimentaria.' },
    OLEAGINOSAS: { name: 'Oleaginosas', category: 'food', description: 'Producción de aceites y proteínas.' },
    AGUA_DULCE: { name: 'Agua Dulce', category: 'food', description: 'Recurso vital para agricultura y población.' },
    HIERRO: { name: 'Hierro', category: 'manufacture', description: 'Fundamental para la construcción y maquinaria.' },
    ALUMINIO: { name: 'Aluminio', category: 'manufacture', description: 'Ligero y resistente, clave para la industria.' },
    CONDUCTORES_SEMICONDUCTORES: { name: 'Conductores y Semiconductores', category: 'manufacture', description: 'Cerebros de la tecnología moderna.' },
    HIDROCARBUROS: { name: 'Hidrocarburos', category: 'energy', description: 'Fuente de energía fósil y plásticos.' },
    COMBUSTIBLE_NUCLEAR: { name: 'Combustible Nuclear', category: 'energy', description: 'Energía de alta densidad y riesgo.' },
    MINERALES_BATERIAS: { name: 'Litio y Tierras Raras', category: 'energy', description: 'Almacenamiento de energía.' },
};

export const TECHNOLOGY_DATA: Record<TechnologyType, { name: string; description: string }> = {
    GANADERIA_INTENSIVA: { name: 'Ganadería Intensiva', description: 'Maximiza producción de proteína animal.' },
    AGROINDUSTRIA_MASIVA: { name: 'Agroindustria', description: 'Procesamiento eficiente de alimentos a escala.' },
    DISTRIBUCION_AGUA: { name: 'Purificación de Agua', description: 'Potabilización y gestión hídrica avanzada.' },
    INDUSTRIA_LIGERA: { name: 'Industria Ligera', description: 'Producción de bienes de consumo y textiles.' },
    INDUSTRIA_PESADA: { name: 'Industria Pesada', description: 'Siderurgia, metalurgia y maquinaria pesada.' },
    INDUSTRIA_ELECTRONICA: { name: 'Electrónica Avanzada', description: 'Microchips y sistemas automatizados.' },
    CENTRALES_TERMICAS: { name: 'Centrales Térmicas', description: 'Procesamiento avanzado de combustibles fósiles.' },
    CENTRALES_NUCLEARES: { name: 'Tecnología Nuclear', description: 'Reactores de potencia y aplicaciones estratégicas.' },
    ENERGIAS_RENOVABLES: { name: 'Energías Renovables', description: 'Solar, eólica y alternativas sostenibles.' },
};

export const TECHNOLOGY_REQUIREMENTS: Record<TechnologyType, RawMaterialType> = {
    GANADERIA_INTENSIVA: 'OLEAGINOSAS',
    AGROINDUSTRIA_MASIVA: 'CEREALES',
    DISTRIBUCION_AGUA: 'AGUA_DULCE',
    INDUSTRIA_LIGERA: 'ALUMINIO',
    INDUSTRIA_PESADA: 'HIERRO',
    INDUSTRIA_ELECTRONICA: 'CONDUCTORES_SEMICONDUCTORES',
    CENTRALES_TERMICAS: 'HIDROCARBUROS',
    CENTRALES_NUCLEARES: 'COMBUSTIBLE_NUCLEAR',
    ENERGIAS_RENOVABLES: 'MINERALES_BATERIAS',
};

export const TECHNOLOGY_PRODUCES: Record<TechnologyType, SupplyType> = {
    GANADERIA_INTENSIVA: 'food',
    AGROINDUSTRIA_MASIVA: 'food',
    DISTRIBUCION_AGUA: 'food',
    INDUSTRIA_LIGERA: 'manufacture',
    INDUSTRIA_PESADA: 'manufacture',
    INDUSTRIA_ELECTRONICA: 'manufacture',
    CENTRALES_TERMICAS: 'energy',
    CENTRALES_NUCLEARES: 'energy',
    ENERGIAS_RENOVABLES: 'energy',
};

export const SUPPLY_TECHNOLOGIES: Record<SupplyType, TechnologyType[]> = {
    food: ['GANADERIA_INTENSIVA', 'AGROINDUSTRIA_MASIVA', 'DISTRIBUCION_AGUA'],
    manufacture: ['INDUSTRIA_LIGERA', 'INDUSTRIA_PESADA', 'INDUSTRIA_ELECTRONICA'],
    energy: ['CENTRALES_TERMICAS', 'CENTRALES_NUCLEARES', 'ENERGIAS_RENOVABLES'],
};

const ALL_RAW_MATERIALS = Object.keys(RAW_MATERIAL_DATA) as RawMaterialType[];
const ALL_TECHNOLOGIES = Object.keys(TECHNOLOGY_DATA) as TechnologyType[];

export const createTestInventory = (): ProductionInventory => {
    const rawMaterials: TerritoryCard[] = ALL_RAW_MATERIALS.map((type, index) => ({
        id: `rm-${index}`,
        type,
        category: 'rawMaterial',
        country: 'test_country',
        usedThisTurn: false
    }));

    const technologies: TerritoryCard[] = ALL_TECHNOLOGIES.map((type, index) => ({
        id: `tech-${index}`,
        type,
        category: 'technology',
        country: 'test_country',
        usedThisTurn: false
    }));

    return { rawMaterials, technologies };
};

// Padding Nuclear Fuel shortage with extra Energy (HIDROCARBUROS) cards
export const generateProductionDeck = (
    regionResources: ActiveProviders,
    numPlayers: number
): ProductionDeck => {
    const techCards: TerritoryCard[] = [];
    const rawCards: TerritoryCard[] = [];
    let techId = 0;
    let rawId = 0;

    // Generate Technology Cards (54 total: 6 per type × 9 types)
    Object.entries(regionResources.technologies).forEach(([techType, countries]) => {
        countries.forEach(country => {
            techCards.push({
                id: `tech-${techId++}`,
                type: techType as TechnologyType,
                category: 'technology',
                country,
                usedThisTurn: false,
            });
        });
    });

    // Generate Raw Material Cards (54 total, padding Nuclear Fuel)
    Object.entries(regionResources.rawMaterials).forEach(([materialType, countries]) => {
        countries.forEach(country => {
            rawCards.push({
                id: `raw-${rawId++}`,
                type: materialType as RawMaterialType,
                category: 'rawMaterial',
                country,
                usedThisTurn: false,
            });
        });
    });

    // Pad Nuclear Fuel shortage with extra Energy (HIDROCARBUROS) cards
    const nuclearFuelCount = regionResources.rawMaterials.COMBUSTIBLE_NUCLEAR?.length || numPlayers;
    const shortage = 6 - nuclearFuelCount;
    if (shortage > 0) {
        // Get random HIDROCARBUROS countries (already assigned)
        const energyCountries = regionResources.rawMaterials.HIDROCARBUROS || [];
        for (let i = 0; i < shortage && i < energyCountries.length; i++) {
            rawCards.push({
                id: `raw-${rawId++}`,
                type: 'HIDROCARBUROS' as RawMaterialType,
                category: 'rawMaterial',
                country: energyCountries[i % energyCountries.length],
                usedThisTurn: false,
            });
        }
    }

    console.log(`Generated Production Deck: ${techCards.length} tech, ${rawCards.length} raw`);

    return {
        technologies: techCards,
        rawMaterials: rawCards,
    };
};
