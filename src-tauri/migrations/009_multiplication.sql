CREATE TABLE point_entries_v9 (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    kind TEXT NOT NULL CHECK (kind IN ('answer', 'reward', 'game', 'vocabulary', 'multiplication')),
    item_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (
        (kind = 'answer' AND amount > 0) OR
        (kind IN ('vocabulary', 'multiplication') AND amount = 1) OR
        (kind IN ('reward', 'game') AND amount < 0)
    ),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, kind, item_id)
);
INSERT INTO point_entries_v9 SELECT * FROM point_entries;
DROP TABLE point_entries;
ALTER TABLE point_entries_v9 RENAME TO point_entries;

CREATE TABLE multiplication_answers (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    mode TEXT NOT NULL CHECK (mode IN ('tables', 'squares')),
    sequence INTEGER NOT NULL CHECK (sequence >= 0),
    answer TEXT,
    correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(profile_id, mode, sequence)
);
