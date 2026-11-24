/* Ose Demander — invitation de groupe, côté personne invitée (chargé à la demande avec app/groupe-commun.js).
   Après le Oui ou le vrai refus : un formulaire (prénom, Oui / Peut-être / Non, personnes avec soi, petit mot), chiffré ici
   vers la clé publique de l'organisateur (grpSceller), puis envoyé. L'appareil garde l'identifiant de la réponse et son jeton
   (GRP_REP_KEY) : la même personne modifie sa réponse, elle n'en crée jamais une seconde depuis cet appareil.
   Textes regroupés dans GRP_TEXTES (clés prêtes pour lang/en.json). */
const GRP_TEXTES = {
  "grp.titre.o": "C'est un oui !",
  "grp.titre.n": "Répondre non",
  "grp.titre.modif": "Ta réponse",
  "grp.lead": "Dernière étape : envoie ta réponse à {de}.",
  "grp.prenom": "Ton prénom",
  "grp.reponse": "Ta réponse",
  "grp.o": "Oui",
  "grp.p": "Peut-être",
  "grp.n": "Non",
  "grp.avec": "Combien de personnes viennent avec toi ?",
  "grp.avec.0": "Aucune",
  "grp.mot": "Un petit mot (facultatif)",
  "grp.envoyer": "Envoyer ma réponse",
  "grp.modifier": "Modifier ma réponse",
  "grp.envoi": "Envoi en cours…",
  "grp.prive": "Seule la personne qui organise pourra lire ta réponse : elle est chiffrée sur ton appareil avant de partir.",
  "grp.prenom.vide": "Écris ton prénom : il permet à {de} de savoir qui répond.",
  "grp.ok.titre": "Réponse envoyée",
  "grp.ok.texte": "{de} a bien reçu ta réponse : {resume}.",
  "grp.ok.modif": "Tu peux la modifier depuis cet appareil tant que les réponses sont ouvertes.",
  "grp.err.reseau": "Pas de connexion : ta réponse n'est pas partie. Réessaie quand tu es en ligne.",
  "grp.err.ferme": "Les réponses sont closes : {de} ne prend plus de réponses pour cette invitation.",
  "grp.err.expire": "Cette invitation a expiré : il n'est plus possible d'y répondre.",
  "grp.err.supprime": "{de} a supprimé cette invitation : il n'est plus possible d'y répondre.",
  "grp.err.plein": "Cette invitation a déjà reçu 100 réponses : il n'est plus possible d'en ajouter.",
  "grp.err.limite": "Trop d'envois en peu de temps. Réessaie dans une minute.",
  "grp.err.retiree": "Ta réponse précédente a été retirée par {de}. Tu peux en envoyer une nouvelle.",
  "grp.clos": "Les réponses sont closes : {de} ne prend plus de réponses pour cette invitation.",
  "grp.retirer": "Supprimer ma réponse",
  "grp.retirer.titre": "Supprimer ta réponse ?",
  "grp.retirer.texte": "Ta réponse sera effacée en ligne : {de} ne la verra plus. Tu pourras en envoyer une nouvelle depuis le lien tant que les réponses sont ouvertes.",
  "grp.retirer.annuler": "Annuler",
  "grp.retirer.ok": "Ta réponse a été supprimée.",
  "grp.retirer.err": "La suppression n'a pas abouti. Vérifie ta connexion, puis réessaie."
};
const grpT = (k, v={}) => GRP_TEXTES[k].replace(/\{(\w+)\}/g, (m, n) => v[n] ?? m);

