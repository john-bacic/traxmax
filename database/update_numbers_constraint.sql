-- Migration: Allow saving 1-7 numbers instead of exactly 7
-- Date: January 22, 2025

-- Drop the existing constraint
ALTER TABLE saved_combinations 
DROP CONSTRAINT IF EXISTS saved_combinations_numbers_check;

-- Add the new constraint that allows 1-7 numbers
ALTER TABLE saved_combinations 
ADD CONSTRAINT saved_combinations_numbers_check 
CHECK (array_length(numbers, 1) BETWEEN 1 AND 7);

-- Verify the change
SELECT 
  conname as constraint_name,
  consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'saved_combinations'::regclass 
  AND conname = 'saved_combinations_numbers_check';

-- Test the new constraint (these should all succeed)
-- INSERT example for 1 number: INSERT INTO saved_combinations (user_id, numbers) VALUES (auth.uid(), ARRAY[1]);
-- INSERT example for 3 numbers: INSERT INTO saved_combinations (user_id, numbers) VALUES (auth.uid(), ARRAY[1,2,3]);
-- INSERT example for 7 numbers: INSERT INTO saved_combinations (user_id, numbers) VALUES (auth.uid(), ARRAY[1,2,3,4,5,6,7]);

COMMENT ON CONSTRAINT saved_combinations_numbers_check ON saved_combinations 
IS 'Allow saving 1-7 numbers in a combination (updated Jan 22, 2025)'; 