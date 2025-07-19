// Service Worker version - increment this to force cache update
const CACHE_VERSION = 'v2'
const CACHE_NAME = `lotto-enhanced-${CACHE_VERSION}`

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/lotto-enhanced',
  '/lotto-enhanced/lotto.html',
  '/lotto-enhanced/style.css',
  '/lotto-enhanced/script.js',
  '/lotto-enhanced/enhanced-script.js',
  '/lotto-enhanced/data.js',
  '/offline.html',
  '/images/android-chrome-192x192.png',
  '/images/android-chrome-512x512.png',
  '/images/apple-touch-icon.png',
  '/images/favicon-16x16.png',
  '/images/favicon-32x32.png',
  '/sounds/correct_sound.mp3',
  '/sounds/correct_sound.wav',
  '/sounds/GAME_MENU_SCORE_SFX001143.wav',
  '/sounds/guess_19.wav',
  '/sounds/guess_23.wav',
  '/sounds/guess_28.wav',
  '/sounds/guess_31.wav',
  '/sounds/guess_40.wav',
  '/sounds/guess_47.wav',
  '/sounds/guess_sound.mp3',
  '/sounds/guess_sound.wav',
  '/sounds/xguess_sound.wav',
  // Local fonts
  '/fonts/Lexend-VariableFont_wght.ttf',
  '/fonts/static/Lexend-Regular.ttf',
  '/fonts/static/Lexend-Bold.ttf',
  '/fonts/static/Lexend-SemiBold.ttf',
  '/fonts/static/Lexend-Medium.ttf',
  '/fonts/static/Lexend-Light.ttf',
  // Google Fonts - cache the specific fonts being used
  'https://fonts.googleapis.com/css?family=Lexend',
  'https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;400;500;600;700;800;900&family=Trispace:wght@500&display=swap',
]

// Runtime cache strategies
const RUNTIME_CACHE = {
  // Cache first for fonts
  fonts: {
    name: 'fonts-cache',
    pattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com/,
    strategy: 'cacheFirst',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  // Network first for API calls
  api: {
    name: 'api-cache',
    pattern: /^https:\/\/.*\.supabase\.co/,
    strategy: 'networkFirst',
    maxAge: 60 * 5, // 5 minutes
  },
  // Cache first for images
  images: {
    name: 'images-cache',
    pattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
    strategy: 'cacheFirst',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
}

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become active
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim()) // Take control of all pages immediately
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle runtime caching strategies
  for (const [key, config] of Object.entries(RUNTIME_CACHE)) {
    if (config.pattern.test(url.href)) {
      event.respondWith(handleRuntimeCache(request, config))
      return
    }
  }

  // Default strategy for other requests
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }

        // Clone the request
        const fetchRequest = request.clone()

        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache the fetched response for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (request.destination === 'document') {
          return caches.match('/offline.html')
        }
        // Return a 404 response for other failed requests
        return new Response('Network error happened', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        })
      })
  )
})

// Handle runtime cache based on strategy
async function handleRuntimeCache(request, config) {
  const cache = await caches.open(config.name)

  if (config.strategy === 'cacheFirst') {
    const cached = await cache.match(request)
    if (cached) {
      // Update cache in background
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone())
        }
      })
      return cached
    }

    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  }

  if (config.strategy === 'networkFirst') {
    try {
      const response = await fetch(request)
      if (response && response.status === 200) {
        cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      const cached = await cache.match(request)
      if (cached) {
        return cached
      }
      throw error
    }
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
