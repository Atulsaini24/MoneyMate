/* MoneyMate service worker: offline app shell, never caches API data. */
const CACHE = 'moneymate-v3';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // Only same-origin GETs. Never touch the API, auth or Google endpoints.
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  // Page navigations: network first so deploys show up, cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('/', copy));
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  // Hashed build assets and images: cache first, they never change in place.
  if (url.pathname.startsWith('/assets/') || /\.(png|jpg|svg|webp|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});

// Bill and IOU reminders sent by /api/cron/reminders
self.addEventListener('push', e => {
  let data = { title: 'MoneyMate', body: '', url: '/' };
  try { data = { ...data, ...e.data.json() }; } catch { /* plain text */ }
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/icon-192.png', badge: '/icon-192.png', data: { url: data.url }, tag: data.title,
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(self.location.origin));
    if (open) { open.focus(); return open.navigate(url); }
    return clients.openWindow(url);
  }));
});
