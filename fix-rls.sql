-- Comprehensive RLS fix for saved_combinations table
-- Run this in Supabase SQL Editor

-- First, disable RLS temporarily to clean up
ALTER TABLE saved_combinations DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own combinations" ON saved_combinations;
DROP POLICY IF EXISTS "Users can insert own combinations" ON saved_combinations;
DROP POLICY IF EXISTS "Users can delete own combinations" ON saved_combinations;
DROP POLICY IF EXISTS "Users can update own combinations" ON saved_combinations;

-- Re-enable RLS
ALTER TABLE saved_combinations ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies for anonymous users
CREATE POLICY "Enable read for users based on user_id" ON saved_combinations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id" ON saved_combinations  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON saved_combinations
  FOR DELETE USING (auth.uid() = user_id);

-- Verify anonymous auth is enabled (this should return some config)
SELECT 
  COALESCE(
    (SELECT setting FROM auth.config WHERE parameter = 'site_url'), 
    'Not set'
  ) as site_url,
  COALESCE(
    (SELECT setting FROM auth.config WHERE parameter = 'external_anonymous_users_enabled'), 
    'Not set'
  ) as anonymous_enabled;

-- Test: Insert a sample row to verify policies work
-- (This will fail if policies are wrong)
INSERT INTO saved_combinations (user_id, numbers, name) 
VALUES (auth.uid(), ARRAY[1,2,3,4,5,6,7], 'Policy Test')
RETURNING id, user_id, numbers, created_at; 