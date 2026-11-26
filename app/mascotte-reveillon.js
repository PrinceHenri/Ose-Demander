/* Mascottes, famille Réveillon (Nouvel An) : chapeaux brillants ; attente = une pancarte de compte à rebours plantée à côté
   de Lilas (chiffres dessinés, aucun texte) ; Oui = ils trinquent avec deux verres de lait, petits feux d'artifice de chaque côté.
   Accessoires en coordonnées du chaton (viewBox 0 0 120 140) ; objets à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
// Chapeau haut-de-forme brillant, agrandi pour rester lisible sur un chaton de 60 px
const chapeau = (fond, ruban) => `<g transform="translate(66 26) scale(1.5) rotate(12) translate(-67 -27)"><path class="mc-bas" d="M57 27L59 9Q67 6 75 9L77 27Z"/><path class="mc-t" style="fill:${fond}" d="M57 27L59 9Q67 6 75 9L77 27Z"/>`
  + `<path class="mc-t" style="fill:${ruban};stroke-width:2" d="M57.6 21.5h18.8l.4 5h-19.6Z"/><path class="mc-t" style="fill:${fond}" d="M50 27.5Q67 21 84 27.5Q67 33 50 27.5Z"/>`
  + `<path style="fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round" d="M62 11.5v8"/></g>`;
// Pancarte (objet, 34 x 56 px) : 3, 2, 1, puis une étoile ; chiffres dessinés en traits
const chiffre = (d, i) => `<path class="mcr-d mcr-d${i}" d="${d}"/>`;
const pancarte = `<svg viewBox="0 0 34 56" width="34" height="56"><path d="M17 26V55" style="stroke:#1F1546;stroke-width:5;stroke-linecap:round"/><path d="M17 26V55" style="stroke:#C98F4E;stroke-width:2.6;stroke-linecap:round"/>`
  + `<rect x="2" y="2" width="30" height="26" rx="5" style="fill:#1F1546" transform="translate(0 1.6)"/><rect x="2" y="2" width="30" height="26" rx="5" style="fill:#fff;stroke:#1F1546;stroke-width:2.4"/>`
  + `<g transform="translate(17 15) scale(1.25)">${[
      "M-4-6h7l-4 5a4 4 0 1 1-3.5 6.5", "M-4-3a4 4 0 1 1 7 2.5l-7 6.5h8", "M-3-4l3.5-3v14",
      "M0-7l1.8 5.2 5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2-5.2-1.8 5.2-1.8Z"].map(chiffre).join("")}</g></svg>`;
// Verre de lait tenu dans la patte levée (contre-rotation : il reste droit)
const verre = (x, sens) => `<g transform="rotate(${sens * 115} ${x} 130)"><g transform="translate(${x} 122) scale(1.35) translate(${-x} -122)"><path class="mc-bas" d="M${x - 6} 110h12l-1.5 20h-9Z"/><path class="mc-t mc-blanc" d="M${x - 6} 110h12l-1.5 20h-9Z"/>`
  + `<path style="fill:#fff8ef;stroke:none" d="M${x - 5.2} 116h10.4l-1 12.6h-8.4Z"/><path style="fill:none;stroke:#cfc6f2;stroke-width:1.4;stroke-linecap:round" d="M${x - 3} 113v14"/></g></g>`;
const gerbe = (couleur) => `<svg viewBox="-20 -20 40 40" width="38" height="38">${Array.from({length: 8}, (_, i) => {
  const a = i * Math.PI / 4, x1 = (Math.cos(a) * 6).toFixed(1), y1 = (Math.sin(a) * 6).toFixed(1), x2 = (Math.cos(a) * 16).toFixed(1), y2 = (Math.sin(a) * 16).toFixed(1);
  return `<path d="M${x1} ${y1}L${x2} ${y2}" style="stroke:#1F1546;stroke-width:4.4;stroke-linecap:round"/><path d="M${x1} ${y1}L${x2} ${y2}" style="stroke:${couleur};stroke-width:2.2;stroke-linecap:round"/>`;
}).join("")}</svg>`;
let panneau = null;
Mascotte.famille("reveillon", {
  particules: ["spark", "star5"],
  acc: {
    lilas: {tete: chapeau("#F2C14E", "#1F1546")},
    praline: {tete: chapeau("#DCDFEA", "#E83F86")}
  },
  css: `.mcr-pancarte{left:-34px;bottom:2px}
.mcr-d{fill:none;stroke:#1F1546;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;opacity:0}.mcr-d4{fill:#FFC94A;stroke-width:1.4;opacity:1}
.mcr-pancarte .mcr-d1{animation:mcr-a 3.2s 2}.mcr-pancarte .mcr-d2{animation:mcr-b 3.2s 2}.mcr-pancarte .mcr-d3{animation:mcr-c 3.2s 2}.mcr-pancarte .mcr-d4{animation:mcr-e 3.2s 2}
@keyframes mcr-a{0%,24%{opacity:1}25%,100%{opacity:0}}@keyframes mcr-b{0%,24%{opacity:0}25%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes mcr-c{0%,49%{opacity:0}50%,74%{opacity:1}75%,100%{opacity:0}}@keyframes mcr-e{0%,74%{opacity:0}75%,100%{opacity:1}}
.mcr-tchin.mc-lilas [data-p="patte-av-d"]{animation:mcr-tl .9s both}.mcr-tchin.mc-praline [data-p="patte-av-g"]{animation:mcr-tp .9s both}
.mcr-tchin.mc-lilas [data-p="tout"]{animation:mcr-vl .9s both}.mcr-tchin.mc-praline [data-p="tout"]{animation:mcr-vp .9s both}
@keyframes mcr-tl{40%{transform:rotate(-122deg)}55%{transform:rotate(-108deg)}70%,100%{transform:rotate(-115deg)}}
@keyframes mcr-tp{40%{transform:rotate(122deg)}55%{transform:rotate(108deg)}70%,100%{transform:rotate(115deg)}}
@keyframes mcr-vl{40%,100%{transform:translateX(16px)}}@keyframes mcr-vp{40%,100%{transform:translateX(-16px)}}
.mc-e-0.mcr-tchin.mc-lilas [data-p="patte-av-d"],.mcr-fixe.mc-lilas [data-p="patte-av-d"]{transform:rotate(-115deg)}
.mc-e-0.mcr-tchin.mc-praline [data-p="patte-av-g"],.mcr-fixe.mc-praline [data-p="patte-av-g"]{transform:rotate(115deg)}
.mcr-feu{width:38px;height:38px;bottom:24px}.mcr-feu svg{animation:mcr-feu 1.3s ease-out 3 both}.mcr-feu2 svg{animation-delay:.4s}
@keyframes mcr-feu{0%{transform:scale(.2);opacity:0}25%{opacity:1}70%{transform:scale(1);opacity:1}100%{transform:scale(1.1);opacity:0}}`,
  attente(duo, o){ panneau = o.objet(pancarte, "mcr-pancarte"); },
  oui(duo, o){
    const [l, p] = duo;
    if(panneau) panneau.remove();
    l.el.querySelector('[data-p="acc-main"]').innerHTML = verre(68, 1);
    p.el.querySelector('[data-p="acc-main-g"]').innerHTML = verre(52, -1);
    const fixe = o.fige || o.info.rejoue; // état final posé (fichier arrivé après le Oui) : verres levés, sans feux
    duo.forEach(c => c.el.classList.add(fixe ? "mcr-fixe" : "mcr-tchin"));
    if(fixe) return;
    o.ensuite(() => {
      const g = o.objet(gerbe("#FFC94A"), "mcr-feu"); g.style.left = "-36px";
      const d = o.objet(gerbe("#E6E8F2"), "mcr-feu mcr-feu2"); d.style.right = "-36px";
    }, 700);
  }
});
})();

oseLoaded("mascotteReveillon", "bfe3ce99d4");
