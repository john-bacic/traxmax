-- Fix the numbers constraint to allow 1-7 numbers
-- Run this in Supabase SQL Editor

-- First, let's see what constraints exist
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'saved_combinations'::regclass 
  AND contype = 'c';

-- Drop the existing constraint that's causing issues
ALTER TABLE saved_combinations 
DROP CONSTRAINT IF EXISTS saved_combinations_numbers_check;

-- Also drop any other number-related constraints
ALTER TABLE saved_combinations 
DROP CONSTRAINT IF EXISTS valid_numbers;

-- Add the new constraint that allows 1-7 numbers
ALTER TABLE saved_combinations 
ADD CONSTRAINT saved_combinations_numbers_check 
CHECK (
  array_length(numbers, 1) BETWEEN 1 AND 7 
  AND numbers <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50]
);

-- Test the constraint with different arrays
-- These should all work:
INSERT INTO saved_combinations (user_id, numbers, name) VALUES 
  (null, ARRAY[1], 'Test 1 number'),
  (null, ARRAY[1,2,3], 'Test 3 numbers'),
  (null, ARRAY[35,39,43], 'Test specific numbers'),
  (null, ARRAY[1,2,3,4,5,6,7], 'Test 7 numbers');

-- Clean up test data
DELETE FROM saved_combinations WHERE name LIKE 'Test %';

-- Verify the constraint is working
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'saved_combinations'::regclass 
  AND conname = 'saved_combinations_numbers_check'; 