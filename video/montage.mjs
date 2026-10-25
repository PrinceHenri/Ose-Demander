// Montage des vidéos de présentation (ffmpeg + calques rendus par Edge).
// Usage (depuis video/) : node montage.mjs [longue|courte|courte-sans-voix|toutes] [--apercu]
//   --apercu : demi-résolution, encodage rapide, dans rendus/apercu/ (pour validation avant le rendu final)
// Entrées (sources-media/, hors Git) : captures, enregistrements, audio/voix-*.mp3, audio/sfx-*.mp3 (facultatifs).
// Sorties : rendus/*.mp4 et, pour la version longue, sous-titres/ose-demander-16x9.srt (versionné).
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ff, duree, silences, MEDIA, RENDUS, RACINE } from "./outils.mjs";
import { rendreCalques } from "./compositions.mjs";

const args = process.argv.slice(2);
const APERCU = args.includes("--apercu");
const QUOI = args.find(a => !a.startsWith("--")) || "toutes";
const FPS = 30;
const VOIX = { longue: "audio/voix-longue.mp3", courte: "audio/voix-courte.mp3" };
const SFX = { enveloppe: "audio/sfx-enveloppe.mp3", non: "audio/sfx-non.mp3", oui: "audio/sfx-oui.mp3", pop: "audio/sfx-pop.mp3" };
const TMP = join(MEDIA, "tmp"); mkdirSync(TMP, { recursive: true });
const SORTIE = APERCU ? join(RENDUS, "apercu") : RENDUS; mkdirSync(SORTIE, { recursive: true });

/* ---------------- Textes (script.md, validé le 2026-10-25) ----------------
   Chaque scène : morceaux de sous-titres { dit (texte prononcé, sert au calage), ecrit (à l'écran, si différent) } */
