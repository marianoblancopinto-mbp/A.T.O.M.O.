import React, { useState, useEffect, useRef } from 'react';
import { BattleOverlay } from './BattleOverlay';

import { calculateRegionBonuses } from '../data/biomeData';

import { TurnOverlay } from './shared/overlays/TurnOverlay';
import { MapRender } from './game/MapRender';
import { SidebarPanel } from './game/SidebarPanel';
import { RegionInfoPanel } from './game/RegionInfoPanel';
import { RawMaterialsModal } from './game/RawMaterialsModal';
import { TechnologiesModal } from './game/TechnologiesModal';
import { ConquestOverlay } from './shared/overlays/ConquestOverlay';
import { ConfidentialInfoModal } from './game/ConfidentialInfoModal';
import { SpecialMissionModal } from './shared/modals/missions/SpecialMissionModal';
import { getSpecialMissions, type SpecialMission } from '../data/missionData';
import { EspionageGenerationModal } from './shared/modals/espionage/EspionageGenerationModal';
import { EspionageTargetSelectionModal } from './shared/modals/espionage/EspionageTargetSelectionModal';
import { EspionageNetworkInfoModal } from './shared/modals/espionage/EspionageNetworkInfoModal';
import { NuclearActivationModal } from './shared/modals/nuclear/NuclearActivationModal';
import { NuclearDesignGenerationModal } from './shared/modals/nuclear/NuclearDesignGenerationModal';
import { MineralExtractionModal } from './shared/modals/nuclear/MineralExtractionModal';
import { SiloConstructionModal } from './shared/modals/nuclear/SiloConstructionModal';
import { NuclearDesignInfoModal } from './shared/modals/nuclear/NuclearDesignInfoModal';
import { SiloFuelSelectionModal } from './shared/modals/nuclear/SiloFuelSelectionModal';
import { NuclearDeploymentModal } from './shared/modals/nuclear/NuclearDeploymentModal';
import { NuclearAlertModal } from './shared/modals/nuclear/NuclearAlertModal';
import { NuclearWarInfoModal } from './shared/modals/nuclear/NuclearWarInfoModal';
import { YearStartOverlay } from './shared/overlays/YearStartOverlay';
import { EndgameOverlay } from './shared/overlays/EndgameOverlay';
import { MissionNotificationOverlay } from './shared/overlays/MissionNotificationOverlay';
import {
    isMaritimeConnection
} from '../data/mapData';
import type {
    ProductionDeck,
    SupplyItem
} from '../types/productionTypes';
import { InventoryModal } from './InventoryModal';
import { useBattleState } from '../hooks/useBattleState';
import { REGIONS } from '../data/mapRegions';
import { AGENCY_NAMES } from '../data/constants';
import { useGameContext } from '../context/GameContext';
import { type PlayerData } from '../types/playerTypes';




