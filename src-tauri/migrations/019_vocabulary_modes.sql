-- Existing answers and their receipts retain their original write-mode meaning.
ALTER TABLE vocabulary_reviews ADD COLUMN mode TEXT NOT NULL DEFAULT 'write' CHECK (mode IN ('write', 'scramble'));
