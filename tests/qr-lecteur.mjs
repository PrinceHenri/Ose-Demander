/* Lecteur de QR code pour le banc de test, écrit SÉPARÉMENT de l'encodeur du site (index.html) : il ne réutilise rien de lui.
   Il lit une matrice de modules (dark(x, y) -> booléen, taille connue) comme un téléphone après repérage :
   informations de format (code BCH le plus proche), version (déduite de la taille), masque, lecture en zigzag,
   désentrelacement des blocs, contrôle Reed-Solomon (tous les syndromes nuls), puis mode octets -> texte UTF-8.
   Modules inconnus (cachés par un logo, comme sur l'image « Partager en image ») : les mots de code touchés sont des
   effacements, reconstitués par Reed-Solomon (système linéaire sur GF(256)), comme le fait l'appareil photo d'un téléphone ;
   le bloc doit ensuite avoir tous ses syndromes nuls. Au-delà de la capacité du niveau, le code est illisible.
   Les tables par version viennent de la norme ISO/IEC 18004 (tableau 9), saisies ici indépendamment. */

// Tableau 9 de la norme : pour chaque version, [nombre total de mots de code, puis par niveau L, M, Q, H : [codes correcteurs par bloc, groupes [[nb blocs, mots de données], …]]]
// Seules les versions utilisées par le site sont décrites (1 à 30, assez pour les liens complets jusqu'à 1 200 caractères en M, version 29).
const T = {
  1: [26, [7, [[1, 19]]], [10, [[1, 16]]], [13, [[1, 13]]], [17, [[1, 9]]]],
  2: [44, [10, [[1, 34]]], [16, [[1, 28]]], [22, [[1, 22]]], [28, [[1, 16]]]],
  3: [70, [15, [[1, 55]]], [26, [[1, 44]]], [18, [[2, 17]]], [22, [[2, 13]]]],
  4: [100, [20, [[1, 80]]], [18, [[2, 32]]], [26, [[2, 24]]], [16, [[4, 9]]]],
  5: [134, [26, [[1, 108]]], [24, [[2, 43]]], [18, [[2, 15], [2, 16]]], [22, [[2, 11], [2, 12]]]],
  6: [172, [18, [[2, 68]]], [16, [[4, 27]]], [24, [[4, 19]]], [28, [[4, 15]]]],
  7: [196, [20, [[2, 78]]], [18, [[4, 31]]], [18, [[2, 14], [4, 15]]], [26, [[4, 13], [1, 14]]]],
  8: [242, [24, [[2, 97]]], [22, [[2, 38], [2, 39]]], [22, [[4, 18], [2, 19]]], [26, [[4, 14], [2, 15]]]],
  9: [292, [30, [[2, 116]]], [22, [[3, 36], [2, 37]]], [20, [[4, 16], [4, 17]]], [24, [[4, 12], [4, 13]]]],
  10: [346, [18, [[2, 68], [2, 69]]], [26, [[4, 43], [1, 44]]], [24, [[6, 19], [2, 20]]], [28, [[6, 15], [2, 16]]]],
  11: [404, [20, [[4, 81]]], [30, [[1, 50], [4, 51]]], [28, [[4, 22], [4, 23]]], [24, [[3, 12], [8, 13]]]],
  12: [466, [24, [[2, 92], [2, 93]]], [22, [[6, 36], [2, 37]]], [26, [[4, 20], [6, 21]]], [28, [[7, 14], [4, 15]]]],
  13: [532, [26, [[4, 107]]], [22, [[8, 37], [1, 38]]], [24, [[8, 20], [4, 21]]], [22, [[12, 11], [4, 12]]]],
  14: [581, [30, [[3, 115], [1, 116]]], [24, [[4, 40], [5, 41]]], [20, [[11, 16], [5, 17]]], [24, [[11, 12], [5, 13]]]],
  15: [655, [22, [[5, 87], [1, 88]]], [24, [[5, 41], [5, 42]]], [30, [[5, 24], [7, 25]]], [24, [[11, 12], [7, 13]]]],
  16: [733, [24, [[5, 98], [1, 99]]], [28, [[7, 45], [3, 46]]], [24, [[15, 19], [2, 20]]], [30, [[3, 15], [13, 16]]]],
  17: [815, [28, [[1, 107], [5, 108]]], [28, [[10, 46], [1, 47]]], [28, [[1, 22], [15, 23]]], [28, [[2, 14], [17, 15]]]],
  18: [901, [30, [[5, 120], [1, 121]]], [26, [[9, 43], [4, 44]]], [28, [[17, 22], [1, 23]]], [28, [[2, 14], [19, 15]]]],
  19: [991, [28, [[3, 113], [4, 114]]], [26, [[3, 44], [11, 45]]], [26, [[17, 21], [4, 22]]], [26, [[9, 13], [16, 14]]]],
  20: [1085, [28, [[3, 107], [5, 108]]], [26, [[3, 41], [13, 42]]], [30, [[15, 24], [5, 25]]], [28, [[15, 15], [10, 16]]]],
  21: [1156, [28, [[4, 116], [4, 117]]], [26, [[17, 42]]], [28, [[17, 22], [6, 23]]], [30, [[19, 16], [6, 17]]]],
  22: [1258, [28, [[2, 111], [7, 112]]], [28, [[17, 46]]], [30, [[7, 24], [16, 25]]], [24, [[34, 13]]]],
  23: [1364, [30, [[4, 121], [5, 122]]], [28, [[4, 47], [14, 48]]], [30, [[11, 24], [14, 25]]], [30, [[16, 15], [14, 16]]]],
  24: [1474, [30, [[6, 117], [4, 118]]], [28, [[6, 45], [14, 46]]], [30, [[11, 24], [16, 25]]], [30, [[30, 16], [2, 17]]]],
  25: [1588, [26, [[8, 106], [4, 107]]], [28, [[8, 47], [13, 48]]], [30, [[7, 24], [22, 25]]], [30, [[22, 15], [13, 16]]]],
  26: [1706, [28, [[10, 114], [2, 115]]], [28, [[19, 46], [4, 47]]], [28, [[28, 22], [6, 23]]], [30, [[33, 16], [4, 17]]]],
  27: [1828, [30, [[8, 122], [4, 123]]], [28, [[22, 45], [3, 46]]], [30, [[8, 23], [26, 24]]], [30, [[12, 15], [28, 16]]]],
  28: [1921, [30, [[3, 117], [10, 118]]], [28, [[3, 45], [23, 46]]], [30, [[4, 24], [31, 25]]], [30, [[11, 15], [31, 16]]]],
  29: [2051, [30, [[7, 116], [7, 117]]], [28, [[21, 45], [7, 46]]], [30, [[1, 23], [37, 24]]], [30, [[19, 15], [26, 16]]]],
  30: [2185, [30, [[5, 115], [10, 116]]], [28, [[19, 47], [10, 48]]], [30, [[15, 24], [25, 25]]], [30, [[23, 15], [25, 16]]]]
};
export const NIVEAUX = ["L", "M", "Q", "H"];
export const VERSIONS_LUES = Object.keys(T).map(Number);
// Contrôle du tableau : pour chaque version et chaque niveau, blocs × (données + correction) = total des mots de code
export function tableauCoherent(){
  for(const [v, [total, ...par]] of Object.entries(T)) par.forEach(([ne, g], i) => {
    const somme = g.reduce((s, [n, k]) => s + n * (k + ne), 0);
    if(somme !== total) throw new Error(`version ${v}-${NIVEAUX[i]} : ${somme} au lieu de ${total}`);
  });
  return true;
}
// Capacité en octets (mode octets) d'après le tableau : total des mots de données, moins l'en-tête
export function capaciteOctets(version, niveau){
  const [, ...par] = T[version], [, groupes] = par[NIVEAUX.indexOf(niveau)];
  const donnees = groupes.reduce((s, [n, k]) => s + n * k, 0);
  return Math.floor((donnees * 8 - 4 - (version < 10 ? 8 : 16)) / 8);
}

