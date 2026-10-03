CREATE TABLE typing_progress (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    task_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('vorschule', 'koenner', 'streber')),
    attempts INTEGER NOT NULL CHECK(attempts >= 1),
    correct INTEGER NOT NULL CHECK(correct >= 0 AND correct <= attempts),
    solved INTEGER NOT NULL CHECK(solved IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(profile_id, task_id)
);

CREATE TABLE typing_submissions (
    request_id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    task_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('vorschule', 'koenner', 'streber')),
    answer TEXT NOT NULL,
    correct INTEGER NOT NULL CHECK(correct IN (0, 1)),
    points_awarded INTEGER NOT NULL CHECK(points_awarded BETWEEN 0 AND 3),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK(correct = 1 OR points_awarded = 0)
);
