/* Mascottes, famille Surprises (journée surprise, voyage surprise) : Praline a un bandeau sur les yeux, Lilas tient une carte
   au trésor (chemin en pointillés et croix, aucun lieu ni indice : la surprise n'est jamais dévoilée) ; Oui = le bandeau
   tombe, yeux étoilés, étoiles, saut. Accessoires en coordonnées du chaton ; carte à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
const ENCRE = "#1F1546";
const etoile = (x, y, r) => { let d = ""; for(let i = 0; i < 10; i++){ const R = i % 2 ? r * .45 : r, a = Math.PI / 5 * i - Math.PI / 2; d += (i ? "L" : "M") + (x + R * Math.cos(a)).toFixed(1) + " " + (y + R * Math.sin(a)).toFixed(1); } return d + "Z"; };
// Bandeau sur les yeux (yeux à 42 et 78, hauteur 63), nœud sur le côté
const bandeau = `<g class="mcs-bandeau"><path class="mc-bas" d="M27 55Q60 49 93 55L93 71Q60 65 27 71Z"/>`
  + `<path class="mc-t" style="fill:#8E6BD8;stroke-width:2.2" d="M27 55Q60 49 93 55L93 71Q60 65 27 71Z"/>`
  + `<path d="${etoile(42, 61, 3.6)}${etoile(60, 59.5, 2.6)}${etoile(78, 61, 3.6)}" style="fill:#FFC94A"/>`
  + `<path class="mc-t" style="fill:#8E6BD8;stroke-width:1.8" d="M92 60L104 53L101 64ZM92 64L103 72L96 75Z"/></g>`;
// Carte au trésor (objet, 34 x 28 px) : parchemin, chemin en pointillés, croix
const carte = `<svg viewBox="0 0 34 28" width="34" height="28"><path d="M3 4Q17 1 31 4V25Q17 22 3 25Z" transform="translate(1.4 1.4)" style="fill:${ENCRE}"/>`
  + `<path d="M3 4Q17 1 31 4V25Q17 22 3 25Z" style="fill:#FFF0C9;stroke:${ENCRE};stroke-width:2;stroke-linejoin:round"/>`
  + `<path d="M12 3v20M22 3v20" style="stroke:#E8D3A0;stroke-width:1.2"/>`
  + `<path class="mcs-chemin" d="M7 20Q10 12 15 15T25 10" style="fill:none;stroke:#E4572E;stroke-width:1.6;stroke-dasharray:2 2.2;stroke-linecap:round"/>`
  + `<path d="M24 6l4 4M28 6l-4 4" style="stroke:#D7263D;stroke-width:2.2;stroke-linecap:round"/></svg>`;
let objet = null;
Mascotte.famille("surprises", {
  particules: ["star5", "sparkle"],
  acc: {praline: {tete: bandeau}},
  css: `.mcs-carte{left:29px;bottom:6px;transition:transform .45s ease-in}.mcs-pose{transform:translate(-3px,6px) rotate(-10deg)}
.mcs-tend [data-p="patte-av-d"]{transform:rotate(-62deg)}
.mcs-chemin{animation:mcs-chemin 1.6s linear 6}@keyframes mcs-chemin{to{stroke-dashoffset:-8.4}}.mc-fige .mcs-chemin{animation:none}
.mcs-bandeau{transform-box:fill-box;transform-origin:50% 50%}
.mcs-tombe .mcs-bandeau{animation:mcs-tombe .8s cubic-bezier(.5,0,.8,.6) forwards}
@keyframes mcs-tombe{0%{transform:none}25%{transform:translateY(-3px) rotate(-6deg)}100%{transform:translateY(46px) rotate(24deg);opacity:0}}
.mcs-sans .mcs-bandeau{display:none}`,
  attente(duo, o){
    const [l, p] = duo;
    objet = o.objet(carte, "mcs-carte");
    l.el.classList.add("mcs-tend");
    if(p && !o.fige) p.etat("timide");
  },
  oui(duo, o){
    const [l, p] = duo;
    l.el.classList.remove("mcs-tend");
    l.etat("joie");
    if(objet) objet.classList.add("mcs-pose");
    if(!p) return o.fige || o.info.rejoue ? undefined : o.saut();
    if(o.fige || o.info.rejoue){ p.el.classList.add("mcs-sans"); p.etat("etoile"); return; }
    p.el.classList.add("mcs-tombe"); // le bandeau tombe : Praline découvre, yeux étoilés
    o.ensuite(() => p.etat("etoile"), 350);
    o.ensuite(() => p.el.classList.add("mcs-sans"), 850);
    o.ensuite(() => o.saut(), 900);
  }
});
})();

oseLoaded("mascotteSurprises", "797a854f33");
