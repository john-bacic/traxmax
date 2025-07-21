// Emergency clear all duplicates from Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function clearAllDuplicates() {
  try {
    console.log('🚨 EMERGENCY: Clearing ALL duplicates from Supabase...')

    // Sign in anonymously
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) throw authError
    console.log('✅ Signed in with user ID:', authData.user?.id)

    // Get current count
    const { data: beforeData, error: beforeError } = await supabase
      .from('saved_combinations')
      .select('*')

    if (beforeError) {
      console.log('❌ Error checking count:', beforeError.message)
    } else {
      console.log(`📊 Found ${beforeData.length} records before clearing`)
    }

    // Clear ALL existing data
    const { error: clearError } = await supabase
      .from('saved_combinations')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')

    if (clearError) {
      console.log('❌ Clear error:', clearError.message)
    } else {
      console.log('✅ ALL duplicates cleared successfully')
    }

    // Verify it's empty
    const { data: afterData, error: afterError } = await supabase
      .from('saved_combinations')
      .select('*')

    if (afterError) {
      console.log('❌ Verify error:', afterError.message)
    } else {
      console.log(
        `📊 Supabase now has ${afterData.length} records (should be 0)`
      )
    }

    console.log('\n🛠️ IMMEDIATE ACTION NEEDED:')
    console.log('1. Hard refresh your lotto-enhanced page (Cmd+Shift+R)')
    console.log('2. Clear localStorage: localStorage.clear()')
    console.log('3. DO NOT refresh the page multiple times')
    console.log('4. Only save numbers manually - no auto-sync on page load')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

clearAllDuplicates()
