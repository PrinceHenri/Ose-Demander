/* Ose Demander — invitations de groupe : chiffrement et service (chargé à la demande par index.html, voir need).
   Utilisé des deux côtés : personne invitée (répondre, modifier) et organisateur (créer, lire, gérer).

   Liens
     invités      #g=ID.CLÉ     ID et CLÉ comme un lien court (#s=) : l'invitation chiffrée porte la clé publique gp
     organisateur #ga=ID.CLÉ.D  D = scalaire privé de la paire ECDH P-256 (JWK « d », 43 caractères) : lit les réponses
   Clé de gestion = HKDF-SHA-256(d, info « ose-gestion ») : le service n'en garde que l'empreinte SHA-256.

   Réponse chiffrée sur l'appareil de la personne invitée, vers gp (WebCrypto seulement, aucun calcul elliptique ici) :
     ECDH (clé éphémère P-256) -> HKDF-SHA-256 (sel = identifiant du groupe, info « ose-reponse ») -> AES-GCM 128
     données associées « ID.RID » : une réponse recopiée dans un autre groupe ou à une autre place ne se déchiffre plus.
     bloc = version 1 | clé éphémère (65) | IV (12) | contenu chiffré et étiquette ; contenu complété à 128 octets près
     (la taille ne trahit pas la longueur du prénom ou du petit mot).
   Contenu : {p: prénom (1 à 40), r: "o" | "p" | "n", a: accompagnants (0 à 5, 0 pour un Non), m: petit mot (200 au plus)},
   validé strictement à l'envoi ET après chaque déchiffrement (grpValider). */
const GRP_PRENOM_MAX=40, GRP_MOT_MAX=200, GRP_ACC_MAX=5, GRP_BLOB_MAX=2048, GRP_BLOC=128;
const GRP_ID=/^[A-Za-z0-9_-]{22}$/, GRP_D=/^[A-Za-z0-9_-]{43}$/, GRP_GP=/^[A-Za-z0-9_-]{87}$/;
const GRP_INV=/^#g=([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{22})$/, GRP_ORGA=/^#ga=([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/;
const grpEC={name:"ECDH", namedCurve:"P-256"};
const grpHkdf=async (ikm, sel, info, bits)=>new Uint8Array(await crypto.subtle.deriveBits({name:"HKDF", hash:"SHA-256", salt:sel, info:utf8(info)},
  await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]), bits));
const grpSha=async s=>b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", utf8(s))));

/* Liens : fabriquer et relire (null si le format ne convient pas) */
const grpLienInvite = (base, id, key) => `${base}#g=${id}.${key}`;
const grpLienOrga = (base, id, key, d) => `${base}#ga=${id}.${key}.${d}`;
function grpLireHash(hash){
  let m=GRP_ORGA.exec(hash||""); if(m) return {mode:"orga", id:m[1], key:m[2], d:m[3]};
  m=GRP_INV.exec(hash||""); return m ? {mode:"invite", id:m[1], key:m[2]} : null;
}

/* Contenu d'une réponse : {p, r, a, m} propre, ou null. Champs connus seulement, types, longueurs, listes fermées. */
const grpCtl=/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
function grpValider(x){
  if(!x || typeof x!=="object" || Array.isArray(x) || Object.keys(x).some(k=>!["p","r","a","m"].includes(k))) return null;
  if(typeof x.p!=="string" || !["o","p","n"].includes(x.r)) return null;
  const p=x.p.trim(), m=x.m===undefined ? "" : x.m, a=x.a===undefined ? 0 : x.a;
  if(!p || [...p].length>GRP_PRENOM_MAX || grpCtl.test(p)) return null;
  if(typeof m!=="string" || [...m].length>GRP_MOT_MAX || /[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]/.test(m)) return null; // retours à la ligne permis
  if(!Number.isInteger(a) || a<0 || a>GRP_ACC_MAX || (x.r==="n" && a!==0)) return null;
  return {p, r:x.r, a, m:m.trim()};
}

