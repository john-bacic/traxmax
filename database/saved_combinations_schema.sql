-- Create saved_combinations table
CREATE TABLE saved_combinations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers integer[] NOT NULL CHECK (array_length(numbers, 1) BETWEEN 1 AND 7),
  created_at timestamp with time zone DEFAULT now(),
  name text DEFAULT NULL,
  
  -- Ensure numbers are between 1-50
  CONSTRAINT valid_numbers CHECK (
    numbers <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50]
  )
);

-- Indexes for performance
CREATE INDEX idx_saved_combinations_user_id ON saved_combinations(user_id);
CREATE INDEX idx_saved_combinations_created_at ON saved_combinations(created_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE saved_combinations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own combinations
CREATE POLICY "Users can view own combinations" ON saved_combinations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own combinations
CREATE POLICY "Users can insert own combinations" ON saved_combinations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own combinations
CREATE POLICY "Users can delete own combinations" ON saved_combinations
  FOR DELETE USING (auth.uid() = user_id);

-- View for number analytics (public read)
CREATE OR REPLACE VIEW number_analytics AS
SELECT 
  unnest(numbers) as number,
  COUNT(*) as frequency,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM saved_combinations)), 2) as percentage
FROM saved_combinations
GROUP BY unnest(numbers)
ORDER BY frequency DESC;

-- Grant public access to analytics view
GRANT SELECT ON number_analytics TO anon, authenticated; 