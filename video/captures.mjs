// Captures et enregistrements des vidéos, pris sur le site publié (osedemander.fr).
// Usage (depuis la racine) : node video/captures.mjs [16x9|9x16|tous] [presentation|complet|tout]
// Sortie (hors Git) : video/sources-media/captures/<format>/*.png et video/sources-media/clips/<format>/*.mp4
//
// Qualité : tout est pris au-dessus de la résolution finale (2560 × 1440, 1440 × 2560) puis réduit au montage,
// pour un texte net. Les enregistrements sont filmés image par image en temps virtuel (horloge du navigateur
// avancée de 1/30 s entre deux images) : 30 images par seconde exactes, sans saut, quelle que soit la machine.
// Date simulée au 10 septembre 2026, 10 h (chaque page repart de cette heure) : aucun logo ni bandeau de saison.
// Liens courts : celui de « Ton lien est prêt » (et celui de l'image) est supprimé en ligne aussitôt après la capture ;
// côté personne invitée, le service des liens courts est bloqué (rappel d'agenda et partage en liens complets) :
// aucune donnée de capture ne reste en ligne.
// Jamais montré (faits.md) : la notification de révélation (case masquée), l'anglais, le Play Store.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir, freemem } from "node:os";
import { FFMPEG } from "./outils.mjs";

const SITE = "https://osedemander.fr/";
const SERVICE_LIENS = "*ose-liens.osedemander.workers.dev*";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const SORTIE = join(import.meta.dirname, "sources-media");
const FPS = 30;
let port = 9341; // un port neuf à chaque navigateur : l'ancien peut garder le sien quelques instants
const FORMATS = {
  // 2560 × 1440 et 1440 × 2560 : plus grand que la vidéo finale (jamais agrandi), deux fois moins de mémoire que la 4K (machine de 7,7 Go)
  "16x9": { width: 1280, height: 720, deviceScaleFactor: 2, mobile: false }, // 2560 × 1440, réduit en 1920 × 1080
  "9x16": { width: 360, height: 640, deviceScaleFactor: 4, mobile: true },   // 1440 × 2560, réduit en 1080 × 1920 (mise en page téléphone)
};
const SCENARIOS = [
  { nom: "amour", cat: "Amour", tpl: "rdv", theme: "amour", ton: "romantique", de: "Alex", pour: "Sam",
    act: "Dîner aux chandelles", indice: "Pas loin de chez toi", date: "2026-09-19", heure: "20:00", creation: true },
  { nom: "soiree", cat: "Amis", tpl: "soiree", theme: "soiree", ton: "drole", de: "Camille", pour: "Noa",
    act: "Soirée pizza et jeux", indice: "Chez moi, tu connais", date: "2026-09-26", heure: "19:30", creation: false },
];
const DATE_SIMULEE = `(()=>{const R=Date,OFF=new R(2026,8,10,10,0,0)-R.now();
  function D(...a){ if(!new.target) return new D().toString(); return a.length ? new R(...a) : new R(R.now()+OFF); }
  D.prototype=R.prototype; D.now=()=>R.now()+OFF; D.parse=R.parse; D.UTC=R.UTC; globalThis.Date=D; })();`;
// La notification de révélation n'apparaît dans aucune vidéo (faits.md)
const MASQUES = `.rev-notif{display:none!important}`;

