import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use the correct Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://slyscrmgrrjzzclbbdia.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseXNjcm1ncnJqenpjbGJiZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA5MTQsImV4cCI6MjA2NjcwNjkxNH0.5F3Jk0pesBHAwFaBpuZuSucbecRvniFokkmMICWPfQc'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}