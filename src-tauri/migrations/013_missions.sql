CREATE TABLE mission_progress (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    topic_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('vorschule', 'koenner', 'streber')),
    independent_at INTEGER,
    independent_variant INTEGER,
    recalled_later_at INTEGER,
    last_practiced_at INTEGER NOT NULL,
    due_at INTEGER,
    interval_days INTEGER NOT NULL DEFAULT 1 CHECK(interval_days IN (1, 3, 7, 14)),
    PRIMARY KEY(profile_id, topic_id, difficulty)
);
CREATE TABLE mission_sessions (
    id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    topic_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('vorschule', 'koenner', 'streber')),
    round INTEGER NOT NULL CHECK(round >= 1),
    variant INTEGER NOT NULL CHECK(variant BETWEEN 0 AND 2),
    current_step INTEGER NOT NULL DEFAULT 0 CHECK(current_step BETWEEN 0 AND 5),
    recall_eligible INTEGER NOT NULL CHECK(recall_eligible IN (0, 1)),
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    CHECK((current_step = 5) = (completed_at IS NOT NULL)),
    UNIQUE(profile_id, topic_id, difficulty, round)
);
CREATE UNIQUE INDEX one_active_mission ON mission_sessions(profile_id, topic_id, difficulty) WHERE completed_at IS NULL;
CREATE TABLE mission_steps (
    session_id TEXT NOT NULL REFERENCES mission_sessions(id),
    step_index INTEGER NOT NULL CHECK(step_index BETWEEN 0 AND 4),
    hinted INTEGER NOT NULL DEFAULT 0 CHECK(hinted IN (0, 1)),
    outcome TEXT CHECK(outcome IN ('correct', 'incorrect', 'revealed')),
    answer TEXT,
    independent INTEGER NOT NULL DEFAULT 0 CHECK(independent IN (0, 1)),
    points_awarded INTEGER NOT NULL DEFAULT 0 CHECK(points_awarded BETWEEN 0 AND 3),
    PRIMARY KEY(session_id, step_index)
);
CREATE TABLE mission_requests (
    request_id TEXT PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
