// Enhanced LOTTO script with Supabase integration and offline support
// This script loads after authentication and enhances the original functionality

// Import Supabase client
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Initialize Supabase (these will be set from the parent React component)
// const supabaseUrl = window.SUPABASE_URL || ''
// const supabaseAnonKey = window.SUPABASE_ANON_KEY || ''
// const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if we're in offline mode (use browser's navigator.onLine only)
const isOfflineMode = !navigator.onLine

// Load the original data first
let lottoMaxWinningNumbers2023 = []

// Function to update offline indicator
function updateOfflineIndicator(isOffline) {
  const offlineIndicator = document.getElementById('offline-indicator')
  if (offlineIndicator) {
    if (isOffline) {
      offlineIndicator.classList.add('visible')
    } else {
      offlineIndicator.classList.remove('visible')
    }
  }
}

// Function to handle online/offline status changes
function handleConnectionChange() {
  const isCurrentlyOffline = !navigator.onLine
  updateOfflineIndicator(isCurrentlyOffline)

  if (isCurrentlyOffline) {
    console.log('App is now offline - showing offline indicator')
  } else {
    console.log('App is now online - hiding offline indicator')
  }
}

// Debug function to manually test offline indicator (temporary)
window.debugOfflineIndicator = function (show = true) {
  console.log(`Debug: ${show ? 'Showing' : 'Hiding'} offline indicator`)
  updateOfflineIndicator(show)
  return show
}

// Function to load data from Supabase or cache
async function loadDataFromSupabase() {
  try {
    // If offline, skip Supabase loading
    if (!navigator.onLine) {
      console.log('Offline mode: Skipping Supabase data loading')
      return
    }

    // Temporarily disabled Supabase loading - always fall back to local data
    throw new Error('Supabase temporarily disabled - using local data')

    // const { data, error } = await supabase
    //   .from('lotto_draws')
    //   .select('*')
    //   .order('draw_date', { ascending: false })

    // if (error) throw error

    // // Convert Supabase data to the original format
    // lottoMaxWinningNumbers2023 = data.map((draw) => ({
    //   date: draw.draw_date,
    //   numbers: draw.numbers,
    //   bonus: draw.bonus,
    //   jackpot: draw.jackpot,
    // }))

    // console.log(
    //   'Loaded',
    //   lottoMaxWinningNumbers2023.length,
    //   'draws from Supabase'
    // )

    // // Cache the data for offline use
    // localStorage.setItem('lotto-cached-data', JSON.stringify(lottoMaxWinningNumbers2023));

    // // Update the global variable that the original script uses
    // window.lottoMaxWinningNumbers2023 = lottoMaxWinningNumbers2023
  } catch (error) {
    console.log('Supabase loading failed (this is normal):', error.message)
    // Local data should already be loaded by loadDataScript()
  }
}

// Function to load local data script (returns Promise)
function loadDataScript() {
  console.log('loadDataScript called')
  return new Promise((resolve, reject) => {
    // Always reload data.js after navigation to ensure proper initialization
    // The early return was causing issues when navigating back from /game
    console.log(
      'Loading fresh data.js script (always reload after navigation)...'
    )

    // Try to load from cache as fallback
    const cachedData = localStorage.getItem('lotto-cached-data')
    if (cachedData) {
      try {
        window.lottoMaxWinningNumbers2023 = JSON.parse(cachedData)
        console.log(
          'Preloaded data from cache as fallback:',
          window.lottoMaxWinningNumbers2023.length,
          'draws'
        )
      } catch (error) {
        console.log('Failed to parse cached data, will load fresh')
      }
    }

    // Always load fresh data.js
    console.log('Loading fresh data.js script...')
    const script = document.createElement('script')
    script.src = '/lotto-enhanced/data.js'
    script.onload = () => {
      // Cache the loaded data for offline use
      if (window.lottoMaxWinningNumbers2023) {
        localStorage.setItem(
          'lotto-cached-data',
          JSON.stringify(window.lottoMaxWinningNumbers2023)
        )
        console.log(
          'Loaded and cached fresh lotto data:',
          window.lottoMaxWinningNumbers2023.length,
          'draws'
        )
        resolve()
      } else {
        console.error('Data script loaded but no data found')
        reject(new Error('No data found in script'))
      }
    }
    script.onerror = () => {
      console.error('Failed to load lotto data script')
      reject(new Error('Failed to load data script'))
    }
    document.head.appendChild(script)
  })
}

// Function to save user's saved numbers to Supabase
async function saveToSupabase(numbers) {
  // Temporarily disabled
  return
  // try {
  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser()
  //   if (!user) return

  //   const { error } = await supabase.from('user_saved_numbers').insert({
  //     user_id: user.id,
  //     numbers: numbers,
  //     created_at: new Date().toISOString(),
  //   })

  //   if (error) throw error
  //   console.log('Saved numbers to Supabase')
  // } catch (error) {
  //   console.error('Error saving to Supabase:', error)
  // }
}

