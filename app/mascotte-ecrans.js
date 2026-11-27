/* Mascottes, petits écrans (partie B, chargé à la demande après app/mascotte.js) : hors connexion ou service muet = Lilas et
   Praline endormis l'un contre l'autre ; chargement = ils courent sur place ; historique vide = Lilas assis dans une boîte vide,
   Praline qui regarde dedans ; invitation supprimée = Lilas dans l'enveloppe vide, intrigué (jamais triste) ; lien introuvable =
   Lilas à la loupe ; invitation expirée = un sablier qu'ils regardent ; lien incomplet = chacun tient une moitié de l'enveloppe. Toujours décoratif (aria-hidden) : le texte de l'écran reste seul porteur du sens.
   La page introuvable (404.html, sans script) a son propre dessin, fabriqué par outils/pages.mjs depuis les mêmes chatons. */
(function(){
const E = "#1F1546";
const zzz = `<svg viewBox="0 0 22 22" width="22" height="22">${[[3, 18, 6], [10, 10, 7.5], [16, 3, 5.5]].map(([x, y, s], i) => `<path class="mce-z" style="animation-delay:${i}s" d="M${x} ${y}h${s}l-${s} ${s}h${s}" fill="none" stroke="${E}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>`;
const vitesse = `<svg viewBox="0 0 26 24" width="26" height="24"><path class="mce-v" d="M2 8h14M6 14h18M2 20h12" fill="none" stroke="${E}" stroke-width="2" stroke-linecap="round"/></svg>`;
const boite = `<svg class="mce-carton" viewBox="-6 0 76 40" width="76" height="40"><path d="M4 10h56v28H4Z" fill="#E0A866" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>`
  + `<path d="M4 10L-4 2M60 10l8-8" stroke="${E}" stroke-width="2"/><path d="M4 10L-4 2H20L28 10ZM60 10l8-8H44l-8 8Z" fill="#D99A3E" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>`
  + `<path d="M32 16v16" stroke="#F3D9A4" stroke-width="5"/></svg>`;
// Enveloppe ouverte et vide : le rabat derrière Lilas, la poche devant lui
const rabat = `<svg class="mce-rabat" viewBox="-6 0 76 40" width="76" height="40"><path d="M2 22L32 2L62 22Z" fill="#E9E3FF" stroke="${E}" stroke-width="2" stroke-linejoin="round"/></svg>`;
const poche = `<svg class="mce-carton" viewBox="-6 0 76 40" width="76" height="40"><path d="M2 14L32 26L62 14V36Q62 38 60 38H4Q2 38 2 36Z" fill="#FFF4E8" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>`
  + `<path d="M2 36L26 24M62 36L38 24" stroke="#CFC6F2" stroke-width="1.6"/></svg>`;
// Loupe (au premier plan, acc-tete : le manche part de la patte levée, la lentille devant un œil), comme sur la page 404
const loupe = `<path d="M83 114L87 82" stroke="${E}" stroke-width="5" stroke-linecap="round"/><path d="M83 114L87 82" stroke="#C98F4E" stroke-width="2.6" stroke-linecap="round"/>`
  + `<circle cx="88" cy="70" r="11.5" fill="#DDF3FF" fill-opacity=".55" stroke="${E}" stroke-width="3"/><path d="M81 66q2-5 7-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
const sablier = `<svg viewBox="0 0 24 36" width="24" height="36"><path d="M3 2h18M3 34h18" stroke="${E}" stroke-width="3" stroke-linecap="round"/>`
  + `<path d="M5 3Q5 14 12 18Q5 22 5 33H19Q19 22 12 18Q19 14 19 3Z" fill="#FFF4E8" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>`
  + `<path class="mce-sable" d="M8 30Q12 24 16 30Z" fill="#F2C14E"/><path d="M8 8h8Q14 13 12 15Q10 13 8 8Z" fill="#F2C14E"/><path class="mce-grain" d="M12 16v12" stroke="#F2C14E" stroke-width="1.4" stroke-dasharray="2 2"/></svg>`;
const moitie = d => `<svg viewBox="0 0 30 26" width="30" height="26"><path d="${d}" fill="#FFF4E8" stroke="${E}" stroke-width="2" stroke-linejoin="round"/></svg>`;
const moities = [moitie("M2 3H24L20 8L25 13L19 18L23 24H4Q2 24 2 22Z M2 5L14 13"), moitie("M6 3H26Q28 3 28 5V22Q28 24 26 24H8L3 18L9 13L4 8Z M28 5L16 13")];
document.head.insertAdjacentHTML("beforeend", `<style>.mce{display:flex;justify-content:center;align-items:flex-end;position:relative;height:62px;margin:0 auto 6px;pointer-events:none}
.mce .mc-chat{width:52px;height:61px;margin:0 -6px}.mce-dort .mc-lilas [data-p="tout"]{transform:translateX(2px) rotate(8deg)}.mce-dort .mc-praline [data-p="tout"]{transform:translateX(-2px) rotate(-8deg)}
.mce-x{position:absolute}.mce-dort .mce-x{left:calc(50% + 22px);top:0}.mce-course .mce-x{left:calc(50% - 74px);bottom:14px}
.mce-z{opacity:0;animation:mce-z 3s ease-in-out 10}@keyframes mce-z{0%,100%{opacity:0}30%,70%{opacity:1}}
.mce-v{animation:mce-v .5s linear 40;stroke-dasharray:4 6}@keyframes mce-v{to{stroke-dashoffset:10}}
.mce-boite{position:relative;width:76px;height:62px;margin-right:2px}.mce-boite .mc-chat{position:absolute;left:12px;bottom:12px;margin:0}.mce-carton,.mce-rabat{position:absolute;left:0;bottom:0}.mce-rabat{bottom:16px}
.mce-loupe .mc-lilas [data-p="patte-av-d"]{transform:rotate(-95deg)}.mce-loupe .mc-lilas [data-p="tete"]{animation:mce-t 1.8s ease-in-out 8 alternate}@keyframes mce-t{to{transform:rotate(3deg)}}
.mce-sablier .mce-x{position:static;margin:0 4px 4px}.mce-grain{animation:mce-v .6s linear 30}
.mce-dechire .mce-x{position:static;display:flex;gap:6px;margin:0 -30px 4px;z-index:1}
.mce-fige .mce-z{animation:none;opacity:1}.mce-fige .mc-lilas [data-p="tete"],.mce-fige .mce-grain{animation:none}.mce-fige .mce-v{animation:none}@media (prefers-reduced-motion:reduce){.mce-z{animation:none;opacity:1}.mce-v{animation:none}}</style>`);
let vivants = [];
const menage = () => { vivants = vivants.filter(c => c.el.isConnected || (c.detruire(), false)); };
window.addEventListener("hashchange", () => setTimeout(menage, 0));
/* mode : dort | course | vide | enveloppe | loupe | sablier | dechire ; avant : élément devant lequel la scène se place ; energie : n | d | 0 */
function poser(avant, mode, energie){
  menage();
  if(!avant || !avant.isConnected) return;
  const z = document.createElement("div"); z.className = `mce mce-${mode}` + (energie === "0" ? " mce-fige" : ""); z.setAttribute("aria-hidden", "true");
  const e = mode === "dort" ? "0" : energie;
  const [l, p] = ["lilas", "praline"].map((q, i) => Mascotte.chat(q, {energie: e, sens: i ? -1 : 1}));
  const x = document.createElement("div"); x.className = "mce-x";
  if(mode === "dort"){ l.etat("attente", {yeux: "fermes"}); p.etat("attente", {yeux: "fermes"}); x.innerHTML = zzz; z.append(l.el, p.el, x); }
  else if(mode === "course"){ l.courir(true); p.courir(true); l.etat("joie"); p.etat("joie"); x.innerHTML = vitesse; z.append(x, l.el, p.el); }
  else if(mode === "loupe"){ l.el.querySelector('[data-p="acc-tete"]').innerHTML = loupe; p.etat("regarde").regard(-3, 0); z.append(l.el, p.el); }
  else if(mode === "sablier"){ x.innerHTML = sablier; l.etat("regarde").regard(3, 2); p.etat("regarde").regard(-3, 2); z.append(l.el, x, p.el); }
  else if(mode === "dechire"){ x.innerHTML = moities.join(""); l.etat("regarde").regard(3, 2); p.etat("regarde").regard(-3, 2); z.append(l.el, x, p.el); }
  else { const env = mode === "enveloppe"; l.etat(env ? "regarde" : "attente"); if(env) l.regard(2, 3); p.etat("regarde").regard(-3, 2);
    x.className = "mce-boite"; if(env) x.innerHTML = rabat; x.append(l.el); x.insertAdjacentHTML("beforeend", env ? poche : boite); z.append(x, p.el); }
  vivants.push(l, p);
  avant.parentNode.insertBefore(z, avant);
  return z;
}
window.MascotteEcrans = {poser};
})();

oseLoaded("mascotteEcrans", "a81701c4bf");
