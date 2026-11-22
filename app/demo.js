/* Ose Demander — démo du premier lancement (chargée à la demande par index.html, voir need et demoAVoir).
   1. Premier passage sur l'accueil (sans lien d'invitation, sans historique) : une fenêtre d'accueil,
      « Voir un exemple » / « Créer directement » / « Passer ». « Déjà vu » est retenu sur l'appareil (DEMO_KEY).
   2. L'exemple (#exemple) : une vraie invitation d'exemple (enveloppe, Non qui fuit, réponse) ; après le Oui ou le vrai refus,
      la fenêtre « À toi de créer la tienne ».
   Les textes sont regroupés dans DEMO_TEXTES (clés prêtes pour lang/en.json). Aucune donnée envoyée. */
const DEMO_TEXTES = {
  "demo.accueil.titre": "Bienvenue sur Ose Demander",
  "demo.accueil.texte": "Ici, on crée une invitation animée et on l'envoie par message. Le bouton Non résiste un peu… mais un vrai non reste toujours possible.",
  "demo.accueil.voir": "Voir un exemple",
  "demo.accueil.creer": "Créer directement",
  "demo.accueil.passer": "Passer",
  "demo.fin.titre": "À toi de créer la tienne",
  "demo.fin.texte": "Voilà ce que vivra la personne que tu invites. Choisis un modèle, écris vos prénoms : ton lien est prêt en quelques secondes.",
  "demo.fin.creer": "Créer mon invitation",
  "demo.fin.revoir": "Revoir l'exemple",
  "demo.fin.fermer": "Fermer"
};
const demoT = k => DEMO_TEXTES[k];
// Disposition des boutons (styles des fenêtres et des boutons : ceux du site) ; « Passer » et « Fermer » discrets, 44 px
document.head.insertAdjacentHTML("beforeend", `<style>.demo-btns{display:flex;flex-direction:column;gap:10px}
.demo-btns .btn{width:100%;min-height:48px}.demo-btns .demo-passer{border-color:var(--line);color:var(--muted);min-height:44px;font-weight:600}
.demo-card h3:focus{outline:none}</style>`);

/* Fenêtre de la démo (même aspect que les autres fenêtres du site) : titre focalisé, Échap = action « fermer » */
function demoFenetre(id, titre, texte, boutons, fermer){
  document.getElementById(id)?.remove();
  const d=document.createElement("div");
  d.className="sheet"; d.id=id; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-labelledby", id+"-titre");
  d.innerHTML=`<div class="sheet-card demo-card"><h3 id="${id}-titre" tabindex="-1">${esc(titre)}</h3><p>${esc(texte)}</p>
    <div class="demo-btns">${boutons.map(([cle, classe])=>`<button type="button" class="btn ${classe}" data-demo="${cle}">${esc(demoT(cle))}</button>`).join("")}</div></div>`;
  const onKey=e=>{ if(e.key==="Escape") fin(fermer); };
  const fin=action=>{ d.remove(); document.removeEventListener("keydown",onKey); action(); };
  d.addEventListener("click",e=>{ const b=e.target.closest("[data-demo]"); if(b) fin(boutons.find(x=>x[0]===b.dataset.demo)[2]); });
  document.addEventListener("keydown",onKey);
  document.body.appendChild(d);
  d.querySelector("h3").focus();
  return d;
}

/* 1. Accueil du premier lancement */
function demoAccueil(){
  try{ localStorage.setItem(DEMO_KEY, "1"); }catch(e){} // déjà vu, quoi qu'on choisisse : la fenêtre ne revient pas
  const passer=()=>focusScreen(".hero h1");
  demoFenetre("demoAccueil", demoT("demo.accueil.titre"), demoT("demo.accueil.texte"), [
    ["demo.accueil.voir", "primary", ()=>{ location.hash="#exemple"; }],
    ["demo.accueil.creer", "", ()=>{ location.hash="#choisir"; }],
    ["demo.accueil.passer", "ghost demo-passer", passer]
  ], passer);
}

/* 2. Fin de l'exemple : après le Oui (l'explosion d'abord) ou le vrai refus */
function demoFin(){
  if(location.hash!=="#exemple") return;
  demoFenetre("demoFin", demoT("demo.fin.titre"), demoT("demo.fin.texte"), [
    ["demo.fin.creer", "primary", ()=>{ location.hash="#choisir"; }],
    ["demo.fin.revoir", "", ()=>{ window.scrollTo({top:0}); route(); }],
    ["demo.fin.fermer", "ghost demo-passer", ()=>{}]
  ], ()=>{});
}
document.addEventListener("ose:exemple", e=>{
  clearTimeout(demoFin.attente);
  const vite = invAnim()==="0";
  demoFin.attente = setTimeout(demoFin, vite ? 0 : e.detail==="oui" ? 1800 : 1200);
});

oseLoaded("demo", "def882fa95");
