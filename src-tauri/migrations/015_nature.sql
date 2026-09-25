-- Extend the subject constraint, keeping every progress value and timestamp.
-- The database migrator runs the copy and replacement in one transaction.
CREATE TABLE learning_progress_v15 (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    subject TEXT NOT NULL CHECK (subject IN ('mathematics', 'english', 'nature')),
    competency_id TEXT NOT NULL CHECK (length(competency_id) BETWEEN 1 AND 128),
    attempts INTEGER NOT NULL CHECK (attempts >= 1),
    correct INTEGER NOT NULL CHECK (correct BETWEEN 0 AND attempts),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id, subject, competency_id)
);
INSERT INTO learning_progress_v15
    (profile_id, subject, competency_id, attempts, correct, updated_at)
SELECT profile_id, subject, competency_id, attempts, correct, updated_at
FROM learning_progress;
DROP TABLE learning_progress;
ALTER TABLE learning_progress_v15 RENAME TO learning_progress;
