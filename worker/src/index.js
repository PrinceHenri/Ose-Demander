/* Ose Demander — service des liens courts (Cloudflare Worker, publié sur workers.dev)

   Le Worker ne voit jamais une invitation en clair : le navigateur chiffre l'invitation (AES-GCM, clé de 128 bits
   tirée au hasard) et n'envoie que le contenu chiffré. La clé reste dans le lien, après le « # » : elle n'est jamais
   envoyée. Le Worker garde le contenu chiffré un an au plus, puis l'efface (tâche quotidienne).

   Routes (toutes en JSON, jamais mises en cache) :
     POST /v1/liens              {id, ct, del}  -> 201 {expire}       crée un lien (409 si l'identifiant existe déjà)
     GET  /v1/liens/:id                          -> 200 {ct}           404 introuvable, 410 {raison: "expire" | "supprime"}
     POST /v1/liens/:id/supprimer {jeton}        -> 200 {ok}           403 si le jeton est faux, 404, 410
   id  : 22 caractères base64url (128 bits aléatoires, tirés par le navigateur)
   ct  : contenu chiffré, base64url, 16 Ko au plus
   del : empreinte SHA-256 (base64url, 43 caractères) du jeton de suppression ; le jeton reste sur l'appareil qui a créé le lien

   Notifications de réponse (facultatives) :
     POST /v1/notifs              {id, abo, del, expire} -> 201 {expire}   abonnement Web Push de l'appareil qui crée l'invitation
     POST /v1/notifs/:id/reponse  {c}                    -> 200 {ok}       envoie la réponse chiffrée (c) puis efface l'abonnement ;
                                                                          404 introuvable, 410 {raison: "envoye" | "expire" | "supprime"}, 502 envoi impossible
     POST /v1/notifs/:id/supprimer {jeton}               -> 200 {ok}       l'appareil qui s'est abonné y renonce
   abo : {endpoint, keys: {p256dh, auth}}, endpoint chez un service de notification connu (HOTES_PUSH) ; chiffré au repos
   c   : réponse chiffrée dans le navigateur de la personne invitée (clé du lien) : oui ou non et le créneau, rien d'autre
   Aucune route de lecture : ouvrir une invitation n'appelle jamais le Worker (aucun suivi des ouvertures).

   Notifications de révélation (facultatives, la personne invitée s'abonne pour son propre appareil) :
     POST /v1/rappels              {abo, envois: [{id, heure}], del} -> 201 {n}   une ligne par heure de révélation (6 au plus)
     POST /v1/rappels/:id/supprimer {jeton}                         -> 200 {ok}  la personne y renonce (case décochée)
   La tâche planifiée (chaque minute) envoie {v:1, k:"rv", i:id} à l'heure prévue, puis efface l'abonnement.
   Ni le lien, ni sa clé, ni les prénoms, ni la surprise : l'appareil retrouve l'invitation grâce à l'identifiant.
   Clés (secrets Cloudflare, jamais dans le dépôt) : VAPID_PRIVEE, CLE_STOCKAGE ; VAPID_PUBLIQUE est publique (wrangler.toml).

   Aucun journal : le Worker n'écrit jamais rien dans la console, et les journaux Cloudflare sont coupés (wrangler.toml).
   Aucun secret : rien ici ni dans wrangler.toml ne doit rester caché. */

import { CT_MAX, CORPS_MAX, DUREE, GARDE, ID, B64, EMPREINTE, SQL,
  NOTIF_MAX, NOTIF_GARDE, NOTIF_CORPS_MAX, REPONSE_MAX, HOTES_PUSH, P256, AUTH,
  RAPPEL_MAX, RAPPEL_LOT, RAPPEL_MIN, RAPPEL_GARDE, RAPPEL_REESSAI } from "./regles.js";
import { envoyerPush, scellerAbo, ouvrirAbo, deB64 } from "./push.js";

const origines = env => String(env.ORIGINES || "https://osedemander.fr").split(",").map(s => s.trim()).filter(Boolean);

