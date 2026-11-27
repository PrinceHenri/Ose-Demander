/* Mascottes, famille Famille (fête des mères, des pères, des grands-parents, repas de famille) : un petit chaton (dérivé de
   Praline, crème et pêche plus clairs, 70 %) tient une fleur (une cravate pour la fête des pères) ; Oui = il l'offre en
   s'approchant, câlin familial à trois, petites fleurs. Le cadeau est à l'échelle de l'écran (lisible), tenu contre lui. */
(function(){
const fleur = `<svg viewBox="0 0 20 30" width="18" height="27"><path d="M10 29V13" style="stroke:#1F1546;stroke-width:3.6;stroke-linecap:round"/><path d="M10 29V13" style="stroke:#3CA370;stroke-width:1.8;stroke-linecap:round"/>`
  + `<path d="M10 21q6-4 7.5 1q-5 2.5-7.5-1Z" style="fill:#3CA370;stroke:#1F1546;stroke-width:1.2"/>`
  + [0, 72, 144, 216, 288].map(a => `<ellipse cx="10" cy="4.6" rx="3.4" ry="4.6" transform="rotate(${a} 10 10)" style="fill:#F4A7C0;stroke:#1F1546;stroke-width:1.2"/>`).join("")
  + `<circle cx="10" cy="10" r="3" style="fill:#FFC94A;stroke:#1F1546;stroke-width:1.2"/></svg>`;
const cravate = `<svg viewBox="0 0 16 28" width="15" height="26"><path d="M4.5 2h7l-1.6 3.5 2.8 15-4.7 5-4.7-5 2.8-15Z" style="fill:#2F5BFF;stroke:#1F1546;stroke-width:1.6;stroke-linejoin:round"/>`
  + `<path d="M6.4 10.5l4.2-2.3M5.8 15.6l5.4-2.8M6.2 20.6l3.6-1.9" style="stroke:#FFC94A;stroke-width:1.5;stroke-linecap:round"/></svg>`;
// Accueil, périodes du logo (jamais posés sur les chatons de l'invitation) : petite fleur à l'oreille, nœud papillon
const fleurOreille = `<g transform="translate(84 31) scale(1.5) translate(-84 -31)">` + [0, 72, 144, 216, 288].map(a => `<ellipse class="mc-t" cx="84" cy="27" rx="2.6" ry="3.6" transform="rotate(${a} 84 31)" style="fill:#F4A7C0;stroke-width:1.2"/>`).join("")
  + `<circle class="mc-t" cx="84" cy="31" r="2.4" style="fill:#FFC94A;stroke-width:1.2"/></g>`;
const noeudPap = `<g transform="translate(60 94) scale(1.5) translate(-60 -94)"><path class="mc-t" style="fill:#1F7A8C;stroke-width:1.6" d="M60 94L48 87.5Q46 94 48 100.5Z"/><path class="mc-t" style="fill:#1F7A8C;stroke-width:1.6" d="M60 94L72 87.5Q74 94 72 100.5Z"/>`
  + `<rect class="mc-t" x="57" y="91" width="6" height="6" rx="1.8" style="fill:#1F7A8C;stroke-width:1.6"/><path style="fill:none;stroke:#FFC94A;stroke-width:1.2;stroke-linecap:round" d="M50.5 90.5v7M69.5 90.5v7"/></g>`;
let petit = null;
const bouquet = (o, zone) => { // petites fleurs et cœurs au Oui (formes du décor animé)
  if(o.fige || typeof Decor === "undefined" || !zone) return;
  const r = zone.getBoundingClientRect(); Decor.burst(r.left + r.width / 2, r.top, 30, true, ["flower", "heart"]);
};
Mascotte.famille("famille", {
  particules: ["flower", "heart"],
  acc: {saison: {tete: fleurOreille, cou: noeudPap}},
  css: `.mcf-petit{left:-44px;bottom:0;transition:transform .5s cubic-bezier(.3,1.4,.5,1)}.mcf-petit .mc-chat{width:42px;height:49px}
.mcf-petit .mc-chat{--mc-peau:#fffaf3;--mc-ombre:#f6e8d8;--mc-marque:#f9cdb3;--mc-collier:#8DD3C7}
.mcf-tient [data-p="patte-av-d"]{transform:rotate(-70deg)}
.mcf-cadeau{position:absolute;left:30px;bottom:8px;transform:rotate(12deg);transform-origin:50% 100%}
.mcf-offre{transform:translateX(16px)}.mcf-offre .mcf-cadeau{transition:transform .5s;transform:rotate(24deg) translate(4px,-4px)}`,
  attente(duo, o){
    if(petit) petit.detruire();
    const boite = o.objet("", "mcf-petit");
    petit = Mascotte.chat("praline", {energie: o.fige ? "0" : o.info.anim, sens: 1});
    petit.el.classList.add("mcf-tient");
    boite.appendChild(petit.el);
    boite.insertAdjacentHTML("beforeend", `<div class="mcf-cadeau">${o.info.o === "peres" ? cravate : fleur}</div>`);
    petit.etat("timide");
  },
  oui(duo, o){
    const boite = petit && petit.el.parentElement;
    if(!petit) return o.calin();
    petit.etat("joie");
    if(o.fige || o.info.rejoue){ duo.forEach(c => c.etat("joie")); return; }
    boite.classList.add("mcf-offre"); // il s'approche et tend son cadeau
    o.ensuite(() => { petit.etat("calin"); bouquet(o, boite.parentElement); }, 700);
    o.calin();
  }
});
})();

oseLoaded("mascotteFamille", "288e5ea016");