const LONGUE = {
  format: "16x9", voix: VOIX.longue, fin: 3.6,
  scenes: [
    { morceaux: ["Un rendez-vous, une soirée, une grande nouvelle…", "Oser demander, ça intimide."], apres: 0.8,
      plans: [{ img: "amour-01-accueil" }] },
    { morceaux: ["Et si ta demande arrivait comme une surprise ?", "Une enveloppe animée, qu'on a envie d'ouvrir."], apres: 0.9,
      plans: [{ img: "amour-11-enveloppe", d: 1.5 }, { clip: "amour-ouverture-enveloppe", d: 3.0 }, { img: "amour-12-introduction" }],
      sfx: [{ son: "enveloppe", t: 1.5 + 0.75 }] },
    { morceaux: ["Puis vient la question.", "Le Oui attend sagement…", "et le Non, lui, préfère s'échapper."], apres: 1.8,
      plans: [{ img: "amour-13-question", d: 1.6 }, { clip: "amour-non-qui-fuit", depuis: 0.9 }],
      sfx: [{ son: "non", t: 1.6 + 0.6 }, { son: "non", t: 1.6 + 1.8 }, { son: "non", t: 1.6 + 3.0 }] },
    { morceaux: ["Pas de piège : un vrai non reste toujours possible,", "avec une réponse douce, déjà écrite."], apres: 0.6,
      plans: [{ img: "amour-15-vrai-refus-propose", d: 2.6 }, { img: "amour-16-vrai-refus" }] },
    { morceaux: ["Et quand c'est oui, place à la fête !", "Il ne reste qu'à envoyer sa réponse, et à noter la date."], apres: 1.2,
      plans: [{ clip: "amour-apres-le-oui", depuis: 0.4 }, { img: "amour-17-apres-le-oui" }],
      sfx: [{ son: "oui", t: 0.3 }] },
    { morceaux: ["Pour créer la tienne : choisis un modèle,", "écris vos prénoms et la date.", "Change les couleurs, et même le caractère du Non :", "taquin, drôle ou romantique."], apres: 0.8,
      plans: [{ img: "amour-02-choix-du-modele", d: 2.3 }, { img: "amour-03-prenoms", d: 1.9 }, { img: "amour-06-theme", d: 2.4 }, { img: "amour-07-ton-du-non" }] },
    { morceaux: ["Ton lien est prêt en quelques secondes.", "Envoie-le par message, comme d'habitude."], apres: 0.8,
      plans: [{ img: "amour-09-creer-mon-lien", d: 1.4 }, { img: "amour-10-lien-pret" }],
      sfx: [{ son: "pop", t: 1.4 }] },
    { morceaux: ["Gratuit, sans compte, et sans suivi :", "l'invitation tient dans son lien,", "et rien n'est stocké en clair en ligne."], apres: 0.9,
      plans: [{ img: "soiree-11-enveloppe", d: 2.4 }, { img: "soiree-13-question" }],
      pastilles: ["Gratuit", "Sans compte", "Sans suivi"] },
    { morceaux: ["Alors, ose demander.", { dit: "Rendez-vous sur osedemander point f r.", ecrit: "Rendez-vous sur osedemander.fr" }], apres: 0,
      plans: [{ calque: "fin-16x9" }] },
  ],
};
const COURTE = {
  format: "9x16", voix: VOIX.courte, fin: 3.0, sousTitres: true,
  scenes: [
    { morceaux: [{ dit: "Ce bouton Non ne se laisse pas attraper.", ecrit: "Ce bouton Non ne se laisse pas attraper" }], avant: 0.05, apres: 1.0,
      plans: [{ clip: "amour-non-qui-fuit", depuis: 1.05 }],
      sfx: [{ son: "non", t: 0.15 }, { son: "non", t: 1.05 }, { son: "non", t: 1.95 }] },
    { morceaux: [{ dit: "Envoie une invitation animée : un date, une soirée, ce que tu veux.", ecrit: "Une invitation animée, pour un date, une soirée…" }], apres: 0.3,
      plans: [{ clip: "soiree-ouverture-enveloppe", depuis: 0.55 }, { img: "soiree-12-introduction" }],
      sfx: [{ son: "enveloppe", t: 0.25 }] },
    { morceaux: [{ dit: "Un vrai non reste possible… mais le Oui, lui, fait la fête.", ecrit: "Un vrai non reste possible… mais le Oui fait la fête" }], apres: 0.4,
      plans: [{ img: "amour-15-vrai-refus-propose", d: 1.6 }, { clip: "soiree-apres-le-oui", depuis: 0.4 }],
      sfx: [{ son: "oui", t: 1.6 + 0.3 }] },
    { morceaux: [{ dit: "Gratuit, sans compte, sans suivi.", ecrit: "Gratuit, sans compte, sans suivi" }], apres: 0.3,
      plans: [{ img: "amour-02-choix-du-modele", d: 1.1 }, { img: "amour-10-lien-pret" }],
      sfx: [{ son: "pop", t: 1.1 }] },
    { morceaux: [{ dit: "Crée la tienne sur osedemander point f r.", ecrit: "osedemander.fr" }], apres: 0,
      plans: [{ calque: "fin-9x16" }], sansSousTitre: true },
  ],
};

const texteDit = m => typeof m === "string" ? m : m.dit;
const texteEcrit = m => typeof m === "string" ? m : (m.ecrit || m.dit);

/* ---------------- Calage des morceaux sur la voix (silences détectés, sans transcription) ----------------
   Chaque frontière est placée à la proportion de caractères prononcés, puis accrochée au silence le plus proche. */