// Function to load user's saved numbers from Supabase
async function loadUserSavedNumbers() {
  // Temporarily disabled
  return
  // try {
  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser()
  //   if (!user) return

  //   const { data, error } = await supabase
  //     .from('user_saved_numbers')
  //     .select('*')
  //     .eq('user_id', user.id)
  //     .order('created_at', { ascending: false })

  //   if (error) throw error

  //   // Update localStorage with Supabase data
  //   if (data && data.length > 0) {
  //     const savedNumbers = data.map((item) => item.numbers)
  //     localStorage.setItem('savedNumbers', JSON.stringify(savedNumbers))
  //   }
  // } catch (error) {
  //   console.error('Error loading saved numbers from Supabase:', error)
  // }
}

// Override the original save function to also save to Supabase
const originalSaveToLocalStorage = window.saveToLocalStorage
window.saveToLocalStorage = function (sequence) {
  // Call original function
  if (originalSaveToLocalStorage) {
    originalSaveToLocalStorage(sequence)
  }
  // Also save to Supabase
  saveToSupabase(sequence.split('-').map(Number))
}

// Show loading spinner
function showDataLoader() {
  const loader = document.getElementById('dataLoader')
  if (loader) {
    loader.classList.remove('hidden')
    loader.style.display = 'flex' // Ensure it's visible
    loader.style.backgroundColor = 'rgba(0, 0, 0, 0.9)' // Make sure background is visible
    loader.style.zIndex = '99999' // Ensure it's on top
    console.log(
      'Data loader shown - should see spinner and "Loading data..." text'
    )

    // Check if loading text is present
    const loadingText = loader.querySelector('.loading-text')
    if (loadingText) {
      console.log('Loading text found:', loadingText.textContent)
    } else {
      console.log('Loading text element not found!')
    }
  } else {
    console.log('Data loader element not found - check if HTML loaded properly')
  }
}

// Hide loading spinner
function hideDataLoader() {
  const loader = document.getElementById('dataLoader')
  if (loader) {
    loader.classList.add('hidden')
    console.log('Data loader hidden')
  } else {
    console.log('Data loader element not found when trying to hide')
  }
}

// Initialize the app
async function initializeEnhancedLotto() {
  console.log('Initializing enhanced lotto...')
  // Loader should already be visible by default, just ensure it's shown
  showDataLoader()

  // Add minimum loading time so user can see the spinner
  const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 1000))

  // Set Supabase credentials from parent
  window.SUPABASE_URL =
    window.parent.SUPABASE_URL || localStorage.getItem('supabase_url')
  window.SUPABASE_ANON_KEY =
    window.parent.SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key')

  try {
    console.log('🔄 Step 1: Loading data.js...')
    await loadDataScript()
    console.log('✅ Step 1 complete: data.js loaded')

    console.log('🔄 Step 2: Loading Supabase data...')
    await loadDataFromSupabase()
    console.log('✅ Step 2 complete: Supabase check done')

    console.log('🔄 Step 3: Loading user saved numbers...')
    await loadUserSavedNumbers()
    console.log('✅ Step 3 complete: User data loaded')

    console.log('🔄 Step 4: Waiting for minimum loading time...')
    await minLoadingTime
    console.log('✅ Step 4 complete: Minimum time elapsed')
  } catch (error) {
    console.error('❌ Error during initialization step:', error)
    console.error('Error stack:', error.stack)
    // Wait for minimum time even on error, then hide loader
    await minLoadingTime
    hideDataLoader()
    return
  }

  // Now load the original script ONLY after data is confirmed loaded
  const loadOriginalScript = () => {
    // Critical: Verify data exists before loading script.js
    if (
      !window.lottoMaxWinningNumbers2023 ||
      window.lottoMaxWinningNumbers2023.length === 0
    ) {
      console.error('❌ CRITICAL: Cannot load script.js - no data available!')
      console.error(
        'window.lottoMaxWinningNumbers2023:',
        window.lottoMaxWinningNumbers2023
      )
      hideDataLoader()
      return
    }

    console.log(
      '✅ Data confirmed available, loading script.js with',
      window.lottoMaxWinningNumbers2023.length,
      'draws'
    )

    const script = document.createElement('script')
    script.type = 'module'
    script.src = '/lotto-enhanced/script.js'
    script.onerror = () => {
      console.log(
        'Original script failed to load, continuing with enhanced features only'
      )
      // Hide loader even if script fails
      hideDataLoader()
    }
    script.onload = () => {
      console.log('Original script loaded successfully')
      // Initialize sumText with placeholder immediately after script loads
      setTimeout(() => {
        const sumDiv = document.querySelector('.sumText')
        if (sumDiv) {
          // Always trigger initial calculation to show placeholder
          if (typeof window.calculateAndDisplaySum === 'function') {
            window.calculateAndDisplaySum()
            console.log(
              'sumText initialized with placeholder from enhanced-script'
            )
          } else {
            console.log('calculateAndDisplaySum function not found on window')
          }
        } else {
          console.log('sumText element not found')
        }

        // Hide loading spinner - everything is ready
        hideDataLoader()
        console.log('App fully initialized - loader hidden')

        // Verify data loaded
        if (
          window.lottoMaxWinningNumbers2023 &&
          window.lottoMaxWinningNumbers2023.length > 0
        ) {
          console.log(
            '✅ Data verification: Lottery data loaded successfully -',
            window.lottoMaxWinningNumbers2023.length,
            'draws available'
          )
        } else {
          console.log('❌ Data verification: No lottery data found!')
        }
      }, 500) // Increased timeout to ensure DOM and script are fully ready
    }
    script.onerror = () => {
      console.log(
        'Original script failed to load, continuing with enhanced features only'
      )
      // Hide loader even if script fails
      hideDataLoader()
    }
    document.body.appendChild(script)
  }

  // Ensure DOM is ready before loading script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOriginalScript)
  } else {
    loadOriginalScript()
  }

  console.log('🎯 Initialization complete - script loading initiated')
}

