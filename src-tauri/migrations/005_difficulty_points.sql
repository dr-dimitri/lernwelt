CREATE TABLE answer_submissions_v5 (
    request_id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    question_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
    points_awarded INTEGER NOT NULL CHECK (points_awarded IN (0, 5, 10, 15)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO answer_submissions_v5 (request_id, profile_id, question_id, answer, correct, points_awarded, created_at)
    SELECT request_id, profile_id, question_id, answer, correct, points_awarded, created_at FROM answer_submissions;
DROP TABLE answer_submissions;
ALTER TABLE answer_submissions_v5 RENAME TO answer_submissions;
