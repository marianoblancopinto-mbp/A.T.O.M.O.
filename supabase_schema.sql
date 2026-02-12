-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Games Table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('LOBBY', 'PLAYING', 'FINISHED')),
    host_id UUID, -- We might not strictly enforce FK if auth is anonymous, but good to have
    settings JSONB DEFAULT '{}'::JSONB
);

-- 2. Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    state JSONB DEFAULT '{}'::JSONB, -- Private state (cards, resources)
    is_ready BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT -- Optional for simple ban/kick if needed
);

-- 3. Game States Table
CREATE TABLE game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    turn_index INTEGER DEFAULT 0,
    phase TEXT CHECK (phase IN ('DEPLOYMENT', 'ATTACK', 'FORTIFICATION', 'REGROUP', 'END')),
    map_ownership JSONB DEFAULT '{}'::JSONB, -- { regionId: playerId }
    game_log JSONB DEFAULT '[]'::JSONB,
    battles JSONB DEFAULT '{}'::JSONB,
    current_player_id UUID, -- Redundant but fast access
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Diplomacy Table (Future Proofing)
CREATE TABLE diplomacy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    proposer_id UUID REFERENCES players(id),
    target_id UUID REFERENCES players(id),
    type TEXT CHECK (type IN ('ALLIANCE', 'TRADE', 'NON_AGGRESSION')),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    terms JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime Setup
-- Enable Realtime for these tables so clients can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE diplomacy;

-- Row Level Security (RLS)
-- For this "Concept/Dev" phase, we will allow public access to avoid complex auth logic initially.
-- WARNING: This allows anyone with the anon key to modify the DB.
-- In production, we would restrict updates via Edge Functions or stricter policies.

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Games" ON games FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Players" ON players FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access GameStates" ON game_states FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE diplomacy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Diplomacy" ON diplomacy FOR ALL USING (true) WITH CHECK (true);
