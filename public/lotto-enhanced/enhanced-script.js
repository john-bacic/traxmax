// Enhanced LOTTO script - ONLY uses numberSequences for localStorage and Supabase sync
console.log('🚀 Enhanced Supabase script loading...')

// Initialize localStorage with numberSequences if not present
if (!localStorage.getItem('numberSequences')) {
  console.log('🆕 Initializing empty numberSequences array')
  localStorage.setItem('numberSequences', '[]')
}

// Clean up any old storage keys
localStorage.removeItem('savedNumbers')
localStorage.removeItem('offline-lotto-combinations')

console.log(
  '🔍 Current numberSequences:',
  localStorage.getItem('numberSequences')
)

// Import Supabase services
import {
  saveCombination,
  getUserCombinations,
  deleteCombination,
} from '../lib/supabase/saved-combinations-service.js'

// Simple function to get numberSequences from localStorage
function getNumberSequences() {
  try {
    const sequences = localStorage.getItem('numberSequences')
    return sequences ? JSON.parse(sequences) : []
  } catch (error) {
    console.error('❌ Error parsing numberSequences:', error)
    return []
  }
}

// Simple function to save numberSequences to localStorage
function setNumberSequences(sequences) {
  try {
    localStorage.setItem('numberSequences', JSON.stringify(sequences))
    console.log('💾 Updated numberSequences:', sequences)
  } catch (error) {
    console.error('❌ Error saving numberSequences:', error)
  }
}

// Save a new combination to numberSequences and Supabase
async function saveNewCombination(numbers) {
  console.log('🎯 Saving new combination:', numbers)

  // Validate input and ensure numbers are integers
  if (!Array.isArray(numbers) || numbers.length !== 7) {
    console.error('❌ Invalid numbers for saving:', numbers)
    return false
  }

  // Convert all values to integers to prevent string storage
  const intNumbers = numbers.map((n) => parseInt(n, 10))
  console.log('🔢 Converted to integers:', intNumbers)

  try {
    // Add to local numberSequences
    const sequences = getNumberSequences()
    sequences.push(intNumbers)
    setNumberSequences(sequences)

    // Save to Supabase if online
    if (navigator.onLine) {
      try {
        await saveCombination(intNumbers)
        console.log('✅ Saved to Supabase')
      } catch (supabaseError) {
        console.error('❌ Supabase save failed:', supabaseError)
        // Keep local save even if Supabase fails
      }
    } else {
      console.log('📱 Offline - saved locally only')
    }

    // Update display
    refreshDisplay()

    return true
  } catch (error) {
    console.error('❌ Error saving combination:', error)
    return false
  }
}

// Delete a combination by index
async function deleteCombinationByIndex(index) {
  console.log('🗑️ Deleting combination at index:', index)

  try {
    const sequences = getNumberSequences()

    if (index < 0 || index >= sequences.length) {
      console.error('❌ Invalid index:', index)
      return false
    }

    const numbersToDelete = sequences[index]
    console.log('🎯 Deleting numbers:', numbersToDelete)

    // Remove from local
    sequences.splice(index, 1)
    setNumberSequences(sequences)

    // Delete from Supabase if online
    if (navigator.onLine) {
      try {
        // Get all Supabase combinations to find the matching one
        const supabaseCombinations = await getUserCombinations()
        const matchingCombination = supabaseCombinations.find(
          (combo) =>
            JSON.stringify(combo.numbers.sort()) ===
            JSON.stringify(numbersToDelete.sort())
        )

        if (matchingCombination) {
          await deleteCombination(matchingCombination.id)
          console.log('✅ Deleted from Supabase')
        }
      } catch (supabaseError) {
        console.error('❌ Supabase delete failed:', supabaseError)
        // Keep local deletion even if Supabase fails
      }
    }

    // Update display
    refreshDisplay()

    return true
  } catch (error) {
    console.error('❌ Error deleting combination:', error)
    return false
  }
}

// Clear all combinations
async function clearAllCombinations() {
  console.log('🧹 Clearing all combinations')

  try {
    // Clear local
    setNumberSequences([])

    // Clear Supabase if online
    if (navigator.onLine) {
      try {
        const supabaseCombinations = await getUserCombinations()
        for (const combo of supabaseCombinations) {
          await deleteCombination(combo.id)
        }
        console.log('✅ Cleared from Supabase')
      } catch (supabaseError) {
        console.error('❌ Supabase clear failed:', supabaseError)
      }
    }

    // Update display
    refreshDisplay()

    return true
  } catch (error) {
    console.error('❌ Error clearing combinations:', error)
    return false
  }
}

