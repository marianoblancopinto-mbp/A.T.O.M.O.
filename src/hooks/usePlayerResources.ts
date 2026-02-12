
import { useGameContext } from '../context/GameContext';
import type { TerritoryCard } from '../types/productionTypes';

export const usePlayerResources = (playerIndex: number) => {
    const { state } = useGameContext();
    const { players, owners, productionDeck } = state;
    const player = players[playerIndex];

    if (!player) {
        return {
            technologies: [],
            rawMaterials: []
        };
    }

    const playerId = player.id;

    // 1. Get cards from owned territories (Passive Production)
    const ownedTerritoryIds = Object.entries(owners)
        .filter(([_, ownerId]) => ownerId === playerId)
        .map(([regionId]) => regionId);

    const territoryTechs = productionDeck?.technologies.filter(card =>
        ownedTerritoryIds.includes(card.country)) || [];

    const territoryRaws = productionDeck?.rawMaterials.filter(card =>
        ownedTerritoryIds.includes(card.country)) || [];

    // 2. Get cards from player inventory (Active/Stored Cards)
    // Note: Inventory might contain cards that are NOT territory-bound (e.g. from trade), 
    // but the type should still be compatible.
    const inventoryTechs = (player.inventory.technologies || []) as TerritoryCard[];
    const inventoryRaws = (player.inventory.rawMaterials || []) as TerritoryCard[];

    // 3. Merge
    // We assume IDs are unique enough or we don't care about duplicates if a player somehow 
    // has a card for a territory they also own (which shouldn't happen in standard rules 
    // if the deck manages ownership, but specific game logic applies).

    return {
        technologies: [...territoryTechs, ...inventoryTechs],
        rawMaterials: [...territoryRaws, ...inventoryRaws]
    };
};
