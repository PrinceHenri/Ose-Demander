/* Mascottes, famille Pâques : oreilles de lapin ; attente = chasse aux œufs (des œufs pointent dans une touffe d'herbe à côté
   de Lilas, un petit panier entre les deux chatons) ; Oui = le panier déborde d'œufs, saut de joie.
   Accessoires en coordonnées du chaton (viewBox 0 0 120 140) ; objets à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
const ENCRE = "#1F1546";
// Serre-tête à oreilles de lapin, agrandi pour rester lisible sur un chaton de 60 px
const oreille = (x, r) => `<g transform="rotate(${r} ${x} 22)"><path class="mc-bas" d="M${x - 5.5} 22Q${x - 7} 2 ${x} -8Q${x + 7} 2 ${x + 5.5} 22Z"/>`
  + `<path class="mc-t" style="fill:#FFF4E8;stroke-width:2" d="M${x - 5.5} 22Q${x - 7} 2 ${x} -8Q${x + 7} 2 ${x + 5.5} 22Z"/><path style="fill:#F4A7C0" d="M${x - 2.6} 19Q${x - 3.4} 5 ${x} -2.5Q${x + 3.4} 5 ${x + 2.6} 19Z"/></g>`;
const oreilles = `<g transform="translate(60 24) scale(1.15) translate(-60 -24)">${oreille(50, -14)}${oreille(70, 14)}`
  + `<path class="mc-t" style="fill:#F4A7C0;stroke-width:1.8" d="M38 27Q60 15 82 27L81 31Q60 20 39 31Z"/></g>`;
const oeuf = (x, y, c, k = "") => `<g class="${k}"><ellipse cx="${x}" cy="${y}" rx="3.8" ry="4.8" style="fill:${c};stroke:${ENCRE};stroke-width:1.3"/>`
  + `<path d="M${x - 3.6} ${y + .4}l1.8-1.6 1.8 1.6 1.8-1.6 1.8 1.6 1.8-1.6" style="fill:none;stroke:#fff;stroke-width:1.1;stroke-linejoin:round"/></g>`;
// Touffe d'herbe (objet, 30 x 22 px) : deux œufs qui pointent tour à tour
const brin = "M2 21Q4 13 6 10Q7 15 9 17Q10 11 13 8Q14 15 16 17Q18 12 21 9Q21 15 23 17Q25 12 28 10Q27 16 28 21Z";
const herbe = `<svg viewBox="0 0 30 22" width="30" height="22">${oeuf(10, 15, "#FFC94A", "mcp-pic mcp-pic1")}${oeuf(20, 15, "#8DD3C7", "mcp-pic mcp-pic2")}`
  + `<path d="${brin}" style="fill:#6FBF5A;stroke:${ENCRE};stroke-width:1.6;stroke-linejoin:round"/></svg>`;
// Panier (objet, 32 x 34 px) : un œuf déjà trouvé ; au Oui, il déborde
const panier = `<svg viewBox="0 0 32 34" width="37" height="39"><path d="M7 22Q16 4 25 22" style="fill:none;stroke:${ENCRE};stroke-width:4.4;stroke-linecap:round"/><path d="M7 22Q16 4 25 22" style="fill:none;stroke:#C98F4E;stroke-width:2;stroke-linecap:round"/>`
  + `<g class="mcp-plein">${oeuf(10, 17, "#a898ee")}${oeuf(22, 17, "#FFC94A")}${oeuf(13, 11, "#8DD3C7")}${oeuf(20, 10, "#F4A7C0")}${oeuf(16.5, 4.5, "#FFF4E8")}</g>${oeuf(16, 18, "#F4A7C0")}`
  + `<path d="M3 21h26l-3 11.5H6Z" transform="translate(1.3 1.3)" style="fill:${ENCRE}"/><path d="M3 21h26l-3 11.5H6Z" style="fill:#E0A866;stroke:${ENCRE};stroke-width:2;stroke-linejoin:round"/>`
  + `<path d="M5 25h22M6 29h20M11 21.5l-1 10.5M16 21.5v10.5M21 21.5l1 10.5" style="stroke:#9C6430;stroke-width:1.1"/></svg>`;
let objets = [];
Mascotte.famille("paques", {
  particules: ["egg", "flower"],
  acc: {lilas: {tete: oreilles}, praline: {tete: oreilles}},
  css: `.mcp-herbe{left:-26px;bottom:0}.mcp-panier{left:32px;bottom:-2px}
.mcp-pic{transform-box:fill-box;transform-origin:50% 100%;transform:translateY(5px)}
.mcp-herbe .mcp-pic1{animation:mcp-pic 1.1s ease-in-out 8 alternate}.mcp-herbe .mcp-pic2{animation:mcp-pic 1.1s ease-in-out .55s 8 alternate}
@keyframes mcp-pic{from{transform:translateY(5px)}to{transform:translateY(-6px)}}.mcp-herbe.mc-fige .mcp-pic{transform:translateY(-4px)}
.mcp-plein g{opacity:0;transform-box:fill-box;transform-origin:50% 100%}
.mcp-deborde .mcp-plein g{animation:mcp-oeuf .45s cubic-bezier(.3,1.6,.5,1) forwards}
${[0, 1, 2, 3, 4].map(i => `.mcp-deborde .mcp-plein g:nth-child(${i + 1}){animation-delay:${(i * .13).toFixed(2)}s}`).join("")}
@keyframes mcp-oeuf{from{opacity:0;transform:translateY(6px) scale(.4)}to{opacity:1;transform:none}}
.mcp-deborde.mc-fige .mcp-plein g{opacity:1}.mcp-trouve{animation:mcp-trouve .5s ease-in forwards}@keyframes mcp-trouve{to{opacity:0;transform:translateY(4px)}}`,
  attente(duo, o){
    const [l, p] = duo;
    objets = [o.objet(herbe, "mcp-herbe"), o.objet(panier, "mcp-panier")];
    if(!o.fige){ l.etat("regarde").regard(-3, 2); p.etat("regarde").regard(-3, 2); }
  },
  oui(duo, o){
    const [herbe, panier] = objets;
    if(!panier) return o.saut();
    const fixe = o.fige || o.info.rejoue;
    if(fixe){ panier.classList.add("mc-fige"); if(herbe) herbe.remove(); }
    else if(herbe) herbe.classList.add("mcp-trouve");
    panier.classList.add("mcp-deborde");
    if(!fixe) o.ensuite(() => o.saut(), 700);
  }
});
})();

oseLoaded("mascottePaques", "8fae96399e");
