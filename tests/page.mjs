/* Charge le script COMPLET de index.html (création, invitation, historique) avec une fausse page minimale,
   pour vérifier le HTML réellement produit par chaque écran (actions principales, titres, textes…).
   Rien n'est affiché : les zones #app et #main enregistrent ce qu'on y écrit, tout le reste est neutre.
   Les minuteries ne se déclenchent jamais (setTimeout ne fait rien). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const INDEX = fileURLToPath(new URL("../index.html", import.meta.url));

export function chargerPage({ share = false, ios = false } = {}){
  const html = readFileSync(INDEX, "utf8");
  let src = html.slice(html.indexOf("<script>") + "<script>".length, html.lastIndexOf("</script>"));
  const fin = src.lastIndexOf("\nroute();");
  if(fin < 0) throw new Error("index.html : appel final route(); introuvable");
  src = src.slice(0, fin) + src.slice(fin + "\nroute();".length); // on ne lance pas la page : les tests appellent les écrans eux-mêmes

  const rien = () => {};
  // Objet « attrape-tout » : toute propriété ou tout appel renvoie un autre attrape-tout
  const neutre = () => new Proxy(function(){}, {
    get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "matches" ? false : k === "length" ? 0 : k === "then" ? undefined : neutre(),
    apply: () => neutre(), construct: () => neutre(), set: () => true
  });
  const zones = { "#app": { innerHTML: "" }, "#main": { innerHTML: "" } };
  const vus = []; // sélecteurs demandés à la page, dans l'ordre (pour vérifier où va le focus)
  const document = {
    title: "Ose Demander", hidden: false,
    querySelector: sel => { vus.push(sel); return zones[sel] || neutre(); }, querySelectorAll: () => [],
    getElementById: () => neutre(), createElement: () => neutre(), body: neutre(), documentElement: neutre(),
    addEventListener: rien
  };
  const location = { origin: "http://localhost:8000", pathname: "/", hash: "", hostname: "localhost", protocol: "http:", href: "http://localhost:8000/" };
  const window = { CompressionStream, addEventListener: rien, devicePixelRatio: 1, location, scrollTo: rien };
  const navigator = { userAgent: ios ? "iPhone" : "Android", platform: "", maxTouchPoints: 0, ...(share ? { share: async () => {} } : {}) };
  const globaux = {
    window, document, navigator, location,
    matchMedia: () => ({ matches: false }),
    localStorage: { getItem: () => null, setItem: rien, removeItem: rien },
    requestAnimationFrame: rien, cancelAnimationFrame: rien, addEventListener: rien,
    setTimeout: () => 0, clearTimeout: rien, setInterval: () => 0, clearInterval: rien,
    innerWidth: 400, innerHeight: 800, CompressionStream, DecompressionStream, alert: rien
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
