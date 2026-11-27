/* Mascottes, famille Bébé (baby shower) : bonnet tricoté pour Praline ; attente = ils tricotent un minuscule bonnet (aiguilles
   qui alternent, fil relié à une pelote) ; Oui = la pelote se déroule en guirlande d'étoiles et de petits nuages, saut de joie,
   pas de câlin amoureux. Accessoires en coordonnées du chaton ; objets à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
const ENCRE = "#1F1546";
const bonnet = `<g transform="translate(60 24) scale(1.2) translate(-60 -24)"><path class="mc-bas" d="M41 31Q42 11 60 10Q78 11 79 31Z"/><path class="mc-t" style="fill:#8DD3C7;stroke-width:2.2" d="M41 31Q42 11 60 10Q78 11 79 31Z"/>`
  + `<path class="mc-t" style="fill:#FFF4E8;stroke-width:2" d="M40 26h40v6.5h-40Z"/><path style="stroke:#cfc6f2;stroke-width:1.4" d="M45 27v4.5M50 27v4.5M55 27v4.5M60 27v4.5M65 27v4.5M70 27v4.5M75 27v4.5"/>`
  + `<path class="mc-t" style="fill:#FFF4E8;stroke-width:1.8" d="M56 8.5a4 4 0 1 0 8 0a4 4 0 1 0-8 0Z"/></g>`;
// Tricot (objet, 44 x 34 px) : pelote, fil, deux aiguilles, minuscule bonnet en cours
const tricot = `<svg viewBox="0 0 44 34" width="44" height="34"><path d="M10 26Q18 30 26 22" style="fill:none;stroke:#E83F86;stroke-width:1.6;stroke-linecap:round"/>`
  + `<circle cx="8" cy="26" r="7" style="fill:${ENCRE}" transform="translate(0 1.4)"/><circle cx="8" cy="26" r="7" style="fill:#F4A7C0;stroke:${ENCRE};stroke-width:1.8"/>`
  + `<path d="M3 23q5 3 10-1M3.4 28q5 2 9.4-2.4M6 20q2 5 0 12" style="fill:none;stroke:#E83F86;stroke-width:1.1;stroke-linecap:round"/>`
  + `<path d="M22 26q0-8 8-8t8 8Z" style="fill:#8DD3C7;stroke:${ENCRE};stroke-width:1.6;stroke-linejoin:round"/><path d="M24 23.5h12" style="stroke:#FFF4E8;stroke-width:1.6"/>`
  + `<g class="mcb-aig1"><path d="M22 6L34 20" style="stroke:${ENCRE};stroke-width:3.2;stroke-linecap:round"/><path d="M22 6L34 20" style="stroke:#FFC94A;stroke-width:1.5;stroke-linecap:round"/><circle cx="21.5" cy="5.5" r="2" style="fill:#E83F86;stroke:${ENCRE};stroke-width:1"/></g>`
  + `<g class="mcb-aig2"><path d="M40 6L28 20" style="stroke:${ENCRE};stroke-width:3.2;stroke-linecap:round"/><path d="M40 6L28 20" style="stroke:#FFC94A;stroke-width:1.5;stroke-linecap:round"/><circle cx="40.5" cy="5.5" r="2" style="fill:#a898ee;stroke:${ENCRE};stroke-width:1"/></g></svg>`;
// Guirlande (objet, 170 x 52 px) : le fil de la pelote, avec étoiles et petits nuages qui apparaissent l'un après l'autre
const pt = t => [(1 - t) ** 2 * 8 + 2 * (1 - t) * t * 85 + t * t * 162, (1 - t) ** 2 * 46 + 2 * (1 - t) * t * 18 + t * t * 46];
const etoile = (x, y) => { let d = ""; for(let i = 0; i < 10; i++){ const r = i % 2 ? 2.6 : 6, a = Math.PI / 5 * i - Math.PI / 2; d += (i ? "L" : "M") + (x + r * Math.cos(a)).toFixed(1) + " " + (y + r * Math.sin(a)).toFixed(1); } return d + "Z"; };
const nuage = (x, y) => `M${x - 7} ${y + 3}a3.5 3.5 0 0 1 1-6.6a4.4 4.4 0 0 1 8.4-1a3.6 3.6 0 0 1 4.6 4.4a3 3 0 0 1-1 3.2Z`;
const guirlande = `<svg viewBox="0 0 170 52" width="170" height="52"><path class="mcb-fil" d="M8 46Q85 18 162 46" style="fill:none;stroke:#E83F86;stroke-width:1.8;stroke-linecap:round"/>`
  + [.14, .29, .43, .57, .71, .86].map((t, i) => { const [x, y] = pt(t), d = i % 2 ? nuage(x, y + 9) : etoile(x, y + 8);
      return `<g class="mcb-o" style="animation-delay:${(.45 + i * .14).toFixed(2)}s"><path d="M${x.toFixed(1)} ${y.toFixed(1)}v3" style="stroke:#E83F86;stroke-width:1.2"/><path d="${d}" style="fill:${i % 2 ? "#FFF4E8" : "#FFC94A"};stroke:${ENCRE};stroke-width:1.3;stroke-linejoin:round"/></g>`; }).join("")
  + `</svg>`;
let ouvrage = null;
Mascotte.famille("bebe", {
  particules: ["star5", "bubble"],
  acc: {praline: {tete: bonnet}},
  css: `.mcb-tricot{left:32px;bottom:-1px}
.mcb-aig1,.mcb-aig2{transform-box:fill-box;transform-origin:50% 100%}.mcb-tricot .mcb-aig1{animation:mcb-a .42s ease-in-out 16 alternate}.mcb-tricot .mcb-aig2{animation:mcb-a .42s ease-in-out .21s 16 alternate}
@keyframes mcb-a{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
.mcb-guirlande{left:-36px;bottom:4px}.mcb-fil{stroke-dasharray:180;stroke-dashoffset:180;animation:mcb-fil .9s ease-out forwards}
.mcb-o{opacity:0;transform-box:fill-box;transform-origin:50% 0;animation:mcb-o .45s cubic-bezier(.3,1.5,.5,1) forwards}@keyframes mcb-fil{to{stroke-dashoffset:0}}@keyframes mcb-o{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:none}}
.mcb-guirlande.mc-fige .mcb-fil{stroke-dashoffset:0}.mcb-guirlande.mc-fige .mcb-o{opacity:1}`,
  attente(duo, o){ ouvrage = o.objet(tricot, "mcb-tricot"); },
  oui(duo, o){
    if(ouvrage) ouvrage.remove();
    const g = o.objet(guirlande, "mcb-guirlande");
    if(o.info.rejoue) g.classList.add("mc-fige");
    if(!o.fige && !o.info.rejoue) o.ensuite(() => o.saut(), 500); // saut de joie, sans câlin
  }
});
})();

oseLoaded("mascotteBebe", "8ead6835c3");
