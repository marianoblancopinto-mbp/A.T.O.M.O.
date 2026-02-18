
export type TreatyType = 'REGION_CESSION' | 'RAW_MATERIAL_CESSION' | 'TECH_LOAN' | 'TECH_DUPLICATE' | 'NON_AGGRESSION';

export interface TreatyClause {
    id: string;
    type: TreatyType;
    duration: number; // Duration in turns (years). -1 for indefinite.
    sourcePlayerId: string | number; // Who "gives" or "commits"
    targetPlayerId: string | number; // Who "receives" or "benefits"
    data: {
        cardId?: string;       // For Raw Materials / Techs
        regionId?: string;     // For Region Cession or Destination of Tech Duplicate
        regionIds?: string[];  // For Non-Aggression Pact (regions FROM which attacks are forbidden)
    };
}

export type TreatyStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface Treaty {
    id: string;
    creatorId: string | number;
    targetPlayerId: string | number;
    status: TreatyStatus;
    clauses: TreatyClause[];
    createdAtMonth: number; // Game month/turn when activated
    createdAtYear: number;
    history: { date: Date, action: string, actorId: string | number }[];
}
