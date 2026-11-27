/* Mascottes, famille Halloween : petites capes (mignon, jamais effrayant) ; attente = une citrouille souriante posée à côté de
   Lilas, qui se dandine et s'éclaire doucement ; Oui = des bonbons pleuvent autour d'eux, saut. Accessoires en coordonnées du
   chaton (viewBox 0 0 120 140) ; objets à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
const ENCRE = "#1F1546";
// Petite cape : col pointu, deux pans qui dépassent de chaque côté, fermoir rond
const cape = (fond, doublure) => `<path class="mc-bas" d="M47 91Q30 104 24 130L37 127Q40 108 52 96ZM73 91Q90 104 96 130L83 127Q80 108 68 96Z"/>`
  + `<path class="mc-t" style="fill:${fond};stroke-width:2" d="M47 91Q30 104 24 130L37 127Q40 108 52 96Z"/><path class="mc-t" style="fill:${fond};stroke-width:2" d="M73 91Q90 104 96 130L83 127Q80 108 68 96Z"/>`
  + `<path style="fill:${doublure}" d="M45 96Q35 108 31 126L36 125Q39 110 49 98ZM75 96Q85 108 89 126L84 125Q81 110 71 98Z"/>`
  + `<path class="mc-t" style="fill:${fond};stroke-width:2" d="M42 86L58 93L60 99L62 93L78 86L72 97L60 100L48 97Z"/>`
  + `<circle class="mc-t" style="fill:#FFC94A;stroke-width:1.6" cx="60" cy="98" r="3.4"/>`;
// Citrouille souriante (objet, 30 x 28 px)
const citrouille = `<svg viewBox="0 0 30 28" width="30" height="28"><path d="M15 6c7 0 13 4.3 13 10.5S22 27 15 27S2 22.7 2 16.5S8 6 15 6Z" transform="translate(1.3 1.3)" style="fill:${ENCRE}"/>`
  + `<path d="M15 6c7 0 13 4.3 13 10.5S22 27 15 27S2 22.7 2 16.5S8 6 15 6Z" style="fill:#F28C28;stroke:${ENCRE};stroke-width:2"/>`
  + `<path d="M15 7v19M8.5 8c-2.5 5-2.5 12 0 17M21.5 8c2.5 5 2.5 12 0 17" style="fill:none;stroke:#C8641A;stroke-width:1.3"/>`
  + `<path d="M14 6.5Q14 2 17 1" style="fill:none;stroke:#3CA370;stroke-width:2.6;stroke-linecap:round"/>`
  + `<g class="mcw-visage"><circle cx="10" cy="15" r="2.1" style="fill:${ENCRE}"/><circle cx="20" cy="15" r="2.1" style="fill:${ENCRE}"/><circle cx="10.7" cy="14.3" r=".7" style="fill:#fff"/><circle cx="20.7" cy="14.3" r=".7" style="fill:#fff"/>`
  + `<path d="M10.5 19.5Q15 23.5 19.5 19.5" style="fill:none;stroke:${ENCRE};stroke-width:1.8;stroke-linecap:round"/><ellipse cx="7" cy="18.5" rx="1.8" ry="1.1" style="fill:#F4A7C0"/><ellipse cx="23" cy="18.5" rx="1.8" ry="1.1" style="fill:#F4A7C0"/></g></svg>`;
// Pluie de bonbons (objet, 170 x 64 px) : ils tombent et restent posés autour des chatons
const bonbon = (x, c, r) => `<g class="mcw-b"><g transform="translate(${x} 56) rotate(${r})"><path d="M-9 -4L-4.5 0L-9 4ZM9 -4L4.5 0L9 4Z" style="fill:${c};stroke:${ENCRE};stroke-width:1.2;stroke-linejoin:round"/>`
  + `<ellipse rx="5.2" ry="4" style="fill:${c};stroke:${ENCRE};stroke-width:1.4"/><path d="M-1.6 -3.6L1.6 3.6" style="stroke:#fff;stroke-width:1.3"/></g></g>`;
const pluie = `<svg viewBox="0 0 170 64" width="170" height="64">${[[12, "#E83F86", -20], [32, "#FFC94A", 25], [60, "#8DD3C7", -10], [108, "#a898ee", 15], [138, "#F28C28", -30], [158, "#3CA370", 20]].map(a => bonbon(...a)).join("")}</svg>`;
let objets = [];
Mascotte.famille("halloween", {
  particules: ["candy", "pumpkin"],
  acc: {lilas: {cou: cape("#5B3A9E", "#F28C28")}, praline: {cou: cape("#F28C28", "#5B3A9E")}},
  css: `.mcw-citrouille{left:-28px;bottom:0}.mcw-pluie{left:-29px;bottom:-6px}
.mcw-citrouille svg{transform-origin:50% 100%;animation:mcw-dandine 1.4s ease-in-out 10 alternate}@keyframes mcw-dandine{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
.mcw-visage{animation:mcw-lueur 1.4s ease-in-out 10 alternate}@keyframes mcw-lueur{to{opacity:.55}}
.mc-fige .mcw-citrouille svg,.mc-fige .mcw-visage,.mcw-citrouille.mc-fige svg,.mcw-citrouille.mc-fige .mcw-visage{animation:none}
.mcw-b{transform-box:view-box;opacity:0;animation:mcw-tombe .7s cubic-bezier(.5,0,.7,1.4) forwards}
${[0, 1, 2, 3, 4, 5].map(i => `.mcw-b:nth-child(${i + 1}){animation-delay:${[0, .3, .12, .42, .2, .5][i]}s}`).join("")}
@keyframes mcw-tombe{0%{opacity:0;transform:translateY(-52px)}15%{opacity:1}100%{opacity:1;transform:none}}
.mcw-pluie.mc-fige .mcw-b{animation:none;opacity:1}`,
  attente(duo, o){
    objets.forEach(x => x.remove());
    objets = [o.objet(citrouille, "mcw-citrouille" + (o.fige ? " mc-fige" : ""))];
    if(!o.fige) duo.forEach(c => c.etat("regarde").regard(-3, 2));
  },
  oui(duo, o){
    duo.forEach(c => c.etat("joie"));
    const p = o.objet(pluie, "mcw-pluie"); objets.push(p); // des bonbons pleuvent
    if(o.fige || o.info.rejoue){ p.classList.add("mc-fige"); return; }
    o.ensuite(() => o.saut(), 800);
  }
});
})();

oseLoaded("mascotteHalloween", "14d66a36ae");
