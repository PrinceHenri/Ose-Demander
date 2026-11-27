/* Mascottes, famille Amis et sorties (soirée, week-end ou voyage, crémaillère, enterrement de vie de célibataire, ancienne
   sortie entre amis) : selon l'occasion, lunettes de soleil (ils hochent la tête en rythme), valise (voyage) ou cartons
   (crémaillère) ; Oui = check de la patte, petite étincelle au contact, puis saut. Objets à l'échelle de l'écran.
   Les lunettes dépendent de l'occasion : posées dans acc-tete par la famille (acc reste vide). Format : voir app/mascotte.js. */
(function(){
const ENCRE = "#1F1546";
const verre = x => `<path class="mc-t" style="fill:${ENCRE};stroke-width:2" d="M${x - 12} 57h24q1 9-5 12.5q-7 2.5-14 0q-6-3.5-5-12.5Z"/><path d="M${x - 7} 60.5l4-1.5" style="stroke:#F4A7C0;stroke-width:2;stroke-linecap:round"/>`;
const lunettes = `<g class="mca-lunettes">${verre(42)}${verre(78)}<path d="M54 59q6-3 12 0" style="fill:none;stroke:${ENCRE};stroke-width:2.6"/></g>`;
// Valise (objet, 30 x 34 px) : poignée, deux sangles, autocollant étoile
const valise = `<svg viewBox="0 0 30 34" width="30" height="34"><path d="M10 9V5h10v4" style="fill:none;stroke:${ENCRE};stroke-width:2.6;stroke-linejoin:round"/>`
  + `<rect x="2" y="9" width="26" height="23" rx="4" transform="translate(1.4 1.4)" style="fill:${ENCRE}"/><rect x="2" y="9" width="26" height="23" rx="4" style="fill:#F2994A;stroke:${ENCRE};stroke-width:2"/>`
  + `<path d="M9 9.5v22M21 9.5v22" style="stroke:#9C4F1B;stroke-width:2.2"/><circle cx="15" cy="20" r="4.4" style="fill:#FFF4E8;stroke:${ENCRE};stroke-width:1.3"/>`
  + `<path d="M15 16.8l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3Z" style="fill:#E83F86"/></svg>`;
// Cartons (objet, 32 x 42 px) : deux cartons empilés, ruban adhésif, une plante qui dépasse du carton du haut
const carton = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" transform="translate(1.4 1.4)" style="fill:${ENCRE}"/>`
  + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" style="fill:#D9A066;stroke:${ENCRE};stroke-width:2"/><path d="M${x + w / 2} ${y + 1}v${h / 2.4}" style="stroke:#F3D9A4;stroke-width:3.4"/>`;
const cartons = `<svg viewBox="0 0 32 42" width="32" height="42">${carton(1, 24, 29, 17)}<g class="mca-haut">`
  + `<path d="M15 14Q10 4 4 6Q8 12 15 14ZM17 14Q22 3 28 5Q24 12 17 14Z" style="fill:#6FBF5A;stroke:${ENCRE};stroke-width:1.4;stroke-linejoin:round"/>${carton(5, 12, 22, 12.5)}</g></svg>`;
const etincelle = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 1l2.4 7.6L22 11l-7.6 2.4L12 21l-2.4-7.6L2 11l7.6-2.4Z" style="fill:#FFC94A;stroke:${ENCRE};stroke-width:1.5;stroke-linejoin:round"/>`
  + `<path d="M3 3l3 3M21 3l-3 3M3 21l3-3M21 21l-3-3" style="stroke:${ENCRE};stroke-width:1.5;stroke-linecap:round"/></svg>`;
const avecLunettes = o => !["voyage", "cremaillere"].includes(o.info.o);
const poser = (duo, o) => { if(avecLunettes(o)) duo.forEach(c => { const a = c.el.querySelector('[data-p="acc-tete"]'); if(a && !a.querySelector(".mca-lunettes")) a.insertAdjacentHTML("beforeend", lunettes); }); };
Mascotte.famille("amis", {
  particules: ["confetti", "star5"],
  acc: {},
  css: `.mca-valise{left:-24px;bottom:0}.mca-cartons{left:-26px;bottom:-1px}.mca-etincelle{left:36px;bottom:16px;z-index:2;opacity:0;transform:scale(.3)}
.mca-rythme [data-p="tete"]{animation:mca-hoche .38s ease-in-out 20 alternate}.mca-rythme.mc-praline [data-p="tete"]{animation-delay:.19s}
@keyframes mca-hoche{from{transform:rotate(-4deg)}to{transform:rotate(4deg) translateY(1.5px)}}
.mca-valise svg{transform-origin:50% 100%;animation:mca-hop 2.4s ease-in-out 1s 4}@keyframes mca-hop{0%,80%,100%{transform:none}88%{transform:translateY(-3px) rotate(-4deg)}}
.mca-haut{transform-box:fill-box;transform-origin:50% 100%;animation:mca-hop 2.6s ease-in-out .6s 4}
.mca-check [data-p="tout"]{animation:mca-tout 1.2s ease-out forwards}.mca-check.mc-lilas [data-p="patte-av-d"],.mca-check.mc-praline [data-p="patte-av-g"]{animation:mca-patte 1.2s ease-out forwards}
@keyframes mca-tout{0%{transform:none}35%,100%{transform:translateX(calc(var(--mc-sens)*4px)) rotate(calc(var(--mc-sens)*4deg))}}
@keyframes mca-patte{0%{transform:none}35%,100%{transform:rotate(calc(var(--mc-sens)*-125deg)) scaleY(1.45)}}
.mca-tchac{animation:mca-tchac .7s .4s cubic-bezier(.3,1.6,.5,1) forwards}@keyframes mca-tchac{0%{opacity:0;transform:scale(.3)}60%{opacity:1;transform:scale(1.15) rotate(20deg)}100%{opacity:0;transform:scale(1.3) rotate(30deg)}}
.mc-fige .mca-valise svg,.mc-fige .mca-haut{animation:none}`,
  attente(duo, o){
    poser(duo, o);
    const occ = o.info.o;
    if(occ === "voyage") o.objet(valise, "mca-valise");
    else if(occ === "cremaillere") o.objet(cartons, "mca-cartons");
    else if(!o.fige) duo.forEach(c => c.el.classList.add("mca-rythme"));
    if(!o.fige && (occ === "voyage" || occ === "cremaillere")) duo.forEach(c => c.etat("regarde").regard(-3, 2));
  },
  oui(duo, o){
    poser(duo, o);
    duo.forEach(c => { c.el.classList.remove("mca-rythme"); c.etat("joie"); });
    if(o.fige || o.info.rejoue || duo.length < 2) return o.fige || o.info.rejoue ? undefined : o.saut();
    duo.forEach(c => c.el.classList.add("mca-check")); // check de la patte
    o.objet(etincelle, "mca-etincelle mca-tchac");
    o.ensuite(() => { duo.forEach(c => c.el.classList.remove("mca-check")); o.saut(); }, 1300);
  }
});
})();

oseLoaded("mascotteAmis", "33350a37f7");
