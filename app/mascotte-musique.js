/* Mascottes, famille Musique (fête de la musique) : casques ; attente = ils hochent la tête en rythme, des notes sortent du
   casque de Lilas ; Oui = petite danse, les notes s'envolent, puis saut. Accessoires en coordonnées du chaton (viewBox 0 0 120 140) ;
   objets à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
const ENCRE = "#1F1546";
const casque = (fond, coque) => `<path style="fill:none;stroke:${ENCRE};stroke-width:7;stroke-linecap:round" d="M26 52Q27 21 60 19Q93 21 94 52"/>`
  + `<path style="fill:none;stroke:${fond};stroke-width:3.6;stroke-linecap:round" d="M26 52Q27 21 60 19Q93 21 94 52"/>`
  + [[17, 44], [91, 44]].map(([x, y]) => `<rect class="mc-bas" x="${x}" y="${y}" width="12" height="20" rx="5"/><rect class="mc-t" style="fill:${coque};stroke-width:2.2" x="${x}" y="${y}" width="12" height="20" rx="5"/>`
    + `<path style="fill:none;stroke:${fond};stroke-width:2.2;stroke-linecap:round" d="M${x + 4} ${y + 5}v10"/>`).join("");
const note = (x, y, c, k) => `<g class="${k}"><path d="M${x + 3.4} ${y}v-11l6 2.2v3.4l-6-2.2" style="fill:${c};stroke:${ENCRE};stroke-width:1.4;stroke-linejoin:round"/>`
  + `<ellipse cx="${x}" cy="${y}" rx="4" ry="3.1" transform="rotate(-20 ${x} ${y})" style="fill:${c};stroke:${ENCRE};stroke-width:1.4"/></g>`;
// Notes qui sortent du casque (objet, 30 x 34 px) et notes qui s'envolent au Oui (objet, 120 x 60 px)
const petites = `<svg viewBox="0 0 30 34" width="30" height="34">${note(9, 30, "#E8458B", "mcm-n mcm-n1")}${note(20, 30, "#2BB5B0", "mcm-n mcm-n2")}</svg>`;
const COUL = ["#E8458B", "#2BB5B0", "#FFC94A", "#a898ee", "#F2994A"];
const envol = `<svg viewBox="0 0 170 40" width="170" height="40">${[[30, 36], [48, 26], [85, 18], [122, 26], [140, 36]].map(([x, y], i) => note(x, y, COUL[i], "mcm-v mcm-v" + (i < 2 ? "g" : i > 2 ? "d" : "m"))).join("")}</svg>`;
let objets = [];
Mascotte.famille("musique", {
  particules: ["note", "note2"],
  acc: {lilas: {tete: casque("#E8458B", "#FFC94A")}, praline: {tete: casque("#2BB5B0", "#a898ee")}},
  css: `.mcm-notes{left:-8px;bottom:50px}.mcm-envol{left:-29px;bottom:28px}
.mcm-n{opacity:0;transform-box:fill-box;transform-origin:50% 100%}
.mcm-notes .mcm-n1{animation:mcm-monte 1.8s ease-out 8}.mcm-notes .mcm-n2{animation:mcm-monte 1.8s .9s ease-out 8}
@keyframes mcm-monte{0%{opacity:0;transform:translate(6px,4px) scale(.5)}25%{opacity:1}100%{opacity:0;transform:translate(-4px,-20px) rotate(-12deg)}}
.mc-fige .mcm-n1{opacity:1;transform:translateY(-8px)}
.mcm-rythme [data-p="tete"]{animation:mcm-hoche .42s ease-in-out 34 alternate}.mcm-rythme.mc-praline [data-p="tete"]{animation-delay:.21s}
@keyframes mcm-hoche{from{transform:rotate(-4deg)}to{transform:rotate(4deg) translateY(1.5px)}}
.mcm-danse [data-p="tout"]{animation:mcm-danse .4s ease-in-out 4 alternate}.mcm-danse.mc-praline [data-p="tout"]{animation-delay:.2s}
@keyframes mcm-danse{from{transform:rotate(-8deg) translateY(0)}to{transform:rotate(8deg) translateY(-3px)}}
.mcm-v{opacity:0;transform-box:fill-box;transform-origin:50% 100%;animation:mcm-vole 1.6s ease-out forwards}
${[0, 1, 2, 3, 4].map(i => `.mcm-v:nth-child(${i + 1}){animation-delay:${(i * .15).toFixed(2)}s}`).join("")}
.mcm-vg{--x:-16px}.mcm-vd{--x:16px}.mcm-vm{--x:0px}
@keyframes mcm-vole{0%{opacity:0;transform:translateY(8px) scale(.4)}25%{opacity:1;transform:none}100%{opacity:0;transform:translate(var(--x),-8px) rotate(14deg)}}
.mc-fige .mcm-v{animation:none;opacity:1}`,
  attente(duo, o){
    objets.forEach(x => x.remove());
    objets = [o.objet(petites, "mcm-notes")];
    if(!o.fige) duo.forEach(c => c.el.classList.add("mcm-rythme"));
    else objets[0].classList.add("mc-fige");
  },
  oui(duo, o){
    objets.forEach(x => x.remove()); objets = [];
    duo.forEach(c => { c.el.classList.remove("mcm-rythme"); c.etat("joie"); });
    if(o.fige || o.info.rejoue) return;
    duo.forEach(c => c.el.classList.add("mcm-danse")); // petite danse
    objets = [o.objet(envol, "mcm-envol")];
    o.ensuite(() => { objets.forEach(x => x.remove()); objets = []; }, 2400);
    o.ensuite(() => { duo.forEach(c => c.el.classList.remove("mcm-danse")); o.saut(); }, 1700);
  }
});
})();

oseLoaded("mascotteMusique", "d81590a839");
