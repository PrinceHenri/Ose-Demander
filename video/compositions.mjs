// Rend les calques de la vidéo (compositions/calque.html) en PNG transparents, avec Edge sans fenêtre.
// Utilisé par montage.mjs ; sortie : sources-media/calques/<nom>.png
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { MEDIA, RACINE } from "./outils.mjs";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9343;
const pause = ms => new Promise(r => setTimeout(r, ms));

export async function rendreCalques(calques){
  const dir = join(MEDIA, "calques"); mkdirSync(dir, { recursive: true });
  const profil = join(tmpdir(), `ose-calques-${Date.now()}`);
  const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profil}`, "about:blank"], { stdio: "ignore" });
  let url;
  for(let i = 0; i < 40 && !url; i++){ try{ url = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === "page")?.webSocketDebuggerUrl; }catch{} if(!url) await pause(250); }
  const ws = new WebSocket(url); await new Promise(r => ws.onopen = r);
  let id = 0; const att = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if(att[m.id]){ att[m.id](m.result); delete att[m.id]; } };
  const cmd = (method, params = {}) => new Promise(r => { att[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  await cmd("Page.enable");
  await cmd("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  const page = pathToFileURL(join(RACINE, "compositions", "calque.html")).href;
  const faits = {};
  for(const c of calques){
    const v = c.format === "9x16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
    await cmd("Emulation.setDeviceMetricsOverride", { ...v, deviceScaleFactor: 1, mobile: false });
    // Passage par une page vide : sinon, seule l'ancre change, la page n'est pas rechargée et l'on capture le calque précédent
    await cmd("Page.navigate", { url: "about:blank" }); await pause(150);
    await cmd("Page.navigate", { url: page + "#" + encodeURIComponent(JSON.stringify(c)) });
    for(let i = 0; i < 40; i++){ const r = await cmd("Runtime.evaluate", { expression: "document.title", returnByValue: true }); if(r.result.value === "pret") break; await pause(100); }
    await pause(150);
    const { data } = await cmd("Page.captureScreenshot", { format: "png" });
    const f = join(dir, c.nom + ".png"); writeFileSync(f, Buffer.from(data, "base64")); faits[c.nom] = f;
  }
  ws.close(); edge.kill(); await pause(600); rmSync(profil, { recursive: true, force: true, maxRetries: 5 });
  return faits;
}
