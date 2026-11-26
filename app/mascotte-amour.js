/* Mascottes, famille Amour : la lettre de Lilas, le nœud de Praline ; particules : cœurs.
   Accessoires en coordonnées du chaton (viewBox 0 0 120 140), posés dans les pièces acc-* (voir app/mascotte.js). */
Mascotte.famille("amour", {
  particules: ["heart"],
  acc: {
    lilas: {
      main: `<g transform="rotate(-9 70 124) translate(-3 2)"><path class="mc-bas" d="M63 117h20q2 0 2 2v11q0 2-2 2h-20q-2 0-2-2v-11q0-2 2-2Z"/><path class="mc-t mc-blanc" d="M63 117h20q2 0 2 2v11q0 2-2 2h-20q-2 0-2-2v-11q0-2 2-2Z"/><path class="mc-l" d="M62.4 118.4 73 126l10.6-7.6"/><path class="mc-c-rose" style="stroke-width:1.4" d="M73 128.6C68.5 125.5 70.5 121.6 73 123.6C75.5 121.6 77.5 125.5 73 128.6Z"/></g>`
    },
    praline: {
      tete: `<path class="mc-c-rose" d="M80 30Q70 18 67.5 26.5Q66 36 80 30Z"/><path class="mc-c-rose" d="M80 30Q90 18 92.5 26.5Q94 36 80 30Z"/><path class="mc-l" d="M71 27Q73 29 76 29.5M89 27Q87 29 84 29.5"/><path class="mc-c-rose" d="M76.4 30a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0-7.2 0Z"/>`
    }
  }
});

oseLoaded("mascotteAmour", "0000000000");
