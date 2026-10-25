// Keeps the menu page working with no internet after the first visit (the menu itself is inside the QR).
// Network-first: a visit with internet always gets the latest files, so a fix shipped after a customer's
// first scan actually reaches them. Only a genuinely offline (or very slow) visit falls back to whatever
// was cached on an earlier, online visit — that cache is kept fresh on every online visit automatically.
const CACHE = 'rasoi-menu-v2';
const FILES = ['./', './index.html', './codec.js', './pako_inflate.min.js', './qrcode.js'];
const NET_TIMEOUT_MS = 4000;

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const net = fetch(e.request).then((res) => {
      caches.open(CACHE).then((c) => c.put(e.request, res.clone())).catch(() => {});
      return res;
    }).catch(() => null);
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NET_TIMEOUT_MS));
    const res = await Promise.race([net, timeout]);
    if (res) return res;
    const hit = await caches.match(e.request, { ignoreSearch: true });
    return hit || caches.match('./index.html');
  })());
});
