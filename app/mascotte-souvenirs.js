/* Mascottes, « Mes invitations » (partie B, chargé à la demande après app/mascotte.js et les fichiers des familles).
   Sur les cartes acceptées d'une invitation avec chatons (champ mc de l'historique), à côté du compte à rebours :
   avant le jour J, Lilas et Praline attendent ; le jour J, ils portent l'accessoire de la famille, joyeux ; le lendemain
   (souvenir), ils dorment l'un contre l'autre. Décoratif (aria-hidden) : le compte à rebours reste le texte lisible. */
(function(){
const E = "#1F1546";
const zzz = `<svg viewBox="0 0 22 22" width="22" height="22">${[[3, 18, 6], [10, 10, 7.5], [16, 3, 5.5]].map(([x, y, s], i) => `<path class="mcs-z mcs-z${i}" d="M${x} ${y}h${s}l-${s} ${s}h${s}" style="fill:none;stroke:${E};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round"/>`).join("")}</svg>`;
document.head.insertAdjacentHTML("beforeend", `<style>.hist-chatons{display:flex;justify-content:center;align-items:flex-end;height:58px;margin:4px 0 -4px;position:relative;pointer-events:none}
.hist-chatons .mc-chat{width:46px;height:54px;margin:0 -5px}
.mcs-dort.mc-lilas [data-p="tout"]{transform:translateX(4px) rotate(9deg)}.mcs-dort.mc-praline [data-p="tout"]{transform:translateX(-4px) rotate(-9deg)}
.mcs-dort [data-p="tete"]{transform:translateY(2px)}.mcs-zz{position:absolute;left:calc(50% + 18px);top:0}
.mcs-z{opacity:0;animation:mcs-z 3s ease-in-out 10}.mcs-z1{animation-delay:1s}.mcs-z2{animation-delay:2s}@keyframes mcs-z{0%,100%{opacity:0}30%,70%{opacity:1}}
.mcs-fige .mcs-z{animation:none;opacity:1}@media (prefers-reduced-motion:reduce){.mcs-z{animation:none;opacity:1}}</style>`);
let vivants = [];
const vider = () => { vivants.forEach(c => c.detruire()); vivants = []; };
window.addEventListener("hashchange", () => { if(location.hash !== "#mes-invitations") vider(); });
/* Peint chaque emplacement [data-mc-fam] : data-mc-etat = avant | jour | heure | passe */
function peindre(energie){
  vider();
  document.querySelectorAll(".hist-chatons[data-mc-fam]").forEach(z => {
    const fam = z.dataset.mcFam, etat = z.dataset.mcEtat, jour = etat === "jour" || etat === "heure", dort = etat === "passe";
    z.innerHTML = "";
    const duo = ["lilas", "praline"].map((q, i) => Mascotte.chat(q, {energie: dort ? "0" : energie, famille: jour ? fam : "", sens: i ? -1 : 1}));
    duo.forEach(c => { z.appendChild(c.el); vivants.push(c);
      if(dort){ c.el.classList.add("mcs-dort"); c.etat("attente", {yeux: "fermes"}); } else c.etat(jour ? "joie" : "attente"); });
    if(dort){ const s = document.createElement("div"); s.className = "mcs-zz" + (energie === "0" ? " mcs-fige" : ""); s.innerHTML = zzz; z.appendChild(s); }
  });
}
window.MascotteSouvenirs = {peindre, vider};
})();

oseLoaded("mascotteSouvenirs", "b15db67c8f");