function reponse(statut, corps, origine){
  const h = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",            // ni Cloudflare ni le navigateur ne gardent de copie (lien supprimé ou expiré)
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin"
  });
  if(origine){
    h.set("Access-Control-Allow-Origin", origine);
    h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    h.set("Access-Control-Allow-Headers", "Content-Type");
    h.set("Access-Control-Max-Age", "600");
  }
  return new Response(corps === null ? null : JSON.stringify(corps), { status: statut, headers: h });
}

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const empreinte = async jeton => b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(jeton)));
// Comparaison en temps constant (le temps de réponse ne dit rien du jeton)
function egal(a, b){ if(a.length !== b.length) return false; let d = 0; for(let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

async function lireCorps(requete, max = CORPS_MAX){
  const t = await requete.text();
  if(t.length > max) return { trop: true };
  try{ const x = JSON.parse(t); return x && typeof x === "object" && !Array.isArray(x) ? { x } : {}; }catch{ return {}; }
}
// Abonnement Web Push : exactement {endpoint, keys: {p256dh, auth}}, chez un service de notification connu, en https
function aboValide(a){
  if(!a || typeof a !== "object" || Array.isArray(a) || Object.keys(a).sort().join() !== "endpoint,keys") return false;
  if(typeof a.endpoint !== "string" || a.endpoint.length > 1024) return false;
  let u; try{ u = new URL(a.endpoint); }catch{ return false; }
  if(!HOTES_PUSH.test(u.hostname) || !a.endpoint.startsWith("https://" + u.hostname + "/")) return false; // https, sans port ni identifiants
  const k = a.keys;
  if(!k || typeof k !== "object" || Array.isArray(k) || Object.keys(k).sort().join() !== "auth,p256dh") return false;
  if(typeof k.p256dh !== "string" || !P256.test(k.p256dh) || deB64(k.p256dh)[0] !== 4) return false; // point P-256 non compressé
  return typeof k.auth === "string" && AUTH.test(k.auth);
}

async function notifs(requete, env, permise, id, action){
  const fin = etat => env.DB.prepare(SQL.notifFin).bind(etat, id).run();
  const cles = () => env.VAPID_PRIVEE && env.VAPID_PUBLIQUE && env.CLE_STOCKAGE;
  // S'abonner
  if(requete.method === "POST" && !id){
    if(!await limite(env.LIMITE_ABO, requete)) return reponse(429, { erreur: "limite" }, permise);
    const { x, trop } = await lireCorps(requete, NOTIF_CORPS_MAX);
    if(trop) return reponse(413, { erreur: "taille" }, permise);
    const maintenant = Date.now();
    if(!x || typeof x.id !== "string" || !ID.test(x.id) || !aboValide(x.abo) || typeof x.del !== "string" || !EMPREINTE.test(x.del)
      || !Number.isSafeInteger(x.expire) || x.expire <= maintenant || Object.keys(x).some(k => !["id", "abo", "del", "expire"].includes(k)))
      return reponse(400, { erreur: "contenu" }, permise);
    if(!cles()) return reponse(503, { erreur: "indisponible" }, permise);
    const expire = Math.min(x.expire, maintenant + NOTIF_MAX);
    try{ await env.DB.prepare(SQL.notifCreer).bind(x.id, await scellerAbo(x.abo, x.id, env), x.del, expire).run(); }
    catch(e){ if(/UNIQUE|constraint/i.test(String(e && e.message))) return reponse(409, { erreur: "existe" }, permise); throw e; }
    return reponse(201, { expire }, permise);
  }
  if(!id || !ID.test(id) || !action) return reponse(404, { erreur: "introuvable" }, permise);
  if(requete.method !== "POST") return reponse(405, { erreur: "methode" }, permise);
  // Envoyer la réponse (une seule fois : l'abonnement est effacé dès que le service de notification l'a acceptée)
  if(action === "/reponse"){
    if(!await limite(env.LIMITE_ENVOI, requete)) return reponse(429, { erreur: "limite" }, permise);
    const { x, trop } = await lireCorps(requete, NOTIF_CORPS_MAX);
    if(trop || !x || typeof x.c !== "string" || !B64.test(x.c) || x.c.length < 40 || x.c.length > REPONSE_MAX || Object.keys(x).length !== 1)
      return reponse(400, { erreur: "contenu" }, permise);
    const l = await env.DB.prepare(SQL.notifLire).bind(id).first();
    if(!l) return reponse(404, { erreur: "introuvable" }, permise);
    if(l.etat) return reponse(410, { raison: l.etat }, permise);
    if(l.expire < Date.now() || !l.abo){ await fin("expire"); return reponse(410, { raison: "expire" }, permise); }
    if(!cles()) return reponse(503, { erreur: "indisponible" }, permise);
    const statut = await envoyerPush(await ouvrirAbo(l.abo, id, env), new TextEncoder().encode(JSON.stringify({ v: 1, i: id, c: x.c })), env);
    if(statut >= 200 && statut < 300){ await fin("envoye"); return reponse(200, { ok: true }, permise); }
    if(statut === 404 || statut === 410){ await fin("expire"); return reponse(410, { raison: "expire" }, permise); } // l'appareil s'est désabonné
    return reponse(502, { erreur: "envoi" }, permise); // erreur passagère : l'abonnement est gardé, la personne peut réessayer
  }
  // Renoncer (seulement avec le jeton gardé par l'appareil qui s'est abonné)
  if(!await limite(env.LIMITE_ABO, requete)) return reponse(429, { erreur: "limite" }, permise);
  const { x, trop } = await lireCorps(requete, NOTIF_CORPS_MAX);
  if(trop || !x || typeof x.jeton !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(x.jeton)) return reponse(400, { erreur: "contenu" }, permise);
  const l = await env.DB.prepare(SQL.notifLire).bind(id).first();
  if(!l) return reponse(404, { erreur: "introuvable" }, permise);
  if(!egal(await empreinte(x.jeton), l.del)) return reponse(403, { erreur: "jeton" }, permise);
  if(l.etat) return reponse(410, { raison: l.etat }, permise);
  await fin("supprime");
  return reponse(200, { ok: true }, permise);
}

// Notifications de révélation : s'abonner (une ligne par heure) ou y renoncer
async function rappels(requete, env, permise, id){
  if(requete.method !== "POST") return reponse(405, { erreur: "methode" }, permise);
  if(!await limite(env.LIMITE_ABO, requete)) return reponse(429, { erreur: "limite" }, permise);
  const { x, trop } = await lireCorps(requete, NOTIF_CORPS_MAX);
  if(trop) return reponse(413, { erreur: "taille" }, permise);
  if(id){ // renoncer, avec le jeton gardé sur l'appareil
    if(!ID.test(id) || !x || typeof x.jeton !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(x.jeton) || Object.keys(x).length !== 1) return reponse(400, { erreur: "contenu" }, permise);
    const l = await env.DB.prepare(SQL.rappelLire).bind(id).first();
    if(!l) return reponse(404, { erreur: "introuvable" }, permise);
    if(!egal(await empreinte(x.jeton), l.del)) return reponse(403, { erreur: "jeton" }, permise);
    if(l.etat) return reponse(410, { raison: l.etat }, permise);
    await env.DB.prepare(SQL.rappelFin).bind("supprime", id).run();
    return reponse(200, { ok: true }, permise);
  }
  const maintenant = Date.now(), e = x && x.envois;
  const envoiOk = v => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join() === "heure,id"
    && typeof v.id === "string" && ID.test(v.id) && Number.isSafeInteger(v.heure) && v.heure >= maintenant + RAPPEL_MIN && v.heure <= maintenant + NOTIF_MAX;
  if(!x || Object.keys(x).sort().join() !== "abo,del,envois" || !aboValide(x.abo) || typeof x.del !== "string" || !EMPREINTE.test(x.del)
    || !Array.isArray(e) || e.length < 1 || e.length > RAPPEL_MAX || !e.every(envoiOk) || new Set(e.map(v => v.id)).size !== e.length)
    return reponse(400, { erreur: "contenu" }, permise);
  if(!env.VAPID_PRIVEE || !env.VAPID_PUBLIQUE || !env.CLE_STOCKAGE) return reponse(503, { erreur: "indisponible" }, permise);
  for(const v of e) if(await env.DB.prepare(SQL.rappelLire).bind(v.id).first()) return reponse(409, { erreur: "existe" }, permise);
  for(const v of e) await env.DB.prepare(SQL.rappelCreer).bind(v.id, await scellerAbo(x.abo, v.id, env), x.del, v.heure, v.heure).run();
  return reponse(201, { n: e.length }, permise);
}
/* Tâche planifiée : envoie les notifications de révélation arrivées à échéance, RAPPEL_LOT au plus par passage
   (le reste part au passage suivant). Le message ne contient que l'identifiant. */
async function envoyerRappels(env, maintenant){
  if(!env.VAPID_PRIVEE || !env.VAPID_PUBLIQUE || !env.CLE_STOCKAGE) return 0;
  const { results = [] } = await env.DB.prepare(SQL.rappelsDus).bind(maintenant, RAPPEL_LOT).all();
  let n = 0;
  for(const r of results){
    const fin = etat => env.DB.prepare(SQL.rappelFin).bind(etat, r.id).run();
    try{
      if(!r.abo || r.heure + RAPPEL_GARDE < maintenant){ await fin("expire"); continue; } // trop tard : effacé sans envoi
      const statut = await envoyerPush(await ouvrirAbo(r.abo, r.id, env), new TextEncoder().encode(JSON.stringify({ v: 1, k: "rv", i: r.id })), env);
      if(statut >= 200 && statut < 300){ await fin("envoye"); n++; }
      else if(statut === 404 || statut === 410) await fin("expire"); // l'appareil s'est désabonné
      else await env.DB.prepare(SQL.rappelReessai).bind(maintenant + RAPPEL_REESSAI, r.id).run();
    }catch{ try{ await env.DB.prepare(SQL.rappelReessai).bind(maintenant + RAPPEL_REESSAI, r.id).run(); }catch{} }
  }
  return n;
}

// Limite par adresse IP (compteur du limiteur de Cloudflare, en mémoire : aucune adresse n'est enregistrée)
async function limite(limiteur, requete){
  if(!limiteur) return true;
  try{ return (await limiteur.limit({ key: requete.headers.get("CF-Connecting-IP") || "?" })).success; }catch{ return true; }
}

export default {
  async fetch(requete, env){
    const url = new URL(requete.url), o = requete.headers.get("Origin");
    const permise = o && origines(env).includes(o) ? o : null;
    if(o && !permise) return reponse(403, { erreur: "origine" }, null); // une page d'un autre site ne peut rien faire
    if(requete.method === "OPTIONS") return reponse(204, null, permise);
    const rp = url.pathname.match(/^\/v1\/rappels(?:\/([^/]+)\/supprimer)?$/);
    if(rp){ try{ return await rappels(requete, env, permise, rp[1]); }catch{ return reponse(503, { erreur: "indisponible" }, permise); } }
    const n = url.pathname.match(/^\/v1\/notifs(?:\/([^/]+)(\/reponse|\/supprimer)?)?$/);
    if(n){ try{ return await notifs(requete, env, permise, n[1], n[2]); }catch{ return reponse(503, { erreur: "indisponible" }, permise); } }
    const m = url.pathname.match(/^\/v1\/liens(?:\/([^/]+)(\/supprimer)?)?$/);
    if(!m) return reponse(404, { erreur: "route" }, permise);
    const [, id, supprimer] = m;
    try{
      // Créer
      if(requete.method === "POST" && !id){
        if(!await limite(env.LIMITE_CREATION, requete)) return reponse(429, { erreur: "limite" }, permise);
        const { x, trop } = await lireCorps(requete);
        if(trop) return reponse(413, { erreur: "taille" }, permise);
        if(!x || typeof x.id !== "string" || !ID.test(x.id) || typeof x.ct !== "string" || !B64.test(x.ct)
          || typeof x.del !== "string" || !EMPREINTE.test(x.del) || Object.keys(x).some(k => !["id", "ct", "del"].includes(k)))
          return reponse(400, { erreur: "contenu" }, permise);
        if(x.ct.length > CT_MAX) return reponse(413, { erreur: "taille" }, permise);
        const expire = Date.now() + DUREE;
        try{ await env.DB.prepare(SQL.creer).bind(x.id, x.ct, x.del, expire).run(); }
        catch(e){ if(/UNIQUE|constraint/i.test(String(e && e.message))) return reponse(409, { erreur: "existe" }, permise); throw e; }
        return reponse(201, { expire }, permise);
      }
      if(!id || !ID.test(id)) return reponse(404, { erreur: "introuvable" }, permise);
      // Lire
      if(requete.method === "GET" && !supprimer){
        if(!await limite(env.LIMITE_LECTURE, requete)) return reponse(429, { erreur: "limite" }, permise);
        const l = await env.DB.prepare(SQL.lire).bind(id).first();
        if(!l) return reponse(404, { erreur: "introuvable" }, permise);
        if(l.etat === "supprime") return reponse(410, { raison: "supprime" }, permise);
        if(l.etat === "expire" || l.expire < Date.now() || !l.ct) return reponse(410, { raison: "expire" }, permise);
        return reponse(200, { ct: l.ct }, permise);
      }
      // Supprimer (seulement avec le jeton gardé par l'appareil qui a créé le lien)
      if(requete.method === "POST" && supprimer){
        if(!await limite(env.LIMITE_CREATION, requete)) return reponse(429, { erreur: "limite" }, permise);
        const { x, trop } = await lireCorps(requete);
        if(trop || !x || typeof x.jeton !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(x.jeton)) return reponse(400, { erreur: "contenu" }, permise);
        const l = await env.DB.prepare(SQL.lire).bind(id).first();
        if(!l) return reponse(404, { erreur: "introuvable" }, permise);
        if(!egal(await empreinte(x.jeton), l.del)) return reponse(403, { erreur: "jeton" }, permise);
        if(l.etat) return reponse(410, { raison: l.etat }, permise);
        await env.DB.prepare(SQL.supprimer).bind(id).run();
        return reponse(200, { ok: true }, permise);
      }
      return reponse(405, { erreur: "methode" }, permise);
    }catch{
      // Base indisponible ou quota gratuit atteint : le site repasse au lien long
      return reponse(503, { erreur: "indisponible" }, permise);
    }
  },

  // Tâche planifiée, chaque minute : envoie les notifications de révélation arrivées à échéance.
  // Une fois par jour (3 h 17 UTC, ou appel sans heure prévue) : efface le contenu des liens expirés, puis oublie les identifiants
  // après un an de plus ; efface les abonnements expirés jamais utilisés, puis oublie leurs identifiants 30 jours plus tard.
  async scheduled(evenement, env){
    const maintenant = Date.now(), h = evenement && evenement.scheduledTime ? new Date(evenement.scheduledTime) : null;
    await envoyerRappels(env, maintenant);
    if(h && !(h.getUTCHours() === 3 && h.getUTCMinutes() === 17)) return;
    await env.DB.prepare(SQL.expirer).bind(maintenant).run();
    await env.DB.prepare(SQL.oublier).bind(maintenant - GARDE).run();
    await env.DB.prepare(SQL.notifExpirer).bind(maintenant).run();
    await env.DB.prepare(SQL.notifOublier).bind(maintenant - NOTIF_GARDE).run();
    await env.DB.prepare(SQL.rappelOublier).bind(maintenant - RAPPEL_GARDE - NOTIF_GARDE).run();
  }
};