export const TegMap: React.FC<{ spectator?: boolean }> = ({ spectator = false }) => {
    const { state, dispatch, multiplayer } = useGameContext();

    const {
        gamePhase,
        gameStarted,
        players,
        currentPlayerIndex,
        owners,
        productionDeck,
        gameDate,
        turnOrder,
        turnOrderIndex,
        regionResources
    } = state;

    // Helper wrappers for backward compatibility during migration
    const setPlayers = (action: React.SetStateAction<PlayerData[]>) => {
        if (typeof action === 'function') {
            dispatch({ type: 'UPDATE_PLAYERS_FN', payload: action as (prev: PlayerData[]) => PlayerData[] });
        } else {
            dispatch({ type: 'SET_PLAYERS', payload: action });
        }
    };

    const setOwners = (action: React.SetStateAction<Record<string, string | number | null>>) => {
        if (typeof action === 'function') {
            dispatch({ type: 'UPDATE_OWNERS_FN', payload: action as (prev: Record<string, string | number | null>) => Record<string, string | number | null> });
        } else {
            dispatch({ type: 'SET_OWNERS', payload: action });
        }
    };

    // const setGameDate = ... (removed unused)
    // const setCurrentPlayerIndex = ... (removed unused)
    // const setTurnOrder = ... (removed unused)
    // const setTurnOrderIndex = ... (removed unused)



    const setShowYearStart = (year: number | null) => { /* Visual only, keep local if needed or move to context? Keeping local for now as it's UI trigger */ _setShowYearStart(year); };
    const [showYearStartLocal, _setShowYearStart] = useState<number | null>(null);


    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [conquestData, setConquestData] = useState<{ player: PlayerData, regionName: string } | null>(null);
    const [defenseData, setDefenseData] = useState<{ player: PlayerData, regionName: string } | null>(null);
    const [showInventory, setShowInventory] = useState(false);
    const [inventoryPlayerIndex, setInventoryPlayerIndex] = useState<number | null>(null);
    const [showRawMaterialsModal, setShowRawMaterialsModal] = useState(false);
    const [expandedRawMaterials, setExpandedRawMaterials] = useState<Set<string>>(new Set());
    const [showTechnologiesModal, setShowTechnologiesModal] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Mission Modals State


    console.log('TegMap Render - Game Phase:', gamePhase);
    console.log('Game Started:', gameStarted);
    if (players.length === 0) console.log('Players empty');

    // Play State (Moved to Context)
    // const [owners, setOwners = useState<Record<string, number | null>>({}); // Removed
    // const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0); // Removed
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);



    // --- Dynamic Lore Generation (Now using synchronized state) ---
    // const proxyWarCountry = React.useMemo(() => { ... }); // REMOVED
    const proxyWarCountry = state.proxyWarCountry || 'País Desconocido';


    const SPECIAL_MISSIONS = React.useMemo<SpecialMission[]>(() =>
        getSpecialMissions(proxyWarCountry),
        [proxyWarCountry]);


    const [expandedTechnologies, setExpandedTechnologies] = useState<Set<string>>(new Set());
    const [showSpecialMissionModal, setShowSpecialMissionModal] = useState<string | null>(null);
    const [showSpecialMissionInfo, setShowSpecialMissionInfo] = useState<string | null>(null);
    const [showNuclearWarInfo, setShowNuclearWarInfo] = useState<string | null>(null); // Country ID for which the info is shown

    // Play State (Moved Up)





    // Play State (Moved Up)



    const {
        battleState,
        attackSourceSelection,
        setAttackSourceSelection,
        setUsedAttackSources,
        handleAttackClick,
        confirmAttackSource
    } = useBattleState({
        selectedRegionId,
        setConquestData,
        showTurnOverlay: showTurnOverlay || false,
        conquestData
    });

    // Special Modals
    const [showConfidentialModal, setShowConfidentialModal] = useState(false);
    const [showMineralExtractionModal, setShowMineralExtractionModal] = useState<string | null>(null);
    const [showNuclearActivationModal, setShowNuclearActivationModal] = useState<string | null>(null);
    const [showNuclearDeploymentModal, setShowNuclearDeploymentModal] = useState(false);


    // Silo Construction State
    const [showSiloConstructionModal, setShowSiloConstructionModal] = useState(false);

    const [winner, setWinner] = useState<PlayerData | null>(null);
    const themeSongRef = useRef<HTMLAudioElement | null>(null);
    const [endgameChoice, setEndgameChoice] = useState<'victory' | 'destruction' | null>(null);
    const [animationIndex, setAnimationIndex] = useState(-1);

    // Desalination Plant Mission State

    // Show Turn Overlay when it becomes my turn
    useEffect(() => {
        if (!gameStarted || !players[currentPlayerIndex]) return;
        const currentPlayerId = players[currentPlayerIndex].id;

        // In multiplayer, check if it's my ID.
        // In local/hotseat (multiplayer.playerId might be null or we are controller),
        // we might want to show it every time currentPlayerIndex changes.

        const isMyTurn = (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId)
            ? currentPlayerId === multiplayer.playerId
            : true; // Always show in hotseat

        if (isMyTurn && !showTurnOverlay && !winner && gamePhase === 'playing') {
            // Only show if we didn't just dismiss it? 
            // We can check if turnOrderIndex changed if we tracked "lastSeenTurn".
            // But simpler: if currentPlayerIndex changed, show it. 
            // Logic needs to ensure it doesn't pop up if I just closed it.
            // But existing logic sets it to true on endTurn.
            // If I close it, showTurnOverlay becomes false. CurrentPlayerIndex is still me.
            // So this effect would re-open it if I don't check for "change".
            // I need to track `prevPlayerIndex`.
            return;
        }
    }, [currentPlayerIndex]); // This is tricky without ref.

    // Better approach: Use a ref to track last processed player index.
    const lastPlayerIndexRef = useRef(currentPlayerIndex);

    useEffect(() => {
        if (!gameStarted || !players[currentPlayerIndex]) return;

        if (currentPlayerIndex !== lastPlayerIndexRef.current) {
            lastPlayerIndexRef.current = currentPlayerIndex;

            const currentPlayerId = players[currentPlayerIndex].id;
            const isMyTurn = (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId)
                ? currentPlayerId === multiplayer.playerId
                : true;

            if (isMyTurn && !winner && gamePhase === 'playing') {
                setShowTurnOverlay(true);
            }
        }
    }, [currentPlayerIndex, players, multiplayer.connectionStatus, multiplayer.playerId, gameStarted, winner, gamePhase]);




    // Silo Fuel Selection State
    const [showSiloFuelSelectionModal, setShowSiloFuelSelectionModal] = useState<string | null>(null);





    // Silo Fuel Selection State


    // Espionage State
    const [showEspionageModal, setShowEspionageModal] = useState(false);


    const [showEspionageGenSelection, setShowEspionageGenSelection] = useState(false);
    const [espionageGenHq, setEspionageGenHq] = useState<string | null>(null);

    const [showEspionageNetworkInfo, setShowEspionageNetworkInfo] = useState<string | null>(null); // Country ID for espionage network info

    // Nuclear Design State
    const [showNuclearDesignInfo, setShowNuclearDesignInfo] = useState<string | null>(null); // Country ID for nuclear design info
    const [showNuclearGenSelection, setShowNuclearGenSelection] = useState(false);
    const [nuclearGenLocation, setNuclearGenLocation] = useState<string | null>(null);










    // --- GameActions Hook ---
    // Centralizes game logic for future multiplayer support
    // --- GameActions Hook ---
    // Centralizes game logic for future multiplayer support





    // ... (Functions remain the same)
    // Intro Audio



    // Intro Audio (RESTORED TEMPORARILY TO FIX CRASH)
    const introAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        introAudioRef.current = new Audio('/intro_soundtrack.wav');
        introAudioRef.current.loop = true;

        if (gamePhase === 'splash' && !spectator) {
            // introAudioRef.current.play().catch(e => console.log('Audio autoplay prevented:', e));
        }

        return () => {
            if (introAudioRef.current) {
                introAudioRef.current.pause();
                introAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    useEffect(() => {
        // Handle audio playback based on gamePhase
        const audio = introAudioRef.current;
        if (!audio) return;

        // Phases where audio should play
        const playingPhases = ['splash', 'history', 'mission', 'setup'];

        if (playingPhases.includes(gamePhase)) {
            // Ensure it's playing
            if (audio.paused) {
                // audio.play().catch(e => {});
            }
        } else {
            // Stop logic for other phases (e.g., 'playing')
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
    }, [gamePhase]);

    // Synchronization Channel
    useEffect(() => {
        const channel = new BroadcastChannel('teg_game_sync');

        if (spectator) {
            channel.onmessage = (event) => {
                const { type, payload } = event.data;
                if (type === 'STATE_UPDATE') {
                    dispatch({ type: 'SET_OWNERS', payload: payload.owners });
                    dispatch({ type: 'SET_PLAYERS', payload: payload.players });
                    if (payload.gameDate) {
                        dispatch({ type: 'SET_GAME_DATE', payload: new Date(payload.gameDate) });
                    }
                }
            };
        }

        return () => channel.close();
    }, [spectator, dispatch]);

    // Controller Broadcast
    useEffect(() => {
        if (!spectator && gameStarted) {
            const channel = new BroadcastChannel('teg_game_sync');
            channel.postMessage({
                type: 'STATE_UPDATE',
                payload: {
                    owners,
                    players,
                    gameDate: gameDate.getTime()
                }
            });
            channel.close();
        }
    }, [owners, players, gameDate, spectator, gameStarted]);

    // Spectator Mode Initialization (Context Sync)
    useEffect(() => {
        if (spectator) {
            dispatch({ type: 'SET_GAME_PHASE', payload: 'playing' });
            dispatch({ type: 'SET_GAME_STARTED', payload: true });
        }
    }, [spectator, dispatch]);


    // --- Mission Handlers ---






    // Validate Special Card Ownership
    useEffect(() => {
        if (!gameStarted || players.length === 0) return;

        let cardsRemoved = false;
        const updatedPlayers = players.map(p => {
            if (p.specialCards.length === 0) return p;

            const validCards = p.specialCards.filter(card => {
                // Must own the origin country to keep the card
                const isOwner = owners[card.originCountry] === p.id;
                return isOwner;
            });

            if (validCards.length !== p.specialCards.length) {
                cardsRemoved = true;
                return { ...p, specialCards: validCards };
            }
            return p;
        });

        if (cardsRemoved) {
            setPlayers(updatedPlayers);
            // Optionally notify user
        }
    }, [owners, gameStarted]);

























    const handleOpenEspionageGen = (hqId: string) => {
        setEspionageGenHq(hqId);
        setShowEspionageGenSelection(true);
        setShowConfidentialModal(false); // Close the info modal to show selection
    };

    // Espionage logic moved to useGameActions and EspionageTargetSelectionModal

    // Reset card usage at turn start
    const resetCardUsageForTurn = () => {
        if (!productionDeck) return;
        dispatch({
            type: 'UPDATE_PRODUCTION_DECK_FN', payload: (prev: ProductionDeck | null) => {
                if (!prev) return null;
                return {
                    technologies: prev.technologies.map(card => ({ ...card, usedThisTurn: false })),
                    rawMaterials: prev.rawMaterials.map(card => ({ ...card, usedThisTurn: false })),
                };
            }
        });
    };

    // Mark a card as used this turn




    const handleRegionClick = (regionId: string) => {
        if (!gameStarted || showTurnOverlay || conquestData) return;
        setSelectedRegionId(regionId);
    };























    const endTurn = () => {
        // 1. Calculate Initial Player Updates (Reset flags for current player)
        let updatedPlayers = players.map(p => {
            if (p.id === players[currentPlayerIndex].id) {
                return {
                    ...p,
                    crossingAndesActive: false,
                    normandyLandingActive: false
                };
            }
            return p;
        });

        const nextOrderIndex = turnOrderIndex + 1;
        const isEndOfRound = nextOrderIndex >= players.length;

        // 2. Advance Months
        const maxMonthsPerTurn = Math.floor(12 / players.length);
        const monthsToAdd = Math.floor(Math.random() * (maxMonthsPerTurn + 1));
        const dateWithMonths = new Date(gameDate);
        dateWithMonths.setMonth(dateWithMonths.getMonth() + monthsToAdd);

        let nextGameDate = dateWithMonths;
        let nextTurnOrder = [...turnOrder];
        let nextTurnOrderIndex = nextOrderIndex;
        let nextPlayerIdx = turnOrder[nextOrderIndex];
        let nextWinner: PlayerData | null = null;
        let nextNotification: any = null;

        // 3. Handle End of Round (New Year)
        if (isEndOfRound) {
            // A. Check Nuclear Win Condition
            const activeDeployments = updatedPlayers.filter(p => p.nuclearDeploymentActive);

            if (activeDeployments.length === 1) {
                // WINNER
                nextWinner = activeDeployments[0];
                nextNotification = {
                    type: 'GAME_OVER',
                    title: '\u00A1DOMINIO TOTAL!',
                    message: `${activeDeployments[0].name} ha completado el despliegue nuclear. La guerra ha terminado.`,
                    color: activeDeployments[0].color,
                    playerName: activeDeployments[0].name
                };
            } else if (activeDeployments.length > 1) {
                // Mutual Deterrence
                nextNotification = {
                    type: 'NEUTRALIZED',
                    title: 'DETENCIÓN MUTUA',
                    message: 'Protocolo de Destrucción Mutua Asegurada evitado por desactivación sistémica. Despliegues abortados.',
                    color: '#ffaa00'
                };

                updatedPlayers = updatedPlayers.map(p => {
                    if (p.nuclearDeploymentActive) {
                        const newSiloStatus = { ...p.siloStatus };
                        Object.keys(newSiloStatus).forEach(sid => {
                            newSiloStatus[sid] = { status: 'cooldown', turnsRemaining: 2 };
                        });
                        return { ...p, nuclearDeploymentActive: false, siloStatus: newSiloStatus };
                    }
                    return p;
                });
            }

            if (!nextWinner) {
                // B. Increment Year
                const nextYear = gameDate.getFullYear() + 1;
                nextGameDate = new Date(nextYear, 0, 1);

                // C. Shuffle New Order
                const newOrder = Array.from({ length: players.length }, (_, i) => i);
                for (let i = newOrder.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
                }
                nextTurnOrder = newOrder;
                nextTurnOrderIndex = 0;
                nextPlayerIdx = newOrder[0];
            }
        }

        if (nextWinner) {
            // Dispatch Game Over
            dispatch({
                type: 'PROCESS_TURN_CHANGE',
                payload: {
                    players: updatedPlayers,
                    gameDate: nextGameDate,
                    turnOrderIndex: turnOrderIndex, // Freeze index?
                    currentPlayerIndex: currentPlayerIndex, // Freeze player?
                    turnOrder: turnOrder,
                    notification: nextNotification,
                    winner: nextWinner
                }
            });
            // Local effects
            setWinner(nextWinner);
            themeSongRef.current?.play();
            return;
        }

        // 4. Update Timers for NEXT player
        const actualNextPlayerIdx = nextPlayerIdx; // This is the index in `players` array

        updatedPlayers = updatedPlayers.map((p, idx) => {
            if (idx === actualNextPlayerIdx) {
                const newSiloStatus = { ...p.siloStatus };
                // Decrement silo timers
                if (newSiloStatus) {
                    Object.keys(newSiloStatus).forEach(sid => {
                        if (newSiloStatus[sid].turnsRemaining > 0) {
                            newSiloStatus[sid].turnsRemaining -= 1;
                            if (newSiloStatus[sid].turnsRemaining === 0) {
                                newSiloStatus[sid].status = 'active';
                            }
                        }
                    });
                }

                // Geothermal Energy Renewal
                const geothermalCards = p.specialCards.filter(c => c.type === 'PLANTA_GEOTERMICA');
                const newEnergySupplies: SupplyItem[] = geothermalCards.map((c, i) => ({
                    id: `geo-energy-${c.originCountry}-${Date.now()}-${i}`,
                    type: 'energy',
                    originCountry: c.originCountry
                }));

                const updatedSupplies = {
                    ...p.supplies,
                    energy: [...p.supplies.energy, ...newEnergySupplies]
                };

                return {
                    ...p,
                    siloStatus: newSiloStatus,
                    mineralUsedThisTurn: false,
                    supplies: updatedSupplies,
                    // Mission flags defined in block 1 were for OLD current player.
                    // New current player shouldn't have them reset unless they were already false.
                };
            }
            return p;
        });

        // 5. Dispatch Atomic Update
        dispatch({
            type: 'PROCESS_TURN_CHANGE',
            payload: {
                players: updatedPlayers,
                gameDate: nextGameDate,
                turnOrderIndex: nextTurnOrderIndex,
                currentPlayerIndex: nextPlayerIdx,
                turnOrder: nextTurnOrder,
                notification: nextNotification
            }
        });

        // Local UI resets
        setUsedAttackSources(new Set());
        setSelectedRegionId(null);

        // Note: setShowYearStart and setShowTurnOverlay will need to react to state changes or local checks
        if (isEndOfRound && !nextWinner) {
            // We can't set local state here for other clients easily unless we trigger off the state change.
            // But valid to set it locally for the active player who clicked.
            setShowYearStart(nextGameDate.getFullYear());
        } else if (!nextWinner) {
            setShowTurnOverlay(true);
        }
    };

    const hasNuclearUnlock = (player: PlayerData) => {
        if (!player) return false;
        const hasDesign = player.specialCards.some(c => c.name.includes("DISEÑO DE ARMAS"));
        const hasSilo = player.specialCards.some(c => c.name.includes("SILO"));
        // Check for extraction (Mineral Secreto)
        const hasMineral = player.specialCards.some(c => c.type === 'SECRET_MINERAL');
        return hasDesign && hasSilo && hasMineral;
    };

    const handleOpenConfidential = () => {
        setShowConfidentialModal(true);
    };

    // Deactivate deployment if Silo region is conquered
    useEffect(() => {
        if (conquestData) {
            setPlayers(prev => prev.map(p => {
                if (p.nuclearDeploymentActive) {
                    // Find their silos
                    const mySiloCards = p.specialCards.filter(c => c.name.includes("SILO"));
                    // Check if they still own at least one Silo country
                    const hasSafeSilo = mySiloCards.some(silo => owners[silo.originCountry] === p.id);

                    if (!hasSafeSilo) {
                        alert(`Úñ DESPLIEGUE NEUTRALIZADO Úñ\n\n${p.name} ha perdido sus silos de lanzamiento estratégicos.`);
                        return { ...p, nuclearDeploymentActive: false };
                    }
                }
                return p;
            }));
        }
    }, [owners, conquestData]);



    const handleEndgameChoice = (choice: 'victory' | 'destruction') => {
        setEndgameChoice(choice);
        setAnimationIndex(0);
    };

    useEffect(() => {
        if (animationIndex >= 0 && animationIndex < REGIONS.length && endgameChoice && winner) {
            const timer = setTimeout(() => {
                const region = REGIONS[animationIndex];
                if (endgameChoice === 'victory') {
                    setOwners(prev => ({ ...prev, [region.id]: winner.id }));
                } else {
                    // destruction - enemy countries turn black
                    if (owners[region.id] !== winner.id) {
                        setOwners(prev => ({ ...prev, [region.id]: -2 }));
                    }
                }
                setAnimationIndex(prev => prev + 1);
            }, 150); // Slightly slower for better effect
            return () => clearTimeout(timer);
        }
    }, [animationIndex, endgameChoice, winner]);



    // Mission Destruction Logic (If Base is Conquered)
    useEffect(() => {
        if (conquestData) {
            setPlayers(prev => prev.map(p => {
                if (p.activeSpecialMissions.length > 0) {
                    const missionsToKeep = p.activeSpecialMissions.filter(mission => {
                        // Check if the player still owns the base of operations for this mission
                        if (!mission.baseRegionId) return true; // Safety check
                        const stillOwnsBase = owners[mission.baseRegionId] === p.id;

                        if (!stillOwnsBase) {
                            dispatch({
                                type: 'SET_NOTIFICATION',
                                payload: {
                                    type: 'NEUTRALIZED',
                                    title: 'OPERACIÓN ESPECIAL ABORTADA',
                                    message: `La base de operaciones en ${REGIONS.find(r => r.id === mission.baseRegionId)?.title} ha caído. La misión ${mission.id} ha sido cancelada.`,
                                    color: '#ff4444',
                                    playerName: p.name
                                }
                            });
                        }
                        return stillOwnsBase;
                    });

                    // Also check for Route Disruption (Option B from user request)
                    // "si un jugador conquista un pais de la ruta que no es sede de la base de operaciones, la ruta se desactiva pero la base no se destruye"
                    // This logic is implicitly handled because checkSupplyRoute is dynamic. 
                    // If the path is broken, the resource won't be available, but the MISSION itself stays active in the player's list 
                    // unless the BASE is destroyed. The "active" status in UI might need to reflect "Route Blocked" if we want to be fancy,
                    // but for now, the requirement says "la ruta se desactiva but base not destroyed", which implies the BENEFIT is lost.
                    // The benefit IS the route itself (Argentina-Sudafrica).
                    // So we must ensure that the Argentina-Sudafrica connection ONLY works if the route from Base -> Argentina/Sudafrica exists?
                    // Or is the "Ruta Antártica" itself just the link? 
                    // User said: "si el jugador activo esta misión, efectivamente se establezca la ruta... SOLO SI LA MISIÓN ESTA ACTIVADA, QUE SUDAFRICA SEA LIMITROFE A ARGENTINA"
                    // So if we keep the mission in the list, the route exists.
                    // BUT user also said: "si un jugador conquista un pais de la ruta que no es sede de la base... la ruta se desactiva".
                    // This implies we need to check continuity to the base even for the inter-continental bonus.
                    // This is complex to calculate inside the `checkSupplyRoute` purely based on "Mission Active".
                    // Ideally, `checkSupplyRoute` should verify the path to base.

                    // Remove associated cards for destroyed missions
                    if (missionsToKeep.length !== p.activeSpecialMissions.length) {
                        const destroyedMissions = p.activeSpecialMissions.filter(m => !missionsToKeep.includes(m));
                        const newSpecialCards = p.specialCards.filter(card => {
                            const isDestroyedAntarctica = destroyedMissions.some(dm => dm.id === 'ruta_antartica' && card.name === 'RUTA ANTÁRTICA' && card.originCountry === dm.baseRegionId);
                            return !isDestroyedAntarctica;
                        });
                        return { ...p, activeSpecialMissions: missionsToKeep, specialCards: newSpecialCards };
                    }
                }
                return p;
            }));
        }
    }, [owners, conquestData]);

    // Enhanced Check Supply Route with Mission Logic
    // We overwrite the imported function locally or wrap it. 
    // Since checkSupplyRoute is imported, we can't easily modify it to see the component state (active missions).
    // So we will define a wrapper here or modify the logic passed to components.
    // Actually, checkSupplyRoute is used in Modals.
    // Ideally we update the `REGION_ADJACENCY` or `MARITIME_ROUTES` dynamically, but they are constants.
    // BETTER APPROACH: Create a contextual adjacency getter.


    // But wait, checkSupplyRoute is a standalone function in mapData.ts. 
    // It doesn't have access to `players` state. 
    // I should redefine `checkSupplyRoute` inside the component OR pass the active missions to it.
    // The previous tool usage `checkSupplyRoute` in modals (lines ~3200, 4600, 4700) calls the imported one.
    // I need to update those calls to use a local version that accounts for `activeSpecialMissions`.



    // Wait, I can't redefine checkSupplyRoute in mapData easily without updating all imports.
    // Let's modify mapData.ts to accept an optional `extraConnections` parameter.



    if (!gameStarted || (gamePhase === 'playing' && players.length === 0)) {
        return (
            <div style={{
                width: '100vw', height: '100vh', backgroundColor: '#000',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: '#00ff00', fontFamily: 'monospace', fontSize: '1.5rem',
                letterSpacing: '3px'
            }}>
                {spectator ? '>> ESTABLECIENDO CONEXIÓN CON EL SATÉLITE...' : '>> CARGANDO SISTEMAS TÁCTICOS...'}
            </div>
        );
    }



    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000000',
            overflow: 'hidden',
            display: 'flex', // Flex layout
            fontFamily: "'Courier New', Courier, monospace",
            // Retro grid effect
            backgroundImage: 'linear-gradient(rgba(0, 50, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 50, 0, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}>
            {/* ... Turn Overlay ... */}
            {/* ... Turn Overlay ... */}
            {!spectator && gameStarted && showTurnOverlay && players[currentPlayerIndex] && (
                <TurnOverlay
                    player={players[currentPlayerIndex]}
                    onClose={() => {
                        resetCardUsageForTurn();
                        setShowTurnOverlay(false);
                    }}
                />
            )}

            {/* Conquest Overlay */}
            {/* Conquest Overlay */}
            {!spectator && conquestData && (
                <ConquestOverlay
                    data={conquestData}
                    type="conquest"
                    onClose={() => setConquestData(null)}
                />
            )}

            {/* Defense Overlay */}
            {!spectator && defenseData && (
                <ConquestOverlay
                    data={defenseData}
                    type="defense"
                    onClose={() => setDefenseData(null)}
                />
            )}






            {/* Battle Overlay */}
            {battleState && battleState.isActive && (
                <BattleOverlay
                    battleState={battleState}
                    defenseBonuses={calculateRegionBonuses(battleState.targetRegionId)}
                    onOpenInventory={() => {
                        setInventoryPlayerIndex(currentPlayerIndex);
                        setShowInventory(true);
                    }}
                />
            )}

            {/* Side Bar */}
            {!spectator && (
                <SidebarPanel
                    onEndTurn={endTurn}
                    onOpenInventory={() => {
                        setInventoryPlayerIndex(currentPlayerIndex);
                        setShowInventory(true);
                    }}
                    onOpenRawMaterials={() => setShowRawMaterialsModal(true)}
                    onOpenTechnologies={() => setShowTechnologiesModal(true)}
                    onOpenConfidential={() => setShowConfidentialModal(true)}
                    mobileOpen={showMobileSidebar}
                    onCloseMobile={() => setShowMobileSidebar(false)}
                />
            )}

            <div style={{
                flex: 1,
                height: window.innerWidth <= 768 ? 'auto' : '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Mobile Menu Toggle Button */}
                {!spectator && (
                    <button
                        onClick={() => setShowMobileSidebar(true)}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            zIndex: 80,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#00ff00',
                            border: '1px solid #00ff00',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            display: window.innerWidth <= 768 ? 'block' : 'none'
                        }}
                    >
                        MENÚ
                    </button>
                )}
                <div style={{ flex: 1, position: 'relative' }}>

                    <MapRender
                        selectedRegionId={selectedRegionId}
                        onRegionClick={handleRegionClick}
                        spectator={spectator}
                    />
                </div>

                {/* Attack Source Selection Modal - Centered */}
                {!spectator && attackSourceSelection && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#000',
                        border: '2px solid #00ff00',
                        padding: '20px',
                        zIndex: 100,
                        boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)',
                        minWidth: '300px',
                        maxWidth: '80vw'
                    }}>
                        <div style={{
                            color: '#00ff00',
                            marginBottom: '15px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            borderBottom: '1px solid #00ff00',
                            paddingBottom: '5px',
                            textTransform: 'uppercase'
                        }}>
                            <span style={{ animation: 'blink 1s infinite' }}>&gt;</span> SELECCIONAR ORIGEN
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {attackSourceSelection.validSources.map(sourceId => (
                                <button
                                    key={sourceId}
                                    onClick={() => confirmAttackSource(sourceId)}
                                    style={{
                                        background: '#001100',
                                        color: '#00ff00',
                                        border: '1px solid #005500',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontFamily: 'monospace',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#003300';
                                        e.currentTarget.style.borderColor = '#00ff00';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#001100';
                                        e.currentTarget.style.borderColor = '#005500';
                                    }}
                                >
                                    <span>{REGIONS.find(r => r.id === sourceId)?.title || sourceId}</span>
                                    {isMaritimeConnection(sourceId, attackSourceSelection.targetId) && <span style={{ marginLeft: '10px' }}> (M)</span>}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setAttackSourceSelection(null)}
                            style={{
                                marginTop: '15px',
                                background: 'transparent',
                                color: '#005500',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'center',
                                fontSize: '0.8rem',
                                textTransform: 'uppercase'
                            }}
                        >
                            CANCELAR
                        </button>
                    </div>
                )}

                {/* Inventory Modal */}
                {!spectator && gameStarted && (
                    <InventoryModal
                        isOpen={showInventory}
                        onClose={() => {
                            setShowInventory(false);
                            setInventoryPlayerIndex(null); // Reset when closed
                        }}
                        battleTargetId={
                            battleState?.isActive
                                ? (String(players[inventoryPlayerIndex!]?.id) === String(battleState.attacker.id)
                                    ? battleState.attackSourceId
                                    : battleState.targetRegionId)
                                : (['planta_desalinizacion', 'energia_geotermica', 'cruce_andes', 'desembarco_normandia', 'alejandro_magno'].includes(showSpecialMissionModal as string)
                                    ? (showSpecialMissionModal === 'desembarco_normandia' ? 'reino_unido'
                                        : (showSpecialMissionModal === 'cruce_andes' ? 'argentina'
                                            : (showSpecialMissionModal === 'alejandro_magno' ? 'grecia'
                                                : selectedRegionId)))
                                    : null)
                        }
                    />
                )}

                {/* Bottom Information Panel */}
                {!spectator && selectedRegionId && (
                    <RegionInfoPanel
                        selectedRegionId={selectedRegionId}
                        specialMissions={SPECIAL_MISSIONS}
                        onClose={() => setSelectedRegionId(null)}
                        onAttack={handleAttackClick}
                        onShowNuclearDesignInfo={setShowNuclearDesignInfo}
                        onShowMineralExtraction={setShowMineralExtractionModal}
                        onShowEspionageNetworkInfo={setShowEspionageNetworkInfo}
                        onShowSpecialMissionInfo={setShowSpecialMissionInfo}
                    />
                )}


                <RawMaterialsModal
                    show={showRawMaterialsModal}
                    onClose={() => {
                        setShowRawMaterialsModal(false);
                        setExpandedRawMaterials(new Set());
                    }}
                    expandedRawMaterials={expandedRawMaterials}
                    setExpandedRawMaterials={setExpandedRawMaterials}
                />



                <TechnologiesModal
                    show={showTechnologiesModal}
                    onClose={() => {
                        setShowTechnologiesModal(false);
                        setExpandedTechnologies(new Set());
                    }}
                    expandedTechnologies={expandedTechnologies}
                    setExpandedTechnologies={setExpandedTechnologies}
                />


                {/* CONFIDENTIAL INFO BUTTON */}
                {
                    hasNuclearUnlock(players[currentPlayerIndex]) && !showTurnOverlay && (
                        <button
                            onClick={handleOpenConfidential}
                            style={{
                                position: 'absolute',
                                top: '60px',
                                right: '20px',
                                padding: '10px 20px',
                                backgroundColor: '#330000',
                                color: '#ff0000',
                                border: '2px solid #ff0000',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                zIndex: 1000,
                                boxShadow: '0 0 15px #ff0000',
                                animation: 'pulse-red 2s infinite'
                            }}
                        >
                            Úñ INFO CONFIDENCIAL
                        </button>
                    )
                }

                {/* CONFIDENTIAL INFO MODAL */}


                {/* Nuclear War Info Modal */}
                {showNuclearWarInfo && (
                    <NuclearWarInfoModal
                        regionId={showNuclearWarInfo}
                        onClose={() => setShowNuclearWarInfo(null)}
                        onActivate={(rid) => {
                            setShowNuclearActivationModal(rid);
                            setShowNuclearWarInfo(null);
                        }}
                    />

                )}


                {/* Special Mission Modal */}
                {
                    showSpecialMissionModal && (
                        <SpecialMissionModal
                            missionId={showSpecialMissionModal}
                            onClose={() => setShowSpecialMissionModal(null)}
                            proxyWarCountryName={proxyWarCountry}
                            selectedRegionId={selectedRegionId}

                            setShowInventory={setShowInventory}
                            setInventoryPlayerIndex={setInventoryPlayerIndex}
                        />
                    )
                }

                {/* Nuclear Activation Modal */}
                <NuclearActivationModal
                    show={!spectator ? showNuclearActivationModal : null}
                    onClose={() => setShowNuclearActivationModal(null)}
                />


                {/* Mineral Extraction Modal */}
                <MineralExtractionModal
                    show={!spectator ? showMineralExtractionModal : null}
                    onClose={() => setShowMineralExtractionModal(null)}
                />


                {/* Silo Construction Modal */}
                <SiloConstructionModal
                    show={!spectator && showSiloConstructionModal}
                    onClose={() => setShowSiloConstructionModal(false)}
                />


                {/* Confidential Information Modal */}
                <NuclearDeploymentModal
                    show={!spectator && showNuclearDeploymentModal}
                    onClose={() => setShowNuclearDeploymentModal(false)}
                />

                {/* Confidential Information Modal */}
                {
                    !spectator && showConfidentialModal && (() => {
                        const player = players.find(p => p.id === currentPlayerIndex);
                        if (!player) return null;

                        return (
                            <div style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.9)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 4000
                            }}>
                                <div style={{
                                    backgroundColor: '#001a1a',
                                    border: '2px solid #00ffff',
                                    padding: '30px',
                                    width: '800px',
                                    maxWidth: '90%',
                                    maxHeight: '80vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #00ffff', paddingBottom: '10px' }}>
                                        <h2 style={{ color: '#00ffff', margin: 0 }}>INFORMACIÓN CONFIDENCIAL</h2>
                                        <button
                                            onClick={() => setShowConfidentialModal(false)}
                                            style={{ background: 'none', border: 'none', color: '#00ffff', fontSize: '1.5rem', cursor: 'pointer' }}
                                        >
                                            X
                                        </button>
                                    </div>

                                    <h3 style={{ color: '#aaa', marginBottom: '15px' }}>Proyectos Especiales y Armas Estratégicas</h3>

                                    {/* Secret Mission Display */}
                                    {player.secretMineralLocation && (
                                        <div style={{
                                            marginBottom: '20px',
                                            padding: '15px',
                                            border: '1px solid #00ffff',
                                            backgroundColor: '#002222',
                                            borderRadius: '5px'
                                        }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#00ffff' }}>MISIÓN: MINERAL SECRETO</h4>
                                            <div style={{ color: '#fff' }}>
                                                Ubicación Objetivo: <span style={{ fontWeight: 'bold', color: '#00ff00' }}>{REGIONS.find(r => r.id === player.secretMineralLocation)?.title || player.secretMineralLocation}</span>
                                            </div>
                                            <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '5px' }}>
                                                Requiere control del territorio, Tecnología de Industria Pesada, y Suministro de Hierro y Agua.
                                            </div>
                                        </div>
                                    )}

                                    {/* Special Operations Section */}
                                    {(() => {
                                        const availableMissions = SPECIAL_MISSIONS.filter(m => {
                                            // Mission is available if player controls ANY of the visibility regions OR if it's GLOBAL
                                            // AND has not completed/activated it yet
                                            const hasAccess = m.visibleFor.includes('GLOBAL') || m.visibleFor.some(id => owners[id] === currentPlayerIndex);
                                            const alreadyActive = player.activeSpecialMissions.some(am => am.id === m.id);
                                            return hasAccess && !alreadyActive;
                                        });

                                        if (availableMissions.length === 0) return null;

                                        return (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                border: '1px solid #00ff00',
                                                backgroundColor: '#001100',
                                                borderRadius: '5px'
                                            }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#00ff00', textTransform: 'uppercase' }}>OPERACIONES ESPECIALES DISPONIBLES</h4>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {availableMissions.map(mission => {
                                                        const isAntartic = mission.id === 'ruta_antartica';
                                                        const requiredControl = mission.requirements.control || [];
                                                        const hasRequiredControl = requiredControl.every(id => owners[id] === currentPlayerIndex);
                                                        const canAccess = !isAntartic || hasRequiredControl;

                                                        return (
                                                            <div key={mission.id} style={{
                                                                padding: '12px',
                                                                backgroundColor: '#000',
                                                                borderRadius: '4px',
                                                                border: '1px solid #004400',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ color: '#00ff00', fontWeight: 'bold' }}>{mission.title}</div>
                                                                    <div style={{ color: '#666', fontSize: '0.7rem' }}>{mission.description}</div>
                                                                    {!canAccess && isAntartic && (
                                                                        <div style={{ color: '#ff4444', fontSize: '0.65rem', marginTop: '4px', fontStyle: 'italic' }}>
                                                                            REQUISITO: Controlar bases en Chile, Argentina, Australia y Sudáfrica.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    disabled={!canAccess}
                                                                    onClick={() => {
                                                                        setShowSpecialMissionModal(mission.id);
                                                                        setShowConfidentialModal(false); // Close parent modal
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: canAccess ? '#003300' : '#111',
                                                                        color: canAccess ? '#00ff00' : '#444',
                                                                        border: `1px solid ${canAccess ? '#00ff00' : '#333'}`,
                                                                        padding: '8px 15px',
                                                                        fontWeight: 'bold',
                                                                        cursor: canAccess ? 'pointer' : 'not-allowed',
                                                                        fontSize: '0.8rem',
                                                                        textTransform: 'uppercase',
                                                                        transition: 'all 0.2s',
                                                                        boxShadow: canAccess ? '0 0 5px rgba(0, 255, 0, 0.2)' : 'none'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (canAccess) {
                                                                            e.currentTarget.style.backgroundColor = '#00ff00';
                                                                            e.currentTarget.style.color = '#000';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (canAccess) {
                                                                            e.currentTarget.style.backgroundColor = '#003300';
                                                                            e.currentTarget.style.color = '#00ff00';
                                                                        }
                                                                    }}
                                                                >
                                                                    {canAccess ? 'ACCEDER' : 'BLOQUEADO'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()
                                    }

                                    {/* Espionage Mission Section */}
                                    {(() => {
                                        const espionageCountries = ['nueva_york', 'reino_unido', 'china', 'rusia'];
                                        const heldEspionageCountries = espionageCountries.filter(cid => owners[cid] === currentPlayerIndex);

                                        if (heldEspionageCountries.length === 0) return null;

                                        return (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                border: '1px solid #00ffff',
                                                backgroundColor: '#001122',
                                                borderRadius: '5px'
                                            }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#00ffff' }}>MISIÓN: ESPIONAJE</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {heldEspionageCountries.map(cid => {
                                                        const countryName = REGIONS.find(r => r.id === cid)?.title || cid;
                                                        const agencyName = AGENCY_NAMES[cid] || 'AGENCIA DESCONOCIDA';
                                                        const hasEspCard = player.specialCards.some(c => c.type === 'ESPIONAJE' && c.originCountry === cid);
                                                        const isSpent = player.usedEspionageHqs.includes(cid);

                                                        return (
                                                            <div key={cid} style={{
                                                                padding: '12px',
                                                                backgroundColor: '#000',
                                                                borderRadius: '4px',
                                                                border: '1px solid #004444',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '8px'
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <div style={{ color: '#00ffff', fontWeight: 'bold' }}>{agencyName}</div>
                                                                        <div style={{ color: '#666', fontSize: '0.7rem' }}>Sede: {countryName}</div>
                                                                    </div>
                                                                    {isSpent && (
                                                                        <span style={{
                                                                            color: '#ff9900',
                                                                            fontSize: '0.65rem',
                                                                            fontWeight: 'bold',
                                                                            backgroundColor: '#332200',
                                                                            padding: '3px 8px',
                                                                            borderRadius: '3px'
                                                                        }}>
                                                                            USADA ({player.usedEspionageHqs.length}/4)
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {hasEspCard ? (
                                                                    <span style={{ color: '#00ff00', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', padding: '5px', backgroundColor: 'rgba(0,255,0,0.1)', borderRadius: '4px' }}>
                                                                        INTELIGENCIA ACTIVA EN INVENTARIO
                                                                    </span>
                                                                ) : isSpent ? (
                                                                    <span style={{ color: '#ff4444', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', padding: '5px', backgroundColor: 'rgba(255,0,0,0.1)', border: '1px dashed #ff4444', borderRadius: '4px' }}>
                                                                        INFORME ESTRATÉGICO YA ENTREGADO (LIMITE MÁXIMO ALCANZADO)
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleOpenEspionageGen(cid)}
                                                                        disabled={player.nuclearDeploymentActive}
                                                                        style={{
                                                                            backgroundColor: player.nuclearDeploymentActive ? '#333' : '#00ffff',
                                                                            color: '#000',
                                                                            border: 'none',
                                                                            padding: '10px 20px',
                                                                            fontWeight: 'bold',
                                                                            cursor: player.nuclearDeploymentActive ? 'not-allowed' : 'pointer',
                                                                            width: '100%',
                                                                            opacity: player.nuclearDeploymentActive ? 0.5 : 1,
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        GENERAR INTELIGENCIA
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '10px' }}>
                                                    Requiere: Ind. Electrónica + Semiconductores + Ruta de suministro a la Sede.
                                                    <br />
                                                    <span style={{ color: '#ff9900' }}>NOTA: Cada locación puede usarse solo UNA vez por jugador (máx. 4 reportes totales)</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Cruce de los Andes Activation */}
                                    {(() => {
                                        const andesCards = player.specialCards.filter(c => c.type === 'CRUCE_ANDES');
                                        if (andesCards.length === 0) return null;

                                        return (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                border: '1px solid #aaff00',
                                                backgroundColor: '#051a00',
                                                borderRadius: '5px'
                                            }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#aaff00' }}>OPERACIÓN: CRUCE DE LOS ANDES</h4>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {andesCards.map(card => {
                                                        const isActive = player.crossingAndesActive;

                                                        return (
                                                            <div key={card.id} style={{
                                                                padding: '12px',
                                                                backgroundColor: '#000',
                                                                borderRadius: '4px',
                                                                border: '1px solid #446600',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div>
                                                                    <div style={{ color: '#aaff00', fontWeight: 'bold' }}>LOGÍSTICA CORDILLERANA</div>
                                                                    <div style={{ color: '#fff', fontSize: '0.8rem' }}>Permite +1 Infantería al atacar desde Argentina hacia Chile.</div>
                                                                    {isActive && (
                                                                        <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '5px' }}>
                                                                            ¡ACTIVADO: BONUS DISPONIBLE!
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    disabled={isActive || player.nuclearDeploymentActive}
                                                                    onClick={() => {
                                                                        if (isActive) return;
                                                                        setPlayers(prev => prev.map(p => {
                                                                            if (p.id === currentPlayerIndex) {
                                                                                return { ...p, crossingAndesActive: true };
                                                                            }
                                                                            return p;
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: isActive ? '#224400' : '#aaff00',
                                                                        color: isActive ? '#aaff00' : '#000',
                                                                        border: 'none',
                                                                        padding: '8px 15px',
                                                                        fontWeight: 'bold',
                                                                        cursor: isActive ? 'default' : 'pointer',
                                                                        borderRadius: '3px'
                                                                    }}
                                                                >
                                                                    {isActive ? 'ACTIVO' : 'ACTIVAR'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Normandy Landing Activation */}
                                    {(() => {
                                        const normandyCards = player.specialCards.filter(c => c.type === 'NORMANDY_LANDING');
                                        if (normandyCards.length === 0) return null;

                                        return (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                border: '1px solid #00aaff',
                                                backgroundColor: '#001122',
                                                borderRadius: '5px'
                                            }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#00aaff' }}>OPERACIÓN: DESEMBARCO DE NORMANDÍA</h4>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {normandyCards.map(card => {
                                                        const isActive = player.normandyLandingActive;

                                                        return (
                                                            <div key={card.id} style={{
                                                                padding: '12px',
                                                                backgroundColor: '#000',
                                                                borderRadius: '4px',
                                                                border: '1px solid #004488',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div>
                                                                    <div style={{ color: '#00aaff', fontWeight: 'bold' }}>LOGÍSTICA DE INVASIÓN</div>
                                                                    <div style={{ color: '#fff', fontSize: '0.8rem' }}>Permite +1 Artillería y +2 Infantería al atacar Francia desde UK.</div>
                                                                    {isActive && (
                                                                        <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '5px' }}>
                                                                            ¡ACTIVADO: BONUS DISPONIBLE!
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    disabled={isActive || player.nuclearDeploymentActive}
                                                                    onClick={() => {
                                                                        if (isActive) return;
                                                                        setPlayers(prev => prev.map(p => {
                                                                            if (p.id === currentPlayerIndex) {
                                                                                return { ...p, normandyLandingActive: true };
                                                                            }
                                                                            return p;
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: isActive ? '#002244' : '#00aaff',
                                                                        color: isActive ? '#00aaff' : '#000',
                                                                        border: 'none',
                                                                        padding: '8px 15px',
                                                                        fontWeight: 'bold',
                                                                        cursor: isActive ? 'default' : 'pointer',
                                                                        borderRadius: '3px'
                                                                    }}
                                                                >
                                                                    {isActive ? 'ACTIVO' : 'ACTIVAR'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {(() => {
                                        const currentPlayerId = players[currentPlayerIndex]?.id;
                                        const nuclearCountries = regionResources?.nuclearWarCapable || [];
                                        const heldNuclearCountries = nuclearCountries.filter(cid => owners[cid] === currentPlayerId);

                                        if (heldNuclearCountries.length === 0) return null;

                                        return (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                border: '1px solid #ff9100',
                                                backgroundColor: '#1a0a00',
                                                borderRadius: '5px'
                                            }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#ff9100' }}>MISIÓN: DISEÑO DE ARMAS NUCLEARES</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {heldNuclearCountries.map(cid => {
                                                        const countryName = REGIONS.find(r => r.id === cid)?.title || cid;
                                                        const hasNuclearCard = player.specialCards.some(c => c.type === 'NUCLEAR_DESIGN' && c.originCountry === cid);

                                                        return (
                                                            <div key={cid} style={{
                                                                padding: '12px',
                                                                backgroundColor: '#000',
                                                                borderRadius: '4px',
                                                                border: '1px solid #442200',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '8px'
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <div style={{ color: '#ff9100', fontWeight: 'bold' }}>ARCHIVOS CLASIFICADOS</div>
                                                                        <div style={{ color: '#666', fontSize: '0.7rem' }}>Ubicación: {countryName}</div>
                                                                    </div>
                                                                </div>

                                                                {hasNuclearCard ? (
                                                                    <span style={{ color: '#00ff00', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', padding: '5px', backgroundColor: 'rgba(0,255,0,0.1)', borderRadius: '4px' }}>
                                                                        DISEÑO COMPLETADO - EN INVENTARIO
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setNuclearGenLocation(cid);
                                                                            setShowNuclearGenSelection(true);
                                                                        }}
                                                                        disabled={player.nuclearDeploymentActive}
                                                                        style={{
                                                                            backgroundColor: player.nuclearDeploymentActive ? '#333' : '#ff9100',
                                                                            color: '#000',
                                                                            border: 'none',
                                                                            padding: '10px 20px',
                                                                            fontWeight: 'bold',
                                                                            cursor: player.nuclearDeploymentActive ? 'not-allowed' : 'pointer',
                                                                            width: '100%',
                                                                            opacity: player.nuclearDeploymentActive ? 0.5 : 1,
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        COMENZAR DISEÑO
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '10px' }}>
                                                    Requiere: Ind. Electrónica + Semiconductores + Ruta de suministro a la ubicación.
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Silo Mission Display */}
                                    <div style={{
                                        marginBottom: '20px',
                                        padding: '15px',
                                        border: '1px solid #ff9100',
                                        backgroundColor: '#221100',
                                        borderRadius: '5px'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#ff9100', textAlign: 'center' }}>MISIÓN: CONSTRUCCIÓN DE SILOS</h4>
                                            <button
                                                onClick={() => setShowSiloConstructionModal(true)}
                                                style={{
                                                    backgroundColor: '#ff9100',
                                                    color: '#000',
                                                    border: 'none',
                                                    padding: '5px 20px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    marginBottom: '10px'
                                                }}
                                            >
                                                CONSTRUIR
                                            </button>
                                        </div>
                                        <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '5px' }}>
                                            Requiere: Ind. Ligera + Ind. Pesada + Electrónica y Suministro de Hierro + Aluminio + Semiconductores.
                                        </div>
                                        {player.silos.length > 0 && (
                                            <div style={{ marginTop: '15px' }}>
                                                <div style={{ color: '#ff9100', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>SILOS OPERATIVOS:</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {player.silos.map(siloId => {
                                                        const siloStatus = player.siloStatus[siloId];
                                                        const isActive = siloStatus?.status === 'active';
                                                        const hasFuel = player.siloFuelCards[siloId] != null;
                                                        return (
                                                            <div key={siloId} style={{
                                                                padding: '10px',
                                                                backgroundColor: '#000',
                                                                border: isActive ? '1px solid #00ff00' : '1px solid #666',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div>
                                                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>
                                                                        {REGIONS.find(r => r.id === siloId)?.title}
                                                                    </div>
                                                                    <div style={{ color: isActive ? '#00ff00' : '#aaa', fontSize: '0.75rem' }}>
                                                                        {isActive ? 'ACTIVO' : (siloStatus?.status === 'construction' ? 'CONSTRUCCIÓN' : 'ENFRIAMIENTO')}
                                                                        {hasFuel && '☢️ Combustible Asignado'}
                                                                    </div>
                                                                </div>
                                                                {isActive && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowSiloFuelSelectionModal(siloId);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: hasFuel ? '#00ff00' : '#ff9100',
                                                                            color: '#000',
                                                                            border: 'none',
                                                                            padding: '6px 12px',
                                                                            cursor: 'pointer',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '0.75rem',
                                                                            borderRadius: '3px'
                                                                        }}
                                                                    >
                                                                        {hasFuel ? 'CAMBIAR COMBUSTIBLE' : 'SELECCIONAR COMBUSTIBLE'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Nuclear Deployment Section */}
                                    {(() => {
                                        const hasDesign = player.specialCards.some(c => c.name === 'DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES');
                                        const hasSilo = player.specialCards.some(c => c.name === 'SILO DE LANZAMIENTO');
                                        const hasMineral = player.specialCards.some(c => c.name === 'MINERAL SECRETO');

                                        if (!hasDesign || !hasSilo || !hasMineral) return null;

                                        return (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '20px',
                                                border: '2px solid #ff0000',
                                                backgroundColor: '#330000',
                                                borderRadius: '5px',
                                                textAlign: 'center',
                                                boxShadow: '0 0 30px rgba(255, 0, 0, 0.4)',
                                                animation: player.nuclearDeploymentActive ? 'none' : 'pulse 1.5s infinite'
                                            }}>
                                                <h4 style={{ margin: '0 0 15px 0', color: '#ff0000', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    PROYECTO FINAL: DESPLIEGUE ARSENAL NUCLEAR
                                                </h4>

                                                {player.nuclearDeploymentActive ? (
                                                    <div style={{ color: '#ffaa00', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                        ☢️ PROCESO DE DESPLIEGUE EN CURSO ☢️
                                                        <div style={{ fontSize: '0.8rem', marginTop: '10px', color: '#aaa', fontWeight: 'normal' }}>
                                                            Ganas al final de la ronda si el silo permanece bajo tu control y nadie más activa su arsenal.
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setShowNuclearDeploymentModal(true);
                                                            setShowConfidentialModal(false);
                                                        }}
                                                        style={{
                                                            backgroundColor: '#ff0000',
                                                            color: '#fff',
                                                            border: 'none',
                                                            padding: '12px 25px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            fontSize: '1rem',
                                                            textTransform: 'uppercase',
                                                            fontFamily: 'monospace',
                                                            boxShadow: '0 0 15px rgba(255,0,0,0.5)'
                                                        }}
                                                    >
                                                        INICIAR PROCESO DE DESPLIEGUE
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {player.specialCards.length === 0 ? (
                                        <div style={{ color: '#666', padding: '20px', textAlign: 'center', border: '1px dashed #444' }}>
                                            Sin información confidencial disponible.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                            {player.specialCards.map(card => (
                                                <div key={card.id} style={{
                                                    backgroundColor: '#000',
                                                    border: '1px solid #00ffff',
                                                    padding: '15px',
                                                    borderRadius: '5px',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#00ff00'
                                                    }} />
                                                    <h4 style={{ color: '#00ff00', marginTop: 0 }}>{card.name}</h4>
                                                    <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '10px' }}>
                                                        Base: {REGIONS.find(r => r.id === card.originCountry)?.title}
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                                        {card.description}
                                                    </p>

                                                    {/* MISSION BUTTONS */}
                                                    {card.type === 'SECONDARY_MISSION' && (
                                                        <button
                                                            onClick={() => {
                                                                setShowSpecialMissionModal(card.id);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                backgroundColor: '#003300',
                                                                color: '#00ff00',
                                                                border: '1px solid #00ff00',
                                                                padding: '8px',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer',
                                                                marginTop: '10px'
                                                            }}
                                                        >
                                                            ORGANIZAR MISIÓN
                                                        </button>
                                                    )}

                                                    {card.type === 'ESPIONAJE' && (
                                                        <button
                                                            onClick={() => {
                                                                setShowEspionageModal(true);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                backgroundColor: '#00ffff',
                                                                color: '#000',
                                                                border: 'none',
                                                                padding: '8px',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer',
                                                                marginTop: '10px'
                                                            }}
                                                        >
                                                            EJECUTAR ESPIONAJE
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()
                }




                <EndgameOverlay
                    winner={winner}
                    endgameChoice={endgameChoice}
                    onEndgameChoice={handleEndgameChoice}
                    onNewOperation={() => window.location.reload()}
                    animationIndex={animationIndex}
                    REGIONS_LENGTH={REGIONS.length}
                />

                <NuclearAlertModal />

                {/* Confidential Info Modal */}
                {showConfidentialModal && (
                    <ConfidentialInfoModal
                        onClose={() => setShowConfidentialModal(false)}
                        onOpenNuclearDesign={() => {
                            setShowConfidentialModal(false);
                            setNuclearGenLocation('SELECTION_NEEDED');
                            setShowNuclearGenSelection(true);
                        }}
                        onOpenMineralExtraction={(targetId?: string) => {
                            setShowConfidentialModal(false);
                            setShowMineralExtractionModal(targetId || 'SELECTION_NEEDED');
                        }}
                        onOpenSiloConstruction={() => {
                            setShowConfidentialModal(false);
                            setShowSiloConstructionModal(true);
                        }}
                    />
                )}

                {/* Espionage Target Selection Modal */}
                {
                    !spectator && showEspionageModal && (
                        <EspionageTargetSelectionModal
                            show={showEspionageModal}
                            onClose={() => setShowEspionageModal(false)}
                        />
                    )
                }

                {/* Espionage Network Info Modal */}
                <EspionageNetworkInfoModal
                    hqId={showEspionageNetworkInfo}
                    onClose={() => setShowEspionageNetworkInfo(null)}
                />

                {/* Nuclear Design Info Modal */}
                <NuclearDesignInfoModal
                    locationId={showNuclearDesignInfo}
                    onClose={() => setShowNuclearDesignInfo(null)}
                />


                {/* Special Mission Info Modal */}
                {
                    showSpecialMissionInfo && (() => {
                        const availableMissions = SPECIAL_MISSIONS.filter(m => m.visibleFor.includes(showSpecialMissionInfo) || m.visibleFor.includes('GLOBAL'));
                        const regionName = REGIONS.find(r => r.id === showSpecialMissionInfo)?.title;
                        const player = players[currentPlayerIndex];
                        const currentPlayerId = player?.id;

                        return (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.95)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 8000,
                                fontFamily: 'monospace'
                            }}>
                                <div style={{
                                    backgroundColor: '#001100',
                                    border: '3px solid #00ff00',
                                    padding: '30px',
                                    width: '600px',
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 0 50px rgba(0, 255, 0, 0.4)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h2 style={{ color: '#00ff00', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>OPERACIONES ESPECIALES</h2>
                                        <button
                                            onClick={() => setShowSpecialMissionInfo(null)}
                                            style={{ background: 'none', border: 'none', color: '#00ff00', fontSize: '1.5rem', cursor: 'pointer' }}
                                        >
                                            X
                                        </button>
                                    </div>

                                    <div style={{ backgroundColor: '#000', padding: '15px', marginBottom: '20px', border: '1px solid #004400', borderRadius: '4px' }}>
                                        <div style={{ color: '#00ff00', fontSize: '1rem', fontWeight: 'bold' }}>
                                            REGIÓN: {regionName}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {availableMissions.map(mission => {
                                            const isActive = player.activeSpecialMissions.some(m => m.id === mission.id);
                                            const activeMissionData = player.activeSpecialMissions.find(m => m.id === mission.id);

                                            // Special check for War Secrets: It can be active multiple times (once per agency)
                                            // So we don't block it solely on "isActive" unless strictly both are done.
                                            // But standard UI shows "OPERACIÓN EN CURSO". We might want to allow clicking even if active?
                                            // Let's modify the condition below: 
                                            const isWarSecrets = mission.id === 'secretos_guerra';
                                            const warSecretsDoneCount = player.secretWarData.length; // Approximate check
                                            // Actually, `isActive` is just looking at `activeSpecialMissions`.
                                            // If we want to allow re-entry, we should NOT show the "OPERACIÓN EN CURSO" block if eligible for 2nd run.

                                            const showActiveBlock = isActive && (!isWarSecrets || warSecretsDoneCount >= 2);

                                            return (
                                                <div key={mission.id} style={{
                                                    border: '1px solid #00ff00',
                                                    padding: '15px',
                                                    backgroundColor: isActive ? '#002200' : 'rgba(0,0,0,0.3)'
                                                }}>
                                                    <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>{mission.title}</h3>
                                                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>
                                                        {mission.description}
                                                    </p>

                                                    {showActiveBlock ? (
                                                        <div style={{
                                                            color: '#00ff00',
                                                            fontWeight: 'bold',
                                                            border: '1px solid #00ff00',
                                                            padding: '10px',
                                                            textAlign: 'center',
                                                            backgroundColor: '#001a00'
                                                        }}>
                                                            OPERACIÓN EN CURSO
                                                            <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#ccc' }}>
                                                                Base de Operaciones: {REGIONS.find(r => r.id === activeMissionData?.baseRegionId)?.title}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {mission.id !== 'ruta_antartica' && (
                                                                <button
                                                                    disabled={mission.id === 'ruta_antartica' && !mission.requirements.control.every(id => owners[id] === currentPlayerId)}
                                                                    onClick={() => {
                                                                        if (mission.id === 'secretos_guerra') {
                                                                            const countryId = REGIONS.find(r => r.title === proxyWarCountry)?.id;
                                                                            if (!countryId) return;

                                                                            // Check Control
                                                                            if (owners[countryId] !== currentPlayerId) {
                                                                                alert(`Debes controlar ${proxyWarCountry} primero.`);
                                                                                return;
                                                                            }



                                                                            // Filter available agencies


                                                                            setShowSpecialMissionModal(mission.id);
                                                                        } else {


                                                                            setShowSpecialMissionInfo(null);
                                                                            setShowSpecialMissionModal(mission.id);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '10px',
                                                                        backgroundColor: '#00ff00',
                                                                        color: '#000',
                                                                        fontWeight: 'bold',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        fontSize: '1rem'
                                                                    }}
                                                                >
                                                                    INICIAR OPERACIÓN
                                                                </button>
                                                            )}
                                                            {mission.id === 'ruta_antartica' && (
                                                                <button
                                                                    disabled={!mission.requirements.control.every(id => owners[id] === currentPlayerId)}
                                                                    onClick={() => {
                                                                        if (!mission.requirements.control.every(id => owners[id] === currentPlayerId)) {
                                                                            alert('Debes controlar Chile, Argentina, Australia y Sudáfrica primero.');
                                                                            return;
                                                                        }
                                                                        setShowSpecialMissionInfo(null);
                                                                        setShowSpecialMissionModal('ruta_antartica');
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '10px',
                                                                        backgroundColor: mission.requirements.control.every(id => owners[id] === currentPlayerId) ? '#00ffff' : '#002222',
                                                                        color: mission.requirements.control.every(id => owners[id] === currentPlayerId) ? '#000' : '#005555',
                                                                        border: '1px solid #00ffff',
                                                                        cursor: mission.requirements.control.every(id => owners[id] === currentPlayerId) ? 'pointer' : 'not-allowed',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.9rem',
                                                                        textAlign: 'center'
                                                                    }}
                                                                >
                                                                    {mission.requirements.control.every(id => owners[id] === currentPlayerId)
                                                                        ? 'ESTABLECER RUTA'
                                                                        : 'REQUIERE CONTROL AUSTRAL'}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setShowSpecialMissionInfo(null)}
                                        style={{
                                            width: '100%',
                                            marginTop: '30px',
                                            padding: '12px',
                                            backgroundColor: 'transparent',
                                            color: '#00ff00',
                                            border: '1px solid #00ff00',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        CERRAR
                                    </button>
                                </div>
                            </div>
                        );
                    })()
                }
                <SiloFuelSelectionModal
                    show={!!showSiloFuelSelectionModal}
                    onClose={() => setShowSiloFuelSelectionModal(null)}
                    siloRegionId={showSiloFuelSelectionModal || ''}
                />
                {/* Nuclear Deployment Control */}
                {/* Nuclear Design Generation */}
                {
                    showNuclearGenSelection && (
                        <NuclearDesignGenerationModal
                            onClose={() => setShowNuclearGenSelection(false)}
                            locationId={nuclearGenLocation}
                        />
                    )
                }
                {/* Espionage Generation */}
                <EspionageGenerationModal
                    show={showEspionageGenSelection}
                    onClose={() => setShowEspionageGenSelection(false)}
                    hqId={espionageGenHq}
                />
                {/* Mission Notification */}
                <MissionNotificationOverlay />
                <YearStartOverlay
                    year={showYearStartLocal}
                    onStart={() => {
                        setShowYearStart(null);
                        setShowTurnOverlay(true);
                    }}
                />
                <audio ref={themeSongRef} key="theme-song" src="/intro_soundtrack.wav" loop />
            </div >
        </div >
    );
};
