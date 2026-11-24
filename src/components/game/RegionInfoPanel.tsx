import React from 'react';
import { REGIONS } from '../../data/mapRegions';
import { RAW_MATERIAL_DATA, TECHNOLOGY_DATA, TECHNOLOGY_REQUIREMENTS, TECHNOLOGY_PRODUCES } from '../../data/productionData';
import { REGION_BIOMES, BIOME_DETAILS } from '../../data/biomeData';
import { useGameContext } from '../../context/GameContext';
import type { TechnologyType, RawMaterialType } from '../../types/productionTypes';
import type { SpecialMission } from '../../data/missionData';
import { Button } from '../../ui/components';

interface RegionInfoPanelProps {
    selectedRegionId: string;
    specialMissions: SpecialMission[];
    onClose: () => void;
    onAttack: () => void;
    onOpenNuclearDesign: (regionId: string) => void;
    onOpenMineralExtraction: (regionId: string) => void;
    onOpenEspionage: (regionId: string) => void;
    onOpenSpecialMission: (missionId: string) => void;
}

export const RegionInfoPanel: React.FC<RegionInfoPanelProps> = ({
    selectedRegionId,
    specialMissions,
    onClose,
    onAttack,
    onOpenNuclearDesign,
    onOpenMineralExtraction,
    onOpenEspionage,
    onOpenSpecialMission,
}) => {
    const { state, multiplayer } = useGameContext();
    const { players, currentPlayerIndex, owners, regionResources } = state;
    // Mis datos (el mineral secreto es privado: sólo llega el mío).
    const currentPlayer = players.find(p => String(p.id) === String(multiplayer.playerId));

    const isMyTurn = !!multiplayer.playerId && String(players[currentPlayerIndex]?.id) === String(multiplayer.playerId);


    const regionId = selectedRegionId;
    const owner = players.find(p => String(p.id) === String(owners[regionId]));
    const iOwnIt = !!currentPlayer && String(owners[regionId]) === String(currentPlayer.id);
    const biome = REGION_BIOMES[regionId];
    const terrain = biome ? biome.types.reduce((acc, t) => {
        const d = BIOME_DETAILS[t];
        return d ? { art: acc.art + d.bonusArt, air: acc.air + d.bonusAir, inf: acc.inf + d.bonusInf } : acc;
    }, { art: 0, air: 0, inf: 0 }) : null;
    const supplyName = (t?: string) => t === 'food' ? 'Alimentos' : t === 'manufacture' ? 'Manufactura' : 'Energía';
    const raws = regionResources ? Object.entries(regionResources.rawMaterials).filter(([, c]) => c.includes(regionId)) : [];
    const techs = regionResources ? Object.entries(regionResources.technologies).filter(([, c]) => c.includes(regionId)) : [];
    const isNuclear = !!regionResources?.nuclearWarCapable.includes(regionId);
    const isSecret = currentPlayer?.secretMineralLocation === regionId && iOwnIt && !currentPlayer?.specialCards.some(c => c.type === 'SECRET_MINERAL');
    const isEspionageHq = ['nueva_york', 'reino_unido', 'china', 'rusia'].includes(regionId);
    const missions = specialMissions.filter(m => m.visibleFor.includes(regionId) || m.visibleFor.includes('GLOBAL'));

    return (
        <section className="region-panel" aria-label="País seleccionado">
            <div className="region-panel__head">
                <h2 className="region-panel__title">{REGIONS.find(r => r.id === regionId)?.title}</h2>
                <span className="ui-badge" style={{ color: owner?.color ?? 'var(--muted)' }}>{owner ? (iOwnIt ? 'Tuyo' : owner.name) : 'Neutral'}</span>
                {isMyTurn && !iOwnIt && <Button size="sm" variant="primary" tone="danger" onClick={onAttack}>Atacar</Button>}
                <button type="button" className="ui-close" onClick={onClose} aria-label="Cerrar panel">✕</button>
            </div>
            <div className="region-panel__cols">
                <div className="region-panel__col">
                    <h4>Geografía</h4>
                    {biome ? <>
                        <div className="region-panel__name">{biome.types.map(t => BIOME_DETAILS[t]?.label || t).join(' / ')}</div>
                        <div className="region-panel__meta">{biome.description}</div>
                        {terrain && <div>{[terrain.art && `+${terrain.art} def. vs Artillería`, terrain.air && `+${terrain.air} def. vs Aéreo`, terrain.inf && `+${terrain.inf} def. vs Infantería`].filter(Boolean).join(' · ') || 'Sin bonus defensivo'}</div>}
                    </> : <span className="ui-muted">Desconocido</span>}
                </div>
                <div className="region-panel__col">
                    <h4>Materia prima</h4>
                    {raws.length === 0 ? <span className="ui-muted">Ninguna</span> : raws.map(([m]) => {
                        const data = RAW_MATERIAL_DATA[m as RawMaterialType];
                        const tech = (Object.entries(TECHNOLOGY_REQUIREMENTS) as [TechnologyType, RawMaterialType][]).find(([, r]) => r === m)?.[0];
                        return <div key={m}><div className="region-panel__name">{data?.name ?? m}</div>
                            <div className="region-panel__meta">{tech ? `Con ${TECHNOLOGY_DATA[tech].name} → ${supplyName(data?.category)}` : ''}</div></div>;
                    })}
                </div>
                <div className="region-panel__col">
                    <h4>Tecnología</h4>
                    {techs.length === 0 ? <span className="ui-muted">Ninguna</span> : techs.map(([t]) => {
                        const k = t as TechnologyType;
                        return <div key={t}><div className="region-panel__name">{TECHNOLOGY_DATA[k]?.name ?? t}</div>
                            <div className="region-panel__meta">Usa {RAW_MATERIAL_DATA[TECHNOLOGY_REQUIREMENTS[k]].name} → {supplyName(TECHNOLOGY_PRODUCES[k])}</div></div>;
                    })}
                </div>
                <div className="region-panel__col">
                    <h4>Operaciones</h4>
                    <div className="ui-stack">
                        {isNuclear && <Button size="sm" tone="nuclear" block onClick={() => onOpenNuclearDesign(regionId)}>☢ Diseño nuclear</Button>}
                        {isSecret && <Button size="sm" tone="nuclear" block onClick={() => onOpenMineralExtraction(regionId)}>Extraer mineral secreto</Button>}
                        {isEspionageHq && <Button size="sm" tone="intel" block onClick={() => onOpenEspionage(regionId)}>Red de espionaje</Button>}
                        {missions.map(m => <Button key={m.id} size="sm" tone={m.id === 'secretos_guerra' ? 'intel' : 'mission'} block onClick={() => onOpenSpecialMission(m.id)}>{m.title}</Button>)}
                        {!isNuclear && !isSecret && !isEspionageHq && missions.length === 0 && <span className="ui-muted">Sin operaciones especiales</span>}
                    </div>
                </div>
            </div>
        </section>
    );
};
