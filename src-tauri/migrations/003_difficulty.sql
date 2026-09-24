CREATE TABLE learning_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('vorschule', 'koenner', 'streber'))
);
INSERT INTO learning_settings (id, difficulty) VALUES (1, 'koenner');
