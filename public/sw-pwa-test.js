// PWA Test Service Worker with comprehensive offline support
const CACHE_NAME = 'pwa-test-v1'
const OFFLINE_URL = '/pwa-test'

// Essential files to cache for offline functionality
const urlsToCache = [
  '/pwa-test',
  '/lotto-enhanced',
  '/lotto-enhanced/lotto.html',
  '/lotto-enhanced/style.css',
  '/lotto-enhanced/script.js',
  '/lotto-enhanced/enhanced-script.js',
  '/lotto-enhanced/data.js',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/favicon.ico',
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[PWA SW] Installing...')
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA SW] Caching app shell')
        return cache
          .addAll(
            urlsToCache.map((url) => new Request(url, { mode: 'no-cors' }))
          )
          .catch((err) => {
            console.log('[PWA SW] Some resources failed to cache:', err)
            // Try to cache each URL individually
            return Promise.allSettled(
              urlsToCache.map((url) =>
                cache
                  .add(new Request(url, { mode: 'no-cors' }))
                  .catch((e) => console.log(`Failed to cache ${url}:`, e))
              )
            )
          })
      })
      .then(() => {
        console.log('[PWA SW] Installation successful')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[PWA SW] Activating...')
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[PWA SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[PWA SW] Activation complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        console.log('[PWA SW] Serving from cache:', event.request.url)
        return response
      }

      // Try to fetch from network
      return fetch(event.request)
        .then((fetchResponse) => {
          // Check if valid response
          if (
            !fetchResponse ||
            fetchResponse.status !== 200 ||
            fetchResponse.type !== 'basic'
          ) {
            return fetchResponse
          }

          // Clone the response for caching
          const responseToCache = fetchResponse.clone()

          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return fetchResponse
        })
        .catch(() => {
          console.log('[PWA SW] Network failed, serving offline page')

          // For navigation requests, serve the PWA test page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }

          // For other requests, return a generic offline response
          return new Response(
            JSON.stringify({
              error: 'Offline',
              message: 'No network connection available',
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
            }
          )
        })
    })
  )
})

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[PWA SW] Background sync triggered:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform any sync operations here
      console.log('[PWA SW] Performing background sync')
    )
  }
})

// Push notification support
self.addEventListener('push', (event) => {
  console.log('[PWA SW] Push message received')

  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/favicon.ico',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification('TraxMax PWA', options))
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[PWA SW] Notification click received')

  event.notification.close()

  if (event.action === 'open') {
    event.waitUntil(clients.openWindow('/pwa-test'))
  }
})

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[PWA SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})