// Start initialization
console.log('Starting enhanced lotto initialization...')

// IMMEDIATE fallback: Hide loader if it's still visible after 2 seconds
setTimeout(() => {
  const loader = document.getElementById('dataLoader')
  if (loader && loader.style.display !== 'none') {
    console.log('🔴 IMMEDIATE FALLBACK: Force hiding stuck loader')
    loader.style.display = 'none'
    loader.style.visibility = 'hidden'
    loader.classList.add('hidden')
  }
}, 2000)

initializeEnhancedLotto().catch((error) => {
  console.error('Failed to initialize enhanced lotto:', error)
  // Make sure to hide loader on any error
  hideDataLoader()
})

// Fallback: Hide loader after 5 seconds if something goes wrong
setTimeout(() => {
  const loader = document.getElementById('dataLoader')
  if (loader && !loader.classList.contains('hidden')) {
    console.log(
      '⚠️ FALLBACK: Hiding loader after 5 seconds - something went wrong'
    )
    hideDataLoader()
  }
}, 5000)

// More aggressive fallback after 3 seconds
setTimeout(() => {
  const loader = document.getElementById('dataLoader')
  if (loader && !loader.classList.contains('hidden')) {
    console.log('🚨 EMERGENCY: Force hiding loader after 3 seconds')
    loader.style.display = 'none'
    loader.classList.add('hidden')
  }
}, 3000)

// Initialize offline indicator immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOfflineIndicator)
} else {
  initOfflineIndicator()
}

// Initialize offline indicator immediately when script loads
function initOfflineIndicator() {
  // Initialize offline indicator - only show when actually offline
  updateOfflineIndicator(!navigator.onLine)

  // Listen for online/offline events
  window.addEventListener('online', handleConnectionChange)
  window.addEventListener('offline', handleConnectionChange)

  console.log(
    'Offline indicator initialized, current status:',
    !navigator.onLine ? 'OFFLINE' : 'ONLINE'
  )
}

// Add sticky behavior after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add lotto-active class to body
  document.body.classList.add('lotto-active')

  // Initialize offline indicator
  initOfflineIndicator()

  // Add sticky scroll detection
  setTimeout(() => {
    const stickyWrapper = document.getElementById('stickyWrapper')
    if (stickyWrapper) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          stickyWrapper.classList.toggle(
            'is-stuck',
            entry.intersectionRatio < 1
          )
        },
        { threshold: [1] }
      )
      observer.observe(stickyWrapper)
    }

    // Add scroll direction detection for top bar animation
    let lastScrollTop = 0
    let ticking = false
    const topNav = document.querySelector('.topNav')
    const hamburgerMenu = document.getElementById('hamburger-menu')

    function updateTopBarVisibility() {
      // Since we're inside the lotto content, use document scroll
      const scrollTop =
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        window.pageYOffset ||
        0

      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down - hide top bar
        if (topNav) topNav.classList.add('hidden')
        if (hamburgerMenu) hamburgerMenu.classList.add('hidden')
      } else {
        // Scrolling up - show top bar
        if (topNav) topNav.classList.remove('hidden')
        if (hamburgerMenu) hamburgerMenu.classList.remove('hidden')
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
      ticking = false
    }

    // Throttle scroll events for performance
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateTopBarVisibility)
        ticking = true
      }
    }

    // Attach scroll listener to document since content is loaded dynamically
    document.addEventListener('scroll', handleScroll, true)
    window.addEventListener('scroll', handleScroll, true)
  }, 500) // Small delay to ensure elements are rendered
})
