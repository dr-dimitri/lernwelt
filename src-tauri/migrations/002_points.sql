CREATE TABLE point_entries (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    kind TEXT NOT NULL CHECK (kind IN ('answer', 'reward')),
    item_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK ((kind = 'answer' AND amount > 0) OR (kind = 'reward' AND amount < 0)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (profile_id, kind, item_id)
);

CREATE TABLE answer_submissions (
    request_id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    question_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
    points_awarded INTEGER NOT NULL CHECK (points_awarded IN (0, 10)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
