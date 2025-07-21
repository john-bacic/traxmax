// Diagnose why numberSequences aren't syncing to Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnose() {
  try {
    console.log('🔍 Diagnosing sync issue...')

    // Sign in anonymously
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) throw authError
    console.log('✅ Supabase connection works - User ID:', authData.user?.id)

    // Check what's in Supabase
    const { data: existingData, error: fetchError } = await supabase
      .from('saved_combinations')
      .select('*')

    if (fetchError) throw fetchError
    console.log(`📊 Current Supabase data: ${existingData.length} combinations`)
    existingData.forEach((item, index) => {
      console.log(
        `  ${index + 1}. [${item.numbers.join(',')}] - ${
          item.name || 'No name'
        }`
      )
    })

    console.log('\n❓ To diagnose localStorage issue:')
    console.log('1. Go to http://localhost:3001/lotto-enhanced')
    console.log('2. Open browser console (F12)')
    console.log('3. Run: localStorage.getItem("numberSequences")')
    console.log('4. Copy the result and tell me what it shows')
    console.log('5. Also check: localStorage.getItem("savedNumbers")')

    console.log('\n🧪 If you have numberSequences, I can test manual sync...')
    console.log('Example: If localStorage shows [[11,18,23,31,35,36,48]]')
    console.log('Then update this script and run it again')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

diagnose()
