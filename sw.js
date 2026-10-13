// Cache hors-ligne : l'app fonctionne sans réseau à la salle.
// Réseau d'abord, en contournant le cache HTTP, pour recevoir les mises à jour tout de suite.
const VERSION = '29';
const CACHE = 'volleyfit-v' + VERSION;
const ASSETS = ['./', './index.html', './css/style.css?v=' + VERSION, './js/data.js?v=' + VERSION, './js/figures.js?v=' + VERSION, './js/i18n.js?v=' + VERSION, './js/app.js?v=' + VERSION, './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    fetch(sameOrigin ? new Request(e.request, { cache: 'no-cache' }) : e.request).then(res => {
      if (res.ok && sameOrigin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('./index.html')))
  );
});
