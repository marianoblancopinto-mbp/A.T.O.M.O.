/**
 * GameActions Service
 * 
 * Centralizes game action logic to decouple UI from state mutations.
 * This prepares the codebase for multiplayer integration where actions
 * will be sent to a database instead of modifying local state.
 */

import type { PlayerData, SpecialCard } from '../types/playerTypes';
import type { ProductionDeck, SupplyItem } from '../types/productionTypes';

// --- Types ---

export interface GameActionDependencies {
    // State
    players: PlayerData[];
    productionDeck: ProductionDeck | null;
    currentPlayerIndex: number;
    owners: Record<string, number | null>;

    // Setters
    setPlayers: React.Dispatch<React.SetStateAction<PlayerData[]>>;
    setProductionDeck: React.Dispatch<React.SetStateAction<ProductionDeck | null>>;
}

export interface GameActions {
    markCardAsUsed: (cardId: string, category: 'technology' | 'rawMaterial') => void;
    addSpecialCardToPlayer: (playerIndex: number, card: SpecialCard) => void;
    addSupplyToPlayer: (playerIndex: number, supply: SupplyItem) => void;
    updatePlayerField: <K extends keyof PlayerData>(playerIndex: number, field: K, value: PlayerData[K]) => void;
}

// --- Implementation ---

export const createGameActions = (deps: GameActionDependencies): GameActions => {
    const { setPlayers, setProductionDeck } = deps;

    /**
     * Mark a card as used this turn (prevents reuse until turn ends)
     */
    const markCardAsUsed = (cardId: string, category: 'technology' | 'rawMaterial') => {
        setProductionDeck(prev => {
            if (!prev) return null;
            if (category === 'technology') {
                return {
                    ...prev,
                    technologies: prev.technologies.map(card =>
                        card.id === cardId ? { ...card, usedThisTurn: true } : card),
                };
            } else {
                return {
                    ...prev,
                    rawMaterials: prev.rawMaterials.map(card =>
                        card.id === cardId ? { ...card, usedThisTurn: true } : card),
                };
            }
        });
    };

    /**
     * Add a special card to a player's collection
     */
    const addSpecialCardToPlayer = (playerIndex: number, card: SpecialCard) => {
        setPlayers(prev => prev.map(p => {
            if (p.id === playerIndex) {
                return { ...p, specialCards: [...p.specialCards, card] };
            }
            return p;
        }));
    };

    /**
     * Add a supply item to a player's inventory
     */
    const addSupplyToPlayer = (playerIndex: number, supply: SupplyItem) => {
        setPlayers(prev => prev.map(p => {
            if (p.id === playerIndex) {
                const supplyType = supply.type;
                return {
                    ...p,
                    supplies: {
                        ...p.supplies,
                        [supplyType]: [...p.supplies[supplyType], supply]
                    }
                };
            }
            return p;
        }));
    };

    /**
     * Generic field updater for player data
     */
    const updatePlayerField = <K extends keyof PlayerData>(
        playerIndex: number,
        field: K,
        value: PlayerData[K]
    ) => {
        setPlayers(prev => prev.map(p => {
            if (p.id === playerIndex) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    return {
        markCardAsUsed,
        addSpecialCardToPlayer,
        addSupplyToPlayer,
        updatePlayerField,
    };
};
