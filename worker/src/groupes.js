/* Ose Demander — invitations de groupe (un lien partagé à plusieurs personnes, chacune répond).

   Le Worker ne voit jamais le contenu : l'invitation est chiffrée dans le navigateur (lien court existant, table liens,
   même identifiant que le groupe) ; chaque réponse est chiffrée sur l'appareil de la personne invitée vers la clé publique
   de l'organisateur (ECDH P-256 + HKDF + AES-GCM), clé publique cachée dans l'invitation chiffrée. Le Worker ne garde que
   des blocs chiffrés, leur nombre et leurs dates, l'empreinte de la clé de gestion (organisateur) et l'empreinte du jeton
   de modification de chaque réponse (personne invitée).

   Routes (POST, JSON ; la clé de gestion est toujours dans le corps, jamais dans l'adresse) :
     POST /v1/groupes                               {id, ct, gestion, expire} -> 201 {expire}   crée l'invitation (liens) et le groupe
     POST /v1/groupes/:id/reponses                   {rid, blob, edit}        -> 201 {ok}       423 clôturé, 410 expiré/supprimé, 429 {erreur:"plein"}
     POST /v1/groupes/:id/reponses/:rid/modifier     {blob, jeton}            -> 200 {ok}       403 jeton faux
     POST /v1/groupes/:id/reponses/:rid/retirer      {jeton}                  -> 200 {ok}       la personne invitée supprime sa réponse (même clôturé)
     POST /v1/groupes/:id/reponses/:rid/supprimer    {gestion}                -> 200 {ok}
     POST /v1/groupes/:id/lire                       {gestion}                -> 200 {ferme, expire, reponses:[{rid, blob, maj}]}
     POST /v1/groupes/:id/cloturer                   {gestion, ferme}         -> 200 {ferme}    clôturer (true) ou rouvrir (false)
     POST /v1/groupes/:id/abo                        {gestion, abo | null}    -> 200 {ok}       notifications des nouvelles réponses
     POST /v1/groupes/:id/supprimer                  {gestion}                -> 200 {ok}       efface réponses, invitation, abonnement
   La personne invitée lit l'invitation par GET /v1/liens/:id (route des liens courts), qui ajoute ferme:true si les
   réponses sont clôturées. */
import { ID, B64, EMPREINTE, SQL, CT_MAX, CORPS_MAX, GROUPE_REP_MAX, GROUPE_BLOB_MIN, GROUPE_BLOB_MAX, GROUPE_CORPS_MAX,
  GROUPE_DUREE_MAX, GROUPE_GARDE, GROUPE_NOTIF_ECART } from "./regles.js";
import { scellerAbo, ouvrirAbo, envoyerPush } from "./push.js";

const JETON = /^[A-Za-z0-9_-]{43}$/;
const blobOk = b => typeof b === "string" && B64.test(b) && b.length >= GROUPE_BLOB_MIN && b.length <= GROUPE_BLOB_MAX;
const champs = (x, liste) => x && Object.keys(x).sort().join() === [...liste].sort().join();

