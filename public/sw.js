// Basic service worker for TraxMax
// This prevents 404 errors when the browser tries to load sw.js

const CACHE_NAME = 'traxmax-v1'
const urlsToCache = [
  '/',
  '/lotto-enhanced',
  '/lotto-enhanced/lotto.html',
  '/lotto-enhanced/style.css',
  '/lotto-enhanced/script.js',
  '/lotto-enhanced/enhanced-script.js',
  '/lotto-enhanced/data.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
