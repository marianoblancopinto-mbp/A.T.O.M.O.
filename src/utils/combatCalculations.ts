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
 * Resolves a single clash. Returns TRUE if the attacker wins.
 * The defender wins ties (defenderScore >= attackerScore).
 */
const attackerWinsClash = (
    attCard: Card,
    attackerBonuses: any,
    defCard: Card,
    defenderBonuses: any
): boolean => {
    const attackerScore = calculateAttackerScore(attCard, attackerBonuses);
    const defenderScore = calculateDefenderScore(attCard, defCard, defenderBonuses);
    return attackerScore > defenderScore;
};

/**
 * Current match context for the best-of-3 look-ahead.
 * Values mirror the battleState counters at the moment the defender must respond.
 */
export interface BattleContext {
    attackerWins: number;
    defenderWins: number;
    /** Number of rounds already COMPLETED (0 on the first round). */
    roundCount: number;
}

/** Rounds are best-of-3: the battle ends at 2 wins or after 3 rounds. */
const MAX_ROUNDS = 3;
/** Safety cap so a pathologically large hand (many supply draws) can't stall the UI. */
const SEARCH_SPACE_CAP = 400000;

/**
 * PERFECT-INFORMATION MINIMAX (used only when the AI is "cheating").
 *
 * Returns the match outcome for the DEFENDER under optimal play by both sides,
 * given full knowledge of the attacker's remaining hand:
 *   +1  -> defender wins the battle
 *   -1  -> attacker wins the battle
 *
 * Turn structure matches the real game: at the start of each round the attacker
 * plays a card, then the defender responds. The attacker plays to MINIMIZE the
 * defender's outcome; the defender responds to MAXIMIZE it.
 */
