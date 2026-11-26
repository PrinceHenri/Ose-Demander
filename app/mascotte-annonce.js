/* Mascottes, famille Annonce (annoncer une grande nouvelle) : attente = Lilas fait un roulement de tambour, d'une patte, sur une boîte
   fermée posée à côté de lui, unie, sans rien qui suggère la nouvelle ; Oui = le couvercle saute, il n'en sort que des étoiles, puis confettis.
   Objets à l'échelle de l'écran. Format des pièces : voir app/mascotte.js. */
(function(){
const etoile = (x, y, r, c) => { let d = ""; for(let i = 0; i < 10; i++){ const R = i % 2 ? r * .45 : r, a = Math.PI / 5 * i - Math.PI / 2; d += (i ? "L" : "M") + (x + R * Math.cos(a)).toFixed(1) + " " + (y + R * Math.sin(a)).toFixed(1); }
  return `<path d="${d}Z" style="fill:${c};stroke:#1F1546;stroke-width:1.2;stroke-linejoin:round"/>`; };
// Boîte (objet, 34 x 40 px) : corps, couvercle à part, étoiles cachées dedans
const boite = `<svg viewBox="0 0 34 40" width="34" height="40"><g class="mcn-etoiles">${etoile(9, 20, 4.5, "#FFC94A")}${etoile(17, 16, 5.5, "#F4A7C0")}${etoile(25, 21, 4, "#FFF4E8")}</g>`
  + `<rect x="3" y="22" width="28" height="16" rx="3" transform="translate(0 1.6)" style="fill:#1F1546"/><rect x="3" y="22" width="28" height="16" rx="3" style="fill:#a898ee;stroke:#1F1546;stroke-width:2"/>`
  + `<path d="M3 30h28" style="stroke:#E83F86;stroke-width:3"/><path d="M3 30h28" style="stroke:#1F1546;stroke-width:.8;stroke-dasharray:0"/>`
  + `<g class="mcn-couvercle"><rect x="1" y="17" width="32" height="7" rx="2.5" style="fill:#c9bdf5;stroke:#1F1546;stroke-width:2"/><path d="M6 19.5h8" style="stroke:#fff;stroke-width:1.6;stroke-linecap:round"/></g></svg>`;
let objet = null;
Mascotte.famille("annonce", {
  particules: ["confetti", "star5"],
  acc: {},
  css: `.mcn-boite{left:-20px;bottom:0}
.mcn-tambour.mc-lilas [data-p="patte-av-g"]{transform:rotate(110deg);animation:mcn-g .16s ease-in-out 22 alternate}
@keyframes mcn-g{from{transform:rotate(100deg)}to{transform:rotate(122deg)}}

.mcn-couvercle{transform-box:fill-box;transform-origin:0 100%}.mcn-etoiles{opacity:0}
.mcn-ouvre .mcn-couvercle{animation:mcn-saute .7s cubic-bezier(.3,1.5,.5,1) forwards}.mcn-ouvre .mcn-etoiles{animation:mcn-sortent 1.4s .25s ease-out forwards}
@keyframes mcn-saute{to{transform:translate(-4px,-11px) rotate(-28deg)}}@keyframes mcn-sortent{0%{opacity:0;transform:translateY(4px)}30%{opacity:1}100%{opacity:1;transform:translateY(-16px)}}
.mcn-ouvre.mc-fige .mcn-couvercle{transform:translate(-4px,-11px) rotate(-28deg)}.mcn-ouvre.mc-fige .mcn-etoiles{opacity:1;transform:translateY(-16px)}`,
  attente(duo, o){
    const [l, p] = duo;
    objet = o.objet(boite, "mcn-boite");
    l.el.classList.add("mcn-tambour");
    if(!o.fige) p.etat("regarde").regard(-3, 2);
  },
  oui(duo, o){
    const [l, p] = duo;
    l.el.classList.remove("mcn-tambour");
    p.etat("etoile");
    if(objet){ if(o.info.rejoue) objet.classList.add("mc-fige"); objet.classList.add("mcn-ouvre"); }
    if(!o.fige && !o.info.rejoue) o.ensuite(() => o.saut(), 900);
  }
});
})();

oseLoaded("mascotteAnnonce", "301bc232b1");
