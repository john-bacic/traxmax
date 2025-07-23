-- Fix constraint to properly reject empty arrays
-- Run this in Supabase SQL Editor

-- Drop and recreate the constraint to fix empty array issue
ALTER TABLE saved_combinations 
DROP CONSTRAINT IF EXISTS saved_combinations_numbers_check;

-- Add the corrected constraint that properly handles empty arrays
ALTER TABLE saved_combinations 
ADD CONSTRAINT saved_combinations_numbers_check 
CHECK (
  array_length(numbers, 1) >= 1 
  AND array_length(numbers, 1) <= 7 
  AND numbers <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50]
);

-- Clean up the empty array test record
DELETE FROM saved_combinations WHERE numbers = '{}'; 