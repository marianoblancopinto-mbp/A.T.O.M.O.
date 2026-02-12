import React, { useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { REGIONS } from '../../data/mapRegions';
import { SiloFuelSelectionModal } from '../shared/modals/nuclear/SiloFuelSelectionModal';
import { AntarcticaMissionModal } from '../shared/modals/missions/AntarcticaMissionModal';
import { EspionageTargetSelectionModal } from '../shared/modals/espionage/EspionageTargetSelectionModal';
import { AndesMissionModal } from '../shared/modals/missions/AndesMissionModal';
import { NormandyMissionModal } from '../shared/modals/missions/NormandyMissionModal';
import { AlejandroMissionModal } from '../shared/modals/missions/AlejandroMissionModal';
import { GeothermalMissionModal } from '../shared/modals/missions/GeothermalMissionModal';
import { DesalinizacionMissionModal } from '../shared/modals/missions/DesalinizacionMissionModal';

interface ConfidentialInfoModalProps {
    onClose: () => void;
    onOpenNuclearDesign?: () => void;
    onOpenMineralExtraction?: (targetId?: string) => void;
    onOpenSiloConstruction?: () => void;
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
}) => (
    <div style={{
        backgroundColor: '#0a0a0a',
        border: `1px solid ${isCompleted ? '#00ff00' : color}40`,
        borderRadius: '4px',
        padding: '10px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h4 style={{ color: isCompleted ? '#00ff00' : color, margin: 0, fontSize: '1rem' }}>{title}</h4>
                    {isCompleted && <span style={{ color: '#00ff00', fontSize: '0.8rem', fontWeight: 'bold' }}>✓</span>}
                </div>
                <div style={{ color: '#888', fontSize: '0.8rem', whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                    {description}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '140px' }}>
                <div style={{
                    color: isCompleted ? '#00ff00' : (requirementsMet ? color : '#666'),
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    textTransform: 'uppercase'
                }}>
                    {statusLabel}
                </div>
                {!isCompleted && onAction && (
                    <button
                        onClick={onAction}
                        disabled={!requirementsMet}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: requirementsMet ? color : '#222',
                            color: requirementsMet ? '#000' : '#444',
                            border: 'none',
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
        {children && (
            <div style={{ marginTop: '10px', borderTop: '1px solid #222', paddingTop: '10px' }}>
                {children}
            </div>
        )}
    </div>
);

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
    onOpenSiloConstruction
}) => {
    const { state, multiplayer } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;

    // Modal State
    const [fuelModal, setFuelModal] = useState<{ show: boolean, regionId: string | null }>({ show: false, regionId: null });
    const [activeSecondary, setActiveSecondary] = useState<string | null>(null);
    const [selectedRegionForMission, setSelectedRegionForMission] = useState<string | null>(null);

    // Determine which player's info to show
    let targetPlayer = players[currentPlayerIndex];

    // In multiplayer, ALWAYS show the local player's info, regardless of whose turn it is
    if (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId) {
        const localPlayer = players.find(p => p.id === multiplayer.playerId);
        if (localPlayer) {
            targetPlayer = localPlayer;
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
                width: '800px',
                maxWidth: '95vw',
                height: '90vh',
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
                        <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
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
                        <SectionTitle color="#ff9100" title="OBJETIVOS PRIMARIOS" />

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
                                        onAction={onOpenNuclearDesign}
                                        actionLabel="INICIAR DISEÑO"
                                        requirementsMet={hasCapableCountry}
                                        statusLabel={
                                            !hasNuclearDesign
                                                ? (hasCapableCountry ? "Disponible" : "Sin Capacidad Nuclear")
                                                : "Completado"
                                        }
                                        color="#ff9100"
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
                                        onAction={() => onOpenMineralExtraction?.(targetRegionId || undefined)}
                                        actionLabel="INICIAR EXTRACCIÓN"
                                        requirementsMet={!!isControlled}
                                        statusLabel={hasSecretMineral ? "Completado" : (isControlled ? "Disponible" : "Región no controlada")}
                                        color="#00ffff"
                                    />
                                );
                            })()}

                            {/* Construcción de Silos + Asignación de Combustible */}
                            <MissionRow
                                title="SILOS DE LANZAMIENTO"
                                description={`Construcción y abastecimiento de infraestructura nuclear.`}
                                isCompleted={false}
                                onAction={onOpenSiloConstruction}
                                actionLabel="CONSTRUIR SILO"
                                requirementsMet={true}
                                statusLabel="Disponible"
                                color="#ff4400"
                            >
                                {targetPlayer.silos.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {targetPlayer.silos.map(regionId => {
                                            const hasFuel = !!targetPlayer.siloFuelCards?.[regionId];
                                            const regionName = REGIONS.find(r => r.id === regionId)?.title || regionId;

                                            return (
                                                <div key={regionId} style={{
                                                    backgroundColor: '#1a0a00',
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    border: '1px solid #442200'
                                                }}>
                                                    <span style={{ color: '#fff', fontSize: '0.85rem' }}>
                                                        SILO EN {regionName.toUpperCase()}
                                                    </span>
                                                    {hasFuel ? (
                                                        <span style={{ color: '#00ff00', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            LISTO / CARGADO
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setFuelModal({ show: true, regionId })}
                                                            style={{
                                                                backgroundColor: '#ff9100',
                                                                color: '#000',
                                                                border: 'none',
                                                                padding: '4px 8px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer',
                                                                borderRadius: '2px'
                                                            }}
                                                        >
                                                            ASIGNAR COMBUSTIBLE
                                                        </button>
                                                    )}
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
                        <SectionTitle color="#0088ff" title="OBJETIVOS SECUNDARIOS" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                            {[
                                { id: 'ANTARCTICA', title: 'RUTA ANTÁRTICA', desc: 'Establecer control sobre rutas polares.' },
                                { id: 'ESPIONAGE', title: 'ESPIONAJE GLOBAL', desc: 'Obtener información de inteligencia enemiga.' },
                                { id: 'ANDES', title: 'CRUCE DE LOS ANDES', desc: 'Maniobra táctica en alta montaña.' },
                                { id: 'NORMANDY', title: 'DESEMBARCO EN NORMANDÍA', desc: 'Operación anfibia a gran escala.' },
                                { id: 'ALEJANDRO', title: 'ALEJANDRO MAGNO', desc: 'Conquista de territorios históricos.' },
                                { id: 'GEOTHERMAL', title: 'ENERGÍA GEOTÉRMICA', desc: 'Aprovechamiento de recursos volcánicos.' },
                                { id: 'DESALINIZATION', title: 'DESALINIZACIÓN', desc: 'Tecnología de purificación de agua.' },
                            ].map(mission => (
                                <MissionRow
                                    key={mission.id}
                                    title={mission.title}
                                    description={mission.desc}
                                    isCompleted={isMissionCompleted(mission.title)} // Rough check
                                    onAction={() => handleOpenMission(mission.id)}
                                    actionLabel="VER DETALLES"
                                    requirementsMet={true}
                                    statusLabel={isMissionCompleted(mission.title) ? "Completado" : "Disponible"}
                                    color="#0088ff"
                                />
                            ))}
                        </div>
                    </div>

                    {/* 3. ACTIVOS ESPECIALES (Cards) */}
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
            {((activeSecondary === 'GEOTHERMAL' || activeSecondary === 'DESALINIZATION') && !selectedRegionForMission) && (
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
                    onClose={() => setFuelModal({ show: false, regionId: null })}
                />
            )}

            {activeSecondary === 'ANTARCTICA' && (
                <AntarcticaMissionModal onClose={() => setActiveSecondary(null)} onSuccess={() => { }} />
            )}
            {activeSecondary === 'ESPIONAGE' && (
                <EspionageTargetSelectionModal show={true} onClose={() => setActiveSecondary(null)} />
            )}
            {activeSecondary === 'ANDES' && (
                <AndesMissionModal onClose={() => setActiveSecondary(null)} onSuccess={() => { }} />
            )}
            {activeSecondary === 'NORMANDY' && (
                <NormandyMissionModal show={true} onClose={() => setActiveSecondary(null)} onSuccess={() => { }} />
            )}
            {activeSecondary === 'ALEJANDRO' && (
                <AlejandroMissionModal show={true} onClose={() => setActiveSecondary(null)} onSuccess={() => { }} onOpenInventory={onClose} />
            )}
            {activeSecondary === 'GEOTHERMAL' && selectedRegionForMission && (
                <GeothermalMissionModal
                    show={true}
                    onClose={() => setActiveSecondary(null)}
                    onSuccess={() => { }}
                    onOpenInventory={onClose}
                    targetCountry={selectedRegionForMission}
                    REGIONS={REGIONS}
                />
            )}
            {activeSecondary === 'DESALINIZATION' && selectedRegionForMission && (
                <DesalinizacionMissionModal
                    show={true}
                    onClose={() => setActiveSecondary(null)}
                    onSuccess={() => { }}
                    onOpenInventory={onClose}
                    targetCountry={selectedRegionForMission}
                    REGIONS={REGIONS}
                />
            )}
        </div>
    );
};
