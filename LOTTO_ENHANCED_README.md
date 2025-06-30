# Enhanced LOTTO App with Supabase Integration

This is a hybrid approach that preserves the original LOTTO 2_1 vanilla JavaScript code while adding modern features like authentication and cloud database storage.

## Architecture

```
┌─────────────────────────────────────┐
│     React Component (Auth Layer)     │
│  - User authentication               │
│  - Supabase client initialization   │
│  - User info display                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Original LOTTO HTML Structure     │
│  - Preserved exactly as-is          │
│  - Loaded dynamically               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Enhanced Script Layer             │
│  - Loads data from Supabase         │
│  - Syncs saved numbers to cloud     │
│  - Falls back to local data         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Original LOTTO Script             │
│  - All original functionality       │
│  - Untouched vanilla JS             │
└─────────────────────────────────────┘
```

## Features Added

1. **Authentication**

   - Users must log in to access the app
   - User email displayed in top-right corner
   - Sign out functionality

2. **Cloud Data Storage**

   - Lotto draw data stored in Supabase
   - Automatically loads latest draws from database
   - Falls back to local data if database unavailable

3. **Cloud Saved Numbers**
   - User's saved number combinations sync to Supabase
   - Accessible from any device when logged in
   - Still works offline with localStorage

## Setup Instructions

### 1. Database Setup

Run the schema in your Supabase SQL editor:

```sql
-- Run the contents of database/lotto_schema.sql
```

### 2. Environment Variables

Add to your `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Import Existing Data

```bash
# Install dependencies if needed
npm install dotenv

# Run the import script
node scripts/import-lotto-data.js
```

### 4. Access the App

Navigate to: `http://localhost:3001/lotto-enhanced`

## How It Works

1. **Authentication Check**: The React component checks if user is logged in
2. **Load Original HTML**: The original LOTTO HTML is loaded into a container
3. **Enhanced Script**: Loads data from Supabase and sets up sync
4. **Original Script**: Runs with all original functionality intact

## Benefits of This Approach

- ✅ **Minimal Changes**: Original code remains untouched
- ✅ **Progressive Enhancement**: Works offline, better with cloud
- ✅ **Easy to Maintain**: Original and enhanced features are separate
- ✅ **Backward Compatible**: Can easily switch back to original
- ✅ **Modern Features**: Auth and cloud storage without rewriting

## File Structure

```
app/lotto-enhanced/
  └── page.tsx          # React wrapper with auth

public/lotto-enhanced/
  ├── lotto.html       # Original HTML (modified paths only)
  ├── style.css        # Original CSS (unchanged)
  ├── script.js        # Original JS (unchanged)
  ├── data.js          # Original data (fallback)
  └── enhanced-script.js # Enhancement layer

database/
  └── lotto_schema.sql  # Supabase database schema

scripts/
  └── import-lotto-data.js # Data import script
```

## Future Enhancements

- Add real-time updates when new draws are added
- Implement draw statistics and analytics
- Add social features (share combinations)
- Create admin panel for adding new draws
- Add push notifications for jackpot alerts
