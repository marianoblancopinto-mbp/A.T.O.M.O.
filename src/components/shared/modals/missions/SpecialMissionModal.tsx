import React from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { getSpecialMissions } from '../../../../data/missionData';
import type { TerritoryCard } from '../../../../types/productionTypes';
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
import { WarSecretsModal } from './WarSecretsModal';
import { DesalinizacionMissionModal } from './DesalinizacionMissionModal';

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

    const missions = getSpecialMissions(proxyWarCountryName);
    const mission = missions.find(m => m.id === missionId);

    if (!mission) return null;

    if (!mission) return null;

    const inventoryCards = usePlayerResources(currentPlayerIndex);

    const player = players[currentPlayerIndex];

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

    if (missionId === 'refundacion_estanbul') {
        return (
            <IstanbulMissionModal
                onClose={onClose}
                onSuccess={(playerName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            title: 'BÓSFORO REUNIFICADO',
                            message: 'Se ha construido el Gran Puente. Europa y Asia vuelven a estar conectadas bajo tu estandarte.',
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
        return (
            <AntarcticaMissionModal
                onClose={onClose}
                onSuccess={(playerName) => {
                    dispatch({
                        type: 'SET_NOTIFICATION',
                        payload: {
                            type: 'SECONDARY_MISSION',
                            title: 'RUTA ANTÁRTICA ESTABLECIDA',
                            message: 'Se ha asegurado el dominio del Océano Antártico. La ruta de suministros está operativa.',
                            color: '#00ffff',
                            playerName: playerName
                        }
                    });
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

            onSuccess={(id, title, baseId) => {
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
