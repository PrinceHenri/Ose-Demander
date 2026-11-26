/* Mascottes, famille Galette (galette des rois) : attente = une part de galette posée entre eux, chacun en grignote un coin ;
   Oui = Praline trouve la fève (levée dans sa patte) et la couronne descend sur sa tête.
   Accessoires en coordonnées du chaton (viewBox 0 0 120 140) ; objets à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
// Part de galette de trois quarts (objet, 42 x 30 px), pointe vers Lilas, croûte vers Praline : entière, pointe croquée,
// puis la croûte croquée aussi. [dessus, tranche]
const PARTS = [
  ["M3 15L33 5Q41 13 34 21Z", "M3 15L34 21L34 26L3 19.5Z"],
  ["M10 12.7L33 5Q41 13 34 21L10 16.4A2.6 2.6 0 0 0 10 12.7Z", "M10 16.4L34 21L34 26L10 21.3Z"],
  ["M10 12.7L27.3 6.9A4 4 0 0 0 37 9.6Q40 15 34 21L10 16.4A2.6 2.6 0 0 0 10 12.7Z", "M10 16.4L34 21L34 26L10 21.3Z"]];
const part = `<svg viewBox="0 0 42 30" width="42" height="30">${PARTS.map(([d, t], i) => `<g class="mcg-p mcg-p${i}"><path d="${t}" transform="translate(0 1.6)" style="fill:#1F1546"/>`
  + `<path d="${t}" style="fill:#D99A3E;stroke:#1F1546;stroke-width:2;stroke-linejoin:round"/><path d="${d}" style="fill:#F2C14E;stroke:#1F1546;stroke-width:2;stroke-linejoin:round"/>`
  + `<path d="M17 11L25 16.5M24 8.6L19 16" style="fill:none;stroke:#C98F4E;stroke-width:1.4;stroke-linecap:round"/></g>`).join("")}</svg>`;
// Fève tenue dans la patte levée de Praline (contre-rotation : elle reste droite)
const feve = `<g transform="rotate(-115 52 130)"><g transform="translate(52 122) scale(1.4) translate(-52 -122)"><path class="mc-bas" d="M52 113a5.5 7 0 1 0 .1 0Z"/><path class="mc-t" style="fill:#FFF8EF;stroke-width:2" d="M52 113a5.5 7 0 1 0 .1 0Z"/>`
  + `<path class="mc-c-or" style="stroke-width:1" d="M52 117l1.3 2.6 2.7.4-2 1.8.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.8 2.7-.4Z"/></g></g>`;
// Couronne dorée, agrandie pour rester lisible
const couronne = `<g class="mcg-couronne"><g transform="translate(67 24) scale(1.35) translate(-67 -24)"><path class="mc-bas" d="M55 27L53 11L60.5 18L67 8L73.5 18L81 11L79 27Z"/>`
  + `<path class="mc-t" style="fill:#F2C14E;stroke-width:2.4" d="M55 27L53 11L60.5 18L67 8L73.5 18L81 11L79 27Z"/><path style="fill:#E83F86;stroke:#1F1546;stroke-width:1.2" d="M64.5 22a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z"/>`
  + `<path style="fill:none;stroke:#fff;stroke-width:1.6;stroke-linecap:round" d="M57.5 24h3"/></g></g>`;
let assiette = null;
Mascotte.famille("galette", {
  particules: ["crown", "bean"],
  acc: {},
  css: `.mcg-part{left:36px;bottom:-2px}
.mcg-p{opacity:0}.mcg-p0{opacity:1}
.mcg-part:not(.mc-fige) .mcg-p0{animation:mcg-a 3.6s forwards}.mcg-part:not(.mc-fige) .mcg-p1{animation:mcg-b 3.6s forwards}.mcg-part:not(.mc-fige) .mcg-p2{animation:mcg-c 3.6s forwards}
@keyframes mcg-a{0%,39%{opacity:1}40%,100%{opacity:0}}@keyframes mcg-b{0%,39%{opacity:0}40%,74%{opacity:1}75%,100%{opacity:0}}@keyframes mcg-c{0%,74%{opacity:0}75%,100%{opacity:1}}
.mcg-croque.mc-lilas [data-p="tout"]{animation:mcg-l 3.6s}.mcg-croque.mc-praline [data-p="tout"]{animation:mcg-r 3.6s}
@keyframes mcg-l{25%{transform:none}35%{transform:translateX(5px) rotate(7deg)}45%{transform:none}}
@keyframes mcg-r{60%{transform:none}70%{transform:translateX(-5px) rotate(-7deg)}80%{transform:none}}
.mcg-trouve [data-p="patte-av-g"]{transform:rotate(115deg)}
.mcg-couronne{transform-box:view-box;animation:mcg-tombe .8s .5s both}
@keyframes mcg-tombe{0%{transform:translateY(-44px);opacity:0}55%{transform:translateY(4px);opacity:1}75%{transform:translateY(-3px)}100%{transform:none}}`,
  attente(duo, o){
    assiette = o.objet(part, "mcg-part");
    if(!o.fige) duo.forEach(c => c.el.classList.add("mcg-croque"));
  },
  oui(duo, o){
    const [l, p] = duo;
    if(assiette) assiette.remove();
    duo.forEach(c => c.el.classList.remove("mcg-croque"));
    p.el.classList.add("mcg-trouve"); p.etat("etoile");
    p.el.querySelector('[data-p="acc-main-g"]').innerHTML = feve;
    p.el.querySelector('[data-p="acc-tete"]').innerHTML = couronne;
    if(o.fige || o.info.rejoue) p.el.querySelector(".mcg-couronne").style.animation = "none";
    else { l.etat("joie"); o.ensuite(() => o.saut(), 1300); }
  }
});
})();

oseLoaded("mascotteGalette", "31239efe85");
