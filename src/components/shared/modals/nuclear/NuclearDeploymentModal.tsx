import React from 'react';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { REGIONS } from '../../../../data/mapRegions';
import { RAW_MATERIAL_DATA } from '../../../../data/productionData';
import type { RawMaterialType } from '../../../../types/productionTypes';

interface NuclearDeploymentModalProps {
    show: boolean;
    onClose: () => void;
    selectedSiloId?: string | null;
    playerIndex?: number;
}

export const NuclearDeploymentModal: React.FC<NuclearDeploymentModalProps> = ({
    show,
    onClose,
    selectedSiloId,
    playerIndex
}) => {
    const { state, dispatch } = useGameContext();
    const { currentPlayerIndex: stateCurrentPlayerIndex, players } = state;
    const { checkRoute } = useSupplyRoute();
    const gameActions = useGameActions();

    if (!show) return null;

    const effectivePlayerIndex = playerIndex ?? stateCurrentPlayerIndex;
    const player = players[effectivePlayerIndex];
    if (!player) return null;

    const siloCard = selectedSiloId
        ? player.specialCards.find(c => c.name === 'SILO DE LANZAMIENTO' && c.originCountry === selectedSiloId)
        : player.specialCards.find(c => c.name === 'SILO DE LANZAMIENTO');
    const mineralCard = player.specialCards.find(c => c.name === 'MINERAL SECRETO');

    if (!siloCard || !mineralCard) return null;

    const siloRegionId = siloCard.originCountry;
    const mineralRegionId = mineralCard.originCountry;

    // Check if fuel card is assigned to this silo
    const assignedFuelCardId = player.siloFuelCards?.[siloRegionId];

    // Helper to find card in inventory OR production deck
    const getInventoryCard = (cardId: string) => {
        // Check player inventory first
        const fromInventory = player.inventory.rawMaterials.find(c => c.id === cardId) ||
            player.inventory.technologies.find(c => c.id === cardId);
        if (fromInventory) return fromInventory;

        // Also check production deck (territory-based resources)
        const { productionDeck } = state;
        if (productionDeck) {
            return productionDeck.rawMaterials.find(c => c.id === cardId) ||
                productionDeck.technologies.find(c => c.id === cardId);
        }
        return null;
    };

    const assignedFuelCard = assignedFuelCardId ? getInventoryCard(assignedFuelCardId) : null;

    // Requirement A: Route Mineral -> Silo
    const routeMineralToSilo = checkRoute(mineralRegionId, siloRegionId, effectivePlayerIndex);

    // Requirement B: Route Fuel Provider -> Silo
    const fuelRegionId = (assignedFuelCard as any)?.country;
    const routeFuelToSilo = fuelRegionId ? checkRoute(fuelRegionId, siloRegionId, effectivePlayerIndex) : false;

    // Requirement C: Fuel card assigned and not used
    const hasFuelCard = assignedFuelCard && !assignedFuelCard.usedThisTurn;

    const canInitiate = routeMineralToSilo && routeFuelToSilo && hasFuelCard;

    const handleInitiate = () => {
        // Detailed Validation for Private Toasts
        if (!assignedFuelCardId) {
            dispatch({
                type: 'SET_NOTIFICATION',
                payload: {
                    type: 'NUCLEAR_ALERT',
                    title: 'FALLO EN SECUENCIA DE LANZAMIENTO',
                    message: 'No se ha asignado combustible nuclear al silo.',
                    color: '#ff0000',
                    targetPlayerId: player.id
                }
            });
            return;
        }

        if (!routeMineralToSilo) {
            dispatch({
                type: 'SET_NOTIFICATION',
                payload: {
                    type: 'NUCLEAR_ALERT',
                    title: 'FALLO EN SECUENCIA DE LANZAMIENTO',
                    message: `Ruta de Mineral Secreto interrumpida hacia el Silo en ${REGIONS.find(r => r.id === siloRegionId)?.title}.`,
                    color: '#ff0000',
                    targetPlayerId: player.id
                }
            });
            return;
        }

        if (!routeFuelToSilo) {
            dispatch({
                type: 'SET_NOTIFICATION',
                payload: {
                    type: 'NUCLEAR_ALERT',
                    title: 'FALLO EN SECUENCIA DE LANZAMIENTO',
                    message: `Ruta de Combustible interrumpida desde ${REGIONS.find(r => r.id === fuelRegionId)?.title} hacia el Silo.`,
                    color: '#ff0000',
                    targetPlayerId: player.id
                }
            });
            return;
        }

        if (assignedFuelCard && assignedFuelCard.usedThisTurn) {
            dispatch({
                type: 'SET_NOTIFICATION',
                payload: {
                    type: 'NUCLEAR_ALERT',
                    title: 'SISTEMA BLOQUEADO',
                    message: 'El combustible nuclear ya ha sido consumido este turno.',
                    color: '#ff9900',
                    targetPlayerId: player.id
                }
            });
            return;
        }

        const isSiloAlreadyUsed = player.usedNuclearSilos?.includes(siloRegionId);
        if (isSiloAlreadyUsed) {
            dispatch({
                type: 'SET_NOTIFICATION',
                payload: {
                    type: 'NUCLEAR_ALERT',
                    title: 'SILO AGOTADO',
                    message: `Este silo ya ha realizado un lanzamiento en el turno actual. Solo se permite un ataque por país por turno.`,
                    color: '#ff4400',
                    targetPlayerId: player.id
                }
            });
            return;
        }

        if (!canInitiate) return;

        gameActions.initiateNuclearDeployment(assignedFuelCardId, siloRegionId, effectivePlayerIndex);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.98)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#1a0000',
                border: '3px solid #ff0000',
                padding: '30px',
                width: '600px',
                boxShadow: '0 0 50px rgba(255, 0, 0, 0.6)',
                borderRadius: '8px'
            }}>
                <h2 style={{ color: '#ff0000', textAlign: 'center', margin: '0 0 20px 0', fontSize: '1.5rem' }}>☢️ PROTOCOLO DE DESPLIEGUE FINAL ☢️</h2>

                <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #444', marginBottom: '20px', borderRadius: '4px' }}>
                    <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '10px' }}>VALIDACIÓN DE SISTEMAS:</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: routeMineralToSilo ? '#00ff00' : '#ff4444', marginBottom: '10px' }}>
                        <span>[SUMINISTRO] MINERAL &gt; SILO</span>
                        <span>{routeMineralToSilo ? 'ESTABLECIDA' : 'INTERRUMPIDA'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: routeFuelToSilo ? '#00ff00' : '#ff4444', marginBottom: '10px' }}>
                        <span>[SUMINISTRO] COMBUSTIBLE &gt; SILO</span>
                        <span>{routeFuelToSilo ? 'ESTABLECIDA' : 'INTERRUMPIDA'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: hasFuelCard ? '#00ff00' : '#ff4444', marginTop: '15px' }}>
                        <span>[COMBUSTIBLE] STATUS</span>
                        <span>{hasFuelCard ? 'DISPONIBLE' : (assignedFuelCard?.usedThisTurn ? 'AGOTADO' : 'NO ASIGNADO')}</span>
                    </div>

                    {assignedFuelCard && (
                        <div style={{ color: hasFuelCard ? '#00ff00' : '#ff9900', fontSize: '0.75rem', marginTop: '10px', padding: '8px', backgroundColor: '#001100', borderRadius: '4px', border: '1px solid #003300' }}>
                            Combustible: {RAW_MATERIAL_DATA[assignedFuelCard.type as RawMaterialType]?.name || assignedFuelCard.type} ({REGIONS.find(r => r.id === fuelRegionId)?.title})
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#444',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            flex: 1
                        }}
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleInitiate}
                        style={{
                            backgroundColor: canInitiate ? '#ff0000' : '#330000',
                            color: canInitiate ? '#fff' : '#888',
                            border: 'none',
                            padding: '10px 20px',
                            cursor: 'pointer', // Keep pointer to allow clicking and seeing error toast
                            boxShadow: canInitiate ? '0 0 20px rgba(255, 0, 0, 0.4)' : 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        INICIAR DESPLIEGUE
                    </button>
                </div>
            </div>
        </div>
    );
};
