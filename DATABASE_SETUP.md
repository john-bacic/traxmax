# Database Setup Instructions

## Supabase Database Setup for TraxMax LOTTO App

### Prerequisites
1. A Supabase project created at https://app.supabase.com
2. Environment variables configured in `.env.local`

### Step 1: Create the Database Schema

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the contents of `/database/schema.sql` to create the `lotto_drawings` table

### Step 2: Insert the Data

1. In the SQL Editor, run the contents of `/database/insert_data.sql`
2. This will populate the table with LOTTO Max drawing data

### Step 3: Verify the Setup

Run this query to verify the data was inserted correctly:

```sql
SELECT 
  draw_date, 
  numbers, 
  bonus_number, 
  jackpot_amount 
FROM lotto_drawings 
ORDER BY draw_date DESC 
LIMIT 10;
```

### Database Schema Details

#### `lotto_drawings` Table
- `id`: Primary key (auto-increment)
- `draw_date`: Date of the drawing
- `numbers`: Array of 7 winning numbers (sorted)
- `bonus_number`: The bonus number
- `jackpot_amount`: Jackpot amount in cents
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

#### Security
- Row Level Security (RLS) is enabled
- Public read access is allowed
- Only authenticated users can insert/update data

#### Performance
- Index on `draw_date` for faster queries
- Constraints ensure data quality

### Environment Variables

Make sure your `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### API Usage

The LOTTO app uses the `LottoService` class which provides methods for:
- Getting all drawings
- Filtering by date ranges
- Calculating number frequencies
- Calculating pair frequencies
- Managing saved number combinations

All database operations are handled through Supabase's JavaScript client with proper error handling and loading states.