/* Tio Urso Studio - PWA 1.1.19. Cache seguro e isolado por versao. */
const CACHE = 'tio-urso-studio-shell-1119a';
const PREFIX = 'tio-urso-studio-';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './intro-pwa.js', './icon-192.png', './icon-512.png',
  './icon-maskable-512.png', './apple-touch-icon.png',
  './app.js', './style.css', './mock3d.js', './tio-mp4.js'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(FILES.map(file => cache.add(new Request(new URL(file, self.registration.scope), {cache:'reload'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  if(url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  // A página de diagnóstico consulta a rede e não deve ser respondida pelo cache.
  if(url.pathname.endsWith('/diagnostico-pwa.html')) return;
  const isAppShell = req.mode === 'navigate' || /\.(html|js|css)$/i.test(url.pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if(isAppShell) {
      try {
        const fresh = await fetch(req);
        if(fresh.ok) event.waitUntil(cache.put(req, fresh.clone()));
        return fresh;
      } catch(_) {
        return (await cache.match(req, {ignoreSearch:true})) ||
               (req.mode === 'navigate' ? await cache.match(new URL('./index.html',self.registration.scope)) : undefined) ||
               Response.error();
      }
    }
    const cached = await cache.match(req,{ignoreSearch:true});
    if(cached) return cached;
    try {
      const response = await fetch(req);
      if(response.ok && response.type === 'basic') event.waitUntil(cache.put(req,response.clone()));
      return response;
    } catch(_) { return Response.error(); }
  })());
});
