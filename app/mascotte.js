/* =========================================================
   Mascottes d'Ose Demander : Lilas (qui ose demander) et Praline (qui répond).
   Moteur et dessins. SVG + CSS, aucune bibliothèque ; animations par transform et opacity seulement.

   FORMAT DES PIÈCES (stable : un illustrateur peut remplacer le dessin sans toucher aux animations)
   - Un chaton = un <svg class="mc-chat" viewBox="0 0 120 140">, assis, pattes posées sur y = 136, centré sur x = 60.
   - Chaque pièce est un groupe <g data-p="nom" data-a="x y"> : data-a = point d'ancrage (pivot), en unités du viewBox.
     Le moteur en fait le transform-origin ; les animations ne connaissent que les noms et les ancrages.
   - Pièces (dans cet ordre d'imbrication) :
       tout (60 136) > souffle (60 136) > queue (80 126), pattes-ar (60 127), pieds (60 133), corps (60 112), collier (60 95), acc-cou (60 95),
       patte-av-g (52 113) > acc-main-g, patte-av-d (68 113) > acc-main, bras-croises (60 112),
       tete (60 90) > oreille-g (38 36), oreille-d (82 36), crane, joues (60 73), nez, yeux, larme (84 72), bouche, acc-tete (60 24).
   - Variantes : <g data-p="yeux" data-x="ouverts|fermes|coeur|etoile|plisses"> (ouverts contient <g data-p="regard">),
     <g data-p="bouche" data-x="sourire|ouverte|boude">. Une seule variante visible, changée en fondu.
   - Couleurs : variables CSS du chaton (--mc-peau, --mc-ombre, --mc-marque, --mc-int, --mc-collier) et encre --mc-encre.
   Décoratif : toujours aria-hidden, jamais d'information portée par la mascotte seule.
   ========================================================= */
