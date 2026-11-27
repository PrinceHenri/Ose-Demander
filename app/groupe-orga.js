/* Ose Demander — invitation de groupe, côté organisateur : le tableau de bord (chargé à la demande avec app/groupe-commun.js
   et la création, app/creer.js). Ouvert par le lien organisateur #ga=ID.CLÉ.D (sur cet appareil ou un autre : l'invitation
   est alors ajoutée aux Envoyées), puis par #groupe=ID : la clé privée ne reste ni dans la barre d'adresse ni dans
   l'historique du navigateur, elle est relue dans « Mes invitations ». Les réponses sont déchiffrées ici, jamais ailleurs.
   Textes regroupés dans ORGA_TEXTES (clés prêtes pour lang/en.json). */
const ORGA_TEXTES = {
  "orga.titre": "Les réponses",
  "orga.pour": "Pour {pour}, de {de}",
  "orga.chargement": "Chargement des réponses…",
  "orga.o": "Oui", "orga.p": "Peut-être", "orga.n": "Non",
  "orga.personnes": "{n} personne{s} attendue{s}, accompagnants compris.",
  "orga.peutetre": "Et {n} peut-être.",
  "orga.ouvertes": "Réponses ouvertes : le lien du groupe accepte de nouvelles réponses.",
  "orga.closes": "Réponses closes : personne ne peut plus répondre ni modifier sa réponse.",
  "orga.vide": "Aucune réponse pour l'instant. Partage le lien du groupe : les réponses arriveront ici.",
  "orga.avec": "avec {n} personne{s}",
  "orga.ignorees": "{n} réponse{s} illisible{s} écartée{s}.",
  "orga.actualiser": "Actualiser",
  "orga.copier": "Copier le lien du groupe",
  "orga.qr": "QR code du lien invités",
  "orga.cloturer": "Clôturer les réponses",
  "orga.rouvrir": "Rouvrir les réponses",
  "orga.supprimer": "Supprimer l'invitation",
  "orga.suppr.rep": "Supprimer",
  "orga.suppr.rep.titre": "Supprimer cette réponse ?",
  "orga.suppr.rep.texte": "La réponse de {p} sera effacée en ligne. Depuis son appareil, {p} pourra en envoyer une nouvelle.",
  "orga.suppr.titre": "Supprimer l'invitation ?",
  "orga.suppr.texte": "L'invitation et toutes ses réponses seront effacées en ligne. Le lien du groupe affichera « Cette invitation a été supprimée ». C'est définitif.",
  "orga.suppr.ok": "Invitation supprimée",
  "orga.err.reseau": "Impossible de charger les réponses. Vérifie ta connexion, puis actualise.",
  "orga.err.supprime": "Cette invitation a été supprimée : ses réponses ont été effacées.",
  "orga.err.expire": "Cette invitation a expiré : ses réponses ont été effacées.",
  "orga.err.invalide.titre": "Lien organisateur invalide",
  "orga.err.invalide": "Ce lien ne permet pas de lire les réponses de cette invitation. Vérifie que tu l'as copié en entier.",
  "orga.err.absente": "Cette invitation n'est pas dans « Mes invitations » sur cet appareil. Ouvre ton lien organisateur pour la retrouver.",
  "orga.mes": "Mes invitations",
  "orga.err.action": "L'action n'a pas abouti. Vérifie ta connexion, puis réessaie.",
  "orga.notif": "🔔 Me prévenir des nouvelles réponses",
  "orga.notif.off": "Au plus une notification toutes les 15 minutes, sur cet appareil, avec le nombre de nouvelles réponses.",
  "orga.notif.on": "🔔 C'est noté : une notification sur cet appareil quand des réponses arrivent (au plus une toutes les 15 minutes).",
  "orga.notif.refuse": "Notifications non autorisées : reviens ici pour voir les réponses.",
  "orga.notif.bloque": "Les notifications sont bloquées pour ce site. Autorise-les dans les réglages de ton navigateur pour utiliser cette option.",
  "orga.notif.reseau": "La notification n'a pas pu être activée. Réessaie dans un instant."
};
// Styles du tableau de bord (ceux du site : contours encre, ombres décalées, variables du thème)
document.head.insertAdjacentHTML("beforeend", `<style>.grp-compteurs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 10px}.grp-cpt{border:2px solid var(--ink);border-radius:14px;box-shadow:3px 3px 0 var(--ink);background:var(--surface);padding:10px 6px;text-align:center}.grp-cpt b{display:block;font-family:var(--display);font-weight:800;font-size:30px;line-height:1.1;font-variant-numeric:tabular-nums}.grp-cpt span{font-size:14px;font-weight:700;color:var(--muted)}.grp-cpt-o b{color:var(--accent-text)}.grp-total{margin:0 0 4px}.grp-liste{list-style:none;margin:14px 0 18px;padding:0;display:flex;flex-direction:column;gap:10px}.grp-liste li{border:2px solid var(--line);border-radius:14px;padding:12px 14px;background:var(--soft)}.grp-qui{margin:0 0 4px}.grp-rep{display:inline-block;padding:1px 10px;border:2px solid var(--ink);border-radius:999px;font-size:13px;font-weight:700}.grp-rep-o{background:var(--accent-btn);color:var(--accent-ink)}.grp-rep-n{border-color:var(--line);color:var(--muted)}.grp-acc{font-size:14px;color:var(--muted)}.grp-mot{margin:2px 0 8px;white-space:pre-wrap;overflow-wrap:anywhere}</style>`);
const orgaT = (k, v={}) => ORGA_TEXTES[k].replace(/\{(\w+)\}/g, (m, n) => v[n] ?? m);
const orgaPluriel = (k, n) => orgaT(k, {n, s: n>1 ? "s" : ""});

