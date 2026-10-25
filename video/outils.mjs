// Outils communs du montage : chemin de ffmpeg, exécution, durée d'un média, silences de la voix.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const WINGET = join(process.env.LOCALAPPDATA || "", "Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin");
function trouver(nom){
  if(process.env[nom.toUpperCase()]) return process.env[nom.toUpperCase()];
  if(spawnSync(nom, ["-version"], { stdio: "ignore" }).status === 0) return nom;
  const p = join(WINGET, nom + ".exe"); if(existsSync(p)) return p;
  throw new Error(`${nom} introuvable : installe-le (winget install Gyan.FFmpeg) ou indique son chemin dans ${nom.toUpperCase()}`);
}
export const FFMPEG = trouver("ffmpeg"), FFPROBE = trouver("ffprobe");
export const RACINE = import.meta.dirname;
export const MEDIA = join(RACINE, "sources-media");
export const RENDUS = join(RACINE, "rendus");

export const ff = args => execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
export const duree = f => Number(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());
// Silences d'un fichier audio : [{debut, fin}] (sert à caler les phrases de la voix sans transcription payante)
export function silences(f, seuil = "-38dB", min = 0.2){
  const r = spawnSync(FFMPEG, ["-hide_banner", "-i", f, "-af", `silencedetect=noise=${seuil}:d=${min}`, "-f", "null", "-"], { encoding: "utf8" });
  const out = [], txt = r.stderr || "";
  for(const m of txt.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) out.push({ debut: +m[1], fin: +m[2] });
  return out;
}
