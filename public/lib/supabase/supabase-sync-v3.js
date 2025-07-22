// SUPABASE SYNC V3 - Fresh service to bypass ALL caching
// This runs in the browser context with ES modules

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Initialize Supabase client with CORRECT URLs - V3
function createSupabaseClient() {
  // FORCE CORRECT SUPABASE CREDENTIALS - V3
  const supabaseUrl = 'https://slyscrmgrrjzzclbbdia.supabase.co'
  const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseXNjcm1ncnJqenpjbGJiZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA5MTQsImV4cCI6MjA2NjcwNjkxNH0.5F3Jk0pesBHAwFaBpuZuSucbecRvniFokkmMICWPfQc'

  console.log('🔧 Creating Supabase client V3 with CORRECT URL:', {
    url: supabaseUrl,
    keyPreview: supabaseAnonKey?.substring(0, 20) + '...',
  })

  return createClient(supabaseUrl, supabaseAnonKey)
}

const supabase = createSupabaseClient()

// Cache authenticated user to avoid rate limits
let cachedUser = null
let cacheExpiry = 0

// Get cached or fresh authenticated user - V3
const getAuthenticatedUser = async () => {
  const now = Date.now()

  // Return cached user if still valid (5 minute cache)
  if (cachedUser && now < cacheExpiry) {
    console.log('✅ V3: Using cached user:', cachedUser.id)
    return cachedUser
  }

  try {
    console.log('🚀 V3: Getting fresh authentication...')

    // Check if already authenticated
    const {
      data: { user },
      error: getError,
    } = await supabase.auth.getUser()

    if (user && !getError) {
      console.log('✅ V3: Already authenticated, user:', user.id)
      cachedUser = user
      cacheExpiry = now + 5 * 60 * 1000 // Cache for 5 minutes
      return user
    }

    // Need fresh anonymous authentication
    console.log('🔑 V3: Creating new anonymous user...')
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) {
      console.error('❌ V3 Auth failed:', authError)
      throw authError
    }

    console.log('✅ V3 Auth success, user:', authData.user?.id)
    cachedUser = authData.user
    cacheExpiry = now + 5 * 60 * 1000 // Cache for 5 minutes
    return authData.user
  } catch (error) {
    console.error('❌ V3 Error getting authenticated user:', error)
    throw error
  }
}

// Initialize anonymous user - V3 (for backward compatibility)
export const initializeUser = async () => {
  return await getAuthenticatedUser()
}

// Save a combination - V3
export const saveCombination = async (numbers, name = null) => {
  try {
    console.log('🚀 V3: ATTEMPTING SAVE WITH CORRECT AUTH...')

    // Get authenticated user (uses cache to avoid rate limits)
    const user = await getAuthenticatedUser()
    console.log('✅ V3 Auth ready, user:', user?.id)

    // Convert numbers to integers and insert with user_id
    const intNumbers = numbers.map((n) => parseInt(n, 10))
    console.log('🔢 V3 Converted to integers:', intNumbers)

    const { data, error } = await supabase
      .from('saved_combinations')
      .insert([
        {
          numbers: intNumbers,
          name,
          user_id: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('❌ V3 Insert error:', error)
      throw error
    }

    console.log('✅ V3 SAVE SUCCESS WITH CORRECT AUTH:', data)
    return data
  } catch (error) {
    console.error('❌ V3 Error in authenticated save:', error)
    throw error
  }
}

// Get user combinations - V3
export const getUserCombinations = async () => {
  try {
    console.log('📥 V3: Getting combinations from correct Supabase...')

    // Get authenticated user (uses cache to avoid rate limits)
    const user = await getAuthenticatedUser()

    const { data, error } = await supabase
      .from('saved_combinations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ V3 Get combinations error:', error)
      throw error
    }

    console.log('✅ V3 Got combinations:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ V3 Error getting combinations:', error)
    throw error
  }
}

// Delete a combination - V3
export const deleteCombination = async (id) => {
  try {
    console.log('🗑️ V3: Deleting combination:', id)

    // Get authenticated user (uses cache to avoid rate limits)
    const user = await getAuthenticatedUser()

    const { data, error } = await supabase
      .from('saved_combinations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('❌ V3 Delete error:', error)
      throw error
    }

    console.log('✅ V3 Delete success:', data)
    return data
  } catch (error) {
    console.error('❌ V3 Error deleting combination:', error)
    throw error
  }
}

// Test function to verify connection - V3
export const testConnection = async () => {
  try {
    console.log('🧪 V3: Testing connection to correct Supabase...')

    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously()
    if (authError) {
      throw authError
    }

    console.log('✅ V3 Connection test successful! User:', authData.user.id)
    return { success: true, userId: authData.user.id }
  } catch (error) {
    console.error('❌ V3 Connection test failed:', error)
    return { success: false, error: error.message }
  }
}