/* Ouvre le tableau de bord : {id, key, d} (lien #ga=) ou {id} (#groupe=, relu dans « Mes invitations ») */
async function renderTableau(arg){
  setTheme("base","n");
  document.title = "Les réponses — Ose Demander";
  const coquille = inner => { $("#app").innerHTML=`<div class="wrap">${topHTML(true)}<section class="panel">
      <a class="back" href="#mes-invitations">Mes invitations</a>${inner}</section></div>`; refreshInstall(); bindSound(true); };
  let id=arg.id, key=arg.key, d=arg.d, entree=null;
  if(!d){
    entree = loadHistory().find(x=>x.orga && GRP_LINK.exec(hashOf(x.link))?.[1]===id);
    const o = entree && GRP_ORGA_LINK.exec(hashOf(entree.orga));
    if(!o){ coquille(`<h2 tabindex="-1">${esc(orgaT("orga.titre"))}</h2><p role="alert">${esc(orgaT("orga.err.absente"))}</p>`); focusScreen(".panel h2"); return; }
    [, id, key, d] = o;
  }
  coquille(`<h2 tabindex="-1">${esc(orgaT("orga.titre"))}</h2><p class="lead" role="status">${esc(orgaT("orga.chargement"))}</p>`);
  mcEcran(".panel .lead", "course");
  focusScreen(".panel h2");
  // L'invitation (pour son titre et sa clé publique), puis la clé privée vérifiée contre la clé publique
  let inv, priv;
  try{ inv=await decodeData(await readShort(id, key)); }
  catch(e){ return tableauErreur(coquille, e.kind==="supprime" ? "orga.err.supprime" : e.kind==="expire" ? "orga.err.expire" : e.kind==="reseau" ? "orga.err.reseau" : "orga.err.invalide"); }
  try{ if(!inv.gp) throw new Error("gp"); priv=await grpVerifierOrga(id, d, inv.gp); }
  catch(e){ return tableauErreur(coquille, "orga.err.invalide", true); }
  // Lien organisateur ouvert : l'invitation rejoint les Envoyées de cet appareil (si elle n'y est pas), puis la clé quitte l'adresse
  const base=location.origin+location.pathname, invite=grpLienInvite(base, id, key), orga=grpLienOrga(base, id, key, d);
  if(!loadHistory().some(x=>x.link===invite)) addGroupeToHistory(inv, invite, orga);
  if(arg.d) history.replaceState(null, "", location.pathname+"#groupe="+id);
  const g={id, key, d, priv, inv, invite};
  await tableauCharger(g, coquille);
}
function tableauErreur(coquille, k, titre=false){
  coquille(`<h2 tabindex="-1">${esc(titre ? orgaT("orga.err.invalide.titre") : orgaT("orga.titre"))}</h2><p role="alert">${esc(orgaT(k))}</p>
    <div class="btns"><a class="btn" href="#mes-invitations">${esc(orgaT("orga.mes"))}</a></div>`);
  focusScreen(".panel h2");
}
/* Lit et affiche les réponses ; garde le résumé sur la carte des Envoyées */
async function tableauCharger(g, coquille){
  const l=await grpLire(g.id, g.d, g.priv);
  if(l.etat!=="ok") return tableauErreur(coquille, l.etat==="supprime" ? "orga.err.supprime" : l.etat==="expire" ? "orga.err.expire" : "orga.err.reseau");
  const s=grpResume(l.reponses);
  orgaGarderResume(g.invite, s);
  const fam=mcFamille(g.inv);
  const liste=[...l.reponses].sort((a,b)=>({o:0,p:1,n:2}[a.r]-{o:0,p:1,n:2}[b.r]) || a.p.localeCompare(b.p, "fr"));
  coquille(`
    <h2 tabindex="-1">${esc(orgaT("orga.titre"))}</h2>
    <p class="lead">${esc(orgaT("orga.pour", {pour:g.inv.t, de:g.inv.f}))}</p>
    ${fam ? `<div id="orgaIllu" aria-hidden="true"></div>` : ""}
    <div class="grp-compteurs" role="group" aria-label="Résumé des réponses">
      ${["o","p","n"].map(k=>`<div class="grp-cpt grp-cpt-${k}"><b>${s[k]}</b><span>${esc(orgaT("orga."+k))}</span></div>`).join("")}
    </div>
    <p class="grp-total"><strong>${esc(orgaPluriel("orga.personnes", s.personnes))}</strong>${s.peutEtre ? ` ${esc(orgaT("orga.peutetre", {n:s.peutEtre}))}` : ""}</p>
    <p class="hint">${esc(orgaT(l.ferme ? "orga.closes" : "orga.ouvertes"))}</p>
    <div id="orgaNotifBox"></div>
    ${liste.length ? `<ul class="grp-liste">${liste.map(r=>`
      <li data-rid="${esc(r.rid)}">
        <p class="grp-qui"><b>${esc(r.p)}</b> <span class="grp-rep grp-rep-${r.r}">${esc(orgaT("orga."+r.r))}</span>${r.a ? ` <span class="grp-acc">${esc(orgaPluriel("orga.avec", r.a))}</span>` : ""}</p>
        ${r.m ? `<p class="grp-mot">${esc(r.m)}</p>` : ""}
        <button type="button" class="btn sm ghost" data-suppr="${esc(r.rid)}" aria-label="${esc(orgaT("orga.suppr.rep"))} : ${esc(r.p)}">${esc(orgaT("orga.suppr.rep"))}</button>
      </li>`).join("")}</ul>` : `<p class="empty">${esc(orgaT("orga.vide"))}</p>`}
    ${l.ignorees ? `<p class="hint">${esc(orgaPluriel("orga.ignorees", l.ignorees))}</p>` : ""}
    <p class="error hidden" id="orgaErr" role="alert"></p>
    <div class="hist-tools">
      <button type="button" class="btn sm primary" id="orgaMaj">${esc(orgaT("orga.actualiser"))}</button>
      <button type="button" class="btn sm" id="orgaCopie">${esc(orgaT("orga.copier"))}</button>
      <button type="button" class="btn sm" id="orgaQR">${esc(orgaT("orga.qr"))}</button>
      <button type="button" class="btn sm" id="orgaClos">${esc(orgaT(l.ferme ? "orga.rouvrir" : "orga.cloturer"))}</button>
      <button type="button" class="btn sm danger" id="orgaSuppr">${esc(orgaT("orga.supprimer"))}</button>
    </div>`);
  orgaNotifPeindre(g);
  // Invitation avec chatons : la table se remplit (scène décorative ; les chiffres et la liste restent dessous)
  if(fam) need("mascotte").then(()=>need(mcFichier(fam))).then(()=>need("mascotteGroupe")).then(()=>{
    const el=$("#orgaIllu"); if(el) MascotteGroupe.dessiner(el, {famille:fam, o:g.inv.o, anim:"d", oui:liste.filter(r=>r.r==="o"), peut:liste.filter(r=>r.r==="p"), non:s.n, ferme:l.ferme});
  }).catch(()=>{});
  const erreur=()=>{ const e=$("#orgaErr"); e.textContent=orgaT("orga.err.action"); e.classList.remove("hidden"); };
  const recharger=async focus=>{ await tableauCharger(g, coquille); if(focus) $(focus)?.focus(); };
  $("#orgaMaj").addEventListener("click", ()=>recharger("#orgaMaj"));
  $("#orgaCopie").addEventListener("click", async()=>toast(await copyText(g.invite) ? "Lien du groupe copié" : "Copie impossible"));
  // L'image et son QR code portent le lien invités, jamais le lien organisateur
  $("#orgaQR").addEventListener("click", e=>openImageSheet(e.currentTarget, {link:g.invite, to:g.inv.t, th:g.inv.th, ac:g.inv.ac||"", occ:g.inv.o, em:g.inv.em||"", from:g.inv.f}));
  $("#orgaClos").addEventListener("click", async()=>{ (await grpCloturer(g.id, g.d, !l.ferme))==="ok" ? recharger("#orgaClos") : erreur(); });
  $$("[data-suppr]").forEach(b=>b.addEventListener("click", async()=>{
    const r=liste.find(x=>x.rid===b.dataset.suppr); if(!r) return;
    if(!await confirmSheet(orgaT("orga.suppr.rep.titre"), orgaT("orga.suppr.rep.texte", {p:r.p}), orgaT("orga.suppr.rep"))) return;
    (await grpSupprimerReponse(g.id, g.d, r.rid))==="ok" ? recharger("#orgaMaj") : erreur();
  }));
  $("#orgaSuppr").addEventListener("click", async()=>{
    if(!await confirmSheet(orgaT("orga.suppr.titre"), orgaT("orga.suppr.texte"), orgaT("orga.supprimer"))) return;
    const r=await grpSupprimer(g.id, g.d);
    if(r!=="ok" && r!=="supprime"){ erreur(); return; }
    try{ await notifStore("groupes","readwrite",st=>st.delete(g.id)); }catch(e){} // l'abonnement a été effacé en ligne avec l'invitation
    storeHistory(loadHistory().filter(x=>x.link!==g.invite)); // plus rien à lire : l'invitation quitte « Mes invitations »
    toast(orgaT("orga.suppr.ok")); location.hash="#mes-invitations";
  });
}
/* « Me prévenir des nouvelles réponses » : une case (comme la révélation), pas de case là où les notifications ne fonctionnent pas
   (iPhone hors de l'appli installée, navigateurs intégrés, navigateur sans notifications). etat : "off" | "on" | "attente" | "refuse" | "reseau" */
