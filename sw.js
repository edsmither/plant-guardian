const CACHE_NAME = 'plant-guardian-v1';
const WAPI = 'https://api.open-meteo.com/v1/forecast';

// Cache app shell on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(['/plant-guardian/']))
  );
  self.skipWaiting();
});

// Clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network first, fall back to cache
self.addEventListener('fetch', e => {
  if (e.request.url.includes('open-meteo.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
  }
});

// Listen for messages from the app to trigger notification check
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CHECK_ALERTS') {
    const { alerts, url } = e.data;
    if (alerts && alerts.length > 0) {
      const title = alerts.length === 1 ? alerts[0] : `${alerts.length} plant alerts today`;
      const body = alerts.length === 1 ? 'Check Plant Guardian for details.' : alerts.join(', ');
      self.registration.showNotification('🌿 Plant Guardian', {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌿</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌿</text></svg>',
        tag: 'plant-alert-today',
        renotify: false,
        data: { url: url || '/' }
      });
    }
  }
});

// Open app when notification is clicked
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cls => {
      if (cls.length > 0) { cls[0].focus(); return; }
      clients.openWindow(e.notification.data.url || '/plant-guardian/');
    })
  );
});
