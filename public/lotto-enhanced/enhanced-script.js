// Enhanced LOTTO script with Supabase integration
// This script loads after authentication and enhances the original functionality

// Import Supabase client
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Initialize Supabase (these will be set from the parent React component)
// const supabaseUrl = window.SUPABASE_URL || ''
// const supabaseAnonKey = window.SUPABASE_ANON_KEY || ''
// const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Load the original data first
let lottoMaxWinningNumbers2023 = []

// Function to load data from Supabase
async function loadDataFromSupabase() {
  try {
    // Temporarily disabled Supabase loading
    throw new Error('Supabase temporarily disabled')

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

    // // Update the global variable that the original script uses
    // window.lottoMaxWinningNumbers2023 = lottoMaxWinningNumbers2023
  } catch (error) {
    console.log('Loading local data instead of Supabase')
    // Fall back to loading from local data.js
    const script = document.createElement('script')
    script.src = '/lotto-enhanced/data.js'
    document.head.appendChild(script)
  }
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

// Initialize the app
async function initializeEnhancedLotto() {
  // Set Supabase credentials from parent
  window.SUPABASE_URL =
    window.parent.SUPABASE_URL || localStorage.getItem('supabase_url')
  window.SUPABASE_ANON_KEY =
    window.parent.SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key')

  // Load data from Supabase
  await loadDataFromSupabase()

  // Load user's saved numbers
  await loadUserSavedNumbers()

  // Now load the original script
  const script = document.createElement('script')
  script.type = 'module'
  script.src = '/lotto-enhanced/script.js'
  document.body.appendChild(script)
}

// Start initialization
initializeEnhancedLotto()

// Add sticky behavior after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add lotto-active class to body
  document.body.classList.add('lotto-active')

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