/* Réponses de cet appareil, par groupe : {gid: {rid, jeton, r, p, a, m}} (validé à la lecture) */
const GRP_REP_KEY = "ose-groupe-rep";
function grpMesReponses(){
  let x={}; try{ x=JSON.parse(localStorage.getItem(GRP_REP_KEY)||"{}"); }catch(e){}
  const out={};
  if(!x || typeof x!=="object" || Array.isArray(x)) return out;
  for(const [gid, v] of Object.entries(x).slice(0, 200)){
    if(!GRP_ID.test(gid) || !v || typeof v!=="object" || !GRP_ID.test(v.rid||"") || !/^[A-Za-z0-9_-]{43}$/.test(v.jeton||"")) continue;
    const c=grpValider({p:v.p, r:v.r, a:v.a, m:v.m}); if(c) out[gid]={rid:v.rid, jeton:v.jeton, ...c};
  }
  return out;
}
function grpGarder(gid, v){
  try{ const x=grpMesReponses(); if(v) x[gid]=v; else delete x[gid]; localStorage.setItem(GRP_REP_KEY, JSON.stringify(x)); }catch(e){}
}
/* Onglet Reçues : la réponse est notée sur la carte de l'invitation (Oui : Acceptée avec l'agenda ; Peut-être ; Non : Refusée) */
function grpNoterRecue(r){
  if(!recueLien) return;
  try{
    const list=lireListe(RECUES_KEY), x=list.find(e=>e.link===recueLien); if(!x) return;
    if(x.gr==="o" && r!=="o"){ delete rdv3St["r:"+x.id]; cancelRdv3("r:"+x.id); } // plus de Oui : plus de rappel 3 h avant
    for(const k of ["rep","repAt","repSlot","ag","gr"]) delete x[k];
    if(!r){ localStorage.setItem(RECUES_KEY, JSON.stringify(list)); return; } // réponse supprimée : plus de statut
    x.gr=r; x.repAt=new Date().toISOString();
    if(r==="o"){ x.rep="o"; if(!D.sl) x.repSlot=0; const c=calInfo(); x.ag={t:c.title.slice(0,140), l:c.loc.slice(0,160), e:D.en||""}; }
    else if(r==="n") x.rep="n";
    else delete x.repAt;
    localStorage.setItem(RECUES_KEY, JSON.stringify(list));
  }catch(e){}
}
const grpResumeTexte = c => c.r==="n" ? "non" : (c.r==="o" ? "oui" : "peut-être") + (c.a ? `, avec ${c.a} personne${c.a>1?"s":""}` : "");

