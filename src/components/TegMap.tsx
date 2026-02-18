import React, { useState, useEffect, useRef } from 'react';
import { BattleOverlay } from './BattleOverlay';


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
import { MADOverlay } from './shared/overlays/MADOverlay';
import {
    isMaritimeConnection,
    checkSupplyRoute
} from '../data/mapData';
import type {
    ProductionDeck,
    SupplyItem
} from '../types/productionTypes';
import { InventoryModal } from './InventoryModal';
import { useBattleState } from '../hooks/useBattleState';
import { REGIONS } from '../data/mapRegions';
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
        turnOrderIndex
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
    const [inventoryFilter, setInventoryFilter] = useState<string | null>(null);

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
    const [selectedLaunchSilo, setSelectedLaunchSilo] = useState<string | null>(null);


    // Silo Construction State
    const [showSiloConstructionModal, setShowSiloConstructionModal] = useState(false);


    const themeSongRef = useRef<HTMLAudioElement | null>(null);
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

        if (isMyTurn && !showTurnOverlay && !state.winner && gamePhase === 'playing') {
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

            if (isMyTurn && !state.winner && gamePhase === 'playing') {
                setShowTurnOverlay(true);
            }
        }
    }, [currentPlayerIndex, players, multiplayer.connectionStatus, multiplayer.playerId, gameStarted, state.winner, gamePhase]);




    // Silo Fuel Selection State
    const [showSiloFuelSelectionModal, setShowSiloFuelSelectionModal] = useState<string | null>(null);





    // Silo Fuel Selection State


    // Espionage State
    const [showEspionageModal, setShowEspionageModal] = useState<string | null>(null);


    const [showEspionageGenSelection, setShowEspionageGenSelection] = useState(false);

    const [showEspionageNetworkInfo, setShowEspionageNetworkInfo] = useState<string | null>(null); // Country ID for espionage network info

    // Nuclear Design State
    const [showNuclearDesignInfo, setShowNuclearDesignInfo] = useState<string | null>(null); // Country ID for nuclear design info
    const [showNuclearGenSelection, setShowNuclearGenSelection] = useState(false);
    const [nuclearGenLocation, setNuclearGenLocation] = useState<string | null>(null);
    const [missionPlayerIndex, setMissionPlayerIndex] = useState<number | null>(null);










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






    // Validate Special Card and Silo Ownership
    useEffect(() => {
        if (!gameStarted || players.length === 0) return;

        let stateChanged = false;
        const updatedPlayers = players.map(p => {
            let playerModified = false;
            let updatedP = { ...p };

            // 1. Validate Special Cards
            if (p.specialCards.length > 0) {
                const validCards = p.specialCards.filter(card => owners[card.originCountry] === p.id);
                if (validCards.length !== p.specialCards.length) {
                    updatedP.specialCards = validCards;
                    playerModified = true;
                }
            }

            // 2. Validate Silos
            if (p.silos.length > 0) {
                const validSilos = p.silos.filter(siloId => owners[siloId] === p.id);
                if (validSilos.length !== p.silos.length) {
                    // NEW: Notify player about lost silo
                    const lostSiloIds = p.silos.filter(id => !validSilos.includes(id));
                    lostSiloIds.forEach(sid => {
                        dispatch({
                            type: 'SET_NOTIFICATION',
                            payload: {
                                type: 'NEUTRALIZED',
                                title: 'SILO DESTRUIDO',
                                message: `El silo en ${REGIONS.find(r => r.id === sid)?.title || sid} ha sido capturado y desmantelado. Tendrás que construirlo de verdad de nuevo si quieres recuperar tu capacidad de ataque nuclear.`,
                                color: '#ff4444',
                                targetPlayerId: p.id
                            }
                        });
                    });

                    updatedP.silos = validSilos;
                    playerModified = true;

                    // Also clean up Silo Status
                    const newSiloStatus = { ...p.siloStatus };
                    let statusModified = false;
                    Object.keys(newSiloStatus).forEach(sid => {
                        if (owners[sid] !== p.id) {
                            delete (newSiloStatus as any)[sid];
                            statusModified = true;
                        }
                    });
                    if (statusModified) {
                        updatedP.siloStatus = newSiloStatus;
                    }

                    // If they lost all silos, check deployment
                    if (validSilos.length === 0 && p.nuclearDeploymentActive) {
                        updatedP.nuclearDeploymentActive = false;
                    }
                }
            }

            if (playerModified) {
                stateChanged = true;
                return updatedP;
            }
            return p;
        });

        if (stateChanged) {
            setPlayers(updatedPlayers);
        }
    }, [owners, gameStarted]);

    // Private Overlays for Supply Route loss
    const prevRouteStatusRef = useRef<Record<string, Record<string, { fuel: boolean, mineral: boolean }>>>({});

    useEffect(() => {
        if (!gameStarted || players.length === 0) return;

        players.forEach(p => {
            const playerId = p.id.toString();
            if (!prevRouteStatusRef.current[playerId]) {
                prevRouteStatusRef.current[playerId] = {};
            }
            const playerPrevStatus = prevRouteStatusRef.current[playerId];

            p.silos.forEach(siloId => {
                if (!playerPrevStatus[siloId]) {
                    playerPrevStatus[siloId] = { fuel: true, mineral: true }; // Init as true to only notify on LOST
                }
                const prev = playerPrevStatus[siloId];

                // 1. Fuel Route
                const fuelCardId = p.siloFuelCards?.[siloId];
                let fuelRouteOK = true;
                if (fuelCardId) {
                    const fuelCard = p.inventory.rawMaterials.find(c => c.id === fuelCardId);
                    if (fuelCard?.country) {
                        fuelRouteOK = checkSupplyRoute(fuelCard.country, siloId, p.id, owners);
                        if (prev.fuel && !fuelRouteOK) {
                            dispatch({
                                type: 'SET_NOTIFICATION',
                                payload: {
                                    type: 'NEUTRALIZED',
                                    title: 'RUTA DE COMBUSTIBLE CORTADA',
                                    message: `Se ha perdido la ruta de suministro entre ${REGIONS.find(r => r.id === fuelCard.country)?.title} y el silo en ${REGIONS.find(r => r.id === siloId)?.title}.`,
                                    color: '#ff9900',
                                    targetPlayerId: p.id
                                }
                            });
                        }
                    }
                }

                // 2. Mineral Route
                const mineralCard = p.specialCards.find(c => c.name === 'MINERAL SECRETO');
                let mineralRouteOK = true;
                if (mineralCard) {
                    mineralRouteOK = checkSupplyRoute(mineralCard.originCountry, siloId, p.id, owners);
                    if (prev.mineral && !mineralRouteOK) {
                        dispatch({
                            type: 'SET_NOTIFICATION',
                            payload: {
                                type: 'NEUTRALIZED',
                                title: 'SUMINISTRO DE MINERAL INTERRUMPIDO',
                                message: `La ruta desde el yacimiento de Mineral Secreto (${REGIONS.find(r => r.id === mineralCard.originCountry)?.title}) hasta el silo en ${REGIONS.find(r => r.id === siloId)?.title} ha sido bloqueada.`,
                                color: '#ff9900',
                                targetPlayerId: p.id
                            }
                        });
                    }
                }

                playerPrevStatus[siloId] = { fuel: fuelRouteOK, mineral: mineralRouteOK };
            });
        });
    }, [owners, players, gameStarted]);

























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

    // Global synchronization for Turn and Year Overlays
    const prevTurnPlayerRef = useRef<number>(currentPlayerIndex);
    const prevYearRef = useRef<number>(gameDate.getFullYear());

    useEffect(() => {
        if (!gameStarted || players.length === 0) return;

        // Year change detection
        const currentYear = gameDate.getFullYear();
        if (currentYear > prevYearRef.current) {
            setShowYearStart(currentYear);
            prevYearRef.current = currentYear;
        }

        // Turn change detection
        if (currentPlayerIndex !== prevTurnPlayerRef.current) {
            // Only show turn overlay if it's NOT a new year (to avoid double overlay)
            // or if the year reset logic already handled it. 
            // EndOfRound sets nextYear AND nextPlayerIdx.
            if (currentYear === prevYearRef.current) {
                setShowTurnOverlay(true);
            }
            prevTurnPlayerRef.current = currentPlayerIndex;
            resetCardUsageForTurn();
        }
    }, [currentPlayerIndex, gameDate, gameStarted, players.length]);

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
                    usedNuclearSilos: [], // Reset launch tracking for the new turn
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
        setSelectedRegionId(null);

        // Note: Global useEffect will handle showing overlays for all players
        // based on the state update.
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
                        dispatch({
                            type: 'SET_NOTIFICATION',
                            payload: {
                                type: 'NEUTRALIZED',
                                title: 'DESPLIEGUE NEUTRALIZADO',
                                message: 'Has perdido tus silos de lanzamiento estratégicos. El despliegue nuclear ha sido abortado.',
                                color: '#ff0000',
                                targetPlayerId: p.id
                            }
                        });
                        return { ...p, nuclearDeploymentActive: false };
                    }
                }
                return p;
            }));
        }
    }, [owners, conquestData]);



    const handleEndgameChoice = (choice: 'victory' | 'destruction') => {
        dispatch({ type: 'SET_ENDGAME_CHOICE', payload: choice });
        setAnimationIndex(0);
    };

    // Synchronize animation start for all players (winner and losers)
    useEffect(() => {
        if (state.endgameChoice && state.winner && animationIndex === -1) {
            setAnimationIndex(0);
        }
    }, [state.endgameChoice, state.winner, animationIndex]);

    useEffect(() => {
        if (animationIndex >= 0 && animationIndex < REGIONS.length && state.endgameChoice && state.winner) {
            const timer = setTimeout(() => {
                const region = REGIONS[animationIndex];
                if (state.endgameChoice === 'victory') {
                    setOwners(prev => ({ ...prev, [region.id]: state.winner!.id }));
                } else {
                    // destruction - enemy countries turn black
                    if (owners[region.id] !== state.winner!.id) {
                        setOwners(prev => ({ ...prev, [region.id]: -2 }));
                    }
                }
                setAnimationIndex(prev => prev + 1);
            }, 150); // Slightly slower for better effect
            return () => clearTimeout(timer);
        }
    }, [animationIndex, state.endgameChoice, state.winner]);



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



    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{
            width: isMobile ? 'auto' : '100vw',
            height: isMobile ? 'auto' : '100vh',
            minWidth: '100vw',
            minHeight: '100vh',
            backgroundColor: '#000000',
            overflow: 'auto',
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
                height: isMobile ? '100dvh' : '100%',
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
                <div style={{
                    flex: 1,
                    position: 'relative'
                }}>

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
                            setInventoryFilter(null); // Reset filter
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
                        filterTargetCountry={inventoryFilter}
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


                {/* CONFIDENTIAL INFO BUTTON REMOVED (ACCESSIBLE VIA SIDEBAR) */}

                {/* Nuclear War Info Modal */}

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
                    onClose={() => {
                        setShowNuclearActivationModal(null);
                        setMissionPlayerIndex(null);
                    }}
                    playerIndex={missionPlayerIndex ?? undefined}
                />


                {/* Mineral Extraction Modal */}
                <MineralExtractionModal
                    show={!spectator ? showMineralExtractionModal : null}
                    onClose={() => {
                        setShowMineralExtractionModal(null);
                        setMissionPlayerIndex(null);
                    }}
                    playerIndex={missionPlayerIndex ?? undefined}
                />
                {/* Silo Construction Modal */}
                <SiloConstructionModal
                    show={!spectator && showSiloConstructionModal}
                    onClose={() => {
                        setShowSiloConstructionModal(false);
                        setMissionPlayerIndex(null);
                    }}
                    playerIndex={missionPlayerIndex ?? undefined}
                />

                {/* Confidential Information Modal */}
                <NuclearDeploymentModal
                    show={!spectator && showNuclearDeploymentModal}
                    onClose={() => {
                        setShowNuclearDeploymentModal(false);
                        setSelectedLaunchSilo(null);
                        setMissionPlayerIndex(null);
                    }}
                    selectedSiloId={selectedLaunchSilo}
                    playerIndex={missionPlayerIndex ?? undefined}
                />






                <EndgameOverlay
                    winner={state.winner}
                    endgameChoice={state.endgameChoice}
                    onEndgameChoice={handleEndgameChoice}
                    onNewOperation={() => window.location.reload()}
                    animationIndex={animationIndex}
                    REGIONS_LENGTH={REGIONS.length}
                    isLocalPlayerWinner={
                        (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId)
                            ? state.winner?.id === multiplayer.playerId
                            : true // Hotseat: both are same physical player
                    }
                />

                <NuclearAlertModal />

                {/* Confidential Info Modal */}
                {showConfidentialModal && (
                    <ConfidentialInfoModal
                        onClose={() => setShowConfidentialModal(false)}
                        onOpenNuclearDesign={(playerIndex) => {
                            setShowConfidentialModal(false);
                            setNuclearGenLocation('SELECTION_NEEDED');
                            setMissionPlayerIndex(playerIndex);
                            setShowNuclearGenSelection(true);
                        }}
                        onOpenMineralExtraction={(targetId, playerIndex) => {
                            setShowConfidentialModal(false);
                            setMissionPlayerIndex(playerIndex);
                            setShowMineralExtractionModal(targetId || 'SELECTION_NEEDED');
                        }}
                        onOpenSiloConstruction={(playerIndex) => {
                            setShowConfidentialModal(false);
                            setMissionPlayerIndex(playerIndex);
                            setShowSiloConstructionModal(true);
                        }}
                        onInitiateLaunch={(siloId, playerIndex) => {
                            setShowConfidentialModal(false);
                            setMissionPlayerIndex(playerIndex);
                            setSelectedLaunchSilo(siloId);
                            setShowNuclearDeploymentModal(true);
                        }}
                        onOpenInventoryWithFilter={(countryId, playerIndex) => {
                            setShowConfidentialModal(false);
                            setInventoryPlayerIndex(playerIndex);
                            setInventoryFilter(countryId);
                            setShowInventory(true);
                        }}
                    />
                )}

                {/* Espionage Target Selection Modal */}
                {
                    !spectator && showEspionageModal && (
                        <EspionageTargetSelectionModal
                            show={!!showEspionageModal}
                            cardId={showEspionageModal}
                            onClose={() => setShowEspionageModal(null)}
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
                                        {(() => {
                                            const mission = SPECIAL_MISSIONS.find(m => m.id === showSpecialMissionInfo);
                                            if (!mission) return null;

                                            const isActive = player.activeSpecialMissions.some(m => m.id === mission.id);
                                            const activeMissionData = player.activeSpecialMissions.find(m => m.id === mission.id);

                                            // Special check for War Secrets: It can be active multiple times (once per agency)
                                            const isWarSecrets = mission.id === 'secretos_guerra';
                                            const warSecretsDoneCount = player.secretWarData.length;
                                            const showActiveBlock = isActive && (!isWarSecrets || warSecretsDoneCount >= 2);

                                            return (
                                                <div key={mission.id} style={{
                                                    border: '1px solid #00ff00',
                                                    padding: '15px',
                                                    backgroundColor: isActive ? '#002200' : 'rgba(0,0,0,0.3)'
                                                }}>
                                                    <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>{mission.title}</h3>
                                                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>
                                                        {mission.lore || mission.description}
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

                                                                            setShowSpecialMissionModal(mission.id);
                                                                            setShowSpecialMissionInfo(null);
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
                                                                    ACTIVAR
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
                                                                        ? 'ACTIVAR'
                                                                        : 'REQUIERE CONTROL AUSTRAL'}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })()}
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
                    playerIndex={currentPlayerIndex}
                    onClose={() => setShowSiloFuelSelectionModal(null)}
                    siloRegionId={showSiloFuelSelectionModal || ''}
                />
                {/* Nuclear Deployment Control */}
                {/* Nuclear Design Generation */}
                {
                    showNuclearGenSelection && (
                        <NuclearDesignGenerationModal
                            onClose={() => {
                                setShowNuclearGenSelection(false);
                                setMissionPlayerIndex(null);
                            }}
                            locationId={nuclearGenLocation}
                            playerIndex={missionPlayerIndex ?? undefined}
                        />
                    )
                }
                {/* Espionage Generation */}
                <EspionageGenerationModal
                    show={showEspionageGenSelection}
                    onClose={() => setShowEspionageGenSelection(false)}
                    hqId={null}
                />
                {/* Mission Notification */}
                <MissionNotificationOverlay />
                {state.notification?.type === 'NEUTRALIZED' ? (
                    <MADOverlay
                        involvedPlayers={players.filter(p => p.siloStatus && Object.values(p.siloStatus).some(s => s.status === 'cooldown'))}
                        currentPlayerId={multiplayer.playerId || players[currentPlayerIndex]?.id}
                        onClose={() => dispatch({ type: 'SET_NOTIFICATION', payload: null })}
                    />
                ) : (
                    <YearStartOverlay
                        year={showYearStartLocal}
                        onStart={() => {
                            setShowYearStart(null);
                            setShowTurnOverlay(true);
                        }}
                    />
                )}
                <audio ref={themeSongRef} key="theme-song" src="/intro_soundtrack.wav" loop />
            </div >
        </div >
    );
};
