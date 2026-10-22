/* Fabrique les pages d'occasion (référencement), la page 404 et sitemap.xml, à partir de outils/pages-data.mjs
   et du vrai code de index.html (couleurs des thèmes, scènes illustrées, modèles) : une seule source, pages fidèles au site.
   Pages statiques : tout le texte est lisible sans JavaScript ; aucun appel extérieur ; CSS limité à ce qui sert.
   Usage : node outils/pages.mjs              écrit les fichiers
           node outils/pages.mjs --verifier   n'écrit rien, liste les fichiers qui ne sont pas à jour (utilisé par le banc) */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chargerPage } from "../tests/page.mjs";
import { PAGES, FAQ_COMMUNE, MISE_A_JOUR } from "./pages-data.mjs";

const RACINE = fileURLToPath(new URL("..", import.meta.url)), SITE = "https://osedemander.fr/";
const P = chargerPage();
const esc = P.lire("esc"), SCENES = P.lire("SCENES"), TEMPLATES = P.lire("TEMPLATES"), THEMES = P.lire("THEMES"), OCC = P.lire("OCC"), HOME_SCENE = P.lire("HOME_SCENE");
const footerHTML = P.lire("footerHTML"), readable = P.lire("readable"), FOOT_BG = P.lire("FOOT_BG");
/* Texte visible : échappé, puis typographie française (espaces insécables devant ? ! : ; et dans les guillemets),
   mots composés jamais coupés en fin de ligne */
const INSECABLES = ["Saint-Valentin", "Nouvel An", "jour J"];
// Espace insécable plutôt qu'un <span> quand c'est possible : dans un lien en flex, l'espace avant le <span> disparaissait (« duNouvel An »)
const t = s => INSECABLES.reduce((x, m) => x.split(esc(m)).join(m.includes(" ") ? esc(m).replace(/ /g, "&nbsp;") : `<span class="nw">${esc(m)}</span>`),
  esc(s).replace(/ ([?!:;»])/g, "&nbsp;$1").replace(/« /g, "«&nbsp;"));
const html = readFileSync(RACINE + "index.html", "utf8").replace(/\r\n/g, "\n"), CSS = html.slice(html.indexOf("<style>") + 7, html.indexOf("</style>"));

