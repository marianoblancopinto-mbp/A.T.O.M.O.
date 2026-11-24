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
import { EspionageTargetSelectionModal } from './shared/modals/espionage/EspionageTargetSelectionModal';
import { EspionageActivationModal } from './shared/modals/espionage/EspionageActivationModal';
import { NuclearDesignGenerationModal } from './shared/modals/nuclear/NuclearDesignGenerationModal';
import { MineralExtractionModal } from './shared/modals/nuclear/MineralExtractionModal';
import { SiloConstructionModal } from './shared/modals/nuclear/SiloConstructionModal';
import { SiloFuelSelectionModal } from './shared/modals/nuclear/SiloFuelSelectionModal';
import { NuclearDeploymentModal } from './shared/modals/nuclear/NuclearDeploymentModal';
import { NuclearAlertModal } from './shared/modals/nuclear/NuclearAlertModal';
import { YearStartOverlay } from './shared/overlays/YearStartOverlay';
import { ProductionPhaseOverlay } from './shared/overlays/ProductionPhaseOverlay';
import { EndgameOverlay } from './shared/overlays/EndgameOverlay';
import { MissionNotificationOverlay } from './shared/overlays/MissionNotificationOverlay';
import { ServerRejectionToast } from './shared/overlays/ServerRejectionToast';
import { MADOverlay } from './shared/overlays/MADOverlay';
import { isMaritimeConnection } from '../data/mapData';
import { InventoryModal } from './InventoryModal';
import { TreatiesPanel } from './game/treaties/TreatiesPanel';
import { useBattleState } from '../hooks/useBattleState';
import { REGIONS } from '../data/mapRegions';
import { useGameContext } from '../context/GameContext';
import { type PlayerData } from '../types/playerTypes';
import { useGameActions } from '../hooks/useGameActions';




