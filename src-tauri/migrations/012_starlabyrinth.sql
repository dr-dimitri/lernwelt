CREATE TABLE game_sessions_v12 (
    id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    game_id TEXT NOT NULL CHECK (game_id IN ('blocks', 'runner', 'maze', 'space', 'chickens')),
    score INTEGER CHECK (score BETWEEN 0 AND 1000000),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO game_sessions_v12 SELECT * FROM game_sessions;
DROP TABLE game_sessions;
ALTER TABLE game_sessions_v12 RENAME TO game_sessions;
CREATE UNIQUE INDEX one_active_game ON game_sessions(profile_id) WHERE score IS NULL;
