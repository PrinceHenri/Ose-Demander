/* Ose Demander — service worker
   Rend le site installable et utilisable hors connexion.
   Pour publier une mise à jour importante, change simplement la version ci-dessous. */
const VERSION = "ose-v46";
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
  "./icons/favicon-64.png",
  // Fichiers chargés à part par index.html : l'empreinte de leur contenu (?v=) est écrite par node outils/csp.mjs.
  // Gardés dès l'installation : une invitation ouverte une fois s'affiche sans réseau, scènes comprises.
  "./app/scenes.js?v=ad35c435a6",
  "./app/creer.js?v=4a182b6814",
  "./app/demo.js?v=def882fa95",
  "./app/scanner.js?v=37e73826ea",
  "./app/groupe-orga.js?v=b0a718225b",
  "./app/groupe-invite.js?v=3419a5a6a6",
  "./app/groupe-commun.js?v=66e41f012b",
  "./app/mascotte.js?v=f9b63ed54c",
  "./app/mascotte-amour.js?v=32b32c9a66",
  "./app/mascotte-noel.js?v=1b570c3612",
  "./app/creer.css?v=de1fe39325"
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
    const r = indexedDB.open(NOTIF_DB, 4); // 2 : notifications de révélation (« revelations ») ; 3 : rappels 3 h avant (« rdv ») ; 4 : groupes (« groupes »)
    r.onupgradeneeded = () => { const db = r.result, mk = (n, k) => { if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: k }); };
      mk("cles", "nid"); mk("reponses", "nid"); mk("revelations", "id"); mk("rdv", "id"); mk("groupes", "id"); };
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
/* Rappel « 3 h avant » : le message ne contient que l'identifiant ; titre, heure et lieu ont été rangés sur cet appareil.
   Sans eux (données effacées entre-temps), une notification générique. */
const hFr = ms => { const x = new Date(ms); return x.getHours() + " h" + (x.getMinutes() ? " " + String(x.getMinutes()).padStart(2, "0") : ""); };
const dansFr = min => { const m = Math.max(5, Math.round(min / 5) * 5), h = Math.floor(m / 60), r = m % 60; return h ? h + " h" + (r ? " " + String(r).padStart(2, "0") : "") : r + " min"; };
function rdvTexte(x, now = Date.now()) {
  if (!x || typeof x.titre !== "string" || !x.titre || !Number.isFinite(x.rdv)) return { title: "⏰ Ton rendez-vous approche", body: "Touche pour le retrouver dans « Mes invitations »." };
  const min = (x.rdv - now) / 60000, lieu = typeof x.lieu === "string" ? x.lieu.slice(0, 80) : "";
  return { title: `⏰ ${min >= 5 ? "Dans " + dansFr(min) : "C'est l'heure"} : ${x.titre.slice(0, 80)}`, body: `Rendez-vous à ${hFr(x.rdv)}${lieu ? ", " + lieu : ""}.` };
}
async function onRdv(id) {
  let x = null;
  try {
    x = /^[A-Za-z0-9_-]{22}$/.test(id) ? await notifStore("rdv", "readonly", st => st.get(id)) : null;
    // Parti : l'entrée est oubliée, avec celles dont le rendez-vous est passé depuis plus d'un jour
    const vieilles = (await notifStore("rdv", "readonly", st => st.getAll())).filter(e => e.id === id || !(e.rdv > Date.now() - 864e5));
    if (vieilles.length) await notifStore("rdv", "readwrite", st => { for (const e of vieilles) st.delete(e.id); });
  } catch (e) {}
  const t = rdvTexte(x);
  await self.registration.showNotification(t.title, { body: t.body, icon: "icons/icon-192.png", badge: "icons/favicon-64.png", tag: "rdv-" + id, data: { url: "./#mes-invitations" } });
}
/* Invitation de groupe : nouvelles réponses (au plus une notification toutes les 15 minutes par groupe). Le message ne contient
   que l'identifiant du groupe et le nombre ; la question et le nom du groupe ont été rangés sur cet appareil à l'activation. */
function grpTexte(x, n) {
  const k = Number.isInteger(n) && n > 0 && n <= 1000 ? n : 0, quoi = k > 1 ? `${k} nouvelles réponses` : "Nouvelle réponse";
  if (x && typeof x.q === "string" && x.q) {
    const pour = typeof x.t === "string" && x.t ? `Pour ${x.t.slice(0, 30)}. ` : "";
    return { title: `${quoi} à « ${x.q.slice(0, 80)} »`, body: pour + "Touche pour les voir." };
  }
  return { title: `${quoi} à ton invitation`, body: "Touche pour les voir dans « Mes invitations »." };
}
async function onGroupe(id, n) {
  let x = null;
  try { x = /^[A-Za-z0-9_-]{22}$/.test(id) ? await notifStore("groupes", "readonly", st => st.get(id)) : null; } catch (e) {}
  const t = grpTexte(x, n);
  // Même étiquette pour un groupe : une nouvelle notification remplace la précédente
  await self.registration.showNotification(t.title, { body: t.body, icon: "icons/icon-192.png", badge: "icons/favicon-64.png", tag: "grp-" + id,
    data: { url: x ? "./#groupe=" + id : "./#mes-invitations" } });
}
async function onPush(event) {
  let m = null; try { m = event.data ? event.data.json() : null; } catch (e) {}
  if (m && m.k === "rv") return onReveal(String(m.i || ""));
  if (m && m.k === "rdv") return onRdv(String(m.i || ""));
  if (m && m.k === "grp") return onGroupe(String(m.i || ""), m.n);
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