/* Le formulaire, à la place de la carte habituelle. r : réponse proposée (« o » après le Oui, « n » après le vrai refus) */
function renderGroupeForm(r){
  const de=esc(D.f), deja=grpMesReponses()[GRP.id];
  const v = deja ? {...deja} : {p:"", r, a:0, m:""};
  if(!deja) v.r=r;
  const main=$("#main");
  if(GRP.ferme && !deja){
    main.innerHTML=`<div class="pop-in"><h1 class="question" tabindex="-1">${esc(grpT("grp.titre.modif"))}</h1>
      <p class="grp-etat" role="status">${esc(grpT("grp.clos", {de:D.f}))}</p>${signHTML()}</div>`;
    focusScreen("#main .question"); return;
  }
  const opt = n => `<option value="${n}" ${v.a===n?"selected":""}>${n ? n : esc(grpT("grp.avec.0"))}</option>`;
  main.innerHTML = `
    <div class="pop-in grp-form">
      <p class="occ">${esc(invOccLabel())}</p>
      <h1 class="question" tabindex="-1" style="margin-bottom:8px">${esc(grpT(deja ? "grp.titre.modif" : r==="n" ? "grp.titre.n" : "grp.titre.o"))}</h1>
      <p class="send-lead"><strong>${esc(grpT("grp.lead", {de:D.f})).replace(/^([^:]+:)/, "$1</strong>")}</p>
      <label class="field"><span>${esc(grpT("grp.prenom"))}</span>
        <input class="input" id="grpP" maxlength="${GRP_PRENOM_MAX}" autocomplete="given-name" value="${esc(v.p)}" required></label>
      <div class="field"><span id="grpRl">${esc(grpT("grp.reponse"))}</span>
        <div class="chips grp-choix" role="group" aria-labelledby="grpRl">
          ${["o","p","n"].map(k=>`<button type="button" class="chip" data-grp-r="${k}" aria-pressed="${v.r===k}">${esc(grpT("grp."+k))}</button>`).join("")}
        </div></div>
      <label class="field grp-avec ${v.r==="n"?"hidden":""}"><span>${esc(grpT("grp.avec"))}</span>
        <select class="input" id="grpA">${[0,1,2,3,4,5].map(opt).join("")}</select></label>
      <label class="field"><span>${esc(grpT("grp.mot"))}</span>
        <textarea class="input" id="grpM" maxlength="${GRP_MOT_MAX}" rows="2">${esc(v.m)}</textarea>
        <div class="counter" id="grpCnt">${[...v.m].length} / ${GRP_MOT_MAX}</div></label>
      <p class="error hidden" id="grpErr" role="alert"></p>
      <div class="after-actions">
        <button type="button" class="btn primary" id="grpEnvoyer">${esc(grpT(deja ? "grp.modifier" : "grp.envoyer"))}</button>
        ${!deja && r==="n" ? `<button type="button" class="refuse" id="undoNo">Finalement, je reviens en arrière</button>` : ""}
        ${deja ? `<button type="button" class="refuse" id="grpRetirer">${esc(grpT("grp.retirer"))}</button>` : ""}
      </div>
      <p class="hint">${esc(grpT("grp.prive"))}</p>
      ${D.m && r==="o" ? `<p class="handnote">${esc(D.m)}</p>` : ""}
      ${signHTML()}
    </div>`;
  let choix=v.r;
  $$("[data-grp-r]", main).forEach(b=>b.addEventListener("click",()=>{
    choix=b.dataset.grpR;
    $$("[data-grp-r]", main).forEach(x=>x.setAttribute("aria-pressed", x===b));
    $(".grp-avec", main).classList.toggle("hidden", choix==="n");
  }));
  $("#grpM").addEventListener("input", e=>{ $("#grpCnt").textContent=`${[...e.target.value].length} / ${GRP_MOT_MAX}`; });
  $("#undoNo")?.addEventListener("click",()=>{ renderInvite(); });
  $("#grpRetirer")?.addEventListener("click",()=>grpRetirerUI(r));
  $("#grpEnvoyer").addEventListener("click", async e=>{
    const b=e.currentTarget, err=$("#grpErr");
    const rep={p:$("#grpP").value.trim(), r:choix, a:choix==="n" ? 0 : +$("#grpA").value, m:$("#grpM").value.trim()};
    if(!rep.p){ err.textContent=grpT("grp.prenom.vide", {de:D.f}); err.classList.remove("hidden"); $("#grpP").focus(); return; }
    if(!grpValider(rep)){ err.textContent=grpT("grp.prenom.vide", {de:D.f}); err.classList.remove("hidden"); $("#grpP").focus(); return; }
    err.classList.add("hidden"); b.disabled=true; const avant=b.textContent; b.textContent=grpT("grp.envoi");
    const res=await grpEnvoyer(rep);
    if(res.etat!=="ok"){
      b.disabled=false; b.textContent = res.etat==="retiree" ? grpT("grp.envoyer") : avant;
      const k = res.etat==="retiree" ? "retiree" : typeof navigator!=="undefined" && navigator.onLine===false ? "reseau" : res.etat;
      err.textContent=grpT("grp.err."+(["ferme","expire","supprime","plein","limite","retiree"].includes(k) ? k : "reseau"), {de:D.f});
      err.classList.remove("hidden"); err.focus?.(); return;
    }
    const c=res.c;
    Sound.done(); buzz(20);
    renderGroupeEnvoye(c);
  });
  focusScreen("#main .question");
}
/* Envoie (ou modifie, si cet appareil a déjà répondu) : {etat:"ok", c} ou {etat: "contenu" | "retiree" | erreur du service}.
   Réponse retirée par l'organisateur : l'appareil l'oublie, la suivante sera une nouvelle réponse. */
