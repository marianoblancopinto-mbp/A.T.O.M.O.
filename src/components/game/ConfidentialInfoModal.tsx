import React, { useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { REGIONS } from '../../data/mapRegions';
import { useSupplyRoute } from '../../hooks/useSupplyRoute';
import { SiloFuelSelectionModal } from '../shared/modals/nuclear/SiloFuelSelectionModal';
import { EspionageActivationModal } from '../shared/modals/espionage/EspionageActivationModal';
import { EspionageTargetSelectionModal } from '../shared/modals/espionage/EspionageTargetSelectionModal';
import { RAW_MATERIAL_DATA } from '../../data/productionData';
import { type RawMaterialType } from '../../types/productionTypes';
import { SpecialMissionModal } from '../shared/modals/missions/SpecialMissionModal';
import { getSpecialMissions } from '../../data/missionData';

interface ConfidentialInfoModalProps {
    onClose: () => void;
    onOpenNuclearDesign?: (playerIndex: number) => void;
    onOpenMineralExtraction?: (targetId: string | undefined, playerIndex: number) => void;
    onOpenSiloConstruction?: (playerIndex: number) => void;
    onInitiateLaunch?: (siloId: string, playerIndex: number) => void;
    onOpenInventoryWithFilter?: (countryId: string, playerIndex: number) => void;
}

const MissionRow = ({
    title,
    description,
    isCompleted,
    onAction,
    actionLabel,
    requirementsMet,
    statusLabel,
    color,
    children
}: {
    title: string;
    description: string;
    isCompleted: boolean;
    onAction?: () => void;
    actionLabel: string;
    requirementsMet: boolean;
    statusLabel: string;
    color: string;
    children?: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = !!children;

    return (
        <div style={{
            backgroundColor: '#0a0a0a',
            border: `1px solid ${isCompleted ? color : color}40`,
            borderRadius: '4px',
            padding: '10px 15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', cursor: hasChildren ? 'pointer' : 'default' }}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h4 style={{ color: color, margin: 0, fontSize: '1rem' }}>
                            {hasChildren && <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginRight: '5px' }}>▶</span>}
                            {title}
                        </h4>
                        {isCompleted && <span style={{ color: color, fontSize: '0.8rem', fontWeight: 'bold' }}>✓</span>}
                    </div>
                    <div style={{ color: `${color}cc`, fontSize: '0.8rem', whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                        {description}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '140px' }}>
                    <div style={{
                        color: isCompleted ? color : (requirementsMet ? color : `${color}80`),
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        marginBottom: '5px',
                        textTransform: 'uppercase'
                    }}>
                        {statusLabel}
                    </div>
                    {!isCompleted && onAction && !hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction();
                            }}
                            disabled={!requirementsMet}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: requirementsMet ? color : '#222',
                                color: requirementsMet ? '#000' : `${color}60`,
                                border: `1px solid ${requirementsMet ? color : `${color}40`}`,
                                borderRadius: '2px',
                                fontWeight: 'bold',
                                cursor: requirementsMet ? 'pointer' : 'not-allowed',
                                fontSize: '0.75rem',
                                width: '100%',
                                textTransform: 'uppercase'
                            }}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
            {hasChildren && isOpen && (
                <div style={{ marginTop: '10px', borderTop: `1px solid ${color}40`, paddingTop: '10px', animation: 'fadeIn 0.2s' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const SectionTitle = ({ color, title }: { color: string, title: string }) => (
    <div style={{
        borderBottom: `1px solid ${color}`,
        color: color,
        marginBottom: '10px',
        paddingBottom: '5px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        letterSpacing: '1px'
    }}>
        {title}
    </div>
);

// Helper for Region Selection Modal
const RegionSelectionModal = ({
    show, onClose, onSelect, availableRegions
}: {
    show: boolean; onClose: () => void; onSelect: (id: string) => void; availableRegions: string[]
}) => {
    if (!show) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9500,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ backgroundColor: '#001a1a', border: '2px solid #00ffff', padding: '20px', width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
                <h3 style={{ color: '#00ffff', marginTop: 0 }}>SELECCIONAR REGIÓN OBJETIVO</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {availableRegions.map(rid => (
                        <button key={rid} onClick={() => onSelect(rid)} style={{
                            padding: '10px', backgroundColor: '#003333', color: '#fff', border: '1px solid #005555', cursor: 'pointer', textAlign: 'left'
                        }}>
                            {REGIONS.find(r => r.id === rid)?.title || rid}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} style={{ marginTop: '15px', width: '100%', padding: '10px', background: 'none', border: '1px solid #666', color: '#ccc', cursor: 'pointer' }}>CANCELAR</button>
            </div>
        </div>
    );
};


export const ConfidentialInfoModal: React.FC<ConfidentialInfoModalProps> = ({
    onClose,
    onOpenNuclearDesign,
    onOpenMineralExtraction,
    onOpenSiloConstruction,
    onInitiateLaunch,
    onOpenInventoryWithFilter
}) => {
    const { state, multiplayer } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const { checkRoute } = useSupplyRoute();

    // Modal State
    const [fuelModal, setFuelModal] = useState<{ show: boolean, regionId: string | null }>({ show: false, regionId: null });
    const [activeSecondary, setActiveSecondary] = useState<string | null>(null);
    const [espionageActivationModal, setEspionageActivationModal] = useState(false);
    const [espionageTargetModal, setEspionageTargetModal] = useState<{ show: boolean, cardId: string | null }>({ show: false, cardId: null });
    const [selectedRegionForMission, setSelectedRegionForMission] = useState<string | null>(null);
    const [showWarSecrets, setShowWarSecrets] = useState(false);

    // Determine which player's info and index to show
    let targetPlayer = players[currentPlayerIndex];
    let targetPlayerIndex = currentPlayerIndex;

    // In multiplayer, ALWAYS show the local player's info, regardless of whose turn it is
    if (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId) {
        const localPlayerIdx = players.findIndex(p => p.id === multiplayer.playerId);
        if (localPlayerIdx !== -1) {
            targetPlayer = players[localPlayerIdx];
            targetPlayerIndex = localPlayerIdx;
        }
    }

    if (!targetPlayer) return null;

    // Check mission status
    const hasNuclearDesign = targetPlayer.specialCards.some(c =>
        c.name === 'DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES' ||
        (c.type === 'NUCLEAR_WEAPON' && c.name.includes('DISEÑO'))
    );
    const hasSecretMineral = targetPlayer.specialCards.some(c =>
        c.name === 'MINERAL SECRETO' ||
        c.type === 'SECRET_MINERAL'
    );

    // Secondary Mission Checkers (simplified logic based on specialCards or custom flags)
    const isMissionCompleted = (name: string) => targetPlayer.specialCards.some(c => c.name.includes(name));

    // Handlers
    const handleOpenMission = (missionId: string) => {
        if (missionId === 'GEOTHERMAL' || missionId === 'DESALINIZATION') {
            setSelectedRegionForMission(null);
        }
        if (missionId === 'secretos_guerra') {
            setShowWarSecrets(true);
            return;
        }
        setActiveSecondary(missionId);
    };

    const handleRegionSelect = (regionId: string) => {
        setSelectedRegionForMission(regionId);
    };

    // Get owned regions for selection
    const ownedRegions = Object.keys(owners).filter(rid => owners[rid] === targetPlayer.id);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace'
        }}>
            <div style={{
                width: window.innerWidth <= 768 ? '100%' : '800px',
                maxWidth: '95vw',
                height: window.innerWidth <= 768 ? '100vh' : '90vh',
                backgroundColor: '#001100',

                border: `2px solid ${targetPlayer.color}`,
                boxShadow: `0 0 30px ${targetPlayer.color}40`,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${targetPlayer.color}`,
                    paddingBottom: '15px',
                    marginBottom: '20px'
                }}>
                    <div>
                        <h2 style={{ color: targetPlayer.color, margin: 0, fontSize: '1.8rem', letterSpacing: '2px' }}>
                            EXPEDIENTE CONFIDENCIAL
                        </h2>
                        <div style={{ color: `${targetPlayer.color}cc`, fontSize: '0.9rem', marginTop: '5px' }}>
                            COMANDANTE: {targetPlayer.name}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: `1px solid ${targetPlayer.color}`,
                            color: targetPlayer.color,
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '5px 15px',
                            fontWeight: 'bold'
                        }}
                    >
                        CERRAR
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>

                    {/* 1. OBJETIVOS PRIMARIOS */}
                    <div style={{ marginBottom: '30px' }}>
                        <SectionTitle color={targetPlayer.color} title="OBJETIVOS PRIMARIOS" />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                            {/* Diseño de Misiles */}
                            {(() => {
                                const nuclearCapableCountries = state.regionResources?.nuclearWarCapable || [];
                                const ownedNuclearCountries = nuclearCapableCountries.filter(rid => owners[rid] === targetPlayer.id);
                                const hasCapableCountry = ownedNuclearCountries.length > 0;
                                const countryNames = nuclearCapableCountries.length > 0
                                    ? nuclearCapableCountries.map(id => REGIONS.find(r => r.id === id)?.title || id).join(', ')
                                    : "Ninguno (o datos no cargados)";

                                return (
                                    <MissionRow
                                        title="DISEÑO DE MISILES"
                                        description={`Desarrolla la tecnología necesaria para armamento nuclear.\nRequiere control de una potencia nuclear activa en esta partida: ${countryNames}.`}
                                        isCompleted={hasNuclearDesign}
                                        onAction={() => onOpenNuclearDesign?.(targetPlayerIndex)}
                                        actionLabel="INICIAR DISEÑO"
                                        requirementsMet={hasCapableCountry}
                                        statusLabel={
                                            !hasNuclearDesign
                                                ? (hasCapableCountry ? "Disponible" : "Sin Capacidad Nuclear")
                                                : "Completado"
                                        }
                                        color={targetPlayer.color}
                                    />
                                );
                            })()}

                            {/* Extracción de Mineral */}
                            {(() => {
                                const targetRegionId = targetPlayer.secretMineralLocation;
                                const targetRegionName = targetRegionId ? (REGIONS.find(r => r.id === targetRegionId)?.title || targetRegionId) : "Desconocido";
                                const isControlled = targetRegionId && owners[targetRegionId] === targetPlayer.id;

                                return (
                                    <MissionRow
                                        title="MINERAL SECRETO"
                                        description={`Extracción de recursos estratégicos. \nREGIÓN OBJETIVO: ${targetRegionName}`}
                                        isCompleted={hasSecretMineral}
                                        onAction={() => onOpenMineralExtraction?.(targetRegionId || undefined, targetPlayerIndex)}
                                        actionLabel="INICIAR EXTRACCIÓN"
                                        requirementsMet={!!isControlled}
                                        statusLabel={hasSecretMineral ? "Completado" : (isControlled ? "Disponible" : "Región no controlada")}
                                        color={targetPlayer.color}
                                    />
                                );
                            })()}

                            {/* Construcción de Silos + Asignación de Combustible */}
                            <MissionRow
                                title="SILOS DE LANZAMIENTO"
                                description={`Construcción y abastecimiento de infraestructura nuclear.`}
                                isCompleted={false}
                                onAction={() => onOpenSiloConstruction?.(targetPlayerIndex)}
                                actionLabel="CONSTRUIR SILO"
                                requirementsMet={true}
                                statusLabel="Disponible"
                                color={targetPlayer.color}
                            >
                                {targetPlayer.silos.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {targetPlayer.silos.map(regionId => {
                                            const hasFuel = !!targetPlayer.siloFuelCards?.[regionId];
                                            const regionName = REGIONS.find(r => r.id === regionId)?.title || regionId;
                                            const siloData = targetPlayer.siloStatus[regionId];
                                            const isOperational = siloData?.status === 'active';
                                            const currentYear = state.gameDate.getFullYear();
                                            const operableYear = currentYear + (siloData?.turnsRemaining || 0);

                                            const fuelCardId = targetPlayer.siloFuelCards?.[regionId];
                                            const fuelCard = targetPlayer.inventory.rawMaterials.find(c => c.id === fuelCardId);
                                            const fuelDisplayName = fuelCard
                                                ? `${(RAW_MATERIAL_DATA[fuelCard.type as RawMaterialType]?.name || fuelCard.type).toUpperCase()} - ${REGIONS.find(r => r.id === fuelCard.country)?.title.toUpperCase() || 'DESCONOCIDO'}`
                                                : 'CARGADO';

                                            return (
                                                <div key={regionId} style={{
                                                    backgroundColor: '#1a0a00',
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '5px',
                                                    border: `1px solid ${isOperational ? targetPlayer.color : `${targetPlayer.color}40`}`
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: targetPlayer.color, fontSize: '0.85rem' }}>
                                                            SILO EN {regionName.toUpperCase()}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {hasFuel && (
                                                                <span style={{ color: targetPlayer.color, fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: `${targetPlayer.color}20`, padding: '2px 6px', borderRadius: '3px', border: `1px solid ${targetPlayer.color}40` }}>
                                                                    {fuelDisplayName}
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setFuelModal({ show: true, regionId }); }}
                                                                style={{
                                                                    backgroundColor: hasFuel ? targetPlayer.color : `${targetPlayer.color}40`,
                                                                    color: '#000',
                                                                    border: 'none',
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '2px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {hasFuel ? 'CAMBIAR' : 'ASIGNAR'} COMBUSTIBLE
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        color: isOperational ? targetPlayer.color : `${targetPlayer.color}80`,
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {isOperational ? (
                                                            ' ESTADO: OPERATIVO'
                                                        ) : (
                                                            `${siloData?.status === 'construction' ? 'CONSTRUCCIÓN' : 'ENFRIAMIENTO'} - OPERABLE EN ${operableYear}`
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </MissionRow>
                        </div>
                    </div>

                    {/* 2. OBJETIVOS SECUNDARIOS */}
                    <div style={{ marginBottom: '30px' }}>
                        <SectionTitle color={targetPlayer.color} title="OBJETIVOS SECUNDARIOS" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                            {(() => {
                                // 1. Get Dynamic Missions
                                const specialMissions = getSpecialMissions(state.proxyWarCountry || '');

                                // 2. Define Espionage separately (not in missionData)
                                const espionageMission = {
                                    id: 'ESPIONAGE',
                                    title: 'ESPIONAJE GLOBAL',
                                    description: 'Obtener información de inteligencia enemiga.',
                                    visibleFor: [] as string[]
                                };

                                // 3. Combine and Filter
                                const allMissions = [espionageMission, ...specialMissions].filter(mission => {
                                    if (mission.id === 'ESPIONAGE') return true; // Always visible (or check for cards if desired)

                                    // Special visibility cases (e.g. Secretos de Guerra proxy Check is inside visibleFor)
                                    // Check if player controls ANY of the required regions
                                    const hasControl = mission.visibleFor.some(rid => owners[rid] === targetPlayer.id);

                                    // Also show if mission is already active/completed by player (so they can see status)
                                    // Generic check: name in specialCards?
                                    // Specific checks for multi-build missions (Desalination/Geothermal)
                                    let isStarted = false;
                                    if (mission.id === 'planta_desalinizacion') {
                                        isStarted = targetPlayer.specialCards.some(c => c.name === 'PLANTA DE DESALINIZACIÓN');
                                    } else if (mission.id === 'energia_geotermica') {
                                        isStarted = targetPlayer.specialCards.some(c => c.name === 'ENERGÍA GEOTÉRMICA');
                                    } else {
                                        isStarted = targetPlayer.specialCards.some(c => c.name === mission.title);
                                        if (mission.id === 'secretos_guerra' && targetPlayer.secretWarData.length > 0) isStarted = true;
                                    }

                                    return hasControl || isStarted;
                                });

                                return allMissions.map(mission => {
                                    // Shared Helper for Sub-Rows
                                    if (mission.id === 'planta_desalinizacion' || mission.id === 'energia_geotermica') {
                                        const validRegions = mission.id === 'planta_desalinizacion'
                                            ? ['espana', 'marruecos', 'arabia', 'chile', 'california']
                                            : ['islandia', 'filipinas'];

                                        const cardName = mission.id === 'planta_desalinizacion' ? 'PLANTA DE DESALINIZACIÓN' : 'ENERGÍA GEOTÉRMICA';
                                        const completedRegions = targetPlayer.specialCards
                                            .filter(c => c.name === cardName)
                                            .map(c => c.originCountry);

                                        // Filter sub-rows: Show only if owned OR built
                                        // User Requirement: "que aparezca si el jugador controla al menos un pais" (Handled by parent filter)
                                        // BUT, for the sub-rows themselves, we should probably show all VALID regions that are relevant (Owned or Built).
                                        // If I don't own it and haven't built it, should I show it? 
                                        // "que los misiones ... se muestren ... si el jugador controla ese pais"
                                        // Probably safest to show sub-rows for Owned + Built regions only.

                                        const visibleSubRegions = validRegions.filter(rid =>
                                            owners[rid] === targetPlayer.id || completedRegions.includes(rid)
                                        );

                                        return (
                                            <MissionRow
                                                key={mission.id}
                                                title={mission.title}
                                                description={mission.description}
                                                isCompleted={false}
                                                onAction={() => { }} // No main action
                                                actionLabel=""
                                                requirementsMet={true} // Always show sub-rows
                                                statusLabel=""
                                                color={targetPlayer.color}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {visibleSubRegions.map(regionId => {
                                                        const regionName = REGIONS.find(r => r.id === regionId)?.title || regionId;
                                                        const isOwned = owners[regionId] === targetPlayer.id;
                                                        const isBuilt = completedRegions.includes(regionId);

                                                        // Determine Status
                                                        let statusText = "REQUIERE CONTROL";
                                                        let statusColor = `${targetPlayer.color}60`; // Low opacity for inactive
                                                        let canBuild = false;

                                                        if (isBuilt) {
                                                            statusText = "OPERATIVA";
                                                            statusColor = targetPlayer.color;
                                                        } else if (isOwned) {
                                                            statusText = "DISPONIBLE";
                                                            statusColor = targetPlayer.color;
                                                            canBuild = true;
                                                        }

                                                        return (
                                                            <div key={regionId} style={{
                                                                backgroundColor: '#001a1a',
                                                                padding: '8px',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                border: `1px solid ${statusColor}40`
                                                            }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ color: targetPlayer.color, fontSize: '0.85rem' }}>{regionName.toUpperCase()}</span>
                                                                    <span style={{ color: statusColor, fontSize: '0.7rem', fontWeight: 'bold' }}>{statusText}</span>
                                                                </div>

                                                                {!isBuilt && (
                                                                    <button
                                                                        disabled={!canBuild}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedRegionForMission(regionId);
                                                                            setActiveSecondary(mission.id);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: canBuild ? targetPlayer.color : '#222',
                                                                            color: canBuild ? '#000' : `${targetPlayer.color}40`,
                                                                            border: 'none',
                                                                            padding: '4px 10px',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 'bold',
                                                                            cursor: canBuild ? 'pointer' : 'not-allowed',
                                                                            borderRadius: '2px',
                                                                            textTransform: 'uppercase'
                                                                        }}
                                                                    >
                                                                        CONSTRUIR
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </MissionRow>
                                        );
                                    }

                                    if (mission.id === 'ESPIONAGE') {
                                        const espionageCards = targetPlayer.specialCards.filter(c => c.type === 'ESPIONAJE');
                                        return (
                                            <MissionRow
                                                key={mission.id}
                                                title={mission.title}
                                                description={mission.description}
                                                isCompleted={false}
                                                onAction={() => setEspionageActivationModal(true)}
                                                actionLabel="INICIAR OPERACIÓN"
                                                requirementsMet={true}
                                                statusLabel="Agencia"
                                                color={targetPlayer.color}
                                            >
                                                {espionageCards.length > 0 && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {espionageCards.map(card => (
                                                            <div key={card.id} style={{
                                                                backgroundColor: '#001a1a', padding: '8px', borderRadius: '4px',
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                border: `1px solid ${targetPlayer.color}40`
                                                            }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ color: targetPlayer.color, fontSize: '0.85rem' }}>AGENCIA: {REGIONS.find(r => r.id === card.originCountry)?.title || card.originCountry}</span>
                                                                    <span style={{ color: targetPlayer.color, fontSize: '0.7rem' }}>OPERATIVA</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEspionageTargetModal({ show: true, cardId: card.id });
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: targetPlayer.color, color: '#000', border: 'none',
                                                                        padding: '4px 10px', fontSize: '0.7rem', fontWeight: 'bold',
                                                                        cursor: 'pointer', borderRadius: '2px'
                                                                    }}
                                                                >
                                                                    EJECUTAR
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </MissionRow>
                                        );
                                    }

                                    if (mission.id === 'secretos_guerra') {
                                        const proxyWarCountryId = REGIONS.find(r => r.title === state.proxyWarCountry)?.id;
                                        const isControlled = proxyWarCountryId && owners[proxyWarCountryId] === targetPlayer.id;
                                        const isCompleted = targetPlayer.secretWarData.length >= 2;

                                        return (
                                            <MissionRow
                                                key={mission.id}
                                                title={mission.title}
                                                description={mission.description}
                                                isCompleted={isCompleted}
                                                onAction={() => handleOpenMission(mission.id)}
                                                actionLabel="ACTIVAR"
                                                requirementsMet={!!isControlled}
                                                statusLabel={isCompleted ? "Completado" : (isControlled ? "Disponible" : "Control Requerido")}
                                                color={targetPlayer.color}
                                            />
                                        );
                                    }

                                    return (
                                        <MissionRow
                                            key={mission.id}
                                            title={mission.title}
                                            description={mission.description} // Was mission.desc, now using property from map/object
                                            isCompleted={isMissionCompleted(mission.title)}
                                            onAction={() => handleOpenMission(mission.id)}
                                            actionLabel="VER DETALLES"
                                            requirementsMet={true}
                                            statusLabel={isMissionCompleted(mission.title) ? "Completado" : "Disponible"}
                                            color={targetPlayer.color}
                                        />
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* 3. PROTOCOLO DE DESPLIEGUE FINAL */}
                    {(() => {
                        const hasSilos = targetPlayer.silos.length > 0;
                        const mineralCard = targetPlayer.specialCards.find(c => c.type === 'SECRET_MINERAL' || c.name === 'MINERAL SECRETO');

                        // Check if player has the design card
                        const hasDesign = targetPlayer.specialCards.some(c =>
                            c.name === 'DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES' ||
                            (c.type === 'NUCLEAR_WEAPON' && c.name.includes('DISEÑO'))
                        );

                        if (!hasDesign || !hasSilos || !mineralCard) return null;

                        return (
                            <div style={{
                                marginBottom: '30px',
                                padding: '20px',
                                border: '2px solid #ff0000',
                                backgroundColor: '#1a0000',
                                borderRadius: '5px',
                                boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)'
                            }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#ff0000', textAlign: 'center', textShadow: '0 0 5px #ff0000', fontWeight: 'bold', letterSpacing: '2px' }}>
                                    ☢️ PROTOCOLO DE DESPLIEGUE ATÓMICO
                                </h4>

                                {targetPlayer.nuclearDeploymentActive ? (
                                    <div style={{ color: '#ffaa00', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', padding: '10px', border: '1px dashed #ffaa00', backgroundColor: 'rgba(255,170,0,0.05)' }}>
                                        ☢️ PROCESO DE DESPLIEGUE EN CURSO ☢️
                                        <div style={{ fontSize: '0.8rem', marginTop: '10px', color: '#aaa', fontWeight: 'normal', fontStyle: 'italic' }}>
                                            Ganas al final del año si el silo permanece bajo tu control y nadie más activa su arsenal.
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '15px' }}>
                                            Para iniciar el despliegue final, selecciona un silo operativo con combustible asignado y ruta de suministro desde el mineral secreto:
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {targetPlayer.silos.map(siloId => {
                                                const siloRegion = REGIONS.find(r => r.id === siloId);
                                                const siloData = targetPlayer.siloStatus[siloId];
                                                const isOperational = siloData?.status === 'active';
                                                const hasFuel = targetPlayer.siloFuelCards?.[siloId] !== undefined;
                                                const hasRoute = checkRoute(mineralCard.originCountry, siloId, targetPlayerIndex);
                                                const canDeploy = isOperational && hasFuel && hasRoute;

                                                return (
                                                    <div key={siloId} style={{
                                                        padding: '12px',
                                                        backgroundColor: '#000',
                                                        border: `1px solid ${canDeploy ? '#00ff00' : '#440000'}`,
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div>
                                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>SILO: {siloRegion?.title || siloId}</div>
                                                            <div style={{ fontSize: '0.7rem', display: 'flex', gap: '10px', marginTop: '4px' }}>
                                                                <span style={{ color: hasFuel ? '#00ff00' : '#ff4444' }}>COMBUSTIBLE: {hasFuel ? '✓' : '✗'}</span>
                                                                <span style={{ color: hasRoute ? '#00ff00' : '#ff4444' }}>RUTA: {hasRoute ? '✓' : '✗'}</span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            disabled={!canDeploy}
                                                            onClick={() => onInitiateLaunch?.(siloId, targetPlayerIndex)}
                                                            style={{
                                                                backgroundColor: canDeploy ? '#ff0000' : '#220000',
                                                                color: canDeploy ? '#fff' : '#666',
                                                                border: 'none',
                                                                padding: '8px 15px',
                                                                fontWeight: 'bold',
                                                                cursor: canDeploy ? 'pointer' : 'not-allowed',
                                                                fontSize: '0.75rem',
                                                                borderRadius: '3px',
                                                                textTransform: 'uppercase',
                                                                boxShadow: canDeploy ? '0 0 10px rgba(255,0,0,0.3)' : 'none'
                                                            }}
                                                        >
                                                            {canDeploy ? 'INICIAR' : 'NO DISPONIBLE'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    {/* 4. ACTIVOS ESPECIALES (Cards) */}
                    <SectionTitle color={targetPlayer.color} title="ACTIVOS ESPECIALES" />

                    {targetPlayer.specialCards.length === 0 ? (
                        <div style={{ color: '#666', padding: '10px', fontStyle: 'italic' }}>
                            Ningun activo especial en posesión.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                            {targetPlayer.specialCards.map((card, idx) => (
                                <div key={idx} style={{
                                    border: '1px solid #444',
                                    backgroundColor: '#050505',
                                    padding: '15px',
                                    borderRadius: '4px'
                                }}>
                                    <h4 style={{ color: targetPlayer.color, marginTop: 0, marginBottom: '10px' }}>
                                        {card.name}
                                    </h4>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                                        ORIGEN: {REGIONS.find(r => r.id === card.originCountry)?.title || card.originCountry}
                                    </div>
                                    <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0 }}>
                                        {card.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            {/* Region Selectors for Complex Missions */}
            {((activeSecondary === 'energia_geotermica' || activeSecondary === 'planta_desalinizacion') && !selectedRegionForMission) && (
                <RegionSelectionModal
                    show={true}
                    onClose={() => setActiveSecondary(null)}
                    onSelect={handleRegionSelect}
                    availableRegions={ownedRegions}
                />
            )}

            {/* Modals for Secondary Operations */}
            {fuelModal.show && (
                <SiloFuelSelectionModal
                    show={fuelModal.show}
                    siloRegionId={fuelModal.regionId}
                    playerIndex={targetPlayerIndex}
                    onClose={() => setFuelModal({ show: false, regionId: null })}
                />
            )}

            {activeSecondary === 'ruta_antartica' && (
                <SpecialMissionModal
                    missionId="ruta_antartica"
                    onClose={() => setActiveSecondary(null)}
                    proxyWarCountryName={multiplayer.playerId === targetPlayer.id ? (state.proxyWarCountry || '') : ''}
                    selectedRegionId={null}
                />
            )}
            {showWarSecrets && (
                <SpecialMissionModal
                    missionId="secretos_guerra"
                    onClose={() => setShowWarSecrets(false)}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={REGIONS.find(r => r.title === state.proxyWarCountry)?.id || null}
                />
            )}
            {espionageActivationModal && (
                <EspionageActivationModal show={true} onClose={() => setEspionageActivationModal(false)} playerIndex={targetPlayerIndex} />
            )}
            {espionageTargetModal.show && (
                <EspionageTargetSelectionModal show={true} cardId={espionageTargetModal.cardId} onClose={() => setEspionageTargetModal({ show: false, cardId: null })} />
            )}
            {activeSecondary === 'cruce_andes' && (
                <SpecialMissionModal
                    missionId="cruce_andes"
                    onClose={() => setActiveSecondary(null)}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={null}
                    setShowInventory={(show) => show && onOpenInventoryWithFilter?.('', targetPlayerIndex)}
                />
            )}
            {activeSecondary === 'desembarco_normandia' && (
                <SpecialMissionModal
                    missionId="desembarco_normandia"
                    onClose={() => setActiveSecondary(null)}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={null}
                />
            )}
            {activeSecondary === 'alejandro_magno' && (
                <SpecialMissionModal
                    missionId="alejandro_magno"
                    onClose={() => setActiveSecondary(null)}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={null}
                    setShowInventory={(show) => show && onOpenInventoryWithFilter?.('grecia', targetPlayerIndex)}
                />
            )}
            {showWarSecrets && (
                <SpecialMissionModal
                    missionId="secretos_guerra"
                    onClose={() => setShowWarSecrets(false)}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={REGIONS.find(r => r.title === state.proxyWarCountry)?.id || null}
                />
            )}
            {activeSecondary === 'energia_geotermica' && selectedRegionForMission && (
                <SpecialMissionModal
                    missionId="energia_geotermica"
                    onClose={() => { setActiveSecondary(null); setSelectedRegionForMission(null); }}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={selectedRegionForMission}
                    setShowInventory={(show) => show && onOpenInventoryWithFilter?.('', targetPlayerIndex)}
                />
            )}
            {(activeSecondary === 'planta_desalinizacion') && selectedRegionForMission && (
                <SpecialMissionModal
                    missionId="planta_desalinizacion"
                    onClose={() => { setActiveSecondary(null); setSelectedRegionForMission(null); }}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={selectedRegionForMission}
                    setShowInventory={(show) => show && onOpenInventoryWithFilter?.('', targetPlayerIndex)}
                />
            )}

            {/* Generic Handler for New Missions */}
            {['golden_dome', 'fuego_del_pacifico', 'refundacion_estanbul', 'legado_otomano', 'gengis_khan', 'bolivar'].includes(activeSecondary || '') && (
                <SpecialMissionModal
                    missionId={activeSecondary!}
                    onClose={() => setActiveSecondary(null)}
                    proxyWarCountryName={state.proxyWarCountry || ''}
                    selectedRegionId={null}
                    setShowInventory={(show) => show && onOpenInventoryWithFilter?.('', targetPlayerIndex)}
                />
            )}
        </div>
    );
};