const pause = ms => new Promise(r => setTimeout(r, ms));
// Garde-fou : la machine a peu de mémoire (7,7 Go). Sous 700 Mo libres, arrêt propre (ce qui est fait est gardé).
const SEUIL_MEMOIRE = 700 * 2 ** 20;
let minimumLibre = Infinity;
// Tout Edge ouvert par le script est fermé à la sortie, même en cas d’arrêt
const ouverts = new Set();
process.on("exit", () => { for(const pid of ouverts) spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" }); });
function memoire(){
  const libre = freemem(); minimumLibre = Math.min(minimumLibre, libre);
  if(libre < SEUIL_MEMOIRE) throw new Error(`Mémoire libre trop basse (${Math.round(libre / 2 ** 20)} Mo) : arrêt propre. Ferme des applications, puis relance.`);
}

async function navigateur(vue){
  const profil = join(tmpdir(), `ose-video-${Date.now()}`), PORT = ++port;
  const edge = spawn(EDGE, ["--headless=new", "--hide-scrollbars", "--mute-audio", "--no-first-run",
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profil}`, "about:blank"], { stdio: "ignore" });
  ouverts.add(edge.pid);
  let url;
  for(let i = 0; i < 60 && !url; i++){ try{ url = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(x => x.type === "page")?.webSocketDebuggerUrl; }catch{} if(!url) await pause(250); }
  if(!url) throw new Error("Edge ne répond pas");
  const ws = new WebSocket(url);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
  let id = 0; const attente = {}, ecoute = {};
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if(m.id && attente[m.id]){ attente[m.id](m); delete attente[m.id]; }
    else if(m.method && ecoute[m.method]) ecoute[m.method](m.params);
  };
  // Toute commande sans réponse au bout de 90 s arrête le script en la nommant (au lieu d’un blocage silencieux)
  const cmd = (method, params = {}) => new Promise((ok, ko) => {
    const n = ++id, t = setTimeout(() => { delete attente[n]; ko(new Error(`${method} : pas de réponse du navigateur en 90 s`)); }, 90000);
    attente[n] = m => { clearTimeout(t); m.error ? ko(new Error(`${method} : ${m.error.message}`)) : ok(m.result); };
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const ev = async x => {
    const r = await cmd("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
    if(r.exceptionDetails) throw new Error("Page : " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  await cmd("Page.enable"); await cmd("Runtime.enable"); await cmd("Network.enable");
  await cmd("Page.addScriptToEvaluateOnNewDocument", { source: DATE_SIMULEE
    + `;addEventListener("DOMContentLoaded",()=>{const s=document.createElement("style");s.textContent=${JSON.stringify(MASQUES)};document.head.appendChild(s);});` });
  await cmd("Emulation.setDeviceMetricsOverride", vue);
  if(vue.mobile) await cmd("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }, { name: "prefers-color-scheme", value: "light" }] });
  // Fermeture de tout l'arbre de processus d'Edge (sinon des processus enfants survivent)
  const fermer = async () => { ws.close(); spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore" }); ouverts.delete(edge.pid); await pause(1000); rmSync(profil, { recursive: true, force: true, maxRetries: 5 }); };
  return { cmd, ev, ecoute, fermer };
}

/* Outils de prise de vue pour un navigateur ouvert */
function outillage({ cmd, ev, ecoute }, vue, format, faits){
  const dirCap = join(SORTIE, "captures", format); mkdirSync(dirCap, { recursive: true });
  const dirClips = join(SORTIE, "clips", format); mkdirSync(dirClips, { recursive: true });
  const o = { virtuel: false }; // une fois le temps virtuel en marche, toute attente avance l'horloge du navigateur
  o.attendre = async s => {
    if(!o.virtuel) return pause(s * 1000);
    const fini = new Promise((r, ko) => { const t = setTimeout(() => ko(new Error(`temps virtuel : ${s} s jamais écoulées`)), s * 1000 + 60000); ecoute["Emulation.virtualTimeBudgetExpired"] = () => { clearTimeout(t); r(); }; });
    await cmd("Emulation.setVirtualTimePolicy", { policy: "advance", budget: s * 1000 }); await fini;
  };
  o.tempsVirtuel = async () => { await cmd("Emulation.setVirtualTimePolicy", { policy: "pause" }); o.virtuel = true; };
  o.bloquerLiensCourts = () => cmd("Network.setBlockedURLs", { urls: [SERVICE_LIENS] });
  // Passage par une page vide : un simple changement d'ancre (#…) ne rechargerait pas la page
  o.aller = async (url, s = 3) => { await cmd("Page.navigate", { url: "about:blank" }); await pause(300); await cmd("Page.navigate", { url }); await pause(s * 1000); };
  o.photo = async nom => {
    memoire(); console.error(`  [${new Date().toLocaleTimeString("fr-FR")}] photo ${nom}`);
    const { data } = await cmd("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(dirCap, nom + ".png"), Buffer.from(data, "base64")); faits.push(`captures/${format}/${nom}.png`);
  };
  // En temps virtuel en pause, un défilement (et un clic qui en provoque un) ne se termine que lorsque l’horloge avance :
  // on lance l’action, on fait avancer l’horloge, puis on attend sa réponse (sinon : blocage)
  o.evAvance = async (x, s = 0.4) => { if(!o.virtuel){ const r = await ev(x); await pause(s * 1000); return r; } const p = ev(x); await o.attendre(s); return p; };
  o.montrer = async (sel, bloc = "center") => {
    if(!(await o.evAvance(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.scrollIntoView({block:"${bloc}",behavior:"instant"}); return true;})()`))) throw new Error("Introuvable : " + sel);
  };
  o.cliquer = async (sel, attente = 0.7) => {
    const ok = await o.evAvance(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true;})()`, attente);
    if(!ok) throw new Error("Introuvable : " + sel);
  };
  o.centre = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return r && {x:r.x+r.width/2, y:r.y+r.height/2};})()`);
  // Approche du Non comme une vraie personne : souris qui glisse vers lui (ordinateur), doigt qui le touche (téléphone)
  o.viserNon = async (k, appuyer = false) => {
    const c = await o.centre("#no"); if(!c) return;
    if(vue.mobile){
      await cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c.x, y: c.y }] });
      await cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x - (6 - k) * 22, y: c.y + (6 - k) * 9 });
      if(appuyer && k === 6) for(const type of ["mousePressed", "mouseReleased"]) await cmd("Input.dispatchMouseEvent", { type, x: c.x, y: c.y, button: "left", clickCount: 1 });
    }
  };
  o.survoler = async dessus => { const c = await o.centre("#no"); if(c) await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: dessus ? c.x : c.x - 300, y: dessus ? c.y : c.y + 150 }); };
  o.approches = (debuts, appuyer = false) => {
    const a = {};
    for(const d of debuts) for(let k = 0; k < (vue.mobile ? 1 : 7); k++) a[d + k] = () => o.viserNon(vue.mobile ? 6 : k, appuyer);
    return a;
  };
  // Enregistrement image par image : l'horloge avance de 1/30 s, puis capture ; les images vont directement à ffmpeg
  o.enregistrer = async (nom, secondes, actions = {}) => {
    const sortie = join(dirClips, nom + ".mp4");
    const ff = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
      "-c:v", "libx264", "-crf", "8", "-preset", "ultrafast", "-threads", "4", "-pix_fmt", "yuv420p", sortie], { stdio: ["pipe", "inherit", "inherit"] });
    const n = Math.round(secondes * FPS);
    for(let f = 0; f < n; f++){
      if(f % 15 === 0) memoire();
      const action = actions[f] ? actions[f]() : null; // lancée, puis l’horloge avance, puis on attend sa fin
      await o.attendre(1 / FPS); if(action) await action;
      const { data } = await cmd("Page.captureScreenshot", { format: "jpeg", quality: 96, optimizeForSpeed: true });
      if(!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise(r => ff.stdin.once("drain", r));
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
    faits.push(`clips/${format}/${nom}.mp4 (${n} images, ${secondes} s)`);
  };
  // Création jusqu'à l'aperçu (étapes 1 à 4), avec photos facultatives
  o.creer = async (sc, photos = true, etape3 = null) => {
    const ph = async n => { if(photos) await o.photo(n); };
    await o.aller(SITE);
    await ph(`${sc.nom}-01-accueil`);
    await ev(`(()=>{const c=[...document.querySelectorAll(".home-card")].find(b=>b.textContent.includes(${JSON.stringify(sc.cat)})); (c||document.querySelector(".home-card")).click();})()`);
    await pause(900);
    await ev(`document.querySelector('[data-cat=${JSON.stringify(sc.cat)}]')?.click()`); await pause(600);
    await o.photo(`${sc.nom}-02-choix-du-modele`);
    await o.cliquer(`[data-tpl="${sc.tpl}"]`, 0.9);
    await ev(`(()=>{for(const [id,v] of [["to",${JSON.stringify(sc.pour)}],["from",${JSON.stringify(sc.de)}]]){const i=document.getElementById(id); i.value=v; i.dispatchEvent(new Event("input",{bubbles:true}));}})()`);
    await pause(300);
    await ph(`${sc.nom}-03-prenoms`);
    await ev(`document.getElementById("form").requestSubmit()`); await pause(900);
    await ev(`(()=>{Object.assign(S,{date:${JSON.stringify(sc.date)}, time:${JSON.stringify(sc.heure)},
      act:{v:"v",x:${JSON.stringify(sc.act)},h:"",at:""}, lieu:{v:"s",x:"",h:${JSON.stringify(sc.indice)},at:""}}); renderCreator();})()`);
    await pause(700);
    if(etape3) await etape3();
    await ph(`${sc.nom}-04-quand-et-ou`);
    await ev(`document.getElementById("form").requestSubmit()`); await pause(1200);
    if(!(await ev(`S.step===4`))) throw new Error("La création n'a pas atteint l'aperçu : " + await ev(`S.err||document.getElementById("err")?.textContent||""`));
    await ph(`${sc.nom}-05-apercu`);
  };
  // Supprime en ligne les liens courts créés pendant la capture (lien de l'invitation, lien de l'image)
  o.supprimerLiens = async () => ev(`(async()=>{const r=[]; for(const it of loadHistory()){
      const m=(it.link||"").match(/#s=([^.]+)\\./); if(m && it.jeton) r.push(await deleteShort(m[1], it.jeton));
      const i=(it.img||"").match(/#s=([^.]+)\\./); if(i && it.imgJeton) r.push(await deleteShort(i[1], it.imgJeton)); }
      return r.join(", ") || "aucun";})()`);
  return o;
}

