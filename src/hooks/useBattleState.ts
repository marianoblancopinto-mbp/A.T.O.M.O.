import { useState } from 'react';
import type { PlayerData } from '../types/playerTypes';
import { validAttackSources } from '@atomo/shared';
import { useGameContext } from '../context/GameContext';
import { useGameActions } from './useGameActions';

interface UseBattleStateProps {
    selectedRegionId: string | null;
    setConquestData: React.Dispatch<React.SetStateAction<{ player: PlayerData, regionName: string } | null>>;
    showTurnOverlay: boolean;
    conquestData: any;
}

/**
 * Selección de ataque en la UI. Los orígenes posibles se calculan con la MISMA
 * función que usa el servidor, pero sólo para mostrar opciones: el servidor
 * vuelve a validar, baraja el mazo, reparte las manos y arma la batalla.
 */
export const useBattleState = ({ selectedRegionId, showTurnOverlay, conquestData }: UseBattleStateProps) => {
    const { state, multiplayer } = useGameContext();
    const actions = useGameActions();
    const { gameStarted, battleState, players, currentPlayerIndex, owners } = state;

    const [attackSourceSelection, setAttackSourceSelection] = useState<{
        targetId: string;
        validSources: string[];
    } | null>(null);

    const handleAttackClick = () => {
        if (!selectedRegionId || !gameStarted || showTurnOverlay || conquestData) return;
        const myId = multiplayer.playerId;
        if (!myId || String(players[currentPlayerIndex]?.id) !== String(myId)) {
            alert('Sólo podés atacar en tu turno.');
            return;
        }
        if (String(owners[selectedRegionId]) === String(myId)) {
            alert('No puedes atacar tu propio territorio.');
            return;
        }
        const validSources = validAttackSources(state, myId, selectedRegionId);
        if (validSources.length === 0) {
            alert('No tienes territorios limítrofes disponibles para atacar (o están restringidos por Tratados de No Agresión).');
            return;
        }
        setAttackSourceSelection({ targetId: selectedRegionId, validSources });
    };

    const confirmAttackSource = (sourceId: string) => {
        if (!attackSourceSelection) return;
        actions.attack(sourceId, attackSourceSelection.targetId);
        setAttackSourceSelection(null);
    };

    return {
        battleState,
        attackSourceSelection,
        setAttackSourceSelection,
        usedAttackSources: state.usedAttackSources,
        handleAttackClick,
        confirmAttackSource,
    };
};
