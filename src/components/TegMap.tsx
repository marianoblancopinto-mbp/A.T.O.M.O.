import React, { useEffect, useState } from 'react';
import { BattleOverlay } from './BattleOverlay';
import { MapRender } from './game/MapRender';
import { SidebarPanel } from './game/SidebarPanel';
import { RegionInfoPanel } from './game/RegionInfoPanel';
import { ResourceCatalogModal } from './game/ResourceCatalogModal';
import { ConfidentialInfoModal } from './game/ConfidentialInfoModal';
import { Announcements } from './game/Announcements';
import { CommittedBattle } from './game/CommittedBattle';
import { BattleReportView } from './game/BattleReportView';
import { ProductionPhaseOverlay } from './shared/overlays/ProductionPhaseOverlay';
import { InventoryModal } from './InventoryModal';
import { TreatiesPanel } from './game/treaties/TreatiesPanel';
import { getSpecialMissions } from '../data/missionData';
import { isMaritimeConnection } from '../data/mapData';
import { REGIONS } from '../data/mapRegions';
import { useBattleState } from '../hooks/useBattleState';
import { useGameContext } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import { Modal, Option, Button } from '../ui/components';
import { ToastHost } from '../ui/ToastHost';
import { OperationProvider, useOpenOperation } from '../ui/operations/OperationModal';
import type { OperationId } from '../ui/operations/specs';

/**
 * Pantalla de juego. Se compone de: mapa, barra lateral, panel del país
 * seleccionado, y tres capas comunes a todo el juego:
 *   - OperationProvider: la pantalla única de operaciones (misiones, nuclear, espionaje).
 *   - Announcements: anuncios a pantalla completa, de a uno.
 *   - ToastHost: avisos no bloqueantes.
 */

type Panel = 'inventory' | 'raw' | 'tech' | 'confidential' | 'treaties' | null;