/* ---------------- Vidéo de présentation ---------------- */
async function presentation(format){
  const vue = FORMATS[format], faits = [];
  for(const sc of SCENARIOS){
    const nav = await navigateur(vue), { ev } = nav, o = outillage(nav, vue, format, faits), p = sc.nom;
    await o.creer(sc, sc.creation);
    await ev(`(()=>{S.moreOpen=true; S.open.add("style"); S.open.add("no"); renderCreator();})()`); await pause(500);
    await o.cliquer(`[data-th="${sc.theme}"]`, 0.9);
    await o.montrer(`details[data-sec="style"]`, "start");
    if(sc.creation) await o.photo(`${p}-06-theme`);
    await o.cliquer(`[data-tone="${sc.ton}"]`, 0.8);
    await o.montrer(`details[data-sec="no"]`, "start");
    if(sc.creation) await o.photo(`${p}-07-ton-du-non`);
    await ev(`(()=>{S.moreOpen=false; S.open.clear(); renderCreator(); scrollTo(0,0);})()`); await pause(900);
    await o.photo(`${p}-08-apercu-personnalise`);
    const lien = await ev(`buildLink()`);
    if(sc.creation){
      await o.montrer("#make");
      await o.photo(`${p}-09-creer-mon-lien`);
      await o.cliquer("#make", 4);
      await o.montrer("#result");
      await o.photo(`${p}-10-lien-pret`);
      faits.push(`liens courts de la capture supprimés en ligne : ${await o.supprimerLiens()}`);
    }
    // Côté personne invitée : lien complet, service des liens courts bloqué, temps virtuel
    await o.bloquerLiensCourts();
    await o.aller(lien, 3.5); await o.tempsVirtuel(); await o.attendre(0.5);
    await o.photo(`${p}-11-enveloppe`);
    await o.enregistrer(`${p}-ouverture-enveloppe`, 4, { 12: () => ev(`document.getElementById("env").click()`) });
    await o.photo(`${p}-12-introduction`);
    await o.cliquer("#introNext", 1.2);
    await o.cliquer("#introNext", 1.6);
    await o.photo(`${p}-13-question`);
    // Trois approches du Non (la troisième fait apparaître « Répondre non, pour de vrai »)
    await o.enregistrer(`${p}-non-qui-fuit`, 5, o.approches([15, 45, 75]));
    await o.photo(`${p}-14-non-qui-fuit`);
    if(!(await ev(`!!document.getElementById("refuse")`))) await o.attendre(8);
    await o.montrer("#refuse");
    await o.photo(`${p}-15-vrai-refus-propose`);
    await o.cliquer("#refuse", 1.5);
    await o.photo(`${p}-16-vrai-refus`);
    await o.cliquer("#undoNo", 1.5);
    await o.enregistrer(`${p}-apres-le-oui`, 6, { 10: () => ev(`document.getElementById("yes").click()`) });
    await o.photo(`${p}-17-apres-le-oui`);
    await nav.fermer();
  }
  return faits;
}