/* Paire de clés de l'organisateur (WebCrypto) : {d, gp} ; gp = clé publique brute (65 octets) en base64url, 87 caractères */
async function grpCles(){
  const k=await crypto.subtle.generateKey(grpEC, true, ["deriveBits"]);
  const jwk=await crypto.subtle.exportKey("jwk", k.privateKey);
  return {d:jwk.d, gp:b64url(new Uint8Array(await crypto.subtle.exportKey("raw", k.publicKey)))};
}
function grpXY(gp){
  if(!GRP_GP.test(gp||"")) throw new Error("gp");
  const raw=unb64url(gp); if(raw.length!==65 || raw[0]!==4) throw new Error("gp");
  return {x:b64url(raw.subarray(1,33)), y:b64url(raw.subarray(33))};
}
/* Clé privée de l'organisateur, rebâtie depuis d (lien #ga=) et la clé publique gp (dans l'invitation) */
const grpClePrivee = (d, gp) => crypto.subtle.importKey("jwk", {kty:"EC", crv:"P-256", d, ...grpXY(gp), ext:false}, grpEC, false, ["deriveBits"]);
/* Clé de gestion (43 caractères) et son empreinte (seule envoyée à la création) */
const grpGestion = async d => { if(!GRP_D.test(d||"")) throw new Error("d"); return b64url(await grpHkdf(unb64url(d), new Uint8Array(0), "ose-gestion", 256)); };

async function grpCleReponse(secret, gid, use){
  return crypto.subtle.importKey("raw", await grpHkdf(new Uint8Array(secret), utf8(gid), "ose-reponse", 128), "AES-GCM", false, [use]);
}
/* Chiffre une réponse (déjà validée) vers gp : le bloc en base64url */
async function grpSceller(gid, rid, rep, gp){
  const propre=grpValider(rep); if(!propre) throw new Error("reponse");
  grpXY(gp); // forme de la clé publique vérifiée avant usage
  const pub=await crypto.subtle.importKey("raw", unb64url(gp), grpEC, false, []);
  const eph=await crypto.subtle.generateKey(grpEC, true, ["deriveBits"]);
  const cle=await grpCleReponse(await crypto.subtle.deriveBits({name:"ECDH", public:pub}, eph.privateKey, 256), gid, "encrypt");
  let txt=JSON.stringify(propre); const n=utf8(txt).length; txt+=" ".repeat(Math.ceil((n+1)/GRP_BLOC)*GRP_BLOC-n); // complété (espaces : JSON valide)
  const iv=rndBytes(12), c=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM", iv, additionalData:utf8(gid+"."+rid)}, cle, utf8(txt)));
  const e=new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const out=new Uint8Array(78+c.length); out[0]=1; out.set(e,1); out.set(iv,66); out.set(c,78);
  return b64url(out);
}
/* Déchiffre une réponse avec la clé privée : {p, r, a, m} validé, ou null (mauvaise clé, bloc déplacé, contenu invalide) */
async function grpOuvrir(gid, rid, blob, priv){
  try{
    if(typeof blob!=="string" || blob.length>GRP_BLOB_MAX) return null;
    const b=unb64url(blob); if(b.length<78+17 || b[0]!==1) return null;
    const eph=await crypto.subtle.importKey("raw", b.subarray(1,66), grpEC, false, []);
    const cle=await grpCleReponse(await crypto.subtle.deriveBits({name:"ECDH", public:eph}, priv, 256), gid, "decrypt");
    const p=await crypto.subtle.decrypt({name:"AES-GCM", iv:b.subarray(66,78), additionalData:utf8(gid+"."+rid)}, cle, b.subarray(78));
    return grpValider(JSON.parse(new TextDecoder().decode(p)));
  }catch(e){ return null; }
}
/* Lien organisateur : d correspond-il à gp ? Essai de chiffrement puis déchiffrement d'une réponse témoin (rien n'est envoyé).
   La clé privée prête à servir, ou une erreur { kind: "orga-invalide" } (« lien organisateur invalide »). */
