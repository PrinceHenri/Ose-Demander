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
.ideas{text-align:center;margin:0 0 8px}
.ideas h2{font-size:17px;display:inline-block;background:var(--surface);border-radius:10px;padding:2px 10px}
.ideas ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.ideas a{display:inline-flex;align-items:center;min-height:44px;padding:8px 14px;border:2px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink);font-size:15px;font-weight:600;text-decoration:none}
.ideas a:hover{border-color:var(--ink)}
.foot{text-align:center;color:var(--muted);font-size:14px;margin:22px auto 0;max-width:46ch}
.foot span{display:inline-block;background:var(--surface);border-radius:10px;padding:6px 12px}
.nw{white-space:nowrap}
h2,.handnote,.question,.lead{text-wrap:balance}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`;
  return [...polices, ...couleurs, ...scene, ...images, mise].join("\n");
}

const tete = ({ titre, description, canonique, theme, robots, jsonld }) => {
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
${cssPage(theme)}
</style>
</head>`;
};
const pied = `<p class="foot"><span>Ose Demander est gratuit et sans compte. Rien n'est stocké en clair en ligne. <a href="/mentions-legales.html#confidentialite">Confidentialité</a> <a href="/mentions-legales.html">Mentions légales</a></span></p>`;
const autres = courante => `<nav class="ideas" aria-labelledby="autres"><h2 id="autres">${courante ? "Autres idées d'invitations" : "Idées d'invitations"}</h2>
<ul>${PAGES.filter(p => p.path !== courante).map(p => `<li><a href="/${p.path}/">${t(p.label)}</a></li>`).join("")}<li><a href="/">Toutes les occasions</a></li></ul></nav>`;

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
${autres(p.path)}
</main>
${pied}
</div>
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
${autres("")}
</main>
${pied}
</div>
</body>
</html>
`;
}

function plan(){
  const adresses = [SITE, ...PAGES.map(p => `${SITE}${p.path}/`), `${SITE}mentions-legales.html`];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adresses.map(a => `  <url><loc>${a}</loc><lastmod>${MISE_A_JOUR}</lastmod></url>`).join("\n")}
</urlset>
`;
}

export function fichiers(){
  const f = { "404.html": page404(), "sitemap.xml": plan() };
  for(const p of PAGES) f[`${p.path}/index.html`] = pageOccasion(p);
  return f;
}

if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  const f = fichiers(), verifier = process.argv.includes("--verifier"), ecarts = [];
  for(const [nom, contenu] of Object.entries(f)){
    const chemin = RACINE + nom, actuel = existsSync(chemin) ? readFileSync(chemin, "utf8").replace(/\r\n/g, "\n") : null;
    if(actuel === contenu) continue;
    ecarts.push(nom);
    if(!verifier){ mkdirSync(chemin.slice(0, chemin.lastIndexOf("/")), { recursive: true }); writeFileSync(chemin, contenu); }
  }
  console.log(verifier ? (ecarts.length ? "Pas à jour : " + ecarts.join(", ") : "Pages à jour") : (ecarts.length ? "Écrits : " + ecarts.join(", ") : "Rien à écrire"));
  if(verifier && ecarts.length) process.exitCode = 1;
}
