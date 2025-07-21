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
  syncLocalToSupabase,
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

  // Validate input
  if (!Array.isArray(numbers) || numbers.length !== 7) {
    console.error('❌ Invalid numbers for saving:', numbers)
    return false
  }

  try {
    // Add to local numberSequences
    const sequences = getNumberSequences()
    sequences.push(numbers)
    setNumberSequences(sequences)

    // Save to Supabase if online
    if (navigator.onLine) {
      try {
        await saveCombination(numbers)
        console.log('✅ Saved to Supabase')
      } catch (supabaseError) {
        console.error('❌ Supabase save failed:', supabaseError)
        // Keep local save even if Supabase fails
      }
    } else {
      console.log('📱 Offline - saved locally only')
    }

    // Update display
    if (window.displaySavedNumbers) {
      window.displaySavedNumbers()
    }

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
    if (window.displaySavedNumbers) {
      window.displaySavedNumbers()
    }

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
    if (window.displaySavedNumbers) {
      window.displaySavedNumbers()
    }

    return true
  } catch (error) {
    console.error('❌ Error clearing combinations:', error)
    return false
  }
}

// Sync from Supabase to local numberSequences
async function syncFromSupabase() {
  if (!navigator.onLine) {
    console.log('📱 Offline - skipping Supabase sync')
    return
  }

  try {
    console.log('🔄 Syncing from Supabase...')

    // Get current Supabase data
    const supabaseCombinations = await getUserCombinations()
    console.log(
      `📊 Found ${supabaseCombinations.length} combinations in Supabase`
    )

    // Convert to numberSequences format
    const sequences = supabaseCombinations.map((combo) => combo.numbers)

    // Update local storage
    setNumberSequences(sequences)

    // Update display
    if (window.displaySavedNumbers) {
      window.displaySavedNumbers()
    }

    console.log('✅ Sync from Supabase complete')
  } catch (error) {
    console.error('❌ Error syncing from Supabase:', error)
  }
}

// Sync local numberSequences to Supabase
async function syncToSupabase() {
  if (!navigator.onLine) {
    console.log('📱 Offline - skipping Supabase sync')
    return
  }

  try {
    console.log('🔄 Syncing to Supabase...')
    await syncLocalToSupabase()
    console.log('✅ Sync to Supabase complete')
  } catch (error) {
    console.error('❌ Error syncing to Supabase:', error)
  }
}

// Override the original save function
if (window.saveToLocalStorage) {
  const originalSave = window.saveToLocalStorage
  window.saveToLocalStorage = function (sequence) {
    console.log('🔄 Original save called with:', sequence)

    // Parse the sequence
    let numbers
    if (Array.isArray(sequence)) {
      numbers = sequence
    } else if (typeof sequence === 'string') {
      numbers = sequence.split('-').map(Number)
    } else {
      console.error('❌ Unknown sequence format:', sequence)
      return
    }

    // Save using our new function
    saveNewCombination(numbers)
  }
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
  syncFromSupabase,
  syncToSupabase,
}

// Auto-sync on load
console.log('🚀 Starting auto-sync...')
syncToSupabase().then(() => {
  syncFromSupabase()
})

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('🌐 Back online - syncing...')
  syncToSupabase().then(() => {
    syncFromSupabase()
  })
})

window.addEventListener('offline', () => {
  console.log('📱 Gone offline')
})

console.log('✅ Enhanced script loaded successfully!')
