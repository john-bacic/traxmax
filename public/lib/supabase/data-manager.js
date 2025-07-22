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

    console.log('✅ LottoDataManager ready')
  }

  async authenticateUser() {
    try {
      // Try to get existing session
      const {
        data: { session },
      } = await this.supabase.auth.getSession()

      if (session?.user) {
        this.user = session.user
        console.log('✅ User authenticated:', this.user.id)
        return
      }

      // Sign in anonymously
      const {
        data: { user },
        error,
      } = await this.supabase.auth.signInAnonymously()

      if (error) throw error

      this.user = user
      console.log('✅ Anonymous user created:', this.user.id)
    } catch (error) {
      console.warn('⚠️ Auth failed, using offline mode:', error.message)
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

    try {
      // Always save to localStorage first (immediate feedback)
      const sequences = this.getLocalSequences()
      sequences.push(numbers)
      localStorage.setItem('numberSequences', JSON.stringify(sequences))

      // Notify UI immediately
      this.notifyListeners('numbers_saved', { numbers, source: 'local' })

      // Sync to Supabase if online
      if (this.isOnline && this.user && !this.user.offline) {
        await this.syncToSupabase('insert', numbers)
        this.notifyListeners('sync_success', { action: 'save', numbers })
      } else {
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
        const { error } = await this.supabase
          .from('saved_combinations')
          .insert({
            user_id: this.user.id,
            numbers: numbers,
            name: `Combination ${Date.now()}`,
          })

        if (error) throw error
        console.log('✅ Synced to Supabase:', numbers)
      } else if (action === 'delete') {
        // Find matching combination to delete
        const { data: combinations } = await this.supabase
          .from('saved_combinations')
          .select('id, numbers')
          .eq('user_id', this.user.id)

        const matching = combinations?.find(
          (combo) =>
            JSON.stringify(combo.numbers.sort()) ===
            JSON.stringify(numbers.sort())
        )

        if (matching) {
          const { error } = await this.supabase
            .from('saved_combinations')
            .delete()
            .eq('id', matching.id)

          if (error) throw error
          console.log('✅ Deleted from Supabase:', numbers)
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

// Create global instance
window.lottoDataManager = new LottoDataManager()

// Export for module usage
export default window.lottoDataManager
