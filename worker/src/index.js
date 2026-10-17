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

   Aucun journal : le Worker n'écrit jamais rien dans la console, et les journaux Cloudflare sont coupés (wrangler.toml).
   Aucun secret : rien ici ni dans wrangler.toml ne doit rester caché. */

import { CT_MAX, CORPS_MAX, DUREE, GARDE, ID, B64, EMPREINTE, SQL } from "./regles.js";

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

async function lireCorps(requete){
  const t = await requete.text();
  if(t.length > CORPS_MAX) return { trop: true };
  try{ const x = JSON.parse(t); return x && typeof x === "object" && !Array.isArray(x) ? { x } : {}; }catch{ return {}; }
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

  // Tâche quotidienne : efface le contenu des liens expirés, puis oublie les identifiants après un an de plus
  async scheduled(_evenement, env){
    const maintenant = Date.now();
    await env.DB.prepare(SQL.expirer).bind(maintenant).run();
    await env.DB.prepare(SQL.oublier).bind(maintenant - GARDE).run();
  }
};