/* Découpe le CSS en blocs de premier niveau (règles, @media, @keyframes, @font-face) */
function blocs(css){
  const out = []; let depth = 0, start = 0;
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for(let i = 0; i < css.length; i++){
    if(css[i] === "{") depth++;
    else if(css[i] === "}" && --depth === 0){ const t = css.slice(start, i + 1).trim(); if(t) out.push(t); start = i + 1; }
  }
  return out;
}
const B = blocs(CSS), sel = b => b.slice(0, b.indexOf("{")).trim();
/* CSS d'une page : polices, couleurs (base + thème), scène (fond et élément vedette, animations utilisées), mise en page */
function cssPage(theme){
  const polices = B.filter(b => sel(b) === "@font-face").map(b => b.replace(/url\("fonts\//g, 'url("/fonts/'));
  const couleurs = B.filter(b => sel(b) === ":root,[data-theme]" || sel(b) === `[data-theme="${theme}"]`);
  const scene = B.filter(b => !b.startsWith("@") && /#scene|\.scene-sign|\.sg-|\.sc-|\.hs-/.test(sel(b)) && !/\.mini|\.pv-|\.thumb|\.dim|\.tinted|scene-home \.sc|:hover/.test(sel(b)));
  const pied = cssPied();
  const utilisees = new Set(scene.flatMap(b => [...b.matchAll(/animation:([a-z0-9-]+)/g)].map(m => m[1])));
  const images = B.filter(b => b.startsWith("@keyframes") && utilisees.has(b.match(/@keyframes\s+([a-z0-9-]+)/)[1]));
  const mise = `*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--display);font-size:17px;line-height:1.55}
a{color:var(--accent-text);text-underline-offset:3px}
:focus-visible{outline:3px solid var(--accent-text);outline-offset:2px}
.skip{position:absolute;left:-999px;top:8px;z-index:5;background:var(--surface);color:var(--ink);padding:10px 14px;border:2px solid var(--ink);border-radius:12px}
.skip:focus{left:8px}
#scene{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:var(--bg)}
#scene svg{display:block}
.wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:14px 16px 40px}
.top{padding:6px 0 12px}
.logo{font-weight:800;font-size:22px;letter-spacing:-.02em;text-decoration:none;color:var(--ink)}
.logo .q{display:inline-block;color:var(--accent);font-size:28px;transform:rotate(12deg)}
.panel{background:var(--surface);border:2px solid var(--ink);border-radius:22px;box-shadow:8px 8px 0 var(--ink);padding:24px 20px;margin:0 0 24px}
.hero{text-align:center}
.scene-sign{display:flex;justify-content:center;margin:0 auto 12px;pointer-events:none}
.scene-sign svg{width:min(300px,76vw);height:auto;overflow:visible}
h1{font-size:clamp(30px,7.6vw,44px);line-height:1.08;letter-spacing:-.03em;font-weight:800;font-variation-settings:"opsz" 96;margin:0 0 12px;text-wrap:balance}
h2{font-size:22px;line-height:1.2;letter-spacing:-.015em;margin:0 0 12px}
p{margin:0 0 14px}
.lead{max-width:56ch;margin:0 auto 20px}
.cta{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:12px 22px;border:2px solid var(--ink);border-radius:14px;background:var(--surface);color:var(--ink);font-weight:700;font-size:17px;text-decoration:none;box-shadow:3px 3px 0 var(--ink);transition:transform .1s,box-shadow .1s}
.btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.btn.primary{background:var(--accent-btn);color:var(--accent-ink)}
.alt{margin:14px 0 0;font-size:15px;color:var(--muted)}
.alt a{display:inline-flex;align-items:center;min-height:44px;padding:0 4px}
.list{margin:0;padding-left:22px}
.list li{margin:0 0 10px}
.example{margin:0 0 28px;text-align:center}
.example h2{display:inline-block;background:var(--surface);border:2px solid var(--ink);border-radius:999px;padding:4px 16px;font-size:17px;margin:0 0 14px}
.ticket{max-width:420px;margin:0 auto 14px;background:var(--surface);border:2px solid var(--ink);border-radius:22px;box-shadow:8px 8px 0 var(--ink);text-align:center}
.stub{display:flex;justify-content:space-between;padding:14px 20px 10px;font-size:14px;color:var(--muted);text-align:left}
.stub div+div{text-align:right}
.stub b{display:block;color:var(--ink);font-size:17px}
.perf{border-top:2px dashed var(--line);margin:0 14px}
.tmain{padding:20px 20px 24px}
.occ{margin:0 0 6px;color:var(--muted);font-size:14px}
.question{font-size:28px;line-height:1.12;font-weight:800;letter-spacing:-.025em;margin:0 0 10px;text-wrap:balance}
.handnote{font-family:var(--hand);font-size:25px;line-height:1.2;margin:0 0 16px}
.answer{display:flex;gap:12px;justify-content:center}
.answer span{min-width:96px;padding:10px 18px;border:2px solid var(--ink);border-radius:16px;font-weight:800;background:var(--surface)}
.answer .yes{background:var(--accent-btn);color:var(--accent-ink);box-shadow:4px 4px 0 var(--ink)}
.note{display:inline-block;background:var(--surface);border-radius:10px;padding:4px 10px;color:var(--muted);font-size:15px;margin:0}
.steps{margin:0;padding-left:24px}
.steps li{margin:0 0 10px}
details{border-top:2px dashed var(--line)}
details:last-of-type{border-bottom:2px dashed var(--line)}
summary{cursor:pointer;font-weight:700;min-height:48px;display:flex;align-items:center;padding:8px 0}
details p{margin:0 0 14px}
.nw{white-space:nowrap}
h2,.handnote,.question,.lead{text-wrap:balance}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`;
  return [...polices, ...couleurs, ...scene, ...images, mise, ...pied].join("\n");
}
/* CSS du pied de page, repris tel quel du site (règles .site-foot / .sf-, et leurs @media) */
const cssPied = () => B.filter(b => /^\.site-foot|^\.sf-/.test(sel(b)) || (b.startsWith("@media") && b.includes(".sf-")));
/* Pied de page des pages statiques : logo habituel (sans script, pas de décor de saison figé), titres à l'accent du thème lisible sur le fond sombre */
const piedDePage = theme => {
  const t = THEMES.find(x => x.id === theme) || THEMES[0];
  return footerHTML({ logo: `<a class="logo" href="/">Ose Demander<span class="q" aria-hidden="true">?</span></a>`, acc: readable(t.a, [FOOT_BG], 4.5) });
};

const tete = ({ titre, description, canonique, theme, robots, jsonld, css = "" }) => {
  const t = THEMES.find(x => x.id === theme) || THEMES[0];
  return `<!doctype html>
<html lang="fr" data-theme="${theme === "base" ? "" : theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ""}${canonique ? `<link rel="canonical" href="${canonique}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ose Demander">
<meta property="og:locale" content="fr_FR">
<meta property="og:url" content="${canonique}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}og-image.png">
<meta name="twitter:card" content="summary_large_image">
` : ""}<meta name="theme-color" content="${t.c}">
<link rel="icon" type="image/png" sizes="64x64" href="/icons/favicon-64.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="referrer" content="no-referrer">
<link rel="preload" href="/fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n` : ""}<style>
${cssPage(theme)}${css ? "\n" + css : ""}
</style>
</head>`;
};

function pageOccasion(p){
  const tpl = TEMPLATES.find(t => t.id === p.tpl), theme = tpl.theme, url = `${SITE}${p.path}/`, faq = [...p.faq, ...FAQ_COMMUNE];
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ose Demander", item: SITE }, { "@type": "ListItem", position: 2, name: p.label, item: url }] },
    { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
  ] };
  const lien = `/#modele=${p.tpl}`;
  return `${tete({ titre: p.title, description: p.description, canonique: url, theme, jsonld })}
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<div id="scene" aria-hidden="true">${SCENES[theme].wall}</div>
<div class="wrap">
<header class="top"><a class="logo" href="/">Ose Demander<span class="q" aria-hidden="true">?</span></a></header>
<main id="contenu">
<section class="panel hero">
<div class="scene-sign anim-n" aria-hidden="true">${SCENES[theme].sign}</div>
<h1>${t(p.h1)}</h1>
<p class="lead">${t(p.lead)}</p>
<p class="cta"><a class="btn primary" href="${lien}">Créer mon invitation</a></p>
${(p.autresModeles || []).length ? `<p class="alt">${t(p.autresIntro)} ${p.autresModeles.map(([id, txt]) => `<a href="/#modele=${id}">${t(txt)}</a>`).join(" ou ")}</p>` : ""}
</section>
<section class="panel"><h2>${t(p.ideesTitre)}</h2>
<ul class="list">${p.idees.map(i => `<li>${t(i)}</li>`).join("")}</ul></section>
<section class="example" aria-labelledby="exemple"><h2 id="exemple">Exemple d'invitation</h2>
<div class="ticket"><div class="stub"><div>De<b>${esc(p.exemple.de)}</b></div><div>Pour<b>${esc(p.exemple.pour)}</b></div></div><div class="perf" aria-hidden="true"></div>
<div class="tmain"><p class="occ">${t(OCC[tpl.occ].label)}</p><p class="question">${t(tpl.q)}</p>${tpl.msg ? `<p class="handnote">${t(tpl.msg)}</p>` : ""}
<div class="answer" aria-hidden="true"><span class="yes">Oui</span><span class="no">Non</span></div></div></div>
<p class="note">${t(p.exemple.note)}</p></section>
<section class="panel"><h2>Comment ça marche</h2>
<ol class="steps">${p.etapes.map(e => `<li>${t(e)}</li>`).join("")}</ol></section>
<section class="panel"><h2>Questions fréquentes</h2>
${faq.map(([q, a]) => `<details><summary>${t(q)}</summary><p>${t(a)}</p></details>`).join("\n")}</section>
<section class="panel hero"><h2>${t(p.fin)}</h2><p class="cta"><a class="btn" href="${lien}">Créer mon invitation</a></p></section>
</main>
</div>
${piedDePage(theme)}
</body>
</html>
`;
}

function page404(){
  return `${tete({ titre: "Cette page n'existe pas | Ose Demander", description: "Cette adresse ne mène à aucune page d'Ose Demander.", theme: "base", robots: "noindex" })}
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<div id="scene" class="scene-home" aria-hidden="true">${HOME_SCENE}</div>
<div class="wrap">
<header class="top"><a class="logo" href="/">Ose Demander<span class="q" aria-hidden="true">?</span></a></header>
<main id="contenu">
<section class="panel hero">
<h1>Cette page n'existe pas</h1>
<p class="lead">${t("L'adresse est peut-être incomplète ou mal copiée. Si tu as reçu une invitation, demande à la personne qui te l'a envoyée de te renvoyer le lien en entier.")}</p>
<p class="cta"><a class="btn primary" href="/">Créer ma propre invitation</a></p>
</section>
</main>
</div>
${piedDePage("base")}
</body>
</html>
`;
}

/* Page « Supprimer mes données » (lien demandé par la Play Console) : ce que chacun peut supprimer soi-même,
   la demande par e-mail, et ce qui est supprimé ou conservé, avec les durées. Doit rester fidèle aux mentions légales. */
export const SUPPRESSION = { path: "supprimer-mes-donnees", maj: "2026-10-22",
  title: "Supprimer mes données | Ose Demander",
  description: "Comment supprimer tes données d'Ose Demander, sur l'appli Android comme sur le site : liens courts, notifications de réponse, historique, ou demande par e-mail." };
function pageSuppression(){
  const p = SUPPRESSION, url = `${SITE}${p.path}/`;
  const jsonld = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Ose Demander", item: SITE }, { "@type": "ListItem", position: 2, name: "Supprimer mes données", item: url }] };
  const mail = "mailto:contact@osedemander.fr?subject=" + encodeURIComponent("Suppression de mes données");
  return `${tete({ titre: p.title, description: p.description, canonique: url, theme: "base", jsonld, css: "h3{font-size:18px;line-height:1.25;margin:20px 0 8px}\nh2+h3{margin-top:4px}" })}
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<div id="scene" class="scene-home" aria-hidden="true">${HOME_SCENE}</div>
<div class="wrap">
<header class="top"><a class="logo" href="/">Ose Demander<span class="q" aria-hidden="true">?</span></a></header>
<main id="contenu">
<section class="panel hero">
<h1>Supprimer mes données</h1>
<p class="lead">${t("Cette page concerne l'appli « Ose Demander », sur Google Play, et le site osedemander.fr. Il n'y a pas de compte : presque tout se supprime toi-même, en quelques gestes. Tu peux aussi le demander par e-mail.")}</p>
<p class="cta"><a class="btn primary" href="/#mes-invitations">Ouvrir « Mes invitations »</a></p>
</section>
<section class="panel" aria-labelledby="toi-meme"><h2 id="toi-meme">Supprimer toi-même</h2>
<h3>Un lien court</h3>
<ol class="steps">
<li>${t("Ouvre l'appli ou le site, puis « Mes invitations ».")}</li>
<li>${t("Sous l'invitation, touche « Supprimer le lien en ligne », puis confirme.")}</li>
<li>${t("Le contenu chiffré est effacé tout de suite : le lien affiche désormais « Cette invitation a été supprimée ». Le lien de l'image, s'il existe, est supprimé en même temps.")}</li>
</ol>
<p>${t("Ce bouton ne fonctionne que sur l'appareil qui a créé l'invitation : c'est lui qui garde le jeton de suppression. Sinon, demande la suppression par e-mail.")}</p>
<h3>Un abonnement aux notifications de réponse</h3>
<p>${t("Il est effacé automatiquement dès que la notification est partie. Pour l'effacer avant, retire l'invitation de « Mes invitations » (bouton « Retirer de l'historique ») : l'abonnement est effacé en même temps. Tu peux aussi retirer l'autorisation des notifications dans les réglages de ton téléphone ou de ton navigateur.")}</p>
<h3>Une notification de révélation</h3>
<p>${t("Si tu as coché « Me prévenir quand la surprise se révèle » : elle est effacée automatiquement dès qu'elle est partie. Pour l'annuler avant, rouvre l'invitation et décoche la case. Le lien de l'invitation, rangé sur ton appareil pour la rouvrir, s'efface avec les données de l'appli ou du site.")}</p>
<h3>L'historique « Mes invitations »</h3>
<p>${t("Il reste uniquement sur ton appareil : Ose Demander n'en a aucune copie. Pour l'effacer :")}</p>
<ul class="list">
<li>${t("dans « Mes invitations », « Retirer de l'historique » pour une invitation, ou « Tout effacer » ;")}</li>
<li>${t("ou en effaçant les données de l'appli (Paramètres d'Android, Applications, Ose Demander, Stockage, « Effacer les données ») ou celles du site osedemander.fr dans les réglages de ton navigateur.")}</li>
</ul>
</section>
<section class="panel" aria-labelledby="mail"><h2 id="mail">Demander la suppression par e-mail</h2>
<p>${t("Écris à")} <a href="${mail}">contact@osedemander.fr</a> ${t("en indiquant :")}</p>
<ul class="list">
<li>${t("le lien de l'invitation concernée, tel que tu l'as envoyé, ou celui de l'image ;")}</li>
<li>${t("ce que tu veux supprimer : le lien court, l'abonnement aux notifications, ou les deux. Une notification de révélation, elle, s'annule depuis ton appareil : rien ne permet de la retrouver sans lui.")}</li>
</ul>
<p>${t("Sans le lien, impossible de retrouver une invitation : rien n'est rattaché à un nom, à une adresse e-mail ou à un appareil. Tu reçois une réponse dans un délai d'un mois au plus, comme le prévoit le RGPD.")}</p>
<p class="cta"><a class="btn" href="${mail}">Écrire à contact@osedemander.fr</a></p>
</section>
<section class="panel" aria-labelledby="duree"><h2 id="duree">Ce qui est supprimé, ce qui est conservé</h2>
<ul class="list">
<li>${t("Lien court : le contenu chiffré est effacé tout de suite à ta demande, sinon automatiquement un an au plus après la création du lien. L'identifiant du lien, sans aucun contenu, est gardé un an de plus, seulement pour afficher « Cette invitation a expiré » ou « a été supprimée ».")}</li>
<li>${t("Abonnement aux notifications : effacé dès l'envoi de la notification, sinon automatiquement 7 jours après le dernier créneau proposé, et au plus tard un an après la création. Son identifiant, sans l'abonnement, est gardé 30 jours de plus.")}</li>
<li>${t("Réponse envoyée en notification : jamais conservée. Elle est chiffrée de bout en bout et seulement transmise.")}</li>
<li>${t("Notification de révélation : le service ne reçoit que l'abonnement, l'heure et un identifiant tiré au hasard, jamais le lien ni la surprise. Effacée dès l'envoi, sinon 7 jours après l'heure prévue au plus tard ; son identifiant, sans l'abonnement, est gardé 30 jours de plus.")}</li>
<li>${t("Journaux : aucun. L'adresse IP sert seulement, sur le moment, à limiter le nombre de demandes ; elle n'est jamais enregistrée.")}</li>
<li>${t("Lien complet, le lien long utilisé quand le service des liens courts ne répond pas : toute l'invitation est dans le lien, rien n'est conservé en ligne. Pour la faire disparaître, supprime les messages qui le contiennent.")}</li>
<li>${t("Google Play peut traiter des données liées au téléchargement de l'appli, selon sa propre politique de confidentialité.")}</li>
</ul>
<p>${t("Le détail est dans les")} <a href="/mentions-legales.html#confidentialite">${t("mentions légales, section « Confidentialité »")}</a>.</p>
</section>
</main>
</div>
${piedDePage("base")}
</body>
</html>
`;
}

function plan(){
  const adresses = [[SITE, MISE_A_JOUR], ...PAGES.map(p => [`${SITE}${p.path}/`, MISE_A_JOUR]), [`${SITE}mentions-legales.html`, MISE_A_JOUR], [`${SITE}${SUPPRESSION.path}/`, SUPPRESSION.maj]];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adresses.map(([a, d]) => `  <url><loc>${a}</loc><lastmod>${d}</lastmod></url>`).join("\n")}
</urlset>
`;
}

const DEBUT_PIED = "<!-- Pied de page : fabriqué par outils/pages.mjs, ne pas modifier ici -->", FIN_PIED = "<!-- /Pied de page -->";
export function piedMentions(html){
  const polices = B.filter(b => sel(b) === "@font-face").map(b => b.replace(/url\("fonts\//g, 'url("/fonts/'));
  const bloc = `${DEBUT_PIED}\n<style>\n${[...polices, ...cssPied()].join("\n")}\n</style>\n${piedDePage("base")}\n${FIN_PIED}`;
  const i = html.indexOf(DEBUT_PIED), j = html.indexOf(FIN_PIED);
  if(i >= 0 && j > i) return html.slice(0, i) + bloc + html.slice(j + FIN_PIED.length);
  return html.replace("</main>\n", "</main>\n" + bloc + "\n");
}
export function fichiers(){
  const f = { "404.html": page404(), "sitemap.xml": plan() };
  for(const p of PAGES) f[`${p.path}/index.html`] = pageOccasion(p);
  f[`${SUPPRESSION.path}/index.html`] = pageSuppression();
  return f;
}

if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  const f = fichiers(), verifier = process.argv.includes("--verifier"), ecarts = [];
  const ml = readFileSync(RACINE + "mentions-legales.html", "utf8").replace(/\r\n/g, "\n");
  f["mentions-legales.html"] = piedMentions(ml);
  for(const [nom, contenu] of Object.entries(f)){
    const chemin = RACINE + nom, actuel = existsSync(chemin) ? readFileSync(chemin, "utf8").replace(/\r\n/g, "\n") : null;
    if(actuel === contenu) continue;
    ecarts.push(nom);
    if(!verifier){ mkdirSync(chemin.slice(0, chemin.lastIndexOf("/")), { recursive: true }); writeFileSync(chemin, contenu); }
  }
  console.log(verifier ? (ecarts.length ? "Pas à jour : " + ecarts.join(", ") : "Pages à jour") : (ecarts.length ? "Écrits : " + ecarts.join(", ") : "Rien à écrire"));
  if(verifier && ecarts.length) process.exitCode = 1;
}