// GF(256) (polynôme 0x11D), recalculé ici
const EXP = [], LOG = [];
for(let i = 0, x = 1; i < 255; i++){ EXP[i] = x; LOG[x] = i; x *= 2; if(x > 255) x ^= 0x11D; }
const mul = (a, b) => a === 0 || b === 0 ? 0 : EXP[(LOG[a] + LOG[b]) % 255];
// Un bloc (données + codes correcteurs) est valide si le polynôme s'annule en α^0 … α^(n-1)
function syndromesNuls(bloc, n){
  for(let i = 0; i < n; i++){ let s = 0; for(const c of bloc) s = mul(s, EXP[i]) ^ c; if(s !== 0) return false; }
  return true;
}
const inverse = a => EXP[(255 - LOG[a]) % 255], puissance = (a, n) => n === 0 ? 1 : a === 0 ? 0 : EXP[(LOG[a] * n) % 255];
/* Reconstitue les mots effacés d'un bloc (indices connus) : S_i = Σ E_k · X_k^i (X_k = α^position), résolu par Gauss ; renvoie le nombre de mots corrigés */
function effacements(bloc, n, ix){
  if(!ix.length) return 0;
  if(ix.length > n) throw new Error(`trop de modules cachés : ${ix.length} mots effacés pour ${n} codes correcteurs`);
  const S = []; for(let i = 0; i < n; i++){ let s = 0; for(const c of bloc) s = mul(s, EXP[i]) ^ c; S.push(s); }
  const X = ix.map(k => EXP[(bloc.length - 1 - k) % 255]), e = ix.length;
  const A = [...Array(e)].map((_, i) => [...X.map(x => puissance(x, i)), S[i]]);
  for(let c = 0; c < e; c++){
    const r = A.findIndex((l, j) => j >= c && l[c] !== 0); if(r < 0) throw new Error("effacements non résolubles");
    [A[c], A[r]] = [A[r], A[c]];
    const iv = inverse(A[c][c]); A[c] = A[c].map(v => mul(v, iv));
    for(let j = 0; j < e; j++) if(j !== c && A[j][c] !== 0){ const f = A[j][c]; A[j] = A[j].map((v, k) => v ^ mul(f, A[c][k])); }
  }
  ix.forEach((k, j) => { bloc[k] ^= A[j][e]; });
  return e;
}