const evalMatchValue = (
    attackerBonuses: any,
    defenderBonuses: any,
    aWins: number,
    dWins: number,
    round: number,
    aHand: Card[],
    dHand: Card[],
    memo: Map<string, number>
): number => {
    // --- Terminal conditions ---
    if (dWins >= 2) return 1;
    if (aWins >= 2) return -1;
    if (round >= MAX_ROUNDS) return dWins >= aWins ? 1 : -1; // defender wins ties
    if (aHand.length === 0 || dHand.length === 0) return dWins >= aWins ? 1 : -1;

    const key = `${aWins}|${dWins}|${round}|${aHand.map(c => c.id).sort().join(',')}|${dHand.map(c => c.id).sort().join(',')}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    // Attacker moves first, choosing the card that MINIMIZES the defender's value.
    let attackerBest = Infinity;
    for (let i = 0; i < aHand.length; i++) {
        const aCard = aHand[i];
        const aRest = aHand.slice(0, i).concat(aHand.slice(i + 1));

        // Defender responds, choosing the card that MAXIMIZES its value.
        let defenderBest = -Infinity;
        for (let j = 0; j < dHand.length; j++) {
            const dCard = dHand[j];
            const dRest = dHand.slice(0, j).concat(dHand.slice(j + 1));
            const attWins = attackerWinsClash(aCard, attackerBonuses, dCard, defenderBonuses);
            const v = evalMatchValue(
                attackerBonuses,
                defenderBonuses,
                aWins + (attWins ? 1 : 0),
                dWins + (attWins ? 0 : 1),
                round + 1,
                aRest,
                dRest,
                memo
            );
            if (v > defenderBest) defenderBest = v;
            if (defenderBest === 1) break; // best possible for defender -> prune
        }

        if (defenderBest < attackerBest) attackerBest = defenderBest;
        if (attackerBest === -1) break; // worst possible for defender -> attacker takes it, prune
    }

    memo.set(key, attackerBest);
    return attackerBest;
};

/** Rough size of the look-ahead tree; used to bail out to the heuristic if it explodes. */
const searchSpaceSize = (aHandLen: number, dHandLen: number, roundsLeft: number): number => {
    let size = 1;
    let a = aHandLen;
    let d = dHandLen;
    for (let r = 0; r < roundsLeft && a > 0 && d > 0; r++) {
        size *= a * d;
        a--;
        d--;
        if (size > SEARCH_SPACE_CAP) return size;
    }
    return size;
};

/**
 * AI Strategic Selection Logic
 *
 * Non-cheating (base) rules:
 * 1. WINNING: Pick the MINIMUM TIER card that wins the encounter (saving high tiers).
 * 2. SACRIFICE: If winning is impossible, pick the LEAST VALUABLE card (Tier 1).
 * 3. VARIETY: If multiple candidates exist for sacrifice, pick from the regiment with MOST copies in hand.
 *
 * Cheating rules (isCheating === true):
 *   Full-information best-of-3 minimax over the attacker's remaining hand. The AI
 *   plays the response that GUARANTEES the best match outcome assuming the attacker
 *   also plays optimally, then breaks ties by conserving its strongest cards.
 */
export const selectBestDefenderCard = (
    attackerCard: Card,
    attackerBonuses: any,
    defenderHand: Card[],
    defenderBonuses: any,
    attackerHand: Card[] = [],
    isCheating: boolean = false,
    battleContext?: BattleContext
): Card => {
    // --- CHEATING: OPTIMAL BEST-OF-3 DEFENSE (perfect information) ---
    const ctx = battleContext ?? { attackerWins: 0, defenderWins: 0, roundCount: 0 };
    const roundsLeft = MAX_ROUNDS - ctx.roundCount;
    const canSearch =
        isCheating &&
        defenderHand.length > 0 &&
        searchSpaceSize(attackerHand.length, defenderHand.length - 1, roundsLeft - 1) <= SEARCH_SPACE_CAP;

    if (canSearch) {
        const memo = new Map<string, number>();

        // Evaluate each possible response to the card the attacker just played.
        const candidates = defenderHand.map(defCard => {
            const attWins = attackerWinsClash(attackerCard, attackerBonuses, defCard, defenderBonuses);
            const dRest = defenderHand.filter(c => c.id !== defCard.id);
            // attackerHand already excludes the current attacker card (removed by the reducer).
            const value = evalMatchValue(
                attackerBonuses,
                defenderBonuses,
                ctx.attackerWins + (attWins ? 1 : 0),
                ctx.defenderWins + (attWins ? 0 : 1),
                ctx.roundCount + 1,
                attackerHand,
                dRest,
                memo
            );
            return {
                card: defCard,
                value,
                winsClash: !attWins, // defender wins this specific clash
                tier: defCard.tier,
                regimentCount: defenderHand.filter(c => c.regiment === defCard.regiment).length
            };
        });

        candidates.sort((a, b) => {
            // 1. Best guaranteed match outcome.
            if (a.value !== b.value) return b.value - a.value;
            // 2. Conserve strong cards: spend the lowest tier that preserves the outcome.
            if (a.tier !== b.tier) return a.tier - b.tier;
            // 3. Among equally cheap cards, prefer actually winning this clash.
            if (a.winsClash !== b.winsClash) return (b.winsClash ? 1 : 0) - (a.winsClash ? 1 : 0);
            // 4. Variety: keep rarer regiments in hand.
            return b.regimentCount - a.regimentCount;
        });

        return candidates[0].card;
    }

    // --- NON-CHEATING (BASE) LOGIC ---
    const attackerScore = calculateAttackerScore(attackerCard, attackerBonuses);

    // 1. Evaluate all cards in hand for CURRENT clash
    const evaluatedHand = defenderHand.map(card => ({
        card,
        score: calculateDefenderScore(attackerCard, card, defenderBonuses)
    }));

    // 2. Identify winning options (Defender wins on TIE)
    const winningOptions = evaluatedHand.filter(opt => opt.score >= attackerScore);

    if (winningOptions.length > 0) {
        // MINIMUM WINNING FORCE
        winningOptions.sort((a, b) => {
            if (a.card.tier !== b.card.tier) return a.card.tier - b.card.tier;
            const countA = defenderHand.filter(c => c.regiment === a.card.regiment).length;
            const countB = defenderHand.filter(c => c.regiment === b.card.regiment).length;
            return countB - countA;
        });

        return winningOptions[0].card;
    }

    // LOWEST TIER SACRIFICE
    const lowestTier = Math.min(...defenderHand.map(c => c.tier));
    const sacrificeCandidates = defenderHand.filter(c => c.tier === lowestTier);

    sacrificeCandidates.sort((a, b) => {
        const countA = defenderHand.filter(c => c.regiment === a.regiment).length;
        const countB = defenderHand.filter(c => c.regiment === b.regiment).length;
        return countB - countA;
    });

    return sacrificeCandidates[0];
};