(function(){
"use strict";
const ENCRE = "#1F1546";
const el = (cx, cy, rx, ry) => `M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0Z`;
// Silhouette : une copie à l'encre décalée vers le bas, dessous (contour un peu plus épais en bas), puis la forme
const sil = (d, cls) => `<path class="mc-bas" d="${d}"/><path class="mc-t ${cls}" d="${d}"/>`;
const coeur = (cx, cy, s) => `M${cx} ${cy+s*.45}C${cx-s*.95} ${cy-s*.1} ${cx-s*.5} ${cy-s*.8} ${cx} ${cy-s*.3}C${cx+s*.5} ${cy-s*.8} ${cx+s*.95} ${cy-s*.1} ${cx} ${cy+s*.45}Z`;
function etoile(cx, cy, r1, r2){
  let d = "";
  for(let i = 0; i < 10; i++){
    const r = i % 2 ? r2 : r1, a = Math.PI / 5 * i - Math.PI / 2;
    d += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1);
  }
  return d + "Z";
}
const g = (p, a, inner, x) => `<g data-p="${p}"${a ? ` data-a="${a}"` : ""}${x ? ` data-x="${x}"` : ""}>${inner}</g>`;
const patte = cx => `M${cx-7} 117Q${cx-7} 110 ${cx} 110Q${cx+7} 110 ${cx+7} 117L${cx+7} 130Q${cx+7} 135.5 ${cx} 135.5Q${cx-7} 135.5 ${cx-7} 130Z`;
const doigts = cx => `<path class="mc-l" d="M${cx-2} 132v2.6M${cx+2} 132v2.6"/>`;

/* Les deux yeux, à 42 et 78, bas et écartés */
const YX = [42, 78], YY = 63;
const VISAGE = {
  ouverts: YX.map(x => `<path class="mc-encre" d="${el(x, YY, 5.6, 6.6)}"/>`).join("") ,
  reflets: YX.map(x => `<circle class="mc-blanc" cx="${x-1.7}" cy="${YY-2.5}" r="2.1"/><circle class="mc-blanc" cx="${x+1.9}" cy="${YY+2.3}" r="1.1"/>`).join(""),
  fermes: YX.map(x => `<path class="mc-trait" d="M${x-6} ${YY+1}Q${x} ${YY-6.5} ${x+6} ${YY+1}"/>`).join(""),
  coeur: YX.map(x => `<path class="mc-c-rose" d="${coeur(x, YY, 14)}"/>`).join(""),
  etoile: YX.map(x => `<path class="mc-c-or" d="${etoile(x, YY, 8, 3.8)}"/>`).join(""),
  plisses: YX.map((x, i) => `<path class="mc-encre" d="M${x-5.8} ${YY}h11.6a5.8 5 0 0 1 -11.6 0Z"/><path class="mc-trait" d="M${x-7} ${i ? YY-3 : YY-1}L${x+7} ${i ? YY-1 : YY-3}"/>`).join("")
};
function dessin(qui){
  const lilas = qui === "lilas";
  const crane = el(60, 57, 40, 33);
  const oreille = (cote, peche) => {
    const m = v => cote === "g" ? v : 120 - v, x = cote === "g" ? 38 : 82;
    const ext = `M${m(27)} 44Q${m(20)} 18 ${m(27)} 11Q${m(33)} 8 ${m(52)} 28Z`, int = `M${m(31)} 38Q${m(27)} 21 ${m(30)} 17Q${m(35)} 16 ${m(46)} 29Z`;
    return g("oreille-" + cote, `${x} 36`, sil(ext, peche ? "mc-marque" : "mc-peau") + `<path class="mc-int" d="${int}"/>`);
  };
  const queue = lilas
    ? `<path class="mc-q-encre" d="M80 124C96 126 102 118 101 104C100 96 100 92 104 88C110 82 110 72 101 70C94 68 89 72 88 78"/><path class="mc-q-rose" d="M80 124C96 126 102 118 101 104C100 96 100 92 104 88C110 82 110 72 101 70C94 68 89 72 88 78"/>`
    : `<path class="mc-q-encre" d="M80 126C96 128 103 116 99 104C97 97 90 97 90 103"/><path class="mc-q-peau" d="M80 126C96 128 103 116 99 104C97 97 90 97 90 103"/><path class="mc-q-marque" d="M98.6 103.2C97 97.5 90.5 97.5 90 103"/>`;
  const marques = lilas
    ? `<path class="mc-rayure" d="M50 30Q52 35 50 40M60 26Q60 32 60 38M70 30Q68 35 70 40"/>`
    : `<path class="mc-marque" d="M70 25.1A40 33 0 0 1 97 44.5Q88 52 80 44Q72 38 70 25.1Z"/>`;
  const pendentif = lilas
    ? `<path class="mc-t mc-blanc" style="stroke-width:1.6" d="M54.5 96h11q1.5 0 1.5 1.5v6q0 1.5-1.5 1.5h-11q-1.5 0-1.5-1.5v-6q0-1.5 1.5-1.5Z"/><path class="mc-l" d="M53.6 97.2 60 101.6l6.4-4.4"/>`
    : `<path class="mc-t mc-c-rose" style="stroke-width:1.6" d="${coeur(60, 100, 10)}"/>`;
  const bras = `M47 106h26a6 6 0 0 1 0 12h-26a6 6 0 0 1 0-12Z`;
  return `<svg class="mc-chat mc-${qui}" viewBox="0 0 120 140" aria-hidden="true" focusable="false" data-etat="attente" data-yeux="ouverts" data-bouche="sourire">`
    + g("tout", "60 136", g("souffle", "60 136",
        g("queue", "80 126", queue)
      + g("pattes-ar", "60 127", sil(el(37, 127, 11, 8.5), "mc-peau") + sil(el(83, 127, 11, 8.5), "mc-peau"))
      + g("pieds", "60 133", sil(el(51, 132, 7.5, 4.5), "mc-peau") + sil(el(69, 132, 7.5, 4.5), "mc-peau"))
      + g("corps", "60 112", sil(el(60, 112, 25, 23), "mc-peau") + `<path class="mc-ombre" d="M81.6 100A25 23 0 0 1 68.6 134.4Q80 124 81.6 100Z"/>` + (lilas ? "" : `<path class="mc-marque" d="${el(46, 118, 6, 7)}"/>`))
      + g("collier", "60 95", `<path class="mc-col-encre" d="M38 89Q60 101 82 89"/><path class="mc-col" d="M38 89Q60 101 82 89"/>` + pendentif)
      + g("acc-cou", "60 95", "")
      + g("patte-av-g", "52 113", sil(patte(52), "mc-peau") + doigts(52) + g("acc-main-g", "52 128", ""))
      + g("patte-av-d", "68 113", sil(patte(68), "mc-peau") + doigts(68) + g("acc-main", "68 128", ""))
      + g("bras-croises", "60 112", `<g transform="rotate(-16 60 112)">${sil(bras, "mc-peau")}</g><g transform="rotate(16 60 112)">${sil(bras, "mc-peau")}<path class="mc-l" d="M75 109.6v4M78.4 110.4v3"/></g>`)
      + g("tete", "60 90",
          oreille("g", !lilas) + oreille("d", false)
        + g("crane", "", sil(crane, "mc-peau") + `<path class="mc-ombre" d="M98.6 65.5A40 33 0 0 1 66.9 89.5Q88 84 98.6 65.5Z"/>` + marques)
        + g("joues", "60 73", `<path class="mc-joue" d="${el(31, 73, 6.5, 4.2)}"/><path class="mc-joue" d="${el(89, 73, 6.5, 4.2)}"/>`)
        + g("nez", "", `<path class="mc-t mc-nez" style="stroke-width:1.6" d="M57 68.6Q60 67.6 63 68.6Q61 72 60 72Q59 72 57 68.6Z"/>`)
        + g("yeux", "60 63", g("regard", "", VISAGE.ouverts + VISAGE.reflets), "ouverts")
        + ["fermes", "coeur", "etoile", "plisses"].map(x => g("yeux", "60 63", VISAGE[x], x)).join("")
        + g("larme", "84 72", `<path class="mc-t mc-larme" style="stroke-width:1.8" d="M84 68Q88 74 86 77Q84 79.5 82 77Q80 74 84 68Z"/>`)
        + g("bouche", "60 74", `<path class="mc-trait" style="stroke-width:2.4" d="M54 73.5Q57 77.5 60 73.5Q63 77.5 66 73.5"/>`, "sourire")
        + g("bouche", "60 74", `<path class="mc-t mc-gorge" style="stroke-width:2.2" d="M54.5 73Q60 72.4 65.5 73Q64 81.5 60 81.5Q56 81.5 54.5 73Z"/><path class="mc-langue" d="M57 79.4Q60 77 63 79.4Q61.6 81 60 81Q58.4 81 57 79.4Z"/>`, "ouverte")
        + g("bouche", "60 74", `<path class="mc-trait" style="stroke-width:2.4" d="M55 77.5Q60 73.5 65 77.5"/>`, "boude")
        + g("acc-tete", "60 24", "")
      )))
    + `<g data-p="effets"></g></svg>`;
}

/* Styles : injectés une fois. Couleurs propres aux personnages (exception assumée, comme le logo de saison). */
const CSS = `
.mc-chat{display:block;overflow:visible;pointer-events:none;--mc-encre:${ENCRE};--mc-rx:0;--mc-ry:0;--mc-dx:0;--mc-sens:1;--mc-h:26;--mc-sq:.86}
.mc-lilas{--mc-peau:#c9bdf5;--mc-ombre:#b2a3ee;--mc-marque:#8a78d6;--mc-int:#f7c1d3;--mc-collier:#E83F86}
.mc-praline{--mc-peau:#fff4e8;--mc-ombre:#f4e0cb;--mc-marque:#f6b48f;--mc-int:#f9c9b4;--mc-collier:#a898ee}
.mc-chat [data-p]{transform-box:view-box}
.mc-bas{fill:var(--mc-encre);stroke:var(--mc-encre);stroke-width:3;stroke-linejoin:round;transform:translateY(1.6px)}
.mc-t{stroke:var(--mc-encre);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}
.mc-peau{fill:var(--mc-peau)}.mc-ombre{fill:var(--mc-ombre)}.mc-marque{fill:var(--mc-marque)}.mc-int{fill:var(--mc-int)}
.mc-encre{fill:var(--mc-encre)}.mc-blanc{fill:#fff}.mc-joue{fill:#f4a7c0}.mc-nez{fill:#f08aa8}.mc-gorge{fill:#7a2a52}.mc-langue{fill:#f4a7c0}
.mc-c-rose{fill:#E83F86;stroke:var(--mc-encre);stroke-width:2;stroke-linejoin:round}.mc-c-or{fill:#FFC94A;stroke:var(--mc-encre);stroke-width:2;stroke-linejoin:round}
.mc-larme{fill:#bfe3ff}
.mc-trait,.mc-l,.mc-rayure,.mc-q-encre,.mc-q-rose,.mc-q-peau,.mc-q-marque,.mc-col-encre,.mc-col{fill:none;stroke-linecap:round;stroke-linejoin:round}
.mc-trait{stroke:var(--mc-encre);stroke-width:2.8}.mc-l{stroke:var(--mc-encre);stroke-width:1.5}
.mc-rayure{stroke:var(--mc-marque);stroke-width:3.4}
.mc-q-encre{stroke:var(--mc-encre);stroke-width:10.5}.mc-q-rose{stroke:#E83F86;stroke-width:5}.mc-q-peau{stroke:var(--mc-peau);stroke-width:5}.mc-q-marque{stroke:var(--mc-marque);stroke-width:5}
.mc-col-encre{stroke:var(--mc-encre);stroke-width:8.5}.mc-col{stroke:var(--mc-collier);stroke-width:4.4}
.mc-chat [data-x],.mc-chat [data-p="larme"],.mc-chat [data-p="bras-croises"]{opacity:0;transition:opacity .18s}
${["ouverts","fermes","coeur","etoile","plisses"].map(x => `.mc-chat[data-yeux="${x}"] [data-p="yeux"][data-x="${x}"]`).join(",")},
${["sourire","ouverte","boude"].map(x => `.mc-chat[data-bouche="${x}"] [data-p="bouche"][data-x="${x}"]`).join(",")},
.mc-chat.mc-larme-on [data-p="larme"]{opacity:1}
/* Mouvements d'état : transitions douces, avec un léger dépassement */
.mc-chat [data-p="tout"],.mc-chat [data-p="tete"],.mc-chat [data-p^="oreille"],.mc-chat [data-p^="patte-av"],.mc-chat [data-p="joues"],.mc-chat [data-p="regard"]{transition:transform .35s cubic-bezier(.3,1.4,.5,1),opacity .18s}
.mc-chat{transition:transform .55s cubic-bezier(.3,.8,.3,1);transform:translateX(calc(var(--mc-dx)*1px))}
.mc-chat [data-p="regard"]{transform:translate(calc(var(--mc-rx)*1px),calc(var(--mc-ry)*1px))}
.mc-chat [data-p="tete"]{transform:rotate(calc(var(--mc-rx)*1.4deg))}
.mc-chat.mc-cligne [data-p="yeux"][data-x="ouverts"]{transform:scaleY(.08);transition:transform .07s}
[data-etat="boude"] [data-p^="patte-av"]{opacity:0}
[data-etat="boude"] [data-p="bras-croises"]{opacity:1}
[data-etat="boude"] [data-p="tete"]{transform:rotate(calc(var(--mc-sens)*-9deg)) translateY(1px)}
[data-etat="triste"] [data-p="oreille-g"]{transform:rotate(-28deg)}
[data-etat="triste"] [data-p="oreille-d"]{transform:rotate(28deg)}
[data-etat="triste"] [data-p="tete"]{transform:rotate(calc(var(--mc-sens)*4deg)) translateY(2px)}
.mc-chat [data-p="joues"] path{transform-box:fill-box;transform-origin:center;transition:transform .35s}
[data-etat="timide"] [data-p="joues"] path{transform:scale(1.35)}
[data-etat="timide"] [data-p="tete"]{transform:rotate(calc(var(--mc-sens)*-7deg))}
[data-etat="timide"] [data-p="regard"]{transform:translate(calc(var(--mc-sens)*-1.5px),2px)}
[data-etat="calin"] [data-p="tout"]{transform:translateX(calc(var(--mc-sens)*9px)) rotate(calc(var(--mc-sens)*8deg))}
[data-etat="calin"] [data-p="patte-av-d"]{transform:rotate(calc(var(--mc-sens)*-78deg))}
[data-etat="calin"] [data-p="patte-av-g"]{transform:rotate(calc(var(--mc-sens)*-30deg))}
[data-etat="attentif"] [data-p="oreille-g"]{transform:rotate(6deg)}
[data-etat="attentif"] [data-p="oreille-d"]{transform:rotate(-6deg)}
/* Animations continues (niveau n ; d plus lent) */
.mc-anim [data-p="souffle"]{animation:mc-souffle 3.4s ease-in-out infinite}
.mc-anim [data-p="queue"]{animation:mc-queue 2.8s ease-in-out infinite alternate}
.mc-tic [data-p="oreille-d"]{animation:mc-tic .32s ease-out}
.mc-court [data-p="tout"]{animation:mc-court .26s ease-in-out infinite}
@keyframes mc-souffle{50%{transform:scale(1.012,1.026)}}
@keyframes mc-queue{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}
@keyframes mc-tic{40%{transform:rotate(-16deg)}}
@keyframes mc-court{50%{transform:translateY(-5px) rotate(calc(var(--mc-sens)*4deg))}}
/* Gestes ponctuels */
.mc-j-saut [data-p="tout"]{animation:mc-saut calc(.9s * var(--mc-k,1)) both}
@keyframes mc-saut{
  0%{transform:none}
  20%{transform:scale(calc(2 - var(--mc-sq)),var(--mc-sq));animation-timing-function:cubic-bezier(.2,.7,.4,1)}
  48%{transform:translateY(calc(var(--mc-h)*-1px)) scale(.95,1.07);animation-timing-function:cubic-bezier(.6,0,.8,.4)}
  70%{transform:scale(calc(2.08 - var(--mc-sq)),calc(var(--mc-sq) + .02))}
  85%{transform:translateY(-2px) scale(.98,1.03)}
  100%{transform:none}}
.mc-j-tire [data-p="patte-av-g"]{animation:mc-tire-p calc(1s * var(--mc-k,1)) both}
.mc-j-tire [data-p="tout"]{animation:mc-tire-t calc(1s * var(--mc-k,1)) both}
@keyframes mc-tire-p{25%{transform:rotate(150deg)}40%{transform:rotate(156deg)}70%{transform:rotate(120deg)}100%{transform:none}}
@keyframes mc-tire-t{25%{transform:translateX(-4px) rotate(-7deg)}40%{transform:translateX(-4px) rotate(-8deg)}70%{transform:translateX(6px) rotate(7deg)}100%{transform:none}}
.mc-j-coucou [data-p="patte-av-d"]{animation:mc-coucou calc(1.5s * var(--mc-k,1)) both}
@keyframes mc-coucou{15%,45%,75%{transform:rotate(-150deg)}30%,60%,88%{transform:rotate(-122deg)}100%{transform:none}}
.mc-j-tapote [data-p="patte-av-g"]{animation:mc-tapote calc(1.2s * var(--mc-k,1)) both}
.mc-j-tapote [data-p="tout"]{animation:mc-penche calc(1.2s * var(--mc-k,1)) both}
@keyframes mc-tapote{20%,50%,80%{transform:rotate(112deg)}35%,65%{transform:rotate(126deg)}100%{transform:none}}
@keyframes mc-penche{20%,80%{transform:translateX(-5px) rotate(-5deg)}100%{transform:none}}
.mc-j-soupir [data-p="souffle"]{animation:mc-soupir calc(1.3s * var(--mc-k,1)) ease-in-out both}
@keyframes mc-soupir{35%{transform:scale(1.02,1.05)}75%{transform:scale(1.02,.95)}100%{transform:none}}
.mc-j-glisse [data-p="tout"]{animation:mc-glisse calc(.65s * var(--mc-k,1)) both}
@keyframes mc-glisse{0%{transform:translateX(calc(var(--mc-sens)*-46px));opacity:0}60%{transform:translateX(calc(var(--mc-sens)*3px));opacity:1}80%{transform:scale(1.04,.96)}100%{transform:none}}
.mc-coeur{animation:mc-monte .95s ease-out both}
@keyframes mc-monte{0%{transform:translateY(0) scale(.4);opacity:0}25%{opacity:1;transform:translateY(-6px) scale(1.1)}100%{transform:translateY(-30px) scale(.9);opacity:0}}
/* Énergie réduite : moins haut, moins écrasé, plus lent */
.mc-e-d{--mc-h:9;--mc-sq:.95;--mc-k:1.4}
.mc-e-d.mc-anim [data-p="souffle"]{animation-duration:4.6s}.mc-e-d.mc-anim [data-p="queue"]{animation-duration:4.2s}
/* Immobile (animations « Aucune », « moins de mouvement », pause) : seulement des fondus */
.mc-e-0,.mc-e-0 *{animation:none!important;transition:opacity .25s!important}
.mc-pause,.mc-pause *{animation-play-state:paused!important}
@media (prefers-reduced-motion:reduce){.mc-chat,.mc-chat *{animation:none!important;transition:opacity .25s!important}}
`;
let styleMis = false;
function styles(){
  if(styleMis) return; styleMis = true;
  document.head.insertAdjacentHTML("beforeend", `<style data-mascotte>${CSS}</style>`);
}

const ETATS = {
  attente:{yeux:"ouverts", bouche:"sourire"}, attentif:{yeux:"ouverts", bouche:"sourire"},
  regarde:{yeux:"ouverts", bouche:"sourire"}, timide:{yeux:"ouverts", bouche:"sourire"},
  joie:{yeux:"fermes", bouche:"ouverte"}, calin:{yeux:"coeur", bouche:"ouverte"}, etoile:{yeux:"etoile", bouche:"ouverte"},
  boude:{yeux:"plisses", bouche:"boude"}, triste:{yeux:"fermes", bouche:"boude"}
};
const DUREES = {saut:900, tire:1000, coucou:1500, tapote:1200, soupir:1300, glisse:650};
const FAMILLES = {};
const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasard = (a, b) => a + Math.random() * (b - a);
const instances = new Set();
document.addEventListener("visibilitychange", () => instances.forEach(c => c._vis()));

/* Un chaton. o : {energie: "n"|"d"|"0", famille, sens: 1 (regarde vers la droite) ou -1} */
function chat(qui, o = {}){
  styles();
  const tmp = document.createElement("div");
  tmp.innerHTML = dessin(qui);
  const svg = tmp.firstChild;
  svg.querySelectorAll("[data-a]").forEach(p => { const [x, y] = p.dataset.a.split(" "); p.style.transformOrigin = `${x}px ${y}px`; });
  let energie = "n", visible = true, timers = [], geste = null;
  const c = {el: svg, qui};
  const immobile = () => energie === "0" || reduit();
  const enPause = () => !visible || document.hidden;
  const plus = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); fn(); }, ms); timers.push(t); return t; };
  function boucle(){ // clignement et oreille, à intervalles irréguliers ; rien en pause ni immobile
    plus(() => {
      if(!immobile() && !enPause() && svg.dataset.yeux === "ouverts"){
        svg.classList.add("mc-cligne"); plus(() => svg.classList.remove("mc-cligne"), 130);
        if(Math.random() < .25) plus(() => { svg.classList.add("mc-cligne"); plus(() => svg.classList.remove("mc-cligne"), 120); }, 260);
      }
      boucle();
    }, hasard(2400, 6200));
  }
  function oreille(){
    plus(() => {
      if(!immobile() && !enPause()){ svg.classList.add("mc-tic"); plus(() => svg.classList.remove("mc-tic"), 340); }
      oreille();
    }, hasard(4500, 10000));
  }
  c._vis = () => svg.classList.toggle("mc-pause", enPause());
  c.energie = e => {
    energie = ["n", "d", "0"].includes(e) ? e : "n";
    svg.classList.remove("mc-e-n", "mc-e-d", "mc-e-0");
    svg.classList.add("mc-e-" + (immobile() ? "0" : energie));
    svg.classList.toggle("mc-anim", !immobile());
    return c;
  };
  c.etat = (nom, plusieurs = {}) => {
    const e = ETATS[nom] || ETATS.attente;
    svg.dataset.etat = nom;
    svg.dataset.yeux = plusieurs.yeux || e.yeux;
    svg.dataset.bouche = plusieurs.bouche || e.bouche;
    if(nom !== "regarde") c.regard(0, 0);
    return c;
  };
  c.yeux = x => { svg.dataset.yeux = x; return c; };
  c.bouche = x => { svg.dataset.bouche = x; return c; };
  c.larme = on => { svg.classList.toggle("mc-larme-on", !!on); return c; };
  c.regard = (dx, dy) => { const b = v => Math.max(-3, Math.min(3, v)); svg.style.setProperty("--mc-rx", b(dx)); svg.style.setProperty("--mc-ry", b(dy)); return c; };
  c.deplacer = dx => { svg.style.setProperty("--mc-dx", Math.round(dx)); return c; };
  c.courir = on => { svg.classList.toggle("mc-court", !!on && !immobile()); return c; };
  /* Geste ponctuel ; la promesse se résout à la fin (tout de suite si immobile) */
  c.jouer = nom => new Promise(fin => {
    if(geste){ svg.classList.remove("mc-j-" + geste); }
    if(immobile() || !DUREES[nom]){ geste = null; fin(); return; }
    geste = nom; svg.classList.remove("mc-j-" + nom); svg.getBoundingClientRect(); svg.classList.add("mc-j-" + nom);
    plus(() => { svg.classList.remove("mc-j-" + nom); if(geste === nom) geste = null; fin(); }, DUREES[nom] * (energie === "d" ? 1.4 : 1));
  });
  /* Réaction au toucher : yeux fermés et petit cœur qui monte */
  c.toucher = () => {
    const avant = svg.dataset.yeux;
    c.yeux("fermes");
    const fx = svg.querySelector('[data-p="effets"]');
    fx.insertAdjacentHTML("beforeend", `<path class="mc-t mc-c-rose${immobile() ? "" : " mc-coeur"}" style="stroke-width:2;transform-box:view-box;transform-origin:60px 14px" d="${coeur(60, 14, 13)}"/>`);
    const h = fx.lastChild;
    plus(() => { h.remove(); if(svg.dataset.yeux === "fermes") c.yeux(avant === "fermes" ? "ouverts" : avant); }, 950);
  };
  c.famille = id => {
    const f = FAMILLES[id], acc = (f && f.acc && f.acc[qui]) || {};
    ["tete", "cou", "main", "main-g"].forEach(k => { const p = svg.querySelector(`[data-p="acc-${k}"]`); if(p) p.innerHTML = acc[k] || ""; });
    return c;
  };
  c.detruire = () => { timers.forEach(clearTimeout); timers = []; obs && obs.disconnect(); instances.delete(c); svg.remove(); };
  const obs = "IntersectionObserver" in window ? new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; c._vis(); }) : null;
  obs && obs.observe(svg);
  svg.style.setProperty("--mc-sens", o.sens === -1 ? -1 : 1);
  instances.add(c);
  c.energie(o.energie).etat("attente");
  if(o.famille) c.famille(o.famille);
  boucle(); oreille();
  return c;
}

window.Mascotte = {
  chat,
  famille: (id, def) => { FAMILLES[id] = def; },
  familles: () => Object.keys(FAMILLES),
  particules: id => (FAMILLES[id] && FAMILLES[id].particules) || null,
  pieces: ["tout","souffle","queue","pattes-ar","pieds","corps","patte-av-g","patte-av-d","acc-main","acc-main-g","bras-croises","collier","acc-cou","tete","oreille-g","oreille-d","crane","joues","nez","yeux","regard","larme","bouche","acc-tete","effets"],
  expressions: ["ouverts","fermes","coeur","etoile","plisses"],
  etats: Object.keys(ETATS),
  gestes: Object.keys(DUREES),
  _dessin: dessin
};
})();

oseLoaded("mascotte", "0000000000");