// Les 32 informations de format possibles, calculées par division polynomiale (générateur 10100110111), masque 101010000010010
const FORMATS = [];
for(let d = 0; d < 32; d++){
  let v = d << 10;
  for(let b = 14; b >= 10; b--) if(v >> b & 1) v ^= 0b10100110111 << (b - 10);
  FORMATS.push([((d << 10) | v) ^ 0b101010000010010, d]);
}
const ECL_DE_BITS = { 1: "L", 0: "M", 3: "Q", 2: "H" };
const distance = (a, b) => { let x = a ^ b, n = 0; while(x){ n += x & 1; x >>= 1; } return n; };

function zonesFixes(taille, version){
  const f = [...Array(taille)].map(() => new Array(taille).fill(false)), mark = (x, y) => { if(x >= 0 && y >= 0 && x < taille && y < taille) f[y][x] = true; };
  for(const [ox, oy] of [[0, 0], [taille - 8, 0], [0, taille - 8]]) for(let y = 0; y < 8; y++) for(let x = 0; x < 8; x++) mark(ox + x, oy + y);
  for(let i = 0; i < taille; i++){ mark(6, i); mark(i, 6); }
  for(let i = 0; i < 9; i++){ mark(8, i); mark(i, 8); } for(let i = 0; i < 8; i++){ mark(taille - 1 - i, 8); mark(8, taille - 1 - i); }
  if(version >= 2){
    // Centres des motifs d'alignement (tableau E.1 de la norme)
    const C = {2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50],11:[6,30,54],12:[6,32,58],13:[6,34,62],
      14:[6,26,46,66],15:[6,26,48,70],16:[6,26,50,74],17:[6,30,54,78],18:[6,30,56,82],19:[6,30,58,86],20:[6,34,62,90],21:[6,28,50,72,94],22:[6,26,50,74,98],
      23:[6,30,54,78,102],24:[6,28,54,80,106],25:[6,32,58,84,110],26:[6,30,58,86,114],27:[6,34,62,90,118],
      28:[6,26,50,74,98,122],29:[6,30,54,78,102,126],30:[6,26,52,78,104,130]}[version];
    for(const cy of C) for(const cx of C){
      if((cx < 9 && cy < 9) || (cx > taille - 10 && cy < 9) || (cx < 9 && cy > taille - 10)) continue;
      for(let y = -2; y <= 2; y++) for(let x = -2; x <= 2; x++) mark(cx + x, cy + y);
    }
  }
  if(version >= 7) for(let i = 0; i < 6; i++) for(let j = 0; j < 3; j++){ mark(taille - 11 + j, i); mark(i, taille - 11 + j); }
  return f;
}

