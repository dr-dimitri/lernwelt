-- Historical answers and factor plans stay replayable. Only never-answered old
-- square plans are replaced so the first new task already stays within 20².
DELETE FROM square_round_tasks WHERE NOT EXISTS (
    SELECT 1 FROM multiplication_answers a
    WHERE a.profile_id=square_round_tasks.profile_id
      AND a.mode='squares' AND a.sequence=square_round_tasks.sequence
);
CREATE TABLE multiplication_settings (
    id INTEGER PRIMARY KEY CHECK(id=1),
    revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
    mode TEXT NOT NULL DEFAULT 'tables' CHECK(mode IN ('tables','squares')),
    world TEXT NOT NULL DEFAULT 'workshop' CHECK(world IN ('workshop','island')),
    design TEXT NOT NULL DEFAULT 'scout' CHECK(design IN ('scout','garden','aqua')),
    palette TEXT NOT NULL DEFAULT 'mint' CHECK(palette IN ('mint','amber','violet')),
    table_number INTEGER CHECK(table_number BETWEEN 1 AND 10),
    review INTEGER NOT NULL DEFAULT 0 CHECK(review IN (0,1)),
    review_run INTEGER NOT NULL DEFAULT 0
);
INSERT INTO multiplication_settings(id) VALUES(1);
CREATE TABLE multiplication_worlds (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    world TEXT NOT NULL CHECK(world IN ('workshop','island')),
    answered INTEGER NOT NULL DEFAULT 0 CHECK(answered>=0),
    awaiting_continue INTEGER NOT NULL DEFAULT 0 CHECK(awaiting_continue IN (0,1)),
    completed_design TEXT CHECK(completed_design IN ('scout','garden','aqua')),
    completed_palette TEXT CHECK(completed_palette IN ('mint','amber','violet')),
    PRIMARY KEY(profile_id,world)
);
CREATE TABLE multiplication_robots (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    design TEXT NOT NULL CHECK(design IN ('scout','garden','aqua')),
    palette TEXT NOT NULL CHECK(palette IN ('mint','amber','violet')),
    count INTEGER NOT NULL CHECK(count>0),
    PRIMARY KEY(profile_id,design,palette)
);
CREATE TABLE multiplication_cursors (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    mode TEXT NOT NULL CHECK(mode IN ('tables','squares')),
    table_number INTEGER NOT NULL CHECK(table_number BETWEEN 0 AND 10),
    cursor INTEGER NOT NULL CHECK(cursor>=0),
    PRIMARY KEY(profile_id,mode,table_number)
);
INSERT INTO multiplication_cursors(profile_id,mode,table_number,cursor)
    SELECT profile_id,mode,0,MAX(sequence)+1 FROM multiplication_answers GROUP BY profile_id,mode;
CREATE TABLE multiplication_tasks (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    mode TEXT NOT NULL CHECK(mode IN ('tables','squares')),
    sequence INTEGER NOT NULL CHECK(sequence>=0),
    content_id TEXT NOT NULL,
    left_factor INTEGER NOT NULL CHECK(left_factor BETWEEN 1 AND 20),
    right_factor INTEGER NOT NULL CHECK(right_factor BETWEEN 1 AND 20),
    round_number INTEGER NOT NULL,
    position INTEGER NOT NULL,
    round_size INTEGER NOT NULL,
    world TEXT NOT NULL CHECK(world IN ('workshop','island')),
    table_number INTEGER NOT NULL CHECK(table_number BETWEEN 0 AND 10),
    normal_cursor INTEGER,
    review INTEGER NOT NULL CHECK(review IN (0,1)),
    review_run INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
    PRIMARY KEY(profile_id,mode,sequence)
);
CREATE UNIQUE INDEX one_multiplication_task ON multiplication_tasks(profile_id,mode) WHERE active=1;
CREATE TABLE multiplication_review_queue (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    mode TEXT NOT NULL CHECK(mode IN ('tables','squares')),
    left_factor INTEGER NOT NULL CHECK(left_factor BETWEEN 1 AND 20),
    right_factor INTEGER NOT NULL CHECK(right_factor BETWEEN 1 AND 20),
    last_review_run INTEGER NOT NULL DEFAULT -1,
    updated_order INTEGER NOT NULL,
    PRIMARY KEY(profile_id,mode,left_factor,right_factor)
);
CREATE TABLE multiplication_configurations (
    request_id TEXT PRIMARY KEY,
    payload TEXT NOT NULL
);
