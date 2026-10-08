/* Ose Demander — service worker
   Rend le site installable et utilisable hors connexion.
   Pour publier une mise à jour importante, change simplement la version ci-dessous. */
const VERSION = "ose-v3";
const CORE = [
  "./",
  "./index.html",
  "./mentions-legales.html",
  "./manifest.webmanifest",
  "./fonts/bricolage-grotesque.woff2",
  "./fonts/caveat.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-64.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // on ne touche jamais aux autres sites

  // Pages : réseau d'abord (pour avoir toujours la dernière version), cache si hors connexion.
  // Le contenu des invitations est après le « # » : il n'est jamais envoyé ni mis en cache.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Polices, icônes, images : cache d'abord, puis réseau.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
