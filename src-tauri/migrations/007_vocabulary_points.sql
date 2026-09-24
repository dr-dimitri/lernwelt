-- Keep every historical journal row, including IDs and timestamps.
CREATE TABLE point_entries_v7 (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    kind TEXT NOT NULL CHECK (kind IN ('answer', 'reward', 'game', 'vocabulary')),
    item_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (
        (kind = 'answer' AND amount > 0) OR
        (kind = 'vocabulary' AND amount = 1) OR
        (kind IN ('reward', 'game') AND amount < 0)
    ),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, kind, item_id)
);
INSERT INTO point_entries_v7 SELECT * FROM point_entries;
DROP TABLE point_entries;
ALTER TABLE point_entries_v7 RENAME TO point_entries;

-- Legacy self-assessments keep zero points and remain distinguishable from checked answers.
ALTER TABLE vocabulary_reviews ADD COLUMN answer TEXT;
ALTER TABLE vocabulary_reviews ADD COLUMN points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded IN (0, 1));
ALTER TABLE vocabulary_reviews ADD COLUMN automatically_checked INTEGER NOT NULL DEFAULT 0 CHECK (automatically_checked IN (0, 1));
