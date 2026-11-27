/* Mascottes, famille Honneur (être mon témoin, être parrain ou marraine) : nœuds papillon ; attente = Lilas tend un petit
   écrin fermé ; Oui = l'écrin s'ouvre sur un badge étoilé, révérence des deux chatons. Énergie réduite, élégant, pas de saut.
   Accessoires en coordonnées du chaton (viewBox 0 0 120 140) ; l'écrin est un objet à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
const ENCRE = "#1F1546";
const noeud = (fond, reflet) => `<g transform="translate(60 94) scale(1.5) translate(-60 -94)">`
  + `<path class="mc-bas" d="M60 94L48 87.5Q46 94 48 100.5Z M60 94L72 87.5Q74 94 72 100.5Z"/>`
  + `<path class="mc-t" style="fill:${fond};stroke-width:1.6" d="M60 94L48 87.5Q46 94 48 100.5Z"/><path class="mc-t" style="fill:${fond};stroke-width:1.6" d="M60 94L72 87.5Q74 94 72 100.5Z"/>`
  + `<path style="fill:none;stroke:${reflet};stroke-width:1.2;stroke-linecap:round" d="M50.5 90.5v7M69.5 90.5v7"/>`
  + `<rect class="mc-t" x="57" y="91" width="6" height="6" rx="1.8" style="fill:${fond};stroke-width:1.6"/></g>`;
// Écrin (objet, 32 x 34 px) : boîte de velours, couvercle à charnière, badge étoilé caché dedans
let d = ""; for(let i = 0; i < 10; i++){ const r = i % 2 ? 2.7 : 6, a = Math.PI / 5 * i - Math.PI / 2; d += (i ? "L" : "M") + (16 + r * Math.cos(a)).toFixed(1) + " " + (14 + r * Math.sin(a)).toFixed(1); }
const ecrin = `<svg viewBox="0 0 32 34" width="32" height="34">`
  + `<g class="mch-dos"><rect x="4.5" y="5" width="23" height="17" rx="3" style="fill:#9A3E74;stroke:${ENCRE};stroke-width:2"/><rect x="8" y="8" width="16" height="12" rx="2" style="fill:#4E1838"/></g>`
  + `<g class="mch-badge"><path d="M12 17l-3 9 3.5-1.5 2 3 1.5-8.5M20 17l3 9-3.5-1.5-2 3-1.5-8.5" style="fill:#E83F86;stroke:${ENCRE};stroke-width:1.2;stroke-linejoin:round"/>`
  + `<circle cx="16" cy="14" r="8.2" style="fill:#FFC94A;stroke:${ENCRE};stroke-width:1.6"/><path d="${d}Z" style="fill:#FFF4E8;stroke:${ENCRE};stroke-width:1.1;stroke-linejoin:round"/></g>`
  + `<rect x="4" y="21" width="24" height="11" rx="2.5" transform="translate(1.4 1.4)" style="fill:${ENCRE}"/><rect x="4" y="21" width="24" height="11" rx="2.5" style="fill:#7A2E5C;stroke:${ENCRE};stroke-width:2"/>`
  + `<path d="M8 24.5h16" style="stroke:#FFC94A;stroke-width:1.4;stroke-linecap:round"/>`
  + `<g class="mch-couvercle"><path d="M3 21.5Q3 15 16 15Q29 15 29 21.5Z" style="fill:#9A3E74;stroke:${ENCRE};stroke-width:2;stroke-linejoin:round"/><path d="M9 18.5q3-1.5 6-1.5" style="fill:none;stroke:#F4A7C0;stroke-width:1.3;stroke-linecap:round"/></g></svg>`;
let objet = null;
Mascotte.famille("honneur", {
  energie: "d",
  particules: ["star5", "sparkle"],
  acc: {lilas: {cou: noeud("#FFC94A", "#FFF4E8")}, praline: {cou: noeud("#E83F86", "#F4A7C0")}},
  css: `.mch-ecrin{left:36px;bottom:9px}
.mch-tend [data-p="patte-av-d"]{transform:rotate(-62deg)}
.mch-dos,.mch-badge{opacity:0;transform-box:fill-box;transform-origin:50% 100%}
.mch-ouvre .mch-couvercle{animation:mch-ouvre .35s ease-in forwards}.mch-ouvre .mch-dos{animation:mch-dos .45s .25s ease-out forwards}.mch-ouvre .mch-badge{animation:mch-badge .9s .55s ease-out forwards}
@keyframes mch-ouvre{to{opacity:0;transform:translateY(-4px)}}@keyframes mch-dos{from{opacity:1;transform:scaleY(.2)}to{opacity:1;transform:none}}@keyframes mch-badge{from{opacity:0;transform:translateY(7px) scale(.6)}to{opacity:1;transform:translateY(-1px)}}
.mch-ouvre.mc-fige .mch-couvercle{opacity:0}.mch-ouvre.mc-fige .mch-dos{opacity:1}.mch-ouvre.mc-fige .mch-badge{opacity:1;transform:translateY(-1px)}
.mch-salut [data-p="tout"]{animation:mch-salut 1.7s ease-in-out}
@keyframes mch-salut{0%,100%{transform:none}35%,65%{transform:rotate(11deg)}}`,
  attente(duo, o){
    const [l, p] = duo;
    objet = o.objet(ecrin, "mch-ecrin");
    l.el.classList.add("mch-tend");
    if(!o.fige) p.etat("regarde").regard(-3, 2);
  },
  oui(duo, o){
    const [l, p] = duo;
    l.etat("joie"); p.etat("etoile");
    if(objet){ if(o.fige || o.info.rejoue) objet.classList.add("mc-fige"); objet.classList.add("mch-ouvre"); }
    if(o.fige || o.info.rejoue) return;
    o.ensuite(() => { l.el.classList.remove("mch-tend"); duo.forEach(c => c.el.classList.add("mch-salut")); }, 1100); // révérence, pas de saut
    o.ensuite(() => duo.forEach(c => c.el.classList.remove("mch-salut")), 2900);
  }
});
})();

oseLoaded("mascotteHonneur", "090c7a1757");
