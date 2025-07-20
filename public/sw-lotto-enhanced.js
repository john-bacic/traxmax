// Service Worker for Lotto Enhanced - Comprehensive offline support
const CACHE_NAME = 'lotto-enhanced-v1'
const OFFLINE_URL = '/lotto-enhanced'

// Essential files to cache for offline functionality
const urlsToCache = [
  '/lotto-enhanced',
  '/lotto-enhanced/lotto.html',
  '/lotto-enhanced/style.css',
  '/lotto-enhanced/script.js',
  '/lotto-enhanced/enhanced-script.js',
  '/lotto-enhanced/data.js',
  '/manifest.json',
  '/pwa-test/offline-lotto',
  '/pwa-test',
  '/favicon.ico',
  // Cache some essential Next.js assets
  '/_next/static/css/',
  '/_next/static/chunks/',
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Lotto Enhanced SW] Installing...')
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Lotto Enhanced SW] Caching app shell')
        // Cache each URL individually to avoid failures
        return Promise.allSettled(
          urlsToCache.map((url) =>
            cache
              .add(new Request(url, { mode: 'no-cors' }))
              .catch((e) => console.log(`Failed to cache ${url}:`, e))
          )
        )
      })
      .then(() => {
        console.log('[Lotto Enhanced SW] Installation successful')
        return self.skipWaiting()
      })
      .catch((err) => {
        console.log('[Lotto Enhanced SW] Installation failed:', err)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Lotto Enhanced SW] Activating...')
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('lotto-')) {
              console.log('[Lotto Enhanced SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      self.clients.claim(),
    ]).then(() => {
      console.log('[Lotto Enhanced SW] Activation complete')
    })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and non-http requests
  if (!request.url.startsWith('http')) return

  // Special handling for lotto-enhanced pages
  if (request.url.includes('/lotto-enhanced')) {
    event.respondWith(handleLottoEnhancedRequest(request))
    return
  }

  // General caching strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[Lotto Enhanced SW] Serving from cache:', request.url)
        return cachedResponse
      }

      // Try to fetch from network
      return fetch(request)
        .then((response) => {
          // Check if valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response
          }

          // Clone for caching
          const responseToCache = response.clone()

          // Cache the response for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          console.log('[Lotto Enhanced SW] Network failed for:', request.url)

          // For navigation requests, return the main page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL) || createOfflineResponse()
          }

          // For other requests, return a basic offline response
          return createOfflineResponse()
        })
    })
  )
})

// Handle lotto-enhanced specific requests with priority caching
async function handleLottoEnhancedRequest(request) {
  try {
    // Try cache first for lotto-enhanced resources
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      console.log(
        '[Lotto Enhanced SW] Serving lotto content from cache:',
        request.url
      )

      // For the main page, try to update cache in background
      if (
        request.url.includes('/lotto-enhanced') &&
        !request.url.includes('.')
      ) {
        fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone())
              })
            }
          })
          .catch(() => {
            // Ignore network errors in background update
          })
      }

      return cachedResponse
    }

    // Try network
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log(
      '[Lotto Enhanced SW] Request failed, serving offline content:',
      request.url
    )

    // Return cached version or offline fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return main offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL) || createOfflineResponse()
    }

    return createOfflineResponse()
  }
}

// Create a basic offline response
function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    }
  )
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[Lotto Enhanced SW] Background sync triggered:', event.tag)

  if (event.tag === 'lotto-data-sync') {
    event.waitUntil(syncLottoData())
  }
})

// Sync lotto data when connection is restored
async function syncLottoData() {
  try {
    console.log('[Lotto Enhanced SW] Syncing lotto data...')

    // Attempt to fetch fresh data
    const dataResponse = await fetch('/lotto-enhanced/data.js')
    if (dataResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put('/lotto-enhanced/data.js', dataResponse)
      console.log('[Lotto Enhanced SW] Lotto data synced successfully')
    }
  } catch (error) {
    console.log('[Lotto Enhanced SW] Sync failed:', error)
  }
}

// Push notification support for lotto updates
self.addEventListener('push', (event) => {
  console.log('[Lotto Enhanced SW] Push message received')

  const options = {
    body: event.data ? event.data.text() : 'New lottery results available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'lotto-update',
    },
    actions: [
      {
        action: 'view',
        title: 'View Results',
        icon: '/favicon.ico',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification('🎰 Lotto Enhanced', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Lotto Enhanced SW] Notification click received')

  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/lotto-enhanced'))
  }
})

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[Lotto Enhanced SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_LOTTO_DATA') {
    // Cache specific lotto data
    caches.open(CACHE_NAME).then((cache) => {
      cache.put('/lotto-enhanced/data.js', new Response(event.data.data))
    })
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      cached: true,
      timestamp: Date.now(),
    })
  }
})
