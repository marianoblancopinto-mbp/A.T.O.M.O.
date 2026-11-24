import { useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import { hasRoute } from '@atomo/shared';

/**
 * Chequeo de rutas de suministro para la UI (sólo para mostrar qué cartas son
 * elegibles). La validación real la hace el servidor con la MISMA función.
 */
export const useSupplyRoute = () => {
    const { state } = useGameContext();

    const checkRoute = useCallback((startRegionId: string, endRegionId: string, playerIdx?: number | string) => {
        const player = typeof playerIdx === 'number'
            ? state.players[playerIdx]
            : state.players.find(p => String(p.id) === String(playerIdx));
        if (!player || !startRegionId || !endRegionId) return false;
        return hasRoute(state, player.id, startRegionId, endRegionId);
    }, [state]);

    return { checkRoute };
};
