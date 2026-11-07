// Mon Capital : fonctionne sans internet. Change VERSION à chaque mise à jour.
const VERSION = "mon-capital-v4";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord (pour recevoir les mises à jour), mais si internet ne répond pas
// en 3 secondes ou est coupé, on ouvre tout de suite la copie gardée dans le téléphone.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request, { ignoreSearch: true }) ||
      (e.request.mode === "navigate" ? await caches.match("./index.html") : undefined);
    const network = fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    });
    if (!cached) return network;
    const timeout = new Promise(res => setTimeout(() => res(cached), 3000));
    return Promise.race([network.catch(() => cached), timeout]);
  })());
});