const GameScreen: React.FC<{ spectator: boolean }> = ({ spectator }) => {
    const { state, multiplayer } = useGameContext();
    const actions = useGameActions();
    const openOperation = useOpenOperation();
    const { gameStarted, players, owners, roundPhase, battleState } = state;

    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
    const [panel, setPanel] = useState<Panel>(null);
    const [inventoryFilter, setInventoryFilter] = useState<string | null>(null);
    const [mobileSidebar, setMobileSidebar] = useState(false);

    // Animación final: recolorea el mapa SÓLO en pantalla (no toca el estado del servidor).
    const [animatedOwners, setAnimatedOwners] = useState<Record<string, string | number | null>>({});
    const [animationIndex, setAnimationIndex] = useState(-1);

    const { attackSourceSelection, setAttackSourceSelection, handleAttackClick, confirmAttackSource } = useBattleState({
        selectedRegionId,
        setConquestData: () => {},
        showTurnOverlay: false,
        conquestData: null,
    });

    useEffect(() => {
        if (state.endgameChoice && state.winner && animationIndex === -1) setAnimationIndex(0);
    }, [state.endgameChoice, state.winner, animationIndex]);

    useEffect(() => {
        if (animationIndex < 0 || animationIndex >= REGIONS.length || !state.endgameChoice || !state.winner) return;
        const timer = setTimeout(() => {
            const region = REGIONS[animationIndex];
            if (state.endgameChoice === 'victory') {
                setAnimatedOwners(prev => ({ ...prev, [region.id]: state.winner!.id }));
            } else if (owners[region.id] !== state.winner!.id) {
                setAnimatedOwners(prev => ({ ...prev, [region.id]: -2 }));
            }
            setAnimationIndex(i => i + 1);
        }, 150);
        return () => clearTimeout(timer);
    }, [animationIndex, state.endgameChoice, state.winner, owners]);

    if (!gameStarted || players.length === 0) {
        return <div className="game-loading">{spectator ? '>> ESTABLECIENDO CONEXIÓN CON EL SATÉLITE...' : '>> CARGANDO SISTEMAS TÁCTICOS...'}</div>;
    }

    const openInventory = (filter: string | null = null) => { setInventoryFilter(filter); setPanel('inventory'); };
    const operationFromRegion = (id: OperationId, regionId?: string) => openOperation({ id, regionId });
    const iAmAttacker = !!battleState && String(battleState.attacker.id) === String(multiplayer.playerId);

    return (
        <div className="game-shell">
            {!spectator && (
                <SidebarPanel
                    onEndTurn={() => { actions.endTurn(); setSelectedRegionId(null); }}
                    onOpenInventory={() => openInventory()}
                    onOpenRawMaterials={() => setPanel('raw')}
                    onOpenTechnologies={() => setPanel('tech')}
                    onOpenConfidential={() => setPanel('confidential')}
                    onOpenTreaties={() => setPanel('treaties')}
                    mobileOpen={mobileSidebar}
                    onCloseMobile={() => setMobileSidebar(false)}
                />
            )}

            <div className="game-main">
                {!spectator && (
                    <Button size="sm" className="game-menu-toggle" onClick={() => setMobileSidebar(true)}>Menú</Button>
                )}
                <div className="game-map">
                    <MapRender
                        ownersOverride={animatedOwners}
                        selectedRegionId={selectedRegionId}
                        onRegionClick={id => { if (gameStarted) setSelectedRegionId(id); }}
                        spectator={spectator}
                    />
                </div>

                {!spectator && selectedRegionId && (
                    <RegionInfoPanel
                        selectedRegionId={selectedRegionId}
                        specialMissions={getSpecialMissions(state.proxyWarCountry)}
                        onClose={() => setSelectedRegionId(null)}
                        onAttack={handleAttackClick}
                        onOpenNuclearDesign={regionId => operationFromRegion('nuclear_design', regionId)}
                        onOpenMineralExtraction={() => operationFromRegion('extract_mineral')}
                        onOpenEspionage={() => operationFromRegion('espionage_network')}
                        onOpenSpecialMission={missionId => operationFromRegion(missionId as OperationId, selectedRegionId)}
                    />
                )}
            </div>

            {/* Fases que bloquean el juego */}
            {roundPhase === 'PRODUCTION' && !state.winner && !state.gameOver && (
                <ProductionPhaseOverlay isSpectator={spectator} onOpenInventory={() => openInventory()} />
            )}
            {battleState?.isActive && (battleState.phase === 'ATTACKER_COMMIT' || battleState.phase === 'DEFENDER_COMMIT'
                ? <CommittedBattle battle={battleState} />
                : <BattleOverlay battleState={battleState} onOpenInventory={() => openInventory()} />)}
            {!spectator && <BattleReportView />}

            {/* Origen del ataque */}
            {!spectator && attackSourceSelection && (
                <Modal title="Seleccionar origen" kicker={`Ataque a ${REGIONS.find(r => r.id === attackSourceSelection.targetId)?.title ?? ''}`}
                    size="sm" onClose={() => setAttackSourceSelection(null)}>
                    <div className="ui-stack">
                        {attackSourceSelection.validSources.map(sourceId => (
                            <Option key={sourceId}
                                label={REGIONS.find(r => r.id === sourceId)?.title ?? sourceId}
                                meta={isMaritimeConnection(sourceId, attackSourceSelection.targetId) ? 'Desembarco marítimo: Infantería −1, Artillería +1' : 'Frontera terrestre'}
                                onSelect={() => confirmAttackSource(sourceId)} />
                        ))}
                    </div>
                </Modal>
            )}

            {/* Paneles */}
            {!spectator && panel === 'inventory' && (
                <InventoryModal
                    isOpen
                    onClose={() => { setPanel(null); setInventoryFilter(null); }}
                    battleTargetId={battleState?.isActive ? (iAmAttacker ? battleState.attackSourceId : battleState.targetRegionId) : null}
                    filterTargetCountry={inventoryFilter}
                />
            )}
            {(panel === 'raw' || panel === 'tech') && <ResourceCatalogModal kind={panel} onClose={() => setPanel(null)} />}
            {panel === 'treaties' && <TreatiesPanel onClose={() => setPanel(null)} />}
            {panel === 'confidential' && <ConfidentialInfoModal onClose={() => setPanel(null)} />}

            <Announcements
                spectator={spectator}
                onEndgameChoice={choice => { actions.setEndgameChoice(choice); setAnimationIndex(0); }}
                endgameAnimationDone={animationIndex >= REGIONS.length}
            />
            {!spectator && <ToastHost hidden={n => n.title === 'DETENCIÓN MUTUA'} />}
        </div>
    );
};

export const TegMap: React.FC<{ spectator?: boolean }> = ({ spectator = false }) => (
    <OperationProvider>
        <GameScreen spectator={spectator} />
    </OperationProvider>
);
