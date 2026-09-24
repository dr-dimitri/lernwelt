-- Materialized v2 square rounds preserve selection/order across restarts and replays.
CREATE TABLE square_round_tasks (
    profile_id INTEGER NOT NULL REFERENCES learner_profile(id),
    sequence INTEGER NOT NULL CHECK (sequence >= 0),
    factor INTEGER NOT NULL CHECK (factor BETWEEN 1 AND 25),
    round_number INTEGER NOT NULL CHECK (round_number >= 1),
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 20),
    PRIMARY KEY (profile_id, sequence),
    UNIQUE (profile_id, round_number, position)
);
