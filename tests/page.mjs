/* Charge le script COMPLET de index.html (création, invitation, historique) avec une fausse page minimale,
   pour vérifier le HTML réellement produit par chaque écran (actions principales, titres, textes…).
   Rien n'est affiché : les zones #app et #main enregistrent ce qu'on y écrit, tout le reste est neutre.
   Les minuteries ne se déclenchent jamais (setTimeout ne fait rien). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const INDEX = fileURLToPath(new URL("../index.html", import.meta.url));
const lireApp = f => readFileSync(fileURLToPath(new URL(`../app/${f}`, import.meta.url)), "utf8").replace(/\r\n/g, "\n");

/* Après le script de la page, les fichiers chargés à part (app/), comme si le navigateur les avait chargés :
   fichiers : [] = la page seule (réseau coupé à la première visite) ; ["scenes"] = une invitation sans la création.
   versions : versions déclarées par les fichiers (pour simuler un fichier d'une autre version que celle attendue). */
export function chargerPage({ share = false, ios = false, fichiers = ["scenes", "creer"], versions = {} } = {}){
  const html = readFileSync(INDEX, "utf8").replace(/\r\n/g, "\n");
  let src = html.slice(html.indexOf("<script>") + "<script>".length, html.lastIndexOf("</script>"));
  const fin = src.lastIndexOf("\nroute();");
  if(fin < 0) throw new Error("index.html : appel final route(); introuvable");
  src = src.slice(0, fin) + src.slice(fin + "\nroute();".length); // on ne lance pas la page : les tests appellent les écrans eux-mêmes
  const declare = (txt, nom) => versions[nom] === undefined ? txt : txt.replace(new RegExp(`oseLoaded\\("${nom}", "[0-9a-f]*"\\)`), `oseLoaded("${nom}", "${versions[nom]}")`);
  for(const f of fichiers) src += "\n" + declare(lireApp(`${f}.js`), f);
  // Feuille de la création : sa version, lue par getComputedStyle comme dans le navigateur
  const cssV = !fichiers.includes("creer") ? "" : versions.creerCss ?? (lireApp("creer.css").match(/--ose-creer-css:"([0-9a-f]*)"/) || [])[1];

  const rien = () => {};
  // Objet « attrape-tout » : toute propriété ou tout appel renvoie un autre attrape-tout
  const neutre = () => new Proxy(function(){}, {
    get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "matches" ? false : k === "length" ? 0 : k === "then" ? undefined : neutre(),
    apply: () => neutre(), construct: () => neutre(), set: () => true
  });
  const zone = () => ({ innerHTML: "", querySelector: () => neutre(), querySelectorAll: () => [] });
  const zones = { "#app": zone(), "#main": zone(), "#scene": { ...zone(), className: "" } };
  const vus = []; // sélecteurs demandés à la page, dans l'ordre (pour vérifier où va le focus)
  const document = {
    title: "Ose Demander", hidden: false,
    querySelector: sel => { vus.push(sel); return zones[sel] || neutre(); }, querySelectorAll: () => [],
    getElementById: id => zones["#" + id] || neutre(), createElement: () => neutre(), body: neutre(), documentElement: neutre(),
    addEventListener: rien
  };
  const location = { origin: "http://localhost:8000", pathname: "/", hash: "", hostname: "localhost", protocol: "http:", href: "http://localhost:8000/" };
  const window = { CompressionStream, addEventListener: rien, devicePixelRatio: 1, location, scrollTo: rien };
  const navigator = { userAgent: ios ? "iPhone" : "Android", platform: "", maxTouchPoints: 0, ...(share ? { share: async () => {} } : {}) };
  const globaux = {
    window, document, navigator, location, history: { replaceState: () => { location.hash = ""; } },
    matchMedia: () => ({ matches: false }),
    localStorage: { getItem: () => null, setItem: rien, removeItem: rien },
    requestAnimationFrame: rien, cancelAnimationFrame: rien, addEventListener: rien,
    setTimeout: () => 0, clearTimeout: rien, setInterval: () => 0, clearInterval: rien,
    innerWidth: 400, innerHeight: 800, CompressionStream, DecompressionStream, alert: rien,
    getComputedStyle: () => ({ getPropertyValue: p => p === "--ose-creer-css" ? `"${cssV}"` : "" }),
    sessionStorage: { getItem: () => null, setItem: rien }
  };
  const f = new Function(...Object.keys(globaux),
    src + `\nreturn { lire: nom => eval(nom), ecrire: (nom, v) => eval(nom + " = v") };`);
  const P = f(...Object.values(globaux));
  return { ...P, zones, vus, navigator };
}

/* Boutons « action principale » visibles d'un morceau de HTML : bouton principal, Oui, installation.
   Un bouton de classe « hidden » est ignoré (retirer du HTML les blocs masqués avant l'appel). */
export const principales = html => {
  return [...html.matchAll(/<(?:button|a)\b[^>]*class="((?:btn primary|yes|install)(?:\s[^"]*)?)"[^>]*>([\s\S]*?)<\/(?:button|a)>/g)]
    .filter(m => !/\bhidden\b/.test(m[1])).map(m => m[2].replace(/<[^>]+>/g, "").trim());
};
