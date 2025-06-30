-- Supabase schema for enhanced LOTTO app

-- Table for storing lotto draw data
CREATE TABLE IF NOT EXISTS lotto_draws (
  id SERIAL PRIMARY KEY,
  draw_date TEXT NOT NULL,
  numbers INTEGER[] NOT NULL,
  bonus INTEGER NOT NULL,
  jackpot BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(draw_date)
);

-- Table for storing user's saved number combinations
CREATE TABLE IF NOT EXISTS user_saved_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE lotto_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_numbers ENABLE ROW LEVEL SECURITY;

-- Policy for lotto_draws - everyone can read
CREATE POLICY "Public can read lotto draws" ON lotto_draws
  FOR SELECT
  USING (true);

-- Policies for user_saved_numbers
CREATE POLICY "Users can read their own saved numbers" ON user_saved_numbers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved numbers" ON user_saved_numbers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved numbers" ON user_saved_numbers
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved numbers" ON user_saved_numbers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_lotto_draws_date ON lotto_draws(draw_date);
CREATE INDEX idx_user_saved_numbers_user_id ON user_saved_numbers(user_id);

-- Function to import data from the original data.js format
-- You can run this with your existing data to populate the database
/*
Example usage:
INSERT INTO lotto_draws (draw_date, numbers, bonus, jackpot) VALUES
  ('December 27, 2024', ARRAY[4, 10, 24, 29, 30, 36, 44], 8, 55000000),
  ('December 24, 2024', ARRAY[8, 9, 11, 17, 26, 35, 49], 46, 50000000);
*/ 