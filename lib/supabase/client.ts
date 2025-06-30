import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide default values to prevent build errors
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}