// Reset everything and test with clean numberSequences
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function resetAndTest() {
  try {
    console.log('🔄 Complete reset and test...')

    // Sign in anonymously
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) throw authError
    console.log('✅ Signed in with user ID:', authData.user?.id)

    // Step 1: Clear Supabase completely
    console.log('🧹 Clearing all Supabase data...')
    const { error: clearError } = await supabase
      .from('saved_combinations')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')

    if (clearError) {
      console.log('❌ Clear error:', clearError.message)
    } else {
      console.log('✅ Supabase cleared')
    }

    // Step 2: Test the sync function with mock numberSequences
    console.log('\n🧪 Testing sync with mock numberSequences...')

    // Simulate what would be in localStorage
    const mockNumberSequences = [[1, 5, 12, 25, 33, 41, 49]]
    console.log('📝 Mock numberSequences:', JSON.stringify(mockNumberSequences))

    // Test the sync function manually
    console.log('💾 Testing manual sync...')

    // Check if data exists (it shouldn't)
    if (
      !Array.isArray(mockNumberSequences) ||
      mockNumberSequences.length === 0
    ) {
      console.log('ℹ️ No valid numberSequences to sync')
      return
    }

    // Get existing combinations (should be empty)
    const existingCombinations = await getUserCombinations()
    console.log(
      '📊 Existing combinations in Supabase:',
      existingCombinations.length
    )

    // Sync the mock numbers
    for (let i = 0; i < mockNumberSequences.length; i++) {
      const numbers = mockNumberSequences[i]

      if (!Array.isArray(numbers) || numbers.length !== 7) {
        console.log(`⏭️ Skipping invalid combination ${i + 1}:`, numbers)
        continue
      }

      console.log(`💾 Syncing combination ${i + 1}:`, numbers)
      await saveCombination(numbers)
    }

    // Verify final state
    const finalCombinations = await getUserCombinations()
    console.log(
      `\n📊 Final state: ${finalCombinations.length} combinations in Supabase`
    )
    finalCombinations.forEach((item, index) => {
      console.log(
        `  ${index + 1}. [${item.numbers.join(',')}] - ${
          item.name || 'No name'
        }`
      )
    })

    console.log('\n🎯 Instructions to test in browser:')
    console.log('1. Go to http://localhost:3001/lotto-enhanced')
    console.log('2. Open browser console (F12)')
    console.log('3. Clear old data: localStorage.clear()')
    console.log(
      '4. Set test data: localStorage.setItem("numberSequences", \'[[7,14,21,28,35,42,49]]\')'
    )
    console.log('5. Refresh the page')
    console.log('6. Look for sync messages in console')
    console.log('7. Only numberSequences should sync, not savedNumbers')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Helper functions (copied from service)
async function getUserCombinations() {
  const { data, error } = await supabase
    .from('saved_combinations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function saveCombination(numbers) {
  const { data, error } = await supabase
    .from('saved_combinations')
    .insert({
      numbers: numbers,
      name: 'Test Combination',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

resetAndTest()
