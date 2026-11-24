/**
 * useGameActions — atajos para mandar comandos al servidor.
 *
 * Ninguna de estas funciones modifica el estado local: mandan una intención y
 * el servidor responde con el estado nuevo (o con un rechazo y su motivo, que
 * se muestra en pantalla). Siempre actúan en nombre del jugador de ESTE cliente.
 */

import { useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import type { Treaty, TreatyClause } from '../types/treatyTypes';
import type { MissionInput } from '@atomo/shared';

export const useGameActions = () => {
    const { send } = useGameContext();

    return useMemo(() => ({
        // Preturno y turno
        produceSupply: (techId: string, rawId: string) => send({ type: 'PRODUCE_SUPPLY', techId, rawId }),
        setProductionReady: (ready: boolean) => send({ type: 'SET_PRODUCTION_READY', ready }),
        endTurn: () => send({ type: 'END_TURN' }),

        // Combate
        attack: (sourceId: string, targetId: string) => send({ type: 'ATTACK', sourceId, targetId }),
        playBattleCard: (cardId: string) => send({ type: 'BATTLE_PLAY_CARD', cardId }),
        nextBattleRound: () => send({ type: 'BATTLE_NEXT_ROUND' }),
        useBattleSupplies: (supplyIds: string[]) => send({ type: 'BATTLE_USE_SUPPLIES', supplyIds }),
        closeBattle: () => send({ type: 'BATTLE_CLOSE' }),

        // Misiones
        activateMission: (input: Omit<MissionInput, 'missionId'> & { missionId: string }) =>
            send({ type: 'ACTIVATE_MISSION', ...(input as any) }),

        // Nuclear
        generateNuclearDesign: (regionId: string, r: { techId: string; rawId: string }) =>
            send({ type: 'GENERATE_NUCLEAR_DESIGN', regionId, ...r }),
        extractSecretMineral: (regionId: string, r: { techId: string; ironId: string; waterId: string }) =>
            send({ type: 'EXTRACT_MINERAL', regionId, ...r }),
        constructSilo: (regionId: string, r: { techLightId: string; techHeavyId: string; techElecId: string; ironId: string; alumId: string; semiId: string }) =>
            send({ type: 'CONSTRUCT_SILO', regionId, ...r }),
        assignSiloFuel: (siloId: string, fuelCardId: string) => send({ type: 'ASSIGN_SILO_FUEL', siloId, fuelCardId }),
        initiateNuclearDeployment: (siloId: string) => send({ type: 'INITIATE_DEPLOYMENT', siloId }),
        setEndgameChoice: (choice: 'victory' | 'destruction') => send({ type: 'SET_ENDGAME_CHOICE', choice }),

        // Espionaje (el informe llega a `myPlayer.intelReports`, sólo a este jugador)
        createEspionageCard: (hqId: string, r: { techId: string; semiId: string }) =>
            send({ type: 'CREATE_ESPIONAGE_NETWORK', hqId, ...r }),
        executeEspionage: (targetPlayerId: string | number, infoType: 'silos' | 'mineral', cardId: string) =>
            send({ type: 'EXECUTE_ESPIONAGE', targetPlayerId, infoType, cardId }),

        // Tratados
        proposeTreaty: (targetPlayerId: string | number, clauses: TreatyClause[], treatyId?: string) =>
            send({ type: 'PROPOSE_TREATY', targetPlayerId, clauses, treatyId }),
        acceptTreaty: (treaty: Treaty) => send({ type: 'RESPOND_TREATY', treatyId: treaty.id, accept: true }),
        rejectTreaty: (treaty: Treaty) => send({ type: 'RESPOND_TREATY', treatyId: treaty.id, accept: false }),
        cancelTreaty: (treaty: Treaty) => send({ type: 'CANCEL_TREATY', treatyId: treaty.id }),

        // Anfitrión
        forceActionPhase: () => send({ type: 'FORCE_ACTION_PHASE' }),
        kickPlayer: (playerId: string | number) => send({ type: 'KICK_PLAYER', playerId }),
        endGame: () => send({ type: 'END_GAME' }),
    }), [send]);
};
