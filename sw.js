// Cache propre à cette app. À changer à chaque mise à jour (v1, v2…).
const PREFIX = 'repetiteur-';
const CACHE = `${PREFIX}v12`;
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); });
// Ne supprime que ses propres caches : d'autres apps peuvent partager le même domaine github.io.
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  const target = request.mode === 'navigate' ? new URL('index.html', self.registration.scope).href : request;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(target);
    if (hit) return hit;
    const res = await fetch(target); // Le cache se répare seul si le navigateur l'a vidé.
    if (res.ok) c.put(target, res.clone());
    return res;
  }));
});

// Toucher la notification de fin ramène sur l'application.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const c = list.find((x) => x.url.startsWith(self.registration.scope));
    return c ? c.focus() : self.clients.openWindow(new URL('./#minuteur', self.registration.scope).href);
  }));
});
