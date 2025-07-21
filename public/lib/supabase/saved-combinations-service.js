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

// Sync local storage to Supabase (for migration)
export const syncLocalToSupabase = async () => {
  try {
    const localData = localStorage.getItem('savedNumbers')
    if (!localData) {
      console.log('ℹ️ No local data to sync')
      return
    }

    const savedNumbers = JSON.parse(localData)
    console.log(
      '🔄 Syncing',
      savedNumbers.length,
      'local combinations to Supabase...'
    )

    for (const numbers of savedNumbers) {
      try {
        await saveCombination(numbers)
      } catch (error) {
        console.error('❌ Failed to sync combination:', numbers, error)
      }
    }

    // Clear local storage after successful sync
    localStorage.removeItem('savedNumbers')
    console.log('✅ Local data synced and cleared')
  } catch (error) {
    console.error('❌ Error syncing local data:', error)
  }
}
