// Cache clearing script - forces refresh of all cached content
console.log('🧹 CACHE CLEARING SCRIPT ACTIVATED')

// Clear all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    console.log('🗑️ Found service workers:', registrations.length)
    for (let registration of registrations) {
      console.log('🗑️ Unregistering SW:', registration.scope)
      registration.unregister()
    }
  })
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function (names) {
    console.log('🗑️ Found caches:', names)
    for (let name of names) {
      console.log('🗑️ Deleting cache:', name)
      caches.delete(name)
    }
  })
}

// Clear localStorage
localStorage.clear()
console.log('🗑️ Cleared localStorage')

// Clear sessionStorage
sessionStorage.clear()
console.log('🗑️ Cleared sessionStorage')

console.log('✅ CACHE CLEARING COMPLETE - Please hard refresh the page')