// Flag to prevent multiple initial syncs
let initialSyncCompleted = false

// Load initial data from Supabase (one-time on startup)
async function loadInitialDataFromSupabase() {
  if (initialSyncCompleted) {
    console.log('⏭️ Initial sync already completed, skipping...')
    return
  }

  if (!navigator.onLine) {
    console.log('📱 Offline - using local data only')
    // Still refresh display with local data
    refreshDisplay()
    initialSyncCompleted = true
    return
  }

  try {
    console.log('📥 Loading initial data from Supabase...')

    // Get current local data
    const localSequences = getNumberSequences()
    console.log(
      `📱 Local numberSequences: ${localSequences.length} combinations`
    )

    // Get current Supabase data
    const supabaseCombinations = await getUserCombinations()
    console.log(
      `📊 Found ${supabaseCombinations.length} combinations in Supabase`
    )

    // Always check if local has more data to sync, regardless of Supabase state
    if (localSequences.length > 0) {
      console.log(
        '📤 Local data found, checking what needs to sync to Supabase...'
      )

      // Get existing combinations once at the start
      let existingCombos = supabaseCombinations
      console.log(
        `🔍 Found ${existingCombos.length} existing combinations in Supabase`
      )

      let syncCount = 0
      for (const numbers of localSequences) {
        if (Array.isArray(numbers) && numbers.length === 7) {
          // Check if this combination already exists
          const alreadyExists = existingCombos.some(
            (combo) =>
              JSON.stringify([...combo.numbers].sort()) ===
              JSON.stringify([...numbers].sort())
          )

          if (!alreadyExists) {
            await saveCombination(numbers)
            syncCount++
            console.log(`💾 Synced to Supabase: ${JSON.stringify(numbers)}`)

            // Add to existing combos to prevent duplicates in the same sync
            existingCombos.push({ numbers: numbers })
          } else {
            console.log(`⏭️ Already in Supabase: ${JSON.stringify(numbers)}`)
          }
        }
      }

      if (syncCount > 0) {
        console.log(`✅ Synced ${syncCount} new combinations to Supabase`)
      } else {
        console.log('✅ All local combinations already in Supabase')
      }
    } else if (supabaseCombinations.length > 0) {
      console.log(
        '📥 No local data but Supabase has data, loading from Supabase...'
      )
      // Convert to numberSequences format
      const sequences = supabaseCombinations.map((combo) => combo.numbers)
      setNumberSequences(sequences)
      console.log(`📥 Loaded ${sequences.length} combinations from Supabase`)
    } else if (
      localSequences.length === 0 &&
      supabaseCombinations.length === 0
    ) {
      console.log('📝 No data in either local or Supabase')
    }

    // Always refresh display after loading
    refreshDisplay()
    initialSyncCompleted = true
    console.log('✅ Initial data sync complete')
  } catch (error) {
    console.error('❌ Error loading initial data from Supabase:', error)
    console.log('📱 Using local data only')
    refreshDisplay()
    initialSyncCompleted = true
  }
}

// Function to refresh the display
function refreshDisplay() {
  try {
    if (window.populateSavedNumbersFromLocalStorage) {
      window.populateSavedNumbersFromLocalStorage()
      console.log('🔄 Display refreshed')
    } else if (window.displaySavedNumbers) {
      window.displaySavedNumbers()
      console.log('🔄 Display refreshed (fallback)')
    } else {
      console.log('⚠️ No display function found')
    }
  } catch (error) {
    console.error('❌ Error refreshing display:', error)
  }
}

// Manual sync function (only for debugging/manual use)
async function manualSyncToSupabase() {
  if (!navigator.onLine) {
    console.log('📱 Offline - skipping Supabase sync')
    return
  }

  try {
    console.log('🔄 Manual sync: saving local numbers to Supabase...')
    const sequences = getNumberSequences()
    console.log(`📊 Found ${sequences.length} local combinations to sync`)

    for (const numbers of sequences) {
      if (Array.isArray(numbers) && numbers.length === 7) {
        await saveCombination(numbers)
        console.log(`💾 Synced: ${JSON.stringify(numbers)}`)
      }
    }

    console.log('✅ Manual sync complete')
  } catch (error) {
    console.error('❌ Error in manual sync:', error)
  }
}

