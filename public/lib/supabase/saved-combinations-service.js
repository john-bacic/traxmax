// Browser-compatible version of saved combinations service
// This runs in the browser context with ES modules

import { createBrowserClient } from 'https://cdn.jsdelivr.net/npm/@supabase/ssr@0.5.1/+esm'

// Initialize Supabase client
function createClient() {
  const supabaseUrl =
    window.SUPABASE_URL ||
    window.parent.SUPABASE_URL ||
    'https://placeholder.supabase.co'
  const supabaseAnonKey =
    window.SUPABASE_ANON_KEY ||
    window.parent.SUPABASE_ANON_KEY ||
    'placeholder-anon-key'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

const supabase = createClient()

// Initialize anonymous user
export const initializeUser = async () => {
  try {
    // Check if already authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      console.log('✅ Anonymous user created:', data.user?.id)
      return data.user
    }

    console.log('✅ User already authenticated:', user.id)
    return user
  } catch (error) {
    console.error('❌ Error initializing user:', error)
    throw error
  }
}

// Save a combination
export const saveCombination = async (numbers, name = null) => {
  try {
    await initializeUser()

    const { data, error } = await supabase
      .from('saved_combinations')
      .insert([{ numbers, name }])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Combination saved:', data)
    return data
  } catch (error) {
    console.error('❌ Error saving combination:', error)
    throw error
  }
}

// Get user's combinations
export const getUserCombinations = async () => {
  try {
    await initializeUser()

    const { data, error } = await supabase
      .from('saved_combinations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    console.log('✅ Loaded combinations:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Error fetching combinations:', error)
    return []
  }
}

// Delete a combination
export const deleteCombination = async (id) => {
  try {
    const { error } = await supabase
      .from('saved_combinations')
      .delete()
      .eq('id', id)

    if (error) throw error
    console.log('✅ Combination deleted:', id)
  } catch (error) {
    console.error('❌ Error deleting combination:', error)
    throw error
  }
}

// Get number analytics
export const getNumberAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('number_analytics')
      .select('*')
      .order('frequency', { ascending: false })

    if (error) throw error
    console.log('✅ Analytics loaded:', data?.length || 0, 'numbers')
    return data || []
  } catch (error) {
    console.error('❌ Error fetching analytics:', error)
    return []
  }
}

// Sync local storage to Supabase (for migration) - ONLY real numberSequences
export const syncLocalToSupabase = async () => {
  try {
    console.log('🔄 Checking for real numberSequences to sync...')

    // Check if we've already synced recently to prevent rapid duplicates
    const lastSync = localStorage.getItem('lastSyncTime')
    const now = Date.now()
    if (lastSync && now - parseInt(lastSync) < 5000) {
      // 5 second cooldown
      console.log('⏱️ Sync cooldown active - skipping to prevent duplicates')
      return
    }

    // Check for real numberSequences (this is the actual saved data)
    const numberSequences = localStorage.getItem('numberSequences')
    if (!numberSequences) {
      console.log('ℹ️ No numberSequences found in localStorage')
      return
    }

    let realCombinations
    try {
      realCombinations = JSON.parse(numberSequences)
      console.log('📊 Found real numberSequences:', realCombinations)
    } catch (parseError) {
      console.error('❌ Error parsing numberSequences:', parseError)
      return
    }

    // Validate the data format
    if (!Array.isArray(realCombinations) || realCombinations.length === 0) {
      console.log('ℹ️ No valid numberSequences to sync')
      return
    }

    // Get existing combinations to avoid duplicates
    const existingCombinations = await getUserCombinations()
    console.log(
      `📊 Found ${existingCombinations.length} existing combinations in Supabase`
    )

    const existingNumbers = existingCombinations.map((item) => {
      const sorted = [...item.numbers].sort((a, b) => a - b)
      return JSON.stringify(sorted)
    })
    console.log('🔍 Existing number patterns:', existingNumbers)

    // Sync only new combinations
    let syncedCount = 0
    for (let i = 0; i < realCombinations.length; i++) {
      const numbers = realCombinations[i]

      // Validate that this is a proper array of 7 numbers
      if (!Array.isArray(numbers) || numbers.length !== 7) {
        console.log(`⏭️ Skipping invalid combination ${i + 1}:`, numbers)
        continue
      }

      // Convert to integers to prevent string issues
      const intNumbers = numbers.map((n) => parseInt(n, 10))
      const sortedNumbers = [...intNumbers].sort((a, b) => a - b)
      const numberKey = JSON.stringify(sortedNumbers)
      console.log(`🔍 Checking combination ${i + 1}: ${numberKey}`)

      if (!existingNumbers.includes(numberKey)) {
        console.log(`💾 Syncing NEW combination ${i + 1}:`, intNumbers)
        await saveCombination(intNumbers)
        syncedCount++
      } else {
        console.log(
          `⏭️ Combination ${i + 1} already exists, skipping:`,
          intNumbers
        )
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} new combinations added`)

    // Update last sync time to prevent rapid re-syncing
    localStorage.setItem('lastSyncTime', Date.now().toString())

    console.log('✅ Real numberSequences sync complete')
  } catch (error) {
    console.error('❌ Error syncing real numberSequences:', error)
  }
}