export const TegMap: React.FC<{ spectator?: boolean }> = ({ spectator = false }) => {
    const { state, multiplayer, dismissNotification } = useGameContext();
    const actions = useGameActions();

    const {
        gamePhase,
        gameStarted,
        players,
        currentPlayerIndex,
        owners,
        gameDate,
        roundPhase
    } = state;

    // Index of the player operating locally (the one whose confidential file is theirs).
    // In multiplayer we always act as the local player; in hotseat it's the active player.
    const localPlayerIndex = multiplayer.playerId
        ? players.findIndex(p => String(p.id) === String(multiplayer.playerId))
        : -1;

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
    const [showNuclearDeploymentModal, setShowNuclearDeploymentModal] = useState(false);
    const [selectedLaunchSilo, setSelectedLaunchSilo] = useState<string | null>(null);


    // Silo Construction State
    const [showSiloConstructionModal, setShowSiloConstructionModal] = useState(false);

    // Treaties State
    const [showTreatiesPanel, setShowTreatiesPanel] = useState(false);


    const themeSongRef = useRef<HTMLAudioElement | null>(null);
    const [animationIndex, setAnimationIndex] = useState(-1);
    // Animación final: recolorea el mapa SÓLO en pantalla (no toca el estado del servidor).
    const [animatedOwners, setAnimatedOwners] = useState<Record<string, string | number | null>>({});

    // Desalination Plant Mission State

    // Show Turn Overlay when it becomes my turn
    useEffect(() => {
        if (!gameStarted || !players[currentPlayerIndex]) return;
        const currentPlayerId = players[currentPlayerIndex].id;

        // In multiplayer, check if it's my ID.
        // In local/hotseat (multiplayer.playerId might be null or we are controller),
        // we might want to show it every time currentPlayerIndex changes.

        const isMyTurn = (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId)
            ? String(currentPlayerId) === String(multiplayer.playerId)
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

    // Espionage State
    const [showEspionageModal, setShowEspionageModal] = useState<string | null>(null);
    const [showEspionageActivationModal, setShowEspionageActivationModal] = useState(false);

    // Nuclear Design State
    const [showNuclearGenSelection, setShowNuclearGenSelection] = useState(false);
    const [nuclearGenLocation, setNuclearGenLocation] = useState<string | null>(null);
    const [missionPlayerIndex, setMissionPlayerIndex] = useState<number | null>(null);

    // Modo espectador: se conecta al servidor como espectador (ver useColyseus) y
    // recibe sólo la vista pública. Ya no se sincroniza por BroadcastChannel.

    // --- Mission Handlers ---






    // Cartas, silos, misiones y rutas perdidas al ser conquistado: lo resuelve el
    // servidor (engine/reconcile) y avisa con notificaciones.

    // Espionage logic moved to useGameActions and EspionageTargetSelectionModal

    // NOTA: El "desbloqueo" de cartas (usedThisTurn -> false) ya NO ocurre por turno.
    // Ahora el consumo de materias primas/tecnologías persiste durante TODA la ronda y se
    // resetea únicamente al inicio de la ronda siguiente (fase de producción), dentro del
    // reducer en PROCESS_TURN_CHANGE. Así el consumo por país se mantiene aun tras conquistas.

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
            // Los tratados se activan/expiran en el servidor al cambiar el año.
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
        }
    }, [currentPlayerIndex, gameDate, gameStarted, players.length]);

    // Mark a card as used this turn




    const handleRegionClick = (regionId: string) => {
        if (!gameStarted || showTurnOverlay || conquestData) return;
        setSelectedRegionId(regionId);
    };























    // El servidor resuelve el fin de turno (cambio de año, victoria, timers).
    const endTurn = () => {
        actions.endTurn();
        setSelectedRegionId(null);
    };

    const handleEndgameChoice = (choice: 'victory' | 'destruction') => {
        actions.setEndgameChoice(choice);
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
                    setAnimatedOwners(prev => ({ ...prev, [region.id]: state.winner!.id }));
                } else {
                    // destruction - enemy countries turn black
                    if (owners[region.id] !== state.winner!.id) {
                        setAnimatedOwners(prev => ({ ...prev, [region.id]: -2 }));
                    }
                }
                setAnimationIndex(prev => prev + 1);
            }, 150); // Slightly slower for better effect
            return () => clearTimeout(timer);
        }
    }, [animationIndex, state.endgameChoice, state.winner]);



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
            {/* Turn Overlay and related logic */}
            {!spectator && gameStarted && roundPhase !== 'PRODUCTION' && showTurnOverlay && players[currentPlayerIndex] && (
                <TurnOverlay
                    player={players[currentPlayerIndex]}
                    onClose={() => {
                        console.log('[TegMap] Closing TurnOverlay');
                        setShowTurnOverlay(false);
                    }}
                />
            )}

            {/* PRETURNO — Fase de producción simultánea (inicio de ronda) */}
            {gameStarted && roundPhase === 'PRODUCTION' && !state.winner && (
                <ProductionPhaseOverlay
                    isSpectator={spectator}
                    onOpenInventory={() => {
                        setInventoryPlayerIndex(localPlayerIndex);
                        setShowInventory(true);
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
                        setInventoryPlayerIndex(localPlayerIndex);
                        setShowInventory(true);
                    }}
                />
            )}

            {/* Side Bar */}
            {!spectator && (
                <SidebarPanel
                    onEndTurn={endTurn}
                    onOpenInventory={() => {
                        setInventoryPlayerIndex(localPlayerIndex);
                        setShowInventory(true);
                    }}
                    onOpenRawMaterials={() => setShowRawMaterialsModal(true)}
                    onOpenTechnologies={() => setShowTechnologiesModal(true)}
                    onOpenConfidential={() => setShowConfidentialModal(true)}
                    onOpenTreaties={() => setShowTreatiesPanel(true)}
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
                        ownersOverride={animatedOwners}
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
                        // Los botones "Especiales" abren EXACTAMENTE los mismos paneles de
                        // accion que el Expediente Confidencial (no los paneles de solo lectura).
                        onOpenNuclearDesign={(regionId) => {
                            // Pre-seleccionamos la region clickeada solo si el jugador la controla;
                            // si no, dejamos que el modal exija elegir una propia (igual que el Confidencial).
                            const ownsRegion = owners[regionId] === players[localPlayerIndex]?.id;
                            setNuclearGenLocation(ownsRegion ? regionId : 'SELECTION_NEEDED');
                            setMissionPlayerIndex(localPlayerIndex);
                            setShowNuclearGenSelection(true);
                        }}
                        onOpenMineralExtraction={(regionId) => {
                            setMissionPlayerIndex(localPlayerIndex);
                            setShowMineralExtractionModal(regionId);
                        }}
                        onOpenEspionage={() => {
                            setMissionPlayerIndex(localPlayerIndex);
                            setShowEspionageActivationModal(true);
                        }}
                        onOpenSpecialMission={setShowSpecialMissionModal}
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

                {/* Partida finalizada por el anfitrión (sin ganador) */}
                {state.gameOver && !state.winner && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.97)', zIndex: 11000,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        fontFamily: '"Courier New", Courier, monospace', color: '#ff4444', textAlign: 'center', padding: '20px'
                    }}>
                        <h1 style={{ fontSize: '3rem', margin: '0 0 15px 0', letterSpacing: '4px', textShadow: '0 0 15px rgba(255,0,0,0.4)' }}>
                            PARTIDA FINALIZADA
                        </h1>
                        <div style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '40px' }}>
                            El anfitrión ha dado por terminada la operación.
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold',
                                backgroundColor: '#333', color: '#fff', border: '2px solid #fff',
                                borderRadius: '8px', cursor: 'pointer', letterSpacing: '2px',
                                boxShadow: '0 0 15px rgba(255,255,255,0.2)'
                            }}
                        >
                            VOLVER AL INICIO
                        </button>
                    </div>
                )}

                {/* Confidential Info Modal */}
                {showTreatiesPanel && (
                    <TreatiesPanel onClose={() => setShowTreatiesPanel(false)} />
                )}

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

                {/* Espionage Activation Modal (same action panel as the Confidential file) */}
                {!spectator && showEspionageActivationModal && (
                    <EspionageActivationModal
                        show={showEspionageActivationModal}
                        onClose={() => {
                            setShowEspionageActivationModal(false);
                            setMissionPlayerIndex(null);
                        }}
                        playerIndex={missionPlayerIndex ?? undefined}
                    />
                )}

                <SiloFuelSelectionModal
                    show={!!showSiloFuelSelectionModal}
                    playerIndex={localPlayerIndex}
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
                {/* Mission Notification */}
                <MissionNotificationOverlay />
                {!spectator && <ServerRejectionToast />}
                {state.notification?.title === 'DETENCIÓN MUTUA' ? (
                    <MADOverlay
                        involvedPlayers={players.filter(p => p.siloStatus && Object.values(p.siloStatus).some(s => s.status === 'cooldown'))}
                        currentPlayerId={multiplayer.playerId ?? ''}
                        onClose={() => state.notification && dismissNotification(state.notification.id)}
                    />
                ) : (
                    <YearStartOverlay
                        // Durante el preturno mostramos la fase de producción; la cinemática de
                        // año queda en cola y aparece recién cuando arranca la ronda de acciones.
                        year={roundPhase === 'PRODUCTION' ? null : showYearStartLocal}
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