// Override the original save function (with retry mechanism)
function setupSaveOverride() {
  if (window.saveToLocalStorage) {
    console.log('✅ Found window.saveToLocalStorage, setting up override')
    const originalSave = window.saveToLocalStorage
    window.saveToLocalStorage = function (sequence) {
      console.log('🔄 Original save called with:', sequence)

      // Parse the sequence and ensure integers
      let numbers
      if (Array.isArray(sequence)) {
        numbers = sequence.map((n) => parseInt(n, 10))
      } else if (typeof sequence === 'string') {
        numbers = sequence.split('-').map((n) => parseInt(n, 10))
      } else {
        console.error('❌ Unknown sequence format:', sequence)
        return
      }

      console.log('🔢 Parsed numbers as integers:', numbers)

      // Save using our new function
      saveNewCombination(numbers)
    }
    return true
  } else {
    console.log('⏳ window.saveToLocalStorage not ready yet, will retry...')
    return false
  }
}

// Try to setup override immediately, then retry if needed
if (!setupSaveOverride()) {
  const retryInterval = setInterval(() => {
    if (setupSaveOverride()) {
      clearInterval(retryInterval)
    }
  }, 100) // Check every 100ms

  // Stop trying after 10 seconds
  setTimeout(() => {
    clearInterval(retryInterval)
    console.log('⚠️ Failed to find window.saveToLocalStorage after 10 seconds')
  }, 10000)
}

// Override delete function if it exists
if (window.deleteCombination) {
  const originalDelete = window.deleteCombination
  window.deleteCombination = function (index) {
    console.log('🔄 Original delete called with index:', index)
    deleteCombinationByIndex(index)
  }
}

// Override clear function if it exists
if (window.clearSavedNumbers) {
  const originalClear = window.clearSavedNumbers
  window.clearSavedNumbers = function () {
    console.log('🔄 Original clear called')
    clearAllCombinations()
  }
}

// Make functions available globally for debugging
window.enhancedLotto = {
  getNumberSequences,
  setNumberSequences,
  saveNewCombination,
  deleteCombinationByIndex,
  clearAllCombinations,
  loadDataFromSupabase: loadInitialDataFromSupabase, // Manual load only
  manualSyncToSupabase,

  // Test functions
  testSave: async () => {
    const testNumbers = [7, 14, 21, 28, 35, 42, 49]
    console.log('🧪 Testing save with:', testNumbers)
    const result = await saveNewCombination(testNumbers)
    console.log('🧪 Save result:', result)
    return result
  },

  testLocalStorage: () => {
    console.log('🧪 Current localStorage numberSequences:')
    console.log(localStorage.getItem('numberSequences'))
    console.log('🧪 Parsed:')
    console.log(getNumberSequences())
  },
}

// Enhanced script loaded - load initial data
console.log('🚀 Enhanced script loaded - ready for manual save/delete actions')
console.log('💡 Supabase will only update when you save or delete numbers')

// Debug what functions are available
console.log('🔍 Available window functions:', {
  saveToLocalStorage: typeof window.saveToLocalStorage,
  populateSavedNumbersFromLocalStorage:
    typeof window.populateSavedNumbersFromLocalStorage,
  displaySavedNumbers: typeof window.displaySavedNumbers,
  lottoMaxWinningNumbers2023: Array.isArray(window.lottoMaxWinningNumbers2023)
    ? window.lottoMaxWinningNumbers2023.length + ' items'
    : typeof window.lottoMaxWinningNumbers2023,
})

// Load initial data from Supabase and sync with local
setTimeout(() => {
  console.log('📥 Starting initial data load...')
  loadInitialDataFromSupabase()
}, 1000) // Wait 1 second for other scripts to initialize

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('🌐 Back online - ready for save/delete actions')
  // NO auto-sync - only sync when user saves or deletes
})

window.addEventListener('offline', () => {
  console.log('📱 Gone offline')
})

console.log('✅ Enhanced script loaded successfully!')
