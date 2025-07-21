// Clear junk data and check localStorage
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function clearJunkAndFix() {
  try {
    console.log('🧹 Clearing ALL junk data from Supabase...')

    // Sign in anonymously
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) throw authError

    // Delete ALL existing data
    console.log('🗑️ Deleting all data...')
    const { error: deleteError } = await supabase
      .from('saved_combinations')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (deleteError) {
      console.log('❌ Delete error:', deleteError.message)
    } else {
      console.log('✅ All junk data cleared from Supabase')
    }

    // Verify it's empty
    const { data: verifyData, error: verifyError } = await supabase
      .from('saved_combinations')
      .select('*')

    if (verifyError) {
      console.log('❌ Verify error:', verifyError.message)
    } else {
      console.log(
        `📊 Supabase now has ${verifyData.length} records (should be 0)`
      )
    }

    console.log('\n💾 Now checking localStorage...')
    console.log(
      '❌ Cannot check localStorage from Node.js - need to check in browser'
    )
    console.log('\n🎯 Next steps:')
    console.log('1. Go to http://localhost:3001/lotto-enhanced')
    console.log('2. Open browser console (F12)')
    console.log('3. Type: localStorage.getItem("numberSequences")')
    console.log('4. Only those numbers should sync to Supabase!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

clearJunkAndFix()
