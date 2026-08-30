import { useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import { checkSupplyRoute } from '../data/mapData';

export const useSupplyRoute = () => {
    const { state } = useGameContext();
    const { players, owners } = state;

    const checkRoute = useCallback((startRegionId: string, endRegionId: string, playerIdx?: number | string) => {
        let player: typeof players[0] | undefined;
        let playerId: string | number;

        // Resolve Player
        if (playerIdx === undefined) {
            player = players[state.currentPlayerIndex];
        } else {
            // Check if playerIdx is an index (e.g. 0, 1) or an ID.
            // myPlayerIndex is passed from InventoryModal, but attacker.id from BattleSupplyModal.
            // Let's try to find by ID first (robust). If not found, fall back to index.
            player = players.find(p => String(p.id) === String(playerIdx));
            if (!player && typeof playerIdx === 'number') {
                player = players[playerIdx];
            }
        }

        if (!player) return false;
        playerId = player.id;

        const extraAdjacency: Record<string, string[]> = {};

        // Antarctic Route Activation logic
        const antarcticMission = player.activeSpecialMissions.find(m => m.id === 'ruta_antartica');
        if (antarcticMission) {
            const required = ['chile', 'argentina', 'australia', 'sudafrica'];
            // Use current owners from state
            const hasAllControl = required.every(id => owners[id] === playerId);

            if (hasAllControl) {
                if (!extraAdjacency['argentina']) extraAdjacency['argentina'] = [];
                if (!extraAdjacency['sudafrica']) extraAdjacency['sudafrica'] = [];
                if (!extraAdjacency['chile']) extraAdjacency['chile'] = [];
                if (!extraAdjacency['australia']) extraAdjacency['australia'] = [];

                extraAdjacency['argentina'].push('sudafrica');
                extraAdjacency['sudafrica'].push('argentina');
                extraAdjacency['chile'].push('australia');
                extraAdjacency['australia'].push('chile');
                extraAdjacency['sudafrica'].push('australia');
                extraAdjacency['australia'].push('sudafrica');
            }
        }

        // Bosphorus Bridge Logic
        const hasBridgeCard = player.specialCards.some(c => c.type === 'PUENTE_BOSFORO');
        if (hasBridgeCard) {
            const hasTurkey = owners['turquia'] === playerId;
            const hasGreece = owners['grecia'] === playerId;

            if (hasTurkey && hasGreece) {
                if (!extraAdjacency['turquia']) extraAdjacency['turquia'] = [];
                if (!extraAdjacency['grecia']) extraAdjacency['grecia'] = [];
                extraAdjacency['turquia'].push('grecia');
                extraAdjacency['grecia'].push('turquia');
            }
        }

        return checkSupplyRoute(
            startRegionId,
            endRegionId,
            playerId,
            owners,
            extraAdjacency
        );
    }, [players, owners, state.currentPlayerIndex]);

    return { checkRoute };
};