export async function groupes(requete, env, permise, m, o){
  const { reponse, lireCorps, limite, egal, empreinte, aboValide } = o;
  const [, id, rid, actionRep, action] = m;
  if(requete.method !== "POST") return reponse(405, { erreur: "methode" }, permise);
  const maintenant = Date.now();

  // Créer : l'invitation chiffrée (table liens, comme un lien court) et le groupe, ensemble
  if(!id){
    if(!await limite(env.LIMITE_CREATION, requete)) return reponse(429, { erreur: "limite" }, permise);
    const { x, trop } = await lireCorps(requete, CORPS_MAX);
    if(trop) return reponse(413, { erreur: "taille" }, permise);
    if(!champs(x, ["id", "ct", "gestion", "expire"]) || typeof x.id !== "string" || !ID.test(x.id) || typeof x.ct !== "string" || !B64.test(x.ct)
      || typeof x.gestion !== "string" || !EMPREINTE.test(x.gestion) || !Number.isSafeInteger(x.expire) || x.expire <= maintenant)
      return reponse(400, { erreur: "contenu" }, permise);
    if(x.ct.length > CT_MAX) return reponse(413, { erreur: "taille" }, permise);
    const expire = Math.min(x.expire, maintenant + GROUPE_DUREE_MAX);
    if(await env.DB.prepare(SQL.lire).bind(x.id).first() || await env.DB.prepare(SQL.groupeLire).bind(x.id).first()) return reponse(409, { erreur: "existe" }, permise);
    // L'empreinte de la clé de gestion sert aussi de jeton de suppression du lien court
    await env.DB.prepare(SQL.creer).bind(x.id, x.ct, x.gestion, expire).run();
    await env.DB.prepare(SQL.groupeCreer).bind(x.id, x.gestion, expire, maintenant).run();
    return reponse(201, { expire }, permise);
  }
  if(!ID.test(id) || (rid !== undefined && !ID.test(rid))) return reponse(404, { erreur: "introuvable" }, permise);
  const g = await env.DB.prepare(SQL.groupeLire).bind(id).first();
  const fini = () => !g ? reponse(404, { erreur: "introuvable" }, permise)
    : g.etat ? reponse(410, { raison: g.etat }, permise)
    : g.expire < maintenant ? reponse(410, { raison: "expire" }, permise) : null;

  // Répondre (personne invitée)
  if(rid === undefined && action === undefined && actionRep === undefined && m[0].endsWith("/reponses")){
    if(!await limite(env.LIMITE_ENVOI, requete)) return reponse(429, { erreur: "limite" }, permise);
    const { x, trop } = await lireCorps(requete, GROUPE_CORPS_MAX);
    if(trop) return reponse(413, { erreur: "taille" }, permise);
    if(!champs(x, ["rid", "blob", "edit"]) || typeof x.rid !== "string" || !ID.test(x.rid) || !blobOk(x.blob) || typeof x.edit !== "string" || !EMPREINTE.test(x.edit))
      return reponse(400, { erreur: "contenu" }, permise);
    const f = fini(); if(f) return f;
    if(g.ferme) return reponse(423, { erreur: "ferme" }, permise);
    if((await env.DB.prepare(SQL.reponsesCompter).bind(id).first()).n >= GROUPE_REP_MAX) return reponse(429, { erreur: "plein" }, permise);
    if(await env.DB.prepare(SQL.reponseLire).bind(x.rid).first()) return reponse(409, { erreur: "existe" }, permise);
    await env.DB.prepare(SQL.reponseCreer).bind(x.rid, id, x.blob, x.edit, maintenant).run();
    if(g.abo) await env.DB.prepare(SQL.groupeNouvelle).bind(id).run();
    return reponse(201, { ok: true }, permise);
  }

  // Modifier sa réponse (personne invitée, avec son jeton)
  if(actionRep === "modifier"){
    if(!await limite(env.LIMITE_ENVOI, requete)) return reponse(429, { erreur: "limite" }, permise);
    const { x, trop } = await lireCorps(requete, GROUPE_CORPS_MAX);
    if(trop) return reponse(413, { erreur: "taille" }, permise);
    if(!champs(x, ["blob", "jeton"]) || !blobOk(x.blob) || typeof x.jeton !== "string" || !JETON.test(x.jeton)) return reponse(400, { erreur: "contenu" }, permise);
    const f = fini(); if(f) return f;
    const r = await env.DB.prepare(SQL.reponseLire).bind(rid).first();
    if(!r || r.groupe_id !== id) return reponse(404, { erreur: "introuvable" }, permise);
    if(!egal(await empreinte(x.jeton), r.edit)) return reponse(403, { erreur: "jeton" }, permise);
    if(g.ferme) return reponse(423, { erreur: "ferme" }, permise);
    await env.DB.prepare(SQL.reponseModifier).bind(x.blob, maintenant, rid).run();
    if(g.abo) await env.DB.prepare(SQL.groupeNouvelle).bind(id).run();
    return reponse(200, { ok: true }, permise);
  }

  // Retirer sa réponse (personne invitée, avec son jeton) : effacée tout de suite, même si les réponses sont clôturées
  if(actionRep === "retirer"){
    if(!await limite(env.LIMITE_ENVOI, requete)) return reponse(429, { erreur: "limite" }, permise);
    const { x, trop } = await lireCorps(requete, GROUPE_CORPS_MAX);
    if(trop) return reponse(413, { erreur: "taille" }, permise);
    if(!champs(x, ["jeton"]) || typeof x.jeton !== "string" || !JETON.test(x.jeton)) return reponse(400, { erreur: "contenu" }, permise);
    const f = fini(); if(f) return f;
    const r = await env.DB.prepare(SQL.reponseLire).bind(rid).first();
    if(!r || r.groupe_id !== id) return reponse(404, { erreur: "introuvable" }, permise);
    if(!egal(await empreinte(x.jeton), r.edit)) return reponse(403, { erreur: "jeton" }, permise);
    await env.DB.prepare(SQL.reponseEffacer).bind(rid).run();
    return reponse(200, { ok: true }, permise);
  }

  // Organisateur : toutes les autres actions demandent la clé de gestion
  if(!["lire", "cloturer", "abo", "supprimer"].includes(action) && actionRep !== "supprimer") return reponse(404, { erreur: "route" }, permise);
  if(!await limite(env.LIMITE_ABO, requete)) return reponse(429, { erreur: "limite" }, permise);
  const { x, trop } = await lireCorps(requete, GROUPE_CORPS_MAX);
  if(trop) return reponse(413, { erreur: "taille" }, permise);
  if(!x || typeof x.gestion !== "string" || !JETON.test(x.gestion)) return reponse(400, { erreur: "contenu" }, permise);
  if(!g) return reponse(404, { erreur: "introuvable" }, permise);
  if(!egal(await empreinte(x.gestion), g.gestion)) return reponse(403, { erreur: "gestion" }, permise);
  const f = fini(); if(f) return f;

  if(actionRep === "supprimer"){
    if(!champs(x, ["gestion"])) return reponse(400, { erreur: "contenu" }, permise);
    const r = await env.DB.prepare(SQL.reponseLire).bind(rid).first();
    if(!r || r.groupe_id !== id) return reponse(404, { erreur: "introuvable" }, permise);
    await env.DB.prepare(SQL.reponseEffacer).bind(rid).run();
    return reponse(200, { ok: true }, permise);
  }
  if(action === "lire"){
    if(!champs(x, ["gestion"])) return reponse(400, { erreur: "contenu" }, permise);
    const { results = [] } = await env.DB.prepare(SQL.reponsesLire).bind(id).all();
    return reponse(200, { ferme: !!g.ferme, expire: g.expire, reponses: results.map(r => ({ rid: r.id, blob: r.blob, maj: r.maj })) }, permise);
  }
  if(action === "cloturer"){
    if(!champs(x, ["gestion", "ferme"]) || typeof x.ferme !== "boolean") return reponse(400, { erreur: "contenu" }, permise);
    await env.DB.prepare(SQL.groupeFermer).bind(x.ferme ? 1 : 0, id).run();
    return reponse(200, { ferme: x.ferme }, permise);
  }
  if(action === "abo"){
    if(!champs(x, ["gestion", "abo"]) || (x.abo !== null && !aboValide(x.abo))) return reponse(400, { erreur: "contenu" }, permise);
    if(x.abo !== null && (!env.VAPID_PRIVEE || !env.VAPID_PUBLIQUE || !env.CLE_STOCKAGE)) return reponse(503, { erreur: "indisponible" }, permise);
    await env.DB.prepare(SQL.groupeAbo).bind(x.abo === null ? null : await scellerAbo(x.abo, id, env), id).run();
    return reponse(200, { ok: true }, permise);
  }
  // Supprimer l'invitation : réponses effacées, contenu chiffré effacé, abonnement effacé ; l'identifiant reste 30 jours
  // (pour afficher « Cette invitation a été supprimée »)
  if(!champs(x, ["gestion"])) return reponse(400, { erreur: "contenu" }, permise);
  await env.DB.prepare(SQL.reponsesEffacerGroupe).bind(id).run();
  await env.DB.prepare(SQL.supprimer).bind(id).run();
  await env.DB.prepare(SQL.groupeFin).bind("supprime", maintenant, id).run();
  return reponse(200, { ok: true }, permise);
}

