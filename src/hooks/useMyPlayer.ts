/**
 * useMyPlayer — el jugador de ESTE cliente (según el asiento que asignó el
 * servidor), que no tiene por qué ser el jugador de turno.
 */

import { useGameContext } from '../context/GameContext';
import { usePlayerResources } from './usePlayerResources';
import { useSupplyRoute } from './useSupplyRoute';
import type { PlayerData } from '../types/playerTypes';

interface MyPlayerHook {
    myPlayer: PlayerData | null;
    /** -1 si este cliente es espectador. */
    myPlayerIndex: number;
    isMyTurn: boolean;
    resources: ReturnType<typeof usePlayerResources>;
    checkRoute: (start: string, end: string) => boolean;
}

export const useMyPlayer = (): MyPlayerHook => {
    const { state, multiplayer } = useGameContext();
    const myPlayerIndex = multiplayer.playerId
        ? state.players.findIndex(p => String(p.id) === String(multiplayer.playerId))
        : -1;
    const myPlayer = state.players[myPlayerIndex] ?? null;
    const resources = usePlayerResources(myPlayerIndex);
    const { checkRoute: checkRouteBase } = useSupplyRoute();

    return {
        myPlayer,
        myPlayerIndex,
        isMyTurn: myPlayerIndex !== -1 && myPlayerIndex === state.currentPlayerIndex,
        resources,
        checkRoute: (start, end) => checkRouteBase(start, end, myPlayerIndex),
    };
};
