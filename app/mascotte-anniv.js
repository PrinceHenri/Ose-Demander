/* Mascottes, famille Anniversaire (mon anniversaire, anniversaire en famille, entre amis, fête surprise) : chapeaux pointus ;
   attente = Praline porte le gâteau en équilibre (flamme qui vacille) ; Oui = ils soufflent la bougie, confettis.
   Fête surprise : gâteau sans bougie, Lilas fait « chut » avec la patte devant la bouche (sans texte) ; Oui = confettis seulement.
   Accessoires en coordonnées du chaton (viewBox 0 0 120 140) ; objets à l'échelle de l'écran. Format : voir app/mascotte.js. */
(function(){
// Chapeau pointu, agrandi pour rester lisible
const chapeau = (fond, raie) => `<g transform="translate(66 26) scale(1.4) rotate(10) translate(-67 -27)"><path class="mc-bas" d="M58 28L67 3L76 28Z"/><path class="mc-t" style="fill:${fond};stroke-width:2.2" d="M58 28L67 3L76 28Z"/>`
  + `<path style="fill:none;stroke:${raie};stroke-width:2.6;stroke-linecap:round" d="M62.6 17.5l6-3.5M60.6 23.5l11-6"/><path class="mc-t" style="fill:#FFF4E8;stroke-width:1.8" d="M64 3a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z"/></g>`;
// Patte devant la bouche (« chut »), dans la tête de Lilas
const chut = `<g class="mca-chut"><path class="mc-bas" d="M57 76q0-6 5-6t5 6v18h-10Z"/><path class="mc-t mc-peau" style="stroke-width:2.4" d="M57 76q0-6 5-6t5 6v18h-10Z"/><path class="mc-l" style="stroke-width:1.8" d="M60.3 70.8v4.4M63.7 70.8v4.4"/></g>`;
// Gâteau (objet, 34 x 34 px) ; avec ou sans bougie
const gateau = bougie => `<svg viewBox="0 0 34 34" width="28" height="28"><path d="M1 32h32" style="stroke:#1F1546;stroke-width:5;stroke-linecap:round"/><path d="M1 32h32" style="stroke:#fff;stroke-width:2.4;stroke-linecap:round"/>`
  + `<rect x="5" y="16" width="24" height="14" rx="3" style="fill:#1F1546" transform="translate(0 1.6)"/><rect x="5" y="16" width="24" height="14" rx="3" style="fill:#FFF4E8;stroke:#1F1546;stroke-width:2"/>`
  + `<path d="M5 19.5q0-3.5 3-3.5h18q3 0 3 3.5q-2 2.5-4 0q-2 2.5-4 0q-2 2.5-4 0q-2 2.5-4 0q-2 2.5-4 0q-2 2.5-4 0Z" style="fill:#F4A7C0;stroke:#1F1546;stroke-width:1.6;stroke-linejoin:round"/>`
  + `<path d="M9 25h16" style="stroke:#E83F86;stroke-width:1.6;stroke-dasharray:2 3;stroke-linecap:round"/>`
  + (bougie ? `<rect x="15.5" y="7" width="3" height="9" rx="1" style="fill:#a898ee;stroke:#1F1546;stroke-width:1.4"/><path class="mca-flamme" d="M17 1.5q3 3 0 5.5q-3-2.5 0-5.5Z" style="fill:#FFC94A;stroke:#1F1546;stroke-width:1.2"/>`
      + `<path class="mca-fumee" d="M17 6q-2-2 0-3.5t0-3.5" style="fill:none;stroke:#cfc6f2;stroke-width:1.6;stroke-linecap:round"/>`
    : `<path d="M17 10.5a3 3 0 1 0 .1 0Z" style="fill:#E83F86;stroke:#1F1546;stroke-width:1.4"/><path d="M17 10.5q1-4 3.5-5" style="fill:none;stroke:#1F1546;stroke-width:1.2;stroke-linecap:round"/>`)
  + `</svg>`;
let plat = null;
const surprise = o => o.info.o === "fetesurprise";
Mascotte.famille("anniv", {
  particules: ["confetti", "balloon"],
  acc: {
    lilas: {tete: chapeau("#E83F86", "#FFF4E8")},
    praline: {tete: chapeau("#8DD3C7", "#a898ee")}
  },
  css: `.mca-gateau{left:61px;bottom:1px;transform-origin:50% 100%;animation:mca-bal 1.6s ease-in-out 6 alternate}
@keyframes mca-bal{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
.mca-flamme{transform-box:fill-box;transform-origin:50% 100%;animation:mca-vac .5s ease-in-out 16 alternate}@keyframes mca-vac{to{transform:scale(.8,1.15)}}
.mca-fumee{opacity:0}.mca-souffle .mca-flamme{animation:mca-eteint .35s forwards}.mca-souffle .mca-fumee{animation:mca-fume 1.2s .3s forwards}
@keyframes mca-eteint{to{transform:scale(0);opacity:0}}@keyframes mca-fume{0%{opacity:0}30%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
.mca-porte.mc-praline [data-p="patte-av-g"]{transform:rotate(-38deg)}.mca-porte.mc-praline [data-p="patte-av-d"]{transform:rotate(30deg)}
.mca-chut-on.mc-lilas [data-p="patte-av-d"]{transform:rotate(-35deg)}
.mca-penche.mc-lilas [data-p="tout"]{transform:translateX(10px) rotate(8deg)}
.mca-part{transition:opacity .3s}.mca-part.mca-fin{opacity:0}`,
  attente(duo, o){
    const [l, p] = duo;
    plat = o.objet(gateau(!surprise(o)), "mca-gateau");
    p.el.classList.add("mca-porte");
    if(surprise(o)){ l.el.classList.add("mca-chut-on"); l.el.querySelector('[data-p="acc-tete"]').insertAdjacentHTML("beforeend", chut); }
  },
  oui(duo, o){
    const [l, p] = duo;
    const fin = () => { if(plat){ plat.classList.add("mca-part", "mca-fin"); } p.el.classList.remove("mca-porte"); l.el.classList.remove("mca-penche"); };
    l.el.querySelector(".mca-chut")?.remove(); l.el.classList.remove("mca-chut-on");
    if(o.fige || o.info.rejoue){ if(plat) plat.remove(); p.el.classList.remove("mca-porte"); return; }
    if(surprise(o) || !plat){ fin(); o.saut(); return; } // fête surprise : confettis seulement
    // ils soufflent la bougie, puis saut de joie et confettis
    l.el.classList.add("mca-penche"); duo.forEach(c => c.bouche("ouverte"));
    o.ensuite(() => plat.classList.add("mca-souffle"), 450);
    o.ensuite(() => { fin(); o.saut(); }, 1500);
  }
});
})();

oseLoaded("mascotteAnniv", "f31db918ec");
