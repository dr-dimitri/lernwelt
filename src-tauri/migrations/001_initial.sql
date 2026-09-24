CREATE TABLE learner_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 60),
    grade INTEGER NOT NULL CHECK (grade BETWEEN 5 AND 13)
);

CREATE TABLE learning_progress (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    subject TEXT NOT NULL CHECK (subject IN ('mathematics', 'english')),
    competency_id TEXT NOT NULL CHECK (length(competency_id) BETWEEN 1 AND 128),
    attempts INTEGER NOT NULL CHECK (attempts >= 1),
    correct INTEGER NOT NULL CHECK (correct BETWEEN 0 AND attempts),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id, subject, competency_id)
);
