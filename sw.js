/* Ose Demander — service worker
   Rend le site installable et utilisable hors connexion.
   Pour publier une mise à jour importante, change simplement la version ci-dessous. */
const VERSION = "ose-v35";
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
  // Plan du site et consignes aux moteurs de recherche : toujours la version du serveur, jamais de cache
  if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") return;

  // Pages (accueil, pages d'occasion comme /invitation-saint-valentin/, mentions) : réseau d'abord (pour avoir
  // toujours la dernière version), gardées à chaque visite ; hors connexion, la page gardée, sinon l'accueil.
  // Le contenu des invitations est après le « # » : il n'est jamais envoyé ni mis en cache.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } // jamais une page 404
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

/* ---------- Notifications de réponse (voir « Notifications de réponse » dans index.html) ----------
   Le message reçu contient l'identifiant de la notification et la réponse chiffrée par la personne invitée.
   La clé est sur cet appareil (IndexedDB « ose-notifs », magasin « cles ») : la réponse est déchiffrée ici,
   enregistrée dans « reponses » (la page l'ajoute à « Mes invitations »), puis affichée. Rien n'est envoyé nulle part. */
const NOTIF_DB = "ose-notifs";
const b64d = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
function notifDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(NOTIF_DB, 2); // 2 : notifications de révélation (magasin « revelations »)
    r.onupgradeneeded = () => { const db = r.result, mk = (n, k) => { if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: k }); };
      mk("cles", "nid"); mk("reponses", "nid"); mk("revelations", "id"); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function notifStore(store, mode, fn) {
  const db = await notifDb();
  try { return await new Promise((res, rej) => { const tx = db.transaction(store, mode), q = fn(tx.objectStore(store)); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); }
  finally { db.close(); }
}
async function openReply(key, nid, c) {
  const blob = b64d(c);
  if (blob.length < 29 || blob[0] !== 1) throw new Error("format");
  const k = await crypto.subtle.importKey("raw", b64d(key), "AES-GCM", false, ["decrypt"]);
  const p = await crypto.subtle.decrypt({ name: "AES-GCM", iv: blob.subarray(1, 13), additionalData: new TextEncoder().encode(nid) }, k, blob.subarray(13));
  const x = JSON.parse(new TextDecoder().decode(p));
  if (!x || (x.r !== "o" && x.r !== "n")) throw new Error("réponse");
  return { r: x.r, s: Number.isInteger(x.s) && x.s >= 0 && x.s < 3 ? x.s : null };
}
const frWhen = w => {
  const [y, m, d] = w[0].split("-").map(Number), [h, mi] = w[1].split(":");
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " à " + (+h) + " h" + (mi === "00" ? "" : " " + mi);
};
/* Notification de révélation : le message ne contient que l'identifiant ; le lien à rouvrir (le lien de rappel, qui joue la
   mise en scène des surprises) a été rangé sur cet appareil. Le texte ne dévoile jamais la surprise. */
async function onReveal(id) {
  let url = "./";
  try {
    const x = /^[A-Za-z0-9_-]{22}$/.test(id) ? await notifStore("revelations", "readonly", st => st.get(id)) : null;
    if (x && typeof x.lien === "string" && new URL(x.lien).origin === self.location.origin) url = x.lien;
    // Les entrées passées depuis plus de 7 jours sont oubliées
    const vieilles = (await notifStore("revelations", "readonly", st => st.getAll())).filter(e => e.heure < Date.now() - 7 * 864e5);
    if (vieilles.length) await notifStore("revelations", "readwrite", st => { for (const e of vieilles) st.delete(e.id); });
  } catch (e) {}
  await self.registration.showNotification("🔓 Ta surprise est prête !", { body: "Touche pour la découvrir.", icon: "icons/icon-192.png", badge: "icons/favicon-64.png", tag: "rv-" + id, data: { url } });
}
async function onPush(event) {
  let m = null; try { m = event.data ? event.data.json() : null; } catch (e) {}
  if (m && m.k === "rv") return onReveal(String(m.i || ""));
  let title = "Ose Demander", body = "Tu as reçu une réponse à une de tes invitations.";
  const nid = m && typeof m.i === "string" && /^[A-Za-z0-9_-]{22}$/.test(m.i) ? m.i : null;
  try {
    const info = nid && typeof m.c === "string" ? await notifStore("cles", "readonly", st => st.get(nid)) : null;
    if (info) {
      const rep = await openReply(info.key, nid, m.c);
      await notifStore("reponses", "readwrite", st => st.put({ nid, r: rep.r, s: rep.s, at: new Date().toISOString() }));
      // Page déjà ouverte : « Mes invitations » se met à jour tout de suite
      self.clients.matchAll({ type: "window" }).then(l => l.forEach(c => c.postMessage({ type: "ose-reponse" }))).catch(() => {});
      const to = String(info.to || "").slice(0, 30), when = Array.isArray(info.when) ? info.when : [];
      const w = rep.s !== null && when[rep.s] ? when[rep.s] : when.length === 1 ? when[0] : null;
      if (rep.r === "o") { title = `${to} a répondu oui 🎉`; body = w ? `Rendez-vous ${frWhen(w)}.` : "Retrouve sa réponse dans « Mes invitations »."; }
      else { title = `${to} a répondu non`; body = "Merci d'avoir osé demander 💛"; }
    }
  } catch (e) {}
  // Une notification est toujours affichée (exigé par les navigateurs pour chaque message reçu)
  await self.registration.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/favicon-64.png", tag: nid || "ose-reponse", data: { url: "./#mes-invitations" } });
}
self.addEventListener("push", event => event.waitUntil(onPush(event)));
// Toucher la notification : « Mes invitations », dans une fenêtre déjà ouverte si possible
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "./#mes-invitations", self.location.href).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const c = list.find(w => new URL(w.url).origin === self.location.origin);
    if (c) return c.navigate(url).then(w => (w || c).focus()).catch(() => c.focus());
    return self.clients.openWindow(url);
  }));
});