function caler(fichier, morceaux){
  const D = duree(fichier), sil = silences(fichier).filter(s => s.fin - s.debut >= 0.2);
  const parle = []; let t = 0;
  for(const s of sil){ if(s.debut > t) parle.push([t, s.debut]); t = s.fin; }
  if(t < D) parle.push([t, D]);
  const debutVoix = parle[0][0], finVoix = parle.at(-1)[1];
  const total = parle.reduce((a, [x, y]) => a + y - x, 0);
  const versReel = p => { let reste = p * total; for(const [x, y] of parle){ if(reste <= y - x) return x + reste; reste -= y - x; } return finVoix; };
  const car = morceaux.map(m => texteDit(m).length), C = car.reduce((a, b) => a + b, 0);
  // Choix global (programmation dynamique) : écart à la cible, moins un bonus pour les pauses longues,
  // fort en fin de phrase (. ? ! … :), moyen après une virgule. Évite de couper une phrase à sa virgule.
  const n = morceaux.length - 1, m = sil.length;
  const cibles = [], poids = []; let cumul = 0;
  for(let k = 0; k < n; k++){
    cumul += car[k]; cibles.push(versReel(cumul / C));
    const fin = texteDit(morceaux[k]).trim().slice(-1);
    poids.push(/[.?!…:]/.test(fin) ? 2.2 : fin === "," ? 0.8 : 0.3);
  }
  const cout = (k, i) => Math.abs((sil[i].debut + sil[i].fin) / 2 - cibles[k]) - poids[k] * (sil[i].fin - sil[i].debut);
  // Durée attendue d'un morceau (débit moyen de la voix) : un morceau beaucoup trop court ou trop long est pénalisé
  const debit = (finVoix - debutVoix) / C, ecartDuree = (k, debut, fin) => 0.8 * Math.abs((fin - debut) - car[k] * debit);
  const meilleur = Array.from({ length: n }, () => new Array(m).fill(Infinity)), venu = Array.from({ length: n }, () => new Array(m).fill(-1));
  for(let i = 0; i < m; i++) meilleur[0][i] = cout(0, i) + ecartDuree(0, debutVoix, sil[i].debut);
  for(let k = 1; k < n; k++) for(let i = k; i < m; i++){
    let b = Infinity, j0 = -1;
    for(let j = k - 1; j < i; j++){ const c = meilleur[k - 1][j] + ecartDuree(k, sil[j].fin, sil[i].debut); if(c < b){ b = c; j0 = j; } }
    meilleur[k][i] = b + cout(k, i); venu[k][i] = j0;
  }
  const fini = meilleur[n - 1].map((c, i) => c + ecartDuree(n, sil[i].fin, finVoix));
  const choix = []; let i = fini.indexOf(Math.min(...fini));
  for(let k = n - 1; k >= 0; k--){ choix.unshift(i); i = venu[k][i]; }
  const bornes = choix.map(i => sil[i]);
  return morceaux.map((m, k) => ({ texte: texteEcrit(m), debut: k ? bornes[k - 1].fin : debutVoix, fin: k < bornes.length ? bornes[k].debut : finVoix }));
}

/* ---------------- Clips (images du protocole DevTools -> mp4 à cadence fixe) ---------------- */
function clip(format, nom){
  const dir = join(MEDIA, "enregistrements", format, nom), sortie = join(MEDIA, "clips", format, nom + ".mp4");
  if(existsSync(sortie)) return sortie;
  mkdirSync(join(MEDIA, "clips", format), { recursive: true });
  const images = JSON.parse(readFileSync(join(dir, "images.json"), "utf8"));
  const liste = images.map((im, i) => `file '${join(dir, im.f).replace(/\\/g, "/")}'\nduration ${Math.max(0.001, ((images[i + 1]?.t ?? im.t + 1 / FPS) - im.t)).toFixed(4)}`).join("\n") + `\nfile '${join(dir, images.at(-1).f).replace(/\\/g, "/")}'\n`;
  const lst = join(TMP, `${format}-${nom}.txt`); writeFileSync(lst, liste);
  ff(["-f", "concat", "-safe", "0", "-i", lst, "-vf", `fps=${FPS},scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`, "-c:v", "libx264", "-crf", "16", "-preset", "medium", sortie]);
  return sortie;
}

