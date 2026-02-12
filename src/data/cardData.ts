import { type Regiment, type Tier } from '../types/gameTypes';

export interface CardDetail {
    name: string;
    description?: string;
}

export interface TierData {
    attack: string[]; // 5 variants
    defense: string[]; // 5 variants
}

export interface RegimentData {
    nameAttack: string;
    nameDefense: string;
    description: string;
    tiers: Record<Tier, TierData>;
}

export const CARD_DATA: Record<Regiment, RegimentData> = {
    'A': {
        nameAttack: "Regimiento Aéreo",
        nameDefense: "Defensa Aeroespacial",
        description: "Enfoque: Desde el soporte logístico hasta la supremacía de quinta generación.",
        tiers: {
            1: {
                attack: ["MQ-1C Gray Eagle", "Cessna AC-208", "Bell UH-1 Iroquois", "Mil Mi-8", "Embraer Super Tucano"],
                defense: ["FIM-92 Stinger", "Starstreak", "9K38 Igla", "Mistral", "Flakpanzer Gepard"]
            },
            2: {
                attack: ["A-10 Thunderbolt II", "AH-64E Apache", "Sukhoi Su-25", "F-16 Fighting Falcon", "Mikoyan MiG-29"],
                defense: ["Pantsir-S1", "NASAMS", "IRIS-T SLM", "Buk-M3", "HQ-17"]
            },
            3: {
                attack: ["F-22 Raptor", "Sukhoi Su-57", "F-35 Lightning II", "Eurofighter Typhoon", "B-2 Spirit"],
                defense: ["MIM-104 Patriot", "S-400 Triumf", "SAMP/T", "David's Sling", "HQ-9"]
            },
            4: {
                attack: ["B-21 Raider", "Tu-160M", "SR-71 Blackbird", "MQ-25 Stingray", "RQ-4 Global Hawk"],
                defense: ["THAAD", "S-500 Prometey", "Arrow 3", "GMD", "Aegis Ashore"]
            }
        }
    },
    'B': {
        nameAttack: "Regimiento de Infantería",
        nameDefense: "Defensa de Infantería y Blindados",
        description: "Enfoque: Movilidad blindada, blindados de combate y tanques pesados.",
        tiers: {
            1: {
                attack: ["Humvee M1114", "Oshkosh L-ATV", "BTR-80", "M113 APC", "Toyota Hilux"],
                defense: ["FGM-148 Javelin", "BGM-71 TOW", "9M133 Kornet", "Hesco Bastion", "Mina M18A1 Claymore"]
            },
            2: {
                attack: ["M2A3 Bradley", "BMP-3M", "Stryker Dragoon", "Boxer CRV", "Patria AMV"],
                defense: ["Trophy APS", "Iron Fist", "M1134 Stryker ATGM", "B1 Centauro", "Akeron MP"]
            },
            3: {
                attack: ["M1A2 SEPv2 Abrams", "Leopard 2A6", "T-90M Proryv", "Challenger 2", "Merkava Mk 4"],
                defense: ["Spike NLOS", "AFT-10", "M10 Booker", "Muros Berlin", "Shchel-1"]
            },
            4: {
                attack: ["T-14 Armata", "M1A2 SEPv3", "K2 Black Panther", "KF41 Lynx", "PL-01"],
                defense: ["Iron Beam", "Milrem THeMIS", "Nanomateriales de blindaje", "Sistema C4ISR", "Búnker de mando reforzado"]
            }
        }
    },
    'C': {
        nameAttack: "Regimiento de Artillería",
        nameDefense: "Defensa de Artillería y C-RAM",
        description: "Enfoque: Alcance, saturación de área y misilería de alta precisión.",
        tiers: {
            1: {
                attack: ["M120 Mortar", "L118 Light Gun", "M777 Howitzer", "D-30 Howitzer", "Soltam K6"],
                defense: ["AN/TPQ-53", "ARTHUR", "Zoopark-1M", "SLC-2 Radar", "Escudo de trinchera"]
            },
            2: {
                attack: ["M109A7 Paladin", "PzH 2000", "BM-21 Grad", "2S19 Msta-S", "Archer System"],
                defense: ["Phalanx LPWS", "MANTIS (C-RAM)", "Skynex", "Skyranger 30", "Centurion C-RAM"]
            },
            3: {
                attack: ["M142 HIMARS", "M270A1 MLRS", "TOS-1A", "K9 Thunder", "Caesar 8x8"],
                defense: ["Krasukha-4", "R-330ZH Zhitel", "Murmansk-BN", "Leer-3", "Jammer GPS portátil"]
            },
            4: {
                attack: ["MGM-140 ATACMS", "9K720 Iskander", "2S7M Malka", "DF-17", "Batería Iron Dome"],
                defense: ["Iron Dome", "Laser Avenger", "David's Sling", "APKWS defensivo", "Red de sensores integrados"]
            }
        }
    }
};
