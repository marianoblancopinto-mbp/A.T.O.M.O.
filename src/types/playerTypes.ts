import type { PlayerSupplies, ProductionInventory, RawMaterialType } from './productionTypes';

export interface SpecialCard {
    id: string;
    type: 'NUCLEAR_WEAPON' | 'SECRET_MINERAL' | 'ESPIONAJE' | 'NUCLEAR_DESIGN' | 'SECONDARY_MISSION' | 'PUENTE_BOSFORO' | 'PLANTA_DESALINIZADORA' | 'PLANTA_GEOTERMICA' | 'CRUCE_ANDES' | 'NORMANDY_LANDING' | 'ALEJANDRO_MAGNO' | 'SECRETOS_GUERRA';
    name: string;
    originCountry: string;
    description: string;
    createdAt: number;
}


export interface PlayerData {
    id: string | number;
    name: string;
    color: string;
    supplies: PlayerSupplies;
    resources: {
        rawMaterials: number;
        technology: number;
    };
    inventory: ProductionInventory;
    specialCards: SpecialCard[];
    secretMineralLocation: string | null;
    silos: string[]; // List of region IDs where silos are built
    siloStatus: Record<string, { status: 'active' | 'construction' | 'cooldown', turnsRemaining: number }>;
    siloFuelCards: Record<string, string | null>; // Map silo region ID -> fuel card ID
    mineralUsedThisTurn: boolean;
    nuclearDeploymentActive?: boolean; // Tracking active endgame process
    crossingAndesActive?: boolean;
    normandyLandingActive?: boolean;
    alejandroMagnoActive?: boolean;
    usedEspionageHqs: string[]; // Track which espionage HQs this player has used (max 4 total)
    activeSpecialMissions: { id: string; baseRegionId: string, startTime?: number }[]; // Active special missions
    secretWarData: {
        countryId: string;
        resourceType: RawMaterialType;
        agency: 'CIA' | 'MSS';
        isActive: boolean;
    }[];
}

export interface EspionageReport {
    type: 'silos' | 'mineral';
    data: any; // Can be refined later
}
