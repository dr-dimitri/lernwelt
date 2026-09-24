CREATE TABLE vocabulary_progress (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('vorschule', 'koenner', 'streber')),
    box_number INTEGER NOT NULL CHECK (box_number BETWEEN 1 AND 5),
    reviews INTEGER NOT NULL CHECK (reviews > 0),
    due_at INTEGER NOT NULL CHECK (due_at >= 0),
    PRIMARY KEY (profile_id, card_id, difficulty)
);
CREATE TABLE vocabulary_reviews (
    request_id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('vorschule', 'koenner', 'streber')),
    expected_reviews INTEGER NOT NULL CHECK (expected_reviews >= 0),
    known INTEGER NOT NULL CHECK (known IN (0, 1)),
    box_number INTEGER NOT NULL CHECK (box_number BETWEEN 1 AND 5),
    due_at INTEGER NOT NULL CHECK (due_at >= 0),
    deck_id TEXT NOT NULL
);
