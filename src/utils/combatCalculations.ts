import type { Card } from '../types/gameTypes';

/**
 * Calculates the final score for an attacker in a clash.
 */
export const calculateAttackerScore = (attCard: Card, attackerBonuses: any): number => {
    let attackerScore = attCard.tier;
    if (attCard.regiment === 'C') attackerScore += attackerBonuses.art;
    if (attCard.regiment === 'B') attackerScore += attackerBonuses.inf;
    if (attCard.regiment === 'A') {
        if (attackerBonuses.isPacificFireBonus) attackerScore += 1;
    }
    return attackerScore;
};

/**
 * Calculates the final score for a defender in a clash.
 */
export const calculateDefenderScore = (attCard: Card, defCard: Card, defenderBonuses: any): number => {
    // Base: Defender card tier counts ONLY if it matches attacker regiment (Fog of War / Tactics)
    let baseDefenderTier = 0;
    if (defCard.regiment === attCard.regiment) {
        baseDefenderTier = defCard.tier;
    }

    // Terrain Bonuses (Defense VS [Type], check the ATTACKER'S regiment)
    let terrainBonus = 0;
    if (attCard.regiment === 'A') terrainBonus = defenderBonuses.air;
    if (attCard.regiment === 'B') terrainBonus = defenderBonuses.inf;
    if (attCard.regiment === 'C') terrainBonus = defenderBonuses.art;

    return baseDefenderTier + terrainBonus;
};

/**
 * AI Strategic Selection Logic
 * 
 * Rules:
 * 1. WINNING: Pick the MINIMUM TIER card that wins the encounter (saving high tiers).
 * 2. SACRIFICE: If winning is impossible, pick the LEAST VALUABLE card (Tier 1).
 * 3. VARIETY: If multiple candidates exist for sacrifice, pick from the regiment with MOST copies in hand.
 */
export const selectBestDefenderCard = (
    attackerCard: Card,
    attackerBonuses: any,
    defenderHand: Card[],
    defenderBonuses: any,
    attackerHand: Card[] = [],
    isCheating: boolean = false
): Card => {
    const attackerScore = calculateAttackerScore(attackerCard, attackerBonuses);

    // 1. Evaluate all cards in hand for CURRENT clash
    const evaluatedHand = defenderHand.map(card => ({
        card,
        score: calculateDefenderScore(attackerCard, card, defenderBonuses)
    }));

    // 2. Identify winning options (Defender wins on TIE)
    const winningOptions = evaluatedHand.filter(opt => opt.score >= attackerScore);

    if (winningOptions.length > 0) {
        // --- CHEATING LOGIC: PREDICTIVE DEFENSE ---
        if (isCheating && attackerHand.length > 0) {
            // Sort winning options by Tier DESCENDING to identify our strongest "winners"
            const winners = [...winningOptions].sort((a, b) => b.card.tier - a.card.tier);
            
            // Analyze the remaining THREAT in attacker's hand
            // Find the maximum score any card in attacker's hand could achieve
            const maxAttackerThreat = Math.max(...attackerHand.map(c => calculateAttackerScore(c, attackerBonuses)));

            // If we have a very strong card that wins NOW but is the ONLY one that could beat the MAX THREAT later,
            // we should try to save it if we have ANOTHER card that wins now.
            
            const bestWinner = winners[0]; // Our strongest winner
            const cheaperWinners = winners.filter(w => w.card.id !== bestWinner.card.id);

            if (cheaperWinners.length > 0) {
                // If our best winner is needed for future high threat, and we have a cheaper winner for now...
                const isBestWinnerCrucialFutureAsset = defenderHand.some(c => {
                    const myMaxScoreVsMaxThreat = calculateDefenderScore({ regiment: 'A', tier: 4, variant: 0, id: 'tmp' } as any, c, defenderBonuses); // Simplification: assume regiment match for max potential
                    return c.tier >= 3 && myMaxScoreVsMaxThreat >= (maxAttackerThreat - 1); // Heuristic
                });

                if (isBestWinnerCrucialFutureAsset) {
                    // Pick the MINIMUM tier winner that still wins the current clash
                    return cheaperWinners.sort((a, b) => a.card.tier - b.card.tier)[0].card;
                }
            }
        }

        // --- NORMAL / FALLBACK RULE: MINIMUM WINNING FORCE ---
        winningOptions.sort((a, b) => {
            if (a.card.tier !== b.card.tier) return a.card.tier - b.card.tier;
            const countA = defenderHand.filter(c => c.regiment === a.card.regiment).length;
            const countB = defenderHand.filter(c => c.regiment === b.card.regiment).length;
            return countB - countA;
        });

        return winningOptions[0].card;
    }

    // --- RULE 2 & 3: SMART SACRIFICE ---
    if (isCheating && attackerHand.length > 0) {
        // --- PREDICTIVE LOSING (CHEATING SACRIFICE) ---
        // Evaluate future utility of each defender card against the attacker's remaining hand
        const futureUtility = defenderHand.map(defCard => {
            let winsAgainstCount = 0;
            let isUniqueAnswerTo = false;

            for (const remAttCard of attackerHand) {
                const futureAttScore = calculateAttackerScore(remAttCard, attackerBonuses);
                const futureDefScore = calculateDefenderScore(remAttCard, defCard, defenderBonuses);
                
                if (futureDefScore >= futureAttScore) {
                    winsAgainstCount++;
                    
                    // Is this the ONLY card in our hand that can beat `remAttCard`?
                    const otherAnswers = defenderHand.filter(otherDefCard => 
                        otherDefCard.id !== defCard.id &&
                        calculateDefenderScore(remAttCard, otherDefCard, defenderBonuses) >= futureAttScore
                    );
                    
                    if (otherAnswers.length === 0) {
                        isUniqueAnswerTo = true;
                    }
                }
            }
            return { card: defCard, winsAgainstCount, isUniqueAnswerTo };
        });

        // We can safely sacrifice cards that aren't the unique answer to an upcoming threat
        const expendableCards = futureUtility.filter(u => !u.isUniqueAnswerTo);

        if (expendableCards.length > 0) {
            // Among expendables, pick the one that is useful against the fewest future cards
            const minWins = Math.min(...expendableCards.map(u => u.winsAgainstCount));
            const bestSacrifices = expendableCards.filter(u => u.winsAgainstCount === minWins).map(u => u.card);
            
            // Tie-breaker: lowest tier
            const minTier = Math.min(...bestSacrifices.map(c => c.tier));
            const tiedByTier = bestSacrifices.filter(c => c.tier === minTier);

            tiedByTier.sort((a, b) => {
                const countA = defenderHand.filter(c => c.regiment === a.regiment).length;
                const countB = defenderHand.filter(c => c.regiment === b.regiment).length;
                return countB - countA;
            });
            return tiedByTier[0];
        }
        // If ALL cards are unique answers to future threats, fall through to default lowest-tier sacrifice
    }

    // --- NORMAL / FALLBACK RULE: LOWEST TIER SACRIFICE ---
    const lowestTier = Math.min(...defenderHand.map(c => c.tier));
    const sacrificeCandidates = defenderHand.filter(c => c.tier === lowestTier);

    sacrificeCandidates.sort((a, b) => {
        const countA = defenderHand.filter(c => c.regiment === a.regiment).length;
        const countB = defenderHand.filter(c => c.regiment === b.regiment).length;
        return countB - countA;
    });

    return sacrificeCandidates[0];
};
