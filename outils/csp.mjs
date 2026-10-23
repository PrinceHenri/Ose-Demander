/* Politique de sécurité du contenu (Content-Security-Policy), en balise meta (GitHub Pages ne permet pas d'en-têtes).
   index.html : le script de la page est autorisé par son empreinte SHA-256, jamais par 'unsafe-inline'.
   L'empreinte change à chaque modification du script : relancer
     node outils/csp.mjs              (met à jour la balise de index.html)
     node outils/csp.mjs --verifier   (vérifie seulement ; le banc le vérifie aussi)
   Sans cela, le navigateur bloque tout le script : le site ne fonctionne plus.
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

export const cspAccueil = hash => [
  "default-src 'none'",
  `script-src '${hash}'`,
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
  const chemin = RACINE + "index.html", html = readFileSync(chemin, "utf8"), neuf = poser(html, cspAccueil(empreinte(html)));
  if(process.argv.includes("--verifier")){
    console.log(neuf === html ? "CSP à jour" : "CSP pas à jour : lancer « node outils/csp.mjs »");
    if(neuf !== html) process.exitCode = 1;
  } else if(neuf === html) console.log("CSP déjà à jour");
  else { writeFileSync(chemin, neuf); console.log("CSP mise à jour : " + empreinte(html)); }
}