async function grpVerifierOrga(gid, d, gp){
  const ko=()=>Object.assign(new Error("orga-invalide"), {kind:"orga-invalide"});
  let priv; try{ priv=await grpClePrivee(d, gp); }catch(e){ throw ko(); }
  const temoin={p:"Témoin", r:"o", a:0, m:""}, rid=b64url(rndBytes(16));
  const ok=await grpOuvrir(gid, rid, await grpSceller(gid, rid, temoin, gp), priv);
  if(!ok || ok.p!==temoin.p) throw ko();
  return priv;
}

/* Échéance : dernier créneau + 3 mois ; sans date, création + 6 mois ; un an au plus ; un jour au moins */
function grpExpire(when, now=Date.now()){
  const fois=(when||[]).map(w=>w && w[0] ? new Date(w[0]+"T"+(w[1]||"23:59")).getTime() : NaN).filter(n=>!isNaN(n));
  const t=new Date(fois.length ? Math.max(...fois) : now); t.setMonth(t.getMonth()+(fois.length ? 3 : 6));
  return Math.max(Math.min(t.getTime(), now+365*864e5), now+864e5);
}
/* Résumé : nombre de Oui, Peut-être, Non ; personnes attendues (Oui avec leurs accompagnants) et possibles (Peut-être) */
function grpResume(reponses){
  const s={o:0, p:0, n:0, personnes:0, peutEtre:0};
  for(const r of reponses){ s[r.r]++; if(r.r==="o") s.personnes+=1+r.a; if(r.r==="p") s.peutEtre+=1+r.a; }
  return s;
}

/* ---------- Service (Worker /v1/groupes) ---------- */
async function grpCall(path, corps){
  const ac=new AbortController(), t=setTimeout(()=>ac.abort(), SHORT_TIMEOUT);
  try{ return await shortFetch(SHORT_ORIGIN+"/v1/groupes"+path, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(corps),
    signal:ac.signal, cache:"no-store", credentials:"omit", referrerPolicy:"no-referrer"}); }
  finally{ clearTimeout(t); }
}
/* Code d'erreur commun : "ferme", "expire", "supprime", "plein", "introuvable", "jeton", "limite", "reseau" */
async function grpErreur(r){
  let x={}; try{ x=await r.json(); }catch(e){}
  if(r.status===423) return "ferme";
  if(r.status===410) return x.raison==="supprime" ? "supprime" : "expire";
  if(r.status===429) return x.erreur==="plein" ? "plein" : "limite";
  return {404:"introuvable", 403:"jeton"}[r.status] || "reseau";
}
/* Crée le groupe : le code de l'invitation (qui contient déjà gp et gr:1) est chiffré comme un lien court.
   {etat:"ok", id, key, d, invite, orga} ou {etat: erreur} */
