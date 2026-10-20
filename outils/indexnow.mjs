/* IndexNow : prévient Bing et les autres moteurs compatibles (Yandex, Seznam, Naver, Yep…) des pages nouvelles ou modifiées.
   Une seule requête à api.indexnow.org, partagée entre les moteurs. La clé n'est pas un secret : le protocole exige qu'elle
   soit publique, dans le fichier <clé>.txt à la racine du site ; elle prouve seulement qu'on contrôle osedemander.fr.

   À lancer APRÈS la publication, une fois que GitHub Pages sert la nouvelle version :
     node outils/indexnow.mjs                   pages modifiées depuis la publication précédente (origin/main@{1}, après le push)
     node outils/indexnow.mjs --depuis 0eee030  pages modifiées depuis ce commit
     node outils/indexnow.mjs --toutes          toutes les pages du plan du site (première fois, ou au besoin)
     node outils/indexnow.mjs --essai           affiche ce qui serait envoyé, sans rien envoyer
   Avant d'envoyer, le script vérifie que le fichier de clé et chaque adresse répondent en ligne (sinon les moteurs refusent). */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const HOTE = "osedemander.fr", SITE = `https://${HOTE}/`, CLE = "4b649693dccca13e8d5110e80084e50b";
export const FICHIER_CLE = `${CLE}.txt`, POINT = "https://api.indexnow.org/indexnow";
const RACINE = fileURLToPath(new URL("..", import.meta.url));

/* Adresses du plan du site (les seules qu'on signale : jamais une invitation, jamais une page technique) */
export const adressesDuPlan = (xml = readFileSync(RACINE + "sitemap.xml", "utf8")) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
/* Fichiers modifiés -> adresses publiques concernées (index.html -> /, dossier/index.html -> /dossier/, page.html -> /page.html) */
export function adressesModifiees(fichiers, plan){
  const urls = new Set();
  for(const f of fichiers.map(x => x.replace(/\\/g, "/"))){
    const u = f === "index.html" ? SITE : f.endsWith("/index.html") ? SITE + f.slice(0, -"index.html".length) : SITE + f;
    if(plan.includes(u)) urls.add(u);
  }
  return plan.filter(u => urls.has(u)); // dans l'ordre du plan du site
}
/* Corps de la requête IndexNow */
export const corps = urls => ({ host: HOTE, key: CLE, keyLocation: SITE + FICHIER_CLE, urlList: urls });

async function principal(){
  const a = process.argv.slice(2), essai = a.includes("--essai"), plan = adressesDuPlan();
  let urls;
  if(a.includes("--toutes")) urls = plan;
  else {
    const depuis = a.includes("--depuis") ? a[a.indexOf("--depuis") + 1] : "origin/main@{1}";
    const fichiers = execFileSync("git", ["diff", "--name-only", depuis, "HEAD"], { cwd: RACINE, encoding: "utf8" }).split("\n").filter(Boolean);
    urls = adressesModifiees(fichiers, plan);
  }
  if(!urls.length){ console.log("Aucune page nouvelle ou modifiée à signaler."); return; }
  console.log(`${urls.length} adresse(s) :\n  ${urls.join("\n  ")}`);
  // Vérifications en ligne : la clé, puis chaque adresse
  const cle = await fetch(SITE + FICHIER_CLE, { cache: "no-store" });
  if(!cle.ok || (await cle.text()).trim() !== CLE) throw new Error(`Le fichier de clé ${SITE + FICHIER_CLE} n'est pas encore servi : attends la fin de la publication.`);
  for(const u of urls){ const r = await fetch(u, { method: "HEAD", cache: "no-store" }); if(!r.ok) throw new Error(`${u} répond ${r.status} : rien n'est envoyé.`); }
  if(essai){ console.log("Essai : rien n'est envoyé.\n" + JSON.stringify(corps(urls), null, 2)); return; }
  const r = await fetch(POINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(corps(urls)) });
  const sens = { 200: "reçu", 202: "reçu (clé en cours de vérification)", 400: "requête invalide", 403: "clé refusée", 422: "adresses refusées (hors du site ?)", 429: "trop de demandes, réessaie plus tard" };
  console.log(`IndexNow : ${r.status} ${sens[r.status] || ""}`);
  if(r.status !== 200 && r.status !== 202) process.exitCode = 1;
}
if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) principal().catch(e => { console.error(e.message); process.exitCode = 1; });
