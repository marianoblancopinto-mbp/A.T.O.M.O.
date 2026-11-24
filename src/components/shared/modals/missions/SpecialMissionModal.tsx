import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { getSpecialMissions } from '../../../../data/missionData';
import { REGIONS } from '../../../../data/mapRegions';
import { useMyPlayer } from '../../../../hooks/useMyPlayer';
import { useGameActions } from '../../../../hooks/useGameActions';


// Specific Modals
import { AntarcticaMissionModal } from './AntarcticaMissionModal';
import { IstanbulMissionModal } from './IstanbulMissionModal';
import { GeothermalMissionModal } from './GeothermalMissionModal';
import { AndesMissionModal } from './AndesMissionModal';
import { NormandyMissionModal } from './NormandyMissionModal';
import { AlejandroMissionModal } from './AlejandroMissionModal';
import { LegadoOtomanoMissionModal } from './LegadoOtomanoMissionModal';
import { GengisKhanMissionModal } from './GengisKhanMissionModal';
import { BolivarMissionModal } from './BolivarMissionModal';
import { PacificFireMissionModal } from './PacificFireMissionModal';
import { WarSecretsModal } from './WarSecretsModal';
import { DesalinizacionMissionModal } from './DesalinizacionMissionModal';
import { AntarcticaInfoModal } from './AntarcticaInfoModal';
import { GoldenDomeInfoModal } from './GoldenDomeInfoModal';
import { GoldenDomeMissionModal } from './GoldenDomeMissionModal';


interface SpecialMissionModalProps {
    missionId: string;
    onClose: () => void;
    proxyWarCountryName: string;
    selectedRegionId: string | null;
    setShowInventory?: (show: boolean) => void;
    setInventoryPlayerIndex?: (idx: number) => void;
}


export const SpecialMissionModal: React.FC<SpecialMissionModalProps> = ({
    missionId,
    onClose,
    proxyWarCountryName,
    selectedRegionId,
    setShowInventory,
    setInventoryPlayerIndex
}) => {

    const { state } = useGameContext();
    const { players, owners } = state;
    const { myPlayerIndex } = useMyPlayer();
    const actions = useGameActions();
    const [showAntarcticaExecution, setShowAntarcticaExecution] = useState(false);
    const [showGoldenDomeExecution, setShowGoldenDomeExecution] = useState(false);

    const missions = getSpecialMissions(proxyWarCountryName);
    const mission = missions.find(m => m.id === missionId);

    if (!mission) return null;


    const player = players[myPlayerIndex];


    // 1. Check for Specialized Modals

    if (missionId === 'planta_desalinizacion') {
        const targetCountry = selectedRegionId || '';
        return (
            <DesalinizacionMissionModal
                show={true}
                targetCountry={targetCountry}
                REGIONS={REGIONS}
                onClose={onClose}
                onSuccess={onClose}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'energia_geotermica') {
        const targetCountry = selectedRegionId || '';
        return (
            <GeothermalMissionModal
                show={true}
                targetCountry={targetCountry}
                REGIONS={REGIONS}
                onClose={onClose}
                onSuccess={onClose}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'cruce_andes') {
        return (
            <AndesMissionModal
                show={true}
                player={player}
                currentPlayerIndex={myPlayerIndex}
                owners={owners}
                onClose={onClose}
                onComplete={(foodSupplyId) => {
                    actions.activateMission({ missionId: 'cruce_andes', supplyIds: [foodSupplyId] });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'desembarco_normandia') {
        return (
            <NormandyMissionModal
                show={true}
                onClose={onClose}
            />
        );
    }

    if (missionId === 'alejandro_magno') {
        return (
            <AlejandroMissionModal
                show={true}
                onClose={onClose}
                onSuccess={onClose}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'legado_otomano') {
        return (
            <LegadoOtomanoMissionModal
                show={true}
                onClose={onClose}
                onSuccess={onClose}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'gengis_khan') {
        return (
            <GengisKhanMissionModal
                show={true}
                onClose={onClose}
                onSuccess={onClose}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'bolivar') {
        return (
            <BolivarMissionModal
                show={true}
                onClose={onClose}
                onSuccess={onClose}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'fuego_del_pacifico') {
        return (
            <PacificFireMissionModal
                show={true}
                onClose={onClose}
                onSuccess={onClose}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(myPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'refundacion_estanbul') {
        return (
            <IstanbulMissionModal
                onClose={onClose}
                onSuccess={onClose}
            />
        );
    }

    if (missionId === 'ruta_antartica') {
        const hasControl = ['chile', 'argentina', 'australia', 'sudafrica'].every(id => owners[id] === player.id);

        if (!showAntarcticaExecution) {
            return (
                <AntarcticaInfoModal
                    onClose={onClose}
                    onContinue={() => setShowAntarcticaExecution(true)}
                    hasControl={hasControl}
                />
            );
        }

        return (
            <AntarcticaMissionModal
                onClose={onClose}
                onSuccess={onClose}
            />
        );
    }

    if (missionId === 'golden_dome') {
        const requiredRegions = ['nueva_york', 'california', 'texas', 'flordia', 'alaska'];
        const hasControl = requiredRegions.every(id => owners[id] === player.id);

        if (!showGoldenDomeExecution) {
            return (
                <GoldenDomeInfoModal
                    onClose={onClose}
                    onContinue={() => setShowGoldenDomeExecution(true)}
                    hasControl={hasControl}
                />
            );
        }

        return (
            <GoldenDomeMissionModal
                onClose={onClose}
                onSuccess={onClose}
            />
        );
    }

    if (missionId === 'secretos_guerra') {
        return (
            <WarSecretsModal
                onClose={onClose}
                proxyWarCountryName={proxyWarCountryName}
                onSuccess={onClose}
            />
        );
    }

    // Toda misión listada tiene su modal específico.
    return null;
};
