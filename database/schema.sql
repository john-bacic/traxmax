-- Create lotto_drawings table
CREATE TABLE IF NOT EXISTS lotto_drawings (
  id SERIAL PRIMARY KEY,
  draw_date DATE NOT NULL,
  numbers INTEGER[] NOT NULL CHECK (array_length(numbers, 1) = 7),
  bonus_number INTEGER NOT NULL CHECK (bonus_number >= 1 AND bonus_number <= 50),
  jackpot_amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on draw_date for faster queries
CREATE INDEX IF NOT EXISTS idx_lotto_drawings_draw_date ON lotto_drawings(draw_date DESC);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER update_lotto_drawings_updated_at 
    BEFORE UPDATE ON lotto_drawings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE lotto_drawings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON lotto_drawings
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update (for data management)
CREATE POLICY "Allow authenticated insert" ON lotto_drawings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON lotto_drawings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add some constraints to ensure data quality
ALTER TABLE lotto_drawings ADD CONSTRAINT check_numbers_range 
    CHECK (
        numbers[1] >= 1 AND numbers[1] <= 50 AND
        numbers[2] >= 1 AND numbers[2] <= 50 AND
        numbers[3] >= 1 AND numbers[3] <= 50 AND
        numbers[4] >= 1 AND numbers[4] <= 50 AND
        numbers[5] >= 1 AND numbers[5] <= 50 AND
        numbers[6] >= 1 AND numbers[6] <= 50 AND
        numbers[7] >= 1 AND numbers[7] <= 50
    );

-- Ensure numbers are sorted and unique
ALTER TABLE lotto_drawings ADD CONSTRAINT check_numbers_sorted_unique
    CHECK (
        numbers[1] < numbers[2] AND
        numbers[2] < numbers[3] AND
        numbers[3] < numbers[4] AND
        numbers[4] < numbers[5] AND
        numbers[5] < numbers[6] AND
        numbers[6] < numbers[7]
    );