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
        } else if (typeof playerIdx === 'number') {
            player = players[playerIdx];
        } else {
            // It's a string ID
            player = players.find(p => p.id === playerIdx);
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
