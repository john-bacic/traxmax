// Verify localStorage and sync ONLY real numberSequences
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// IMPORTANT: Update this array when you add/remove numbers in localStorage
// This should match exactly what's in localStorage.getItem('numberSequences')
const CURRENT_REAL_NUMBERS = [[11, 18, 23, 31, 35, 36, 48]] // Update this when numbers change!

async function verifyAndSync() {
  try {
    console.log('🔍 Verifying and syncing ONLY real numberSequences...')

    // Sign in anonymously
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) throw authError

    // Clear any existing data first
    console.log('🧹 Clearing any existing data...')
    const { error: clearError } = await supabase
      .from('saved_combinations')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')

    if (clearError) {
      console.log('❌ Clear error:', clearError.message)
    } else {
      console.log('✅ All existing data cleared')
    }

    // Save only the current real numbers
    console.log('💾 Saving current real numbers to Supabase...')
    for (let i = 0; i < CURRENT_REAL_NUMBERS.length; i++) {
      const numbers = CURRENT_REAL_NUMBERS[i]

      const { data, error } = await supabase
        .from('saved_combinations')
        .insert({
          numbers: numbers,
          name: `Real Numbers ${i + 1}`,
        })
        .select()
        .single()

      if (error) {
        console.log('❌ Save error:', error.message)
      } else {
        console.log(`✅ Saved real numbers ${i + 1}:`, numbers)
      }
    }

    // Verify final state
    const { data: finalData, error: fetchError } = await supabase
      .from('saved_combinations')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.log('❌ Fetch error:', fetchError.message)
    } else {
      console.log(`📊 Supabase now contains ${finalData.length} combinations:`)
      finalData.forEach((item, index) => {
        console.log(`  ${index + 1}. [${item.numbers.join(',')}]`)
      })
    }

    console.log('\n🎯 Important:')
    console.log('- Supabase now contains ONLY your real numbers')
    console.log(
      '- When you add/remove numbers in the app, update CURRENT_REAL_NUMBERS in this script'
    )
    console.log(
      '- The app will now only sync numberSequences from localStorage'
    )
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verifyAndSync()
