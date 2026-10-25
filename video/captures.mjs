// Captures et enregistrements de la vidéo de présentation, pris sur le site publié (osedemander.fr).
// Usage (depuis la racine) : node video/captures.mjs [16x9|9x16]   (sans argument : les deux)
// Sortie : video/sources-media/captures/<format>/*.png et video/sources-media/enregistrements/<format>/<nom>/*.jpg
// (dossier exclu de Git). Edge sans fenêtre, piloté par le protocole DevTools ; profil temporaire.
// Date simulée au 10 septembre 2026 : aucun logo ni bandeau de saison (la vidéo ne doit pas dater).
// Le lien court créé pour « Ton lien est prêt » est supprimé en ligne aussitôt après la capture.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SITE = "https://osedemander.fr/";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const SORTIE = join(import.meta.dirname, "sources-media");
const PORT = 9341;
const FORMATS = {
  "16x9": { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false }, // rendu 1920 × 1080
  "9x16": { width: 360, height: 640, deviceScaleFactor: 3, mobile: true },     // rendu 1080 × 1920, mise en page téléphone
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

const pause = ms => new Promise(r => setTimeout(r, ms));

async function cdp(){
  for(let i=0; i<40; i++){
    try{ const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = t.find(x => x.type === "page"); if(p) return p.webSocketDebuggerUrl; }catch{}
    await pause(250);
  }
  throw new Error("Edge ne répond pas");
}

async function session(url){
  const ws = new WebSocket(url);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
  let id = 0; const attente = {}, ecoute = {};
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if(m.id && attente[m.id]){ attente[m.id](m); delete attente[m.id]; }
    else if(m.method && ecoute[m.method]) ecoute[m.method](m.params);
  };
  const cmd = (method, params = {}) => new Promise((ok, ko) => {
    attente[++id] = m => m.error ? ko(new Error(`${method} : ${m.error.message}`)) : ok(m.result);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async x => {
    const r = await cmd("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
    if(r.exceptionDetails) throw new Error("Page : " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  return { ws, cmd, ev, ecoute };
}

async function tourner(format){
  const vue = FORMATS[format];
  const profil = join(tmpdir(), `ose-video-${format}-${Date.now()}`);
  const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--mute-audio", "--no-first-run",
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profil}`, "about:blank"], { stdio: "ignore" });
  const s = await session(await cdp());
  const { cmd, ev } = s;
  const dirCap = join(SORTIE, "captures", format); mkdirSync(dirCap, { recursive: true });
  const dirRec = join(SORTIE, "enregistrements", format);
  const faits = [];

  await cmd("Page.enable"); await cmd("Runtime.enable");
  await cmd("Page.addScriptToEvaluateOnNewDocument", { source: DATE_SIMULEE });
  await cmd("Emulation.setDeviceMetricsOverride", vue);
  if(vue.mobile) await cmd("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }, { name: "prefers-color-scheme", value: "light" }] });

  const aller = async (url, attente = 2500) => { await cmd("Page.navigate", { url }); await pause(attente); };
  const photo = async nom => {
    const { data } = await cmd("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(dirCap, nom + ".png"), Buffer.from(data, "base64")); faits.push(`captures/${format}/${nom}.png`);
  };
  const montrer = async (sel, bloc = "center") => { await ev(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block:"${bloc}"})`); await pause(400); };
  const cliquer = async (sel, attente = 700) => {
    const ok = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true;})()`);
    if(!ok) throw new Error("Introuvable : " + sel);
    await pause(attente);
  };
  const centre = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return r && {x:r.x+r.width/2, y:r.y+r.height/2};})()`);
  // Approche du Non comme une vraie personne : souris qui glisse vers lui (ordinateur), doigt qui le touche (téléphone)
  const viserNon = async () => {
    const c = await centre("#no"); if(!c) return;
    if(vue.mobile){
      await cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c.x, y: c.y }] });
      await cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      for(let k = 6; k >= 0; k--) { await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x - k * 22, y: c.y + k * 9 }); await pause(45); }
    }
  };
  // Enregistrement : images du protocole (screencast), horodatées, pour un montage à cadence exacte avec ffmpeg
  const enregistrer = async (nom, action) => {
    const dir = join(dirRec, nom); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const images = []; let n = 0;
    s.ecoute["Page.screencastFrame"] = p => {
      const f = `${String(++n).padStart(4, "0")}.jpg`;
      writeFileSync(join(dir, f), Buffer.from(p.data, "base64")); images.push({ f, t: p.metadata.timestamp });
      cmd("Page.screencastFrameAck", { sessionId: p.sessionId }).catch(() => {});
    };
    await cmd("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: vue.width * vue.deviceScaleFactor, maxHeight: vue.height * vue.deviceScaleFactor, everyNthFrame: 1 });
    await pause(300);
    await action();
    await cmd("Page.stopScreencast"); delete s.ecoute["Page.screencastFrame"];
    writeFileSync(join(dir, "images.json"), JSON.stringify(images));
    faits.push(`enregistrements/${format}/${nom}/ (${images.length} images, ${images.length ? (images.at(-1).t - images[0].t).toFixed(1) : 0} s)`);
  };

  for(const sc of SCENARIOS){
    const p = sc.nom;
    // ---------- Côté création ----------
    await aller(SITE);
    if(sc.creation) await photo(`${p}-01-accueil`);
    await ev(`(()=>{const c=[...document.querySelectorAll(".home-card")].find(b=>b.textContent.includes(${JSON.stringify(sc.cat)})); (c||document.querySelector(".home-card")).click();})()`);
    await pause(900);
    await ev(`document.querySelector('[data-cat=${JSON.stringify(sc.cat)}]')?.click()`); await pause(600);
    await photo(`${p}-02-choix-du-modele`);
    await cliquer(`[data-tpl="${sc.tpl}"]`, 900);
    await ev(`(()=>{for(const [id,v] of [["to",${JSON.stringify(sc.pour)}],["from",${JSON.stringify(sc.de)}]]){const i=document.getElementById(id); i.value=v; i.dispatchEvent(new Event("input",{bubbles:true}));}})()`);
    await pause(300);
    if(sc.creation) await photo(`${p}-03-prenoms`);
    await ev(`document.getElementById("form").requestSubmit()`); await pause(900);
    await ev(`(()=>{Object.assign(S,{date:${JSON.stringify(sc.date)}, time:${JSON.stringify(sc.heure)},
      act:{v:"v",x:${JSON.stringify(sc.act)},h:"",at:""}, lieu:{v:"s",x:"",h:${JSON.stringify(sc.indice)},at:""}}); renderCreator();})()`);
    await pause(700);
    if(sc.creation) await photo(`${p}-04-quand-et-ou`);
    await ev(`document.getElementById("form").requestSubmit()`); await pause(1200);
    if(sc.creation) await photo(`${p}-05-apercu`);
    // Personnalisation : thème, puis ton du Non
    await ev(`(()=>{S.moreOpen=true; S.open.add("style"); S.open.add("no"); renderCreator();})()`); await pause(500);
    await cliquer(`[data-th="${sc.theme}"]`, 900);
    await montrer(`details[data-sec="style"]`, "start");
    if(sc.creation) await photo(`${p}-06-theme`);
    await cliquer(`[data-tone="${sc.ton}"]`, 800);
    await montrer(`details[data-sec="no"]`, "start");
    if(sc.creation) await photo(`${p}-07-ton-du-non`);
    await ev(`(()=>{S.moreOpen=false; S.open.clear(); renderCreator(); scrollTo(0,0);})()`); await pause(900);
    await photo(`${p}-08-apercu-personnalise`);
    const lien = await ev(`buildLink()`);
    if(sc.creation){
      await montrer("#make");
      await photo(`${p}-09-creer-mon-lien`);
      await cliquer("#make", 4000);
      await montrer("#result");
      await photo(`${p}-10-lien-pret`);
      // Le lien court vient d'être déposé en ligne pour la capture : on le supprime aussitôt
      const suppr = await ev(`(async()=>{const m=(S.link||"").match(/#s=([^.]+)\\./); const it=loadHistory()[0];
        if(!m || !it || !it.jeton) return "aucun lien court"; return await deleteShort(m[1], it.jeton);})()`);
      faits.push(`lien court de la capture supprimé en ligne : ${suppr}`);
    }

    // ---------- Côté personne invitée (lien complet : rien n'est déposé en ligne) ----------
    await aller(lien, 3000);
    await photo(`${p}-11-enveloppe`);
    await enregistrer(`${p}-ouverture-enveloppe`, async () => { await pause(500); await cliquer("#env", 2600); });
    await photo(`${p}-12-introduction`);
    await cliquer("#introNext", 1200);
    await cliquer("#introNext", 1600);
    await photo(`${p}-13-question`);
    await enregistrer(`${p}-non-qui-fuit`, async () => {
      for(let k = 0; k < 3; k++){ await pause(900); await viserNon(); }
      await pause(1800);
    });
    await photo(`${p}-14-non-qui-fuit`);
    await ev(`document.getElementById("refuse") ? "" : new Promise(r=>setTimeout(r,8000))`);
    await montrer("#refuse");
    await photo(`${p}-15-vrai-refus-propose`);
    await cliquer("#refuse", 1500);
    await photo(`${p}-16-vrai-refus`);
    await cliquer("#undoNo", 1500);
    await enregistrer(`${p}-apres-le-oui`, async () => { await pause(400); await cliquer("#yes", 5500); });
    await photo(`${p}-17-apres-le-oui`);
  }

  s.ws.close(); edge.kill();
  await pause(800); rmSync(profil, { recursive: true, force: true, maxRetries: 5 });
  return faits;
}

const demandes = process.argv[2] ? [process.argv[2]] : Object.keys(FORMATS);
for(const f of demandes){
  if(!FORMATS[f]) throw new Error("Format inconnu : " + f);
  console.log(`\n== ${f} ==`);
  for(const l of await tourner(f)) console.log("  " + l);
}