async function orgaNotifPeindre(g, etat){
  const box=$("#orgaNotifBox"); if(!box) return;
  const st=notifSupport();
  if(!["ok","refuse"].includes(st)){ box.innerHTML=""; return; }
  if(!etat) etat = await grpNotifActive(g.id) ? "on" : "off";
  const bloque = st==="refuse", on = etat==="on" || etat==="attente";
  const note = bloque ? "orga.notif.bloque" : etat==="on" ? "orga.notif.on" : etat==="refuse" ? "orga.notif.refuse" : etat==="reseau" ? "orga.notif.reseau" : "orga.notif.off";
  box.innerHTML=`<div class="rev-notif"><label class="check"><input type="checkbox" id="orgaNotif" ${on?"checked":""} ${bloque||etat==="attente"?"disabled":""}>
      <span>${esc(orgaT("orga.notif"))}</span></label>
    <p class="hint" ${etat==="reseau"?'role="alert"':'role="status"'}>${esc(orgaT(note))}</p></div>`;
  $("#orgaNotif").addEventListener("change", async e=>{
    const cocher=e.target.checked, refocus=()=>$("#orgaNotif")?.focus();
    if(!cocher){ await orgaNotifPeindre(g, "attente"); await grpNotifCouper(g.id, g.d); await orgaNotifPeindre(g, "off"); refocus(); return; }
    const perm = Notification.permission==="granted" ? "granted" : await Promise.resolve(Notification.requestPermission()).catch(()=>"denied");
    if(perm!=="granted"){ await orgaNotifPeindre(g, perm==="denied" ? "refuse" : "off"); refocus(); return; }
    await orgaNotifPeindre(g, "attente");
    const r=await grpNotifActiver(g.id, g.d, {q:g.inv.q, t:g.inv.t});
    await orgaNotifPeindre(g, r==="ok" ? "on" : "reseau"); refocus();
    if(r==="ok") buzz(15);
  });
}
/* Résumé gardé sur la carte des Envoyées (champ grs) : nombres seulement, jamais de prénom */
function orgaGarderResume(invite, s){
  const list=loadHistory(), it=list.find(x=>x.link===invite); if(!it) return;
  const grs={o:s.o, p:s.p, n:s.n, pers:s.personnes};
  if(JSON.stringify(it.grs)===JSON.stringify(grs)) return;
  it.grs=grs; if(validEntry(it)) storeHistory(list);
}

oseLoaded("groupeOrga", "fcaf1585d0");
