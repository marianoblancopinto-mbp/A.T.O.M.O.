import React, { useState } from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { getSpecialMissions } from '../../../../data/missionData';
import { REGIONS } from '../../../../data/mapRegions';
import type { SpecialCard } from '../../../../types/playerTypes';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';


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

// Generic Modal
import { GenericSpecialMissionModal } from './GenericSpecialMissionModal';

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

    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const [showAntarcticaExecution, setShowAntarcticaExecution] = useState(false);
    const [showGoldenDomeExecution, setShowGoldenDomeExecution] = useState(false);

    const missions = getSpecialMissions(proxyWarCountryName);
    const mission = missions.find(m => m.id === missionId);

    if (!mission) return null;

    const inventoryCards = usePlayerResources(currentPlayerIndex);

    const player = players[currentPlayerIndex];

    const handleNotifySuccess = (playerName: string, missionTitle: string) => {
        dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
                type: 'SECONDARY_MISSION',
                title: `${missionTitle} ESTABLECIDA`,
                message: 'Se ha asegurado el dominio del Océano Antártico. La ruta de suministros está operativa.',
                color: '#00ffff',
                playerName: playerName
            }
        });
    };

    // 1. Check for Specialized Modals

    if (missionId === 'planta_desalinizacion') {
        const targetCountry = selectedRegionId || '';
        return (
            <DesalinizacionMissionModal
                show={true}
                targetCountry={targetCountry}
                REGIONS={REGIONS}
                onClose={onClose}
                onSuccess={(countryName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            title: 'PLANTA DESALINIZADORA',
                            message: `Planta de desalinización construida en ${countryName}. Producción de AGUA DULCE iniciada.`,
                            color: '#00aaff',
                            playerName: player.name
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
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
                onSuccess={(countryName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            title: 'ENERGÍA GEOTÉRMICA',
                            message: `Planta geotérmica operativa en ${countryName}. Se ha generado 1 unidad de Energía.`,
                            color: '#ff4400',
                            playerName: player.name
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'cruce_andes') {
        return (
            <AndesMissionModal
                show={true}
                player={player}
                currentPlayerIndex={currentPlayerIndex}
                owners={owners}
                onClose={onClose}
                onComplete={(foodSupplyId) => {
                    // Logic from TegMap - Consume supply and grant card
                    const newFood = player.supplies.food.filter(s => s.id !== foodSupplyId);
                    const newCard: SpecialCard = {
                        id: `andes-card-${Date.now()}`,
                        type: 'CRUCE_ANDES', // TS should be happy now with explicit type
                        name: 'CRUCE DE LOS ANDES',
                        originCountry: 'argentina',
                        description: 'Bonus +1 Infantería atacando Chile (1 Turno).',
                        createdAt: Date.now()
                    };

                    dispatch({
                        type: 'UPDATE_PLAYER',
                        payload: {
                            index: currentPlayerIndex,
                            data: {
                                supplies: { ...player.supplies, food: newFood },
                                specialCards: [...player.specialCards, newCard]
                            }
                        }
                    });

                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            missionId: 'cruce_andes',
                            title: 'CRUCE DE LOS ANDES',
                            message: 'Los preparativos para CRUCE DE LOS ANDES ya están en marcha. Las tropas esperan sus ordenes.',
                            color: '#aaff00'
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
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
                playerIndex={currentPlayerIndex}
                onSuccess={(playerName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            missionId: 'alejandro_magno',
                            title: 'ALEJANDRO MAGNO',
                            message: 'El espíritu del conquistador macedonio renace. Las rutas hacia Oriente están abiertas. +1 Infantería atacando entre países involucrados.',
                            color: '#00aaff',
                            playerName: playerName
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'legado_otomano') {
        return (
            <LegadoOtomanoMissionModal
                show={true}
                onClose={onClose}
                playerIndex={currentPlayerIndex}
                onSuccess={(playerName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            missionId: 'legado_otomano',
                            title: 'LEGADO OTOMANO',
                            message: 'La gloria del imperio se restaura. +1 Infantería atacando entre países involucrados.',
                            color: '#00ccff',
                            playerName: playerName
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'gengis_khan') {
        return (
            <GengisKhanMissionModal
                show={true}
                onClose={onClose}
                playerIndex={currentPlayerIndex}
                onSuccess={(playerName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            missionId: 'gengis_khan',
                            title: 'RUGIDO DE GENGIS KHAN',
                            message: 'La horda ha sido movilizada. El terror de las estepas asegura tu dominio sobre Asia Central. +1 Infantería atacando entre países involucrados.',
                            color: '#ff4444',
                            playerName: playerName
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'bolivar') {
        return (
            <BolivarMissionModal
                show={true}
                onClose={onClose}
                playerIndex={currentPlayerIndex}
                onSuccess={(playerName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            missionId: 'bolivar',
                            title: 'OPERACIÓN BOLÍVAR',
                            message: 'El sueño del Libertador renace. La unión de los pueblos del Cono Norte asegura nuestra soberanía. +1 Infantería atacando entre países involucrados.',
                            color: '#ffcc00',
                            playerName: playerName
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'fuego_del_pacifico') {
        return (
            <PacificFireMissionModal
                show={true}
                onClose={onClose}
                playerIndex={currentPlayerIndex}
                onSuccess={(playerName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            missionId: 'fuego_del_pacifico',
                            title: 'FUEGO DEL PACÍFICO',
                            message: 'Dominio aéreo establecido. El Mar de Japón está bajo nuestra protección táctica. +1 Fuerza Aérea en países involucrados.',
                            color: '#00ffff',
                            playerName: playerName
                        }
                    });
                    onClose();
                }}
                onOpenInventory={() => {
                    setShowInventory?.(true);
                    setInventoryPlayerIndex?.(currentPlayerIndex);
                }}
            />
        );
    }

    if (missionId === 'refundacion_estanbul') {
        return (
            <IstanbulMissionModal
                onClose={onClose}
                onSuccess={(playerName, cityName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            title: 'BÓSFORO REUNIFICADO',
                            message: `Se ha establecido el Puente del Bósforo. La ciudad ha sido refundada como ${cityName} y Europa y Asia vuelven a estar conectadas.`,
                            color: '#ff9100',
                            playerName: playerName
                        }
                    });
                    onClose();
                }}
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
                onSuccess={(playerName) => {
                    handleNotifySuccess(playerName, 'RUTA ANTÁRTICA');
                    onClose();
                }}
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
                onSuccess={(playerName) => {
                    handleNotifySuccess(playerName, 'CÚPULA DORADA');
                    onClose();
                }}
            />
        );
    }

    if (missionId === 'secretos_guerra') {
        return (
            <WarSecretsModal
                onClose={onClose}
                proxyWarCountryName={proxyWarCountryName}
                onSuccess={(playerName, countryName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'ESPIONAJE',
                            title: 'SECRETOS REVELADOS',
                            message: `La operación ha sido un éxito. Hemos asegurado el control de los recursos ocultos en ${countryName}.`,
                            color: '#00ffff',
                            playerName: playerName
                        }
                    });
                    onClose();
                }}
            />
        );
    }

    // 2. Fallback to Generic Modal
    return (
        <GenericSpecialMissionModal
            mission={mission}
            onClose={onClose}
            inventoryCards={inventoryCards}

            onSuccess={(id, title) => {
                dispatch({
                    type: 'SET_NOTIFICATION',
                    payload: {
                        type: 'SECONDARY_MISSION',
                        missionId: id,
                        title: `OPERACIÓN ${title}`,
                        message: 'La operación ha sido iniciada. Se han consumido los recursos y la ruta de suministro está asegurada bajo su mando.',
                        color: '#00ff00',
                        playerName: player.name
                    }
                });
            }}
        />
    );
};