/* Lit une matrice : {texte, version, niveau, masque, effaces} ; lance une erreur si le code est illisible ou abîmé.
   inconnu(x, y) : module caché (facultatif) ; effaces = nombre de mots de code reconstitués */
export function lireQR(taille, dark, inconnu = () => false){
  const version = (taille - 17) / 4;
  if(!Number.isInteger(version) || !T[version]) throw new Error(`taille ${taille} : version non prise en charge par le lecteur`);
  // Format : première copie (autour du repère en haut à gauche), le plus proche des 32 possibles
  let lu = 0; const pos = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  pos.forEach(([x, y], i) => { if(dark(x, y)) lu |= 1 << i; });
  const [fmt, d] = FORMATS.reduce((m, f) => distance(f[0], lu) < distance(m[0], lu) ? f : m);
  if(distance(fmt, lu) > 3) throw new Error("format illisible");
  const niveau = ECL_DE_BITS[d >> 3], masque = d & 7;
  const masques = [(i, j) => (i + j) % 2 === 0, i => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
    (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
    (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0, (i, j) => ((i + j) % 2 + (i * j) % 3) % 2 === 0]; // i = ligne, j = colonne
  const fixe = zonesFixes(taille, version), bits = [], caches = [];
  for(let col = taille - 1, montee = true; col > 0; col -= 2, montee = !montee){
    if(col === 6) col--;
    for(let k = 0; k < taille; k++){ const y = montee ? taille - 1 - k : k;
      for(const x of [col, col - 1]) if(!fixe[y][x]){ const c = inconnu(x, y); caches.push(c); bits.push(c ? 0 : dark(x, y) !== masques[masque](y, x) ? 1 : 0); } }
  }
  if(pos.some(([x, y]) => inconnu(x, y))) throw new Error("informations de format cachées");
  const [total, ...par] = T[version], [ne, groupes] = par[NIVEAUX.indexOf(niveau)];
  const mots = [], motCache = [];
  for(let i = 0; i + 8 <= bits.length && mots.length < total; i += 8){ mots.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0)); motCache.push(caches.slice(i, i + 8).some(Boolean)); }
  // Désentrelacement (avec, pour chaque bloc, les indices des mots effacés)
  const tailles = groupes.flatMap(([n, k]) => Array(n).fill(k)), blocs = tailles.map(() => []), trous = tailles.map(() => []);
  const range = (b, m) => { if(motCache[m]) trous[b].push(blocs[b].length); blocs[b].push(mots[m]); };
  let p = 0; for(let i = 0; i < Math.max(...tailles); i++) tailles.forEach((k, b) => { if(i < k) range(b, p++); });
  for(let i = 0; i < ne; i++) blocs.forEach((b, j) => range(j, p++));
  let effaces = 0;
  blocs.forEach((b, i) => { effaces += effacements(b, ne, trous[i]); if(!syndromesNuls(b, ne)) throw new Error(`bloc ${i} abîmé (Reed-Solomon)`); });
  const donnees = blocs.flatMap((b, i) => b.slice(0, tailles[i]));
  // Mode octets
  const flux = donnees.flatMap(o => [7,6,5,4,3,2,1,0].map(s => o >> s & 1));
  const lire = (k, n) => flux.slice(k, k + n).reduce((a, b) => a * 2 + b, 0);
  if(lire(0, 4) !== 4) throw new Error("mode inattendu (octets attendu)");
  const lb = version < 10 ? 8 : 16, n = lire(4, lb), octets = [];
  for(let i = 0; i < n; i++) octets.push(lire(4 + lb + 8 * i, 8));
  return { texte: new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(octets)), version, niveau, masque, effaces };
}
