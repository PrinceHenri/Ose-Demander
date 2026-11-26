/* Mascottes, famille Noël : bonnets et écharpes ; particules : flocons et étoiles.
   Accessoires en coordonnées du chaton (viewBox 0 0 120 140), posés dans les pièces acc-* (voir app/mascotte.js). */
(function(){
const bonnet = (fond, bord) => `<path class="mc-bas" d="M39 31Q44 8 66 7Q85 7 93 23L87 27Q79 19 73 21Q80 25 82 31Z"/><path class="mc-t" style="fill:${fond}" d="M39 31Q44 8 66 7Q85 7 93 23L87 27Q79 19 73 21Q80 25 82 31Z"/>`
  + `<path class="mc-t" style="fill:${bord}" d="M35 29Q60 19 86 29Q88 33 86 36Q60 26 35 36Q33 33 35 29Z"/>`
  + `<path class="mc-t" style="fill:${bord}" d="M85 24a6 6 0 1 0 12 0a6 6 0 1 0-12 0Z"/>`;
const echarpe = (fond, raie) => `<path class="mc-col-encre" style="stroke-width:13" d="M37 88Q60 102 83 88"/><path class="mc-col" style="stroke:${fond};stroke-width:8.4" d="M37 88Q60 102 83 88"/>`
  + `<path class="mc-bas" d="M45 94L41 114Q46 116.5 51 114.5L53 95Z"/><path class="mc-t" style="fill:${fond}" d="M45 94L41 114Q46 116.5 51 114.5L53 95Z"/>`
  + `<path class="mc-l" style="stroke:${raie};stroke-width:2.4" d="M43.6 101.5h8.6M42.8 107.5h8.8"/><path class="mc-l" d="M42 115.5v3.4M46 116.2v3.4M50 115.6v3.4"/>`;
Mascotte.famille("noel", {
  particules: ["flake", "star5"],
  attente(){},
  oui(duo, o){ o.saut(); o.calin(); },
  acc: {
    lilas: {tete: bonnet("#D7263D", "#FFF4E8"), cou: echarpe("#1F6B47", "#FFF4E8")},
    praline: {tete: bonnet("#1F6B47", "#FFF4E8"), cou: echarpe("#D7263D", "#FFF4E8")}
  }
});
})();

oseLoaded("mascotteNoel", "333cca8d65");
