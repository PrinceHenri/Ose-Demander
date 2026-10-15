/* Charge le vrai code de index.html (données, liens, validation) pour le tester sous Node.
   On prend le script de la page, du début jusqu'à la section « CRÉATEUR » (exclue) :
   cette partie n'a besoin ni du DOM ni du navigateur. Rien n'est recopié : on teste le code publié. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const INDEX = fileURLToPath(new URL("../index.html", import.meta.url));

// Noms exportés vers les tests (doivent exister dans la partie chargée)
const NOMS = [
  "sanitize", "encodeData", "decodeData", "squeeze", "packLink", "unpackLink", "inflate",
  "scramble", "unscramble", "b64url", "unb64url", "MAX_LINK", "MAX_DATA",
  "OCCASIONS", "OCC", "THEMES", "ACCENTS", "EMOJIS", "NO_MODES", "NO_TONES", "CHANNELS",
  "LINK_PHRASES", "LINK_OCC", "LINK_TH", "LINK_NO", "LINK_CH", "LINK_AN", "LINK_AC", "LINK_EM",
  "LINK_TONE", "LINK_KEYS", "LINK_T0", "LINK_TMAX"
];

export function codeDeLaPage(){
  const html = readFileSync(INDEX, "utf8");
  const debut = html.indexOf("<script>");
  const marque = html.indexOf("CRÉATEUR", debut);
  if(debut < 0 || marque < 0) throw new Error("index.html : script ou section « CRÉATEUR » introuvable");
  const fin = html.lastIndexOf("/*", marque); // début du bandeau de commentaire « CRÉATEUR »
  return html.slice(debut + "<script>".length, fin);
}

/* compression : false = navigateur sans CompressionStream (liens toujours non compressés, préfixes p/x)
   decompression : false = navigateur sans DecompressionStream (décompression de secours en pur JavaScript) */
export function charger({ compression = true, decompression = true } = {}){
  const CS = compression ? globalThis.CompressionStream : undefined;
  const DS = decompression ? globalThis.DecompressionStream : undefined;
  const fenetre = { CompressionStream: CS };
  const f = new Function("window", "CompressionStream", "DecompressionStream", "document",
    codeDeLaPage() + `\nreturn {${NOMS.join(",")}};`);
  return f(fenetre, CS, DS, undefined);
}
