// Clear savedNumbers and sync only numberSequences
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function clearAndSync() {
  try {
    console.log('🧹 Clearing savedNumbers and syncing only numberSequences...')

    // Sign in anonymously
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) throw authError
    console.log('✅ Signed in with user ID:', authData.user?.id)

    // Clear ALL existing data in Supabase first
    console.log('🗑️ Clearing all Supabase data...')
    const { error: clearError } = await supabase
      .from('saved_combinations')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')

    if (clearError) {
      console.log('❌ Clear error:', clearError.message)
    } else {
      console.log('✅ All Supabase data cleared')
    }

    console.log('\n📋 Instructions for you:')
    console.log('1. Go to http://localhost:3001/lotto-enhanced')
    console.log('2. Open browser console (F12)')
    console.log('3. Run this command to clear savedNumbers:')
    console.log('   localStorage.removeItem("savedNumbers")')
    console.log("4. Check what's in numberSequences:")
    console.log('   localStorage.getItem("numberSequences")')
    console.log('5. Refresh the page to trigger sync')

    console.log('\n🎯 Only numberSequences should sync to Supabase now!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

clearAndSync()
