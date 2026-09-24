-- Begin a fresh 10–25 round after the last answer. Keep answered factors exactly
-- as displayed, including factors below 10, so historical retries stay correct.
DELETE FROM square_round_tasks
WHERE NOT EXISTS (
    SELECT 1 FROM multiplication_answers a
    WHERE a.profile_id = square_round_tasks.profile_id
      AND a.mode = 'squares' AND a.sequence = square_round_tasks.sequence
);