/* Tâche planifiée : nouvelles réponses à signaler (au plus une notification toutes les 15 minutes par groupe).
   Le message ne contient que l'identifiant du groupe et le nombre de réponses nouvelles ou modifiées : l'appareil de
   l'organisateur compose le texte (« 3 nouvelles réponses à … »). Renvoie le nombre d'envois tentés. */
export async function envoyerGroupes(env, maintenant, lot){
  if(lot <= 0 || !env.VAPID_PRIVEE || !env.VAPID_PUBLIQUE || !env.CLE_STOCKAGE) return 0;
  const { results = [] } = await env.DB.prepare(SQL.groupesASignaler).bind(maintenant - GROUPE_NOTIF_ECART, maintenant, lot).all();
  for(const g of results){
    try{
      const statut = await envoyerPush(await ouvrirAbo(g.abo, g.id, env), new TextEncoder().encode(JSON.stringify({ v: 1, k: "grp", i: g.id, n: g.notif_n })), env);
      if(statut === 404 || statut === 410) await env.DB.prepare(SQL.groupeAbo).bind(null, g.id).run(); // l'appareil s'est désabonné
      else await env.DB.prepare(SQL.groupeSignale).bind(maintenant, statut >= 200 && statut < 300 ? 0 : g.notif_n, g.id).run(); // échec : nouvel essai 15 min plus tard
    }catch{ try{ await env.DB.prepare(SQL.groupeSignale).bind(maintenant, g.notif_n, g.id).run(); }catch{} }
  }
  return results.length;
}

/* Nettoyage quotidien : groupes expirés (réponses et abonnement effacés), puis identifiants oubliés 30 jours plus tard */
export async function nettoyerGroupes(env, maintenant){
  await env.DB.prepare(SQL.groupesExpirer).bind(maintenant).run();
  await env.DB.prepare(SQL.reponsesOrphelines).bind().run();
  await env.DB.prepare(SQL.groupesOublier).bind(maintenant - GROUPE_GARDE).run();
}