// Le Non qui se transforme : un clic le change en « Oui ? » (comme sur le site), puis il redevient « Non » (événement blur), puis de nouveau
const transformations = ev => ({ 15: () => ev(`document.getElementById("no").click()`), 70: () => ev(`document.getElementById("no").dispatchEvent(new Event("blur"))`), 95: () => ev(`document.getElementById("no").click()`) });

/* Le Non qui se transforme, seul (pour le refilmer sans tout reprendre) */
async function transforme(format){
  const vue = FORMATS[format], faits = [];
  let nav = await navigateur(vue), o = outillage(nav, vue, format, faits);
  await o.aller(SITE, 3.5);
  const lien = await nav.ev(`(async()=>{ await needCreer(); applyTemplate("rdv"); Object.assign(S,{from:"Alex", to:"Sam", no:"transforme", date:"2026-09-19", time:"20:00", act:{v:"v",x:"Dîner aux chandelles",h:"",at:""}, lieu:{v:"s",x:"",h:"Pas loin de chez toi",at:""}}); return await buildLink(); })()`);
  await nav.fermer();
  nav = await navigateur(vue); o = outillage(nav, vue, format, faits);
  await o.bloquerLiensCourts();
  await o.aller(lien, 3.5); await o.tempsVirtuel(); await o.attendre(0.5);
  await o.cliquer("#env", 2); await o.cliquer("#introSkip", 1.2);
  await o.enregistrer("c-non-transforme", 5, transformations(nav.ev));
  await nav.fermer();
  return faits;
}

