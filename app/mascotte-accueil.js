/* Mascottes, accueil (chargé à la demande après app/mascotte.js) : Praline endormie, roulée en boule, adossée au « ? » du logo
   (place réservée .mc-logo dans l'en-tête : elle ne recouvre ni les lettres, ni le lien du logo, ni les boutons) ; respiration lente,
   petit « z » de temps en temps, queue qui bouge à peine ; toucher = elle ouvre un œil puis se rendort. Lilas, sur le mini-billet,
   fait coucou une seule fois à l'arrivée avec la bulle « Coucou ! » (2 s). Au Oui : Praline se réveille (bâillement, étirement),
   quitte le logo et rejoint Lilas pour le saut de joie. Le duo séparé (logo + carte) compte pour une seule scène.
   Décoratif (aria-hidden) ; immobile en animations « Aucune » et avec « moins de mouvement » (ni coucou ni bulle). */
(function(){
const el = (cx, cy, rx, ry) => `M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0Z`;
const sil = (d, cls) => `<path class="mc-bas" d="${d}"/><path class="mc-t ${cls}" d="${d}"/>`;
const g = (p, a, inner) => `<g data-b="${p}"${a ? ` style="transform-origin:${a}"` : ""}>${inner}</g>`;
const ACC = "translate(23.5 4.6) scale(.375)"; // repère de la tête du chaton assis (120 × 140) ramené à la tête de la boule
/* La boule (viewBox 64 × 46, posée sur y = 44) : dos contre le « ? » (à gauche), tête posée à droite sur les pattes */
function boule(accs){
  const queue = "M9 35C6 46 40 49 51 41";
  const acc = k => (accs.find(a => a[0] === k) || [])[1] || "";
  return `<svg class="mca-boule mc-praline" viewBox="0 0 64 46" aria-hidden="true" focusable="false">`
    + g("tout", "32px 44px", g("souffle", "32px 44px",
        sil(el(30, 31, 25, 13.5), "mc-peau") + `<path class="mc-ombre" d="M50 22A25 13.5 0 0 1 36 44.2Q49 38 50 22Z"/><path class="mc-marque" d="${el(17, 25, 6.5, 4.6)}"/>`
      + g("queue", "9px 35px", `<path class="mc-q-encre" style="stroke-width:8.5" d="${queue}"/><path class="mc-q-peau" style="stroke-width:4.2" d="${queue}"/><path class="mc-q-marque" style="stroke-width:4.2" d="M44 44.6Q48.6 43.4 51 41"/>`)
      + sil(el(39, 40.5, 6.2, 3.4), "mc-peau")
      + g("tete", "44px 37px",
          g("oreille-g", "38px 17px", sil("M33 21Q30 9 35 6.5Q39 6.5 44 15Z", "mc-marque") + `<path class="mc-int" d="M35 18Q33.5 11 36 9.6Q38.5 10 41 15Z"/>`)
        + g("oreille-d", "54px 16px", sil("M49 15Q55 6 59 7.5Q61.5 11 59.5 21Z", "mc-peau") + `<path class="mc-int" d="M51.5 15Q55.5 10 57.5 10.4Q58.6 13 57.8 18Z"/>`)
        + sil(el(46, 26, 15, 12.5), "mc-peau") + `<path class="mc-marque" d="M53 14.6A15 12.5 0 0 1 60.6 23Q57 25.5 54.4 22.6Q52 19.6 53 14.6Z"/>`
        + `<path class="mc-joue" d="${el(36.6, 31, 2.7, 1.7)}"/><path class="mc-joue" d="${el(55.6, 31, 2.7, 1.7)}"/>`
        + `<path class="mc-t mc-nez" style="stroke-width:1.2" d="M45 29.4Q46.5 28.9 48 29.4Q47 31 46.5 31Q46 31 45 29.4Z"/>`
        + g("dort-g", "", `<path class="mc-trait" style="stroke-width:1.9" d="M37.6 26.6Q40.6 29.6 43.6 26.6"/>`)
        + g("oeil-g", "", `<path class="mc-encre" d="${el(40.6, 27, 2.5, 2.9)}"/><circle class="mc-blanc" cx="39.9" cy="25.9" r=".9"/>`)
        + g("dort-d", "", `<path class="mc-trait" style="stroke-width:1.9" d="M49.4 26.6Q52.4 29.6 55.4 26.6"/>`)
        + g("oeil-d", "", `<path class="mc-encre" d="${el(52.4, 27, 2.5, 2.9)}"/><circle class="mc-blanc" cx="51.7" cy="25.9" r=".9"/>`)
        + g("baille", "", `<path class="mc-t mc-gorge" style="stroke-width:1.3" d="M44.2 32Q46.5 31.6 48.8 32Q48.4 37.4 46.5 37.4Q44.6 37.4 44.2 32Z"/>`)
        + `<g transform="${ACC}"><g>${acc("cou")}</g><g>${acc("tete")}</g></g>`))
      + `<path class="mca-z" d="M58 4h4.6l-4.6 4.6h4.6" fill="none" stroke="#1F1546" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`)
    + `</svg>`;
}
const CSS = `
.mca-boule{position:absolute;left:0;bottom:0;width:28px;height:20.1px;overflow:visible;pointer-events:none;--mc-encre:#1F1546}
.mca-boule [data-b]{transform-box:view-box}
.mca-boule [data-b="oeil-g"],.mca-boule [data-b="oeil-d"],.mca-boule [data-b="baille"]{opacity:0;transition:opacity .15s}
.mca-boule [data-b^="dort"]{transition:opacity .15s}
.mca-z{opacity:0;transform-box:view-box;transform-origin:60px 6px}
.mca-vit [data-b="souffle"]{animation:mca-souffle 4.2s ease-in-out infinite}
.mca-vit [data-b="queue"]{animation:mca-queue 6s ease-in-out infinite alternate}
.mca-vit .mca-z{animation:mca-z 5.2s ease-out infinite 1.2s}
.mca-d.mca-vit [data-b="souffle"]{animation-duration:5.6s}.mca-d.mca-vit .mca-z{animation-duration:7s}
@keyframes mca-souffle{50%{transform:scale(1.02,1.06)}}
@keyframes mca-queue{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}
@keyframes mca-z{0%,58%{opacity:0;transform:translate(0,2px) scale(.6)}66%{opacity:1}100%{opacity:0;transform:translate(5px,-11px) scale(1.15)}}
/* Toucher : un œil s'ouvre, l'oreille tressaille, puis elle se rendort */
.mca-oeil [data-b="dort-g"]{opacity:0}.mca-oeil [data-b="oeil-g"]{opacity:1}
.mca-vit.mca-oeil [data-b="oreille-d"]{animation:mca-tic .35s ease-out}
@keyframes mca-tic{40%{transform:rotate(14deg)}}
/* Réveil (Oui) : la tête se lève, bâillement, étirement, yeux ouverts */
.mca-reveil [data-b="tete"]{animation:mca-tete var(--mca-t) ease-in-out both}
.mca-reveil [data-b="baille"]{animation:mca-baille var(--mca-t) both}
.mca-reveil [data-b^="dort"]{animation:mca-ferme var(--mca-t) both}
.mca-reveil [data-b^="oeil"]{animation:mca-ouvre var(--mca-t) both}
.mca-reveil [data-b="tout"]{animation:mca-etire var(--mca-t) ease-in-out both}
@keyframes mca-tete{30%,55%{transform:translateY(-3px) rotate(-10deg)}100%{transform:translateY(-2px) rotate(-4deg)}}
@keyframes mca-baille{0%{opacity:0}12%,48%{opacity:1}56%,100%{opacity:0}}
@keyframes mca-ferme{0%,58%{opacity:1}64%,100%{opacity:0}}
@keyframes mca-ouvre{0%,58%{opacity:0}64%,100%{opacity:1}}
@keyframes mca-etire{0%,45%{transform:none}70%{transform:scale(1.16,.86)}86%{transform:scale(.97,1.05)}100%{transform:none}}
.mca-part{transition:opacity .15s;opacity:0}
.mca-bulle{position:absolute;right:calc(100% - 8px);top:10px;white-space:nowrap;background:var(--surface);color:var(--ink);border:2px solid var(--ink);border-radius:14px;padding:3px 10px;font:800 14px/1.3 var(--display);box-shadow:2px 2px 0 var(--ink);transform-origin:100% 70%;animation:mca-bulle .28s cubic-bezier(.3,1.4,.5,1) both}
.mca-bulle::after{content:"";position:absolute;right:-7px;top:55%;width:9px;height:9px;background:var(--surface);border:solid var(--ink);border-width:2px 2px 0 0;transform:rotate(45deg) skew(8deg,8deg)}
.mca-bulle.mca-fin{animation:mca-bulle-fin .3s ease-in both}
@keyframes mca-bulle{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes mca-bulle-fin{to{opacity:0;transform:scale(.9)}}
@media (prefers-reduced-motion:reduce){.mca-boule,.mca-boule *,.mca-bulle{animation:none!important}.mca-bulle{display:none}}
`;
let styleMis = false, minuteurs = [];
const ensuite = (fn, ms) => { minuteurs.push(setTimeout(fn, ms)); };
const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function styles(){ if(styleMis) return; styleMis = true; document.head.insertAdjacentHTML("beforeend", `<style data-mascotte-accueil>${CSS}</style>`); }
/* Pose Praline endormie dans la place réservée ; accs = [[pièce, dessin]] (accessoires de saison, même calendrier que Lilas) */
function praline(place, energie, accs){
  styles();
  const t = document.createElement("div"); t.innerHTML = boule(accs || []);
  const svg = t.firstChild, vit = energie !== "0" && !reduit();
  svg.classList.toggle("mca-vit", vit); svg.classList.toggle("mca-d", energie === "d");
  place.appendChild(svg);
  let oeil = 0;
  return {el: svg,
    toucher(){ if(svg.classList.contains("mca-reveil")) return; clearTimeout(oeil); svg.classList.remove("mca-oeil"); svg.getBoundingClientRect(); svg.classList.add("mca-oeil"); oeil = setTimeout(() => svg.classList.remove("mca-oeil"), 1400); },
    detruire(){ clearTimeout(oeil); svg.remove(); }};
}
/* Lilas fait coucou une seule fois, avec la bulle (2 s) ; rien si immobile */
function coucou(l, zone, energie){
  if(energie === "0" || reduit()) return;
  styles();
  const b = document.createElement("span"); b.className = "mca-bulle"; b.textContent = "Coucou\u00A0!";
  ensuite(() => { zone.appendChild(b); l.etat("attente").jouer("coucou"); }, 350);
  ensuite(() => b.classList.add("mca-fin"), 2350);
  ensuite(() => b.remove(), 2700);
}
/* Au Oui : réveil sur le logo, saut jusqu'au billet à côté de Lilas, puis saut de joie à deux. Renvoie la durée totale. */
function rejoindre(b, l, zone, energie, accs){
  const k = energie === "d" ? 1.4 : 1, T = Math.round(820 * k), V = Math.round(560 * k);
  const p = Mascotte.chat("praline", {energie, sens: -1});
  (accs || []).forEach(([q, d]) => { const x = p.el.querySelector(`[data-p="acc-${q}"]`); if(x && !x.innerHTML) x.innerHTML = d; });
  b.el.style.setProperty("--mca-t", T + "ms"); b.el.classList.remove("mca-oeil"); b.el.classList.add("mca-reveil");
  l.courir(false).deplacer(0).etat("attentif").regard(-3, -3);
  ensuite(() => {
    p.el.classList.add("mca-part"); zone.appendChild(p.el); p.etat("joie");
    const a = b.el.getBoundingClientRect(), c = p.el.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (c.left + c.width / 2), dy = a.bottom - c.bottom;
    b.el.style.opacity = "0"; p.el.style.opacity = "1";
    if(p.el.animate) p.el.animate([
      {transform: `translate(${dx}px,${dy}px) scale(.5)`},
      {transform: `translate(${dx * .4}px,${Math.min(dy, 0) * .4 - 70}px) scale(.85) rotate(-14deg)`, offset: .5},
      {transform: "none"}], {duration: V, easing: "cubic-bezier(.45,0,.35,1)"});
    l.etat("joie");
  }, T);
  ensuite(() => { l.jouer("saut"); p.jouer("saut"); }, T + V);
  return {p, duree: T + V + Math.round(900 * k)};
}
const arreter = () => { minuteurs.forEach(clearTimeout); minuteurs = []; };
window.MascotteAccueil = {praline, coucou, rejoindre, arreter, _boule: boule};
})();

oseLoaded("mascotteAccueil", "3cb23380ef");
