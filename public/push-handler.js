// Service worker push event handler — injected via workbox importScripts
// Runs in SW context: self = ServiceWorkerGlobalScope

self.addEventListener('push', (event) => {
  let data = { title: 'Two Wheels Zone Back Office', body: 'New stock request pending approval', url: '/approvals' }
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch (_) { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'stock-request-pending',
      renotify: true,
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/approvals'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      const existing = clients.find((c) => c.url.includes(url) || c.url.includes('/approvals'))
      if (existing && 'focus' in existing) return existing.focus()
      // Otherwise open a new tab
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