/* ---------------- Écrans en plus pour la vidéo complète (préfixe c-) ---------------- */
async function complet(format){
  const vue = FORMATS[format], faits = [], sc = SCENARIOS[0];
  const NZ = "exempleExempleExemple0.exempleExempleExemple1"; // identifiant fictif, jamais envoyé (historique d'exemple)
  let liens = {};
  {
    const nav = await navigateur(vue), { ev } = nav, o = outillage(nav, vue, format, faits);
    // Catégories
    await o.aller(SITE);
    await ev(`document.querySelector(".home-card").click()`); await pause(900);
    for(const cat of ["Famille", "Surprise"]){ await ev(`document.querySelector('[data-cat="${cat}"]')?.click()`); await pause(700); await o.photo(`c-categorie-${cat.toLowerCase()}`); }
    // Création avec plusieurs créneaux au choix
    await o.creer(sc, false, async () => {
      await ev(`(()=>{Object.assign(S,{choose:true, slots:[{d:"2026-09-19",t:"20:00"},{d:"2026-09-20",t:"12:30"},{d:"2026-09-26",t:"19:30"}]}); renderCreator();})()`);
      await pause(700); await o.montrer("#form h2", "start"); await o.photo("c-creneaux");
    });
    // Les mots (message caché jusqu'au Oui, introduction)
    await ev(`(()=>{Object.assign(S,{hidden:true, moreOpen:true, open:new Set(["words"])}); renderCreator();})()`); await pause(700);
    await o.montrer(`details[data-sec="words"]`, "start"); await o.photo("c-les-mots");
    // Programme en étapes (surprise, révélé plus tard)
    await ev(`(()=>{Object.assign(S,{mode:"prog", steps:[
        {h:"19:30", v:"v", a:"Apéritif au bord de l'eau", l:"", hint:"", at:""},
        {h:"20:30", v:"r", a:"Dîner aux chandelles", l:"", hint:"Une table rien que pour nous", at:"2026-09-19T20:30"},
        {h:"22:30", v:"s", a:"", l:"", hint:"Une dernière surprise", at:""}], open:new Set(["plan"])}); renderCreator();})()`); await pause(700);
    await o.montrer(`details[data-sec="plan"]`, "start"); await o.photo("c-programme");
    // Retour à une seule activité, révélée deux minutes après l'ouverture (pour filmer le cadenas et la révélation)
    await ev(`(()=>{Object.assign(S,{mode:"one", act:{v:"r",x:"Dîner aux chandelles",h:"Une table rien que pour nous",at:"2026-09-10T10:02"}, open:new Set(["reply"])}); renderCreator();})()`); await pause(700);
    // La réponse (canaux, partage autorisé)
    await ev(`(()=>{const b=document.querySelector('[data-ch="wa"]'); if(b) b.click();})()`); await pause(500);
    await ev(`(()=>{const i=document.getElementById("chId"); if(i){ i.value="06 00 00 00 01"; i.dispatchEvent(new Event("input",{bubbles:true})); }})()`); await pause(300);
    await o.montrer(`details[data-sec="reply"]`, "start"); await o.photo("c-la-reponse");
    await o.montrer(".notif-opt"); await o.photo("c-notification-de-reponse");
    // Liens de démonstration (complets) pour la personne invitée et l'historique
    liens.principal = await ev(`buildLink()`);
    liens.historique = await ev(`buildLink(${JSON.stringify(NZ)})`);
    for(const no of ["retrecit", "transforme"]) liens[no] = await ev(`(async()=>{const a=S.no, c=S.choose; Object.assign(S,{no:${JSON.stringify(no)}, choose:false}); const l=await buildLink(); Object.assign(S,{no:a, choose:c}); return l;})()`);
    // Créer le lien, puis « Partager en image » (story, puis carré)
    await o.cliquer("#make", 4); await o.montrer("#result");
    await o.cliquer("#imgOpen", 5); await o.photo("c-image-story");
    await o.cliquer('[data-fmt="carre"]', 2.5);
    await o.photo("c-image-carre");
    faits.push(`liens courts de la capture supprimés en ligne : ${await o.supprimerLiens()}`);
    // Mes invitations : deux invitations d'exemple, dont une avec une réponse reçue par notification
    await ev(`(async()=>{const d=await decodeData(linkData(${JSON.stringify(liens.historique)}));
      const a=entryFrom(d, ${JSON.stringify(liens.historique)}, "2026-09-08T18:12:00.000Z", undefined, {rep:"o", repAt:"2026-09-09T08:40:00.000Z", repSlot:0});
      const b=entryFrom({...d, t:"Noa", o:"soiree", sl:undefined, d:"2026-09-26", h:"19:30", nz:undefined}, ${JSON.stringify(liens.principal)}, "2026-09-09T20:05:00.000Z");
      storeHistory([b, a]);})()`);
    await o.aller(SITE + "#mes-invitations", 2.5); await o.photo("c-mes-invitations");
    // Installer l'appli
    await o.aller(SITE + "#installer", 2.5); await o.photo("c-installer");
    await nav.fermer();
  }
  {
    // Côté personne invitée : créneaux, agenda, cadenas, révélation, partage de la surprise
    const nav = await navigateur(vue), { ev } = nav, o = outillage(nav, vue, format, faits);
    await o.bloquerLiensCourts();
    await o.aller(liens.principal, 3.5); await o.tempsVirtuel(); await o.attendre(0.5);
    await o.evAvance(`document.querySelector(".env-screen")?.lastElementChild?.scrollIntoView({block:"end",behavior:"instant"})`, 0.3);
    await o.photo("c-mention-de-securite");
    await o.cliquer("#env", 2); await o.cliquer("#introSkip", 1.2);
    await o.cliquer("#yes", 5); await o.montrer(".slots"); await o.photo("c-choix-du-creneau");
    await o.cliquer("[data-pick='0']", 2.5);
    await o.montrer("#cal"); await o.photo("c-agenda");
    await o.montrer(".count"); await o.photo("c-cadenas");
    // La révélation, à 10 h 02 (heure simulée) : on avance jusqu'à quelques secondes avant, puis on filme
    const reste = await ev(`(new Date("2026-09-10T10:02:00") - Date.now())/1000`);
    await o.attendre(Math.max(0, reste - 2));
    await o.montrer(".count");
    await o.enregistrer("c-revelation", 7);
    await o.photo("c-revele");
    await o.montrer("#shareSur"); await o.photo("c-partager-la-surprise");
    liens.partage = await ev(`shareLink`);
    await nav.fermer();
  }
  if(liens.partage){
    // Version partagée : navigateur neuf, en temps réel (en temps virtuel en pause, une nouvelle page ne se charge pas)
    const nav = await navigateur(vue), o = outillage(nav, vue, format, faits);
    await o.bloquerLiensCourts(); await o.aller(liens.partage, 4); await o.photo("c-version-partagee");
    await nav.fermer();
  }
  for(const no of ["retrecit", "transforme"]){
    // Les autres caractères du Non
    const nav = await navigateur(vue), { ev } = nav, o = outillage(nav, vue, format, faits);
    await o.bloquerLiensCourts();
    await o.aller(liens[no], 3.5); await o.tempsVirtuel(); await o.attendre(0.5);
    await o.cliquer("#env", 2); await o.cliquer("#introSkip", 1.2);
    // Rétrécit : trois appuis. Se transforme : la souris se pose sur le Non et y reste (téléphone : le Non reçoit le focus), puis repart
    // (le survol et le focus simulés ne prennent pas en temps virtuel ; le clic, si)
    const actions = no === "retrecit" ? o.approches([15, 50, 85], true) : transformations(ev);
    await o.enregistrer(`c-non-${no}`, 5, actions);
    await nav.fermer();
  }
  return faits;
}

const [quoiFormat = "tous", quoi = "tout"] = process.argv.slice(2);
const formats = quoiFormat === "tous" ? Object.keys(FORMATS) : [quoiFormat];
for(const f of formats){
  if(!FORMATS[f]) throw new Error("Format inconnu : " + f);
  for(const [nom, fn] of [["presentation", presentation], ["complet", complet], ["transforme", transforme]]){
    if(quoi !== nom && !(quoi === "tout" && nom !== "transforme")) continue;
    console.log(`\n== ${f} : ${nom} ==`);
    for(const l of await fn(f)) console.log("  " + l);
    console.log(`  mémoire libre au plus bas : ${Math.round(minimumLibre / 2 ** 20)} Mo`);
  }
}
