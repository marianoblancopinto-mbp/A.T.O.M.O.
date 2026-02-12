// Raw Materials - Materias Primas
export type RawMaterialType =
    | 'OLEAGINOSAS'
    | 'CEREALES'
    | 'AGUA_DULCE'
    | 'HIERRO'
    | 'CONDUCTORES_SEMICONDUCTORES'
    | 'ALUMINIO'
    | 'HIDROCARBUROS'
    | 'MINERALES_BATERIAS'
    | 'COMBUSTIBLE_NUCLEAR';

// Technologies - Tecnologías
export type TechnologyType =
    // Food Production
    | 'GANADERIA_INTENSIVA'
    | 'AGROINDUSTRIA_MASIVA'
    | 'DISTRIBUCION_AGUA'
    // Manufacturing Production
    | 'INDUSTRIA_PESADA'
    | 'INDUSTRIA_LIGERA'
    | 'INDUSTRIA_ELECTRONICA'
    // Energy Production
    | 'CENTRALES_TERMICAS'
    | 'CENTRALES_NUCLEARES'
    | 'ENERGIAS_RENOVABLES';

// Supply Types
export type SupplyType = 'food' | 'manufacture' | 'energy';

// Card interfaces
export interface RawMaterialCard {
    id: string;
    type: RawMaterialType;
    name: string;
    country?: string;
    usedThisTurn?: boolean;
}

export interface TechnologyCard {
    id: string;
    type: TechnologyType;
    name: string;
    produces: SupplyType;
    requires: RawMaterialType;
    country?: string;
    usedThisTurn?: boolean;
}

// Player Inventory
export interface ProductionInventory {
    rawMaterials: TerritoryCard[];
    technologies: TerritoryCard[];
}

// Mapping: Technology -> Required Raw Material
export const TECHNOLOGY_REQUIREMENTS: Record<TechnologyType, RawMaterialType> = {
    // Food
    'GANADERIA_INTENSIVA': 'OLEAGINOSAS',
    'AGROINDUSTRIA_MASIVA': 'CEREALES',
    'DISTRIBUCION_AGUA': 'AGUA_DULCE',
    // Manufacturing
    'INDUSTRIA_PESADA': 'HIERRO',
    'INDUSTRIA_LIGERA': 'ALUMINIO',
    'INDUSTRIA_ELECTRONICA': 'CONDUCTORES_SEMICONDUCTORES',
    // Energy
    'CENTRALES_TERMICAS': 'HIDROCARBUROS',
    'CENTRALES_NUCLEARES': 'COMBUSTIBLE_NUCLEAR',
    'ENERGIAS_RENOVABLES': 'MINERALES_BATERIAS',
};

// Mapping: Technology -> Supply Type Produced
export const TECHNOLOGY_PRODUCES: Record<TechnologyType, SupplyType> = {
    // Food
    'GANADERIA_INTENSIVA': 'food',
    'AGROINDUSTRIA_MASIVA': 'food',
    'DISTRIBUCION_AGUA': 'food',
    // Manufacturing
    'INDUSTRIA_PESADA': 'manufacture',
    'INDUSTRIA_LIGERA': 'manufacture',
    'INDUSTRIA_ELECTRONICA': 'manufacture',
    // Energy
    'CENTRALES_TERMICAS': 'energy',
    'CENTRALES_NUCLEARES': 'energy',
    'ENERGIAS_RENOVABLES': 'energy',
};

// Mapping: Supply Type -> Technologies that produce it
export const SUPPLY_TECHNOLOGIES: Record<SupplyType, TechnologyType[]> = {
    'food': ['GANADERIA_INTENSIVA', 'AGROINDUSTRIA_MASIVA', 'DISTRIBUCION_AGUA'],
    'manufacture': ['INDUSTRIA_PESADA', 'INDUSTRIA_LIGERA', 'INDUSTRIA_ELECTRONICA'],
    'energy': ['CENTRALES_TERMICAS', 'CENTRALES_NUCLEARES', 'ENERGIAS_RENOVABLES'],
};

// Territory-based card (tied to a country)
export interface TerritoryCard {
    id: string;
    type: RawMaterialType | TechnologyType;
    category: 'rawMaterial' | 'technology';
    country: string; // Region ID that provides this card
    usedThisTurn: boolean;
    isDesalinizationPlant?: boolean; // Special flag for infrastructure cards that transfer on conquest
}

// Production Deck (all cards in the game)
export interface ProductionDeck {
    technologies: TerritoryCard[];
    rawMaterials: TerritoryCard[];
}

// New Supply Interfaces for tracking origin
export interface SupplyItem {
    id: string;
    type: SupplyType;
    originCountry: string; // Country of the Raw Material used
}

export interface PlayerSupplies {
    manufacture: SupplyItem[];
    food: SupplyItem[];
    energy: SupplyItem[];
}
