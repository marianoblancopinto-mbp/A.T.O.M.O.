import { useState } from 'react';
import type { Card, Regiment, Tier } from '../types/gameTypes';
import type { PlayerData, SpecialCard } from '../types/playerTypes';
import { REGIONS } from '../data/mapRegions';
import { MARITIME_ROUTES, REGION_ADJACENCY, isMaritimeConnection } from '../data/mapData';
import { calculateRegionBonuses } from '../data/biomeData';
import { useGameContext } from '../context/GameContext';
import { useGameActions } from './useGameActions';
// BattleState is now global in types/gameTypes.ts

interface UseBattleStateProps {
    // Only UI-specific props remain
    selectedRegionId: string | null;
    setConquestData: React.Dispatch<React.SetStateAction<{ player: PlayerData, regionName: string } | null>>;
    showTurnOverlay: boolean;
    conquestData: any;
}

export const useBattleState = ({
    selectedRegionId,
    setConquestData,
    showTurnOverlay,
    conquestData
}: UseBattleStateProps) => {
    const { state, dispatch } = useGameContext();
    const { players, owners, currentPlayerIndex, gameStarted, battleState } = state;

    // Local UI state for source selection (attacker only)
    const [attackSourceSelection, setAttackSourceSelection] = useState<{
        targetId: string;
        validSources: string[];
    } | null>(null);

    const generateDeck = (): Card[] => {
        const deck: Card[] = [];
        const regiments: Regiment[] = ['A', 'B', 'C'];
        const tiers: Tier[] = [1, 2, 3, 4];

        let idCounter = 0;
        regiments.forEach(reg => {
            tiers.forEach(tier => {
                for (let i = 0; i < 5; i++) {
                    deck.push({
                        id: `card-${idCounter++}`,
                        regiment: reg,
                        tier: tier,
                        variant: i
                    });
                }
            });
        });
        return deck;
    };

    const shuffleDeck = (deck: Card[]) => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    };

    const handleAttackClick = () => {
        if (!selectedRegionId) return;
        if (!gameStarted || showTurnOverlay || conquestData) return;

        // Validation: Cannot attack own territory
        // Check ownership robustly (owners map can store index (number) or ID (string))
        const ownerValue = owners[selectedRegionId];
        const currentPlayer = players[currentPlayerIndex];

        let isOwnedByCurrentPlayer = false;
        if (typeof ownerValue === 'number') {
            isOwnedByCurrentPlayer = ownerValue === currentPlayerIndex;
        } else if (typeof ownerValue === 'string') {
            isOwnedByCurrentPlayer = ownerValue === currentPlayer.id;
        }

        if (isOwnedByCurrentPlayer) {
            alert("No puedes atacar tu propio territorio.");
            return;
        }

        // Get Neighbors from Adjacency Map
        const allNeighbors = [...(REGION_ADJACENCY[selectedRegionId] || [])];

        // Also check Maritime Routes explicitly if not in Adjacency (to be safe)
        // Add any maritime partner
        MARITIME_ROUTES.forEach(pair => {
            if (pair[0] === selectedRegionId && !allNeighbors.includes(pair[1])) allNeighbors.push(pair[1]);
            if (pair[1] === selectedRegionId && !allNeighbors.includes(pair[0])) allNeighbors.push(pair[0]);
        });

        // Check Wraparound
        if (selectedRegionId === 'alaska' && !allNeighbors.includes('kamchakta')) allNeighbors.push('kamchakta');
        if (selectedRegionId === 'kamchakta' && !allNeighbors.includes('alaska')) allNeighbors.push('alaska');
        if (selectedRegionId === 'chile' && !allNeighbors.includes('australia')) allNeighbors.push('australia');
        if (selectedRegionId === 'australia' && !allNeighbors.includes('chile')) allNeighbors.push('chile');

        // Alejandro Magno & Legado Otomano Connections: Greece <-> Turkey
        const hasAlejandro = currentPlayer?.specialCards.some((c: SpecialCard) => c.type === 'ALEJANDRO_MAGNO');
        const hasOtomano = currentPlayer?.specialCards.some((c: SpecialCard) => c.type === 'LEGADO_OTOMANO');
        if (hasAlejandro || hasOtomano) {
            if (selectedRegionId === 'grecia' && !allNeighbors.includes('turquia')) allNeighbors.push('turquia');
            if (selectedRegionId === 'turquia' && !allNeighbors.includes('grecia')) allNeighbors.push('grecia');
        }

        // Valid sources: Adjacent regions owned by current player AND not already used this turn
        const currentPlayerId = players[currentPlayerIndex]?.id;
        const validSources = allNeighbors.filter(id =>
            owners[id] === currentPlayerId &&
            !state.usedAttackSources.includes(id)
        );

        // --- TREATY: NON-AGGRESSION CHECK ---
        // Filter out sources that are restricted by active treaties
        const defenderId = owners[selectedRegionId];
        let finalValidSources = validSources;

        if (defenderId) {
            const activeTreaties = state.treaties.filter(t => t.status === 'ACTIVE');

            // Find clauses where I promised NOT to attack the defender
            const restrictedRegions = new Set<string>();

            activeTreaties.forEach(treaty => {
                treaty.clauses.forEach(clause => {
                    if (clause.type === 'NON_AGGRESSION' &&
                        clause.sourcePlayerId === currentPlayerId &&
                        clause.targetPlayerId === defenderId) {

                        if (clause.data.regionIds) {
                            clause.data.regionIds.forEach(rid => restrictedRegions.add(rid));
                        }
                    }
                });
            });

            if (restrictedRegions.size > 0) {
                finalValidSources = validSources.filter(sourceId => !restrictedRegions.has(sourceId));
            }
        }

        if (finalValidSources.length === 0) {
            alert("No tienes territorios limítrofes disponibles para atacar (o están restringidos por Tratados de No Agresión).");
            return;
        }

        setAttackSourceSelection({
            targetId: selectedRegionId,
            validSources: finalValidSources
        });
    };

    const confirmAttackSource = (sourceId: string) => {
        if (!attackSourceSelection) return;
        const targetId = attackSourceSelection.targetId;

        // Detect Maritime
        const isMaritime = isMaritimeConnection(sourceId, targetId);

        const player = players[currentPlayerIndex];
        const isAndesCrossing = player.crossingAndesActive && sourceId === 'argentina' && targetId === 'chile';
        const isNormandy = player.normandyLandingActive && sourceId === 'reino_unido' && targetId === 'francia';

        // Alejandro Magno Bonus Check
        const involvedCountries = ['grecia', 'turquia', 'egipto', 'iran'];
        const isAlejandroBonus = player.specialCards.some(c => c.type === 'ALEJANDRO_MAGNO') &&
            involvedCountries.includes(sourceId) &&
            involvedCountries.includes(targetId);

        const involvedOtomano = ['turquia', 'egipto', 'arabia', 'grecia'];
        const isOtomanoBonus = player.specialCards.some(c => c.type === 'LEGADO_OTOMANO') &&
            involvedOtomano.includes(sourceId) &&
            involvedOtomano.includes(targetId);

        const involvedGengis = ['mongolia', 'kazajistan', 'china', 'rusia'];
        const isGengisBonus = player.specialCards.some(c => c.type === 'GENGIS_KHAN') &&
            involvedGengis.includes(sourceId) &&
            involvedGengis.includes(targetId);

        const involvedBolivar = ['venezuela', 'colombia', 'panama', 'peru'];
        const isBolivarBonus = player.specialCards.some(c => c.type === 'BOLIVAR') &&
            involvedBolivar.includes(sourceId) &&
            involvedBolivar.includes(targetId);

        const involvedPacific = ['japon', 'korea', 'kamchakta', 'filipinas'];
        const isPacificFireBonus = player.specialCards.some(c => c.type === 'PACIFIC_FIRE') &&
            involvedPacific.includes(sourceId) &&
            involvedPacific.includes(targetId);

        const involvedGoldenDome = ['nueva_york', 'california', 'texas', 'flordia', 'alaska'];
        const isGoldenDomeBonus = involvedGoldenDome.includes(targetId) &&
            players.find(p => p.id === owners[targetId])?.activeSpecialMissions.some(m => m.id === 'golden_dome');


        const attackerBonuses = {
            art: (isMaritime ? 1 : 0) + (isNormandy ? 1 : 0),
            inf: (isMaritime ? -1 : 0) + (isAndesCrossing ? 1 : 0) + (isNormandy ? (isMaritime ? 2 : 1) : 0) + (isAlejandroBonus ? 1 : 0) + (isOtomanoBonus ? 1 : 0) + (isGengisBonus ? 1 : 0) + (isBolivarBonus ? 1 : 0),
            isMaritime,
            isAndesCrossing,
            isNormandy,
            isAlejandroBonus,
            isOtomanoBonus,
            isGengisBonus,
            isBolivarBonus,
            isPacificFireBonus
        };

        const regionBonuses = calculateRegionBonuses(targetId);
        const defenderBonuses = {
            ...regionBonuses,
            air: regionBonuses.air + (isGoldenDomeBonus ? 1 : 0),
            isGoldenDomeBonus
        };

        const defenderId = owners[targetId];
        console.log('[confirmAttackSource] defenderId for', targetId, 'is', defenderId);

        if (defenderId === undefined || defenderId === null) {
            console.error('[confirmAttackSource] Defender ID not found!');
            return;
        }

        const defender = players.find(p => String(p.id) === String(defenderId));
        if (!defender) {
            // Try comparing numbers if strings failed
            console.error('[confirmAttackSource] Defender player not found for ID:', defenderId);
            console.log('Available players:', players.map(p => p.id));
            return;
        }

        console.log('[confirmAttackSource] Defender found:', defender.name);

        // Generate Decks
        const deck = shuffleDeck(generateDeck());
        const attHand: Card[] = [];
        const defHand: Card[] = [];
        for (let i = 0; i < 5; i++) attHand.push(deck.pop()!);
        for (let i = 0; i < 5; i++) defHand.push(deck.pop()!);

        console.log('[confirmAttackSource] Dispatching INIT_BATTLE');
        // Dispatch Global Action
        dispatch({
            type: 'INIT_BATTLE',
            payload: {
                isActive: true,
                attacker: players[currentPlayerIndex],
                defender: defender,
                attackerHand: attHand,
                defenderHand: defHand,
                attackerBonuses,
                defenderBonuses,
                attackSourceId: sourceId,
                targetRegionId: targetId,
                deck, // Store remaining deck,

                // Initialize Sync Fields
                phase: 'ATTACKER_SELECTION',
                currentAttackerCard: null,
                currentDefenderCard: null,
                clashResult: null,
                roundCount: 0,
                attackerWins: 0,
                defenderWins: 0
            }
        });

        setAttackSourceSelection(null);
    };

    const gameActions = useGameActions();

    const handleBattleEnd = (winner: 'attacker' | 'defender') => {
        if (!battleState || !selectedRegionId) return;

        // Execute Game Logic (Global State)
        gameActions.resolveBattle(battleState, winner);

        // Handle Local UI (Conquest Overlay)
        if (winner === 'attacker') {
            const region = REGIONS.find(r => r.id === selectedRegionId);
            if (region) {
                setConquestData({
                    player: players[currentPlayerIndex],
                    regionName: region.title,
                });

                // Dispatch Global Conquest Toast
                dispatch({
                    type: 'SET_NOTIFICATION',
                    payload: {
                        type: 'CONQUEST',
                        title: 'TERRITORIO CONQUISTADO',
                        message: `El Comandante ${players[currentPlayerIndex].name} ha tomado el control de ${region.title}.`,
                        color: players[currentPlayerIndex].color,
                        playerName: players[currentPlayerIndex].name
                    }
                });
            }
        }

        // No need to update local usedAttackSources here as it's handled in INIT_BATTLE globally

        // Close Battle
        // Dispatch END_BATTLE
        dispatch({ type: 'END_BATTLE' });
    };

    return {
        battleState,
        attackSourceSelection,
        setAttackSourceSelection,
        usedAttackSources: state.usedAttackSources,
        handleAttackClick,
        confirmAttackSource,
        handleBattleEnd
    };
};
