import { useState, useRef, useMemo } from 'react';
import type { PlayerData } from '../types/playerTypes';
import type { Card } from '../types/gameTypes';
import type { ProductionDeck } from '../types/productionTypes';
import type { ActiveProviders } from '../data/productionData';
import { REGIONS } from '../data/mapRegions';

// Game Phase Type
type GamePhase = 'splash' | 'menu' | 'history' | 'mission' | 'setup' | 'playing';

// Battle State Type
interface BattleState {
    isActive: boolean;
    attacker: PlayerData;
    defender: PlayerData;
    attackerHand: Card[];
    defenderHand: Card[];
    attackerBonuses: { art: number; inf: number };
    attackSourceId: string;
    targetRegionId: string;
    deck: Card[];
}



// Special Mission Definition
export interface SpecialMission {
    id: string;
    title: string;
    lore: string;
    description: string;
    highlightedText?: string;
    requirements: {
        control: string[];
        technology: string[];
        rawMaterials: string[];
    };
    visibleFor: string[];
}

interface UseTegMapStateProps {
    spectator?: boolean;
}

export const useTegMapState = ({ spectator = false }: UseTegMapStateProps) => {
    // ========== GAME PHASE ==========
    const [gamePhase, setGamePhase] = useState<GamePhase>(spectator ? 'playing' : 'splash');
    const [gameStarted, setGameStarted] = useState(spectator);
    const [numPlayers, setNumPlayers] = useState(2);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [tempNames, setTempNames] = useState<string[]>([]);

    // ========== GAME TIME ==========
    const [gameDate, setGameDate] = useState(new Date(2100, 0, 1));
    const [turnOrder, setTurnOrder] = useState<number[]>([]);
    const [turnOrderIndex, setTurnOrderIndex] = useState(0);
    const [showYearStart, setShowYearStart] = useState<number | null>(null);

    // ========== MAP STATE ==========
    const [owners, setOwners] = useState<Record<string, number | null>>({});
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
    const [regionResources, setRegionResources] = useState<ActiveProviders | null>(null);
    const [productionDeck, setProductionDeck] = useState<ProductionDeck | null>(null);

    // ========== UI OVERLAYS ==========
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [conquestData, setConquestData] = useState<{ player: PlayerData; regionName: string } | null>(null);
    const [defenseData, setDefenseData] = useState<{ player: PlayerData; regionName: string } | null>(null);
    const [showInventory, setShowInventory] = useState(false);
    const [inventoryPlayerIndex, setInventoryPlayerIndex] = useState<number | null>(null);

    // ========== RESOURCE MODALS ==========
    const [showRawMaterialsModal, setShowRawMaterialsModal] = useState(false);
    const [expandedRawMaterials, setExpandedRawMaterials] = useState<Set<string>>(new Set());
    const [showTechnologiesModal, setShowTechnologiesModal] = useState(false);
    const [expandedTechnologies, setExpandedTechnologies] = useState<Set<string>>(new Set());

    // ========== MISSION MODALS ==========
    const [showAntarcticaModal, setShowAntarcticaModal] = useState(false);
    const [showIstanbulModal, setShowIstanbulModal] = useState(false);
    const [showGeothermalModal, setShowGeothermalModal] = useState(false);
    const [showAndesModal, setShowAndesModal] = useState(false);
    const [showNormandyModal, setShowNormandyModal] = useState(false);
    const [showAlejandroModal, setShowAlejandroModal] = useState(false);
    const [showWarSecretsModal, setShowWarSecretsModal] = useState(false);
    const [warSecretsSelectedAgency, setWarSecretsSelectedAgency] = useState<'CIA' | 'MSS' | null>(null);
    const [showSpecialMissionModal, setShowSpecialMissionModal] = useState<string | null>(null);
    const [showSpecialMissionInfo, setShowSpecialMissionInfo] = useState<string | null>(null);
    const [showConfidentialModal, setShowConfidentialModal] = useState(false);
    const [showInventoryInMission, setShowInventoryInMission] = useState(false);

    // ========== BATTLE STATE ==========
    const [battleState, setBattleState] = useState<BattleState | null>(null);
    const [attackSourceSelection, setAttackSourceSelection] = useState<{
        targetId: string;
        validSources: string[];
    } | null>(null);
    const [usedAttackSources, setUsedAttackSources] = useState<Set<string>>(new Set());

    // ========== MINERAL EXTRACTION ==========
    const [showMineralExtractionModal, setShowMineralExtractionModal] = useState<string | null>(null);
    const [selectedMineralCards, setSelectedMineralCards] = useState<{
        techId: string | null;
        ironId: string | null;
        waterId: string | null;
    }>({ techId: null, ironId: null, waterId: null });

    // ========== NUCLEAR STATE ==========
    const [showNuclearWarInfo, setShowNuclearWarInfo] = useState<string | null>(null);
    const [showNuclearActivationModal, setShowNuclearActivationModal] = useState<string | null>(null);
    const [selectedActivationCards, setSelectedActivationCards] = useState<{
        techId: string | null;
        rawId: string | null;
    }>({ techId: null, rawId: null });
    const [showSiloConstructionModal, setShowSiloConstructionModal] = useState(false);
    const [selectedSiloCards, setSelectedSiloCards] = useState<{
        techLightId: string | null;
        techHeavyId: string | null;
        techElecId: string | null;
        ironId: string | null;
        alumId: string | null;
        semiId: string | null;
        targetRegionId: string | null;
    }>({ techLightId: null, techHeavyId: null, techElecId: null, ironId: null, alumId: null, semiId: null, targetRegionId: null });
    const [showNuclearDeploymentModal, setShowNuclearDeploymentModal] = useState(false);
    const [selectedNuclearFuelCardId, setSelectedNuclearFuelCardId] = useState<string | null>(null);
    const [selectedLaunchSilo, setSelectedLaunchSilo] = useState<string | null>(null);
    const [showSiloFuelSelection, setShowSiloFuelSelection] = useState(false);
    const [selectedSiloForFuel, setSelectedSiloForFuel] = useState<string | null>(null);
    const [showNuclearDesignInfo, setShowNuclearDesignInfo] = useState<string | null>(null);
    const [showNuclearGenSelection, setShowNuclearGenSelection] = useState(false);
    const [nuclearGenLocation, setNuclearGenLocation] = useState<string | null>(null);
    const [selectedNuclearTechId, setSelectedNuclearTechId] = useState<string | null>(null);
    const [selectedNuclearRawId, setSelectedNuclearRawId] = useState<string | null>(null);
    const [showNuclearAlert, setShowNuclearAlert] = useState<{ active: boolean; commanderName: string }>({ active: false, commanderName: '' });

    // ========== ESPIONAGE STATE ==========
    const [showEspionageModal, setShowEspionageModal] = useState(false);
    const [espionageTargetId, setEspionageTargetId] = useState<number | null>(null);
    const [espionageResult, setEspionageResult] = useState<{ type: 'silos' | 'mineral'; data: any } | null>(null);
    const [showEspionageGenSelection, setShowEspionageGenSelection] = useState(false);
    const [espionageGenHq, setEspionageGenHq] = useState<string | null>(null);
    const [selectedEspionageTechId, setSelectedEspionageTechId] = useState<string | null>(null);
    const [selectedEspionageRawId, setSelectedEspionageRawId] = useState<string | null>(null);
    const [showEspionageNetworkInfo, setShowEspionageNetworkInfo] = useState<string | null>(null);

    // ========== MISSION SELECTION STATE ==========
    const [selectedSpecialMissionBaseId, setSelectedSpecialMissionBaseId] = useState<string | null>(null);
    const [selectedSpecialMissionTechIds, setSelectedSpecialMissionTechIds] = useState<string[]>([]);
    const [selectedSpecialMissionRawIds, setSelectedSpecialMissionRawIds] = useState<string[]>([]);
    const [selectedNormandyTechId, setSelectedNormandyTechId] = useState<string | null>(null);
    const [selectedNormandyIronId, setSelectedNormandyIronId] = useState<string | null>(null);
    const [showDesalinizationModal, setShowDesalinizationModal] = useState<string | null>(null);
    const [selectedEnergySupplyId, setSelectedEnergySupplyId] = useState<string | null>(null);

    // ========== ENDGAME STATE ==========
    const [winner, setWinner] = useState<PlayerData | null>(null);
    const [endgameChoice, setEndgameChoice] = useState<'victory' | 'destruction' | null>(null);
    const [animationIndex, setAnimationIndex] = useState(-1);
    const themeSongRef = useRef<HTMLAudioElement | null>(null);



    // ========== DYNAMIC LORE ==========
    const proxyWarCountry = useMemo(() => {
        const excludedIds = new Set([
            'california', 'texas', 'nueva_york', 'flordia', 'alaska',
            'siberia', 'kamchakta', 'rusia', 'kazajistan',
            'china', 'australia', 'canada'
        ]);
        const candidates = REGIONS.filter(r => !excludedIds.has(r.id) && r.continent !== 'st5');
        const random = candidates[Math.floor(Math.random() * candidates.length)];
        return random ? random.title : 'País Desconocido';
    }, []);

    return {
        // Game Phase
        gamePhase, setGamePhase, gameStarted, setGameStarted, numPlayers, setNumPlayers,
        players, setPlayers, tempNames, setTempNames,

        // Game Time
        gameDate, setGameDate, turnOrder, setTurnOrder, turnOrderIndex, setTurnOrderIndex, showYearStart, setShowYearStart,

        // Map State
        owners, setOwners, currentPlayerIndex, setCurrentPlayerIndex, selectedRegionId, setSelectedRegionId,
        regionResources, setRegionResources, productionDeck, setProductionDeck,

        // UI Overlays
        showTurnOverlay, setShowTurnOverlay, conquestData, setConquestData, defenseData, setDefenseData,
        showInventory, setShowInventory, inventoryPlayerIndex, setInventoryPlayerIndex,

        // Resource Modals
        showRawMaterialsModal, setShowRawMaterialsModal, expandedRawMaterials, setExpandedRawMaterials,
        showTechnologiesModal, setShowTechnologiesModal, expandedTechnologies, setExpandedTechnologies,

        // Mission Modals
        showAntarcticaModal, setShowAntarcticaModal, showIstanbulModal, setShowIstanbulModal,
        showGeothermalModal, setShowGeothermalModal, showAndesModal, setShowAndesModal,
        showNormandyModal, setShowNormandyModal, showAlejandroModal, setShowAlejandroModal,
        showWarSecretsModal, setShowWarSecretsModal, warSecretsSelectedAgency, setWarSecretsSelectedAgency,
        showSpecialMissionModal, setShowSpecialMissionModal, showSpecialMissionInfo, setShowSpecialMissionInfo,
        showConfidentialModal, setShowConfidentialModal, showInventoryInMission, setShowInventoryInMission,

        // Battle State
        battleState, setBattleState, attackSourceSelection, setAttackSourceSelection,
        usedAttackSources, setUsedAttackSources,

        // Mineral Extraction
        showMineralExtractionModal, setShowMineralExtractionModal, selectedMineralCards, setSelectedMineralCards,

        // Nuclear State
        showNuclearWarInfo, setShowNuclearWarInfo, showNuclearActivationModal, setShowNuclearActivationModal,
        selectedActivationCards, setSelectedActivationCards, showSiloConstructionModal, setShowSiloConstructionModal,
        selectedSiloCards, setSelectedSiloCards, showNuclearDeploymentModal, setShowNuclearDeploymentModal,
        selectedNuclearFuelCardId, setSelectedNuclearFuelCardId, selectedLaunchSilo, setSelectedLaunchSilo,
        showSiloFuelSelection, setShowSiloFuelSelection, selectedSiloForFuel, setSelectedSiloForFuel,
        showNuclearDesignInfo, setShowNuclearDesignInfo, showNuclearGenSelection, setShowNuclearGenSelection,
        nuclearGenLocation, setNuclearGenLocation, selectedNuclearTechId, setSelectedNuclearTechId,
        selectedNuclearRawId, setSelectedNuclearRawId, showNuclearAlert, setShowNuclearAlert,

        // Espionage State
        showEspionageModal, setShowEspionageModal, espionageTargetId, setEspionageTargetId,
        espionageResult, setEspionageResult, showEspionageGenSelection, setShowEspionageGenSelection,
        espionageGenHq, setEspionageGenHq, selectedEspionageTechId, setSelectedEspionageTechId,
        selectedEspionageRawId, setSelectedEspionageRawId, showEspionageNetworkInfo, setShowEspionageNetworkInfo,

        // Mission Selection State
        selectedSpecialMissionBaseId, setSelectedSpecialMissionBaseId,
        selectedSpecialMissionTechIds, setSelectedSpecialMissionTechIds,
        selectedSpecialMissionRawIds, setSelectedSpecialMissionRawIds,
        selectedNormandyTechId, setSelectedNormandyTechId, selectedNormandyIronId, setSelectedNormandyIronId,
        showDesalinizationModal, setShowDesalinizationModal, selectedEnergySupplyId, setSelectedEnergySupplyId,

        // Endgame State
        winner, setWinner, endgameChoice, setEndgameChoice, animationIndex, setAnimationIndex, themeSongRef,



        // Dynamic Lore
        proxyWarCountry
    };
};

// Export types for external use
export type TegMapState = ReturnType<typeof useTegMapState>;
