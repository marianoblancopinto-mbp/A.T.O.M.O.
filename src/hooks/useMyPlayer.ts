/**
 * useMyPlayer Hook
 *
 * Designed to provide the "current user's" player data.
 * In the current local-multiplayer version, this returns the player whose turn it is
 * (or simply the first player if no turn logic is active yet).
 *
 * In the future (Supabase), this will return the player matching the logged-in User ID.
 */

import { useGameContext } from '../context/GameContext';
import { usePlayerResources } from './usePlayerResources';
import { useSupplyRoute } from './useSupplyRoute';
import type { PlayerData } from '../types/playerTypes';

interface MyPlayerHook {
    myPlayer: PlayerData | null;
    myPlayerIndex: number;
    isMyTurn: boolean;
    // Helper to get resources for "me"
    resources: ReturnType<typeof usePlayerResources>;
    // Helper to check routes for "me"
    checkRoute: (start: string, end: string) => boolean;
}

export const useMyPlayer = (): MyPlayerHook => {
    const { state, multiplayer } = useGameContext();
    const { players, currentPlayerIndex } = state;

    // Determine "My Player"
    // 1. If Multiplayer and playerId exists, find that player.
    // 2. If Local/Hotseat, use the Current Player (since they are the one acting).
    let myPlayerIndex = -1;

    if (multiplayer.connectionStatus === 'PLAYING' && multiplayer.playerId) {
        myPlayerIndex = players.findIndex(p => p.id === multiplayer.playerId);
    }

    // Fallback or Local Mode
    if (myPlayerIndex === -1) {
        myPlayerIndex = currentPlayerIndex;
    }

    const myPlayer = players[myPlayerIndex] || null;

    const resources = usePlayerResources(myPlayerIndex);
    const { checkRoute: checkRouteBase } = useSupplyRoute();

    const checkRoute = (start: string, end: string) => {
        return checkRouteBase(start, end, myPlayerIndex);
    };

    return {
        myPlayer,
        myPlayerIndex,
        isMyTurn: myPlayerIndex === currentPlayerIndex,
        resources,
        checkRoute
    };
};
