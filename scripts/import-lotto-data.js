// Script to import existing lotto data into Supabase
// Run this with: node scripts/import-lotto-data.js

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Read and parse the original data.js file
const dataContent = fs.readFileSync(
  path.join(__dirname, '../LOTTO 2_1/data.js'),
  'utf8'
)

// Extract the array from the file content
const match = dataContent.match(
  /const lottoMaxWinningNumbers2023 = (\[[\s\S]*\]);/
)
if (!match) {
  console.error('Could not parse data.js')
  process.exit(1)
}

// Evaluate the array (be careful with eval in production!)
const lottoMaxWinningNumbers2023 = eval(match[1])

console.log(`Found ${lottoMaxWinningNumbers2023.length} draws to import`)

async function importData() {
  let successCount = 0
  let errorCount = 0

  for (const draw of lottoMaxWinningNumbers2023) {
    try {
      const { error } = await supabase.from('lotto_draws').upsert(
        {
          draw_date: draw.date,
          numbers: draw.numbers,
          bonus: draw.bonus,
          jackpot: draw.jackpot,
        },
        {
          onConflict: 'draw_date',
        }
      )

      if (error) {
        console.error(`Error importing ${draw.date}:`, error)
        errorCount++
      } else {
        successCount++
        if (successCount % 10 === 0) {
          console.log(`Imported ${successCount} draws...`)
        }
      }
    } catch (err) {
      console.error(`Error importing ${draw.date}:`, err)
      errorCount++
    }
  }

  console.log(`\nImport complete!`)
  console.log(`Successfully imported: ${successCount} draws`)
  console.log(`Errors: ${errorCount}`)
}

importData().catch(console.error)