async function grpCreer(code, d, expire, base){
  if(!SHORT_ORIGIN || !globalThis.crypto?.subtle) return {etat:"reseau"};
  try{
    const gestion=await grpEmpreinteGestion(d);
    for(let essai=0; essai<2; essai++){
      const s=await sealShort(code); if(s.ct.length>SHORT_CT_MAX) return {etat:"reseau"};
      const r=await grpCall("", {id:s.id, ct:s.ct, gestion, expire});
      if(r.status===201) return {etat:"ok", id:s.id, key:s.key, d, invite:grpLienInvite(base, s.id, s.key), orga:grpLienOrga(base, s.id, s.key, d)};
      if(r.status!==409) return {etat:await grpErreur(r)};
    }
  }catch(e){}
  return {etat:"reseau"};
}
const grpEmpreinteGestion = async d => grpSha(await grpGestion(d));
/* Personne invitée : envoie sa réponse ; {etat:"ok", rid, jeton} à garder sur l'appareil (modifier plus tard) */
async function grpRepondre(gid, rep, gp){
  try{
    const rid=b64url(rndBytes(16)), jeton=b64url(rndBytes(32));
    const r=await grpCall(`/${gid}/reponses`, {rid, blob:await grpSceller(gid, rid, rep, gp), edit:await grpSha(jeton)});
    return r.status===201 ? {etat:"ok", rid, jeton} : {etat:await grpErreur(r)};
  }catch(e){ return {etat: e && e.message==="reponse" ? "contenu" : "reseau"}; }
}
async function grpModifier(gid, rid, jeton, rep, gp){
  try{
    const r=await grpCall(`/${gid}/reponses/${rid}/modifier`, {blob:await grpSceller(gid, rid, rep, gp), jeton});
    return r.status===200 ? {etat:"ok"} : {etat:await grpErreur(r)};
  }catch(e){ return {etat: e && e.message==="reponse" ? "contenu" : "reseau"}; }
}
/* Organisateur : lit et déchiffre toutes les réponses. Les réponses illisibles ou invalides sont écartées (et comptées). */
async function grpLire(gid, d, priv){
  try{
    const r=await grpCall(`/${gid}/lire`, {gestion:await grpGestion(d)});
    if(r.status!==200) return {etat:await grpErreur(r)};
    const x=await r.json();
    if(!x || !Array.isArray(x.reponses) || x.reponses.length>100) return {etat:"reseau"};
    const reponses=[]; let ignorees=0;
    for(const y of x.reponses){
      const c = y && GRP_ID.test(y.rid||"") && Number.isSafeInteger(y.maj) ? await grpOuvrir(gid, y.rid, y.blob, priv) : null;
      if(c) reponses.push({rid:y.rid, maj:y.maj, ...c}); else ignorees++;
    }
    return {etat:"ok", ferme:x.ferme===true, expire:Number.isSafeInteger(x.expire) ? x.expire : 0, reponses, ignorees};
  }catch(e){ return {etat:"reseau"}; }
}
async function grpGerer(gid, d, chemin, extra={}){
  try{ const r=await grpCall(`/${gid}/${chemin}`, {gestion:await grpGestion(d), ...extra}); return r.status===200 ? "ok" : await grpErreur(r); }
  catch(e){ return "reseau"; }
}
const grpCloturer = (gid, d, ferme) => grpGerer(gid, d, "cloturer", {ferme:!!ferme});
const grpSupprimerReponse = (gid, d, rid) => grpGerer(gid, d, `reponses/${rid}/supprimer`);
const grpSupprimer = (gid, d) => grpGerer(gid, d, "supprimer");
const grpAbo = (gid, d, abo) => grpGerer(gid, d, "abo", {abo});

/* Notifications des nouvelles réponses (organisateur, sur cet appareil) : l'abonnement part au service (chiffré au repos) ;
   la question et le nom du groupe restent ici, dans IndexedDB, pour composer le texte (sw.js, grpTexte).
   Autorisation déjà accordée (demandée pendant le toucher). "ok" | "reseau" */
async function grpNotifActiver(gid, d, info){
  try{
    const abo=await pushAbo(); if(!abo) return "reseau";
    if(await grpAbo(gid, d, abo)!=="ok") return "reseau";
    await notifStore("groupes","readwrite",st=>st.put({id:gid, q:String(info.q||"").slice(0,80), t:String(info.t||"").slice(0,30)}));
    return "ok";
  }catch(e){ return "reseau"; }
}
async function grpNotifCouper(gid, d){
  const r=await grpAbo(gid, d, null);
  try{ await notifStore("groupes","readwrite",st=>st.delete(gid)); }catch(e){}
  return r;
}
async function grpNotifActive(gid){ try{ return !!(await notifStore("groupes","readonly",st=>st.get(gid))); }catch(e){ return false; } }

oseLoaded("groupeCommun", "d17fde3b5a");
