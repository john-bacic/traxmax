/**
 * Robust Data Manager for Lotto Numbers
 * Handles localStorage + Supabase sync automatically
 * Event-driven architecture with proper error handling
 */

// Use the global supabase from CDN script tag
const { createClient } = window.supabase

class LottoDataManager {
  constructor() {
    this.supabaseUrl =
      window.SUPABASE_URL || 'https://slyscrmgrrjzzclbbdia.supabase.co'
    this.supabaseKey =
      window.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseXNjcm1ncnJqenpjbGJiZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA5MTQsImV4cCI6MjA2NjcwNjkxNH0.5F3Jk0pesBHAwFaBpuZuSucbecRvniFokkmMICWPfQc'

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey)
    this.isOnline = navigator.onLine
    this.syncQueue = []
    this.user = null
    this.listeners = new Set()

    this.init()
  }

  async init() {
    console.log('🚀 LottoDataManager initializing...')

    // Set up online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processSyncQueue()
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Authenticate user
    await this.authenticateUser()

    // Sync on startup if online
    if (this.isOnline) {
      await this.syncFromSupabase()
    }

    // Debug: Test Supabase connection
    console.log('🧪 Testing Supabase connection...')
    try {
      const { data, error } = await this.supabase
        .from('saved_combinations')
        .select('count')
        .limit(1)
      if (error) {
        console.error('❌ Supabase connection test failed:', error)
      } else {
        console.log('✅ Supabase connection test successful')
      }
    } catch (connError) {
      console.error('❌ Supabase connection error:', connError)
    }

    console.log('✅ LottoDataManager ready')
  }

  async authenticateUser() {
    try {
      console.log('🔐 Starting authentication process...')

      // Try to get existing session
      const {
        data: { session },
      } = await this.supabase.auth.getSession()

      if (session?.user) {
        this.user = session.user
        console.log('✅ User authenticated (existing session):', this.user.id)
        return
      }

      console.log('📝 No existing session, creating anonymous user...')

      // Sign in anonymously (check if method exists)
      if (typeof this.supabase.auth.signInAnonymously === 'function') {
        console.log('📝 Using signInAnonymously method...')
        const {
          data: { user },
          error,
        } = await this.supabase.auth.signInAnonymously()

        if (error) {
          console.error('❌ Anonymous sign-in failed:', error)
          throw error
        }

        this.user = user
        console.log('✅ Anonymous user created successfully:', this.user.id)
      } else {
        console.log(
          '📝 signInAnonymously not available, trying alternative auth...'
        )

        // Try using signInWithPassword with a demo account first
        try {
          console.log('🔑 Attempting demo account login...')
          const { data: authData, error: authError } =
            await this.supabase.auth.signInWithPassword({
              email: 'demo@example.com',
              password: 'demo123456',
            })

          if (!authError && authData.user) {
            this.user = authData.user
            console.log('✅ Demo account login successful:', this.user.id)
            return
          } else {
            console.log(
              '⚠️ Demo account login failed, trying guest approach...'
            )
          }
        } catch (demoError) {
          console.log('⚠️ Demo account not available, using guest approach...')
        }

        // Alternative: Create a guest user session or use different auth
        // Generate a proper UUID for guest users
        let guestUserId = localStorage.getItem('guest-user-id')

        // Check if existing guest ID is in old format (starts with 'guest-')
        if (!guestUserId || guestUserId.startsWith('guest-')) {
          console.log('🔄 Generating new UUID format guest user...')

          // Generate a UUID v4 format for compatibility
          guestUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
            /[xy]/g,
            function (c) {
              const r = (Math.random() * 16) | 0
              const v = c === 'x' ? r : (r & 0x3) | 0x8
              return v.toString(16)
            }
          )
          localStorage.setItem('guest-user-id', guestUserId)
          console.log('✅ New UUID guest user created:', guestUserId)
        }

        this.user = {
          id: guestUserId,
          email: 'guest@demo.com',
          guest: true,
        }

        console.log('✅ Guest user created:', this.user.id)
      }
    } catch (error) {
      console.warn('⚠️ Auth failed, using offline mode:', error.message)
      console.log('🔄 Setting user to offline mode with details:', error)
      this.user = { id: 'offline-user', offline: true }
    }
  }

  // Event system for UI updates
  addListener(callback) {
    this.listeners.add(callback)
  }

  removeListener(callback) {
    this.listeners.delete(callback)
  }

  notifyListeners(event, data) {
    this.listeners.forEach((listener) => {
      try {
        listener({ event, data, timestamp: Date.now() })
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  // Core data operations
  async saveNumbers(numbers) {
    console.log('💾 Saving numbers:', numbers)
    console.log('🔍 Debug - isOnline:', this.isOnline)
    console.log('🔍 Debug - user:', this.user)
    console.log('🔍 Debug - user offline flag:', this.user?.offline)

    try {
      // Always save to localStorage first (immediate feedback)
      const sequences = this.getLocalSequences()
      sequences.push(numbers)
      localStorage.setItem('numberSequences', JSON.stringify(sequences))
      console.log('✅ Saved to localStorage successfully')

      // Notify UI immediately
      this.notifyListeners('numbers_saved', { numbers, source: 'local' })

      // Sync to Supabase if online and user is authenticated (including guest users)
      if (
        this.isOnline &&
        this.user &&
        !this.user.offline &&
        (this.user.guest || this.user.id)
      ) {
        console.log('🚀 Attempting Supabase sync...')
        console.log(
          '🔍 User type:',
          this.user.guest ? 'guest' : 'authenticated'
        )

        try {
          await this.syncToSupabase('insert', numbers)
          console.log('✅ Supabase sync completed successfully')
          this.notifyListeners('sync_success', { action: 'save', numbers })
        } catch (syncError) {
          console.error('❌ Supabase sync failed:', syncError)
          // Queue for later retry
          this.syncQueue.push({
            action: 'insert',
            numbers,
            timestamp: Date.now(),
          })
          this.notifyListeners('queued_for_sync', { action: 'save', numbers })
        }
      } else {
        console.log('⏸️ Queueing for later sync - reasons:')
        console.log('   - isOnline:', this.isOnline)
        console.log('   - user exists:', !!this.user)
        console.log('   - user offline:', this.user?.offline)
        console.log('   - user guest:', this.user?.guest)

        // Queue for later sync
        this.syncQueue.push({
          action: 'insert',
          numbers,
          timestamp: Date.now(),
        })
        this.notifyListeners('queued_for_sync', { action: 'save', numbers })
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Save failed:', error)
      this.notifyListeners('save_error', { numbers, error: error.message })
      return { success: false, error: error.message }
    }
  }

  async deleteNumbers(numbers) {
    console.log('🗑️ Deleting numbers:', numbers)

    try {
      // Remove from localStorage first
      const sequences = this.getLocalSequences()
      const updatedSequences = sequences.filter(
        (seq) => JSON.stringify(seq.sort()) !== JSON.stringify(numbers.sort())
      )
      localStorage.setItem('numberSequences', JSON.stringify(updatedSequences))

      // Notify UI immediately
      this.notifyListeners('numbers_deleted', { numbers, source: 'local' })

      // Sync to Supabase if online
      if (this.isOnline && this.user && !this.user.offline) {
        await this.syncToSupabase('delete', numbers)
        this.notifyListeners('sync_success', { action: 'delete', numbers })
      } else {
        // Queue for later sync
        this.syncQueue.push({
          action: 'delete',
          numbers,
          timestamp: Date.now(),
        })
        this.notifyListeners('queued_for_sync', { action: 'delete', numbers })
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Delete failed:', error)
      this.notifyListeners('delete_error', { numbers, error: error.message })
      return { success: false, error: error.message }
    }
  }

  async getAllNumbers() {
    // Always return from localStorage for immediate response
    const localSequences = this.getLocalSequences()

    // Optionally sync from Supabase in background
    if (this.isOnline && this.user && !this.user.offline) {
      this.syncFromSupabase().catch((error) => {
        console.warn('Background sync failed:', error)
      })
    }

    return localSequences
  }

  // Supabase sync operations
  async syncToSupabase(action, numbers) {
    if (!this.user || this.user.offline) return

    try {
      if (action === 'insert') {
        console.log('📤 Inserting to Supabase with user_id:', this.user.id)

        // For guest users, try to insert without foreign key constraint
        const insertData = {
          user_id: this.user.guest ? null : this.user.id, // Use null for guest users
          numbers: numbers,
          name: `Combination ${Date.now()}`,
        }

        console.log('📤 Insert data:', insertData)

        const { error } = await this.supabase
          .from('saved_combinations')
          .insert(insertData)

        if (error) {
          console.error('❌ Supabase insert error:', error)

          // If foreign key error, try a different approach
          if (error.code === '23503' && this.user.guest) {
            console.log(
              '🔄 Retrying with alternative approach for guest user...'
            )

            // Try inserting with a known system user or without user_id
            const altInsertData = {
              numbers: numbers,
              name: `Guest Combination ${Date.now()}`,
              // Don't include user_id for guest users
            }

            const { error: altError } = await this.supabase
              .from('saved_combinations')
              .insert(altInsertData)

            if (altError) {
              console.error('❌ Alternative insert also failed:', altError)
              throw altError
            } else {
              console.log('✅ Alternative insert successful for guest user')
              return
            }
          }

          throw error
        }
        console.log('✅ Synced to Supabase:', numbers)
      } else if (action === 'delete') {
        console.log('🗑️ Deleting from Supabase:', numbers)

        // Find matching combination to delete
        let combinations

        if (this.user.guest) {
          // For guest users, search without user_id constraint
          const { data } = await this.supabase
            .from('saved_combinations')
            .select('id, numbers, user_id')
            .is('user_id', null) // Search for records with null user_id

          combinations = data
        } else {
          // For authenticated users, search by user_id
          const { data } = await this.supabase
            .from('saved_combinations')
            .select('id, numbers')
            .eq('user_id', this.user.id)

          combinations = data
        }

        const matching = combinations?.find(
          (combo) =>
            JSON.stringify(combo.numbers.sort()) ===
            JSON.stringify(numbers.sort())
        )

        if (matching) {
          console.log('🎯 Found matching combination to delete:', matching.id)

          const { error } = await this.supabase
            .from('saved_combinations')
            .delete()
            .eq('id', matching.id)

          if (error) {
            console.error('❌ Delete error:', error)
            throw error
          }
          console.log('✅ Deleted from Supabase:', numbers)
        } else {
          console.log('⚠️ No matching combination found to delete')
        }
      }
    } catch (error) {
      console.error('❌ Supabase sync failed:', error)
      throw error
    }
  }

  async syncFromSupabase() {
    if (!this.user || this.user.offline) return

    try {
      const { data: combinations, error } = await this.supabase
        .from('saved_combinations')
        .select('numbers')
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (combinations?.length > 0) {
        const supabaseNumbers = combinations.map((c) => c.numbers)
        const localNumbers = this.getLocalSequences()

        // Merge without duplicates
        const merged = [...localNumbers]
        supabaseNumbers.forEach((supabaseSeq) => {
          const exists = merged.some(
            (localSeq) =>
              JSON.stringify(localSeq.sort()) ===
              JSON.stringify(supabaseSeq.sort())
          )
          if (!exists) {
            merged.push(supabaseSeq)
          }
        })

        localStorage.setItem('numberSequences', JSON.stringify(merged))
        this.notifyListeners('synced_from_supabase', {
          count: combinations.length,
        })
        console.log(
          `✅ Synced ${combinations.length} combinations from Supabase`
        )
      }
    } catch (error) {
      console.error('❌ Sync from Supabase failed:', error)
    }
  }

  async processSyncQueue() {
    if (
      !this.isOnline ||
      !this.user ||
      this.user.offline ||
      this.syncQueue.length === 0
    ) {
      return
    }

    console.log(
      `🔄 Processing ${this.syncQueue.length} queued sync operations...`
    )

    const queue = [...this.syncQueue]
    this.syncQueue = []

    for (const operation of queue) {
      try {
        await this.syncToSupabase(operation.action, operation.numbers)
        this.notifyListeners('sync_success', operation)
      } catch (error) {
        console.error('Sync operation failed:', operation, error)
        this.notifyListeners('sync_error', { operation, error: error.message })
        // Re-queue failed operations
        this.syncQueue.push(operation)
      }
    }
  }

  // Helper methods
  getLocalSequences() {
    return JSON.parse(localStorage.getItem('numberSequences') || '[]')
  }

  // Public API for existing code compatibility
  saveToLocalStorage(numbers) {
    return this.saveNumbers(numbers)
  }

  removeFromLocalStorage(numbers) {
    return this.deleteNumbers(numbers)
  }

  // Status methods
  getStatus() {
    return {
      isOnline: this.isOnline,
      user: this.user,
      queueSize: this.syncQueue.length,
      localCount: this.getLocalSequences().length,
    }
  }
}

// Export the class and create global instance
export { LottoDataManager }

// Create global instance
window.lottoDataManager = new LottoDataManager()

// Export for module usage
export default window.lottoDataManager
