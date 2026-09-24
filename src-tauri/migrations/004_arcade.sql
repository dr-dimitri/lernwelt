CREATE TABLE point_entries_v4 (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    kind TEXT NOT NULL CHECK (kind IN ('answer', 'reward', 'game')),
    item_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK ((kind = 'answer' AND amount > 0) OR (kind IN ('reward', 'game') AND amount < 0)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, kind, item_id)
);
INSERT INTO point_entries_v4 SELECT * FROM point_entries;
DROP TABLE point_entries;
ALTER TABLE point_entries_v4 RENAME TO point_entries;

CREATE TABLE game_sessions (
    id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    game_id TEXT NOT NULL CHECK (game_id IN ('blocks', 'runner', 'space', 'chickens')),
    score INTEGER CHECK (score BETWEEN 0 AND 1000000),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX one_active_game ON game_sessions(profile_id) WHERE score IS NULL;
