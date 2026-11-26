/* Mascottes, famille Neutre (« Autre chose… », « Juste comme ça ») : sans accessoire, attente simple,
   Oui = saut de joie et étoiles. Sert aussi de repli. Format des pièces : voir app/mascotte.js. */
Mascotte.famille("neutre", {
  particules: ["star5", "spark"],
  acc: {},
  attente(){},
  oui(duo, o){ o.saut(); o.ensuite(() => duo.forEach(c => c.etat("attente", {yeux: "fermes"})), 1500); }
});

oseLoaded("mascotteNeutre", "639426aca2");
