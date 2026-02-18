import React from 'react';
import { REGIONS } from '../../data/mapRegions';
import { RAW_MATERIAL_DATA, TECHNOLOGY_DATA, TECHNOLOGY_REQUIREMENTS, TECHNOLOGY_PRODUCES } from '../../data/productionData';
import { REGION_BIOMES, BIOME_DETAILS } from '../../data/biomeData';
import { useGameContext } from '../../context/GameContext';
import type { TechnologyType, RawMaterialType } from '../../types/productionTypes';
import type { SpecialMission } from '../../data/missionData';

interface RegionInfoPanelProps {
    selectedRegionId: string;
    specialMissions: SpecialMission[];
    onClose: () => void;
    onAttack: () => void;
    onShowNuclearDesignInfo: (regionId: string) => void;
    onShowMineralExtraction: (regionId: string) => void;
    onShowEspionageNetworkInfo: (regionId: string) => void;
    onShowSpecialMissionInfo: (missionId: string) => void;
}

export const RegionInfoPanel: React.FC<RegionInfoPanelProps> = ({
    selectedRegionId,
    specialMissions,
    onClose,
    onAttack,
    onShowNuclearDesignInfo,
    onShowMineralExtraction,
    onShowEspionageNetworkInfo,
    onShowSpecialMissionInfo,
}) => {
    const { state, multiplayer } = useGameContext();
    const { players, currentPlayerIndex, owners, regionResources } = state;
    const currentPlayer = players[currentPlayerIndex];

    const isMyTurn = (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId)
        ? players[currentPlayerIndex]?.id === multiplayer.playerId
        : true;


    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{
            height: isMobile ? 'auto' : '200px',
            maxHeight: isMobile ? '60vh' : '200px',
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 20, 0, 0.98)',
            borderTop: '2px solid #00ff00',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 20px',
            boxSizing: 'border-box',
            color: '#00ff00',
            fontFamily: 'monospace',
            boxShadow: '0 -5px 20px rgba(0, 255, 0, 0.2)',
            zIndex: 20,
            position: isMobile ? 'fixed' : 'relative',
            bottom: 0,
            left: 0,
            width: '100%'
        }}>

            <div style={{
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderBottom: '1px solid #005500',
                paddingBottom: '5px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>{REGIONS.find(r => r.id === selectedRegionId)?.title}</span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#005500',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                    }}
                >
                    X
                </button>
            </div>

            <div style={{
                display: 'flex',
                flex: isMobile ? 'none' : 1,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '10px' : '20px',
                overflow: isMobile ? 'visible' : 'hidden',
                paddingBottom: isMobile ? '20px' : '0'
            }}>
                {/* Geography Column */}
                <div style={{ flex: 1, border: '1px solid #003300', padding: '10px', backgroundColor: 'rgba(0,10,0,0.5)', overflowY: isMobile ? 'visible' : 'auto' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#00aa00', textTransform: 'uppercase', fontSize: '0.8rem' }}>Geografía</h4>
                    <div style={{ fontSize: '0.8rem', color: '#005500' }}>
                        {REGION_BIOMES[selectedRegionId] ? (
                            <>
                                <div style={{ fontWeight: 'bold', color: '#00ff00', marginBottom: '2px' }}>
                                    {REGION_BIOMES[selectedRegionId].types.map(t => BIOME_DETAILS[t]?.label || t).join(' / ')}
                                </div>
                                <div style={{ marginBottom: '5px', lineHeight: '1.1' }}>{REGION_BIOMES[selectedRegionId].description}</div>
                                <div style={{ color: '#aaffaa', fontSize: '0.7rem' }}>
                                    {(() => {
                                        const data = REGION_BIOMES[selectedRegionId];
                                        let art = 0;
                                        let air = 0;
                                        let inf = 0;
                                        data.types.forEach(t => {
                                            const details = BIOME_DETAILS[t];
                                            if (details) {
                                                art += details.bonusArt;
                                                air += details.bonusAir;
                                                inf += details.bonusInf;
                                            }
                                        });
                                        const parts: string[] = [];
                                        if (art > 0) parts.push(`+ ${art} Def.vs Artillería`);
                                        if (air > 0) parts.push(`+ ${air} Def.vs Aéreo`);
                                        if (inf > 0) parts.push(`+ ${inf} Def.vs Infantería`);
                                        return parts.join(', ');
                                    })()}
                                </div>
                            </>
                        ) : (
                            "Desconocido"
                        )}
                    </div>
                </div>

                {/* Raw Materials Column */}
                <div style={{ flex: 1, border: '1px solid #003300', padding: '10px', backgroundColor: 'rgba(0,10,0,0.5)', overflowY: isMobile ? 'visible' : 'auto' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#00aa00', textTransform: 'uppercase', fontSize: '0.8rem' }}>Materia Prima</h4>
                    <div style={{ fontSize: '0.8rem', color: '#005500' }}>
                        {regionResources ? (() => {
                            const materials = Object.entries(regionResources.rawMaterials)
                                .filter(([_, countries]) => countries.includes(selectedRegionId));
                            if (materials.length === 0) {
                                return <div style={{ color: '#555' }}>Sin materias primas asignadas</div>;
                            }
                            return materials.map(([material]) => {
                                const matKey = material as RawMaterialType;
                                const matData = RAW_MATERIAL_DATA[matKey];
                                const tech = (Object.entries(TECHNOLOGY_REQUIREMENTS) as [TechnologyType, RawMaterialType][])
                                    .find(([_, req]) => req === matKey)?.[0];
                                const techData = tech ? TECHNOLOGY_DATA[tech] : null;
                                const supplyType = matData?.category;
                                const supplyLabel = supplyType === 'food' ? 'Alimentos' : supplyType === 'manufacture' ? 'Manufactura' : 'Energía';
                                return (
                                    <div key={material} style={{ marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#00ff00', marginBottom: '2px' }}>
                                            {matData?.name || material.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ lineHeight: '1.2', fontSize: '0.7rem' }}>
                                            {techData
                                                ? `Requiere: ${techData.name} | Produce: ${supplyLabel}`
                                                : matData?.description}
                                        </div>
                                    </div>
                                );
                            });
                        })() : null}
                    </div>
                </div>

                {/* Technologies Column */}
                <div style={{ flex: 1, border: '1px solid #003300', padding: '10px', backgroundColor: 'rgba(0,10,0,0.5)', overflowY: isMobile ? 'visible' : 'auto' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#00aa00', textTransform: 'uppercase', fontSize: '0.8rem' }}>Tecnología</h4>
                    <div style={{ fontSize: '0.8rem', color: '#005500' }}>
                        {regionResources ? (() => {
                            const techs = Object.entries(regionResources.technologies)
                                .filter(([_, countries]) => countries.includes(selectedRegionId));
                            if (techs.length === 0) {
                                return <div style={{ color: '#555' }}>Sin tecnologías asignadas</div>;
                            }
                            return techs.map(([tech]) => {
                                const techKey = tech as TechnologyType;
                                const techData = TECHNOLOGY_DATA[techKey];
                                const produces = TECHNOLOGY_PRODUCES[techKey];
                                const requires = TECHNOLOGY_REQUIREMENTS[techKey];
                                const reqData = RAW_MATERIAL_DATA[requires];
                                const supplyLabel = produces === 'food' ? 'Alimentos' : produces === 'manufacture' ? 'Manufactura' : 'Energía';
                                return (
                                    <div key={tech} style={{ marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#00ff00', marginBottom: '2px' }}>
                                            {techData?.name || tech.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ lineHeight: '1.2', fontSize: '0.7rem' }}>
                                            Requiere: {reqData?.name || requires.replace(/_/g, ' ')} | Produce: {supplyLabel}
                                        </div>
                                    </div>
                                );
                            });
                        })() : null}
                    </div>
                </div>

                {/* Specials Column */}
                <div style={{ flex: 1, border: '1px solid #003300', padding: '10px', backgroundColor: 'rgba(0,10,0,0.5)', overflowY: isMobile ? 'visible' : 'auto' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#00aa00', textTransform: 'uppercase', fontSize: '0.8rem' }}>Especiales</h4>
                    <div style={{ fontSize: '0.8rem', color: '#005500' }}>
                        {(() => {
                            const isNuclear = regionResources?.nuclearWarCapable.includes(selectedRegionId);
                            const hasExtracted = currentPlayer?.specialCards.some(c => c.type === 'SECRET_MINERAL');
                            const isSecret = currentPlayer?.secretMineralLocation === selectedRegionId && owners[selectedRegionId] === currentPlayer?.id && !hasExtracted;
                            const espionageCountries = ['nueva_york', 'reino_unido', 'china', 'rusia'];
                            const isEspionageHq = espionageCountries.includes(selectedRegionId);

                            const belongsToMe = owners[selectedRegionId] === currentPlayer?.id;

                            const specialBtnStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
                                width: '100%',
                                padding: '8px',
                                marginBottom: '5px',
                                backgroundColor: bg,
                                color: color,
                                border: `1px solid ${border}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            });

                            return (
                                <>
                                    {isMyTurn && (
                                        <>
                                            {isNuclear && (
                                                <button
                                                    onClick={() => onShowNuclearDesignInfo(selectedRegionId)}
                                                    style={specialBtnStyle('#1a0a00', '#ff9100', '#ff9100')}
                                                >
                                                    <span style={{ fontSize: '1.2rem' }}>☢️</span>
                                                    DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES
                                                </button>
                                            )}
                                            {isSecret && (
                                                <button
                                                    onClick={() => onShowMineralExtraction(selectedRegionId)}
                                                    style={specialBtnStyle('#001a1a', '#00ffff', '#00ffff')}
                                                >
                                                    EXTRAER MINERAL SECRETO
                                                </button>
                                            )}
                                            {isEspionageHq && (
                                                <button
                                                    onClick={() => onShowEspionageNetworkInfo(selectedRegionId)}
                                                    style={specialBtnStyle('#001122', '#00ffff', '#00ffff')}
                                                >
                                                    🕵️ RED DE ESPIONAJE
                                                </button>
                                            )}
                                            {belongsToMe && specialMissions
                                                .filter(m => m.visibleFor.includes(selectedRegionId) || m.visibleFor.includes('GLOBAL'))
                                                .map(mission => (
                                                    <button
                                                        key={mission.id}
                                                        onClick={() => onShowSpecialMissionInfo(mission.id)}
                                                        style={specialBtnStyle('#002200', '#00ff00', '#00ff00')}
                                                    >
                                                        {mission.title}
                                                    </button>
                                                ))}
                                        </>
                                    )}

                                    {!isNuclear && !isSecret && !isEspionageHq && (!belongsToMe || !specialMissions.some(m => m.visibleFor.includes(selectedRegionId) || m.visibleFor.includes('GLOBAL'))) && (
                                        <div style={{ color: '#555' }}>Sin habilidades especiales</div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Actions Column */}
                {isMyTurn && (
                    <div style={{ flex: isMobile ? 'none' : 1, border: '1px solid #003300', padding: '10px', backgroundColor: 'rgba(0,10,0,0.5)' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#aa0000', textTransform: 'uppercase', fontSize: '0.8rem' }}>Acciones</h4>
                        <button
                            onClick={onAttack}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: isMobile ? '1rem' : '1.2rem',
                                fontWeight: 'bold',
                                backgroundColor: '#330000',
                                color: '#ff0000',
                                border: '2px solid #ff0000',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                fontFamily: 'monospace',
                                boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)',
                                animation: 'pulse 2s infinite'
                            }}
                        >
                            ATACAR
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

};