/* ---------------- Rendu d'une version ---------------- */
async function rendre(def, nomSortie, { avecVoix }){
  const [W, H] = def.format === "9x16" ? [1080, 1920] : [1920, 1080];
  const [w, h] = APERCU ? [W / 2, H / 2] : [W, H];
  const enc = APERCU ? ["-c:v", "libx264", "-preset", "veryfast", "-crf", "26"] : ["-c:v", "libx264", "-preset", "slow", "-crf", "17"];
  const fichierVoix = join(MEDIA, def.voix);
  if(!existsSync(fichierVoix)) throw new Error("Voix absente : " + fichierVoix);

  // 1. Calage de tous les morceaux, puis découpe en scènes
  const tous = def.scenes.flatMap(s => s.morceaux);
  const cales = caler(fichierVoix, tous);
  let k = 0, T = 0;
  const scenes = def.scenes.map((s, i) => {
    const m = cales.slice(k, k += s.morceaux.length);
    const avant = s.avant ?? 0.3, voixDebut = m[0].debut, voixFin = m.at(-1).fin;
    const longueur = avant + (voixFin - voixDebut) + (i === def.scenes.length - 1 ? def.fin : s.apres);
    const sc = { ...s, debut: T, longueur, voixDebut, voixFin, decalage: T + avant - voixDebut, morceauxCales: m };
    T += longueur; return sc;
  });
  const TOTAL = T;

  // 2. Calques (carte de fin, sous-titres, pastilles)
  const calques = [];
  for(const s of scenes){
    for(const p of s.plans) if(p.calque) calques.push({ nom: p.calque, type: "fin", format: def.format });
    if(def.sousTitres && !s.sansSousTitre) s.morceauxCales.forEach((m, j) => calques.push({ nom: `st-${nomSortie}-${scenes.indexOf(s)}-${j}`, type: "sous-titre", format: def.format, texte: m.texte }));
    if(s.pastilles) s.pastilles.forEach((_, n) => calques.push({ nom: `pastilles-${n + 1}`, type: "pastilles", format: def.format, mots: s.pastilles, n: n + 1 }));
  }
  const png = await rendreCalques(calques);

  // 3. Plans -> morceaux vidéo, puis assemblage
  const morceauxVideo = [];
  scenes.forEach((s, i) => {
    const fixes = s.plans.reduce((a, p) => a + (p.d || 0), 0), libres = s.plans.filter(p => !p.d).length;
    s.plans.forEach((p, j) => {
      const d = p.d || Math.max(0.8, (s.longueur - fixes) / Math.max(1, libres));
      const f = join(TMP, `${nomSortie}-${i}-${j}.mp4`), cadre = Math.round(d * FPS);
      if(p.clip){
        const src = clip(def.format, p.clip);
        ff(["-ss", String(p.depuis || 0), "-i", src, "-vf", `tpad=stop_mode=clone:stop_duration=${d.toFixed(3)},fps=${FPS},scale=${w}:${h},setsar=1,format=yuv420p`, "-frames:v", String(cadre), "-an", ...enc, f]);
      } else {
        const img = p.calque ? png[p.calque] : join(MEDIA, "captures", def.format, p.img + ".png");
        // Léger zoom (4 %) sur les images fixes, comme une caméra qui s'approche ; aucun pour la carte de fin
        const z = p.calque ? "1" : `1+0.04*on/${cadre}`;
        ff(["-loop", "1", "-i", img, "-vf", `scale=${w * 2}:${h * 2},zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=${FPS},setsar=1,format=yuv420p`, "-frames:v", String(cadre), "-an", ...enc, f]);
      }
      morceauxVideo.push(f);
    });
  });
  const lst = join(TMP, `${nomSortie}-plans.txt`);
  writeFileSync(lst, morceauxVideo.map(f => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
  const base = join(TMP, `${nomSortie}-base.mp4`);
  ff(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", base]);
  const reel = duree(base);

  // 4. Calques par-dessus (apparition et disparition en 0,2 s)
  const sur = [];
  scenes.forEach((s, i) => {
    if(def.sousTitres && !s.sansSousTitre) s.morceauxCales.forEach((m, j) => {
      const a = s.debut + (j ? m.debut + s.decalage - s.debut : 0.1), b = j < s.morceauxCales.length - 1 ? s.morceauxCales[j + 1].debut + s.decalage : s.debut + s.longueur - 0.05;
      sur.push({ png: png[`st-${nomSortie}-${i}-${j}`], a, b });
    });
    if(s.pastilles){
      // Une pastille de plus à chaque mot : « Gratuit », « sans compte », « sans suivi » (début du morceau, puis par tiers)
      const m = s.morceauxCales[0], a0 = m.debut + s.decalage, pas = (m.fin - m.debut) / 3;
      s.pastilles.forEach((_, n) => sur.push({ png: png[`pastilles-${n + 1}`], a: a0 + n * pas, b: n < s.pastilles.length - 1 ? a0 + (n + 1) * pas : s.debut + s.longueur - 0.1 }));
    }
  });
  const video = join(TMP, `${nomSortie}-video.mp4`);
  if(sur.length){
    const entrees = sur.flatMap(o => ["-loop", "1", "-t", reel.toFixed(3), "-i", o.png]);
    let g = "", prec = "0:v";
    sur.forEach((o, n) => {
      g += `[${n + 1}:v]scale=${w}:${h},format=rgba,fade=in:st=${o.a.toFixed(3)}:d=0.2:alpha=1,fade=out:st=${(o.b - 0.2).toFixed(3)}:d=0.2:alpha=1[c${n}];`;
      g += `[${prec}][c${n}]overlay=0:0:enable='between(t,${o.a.toFixed(3)},${o.b.toFixed(3)})'${n === sur.length - 1 ? ",format=yuv420p[v]" : `[v${n}]`};`;
      prec = `v${n}`;
    });
    ff(["-i", base, ...entrees, "-filter_complex", g.replace(/;$/, ""), "-map", "[v]", "-t", reel.toFixed(3), ...enc, video]);
  } else ff(["-i", base, "-c", "copy", video]);

  // 5. Son : voix posée scène par scène, effets sonores (s'ils existent), aucune musique
  const pistes = [], filtres = [];
  if(avecVoix) scenes.forEach(s => pistes.push({ f: fichierVoix, debut: s.voixDebut, fin: s.voixFin, a: s.debut + (s.avant ?? 0.3), vol: 1 }));
  scenes.forEach(s => (s.sfx || []).forEach(x => { const f = join(MEDIA, SFX[x.son]); if(existsSync(f)) pistes.push({ f, a: s.debut + x.t, vol: avecVoix ? 0.35 : 0.6 }); }));
  const sortie = join(SORTIE, nomSortie + ".mp4");
  if(pistes.length){
    const ent = pistes.flatMap(p => ["-i", p.f]);
    pistes.forEach((p, n) => filtres.push(`[${n + 1}:a]${p.fin ? `atrim=${p.debut.toFixed(3)}:${p.fin.toFixed(3)},asetpts=PTS-STARTPTS,` : ""}volume=${p.vol},adelay=${Math.round(p.a * 1000)}:all=1[a${n}]`));
    filtres.push(`${pistes.map((_, n) => `[a${n}]`).join("")}amix=inputs=${pistes.length}:normalize=0,apad,atrim=0:${reel.toFixed(3)}[son]`);
    ff(["-i", video, ...ent, "-filter_complex", filtres.join(";"), "-map", "0:v", "-map", "[son]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", sortie]);
  } else {
    ff(["-i", video, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", sortie]);
  }

  // 6. Sous-titres SRT (temps du montage)
  const srt = scenes.flatMap(s => s.morceauxCales.map(m => ({ a: m.debut + s.decalage, b: m.fin + s.decalage, t: m.texte })));
  const hms = x => { const ms = Math.round(x * 1000); const p = (n, l = 2) => String(n).padStart(l, "0"); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
  const texteSrt = srt.map((x, n) => `${n + 1}\n${hms(x.a)} --> ${hms(x.b)}\n${x.t}\n`).join("\n");
  return { sortie, total: reel, prevu: TOTAL, srt: texteSrt, scenes: scenes.map(s => [s.debut.toFixed(2), s.longueur.toFixed(2)]) };
}

export { caler, LONGUE, COURTE };
const VERSIONS = {
  longue: () => rendre(LONGUE, "ose-demander-16x9", { avecVoix: true }),
  courte: () => rendre(COURTE, "ose-demander-9x16-voix", { avecVoix: true }),
  "courte-sans-voix": () => rendre(COURTE, "ose-demander-9x16-sans-voix", { avecVoix: false }),
};
if(process.argv[1]?.endsWith("montage.mjs")) for(const v of QUOI === "toutes" ? Object.keys(VERSIONS) : [QUOI]){
  if(!VERSIONS[v]) throw new Error("Version inconnue : " + v);
  const r = await VERSIONS[v]();
  console.log(`${v} : ${r.sortie} (${r.total.toFixed(2)} s)`);
  console.log("  scènes [début, durée] :", r.scenes.map(x => x.join("+")).join("  "));
  if(v === "longue"){ mkdirSync(join(RACINE, "sous-titres"), { recursive: true }); writeFileSync(join(RACINE, "sous-titres", "ose-demander-16x9.srt"), r.srt); }
  if(v === "courte") { mkdirSync(join(RACINE, "sous-titres"), { recursive: true }); writeFileSync(join(RACINE, "sous-titres", "ose-demander-9x16.srt"), r.srt); }
}
for(const f of readdirSync(TMP)) if(/^ose-demander/.test(f)) rmSync(join(TMP, f), { force: true });
