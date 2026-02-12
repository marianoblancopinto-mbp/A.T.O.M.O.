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
}

export const NuclearDeploymentModal: React.FC<NuclearDeploymentModalProps> = ({
    show,
    onClose,
    selectedSiloId
}) => {
    const { state } = useGameContext();
    const { currentPlayerIndex, players } = state;
    const { checkRoute } = useSupplyRoute();

    if (!show) return null;

    const player = players[currentPlayerIndex];
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
    const routeMineralToSilo = checkRoute(mineralRegionId, siloRegionId, currentPlayerIndex);

    // Requirement B: Fuel card assigned and not used
    const hasFuelCard = assignedFuelCard && !assignedFuelCard.usedThisTurn;

    const canInitiate = routeMineralToSilo && hasFuelCard;

    const gameActions = useGameActions();

    const handleInitiate = () => {
        if (!canInitiate || !assignedFuelCardId) return;

        gameActions.initiateNuclearDeployment(assignedFuelCardId);

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
                    <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>VALIDACIÓN DE REQUISITOS:</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: routeMineralToSilo ? '#00ff00' : '#ff4444', marginBottom: '10px' }}>
                        <span>[RUTA] MINERAL SECRETO &gt; SILO</span>
                        <span>{routeMineralToSilo ? 'ESTABLECIDA' : 'INTERRUMPIDA'}</span>
                    </div>
                    {!routeMineralToSilo && (
                        <div style={{ color: '#ff4444', fontSize: '0.7rem', marginBottom: '10px' }}>
                            * No hay conexión de territorios propios entre {REGIONS.find(r => r.id === mineralRegionId)?.title} y {REGIONS.find(r => r.id === siloRegionId)?.title}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: hasFuelCard ? '#00ff00' : '#ff4444', marginTop: '15px' }}>
                        <span>[COMBUSTIBLE] NUCLEAR ASIGNADO</span>
                        <span>{hasFuelCard ? 'DISPONIBLE' : 'NO ASIGNADO'}</span>
                    </div>
                    {!hasFuelCard && (
                        <div style={{ color: '#ff4444', fontSize: '0.7rem', marginTop: '5px' }}>
                            * Usa el botón "SELECCIONAR COMBUSTIBLE" en el silo para asignar combustible nuclear.
                        </div>
                    )}
                    {hasFuelCard && assignedFuelCard && (
                        <div style={{ color: '#00ff00', fontSize: '0.75rem', marginTop: '5px', padding: '8px', backgroundColor: '#001100', borderRadius: '4px' }}>
                            Combustible asignado: {RAW_MATERIAL_DATA[assignedFuelCard.type as RawMaterialType]?.name || assignedFuelCard.type}
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
                        disabled={!canInitiate}
                        style={{
                            backgroundColor: canInitiate ? '#ff0000' : '#550000',
                            color: canInitiate ? '#fff' : '#666',
                            border: 'none',
                            padding: '10px 20px',
                            cursor: canInitiate ? 'pointer' : 'not-allowed',
                            boxShadow: canInitiate ? '0 0 20px rgba(255, 0, 0, 0.4)' : 'none'
                        }}
                    >
                        INICIAR DESPLIEGUE
                    </button>
                </div>
            </div>
        </div>
    );
};
