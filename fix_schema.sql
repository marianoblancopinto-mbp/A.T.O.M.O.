-- Drop the old constraint
ALTER TABLE game_states DROP CONSTRAINT game_states_phase_check;

-- Add the new constraint including 'LOBBY'
ALTER TABLE game_states ADD CONSTRAINT game_states_phase_check
CHECK (phase IN ('LOBBY', 'DEPLOYMENT', 'ATTACK', 'FORTIFICATION', 'REGROUP', 'END'));
