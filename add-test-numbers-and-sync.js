// Add test numbers to numberSequences and sync to Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test numbers to add to localStorage
const testNumbers = [
  [11, 18, 23, 31, 35, 36, 48],
  [5, 12, 19, 27, 33, 41, 50],
]

async function addAndSync() {
  try {
    console.log('🧪 Adding test numbers to localStorage simulation...')

    // Simulate what would be in localStorage
    const numberSequences = JSON.stringify(testNumbers)
    console.log(
      '📝 Would set localStorage numberSequences to:',
      numberSequences
    )

    // Sign in anonymously
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) throw authError
    console.log('✅ Signed in with user ID:', authData.user?.id)

    // Clear any existing data first
    console.log('🧹 Clearing existing Supabase data...')
    const { error: clearError } = await supabase
      .from('saved_combinations')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')

    if (clearError) {
      console.log('❌ Clear error:', clearError.message)
    } else {
      console.log('✅ Existing data cleared')
    }

    // Now sync the test numbers manually
    console.log('💾 Syncing test numbers to Supabase...')
    for (let i = 0; i < testNumbers.length; i++) {
      const numbers = testNumbers[i]

      const { data, error } = await supabase
        .from('saved_combinations')
        .insert({
          numbers: numbers,
          name: `Test Combination ${i + 1}`,
        })
        .select()
        .single()

      if (error) {
        console.log('❌ Save error:', error.message)
      } else {
        console.log(`✅ Saved combination ${i + 1}:`, numbers)
      }
    }

    // Verify what got saved
    const { data: finalData, error: fetchError } = await supabase
      .from('saved_combinations')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.log('❌ Fetch error:', fetchError.message)
    } else {
      console.log(`\n📊 Final Supabase state: ${finalData.length} combinations`)
      finalData.forEach((item, index) => {
        console.log(
          `  ${index + 1}. [${item.numbers.join(',')}] - ${item.name}`
        )
      })
    }

    console.log('\n🎯 Next steps:')
    console.log('1. Go to http://localhost:3001/lotto-enhanced')
    console.log('2. Select 7 numbers and save them using the heart button')
    console.log('3. Check console for sync messages')
    console.log('4. The saved numbers should then sync to Supabase')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

addAndSync()