async function grpEnvoyer(rep){
  const c=grpValider(rep); if(!c) return {etat:"contenu"};
  const mien=grpMesReponses()[GRP.id];
  const res = mien ? await grpModifier(GRP.id, mien.rid, mien.jeton, c, D.gp) : await grpRepondre(GRP.id, c, D.gp);
  if(mien && (res.etat==="introuvable" || res.etat==="jeton")){ grpGarder(GRP.id, null); return {etat:"retiree"}; }
  if(res.etat!=="ok") return res;
  grpGarder(GRP.id, {rid: mien ? mien.rid : res.rid, jeton: mien ? mien.jeton : res.jeton, ...c});
  grpNoterRecue(c.r);
  return {etat:"ok", c};
}
/* Supprime la réponse de cet appareil : en ligne (avec le jeton), puis ici (réponse gardée, Reçues).
   Déjà effacée en ligne (retirée, invitation supprimée ou expirée) : on l'oublie aussi ici. "ok" | "aucune" | erreur */
async function grpRetirerMienne(){
  const mien=grpMesReponses()[GRP.id]; if(!mien) return "aucune";
  const r=await grpRetirer(GRP.id, mien.rid, mien.jeton);
  if(!["ok","introuvable","supprime","expire"].includes(r)) return r;
  grpGarder(GRP.id, null); grpNoterRecue(null);
  return "ok";
}
/* Fenêtre de confirmation (côté personne invitée : la création n'est pas chargée) */
function grpConfirmer(titre, texte, ok){
  return new Promise(resolve=>{
    const d=document.createElement("div"); d.className="sheet"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label",titre);
    d.innerHTML=`<div class="sheet-card"><h3>${esc(titre)}</h3><p>${esc(texte)}</p>
      <div class="btns"><button type="button" class="btn" data-r="0">${esc(grpT("grp.retirer.annuler"))}</button><button type="button" class="btn primary" data-r="1">${esc(ok)}</button></div></div>`;
    const onKey=e=>{ if(e.key==="Escape") fin(false); };
    const fin=v=>{ d.remove(); document.removeEventListener("keydown",onKey); resolve(v); };
    d.addEventListener("click",e=>{ if(e.target===d) return fin(false); const b=e.target.closest("[data-r]"); if(b) fin(b.dataset.r==="1"); });
    document.addEventListener("keydown",onKey);
    document.body.appendChild(d); $("[data-r='0']",d).focus();
  });
}
async function grpRetirerUI(r){
  if(!await grpConfirmer(grpT("grp.retirer.titre"), grpT("grp.retirer.texte", {de:D.f}), grpT("grp.retirer"))) return;
  const res=await grpRetirerMienne();
  if(res!=="ok" && res!=="aucune"){ toast(grpT("grp.retirer.err")); return; }
  toast(grpT("grp.retirer.ok"));
  renderGroupeForm(r==="n" ? "n" : "o");
}
/* Réponse partie : ce qui a été envoyé, et de quoi la modifier */
function renderGroupeEnvoye(c){
  $("#main").innerHTML=`
    <div class="pop-in">
      <p class="occ">${esc(invOccLabel())}</p>
      <h1 class="question" tabindex="-1" style="margin-bottom:8px">${esc(grpT("grp.ok.titre"))} ✅</h1>
      <p class="grp-etat" role="status">${esc(grpT("grp.ok.texte", {de:D.f, resume:grpResumeTexte(c)}))}</p>
      ${c.r!=="n" && D.m ? `<p class="handnote">${esc(D.m)}</p>` : ""}
      ${signHTML()}
      ${c.r!=="n" ? `<div class="details" id="details">${detailsHTML()}</div>` : ""}
      <div class="after-actions">
        <button type="button" class="btn" id="grpModif">${esc(grpT("grp.modifier"))}</button>
        <button type="button" class="refuse" id="grpRetirer">${esc(grpT("grp.retirer"))}</button>
        <p class="cal-note">${esc(grpT("grp.ok.modif"))}</p>
      </div>
    </div>`;
  $("#grpModif").addEventListener("click",()=>renderGroupeForm(c.r));
  $("#grpRetirer").addEventListener("click",()=>grpRetirerUI(c.r));
  focusScreen("#main .question");
}

oseLoaded("groupeInvite", "3419a5a6a6");
