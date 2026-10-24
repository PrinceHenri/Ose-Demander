/* Politique de sécurité du contenu (Content-Security-Policy), en balise meta (GitHub Pages ne permet pas d'en-têtes),
   et versions des fichiers chargés à part (dossier app/).
   index.html : ses deux scripts intégrés (le petit script de tête et le script de la page) sont autorisés par leur empreinte
   SHA-256, jamais par 'unsafe-inline' ; les fichiers de app/ par 'self'. Chaque fichier de app/ porte une version (empreinte de
   son contenu) : dans sa dernière ligne, dans son adresse (index.html : OSE_FILES, préchargements) et dans la liste de sw.js.
   Tout change à chaque modification : relancer
     node outils/csp.mjs              (met à jour versions et balise)
     node outils/csp.mjs --verifier   (vérifie seulement ; le banc le vérifie aussi)
   Sans cela, le navigateur bloque tout le script, ou la page croit recevoir un fichier d'une autre version.
   Pages fabriquées (outils/pages.mjs) et mentions légales : aucun script exécuté, CSP_STATIQUE. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));

// Le service des liens courts et des notifications (SHORT_ORIGIN). Jamais d'adresse en http:// (Observatory : −20).
// Tests en local avec wrangler dev : le serveur local doit ajouter http://localhost:8787 à connect-src de la page servie
// (sinon la CSP bloque l'appel et l'appli se replie sur le lien long).
export const CONNEXIONS = ["https://ose-liens.osedemander.workers.dev"];
export const CONNEXION_LOCALE = "http://localhost:8787";

/* Le navigateur lit le script après avoir changé les fins de ligne Windows en \n : l'empreinte se calcule pareil. */
export function scriptPage(html){
  const t = html.replace(/\r\n?/g, "\n"), i = t.indexOf("<script>");
  if(i < 0) throw new Error("index.html : balise <script> introuvable");
  const j = t.indexOf("</script>", i);
  return t.slice(i + "<script>".length, j);
}
export const empreinte = html => "sha256-" + createHash("sha256").update(scriptPage(html), "utf8").digest("base64");
/* Le petit script de tête (<script data-tete>) : précharge la création hors invitation */
export function scriptTete(html){
  const t = html.replace(/\r\n?/g, "\n"), i = t.indexOf("<script data-tete>");
  if(i < 0) throw new Error("index.html : <script data-tete> introuvable");
  return t.slice(i + "<script data-tete>".length, t.indexOf("</script>", i));
}
export const empreintes = html => [empreinte(html), "sha256-" + createHash("sha256").update(scriptTete(html), "utf8").digest("base64")];

/* Fichiers chargés à part. Leur version : empreinte du contenu (fins de ligne \n), la marque de version vidée */
export const FICHIERS = [
  { nom: "creer", chemin: "app/creer.js", marque: /oseLoaded\("creer", "[0-9a-f]*"\)/, pose: v => `oseLoaded("creer", "${v}")` },
  { nom: "scenes", chemin: "app/scenes.js", marque: /oseLoaded\("scenes", "[0-9a-f]*"\)/, pose: v => `oseLoaded("scenes", "${v}")` },
  { nom: "creerCss", chemin: "app/creer.css", marque: /--ose-creer-css:"[0-9a-f]*"/, pose: v => `--ose-creer-css:"${v}"` }
];
export function versionDe(f, contenu){
  const t = contenu.replace(/\r\n?/g, "\n");
  if(!f.marque.test(t)) throw new Error(`${f.chemin} : marque de version introuvable`);
  return createHash("sha256").update(t.replace(f.marque, f.pose("")), "utf8").digest("hex").slice(0, 10);
}
const adresse = f => new RegExp(f.chemin.replace(/[.]/g, "[.]") + "[?]v=[0-9a-f]*", "g");
/* Toutes les mises à jour : { chemin: contenu } pour chaque fichier à réécrire (vide si tout est à jour) */
export function miseAJour(lire){
  const out = {}, v = {};
  for(const f of FICHIERS){ const c = lire(f.chemin); v[f.nom] = versionDe(f, c); const n = c.replace(f.marque, f.pose(v[f.nom])); if(n !== c) out[f.chemin] = n; }
  let sw = lire("sw.js"), html = lire("index.html");
  for(const f of FICHIERS){ sw = sw.replace(adresse(f), `${f.chemin}?v=${v[f.nom]}`); html = html.replace(adresse(f), `${f.chemin}?v=${v[f.nom]}`); }
  html = html.replace(/const OSE_FILES = \{[^}]*\};/, `const OSE_FILES = {${FICHIERS.map(f => `${f.nom}:"${v[f.nom]}"`).join(", ")}};`);
  html = poser(html, cspAccueil(...empreintes(html)));
  if(sw !== lire("sw.js")) out["sw.js"] = sw;
  if(html !== lire("index.html")) out["index.html"] = html;
  return { out, versions: v };
}

export const cspAccueil = (...hashes) => [
  "default-src 'none'",
  `script-src 'self' ${hashes.map(h => `'${h}'`).join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${CONNEXIONS.join(" ")}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "form-action 'none'"
].join("; ");

export const CSP_STATIQUE = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'"
].join("; ");

export const balise = csp => `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
const BALISE = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;

export function cspDe(html){ const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/); return m ? m[1] : null; }

/* Pose (ou remplace) la balise juste après <meta charset> : elle doit précéder tout script et tout style. */
export function poser(html, csp){
  if(BALISE.test(html)) return html.replace(BALISE, balise(csp));
  return html.replace(/(<meta charset="utf-8">)(\r?\n)/, `$1$2${balise(csp)}$2`);
}

if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  const lire = c => readFileSync(RACINE + c, "utf8");
  const { out, versions } = miseAJour(lire), noms = Object.keys(out);
  if(process.argv.includes("--verifier")){
    console.log(noms.length ? `Pas à jour (${noms.join(", ")}) : lancer « node outils/csp.mjs »` : "Versions et CSP à jour");
    if(noms.length) process.exitCode = 1;
  } else if(!noms.length) console.log("Versions et CSP déjà à jour");
  else {
    // Une seule passe suffit : les versions ne dépendent pas de index.html, la CSP est calculée après elles
    for(const [c, t] of Object.entries(out)) writeFileSync(RACINE + c, t);
    console.log(`Mis à jour : ${noms.join(", ")} ; versions ${JSON.stringify(versions)}`);
  }
}
