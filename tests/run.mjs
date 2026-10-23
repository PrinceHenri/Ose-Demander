/* Banc de test d'Ose Demander — une seule commande, depuis la racine du dépôt :
     node tests/run.mjs
   Options : --graine=N (rejoue un tirage aléatoire précis), --nombre=N (invitations aléatoires, 400 par défaut).
   À faire passer avant chaque commit. Aucune dépendance : Node 18 ou plus récent. */
import assert from "node:assert/strict";
import { deflateRawSync, inflateRawSync, gzipSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { charger } from "./charger.mjs";
import { REFERENCES } from "./references.mjs";
import * as FIGE from "./tables-figees.mjs";
import { chargerPage, principales } from "./page.mjs";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const arg = (nom, def) => { const a = process.argv.find(x => x.startsWith(`--${nom}=`)); return a ? Number(a.split("=")[1]) : def; };
const GRAINE = arg("graine", Date.now() % 1e9), NOMBRE = arg("nombre", 400);

// Trois navigateurs simulés : récent, sans CompressionStream, sans DecompressionStream (décompression de secours)
const L = charger(), Lplat = charger({ compression: false }), Lsecours = charger({ decompression: false });
const DECODEURS = [["navigateur récent", L], ["décompression de secours", Lsecours]];

/* ---------- Mini-lanceur ---------- */
let ok = 0, ko = 0, section = "";
const echecs = [];
function titre(t){ section = t; console.log(`\n${t}`); }
async function test(nom, fn){
  try{ await fn(); ok++; }
  catch(e){ ko++; echecs.push(`${section} › ${nom}`); console.log(`  ✗ ${nom}\n    ${String(e?.message ?? e).split("\n").slice(0, 14).join("\n    ")}`); }
}
const pareil = (obtenu, attendu, quoi = "résultat") => {
  if(JSON.stringify(obtenu) !== JSON.stringify(attendu)){
    assert.deepStrictEqual(obtenu, attendu, `${quoi} différent`); // affiche le détail
    assert.fail(`${quoi} : mêmes valeurs mais ordre des champs différent`);
  }
};
const utf8 = s => new TextEncoder().encode(s);
const plat = (prefixe, obj) => prefixe + L.b64url(utf8(typeof obj === "string" ? obj : JSON.stringify(obj)));
const zip = (prefixe, obj) => prefixe + L.b64url(new Uint8Array(deflateRawSync(utf8(typeof obj === "string" ? obj : JSON.stringify(obj)))));

/* =========================================================
   1. Liens de référence figés : ils doivent toujours se relire à l'identique
   ========================================================= */
titre(`1. Liens de référence (${REFERENCES.length})`);
for(const r of REFERENCES){
  await test(r.nom, async () => {
    assert.match(r.lien, /^[zpyx]/);
    for(const [qui, X] of DECODEURS) pareil(await X.decodeData(r.lien), r.attendu, `Relecture (${qui})`);
    for(const [chemin, texte] of Object.entries(r.reveles || {})){
      const [champ, i] = chemin.split(".");
      const it = i === undefined ? r.attendu[champ] : r.attendu[champ][+i];
      assert.equal(L.unscramble(it.e), texte, `texte révélé de ${chemin}`);
    }
    // Recréer le lien à partir de l'invitation relue redonne la même invitation
    pareil(await L.decodeData(await L.encodeData(r.attendu)), r.attendu, "Ré-encodage");
  });
}
await test("Les quatre formats (z, p, y, x) et les cinq tons du Non sont couverts", () => {
  assert.deepEqual([...new Set(REFERENCES.map(r => r.lien[0]))].sort(), ["p", "x", "y", "z"]);
  const tons = new Set(REFERENCES.map(r => r.attendu.tn || "taquin"));
  for(const t of FIGE.NO_TONES.map(t => t.id)) assert.ok(tons.has(t), `ton ${t} absent des références`);
  for(const k of ["p", "sl", "l", "rv", "ix"]) assert.ok(REFERENCES.some(r => r.attendu[k]), `aucune référence avec « ${k} »`);
  for(const f of ["p", "y"]) assert.ok(REFERENCES.some(r => r.attendu.ix && r.lien[0] === f), `aucune introduction au format ${f}`);
  for(const f of ["p", "y", "z"]) assert.ok(REFERENCES.some(r => r.attendu.rv && r.lien[0] === f), `aucun lien de rappel au format ${f}`);
});

/* =========================================================
   2. Invitations aléatoires : encodage puis décodage = invitation validée d'origine
   ========================================================= */
titre(`2. Invitations aléatoires (${NOMBRE}, graine ${GRAINE})`);
function aleatoire(graine){ let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = aleatoire(GRAINE);
const ent = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pile = p => rnd() < p;
const un = arr => arr[ent(0, arr.length - 1)];
const MORCEAUX = [..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", ..."éèêàçùôîïÉÇ", " ", " ", " ", ..."'?!.,-:()&<>\"/", "💛", "🎉", "œ", "€"];
function texte(max, vide = 0.2){
  if(pile(vide)) return "";
  const n = ent(1, max); let s = un([..."ABCDEFGHIJKLMNOPQRSTUVWXYZÉÇ"]);
  while(s.length < n){ const m = un(MORCEAUX); if(s.length + m.length > n) break; s += m; }
  return s;
}
const PHRASES = Object.values(FIGE.LINK_PHRASES);
const deux = n => String(n).padStart(2, "0");
const heure = () => `${deux(ent(0, 23))}:${deux(un([0, 0, 15, 30, 45, ent(0, 59)]))}`;
const jour = (de = 2026, a = 2030) => `${ent(de, a)}-${deux(ent(1, 12))}-${deux(ent(1, 28))}`;
const moment = () => `${jour()}T${heure()}`;
function element(max){
  const v = un(["v", "s", "r"]);
  if(v === "v"){ const x = texte(max); return x ? { v, x } : undefined; }
  if(v === "s") return { v, h: texte(100, 0.5) || undefined };
  return { v, h: texte(100, 0.5) || undefined, at: moment(), e: L.scramble(texte(max, 0)) };
}
function invitation(){
  const o = un(Object.keys(L.OCC));
  const d = { f: texte(30, 0), t: texte(30, 0), o, th: un(L.THEMES).id, q: pile(.5) ? un(PHRASES.slice(0, 17)) : texte(80, 0),
    n: un(L.NO_MODES).id, c: un(L.CHANNELS).id };
  if(o === "libre") d.of = texte(40);
  if(pile(.7)) d.tn = un(L.NO_TONES).id;
  if(pile(.3)) d.an = un(["n", "d", "0"]);
  if(pile(.3)) d.ac = un(L.ACCENTS).id;
  if(pile(.4)) d.em = un(L.EMOJIS);
  if(pile(.3)) d.sg = texte(30, 0);
  if(pile(.2)) d.so = 0;
  if(d.c === "wa" || d.c === "sms") d.ci = un(["06 00 00 00 ", "+33 6 00 00 00 ", "06.00.00.00."]) + deux(ent(0, 99));
  else if(d.c !== "any") d.ci = un(["", "@"]) + "exemple." + ent(1, 999);
  if(pile(.6)){ d.m = pile(.5) ? un(PHRASES.slice(17)) : texte(300, 0); if(pile(.3)) d.mh = 1; }
  if(pile(.35)){
    d.p = Array.from({ length: ent(1, 6) }, () => {
      const v = un(["v", "s", "r"]), h = heure();
      if(v === "s") return { h, v, i: texte(100, .5) || undefined };
      if(v === "r") return { h, v, i: texte(100, .5) || undefined, at: moment(), e: L.scramble(JSON.stringify({ a: texte(80, 0), l: texte(120) })) };
      return { h, v, a: texte(80, .1), l: texte(120, .4) || undefined };
    });
    if(pile(.5)) d.en = heure(); if(pile(.5)) d.me = texte(100, 0); if(pile(.5)) d.br = texte(100, 0);
  } else {
    d.a = element(120); const l = element(120); if(l) d.l = l; if(pile(.4)) d.dt = texte(200, 0);
  }
  if(pile(.3)) d.sl = Array.from({ length: ent(2, 3) }, () => [jour(), heure()]);
  else { d.d = pile(.05) ? jour(2025, 2025) : jour(); d.h = heure(); } // 2025 : hors plage du format compact
  if(pile(.1)) d.rv = 1; // ouverture depuis le rappel d'agenda
  if(pile(.4)) d.ix = +un(Object.keys(FIGE.LINK_INTRO)); // introduction scénarisée
  return JSON.parse(JSON.stringify(d)); // comme le navigateur : les champs « undefined » disparaissent
}
let compact = 0, ancien = 0, tropLong = 0;
for(let k = 0; k < NOMBRE; k++){
  const d = invitation(), attendu = L.sanitize(d);
  await test(`Invitation n° ${k + 1}`, async () => {
    pareil(L.sanitize(JSON.parse(JSON.stringify(attendu))), attendu, "Validation répétée (sanitize doit être stable)");
    const avant2026 = (attendu.d || "").startsWith("2025");
    for(const [qui, E] of [["compressé", L], ["non compressé", Lplat]]){
      const lien = await E.encodeData(d);
      if(lien.length > L.MAX_LINK){ tropLong++; assert.fail(`lien ${qui} de ${lien.length} caractères (> ${L.MAX_LINK}) : il ne s'ouvrirait pas\n${JSON.stringify(d)}`); }
      const attenduPrefixe = avant2026 ? (qui === "compressé" ? /^[zp]/ : /^p/) : (qui === "compressé" ? /^[yx]/ : /^x/);
      assert.match(lien, attenduPrefixe, `préfixe inattendu (${qui})`);
      lien[0] === "y" || lien[0] === "x" ? compact++ : ancien++;
      for(const [qui2, X] of DECODEURS) pareil(await X.decodeData(lien), attendu, `Relecture ${qui} (${qui2})`);
    }
  });
}
console.log(`  ${compact} liens au format compact, ${ancien} à l'ancien format`);

await test("Décompression de secours = décompression du navigateur (blocs stockés, codes fixes et dynamiques)", async () => {
  for(let k = 0; k < 120; k++){
    let s = ""; const n = ent(0, 19000);
    while(s.length < n) s += pile(.5) ? texte(40, 0) : s.slice(ent(0, Math.max(0, s.length - 1)), ent(0, s.length)); // répétitions lointaines
    const brut = utf8(s.slice(0, n)).slice(0, L.MAX_DATA);
    for(const level of [0, 1, 6, 9]){
      const z = new Uint8Array(deflateRawSync(brut, { level }));
      assert.deepEqual(Lsecours.inflate(z, L.MAX_DATA), brut, `niveau ${level}, ${brut.length} octets`);
    }
  }
});

/* =========================================================
   3. Liens trafiqués : refusés (« Ce lien est incomplet »), jamais de plantage
   ========================================================= */
titre("3. Liens trafiqués");
const BASE = { f: "Alex", t: "Sam", q: 1, a: [], w: 440000 }; // compact minimal valide
const BASE_ANCIEN = { f: "Alex", t: "Sam", o: "date", th: "amour", q: "Ça te dit un rendez-vous avec moi ?", n: "fuit", c: "any", a: { v: "s" }, d: "2026-11-14", h: "20:00" };
await test("Les liens de base (avant trafic) sont acceptés", async () => {
  for(const [, X] of DECODEURS){ await X.decodeData(plat("x", BASE)); await X.decodeData(plat("p", BASE_ANCIEN)); await X.decodeData(zip("y", BASE)); }
});
const sans = (o, ...k) => { const c = { ...o }; k.forEach(x => delete c[x]); return c; };
const P = { h: "10:00", v: "s" };
const TRAFIQUES = [
  // Forme du lien
  ["Lien vide", ""],
  ["Préfixe inconnu", plat("q", BASE)],
  ["Préfixe seul", "y"],
  ["Caractères interdits", "y" + "abc$%^"],
  ["Lien trop long", "x" + "A".repeat(8001)],
  ["Base64 valide mais octets au hasard (y)", "y" + L.b64url(Uint8Array.from({ length: 64 }, (_, i) => (i * 97 + 13) & 255))],
  ["Base64 valide mais octets au hasard (z)", "z" + L.b64url(Uint8Array.from({ length: 64 }, (_, i) => (i * 31 + 7) & 255))],
  ["Pas du JSON (x)", plat("x", "bonjour")],
  ["JSON tableau", plat("x", "[1,2]")],
  ["JSON null", plat("p", "null")],
  ["JSON nombre", plat("p", "42")],
  ["Bombe de décompression (y)", zip("y", { ...BASE, s: "a".repeat(30000) })],
  ["Bombe de décompression (z)", zip("z", { ...BASE_ANCIEN, m: "a".repeat(30000) })],
  // Format compact : strict
  ["Clé inconnue", plat("x", { ...BASE, zz: 1 })],
  ["Clé __proto__", plat("x", "{\"__proto__\":{\"f\":\"x\"}," + JSON.stringify(BASE).slice(1))],
  ["Prénom qui n'est pas un texte", plat("x", { ...BASE, f: 5 })],
  ["Prénom vide", plat("x", { ...BASE, f: "  " })],
  ["Destinataire manquant", plat("x", sans(BASE, "t"))],
  ["Code de question inconnu", plat("x", { ...BASE, q: 999 })],
  ["Code de question non entier", plat("x", { ...BASE, q: 1.5 })],
  ["Code d'occasion inconnu", plat("x", { ...BASE, o: 99 })],
  ["Occasion en texte au lieu d'un code", plat("x", { ...BASE, o: "date" })],
  ["Code de thème inconnu", plat("x", { ...BASE, T: 99 })],
  ["Code de Non inconnu", plat("x", { ...BASE, n: 0 })],
  ["Code de ton inconnu", plat("x", { ...BASE, N: 9 })],
  ["Ton en texte au lieu d'un code", plat("x", { ...BASE, N: "drole" })],
  ["Code d'accent inconnu", plat("x", { ...BASE, C: 42 })],
  ["Code d'emoji inconnu", plat("x", { ...BASE, E: 99 })],
  ["Occasion libre (F) sans l'occasion « libre »", plat("x", { ...BASE, F: "Fête" })],
  ["Message caché (H) sans message", plat("x", { ...BASE, H: 1 })],
  ["H différent de 1", plat("x", { ...BASE, m: "Salut", H: 2 })],
  ["Son (S) différent de 0", plat("x", { ...BASE, S: 1 })],
  ["Canal sans identifiant", plat("x", { ...BASE, c: 2 })],
  ["Identifiant sans canal", plat("x", { ...BASE, i: "06 00 00 00 00" })],
  ["Élément « a » manquant (sans programme)", plat("x", sans(BASE, "a"))],
  ["Élément à 2 cases", plat("x", { ...BASE, a: ["x", "y"] })],
  ["Élément à 4 cases", plat("x", { ...BASE, a: ["x", 1, "y", "z"] })],
  ["Élément révélé avec date négative", plat("x", { ...BASE, l: ["x", -5, "abc"] })],
  ["Programme et élément « a » ensemble", plat("x", { ...BASE, p: [["10:00", 1]] })],
  ["Programme vide", plat("x", { ...sans(BASE, "a"), p: [] })],
  ["Programme de 7 étapes", plat("x", { ...sans(BASE, "a"), p: Array(7).fill(["10:00", 1]) })],
  ["Étape de type inconnu", plat("x", { ...sans(BASE, "a"), p: [["10:00", 7]] })],
  ["Étape révélée incomplète", plat("x", { ...sans(BASE, "a"), p: [["10:00", 2, "i", 5]] })],
  ["Étape surprise trop longue", plat("x", { ...sans(BASE, "a"), p: [["10:00", 1, "i", "x"]] })],
  ["Heure de fin hors journée", plat("x", { ...sans(BASE, "a"), p: [["10:00", 1]], e: 1440 })],
  ["Heure de fin sans programme", plat("x", { ...BASE, e: 60 })],
  ["Date (w) manquante", plat("x", sans(BASE, "w"))],
  ["Date négative", plat("x", { ...BASE, w: -1 })],
  ["Date non entière", plat("x", { ...BASE, w: 1.5 })],
  ["Date au-delà de la limite", plat("x", { ...BASE, w: L.LINK_TMAX + 1 })],
  ["Date en texte", plat("x", { ...BASE, w: "2026-11-14" })],
  ["Créneaux et date ensemble", plat("x", { ...BASE, L: [1, 2] })],
  ["Un seul créneau", plat("x", { ...sans(BASE, "w"), L: [1] })],
  ["Quatre créneaux", plat("x", { ...sans(BASE, "w"), L: [1, 2, 3, 4] })],
  ["Compact trafiqué puis compressé (y)", zip("y", { ...BASE, o: 99 })],
  // Indicateur « ouverture pour la révélation » : seule la valeur 1 est acceptée
  ["Rappel : R = 2", plat("x", { ...BASE, R: 2 })],
  ["Rappel : R = 0", plat("x", { ...BASE, R: 0 })],
  ["Rappel : R en texte", plat("x", { ...BASE, R: "1" })],
  ["Rappel : R = true", plat("x", { ...BASE, R: true })],
  ["Rappel : R = null", plat("x", { ...BASE, R: null })],
  ["Rappel : R = [1]", plat("x", { ...BASE, R: [1] })],
  ["Rappel : rv (nom de l'ancien format) dans un lien compact", plat("x", { ...BASE, rv: 1 })],
  ["Rappel : R = 2, compressé (y)", zip("y", { ...BASE, R: 2 })],
  // Introduction : seulement un code connu de LINK_INTRO
  ["Code d'introduction inconnu", plat("x", { ...BASE, I: 999 })],
  ["Code d'introduction 0", plat("x", { ...BASE, I: 0 })],
  ["Code d'introduction non entier", plat("x", { ...BASE, I: 1.5 })],
  ["Introduction en texte au lieu d'un code", plat("x", { ...BASE, I: "1" })],
  ["Introduction : textes écrits dans le lien", plat("x", { ...BASE, I: ["Salut…", "C'est moi."] })],
  ["Introduction : ix (nom de l'ancien format) dans un lien compact", plat("x", { ...BASE, ix: 1 })],
  ["Code d'introduction inconnu, compressé (y)", zip("y", { ...BASE, I: 999 })],
  // Ancien format : champs indispensables
  ["Ancien : prénom manquant", plat("p", sans(BASE_ANCIEN, "f"))],
  ["Ancien : question manquante", plat("p", sans(BASE_ANCIEN, "q"))],
  ["Ancien : question qui n'est pas un texte", plat("p", { ...BASE_ANCIEN, q: 1 })],
  ["Ancien : date au mauvais format", plat("p", { ...BASE_ANCIEN, d: "14/11/2026" })],
  ["Ancien : heure au mauvais format", plat("p", { ...BASE_ANCIEN, h: "20h" })],
  ["Ancien : date manquante", plat("p", sans(BASE_ANCIEN, "d"))],
  ["Ancien : programme vide", plat("p", { ...sans(BASE_ANCIEN, "a"), p: [] })],
  ["Ancien : programme sans étape valable", plat("p", { ...sans(BASE_ANCIEN, "a"), p: [null, 3, "x"] })],
  ["Ancien : un seul créneau et pas de date", plat("p", { ...sans(BASE_ANCIEN, "d", "h"), sl: [["2026-11-14", "20:00"]] })],
  ["Ancien : tableau au lieu d'un objet", plat("p", [BASE_ANCIEN])],
  ["Ancien trafiqué puis compressé (z)", zip("z", sans(BASE_ANCIEN, "t"))]
];
// Liens de référence coupés (copie incomplète)
for(const r of REFERENCES.slice(0, 6)) for(const fin of [Math.floor(r.lien.length / 2), r.lien.length - 3])
  TRAFIQUES.push([`Coupé à ${fin}/${r.lien.length} : ${r.nom.slice(0, 40)}…`, r.lien.slice(0, fin)]);
for(const [nom, lien] of TRAFIQUES){
  await test(nom, async () => {
    for(const [qui, X] of DECODEURS){
      let lu; try{ lu = await X.decodeData(lien); }catch(e){ continue; }
      assert.fail(`accepté (${qui}) alors qu'il devait être refusé : ${JSON.stringify(lu).slice(0, 200)}`);
    }
  });
}
console.log(`  ${TRAFIQUES.length} liens trafiqués essayés`);

/* Ancien format : les valeurs inconnues ou invalides sont nettoyées (champ ignoré ou valeur par défaut) */
titre("3 bis. Ancien format : valeurs nettoyées");
const NETTOYES = [
  ["Champs inconnus ignorés", { ...BASE_ANCIEN, zz: 1, script: "<script>" }, BASE_ANCIEN],
  ["Prénom tronqué à 30 caractères, espaces retirés", { ...BASE_ANCIEN, f: "  " + "A".repeat(50) }, { ...BASE_ANCIEN, f: "A".repeat(28) }],
  ["Numéro invalide : canal remis à « Peu importe »", { ...BASE_ANCIEN, c: "wa", ci: "pas un numéro" }, BASE_ANCIEN],
  ["Listes fermées : valeurs inconnues ignorées ou par défaut",
    { ...BASE_ANCIEN, o: "inconnue", th: "rouge", n: "explose", tn: "méchant", an: "x", ac: "rouge", em: "🐍", c: "telegram" },
    { ...BASE_ANCIEN, o: "juste", th: "base" }],
  ["Ton « taquin » jamais conservé (valeur par défaut)", { ...BASE_ANCIEN, tn: "taquin" }, BASE_ANCIEN],
  ["Révélation sans date valable : devient une surprise", { ...BASE_ANCIEN, l: { v: "r", h: "Indice", at: "demain", e: "abc" } }, { ...BASE_ANCIEN, l: { v: "s", h: "Indice" } }],
  ["Révélation au texte brouillé invalide : devient une surprise", { ...BASE_ANCIEN, l: { v: "r", at: "2026-11-14T10:00", e: "a b" } }, { ...BASE_ANCIEN, l: { v: "s", h: "" } }],
  ["Un seul créneau valable : la date simple est gardée", { ...BASE_ANCIEN, sl: [["2026-11-14", "20:00"], ["mauvais", "20:00"]] }, BASE_ANCIEN],
  ["Indicateur de rappel invalide (rv ≠ 1) : lien normal", { ...BASE_ANCIEN, rv: 2 }, BASE_ANCIEN],
  ["Indicateur de rappel en texte : lien normal", { ...BASE_ANCIEN, rv: "1" }, BASE_ANCIEN],
  ["Indicateur de rappel à true : lien normal", { ...BASE_ANCIEN, rv: true }, BASE_ANCIEN],
  ["Indicateur au nom du format compact (R) dans l'ancien format : ignoré", { ...BASE_ANCIEN, R: 1 }, BASE_ANCIEN],
  ["Code d'introduction inconnu : directement la question", { ...BASE_ANCIEN, ix: 999 }, BASE_ANCIEN],
  ["Introduction en texte : ignorée", { ...BASE_ANCIEN, ix: "1" }, BASE_ANCIEN],
  ["Introduction écrite en toutes lettres : ignorée", { ...BASE_ANCIEN, ix: ["Salut…", "C'est moi."] }, BASE_ANCIEN],
  ["Introduction au nom du format compact (I) dans l'ancien format : ignorée", { ...BASE_ANCIEN, I: 1 }, BASE_ANCIEN]
];
const normal = d => { const x = { f: d.f, t: d.t, q: d.q, o: d.o, th: d.th, n: d.n, an: "n", c: "any", a: d.a.h !== undefined ? d.a : { v: "s", h: "" } }; if(d.l) x.l = d.l; x.d = d.d; x.h = d.h; return x; };
for(const [nom, entree, sortie] of NETTOYES){
  await test(nom, async () => {
    for(const [qui, X] of DECODEURS) pareil(await X.decodeData(plat("p", entree)), normal(sortie), `Relecture (${qui})`);
  });
}

/* =========================================================
   4. Tables de codes : aucun code existant ne change de texte
   ========================================================= */
titre("4. Tables de codes");
await test("Le script complet de la page se lit sans erreur (syntaxe, noms déclarés deux fois)", () => {
  const html = readFileSync(RACINE + "index.html", "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.ok(scripts.length >= 1, "aucun script dans index.html");
  for(const s of scripts) new Function(s); // lève une erreur si le script ne peut pas être lu par le navigateur
});
const TABLES = [
  ["LINK_PHRASES", "questions et messages"], ["LINK_OCC", "occasions"], ["LINK_TH", "thèmes"], ["LINK_NO", "comportements du Non"],
  ["LINK_TONE", "tons du Non"], ["LINK_CH", "canaux"], ["LINK_AN", "animations"], ["LINK_AC", "accents"], ["LINK_EM", "emojis"]
];
for(const [nom, quoi] of TABLES){
  await test(`${nom} (${quoi}) : codes existants inchangés, pas de doublon`, () => {
    const fige = FIGE[nom], actuel = L[nom];
    for(const [code, val] of Object.entries(fige))
      assert.equal(actuel[code], val, `le code ${code} de ${nom} a changé ou disparu (attendu ${JSON.stringify(val)})`);
    for(const code of Object.keys(actuel)) assert.match(code, /^[1-9]\d*$/, `code ${code} invalide`);
    const vals = Object.values(actuel);
    assert.equal(new Set(vals).size, vals.length, `valeur en double dans ${nom}`);
  });
}
await test("LINK_INTRO (introductions) : les deux cartes de chaque code inchangées, pas de doublon", () => {
  for(const [code, cartes] of Object.entries(FIGE.LINK_INTRO))
    assert.deepEqual(L.LINK_INTRO[code], cartes, `les cartes du code ${code} ont changé ou disparu`);
  for(const [code, cartes] of Object.entries(L.LINK_INTRO)){
    assert.match(code, /^[1-9]\d*$/, `code ${code} invalide`);
    assert.ok(Array.isArray(cartes) && cartes.length >= 1 && cartes.length <= 3 && cartes.every(c => typeof c === "string" && c.trim()), `code ${code} : 1 à 3 cartes de texte`);
  }
  const vals = Object.values(L.LINK_INTRO).map(c => JSON.stringify(c));
  assert.equal(new Set(vals).size, vals.length, "introduction en double");
});
await test("LINK_KEYS : aucune clé retirée, pas de doublon ; origine des dates inchangée", () => {
  for(const k of FIGE.LINK_KEYS) assert.ok(L.LINK_KEYS.includes(k), `clé ${k} retirée`);
  assert.equal(new Set(L.LINK_KEYS).size, L.LINK_KEYS.length);
  assert.equal(L.LINK_T0, FIGE.LINK_T0);
});
await test("Textes des tons du Non inchangés", () => {
  for(const t of FIGE.NO_TONES){
    const a = L.NO_TONES.find(x => x.id === t.id);
    assert.ok(a, `ton ${t.id} supprimé`);
    pareil(a, t, `Textes du ton ${t.id}`);
  }
  assert.equal(L.NO_TONES[0].id, "taquin", "taquin doit rester le ton par défaut (premier de la liste)");
});
const memes = (codes, ids, quoi) => {
  const c = Object.values(codes);
  for(const id of ids) assert.ok(c.includes(id), `${quoi} « ${id} » sans code : ses liens resteraient à l'ancien format`);
  for(const v of c) assert.ok(ids.includes(v), `code vers ${quoi} « ${v} » inexistant(e) : les anciens liens ne s'ouvriraient plus`);
};
await test("Chaque code correspond à une valeur existante, et chaque valeur a un code", () => {
  memes(L.LINK_OCC, Object.keys(L.OCC), "occasion");
  memes(L.LINK_TH, L.THEMES.map(t => t.id), "thème");
  memes(L.LINK_NO, L.NO_MODES.map(m => m.id), "Non");
  memes(L.LINK_TONE, L.NO_TONES.map(t => t.id), "ton");
  memes(L.LINK_CH, L.CHANNELS.map(c => c.id), "canal");
  memes(L.LINK_AC, L.ACCENTS.map(a => a.id), "accent");
  memes(L.LINK_EM, L.EMOJIS, "emoji");
  memes(L.LINK_AN, ["n", "d", "0"], "animation");
});
await test("Questions des occasions et textes des modèles présents dans LINK_PHRASES (liens courts)", () => {
  const ph = Object.values(L.LINK_PHRASES);
  for(const o of Object.values(L.OCC)) assert.ok(ph.includes(o.q), `question de l'occasion ${o.id} sans code`);
  const html = readFileSync(RACINE + "index.html", "utf8");
  const bloc = html.slice(html.indexOf("const TEMPLATES = ["), html.indexOf("];", html.indexOf("const TEMPLATES = [")));
  const textes = [...bloc.matchAll(/\b(?:q|msg):"([^"]*)"/g)].map(m => m[1]);
  assert.ok(textes.length >= 10, "modèles introuvables dans index.html");
  for(const t of textes) assert.ok(ph.includes(t), `texte de modèle sans code : ${t}`);
});

/* =========================================================
   5. Aucune donnée personnelle ni aucun secret
   ========================================================= */
titre("5. Données personnelles et secrets");
const SECRETS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "clé privée"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, "jeton GitHub"],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/, "jeton GitHub"],
  [/\bAKIA[0-9A-Z]{16}\b/, "clé AWS"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "clé Google"],
  [/\bsk-(?:ant-)?[A-Za-z0-9_-]{24,}/, "clé d'API"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, "jeton Slack"],
  [/(?:password|passwd|mot_de_passe|api[_-]?key|secret|token)\s*[:=]\s*["'][^"'\s]{8,}["']/i, "mot de passe ou clé en clair"]
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const TELEPHONE = /(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/g;
const telFictif = t => /^(?:33|0)[67]0000000\d$/.test(t.replace(/\D/g, "")); // 06 00 00 00 0x
const fichiersTests = readdirSync(fileURLToPath(new URL(".", import.meta.url))).map(f => "tests/" + f);
let suivis = [];
try{ suivis = execFileSync("git", ["ls-files"], { cwd: RACINE, encoding: "utf8" }).split("\n").filter(Boolean); }catch(e){ console.log("  (git introuvable : seuls les fichiers de test sont vérifiés pour les secrets)"); }
const TEXTE = /\.(?:html|js|mjs|json|md|txt|webmanifest|css|svg)$|^CNAME$/;
await test("Aucun secret dans les fichiers du dépôt et des tests", () => {
  for(const f of new Set([...suivis.filter(f => TEXTE.test(f)), ...fichiersTests])){
    const txt = readFileSync(RACINE + f, "utf8");
    for(const [re, quoi] of SECRETS){ const m = txt.match(re); assert.ok(!m, `${quoi} possible dans ${f} : ${m?.[0].slice(0, 12)}…`); }
  }
});
await test("Aucune adresse e-mail ni vrai numéro de téléphone dans les tests (liens décodés compris)", async () => {
  const decodes = [];
  for(const r of REFERENCES){ const d = await L.decodeData(r.lien); decodes.push(JSON.stringify(d), ...Object.values(r.reveles || {})); }
  const sources = [...fichiersTests.map(f => [f, readFileSync(RACINE + f, "utf8")]), ["liens de référence décodés", decodes.join("\n")]];
  for(const [f, txt] of sources){
    const mails = txt.match(EMAIL) || [];
    assert.deepEqual(mails, [], `adresse e-mail dans ${f}`);
    const tels = (txt.match(TELEPHONE) || []).filter(t => !telFictif(t));
    assert.deepEqual(tels, [], `numéro de téléphone non fictif dans ${f} (utiliser 06 00 00 00 0x)`);
  }
});

/* =========================================================
   6. Rappel d'agenda : lien allégé et révélations
   ========================================================= */
titre("6. Rappel d'agenda");
// Texte JSON réellement contenu dans un lien (après décompression), pour y chercher l'identifiant du créateur
const contenuBrut = lien => { const b = L.unb64url(lien.slice(1)); return Buffer.from(lien[0] === "y" || lien[0] === "z" ? inflateRawSync(b) : b).toString("utf8"); };
const ID_CREATEUR = ["06 00 00 00 07", "+33 6 00 00 00 08", "@exemple_createur", "exemple.createur"];
await test("Lien de rappel : jamais d'identifiant du créateur, quel que soit le canal (y, x, z, p)", async () => {
  for(const ch of L.CHANNELS.filter(c => c.id !== "any")) for(const id of ID_CREATEUR){
    if((ch.id === "wa" || ch.id === "sms") !== /\d{2} \d{2}/.test(id)) continue; // numéro pour WhatsApp/SMS, nom d'utilisateur sinon
    const d = L.sanitize({ ...BASE_ANCIEN, c: ch.id, ci: id, l: { v: "r", at: "2026-11-14T18:00", e: L.scramble("Lieu de l'Exemple") } });
    assert.equal(d.ci, id, "l'invitation de départ doit contenir l'identifiant");
    for(const date of ["2026-11-14", "2025-11-14"]) for(const [, E] of [["compressé", L], ["non compressé", Lplat]]){
      const lien = await E.encodeData(L.reminderData({ ...d, d: date }, null));
      assert.ok(!contenuBrut(lien).includes(id), `identifiant « ${id} » présent dans le lien ${lien[0]}`);
      const lu = await L.decodeData(lien);
      assert.equal(lu.c, "any"); assert.equal(lu.ci, undefined); assert.equal(lu.rv, 1);
    }
  }
});
await test(`Lien de rappel : ${Math.min(NOMBRE, 400)} invitations aléatoires, tout ce qui sert à la révélation est gardé`, async () => {
  for(let k = 0; k < Math.min(NOMBRE, 400); k++){
    const d = L.sanitize(invitation()), slot = d.sl ? ent(0, d.sl.length - 1) : null;
    const r = L.reminderData(d, slot);
    // Attendu : la même invitation, sans canal ni identifiant, avec le créneau choisi, et l'indicateur
    const attendu = { ...d, c: "any", rv: 1 }; delete attendu.ci;
    if(d.sl){ delete attendu.sl; attendu.d = d.sl[slot][0]; attendu.h = d.sl[slot][1]; }
    pareil(JSON.parse(JSON.stringify(r)), L.sanitize(JSON.parse(JSON.stringify(attendu))), `Rappel de l'invitation ${k + 1}`);
    for(const [kk] of L.revealKeys(d)) assert.ok(L.revealKeys(r).some(([x]) => x === kk), `révélation ${kk} perdue`);
    const lien = await L.encodeData(r);
    if(d.ci) assert.ok(!contenuBrut(lien).includes(d.ci), `identifiant du créateur dans le lien de rappel ${k + 1}`);
    pareil(await Lsecours.decodeData(lien), r, `Relecture du rappel ${k + 1}`);
    pareil(L.reminderData(r, null), r, "Un rappel de rappel doit être identique");
  }
});
// Plan de révélation : waiting (cadenas + compte à rebours), staged (mise en scène), shown (affichage direct)
const H = 3600e3, AT = "2026-11-14T18:00", T = new Date(AT).getTime();
const avecRev = (extra = {}) => L.sanitize({ ...BASE_ANCIEN, a: { v: "r", at: AT, e: L.scramble("Dîner") }, l: { v: "r", at: "2026-11-14T19:00", e: L.scramble("Ici") }, ...extra });
const PLANS = [
  ["Lien normal, avant l'heure : cadenas et compte à rebours", avecRev(), T - H, "n", { shown: [], staged: [], waiting: ["a", "l"] }],
  ["Rappel, avant l'heure : cadenas et compte à rebours", avecRev({ rv: 1 }), T - 60e3, "n", { shown: [], staged: [], waiting: ["a", "l"] }],
  ["Rappel, heure atteinte pile : mise en scène", avecRev({ rv: 1 }), T, "n", { shown: [], staged: ["a"], waiting: ["l"] }],
  ["Rappel, après l'heure : mise en scène de chaque surprise, dans l'ordre", avecRev({ rv: 1 }), T + 2 * H, "n", { shown: [], staged: ["a", "l"], waiting: [] }],
  ["Rappel, trois jours après : mise en scène quand même", avecRev({ rv: 1 }), T + 72 * H, "n", { shown: [], staged: ["a", "l"], waiting: [] }],
  ["Lien normal, révélée depuis moins de 24 h : mise en scène", avecRev(), T + 23 * H, "n", { shown: [], staged: ["a", "l"], waiting: [] }],
  ["Lien normal, 24 h pile pour l'une, moins pour l'autre", avecRev(), T + 24 * H, "n", { shown: ["a"], staged: ["l"], waiting: [] }],
  ["Lien normal, révélée depuis plus de 24 h : affichage direct", avecRev(), T + 30 * H, "n", { shown: ["a", "l"], staged: [], waiting: [] }],
  ["Animation douce : mise en scène gardée (en plus discret)", avecRev({ rv: 1 }), T + H / 2, "d", { shown: [], staged: ["a"], waiting: ["l"] }],
  ["Animations coupées : affichage direct, même depuis le rappel", avecRev({ rv: 1 }), T + 2 * H, "0", { shown: ["a", "l"], staged: [], waiting: [] }],
  ["Animations coupées, avant l'heure : compte à rebours", avecRev(), T - H, "0", { shown: [], staged: [], waiting: ["a", "l"] }],
  ["Visible ou surprise simple : jamais de mise en scène", L.sanitize({ ...BASE_ANCIEN, a: { v: "v", x: "Dîner" }, l: { v: "s", h: "Indice" }, rv: 1 }), T, "n", { shown: [], staged: [], waiting: [] }],
  ["Programme : seules les étapes révélées, dans l'ordre", L.sanitize({ ...sans(BASE_ANCIEN, "a"), rv: 1, p: [
      { h: "10:00", v: "r", at: "2026-11-14T20:00", e: L.scramble("{}") }, { h: "12:00", v: "v", a: "Déjeuner" },
      { h: "14:00", v: "r", at: AT, e: L.scramble("{}") }, { h: "16:00", v: "s" }, { h: "18:00", v: "r", at: "2026-11-14T08:00", e: L.scramble("{}") } ] }),
    T + H, "n", { shown: [], staged: ["p2", "p4"], waiting: ["p0"] }]
];
for(const [nom, d, now, anim, attendu] of PLANS) await test(nom, () => pareil(L.revealPlan(d, now, anim), attendu, "Plan de révélation"));
await test("Le délai de 24 h vaut bien 24 heures", () => assert.equal(L.REVEAL_FRESH, 24 * H));

// Événements « Ta surprise de … se révèle 🔓 » : un par révélation encore à venir
const ENC = s => L.scramble(JSON.stringify({ a: s, l: "Lieu de l'Exemple" }));
const TROIS = L.sanitize({ ...sans(BASE_ANCIEN, "a"), c: "wa", ci: "06 00 00 00 07", p: [
  { h: "10:00", v: "r", i: "Prévois un pull", at: "2026-11-14T08:00", e: ENC("Balade") },
  { h: "12:00", v: "v", a: "Déjeuner" },
  { h: "14:00", v: "r", at: "2026-11-14T13:30", e: ENC("Musée") },
  { h: "18:00", v: "r", i: "Ça brille", at: "2026-11-14T17:45", e: ENC("Concert") } ] });
const LIEN_RAPPEL = "https://osedemander.fr/#i=" + await L.encodeData(L.reminderData(TROIS, null));
const heureLocale = at => new Date(at).getTime();
await test("Rappels de révélation : un événement par révélation à venir, à l'heure exacte, deux alertes", () => {
  const evs = L.revealEvents(TROIS, heureLocale("2026-11-14T09:00"), LIEN_RAPPEL);
  assert.deepEqual(evs.map(e => e.key), ["p2", "p3"], "seules les révélations encore à venir, dans l'ordre");
  for(const [ev, at] of [[evs[0], "2026-11-14T13:30"], [evs[1], "2026-11-14T17:45"]]){
    assert.equal(ev.title, "Ta surprise de Alex se révèle 🔓");
    assert.equal(ev.start.getTime(), heureLocale(at), "début à l'heure exacte de la révélation");
    assert.equal(ev.end - ev.start, L.REVEAL_EVENT_MIN * 60e3);
    assert.deepEqual([...ev.alarms], [10, 0], "alertes : 10 minutes avant et à l'heure exacte");
    assert.ok(ev.desc.includes(LIEN_RAPPEL), "lien de rappel dans la description");
    assert.equal(ev.url, LIEN_RAPPEL);
  }
  assert.ok(evs[1].desc.startsWith("Indice : Ça brille"), "l'indice (déjà visible sur la carte) est repris");
  assert.ok(!evs[0].desc.includes("Indice"), "pas d'indice inventé");
});
await test("Rappels de révélation : toutes avant la première, aucune après la dernière, rien sans révélation", () => {
  assert.deepEqual(L.revealEvents(TROIS, heureLocale("2026-11-14T07:00"), LIEN_RAPPEL).map(e => e.key), ["p0", "p2", "p3"]);
  assert.deepEqual(L.revealEvents(TROIS, heureLocale("2026-11-14T17:45"), LIEN_RAPPEL), [], "à l'heure pile, la révélation n'est plus « à venir »");
  assert.deepEqual(L.revealEvents(L.sanitize({ ...BASE_ANCIEN, a: { v: "v", x: "Dîner" }, l: { v: "s", h: "Indice" } }), 0, LIEN_RAPPEL), []);
  const simple = L.sanitize({ ...BASE_ANCIEN, a: { v: "r", h: "Devine", at: AT, e: L.scramble("Dîner") }, l: { v: "r", at: "2026-11-14T19:00", e: L.scramble("Ici") } });
  assert.deepEqual(L.revealEvents(simple, T - H, LIEN_RAPPEL).map(e => e.key), ["a", "l"]);
});
await test("Rappels de révélation : jamais l'identifiant ni le canal du créateur (événements, .ics, lien)", async () => {
  const evs = L.revealEvents(TROIS, heureLocale("2026-11-14T07:00"), LIEN_RAPPEL), ics = L.icsText(evs);
  for(const txt of [JSON.stringify(evs), ics.replace(/\r\n /g, ""), contenuBrut(LIEN_RAPPEL.split("#i=")[1])])
    assert.ok(!txt.includes("06 00 00 00 07"), "identifiant du créateur présent");
  const lu = await L.decodeData(LIEN_RAPPEL.split("#i=")[1]);
  assert.equal(lu.c, "any"); assert.equal(lu.ci, undefined); assert.equal(lu.rv, 1);
  assert.equal(L.revealKeys(lu).length, 3, "le lien de rappel garde les trois révélations");
});
await test("Fichier .ics : un VEVENT par révélation, deux VALARM chacun, lignes de 75 octets au plus", () => {
  const evs = L.revealEvents(TROIS, heureLocale("2026-11-14T07:00"), LIEN_RAPPEL);
  const ics = L.icsText(evs, new Date(Date.UTC(2026, 9, 15, 12, 0)));
  const lignes = ics.split("\r\n"), plat = ics.replace(/\r\n /g, "");
  assert.ok(!/[^\r]\n/.test(ics), "fins de ligne CRLF uniquement");
  for(const l of lignes) assert.ok(Buffer.byteLength(l) <= 75, `ligne trop longue (${Buffer.byteLength(l)} octets)`);
  const compte = re => (plat.match(re) || []).length;
  assert.equal(compte(/^BEGIN:VEVENT$/gm), 3);
  assert.equal(compte(/^BEGIN:VALARM$/gm), 6);
  assert.equal(compte(/^TRIGGER:-PT10M$/gm), 3);
  assert.equal(compte(/^TRIGGER:PT0M$/gm), 3);
  assert.equal(compte(/^ACTION:DISPLAY$/gm), 6);
  for(const d of ["20261114T080000", "20261114T133000", "20261114T174500"]) assert.ok(plat.includes(`DTSTART:${d}`), `DTSTART ${d}`);
  assert.equal(compte(new RegExp(`^URL:${LIEN_RAPPEL.replace(/[.?*+^$()[\]{}|\\]/g, "\\$&")}$`, "gm")), 3, "lien complet après dépliage");
  assert.ok(plat.includes("SUMMARY:Ta surprise de Alex se révèle 🔓"));
  assert.ok(plat.includes("DTSTAMP:20261015T120000Z"));
  assert.equal(new Set(plat.match(/^UID:.*$/gm)).size, 3, "identifiants d'événement distincts");
});
await test("Fichier .ics : caractères spéciaux échappés, événement du rendez-vous sans alerte", () => {
  const ev = { start: new Date(2026, 10, 14, 20, 0), end: new Date(2026, 10, 14, 22, 0), title: "Dîner, cinéma; et\\ plus", loc: "", desc: "Ligne 1\nLigne 2", url: "" };
  const plat = L.icsText([ev]).replace(/\r\n /g, "");
  assert.ok(plat.includes("SUMMARY:Dîner\\, cinéma\\; et\\\\ plus"));
  assert.ok(plat.includes("DESCRIPTION:Ligne 1\\nLigne 2"));
  assert.ok(!plat.includes("VALARM") && !plat.includes("URL:"), "pas d'alerte ni de lien s'il n'y en a pas");
});

/* =========================================================
   7. Contrastes : 4,5:1 pour le texte, 3:1 pour les grands textes et les éléments graphiques
   ========================================================= */
titre("7. Contrastes des thèmes");
// Variables CSS de chaque thème, lues dans index.html (:root = base, puis [data-theme="…"])
const CSS = (() => { const h = readFileSync(RACINE + "index.html", "utf8"); return h.slice(h.indexOf("<style>"), h.indexOf("</style>")); })();
const varsDe = bloc => Object.fromEntries([...bloc.matchAll(/--([a-z-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2].toUpperCase()]));
const RACINE_CSS = varsDe(CSS.match(/:root(?:,\[data-theme\])?\{([^}]*--bg:[^}]*)\}/)[1]);
const THEME_CSS = Object.fromEntries(L.THEMES.map(t => {
  const m = t.id === "base" ? [null, ""] : CSS.match(new RegExp(`\\[data-theme="${t.id}"\\]\\{([^}]*)\\}`));
  assert.ok(m, `thème ${t.id} absent du CSS`);
  return [t.id, { ...RACINE_CSS, ...varsDe(m[1]) }];
}));
const ratio = (a, b) => Math.round(L.contrast(a, b) * 100) / 100;
const exige = (quoi, a, b, min) => { const r = ratio(a, b); assert.ok(r >= min, `${quoi} : ${a} sur ${b} = ${r}:1 (minimum ${min}:1)`); };
for(const t of L.THEMES){
  await test(`Thème ${t.name} : texte ≥ 4,5:1, sceau et éléments graphiques ≥ 3:1`, () => {
    const v = THEME_CSS[t.id], fonds = [["fond", v.bg], ["surface", v.surface], ["fond doux", v.soft]];
    for(const [nom, f] of fonds){
      exige(`encre sur ${nom}`, v.ink, f, 4.5);
      exige(`texte atténué sur ${nom}`, v.muted, f, 4.5);
      exige(`accent texte (liens, compte à rebours) sur ${nom}`, v["accent-text"], f, 4.5);
    }
    exige("texte des boutons sur leur fond", v["accent-ink"], v["accent-btn"], 4.5);
    exige("initiale du sceau (grand texte gras)", v["accent-seal"], v.ink, 3);
    for(const [nom, f] of fonds) exige(`contour de focus sur ${nom}`, v["accent-text"], f, 3);
  });
  await test(`Thème ${t.name} : variantes = calcul de readable(), table THEMES = CSS`, () => {
    const v = THEME_CSS[t.id];
    assert.equal(t.c, v.bg); assert.equal(t.a, v.accent); assert.equal(t.s || "#FFFFFF", v.surface); assert.equal(t.so, v.soft); assert.equal(t.i, v.ink);
    assert.equal(v["accent-text"], L.readable(v.accent, [v.bg, v.surface, v.soft], 4.5), "--accent-text");
    assert.equal(v["accent-btn"], L.readable(v.accent, [v["accent-ink"]], 4.5), "--accent-btn");
    assert.equal(v["accent-seal"], L.readable(v.accent, [v.ink], 3), "--accent-seal");
  });
}
await test("Couleurs d'accent facultatives : chaque combinaison autorisée respecte les mêmes seuils", () => {
  let n = 0;
  for(const t of L.THEMES) for(const a of L.ACCENTS){
    const x = L.accentVars(t.id, a.id);
    assert.equal(!!x, L.accentOk(t.id, a.id));
    if(!x) continue; n++;
    const v = THEME_CSS[t.id], ou = `${t.name} + ${a.name}`;
    assert.equal(x.accent, a.c, "le remplissage garde la couleur choisie");
    for(const f of [v.bg, v.surface, v.soft]){ exige(`${ou} : accent texte`, x.text, f, 4.5); }
    exige(`${ou} : texte des boutons`, x.ink, x.btn, 4.5);
    exige(`${ou} : sceau`, x.seal, v.ink, 3);
  }
  assert.ok(n >= 20, `seulement ${n} combinaisons autorisées`);
});
await test("Règles CSS : le texte n'utilise jamais l'accent brut, les boutons utilisent --accent-btn", () => {
  const regles = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim(), m[2]]);
  const DECOR_PERMIS = [".logo .q"]; // le « ? » du logo : logotype, exempté
  for(const [sel, decl] of regles){
    if(/(^|;)\s*color\s*:\s*var\(--accent\)/.test(decl)) assert.ok(DECOR_PERMIS.includes(sel), `${sel} : texte en var(--accent), utiliser var(--accent-text)`);
    assert.ok(!/outline[^;]*var\(--accent\)/.test(decl), `${sel} : contour en var(--accent)`);
    assert.ok(!/border-color\s*:\s*var\(--accent\)/.test(decl), `${sel} : bordure de focus en var(--accent)`);
    if(/color\s*:\s*var\(--accent-ink\)/.test(decl)) assert.ok(/background\s*:\s*var\(--accent-btn\)/.test(decl), `${sel} : texte --accent-ink sans fond --accent-btn`);
  }
  assert.ok(regles.some(([s, d]) => s === ":focus-visible" && d.includes("var(--accent-text)")), "focus visible");
});
await test("Messages d'erreur lisibles", () => {
  exige("erreur", "#B3122E", "#FFE3E8", 4.5);
  exige("erreur (Mystère)", "#FFD0D8", "#4A1F3A", 4.5);
  for(const t of L.THEMES.filter(t => !t.s)) exige(`bouton danger (${t.name})`, "#B3122E", THEME_CSS[t.id].surface, 4.5);
});

/* =========================================================
   8. Écrans : HTML réellement produit par la page complète (skill ose-design)
   ========================================================= */
titre("8. Écrans");
const PAGE = chargerPage();
PAGE.ecrire("SEASON_TODAY", "2026-10-15"); // date fixe : les écrans de la création dépendent des saisons
const INV = (extra = {}) => PAGE.lire("sanitize")({ f: "Alex", t: "Sam", o: "date", th: "amour", q: "Ça te dit un rendez-vous avec moi ?", n: "fuit",
  c: "wa", ci: "06 00 00 00 01", m: "Prépare ton plus beau sourire.", a: { v: "v", x: "Dîner" }, d: "2026-11-14", h: "20:00", ...extra });
const ouvrir = (d, slot = null, mode = "yes") => {
  PAGE.ecrire("D", d); PAGE.ecrire("chosenSlot", slot); PAGE.ecrire("afterMode", mode);
  PAGE.ecrire("remState", "ok"); PAGE.ecrire("remLink", "http://localhost:8000/#i=yExemple");
  PAGE.lire("initReveals")();
};
const apresOui = () => PAGE.lire("afterHTML")("C'est un oui !", "");

// O1 : la réponse n'est transmise qu'une fois envoyée, il faut le dire et le mettre en avant
await test("Après le Oui : « Dernière étape », l'envoi juste sous le titre, seule action principale", () => {
  ouvrir(INV());
  const h = apresOui();
  assert.ok(h.includes("<strong>Dernière étape :</strong> envoie ta réponse à Alex. Tant qu'elle n'est pas partie, Alex ne sait rien."));
  assert.ok(!h.includes("aux anges"), "plus de phrase laissant croire que la réponse est partie");
  assert.ok(h.indexOf('id="reply"') < h.indexOf('id="details"'), "le bouton de réponse vient avant les détails");
  assert.ok(h.indexOf('id="reply"') < h.indexOf('id="actions"'), "et avant l'agenda");
  assert.deepEqual(principales(h), ["Répondre sur WhatsApp"], "une seule action principale : la réponse");
});
await test("Après le Oui avec créneaux : choisir le créneau, puis envoyer", () => {
  ouvrir(INV({ d: undefined, h: undefined, sl: [["2026-11-14", "20:00"], ["2026-11-21", "20:00"]] }));
  assert.ok(apresOui().includes("choisis ton créneau plus bas, puis envoie ta réponse à Alex"));
  ouvrir(INV({ d: undefined, h: undefined, sl: [["2026-11-14", "20:00"], ["2026-11-21", "20:00"]] }), 1);
  assert.ok(apresOui().includes("Dernière étape :</strong> envoie ta réponse"));
});
await test("Carte ouverte depuis le rappel d'agenda : « Si ce n'est pas déjà fait », une seule action principale", () => {
  ouvrir(PAGE.lire("reminderData")(INV(), null), null, "reminder");
  const h = PAGE.lire("ticketHTML")(PAGE.lire("afterHTML")("Ton invitation", "Avec Alex"));
  assert.ok(h.includes("Si ce n'est pas déjà fait, envoie ta réponse à Alex."));
  assert.deepEqual(principales(h), ["Envoyer ma réponse"]);
});

// I1 : le vrai refus est une action essentielle, donc une vraie cible tactile
const regleCSS = sel => { const m = CSS.match(new RegExp(`(?:^|[\\n}])\\s*${sel.replace(/[.[\]()]/g, "\\$&")}\\{([^}]*)\\}`)); return m ? m[1] : ""; };
await test("Vrai refus : cible de 44 px au moins, toujours discrète", () => {
  const r = regleCSS(".refuse");
  const h = +(r.match(/min-height:(\d+)px/) || [])[1];
  assert.ok(h >= 44, `.refuse : min-height ${h || "absent"} (44 px minimum)`);
  assert.ok(r.includes("color:var(--muted)"), "le refus reste discret (texte atténué)");
  assert.ok(!/background:var\(--accent/.test(r), "le refus n'est jamais une action principale");
});
await test("Le Non qui s'enfuit ne se pose ni sur le Oui ni sur le vrai refus", () => {
  const src = PAGE.lire("bindNo").toString();
  assert.ok(src.includes('$("#refuse")') && src.includes("covers(rf,x,y)") && src.includes("covers(yr,x,y)"));
});
await test("Écran de refus : pas de flèche décorative", () => {
  assert.ok(!/[←→]/.test(PAGE.lire("openRefuse").toString()));
});

// C1 : le moment d'envoyer le lien
const PAGE_PARTAGE = chargerPage({ share: true });
PAGE_PARTAGE.ecrire("SEASON_TODAY", "2026-10-15");
const etape4 = (P, lien) => {
  const S = P.lire("S");
  Object.assign(S, { step: 4, from: "Alex", to: "Sam", link: lien });
  P.lire("renderCreator")();
  let h = P.zones["#app"].innerHTML;
  if(!lien) h = h.replace(P.lire("readyHTML")(), ""); // carte « lien prêt » masquée : retirée avant de compter
  return h;
};
const LIEN_EX = "http://localhost:8000/#i=y" + "A".repeat(400);
await test("Création, avant le lien : une seule action principale « Créer mon lien », carte masquée", () => {
  const h = etape4(PAGE, "");
  assert.ok(PAGE.zones["#app"].innerHTML.includes('id="result" class="ready hidden"'), "carte du lien masquée");
  assert.deepEqual(principales(h), ["Créer mon lien"]);
});
await test("Lien prêt (sans partage natif) : « Copier le lien » seule action principale, adresse repliée", () => {
  const h = etape4(PAGE, LIEN_EX);
  assert.deepEqual(principales(h), ["Copier le lien"]);
  assert.ok(h.includes('class="linkbox one" id="linkbox"'), "adresse repliée sur une ligne");
  assert.ok(h.includes("Afficher le lien en entier") && h.includes('aria-expanded="false"'));
  assert.ok(h.includes("Copie-le, puis colle-le dans ta conversation avec Sam."));
  assert.ok(h.includes("Ton lien est prêt 💌"));
});
await test("Lien prêt (partage natif) : « Partager le lien » principale, message envoyé visible", () => {
  const h = etape4(PAGE_PARTAGE, LIEN_EX);
  assert.deepEqual(principales(h), ["Partager le lien"]);
  assert.ok(h.includes("il partira avec le message « Sam, j&#39;ai une question pour toi 💌 »"));
  assert.ok(h.includes('id="copy">Copier le lien</button>'), "copie toujours possible, en secondaire");
});
await test("Partage : le texte affiché est exactement celui envoyé", () => {
  const src = PAGE.lire("bindCreator").toString();
  assert.ok(src.includes("text:shareText()"));
});

// A1 : l'accueil montre le produit (mini-billet vivant)
await test("Accueil : mini-billet vivant, le Oui est la seule action principale", () => {
  const h = PAGE.lire("homeHTML")();
  assert.ok(/class="ticket demo-ticket"/.test(h) && h.includes('id="demoNo"'), "mini-billet avec Oui et Non");
  assert.ok(h.indexOf("demo-ticket") < h.indexOf("home-cards"), "le billet vient avant les cartes");
  assert.deepEqual(principales(h), ["Oui"]);
  assert.ok(h.includes('aria-label="Oui : créer mon invitation"'), "le Oui dit ce qu'il fait");
  assert.ok(/id="demoTease" aria-live="polite"/.test(h), "les phrases du Non sont annoncées");
});
await test("Accueil : le Non respecte les animations coupées, le Oui mène aux modèles", () => {
  const src = PAGE.lire("bindDemoTicket").toString();
  assert.ok(src.includes('REDUCED || S.anim==="0"') && src.includes("if(still()) return;"), "pas de mouvement si animations coupées");
  assert.ok(src.includes("go(1)"), "le Oui ouvre le choix du modèle");
  assert.ok(src.includes('noTone("taquin")'), "phrases du ton taquin (existantes)");
});

// T1 : à chaque changement d'écran, le focus va au titre du nouvel écran
const dernierFocus = (P, action) => { P.vus.length = 0; action(); return P.vus.filter(s => s !== "#app" && s !== "#main").pop(); };
await test("Chaque écran a un titre qui peut recevoir le focus (tabindex=-1)", () => {
  const S = PAGE.lire("S");
  const ecrans = [["accueil", () => PAGE.lire("homeHTML")(), /<h1 tabindex="-1">/]];
  for(const n of [1, 2, 3, 4]) ecrans.push([`étape ${n}`, () => { Object.assign(S, { step: n, from: "Alex", to: "Sam", link: "" }); PAGE.lire("renderCreator")(); return PAGE.zones["#app"].innerHTML; }, /<h2 tabindex="-1">/]);
  ecrans.push(["enveloppe", () => { ouvrir(INV()); PAGE.lire("renderEnvelope")(); return PAGE.zones["#app"].innerHTML; }, /class="env-from" tabindex="-1"/]);
  ecrans.push(["question", () => { PAGE.lire("renderInvite")(); return PAGE.zones["#app"].innerHTML; }, /<h1 class="question" tabindex="-1">/]);
  ecrans.push(["après le Oui", () => apresOui(), /<h1 class="question" tabindex="-1"/]);
  for(const [nom, rendu, re] of ecrans) assert.match(rendu(), re, `titre focalisable : ${nom}`);
  assert.ok(regleCSS('[tabindex="-1"]:focus').includes("outline:none"), "pas de contour sur un titre focalisé");
});
await test("Changements d'écran : le focus va au bon titre", () => {
  const S = PAGE.lire("S"); Object.assign(S, { from: "Alex", to: "Sam" });
  assert.equal(dernierFocus(PAGE, () => PAGE.lire("go")(2)), ".panel h2", "création : étape suivante");
  assert.equal(dernierFocus(PAGE, () => PAGE.lire("go")("home")), ".hero h1", "retour à l'accueil");
  ouvrir(INV());
  assert.equal(dernierFocus(PAGE, () => PAGE.lire("renderEnvelope")()), ".env-from", "enveloppe");
  assert.equal(dernierFocus(PAGE, () => PAGE.lire("renderInvite")()), ".question", "question");
  PAGE.ecrire("yesDone", false); PAGE.ecrire("refused", false);
  PAGE.vus.length = 0; PAGE.lire("sayYes")();
  assert.ok(PAGE.vus.includes("#main .question"), "après le Oui : le titre « C'est un oui ! » (le bouton Oui a disparu)");
  ouvrir(PAGE.lire("reminderData")(INV(), null), null, "reminder");
  assert.equal(dernierFocus(PAGE, () => PAGE.lire("renderReminder")()), ".question", "carte ouverte depuis le rappel");
});
await test("Réaffichage après un choix : le focus revient sur le même contrôle", () => {
  const src = PAGE.lire("bindCreator").toString();
  assert.ok(src.includes("const k=focusKey(b);") && src.includes('refocus(k, ".panel h2")'), "options de la création");
  assert.ok(src.includes('refocus("#choose")') && src.includes('focusScreen(".ready-title")'), "créneaux au choix, lien prêt");
  const apres = PAGE.lire("bindAfter").toString();
  assert.ok(apres.includes('refocus("#repick")') && apres.includes('refocus("[data-pick]")'), "choix du créneau après le Oui");
});

// Règles du skill ose-design, sur tous les écrans
await test("Règle : une seule action principale par écran", () => {
  const S = PAGE.lire("S"), app = () => PAGE.zones["#app"].innerHTML;
  const ecrans = [["accueil", PAGE.lire("homeHTML")()]];
  for(const n of [1, 2, 3, 4]){ Object.assign(S, { step: n, from: "Alex", to: "Sam", link: "" }); PAGE.lire("renderCreator")(); ecrans.push([`création, étape ${n}`, app().replace(PAGE.lire("readyHTML")(), "")]); }
  ecrans.push(["création, lien prêt", etape4(PAGE, LIEN_EX)], ["création, lien prêt (partage)", etape4(PAGE_PARTAGE, LIEN_EX)]);
  ouvrir(INV());
  PAGE.lire("renderEnvelope")(); ecrans.push(["enveloppe", app()]);
  PAGE.ecrire("yesDone", false); PAGE.ecrire("refused", false);
  PAGE.lire("renderInvite")(); ecrans.push(["question", app()]);
  PAGE.lire("openRefuse")(); ecrans.push(["vrai refus", PAGE.zones["#main"].innerHTML]);
  ecrans.push(["après le Oui", apresOui()]);
  ouvrir(PAGE.lire("reminderData")(INV(), null), null, "reminder");
  PAGE.lire("renderReminder")(); ecrans.push(["carte du rappel", app()]);
  PAGE.lire("renderHistory")(); ecrans.push(["mes invitations", app()]);
  for(const [nom, h] of ecrans){ const p = principales(h); assert.ok(p.length <= 1, `${nom} : ${p.length} actions principales (${p.join(", ")})`); }
});
await test("Règle : pas de nouvelle flèche décorative ni de séparateur « · »", () => {
  const n = (readFileSync(RACINE + "index.html", "utf8").match(/[→←]| · /g) || []).length;
  assert.ok(n <= 14, `${n} flèches ou « · » dans index.html (14 au plus, à retirer au point T2 de l'audit)`);
});

/* =========================================================
   9. Scènes illustrées (fond des écrans de la personne invitée)
   ========================================================= */
titre("9. Scènes illustrées");
const SCENES = PAGE.lire("SCENES"), sceneZone = PAGE.zones["#scene"];
const reglesScene = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim().split("\n").pop().trim(), m[2]]).filter(([s]) => /(#scene|scene-sign|\.sc-|\.sg-)/.test(s));
const declScene = sel => (reglesScene.find(([s]) => s === sel) || [, ""])[1];
const varDe = (sel, prop) => (declScene(sel).match(new RegExp(`${prop}:var\\(--([a-z-]+)\\)`)) || [])[1];
await test("Scènes : une scène (décor + élément vedette) pour chaque thème", () => {
  assert.deepEqual(Object.keys(SCENES).sort(), L.THEMES.map(t => t.id).sort());
  for(const [id, sc] of Object.entries(SCENES)) assert.ok(sc.wall.includes("<svg") && sc.sign.includes("<svg"), `${id} : décor ou élément vedette manquant`);
});
await test("Scènes : uniquement les couleurs du thème, aucune image externe, poids léger", () => {
  assert.ok(reglesScene.length > 20, "règles CSS des scènes introuvables");
  for(const [sel, decl] of reglesScene) assert.ok(!/#[0-9A-Fa-f]{3,6}\b|rgba?\(/.test(decl), `${sel} : couleur écrite en dur (utiliser les variables du thème)`);
  let total = 0;
  for(const [id, sc] of Object.entries(SCENES)){
    const tout = sc.wall + sc.sign; total += tout.length;
    assert.ok(!/<image|href="http|url\(http|data:image\/(png|jpe?g|webp)/i.test(tout), `${id} : image externe ou photo`);
    assert.ok(!/(fill|stroke)="#|style="[^"]*(fill|stroke|color)/.test(tout), `${id} : couleur écrite dans le SVG (passer par une classe CSS)`);
    assert.ok(tout.length < 8000, `${id} : scène trop lourde (${tout.length} caractères)`);
  }
  assert.ok(total < 140000, `scènes trop lourdes au total (${total} caractères)`);
  // Règle du projet : index.html tel qu'il est téléchargé (compressé en gzip) reste sous 150 Ko ; au-delà, scènes en fichiers séparés
  const gz = gzipSync(readFileSync(RACINE + "index.html"), { level: 6 }).length;
  assert.ok(gz < 150 * 1024, `index.html compressé : ${(gz / 1024).toFixed(1)} Ko (150 Ko au plus : reparler des fichiers de scène séparés)`);
});
await test("Décor de fond : ton sur ton, texte et texte atténué lisibles (≥ 4,5:1) dans chaque thème", () => {
  const surfaces = [".sc-bg", ".sc-a", ".sc-b", ".sc-speck-d"].map(s => varDe(s, "fill"));
  assert.ok(surfaces.every(Boolean), "couleurs du décor introuvables");
  for(const [sel] of [[".sc-out"], [".sc-line"]]){
    const w = +(declScene(sel).match(/stroke-width:([\d.]+)/) || [])[1];
    assert.ok(w && w <= 2, `${sel} : trait de ${w} px (2 px au plus : la couleur --line ne sert qu'aux traits fins)`);
  }
  for(const [id, sc] of Object.entries(SCENES)){
    const classes = new Set([...sc.wall.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(" ")));
    for(const c of classes) assert.ok(/^(sc-(bg|a|b|out|line|dash|speck-[ld])|hs-wide)$/.test(c), `${id} : classe « ${c} » dans le décor de fond (réservée à l'élément vedette ?)`);
    const v = THEME_CSS[id];
    for(const c of surfaces){ exige(`${id} : encre sur --${c}`, v.ink, v[c], 4.5); exige(`${id} : texte atténué sur --${c}`, v.muted, v[c], 4.5); }
  }
});
await test("Éléments vedettes : textes à l'encre sur panneau, police de l'interface", () => {
  assert.equal(varDe(".sg-text", "fill"), "ink"); assert.equal(varDe(".sg-t-acc", "fill"), "accent-text");
  assert.ok(declScene(".sg-text").includes("font-family:var(--display)") && declScene(".sc-neon text").includes("font-family:var(--display)"), "Caveat réservée à l'écriture manuscrite");
  for(const [id, sc] of Object.entries(SCENES)){
    for(const m of sc.sign.matchAll(/<text class="([^"]+)"/g)) assert.ok(/^(sg-text|sc-neon-big|sc-neon-small)$/.test(m[1]), `${id} : texte de classe « ${m[1]} »`);
    const v = THEME_CSS[id];
    exige(`${id} : texte des panneaux`, v.ink, v.surface, 4.5);
    exige(`${id} : « ? » en accent`, v["accent-text"], v.surface, 4.5);
  }
  exige("Mystère : néon sur le mur", THEME_CSS.mystere.accent, THEME_CSS.mystere.bg, 4.5);
});
await test("Chaque thème : décor derrière l'enveloppe et l'invitation, élément vedette au-dessus", () => {
  for(const t of L.THEMES){
    ouvrir(INV({ th: t.id }));
    PAGE.lire("renderEnvelope")();
    let h = PAGE.zones["#app"].innerHTML;
    assert.equal(sceneZone.className, `scene-${t.id}`, `${t.name} : décor derrière l'enveloppe`);
    assert.ok(sceneZone.innerHTML === SCENES[t.id].wall);
    assert.ok(h.includes('class="scene-sign anim-n" aria-hidden="true"') && h.indexOf("scene-sign") < h.indexOf("env-from"), `${t.name} : élément vedette avant le titre`);
    PAGE.lire("renderInvite")();
    h = PAGE.zones["#app"].innerHTML;
    assert.equal(sceneZone.className, `scene-${t.id}`, `${t.name} : décor derrière l'invitation`);
    assert.ok(h.indexOf("scene-sign") < h.indexOf('class="ticket'), `${t.name} : élément vedette au-dessus du billet`);
    assert.ok(/class="ticket[^"]*"[\s\S]*class="question"[\s\S]*id="yes"/.test(h), `${t.name} : question et boutons sur le billet`);
  }
  assert.ok(regleCSS(".ticket").includes("background:var(--surface)"), "billet au fond uni");
  ouvrir(INV({ th: "mystere" })); PAGE.lire("renderEnvelope")();
  assert.ok(PAGE.zones["#app"].innerHTML.includes("Chut<tspan"), "Mystère : enseigne néon");
});
await test("Création : scène atténuée pendant la saisie, entière sur l'aperçu", () => {
  const S = PAGE.lire("S"), app = () => PAGE.zones["#app"].innerHTML;
  for(const t of L.THEMES){
    Object.assign(S, { step: "home", theme: t.id, from: "Alex", to: "Sam", link: "", anim: "n" });
    PAGE.lire("renderCreator")();
    assert.equal(sceneZone.className, "scene-home", `${t.name}, accueil : sa propre scène`);
    assert.equal(sceneZone.innerHTML, PAGE.lire("HOME_SCENE"));
    for(const step of [1, 2, 3]){
      S.step = step; PAGE.lire("renderCreator")();
      assert.equal(sceneZone.className, `scene-${t.id} dim`, `${t.name}, étape ${step} : scène atténuée`);
      assert.equal(sceneZone.innerHTML, SCENES[t.id].wall);
    }
    S.step = 4; PAGE.lire("renderCreator")();
    assert.equal(sceneZone.className, `scene-${t.id}`, `${t.name}, aperçu : scène entière, comme pour la personne invitée`);
    const h = app(), pv = h.slice(h.indexOf('class="pv-stage"'));
    assert.ok(h.includes('class="pv-stage"'), `${t.name} : l'aperçu montre la scène`);
    assert.ok(pv.includes(`<div class="scene-sign anim-n" aria-hidden="true">${SCENES[t.id].sign}</div>`), `${t.name} : élément vedette identique`);
    assert.ok(pv.indexOf("scene-sign") < pv.indexOf('class="ticket'), `${t.name} : élément vedette au-dessus du billet`);
    assert.ok(/<svg width="100%" height="100%"[^>]*><defs><pattern id="s\d+-sc-/.test(pv) || pv.includes('<rect class="sc-bg"'), `${t.name} : décor de fond dans l'aperçu`);
  }
  PAGE.lire("renderHistory")(); assert.equal(sceneZone.innerHTML, "", "pas de scène sur « Mes invitations »");
  const tpl = PAGE.lire("TEMPLATES").find(x => x.theme === "monanniv");
  Object.assign(S, { step: 1 }); PAGE.lire("applyTemplate")(tpl.id); S.step = 2; PAGE.lire("renderCreator")();
  assert.equal(sceneZone.className, "scene-monanniv dim", "le modèle choisi change aussitôt la scène");
  S.theme = "mystere"; S.step = 4; PAGE.lire("renderCreator")();
  assert.equal(sceneZone.className, "scene-mystere", "le thème choisi change aussitôt la scène");
  assert.ok(PAGE.lire("bindCreator").toString().includes('on("[data-th]"'), "le choix du thème réaffiche l'écran");
});
await test("Création : scène atténuée lisible (texte et texte atténué ≥ 4,5:1)", () => {
  const a = +(regleCSS("#scene.dim svg").match(/opacity:([\d.]+)/) || [])[1];
  assert.ok(a > 0 && a <= .5, `opacité de la scène atténuée : ${a}`);
  assert.ok(regleCSS("#scene").includes("background:var(--bg)"), "la scène atténuée se fond dans --bg");
  const mix = (f, c) => "#" + [1, 3, 5].map(i => Math.round(parseInt(f.slice(i, i + 2), 16) * (1 - a) + parseInt(c.slice(i, i + 2), 16) * a).toString(16).padStart(2, "0")).join("").toUpperCase();
  for(const t of L.THEMES){ const v = THEME_CSS[t.id];
    for(const c of ["bg", "soft", "surface"]){ exige(`${t.name} : encre sur --${c} atténué`, v.ink, mix(v.bg, v[c]), 4.5); exige(`${t.name} : texte atténué sur --${c} atténué`, v.muted, mix(v.bg, v[c]), 4.5); }
  }
});
await test("Miniatures : une par carte de catégorie et de modèle, immobiles, identifiants uniques", () => {
  const S = PAGE.lire("S"), CATS = PAGE.lire("HOME_CATS"), TPL = PAGE.lire("TEMPLATES");
  const minis = h => [...h.matchAll(/<span class="mini" data-theme="([a-z]+)">/g)].map(m => m[1]);
  const uniques = (nom, h) => { const ids = [...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length, `${nom} : identifiant en double`); };
  const home = PAGE.lire("homeHTML")();
  assert.deepEqual(minis(home.slice(home.indexOf('class="home-cards"'))), CATS.map(c => c.theme), "accueil : une miniature par catégorie");
  for(const c of CATS) assert.equal(TPL.find(t => t.cat === c.cat && !PAGE.lire("SEASONS")[t.occ]).theme, c.theme, `${c.cat} : miniature du thème de son premier modèle`);
  uniques("accueil", home);
  for(const c of CATS){
    Object.assign(S, { step: 1, tplCat: c.cat, link: "" }); PAGE.lire("renderCreator")();
    const h = PAGE.zones["#app"].innerHTML, liste = PAGE.lire("catTemplates")(c.cat);
    assert.deepEqual(minis(h), [...liste.map(t => t.theme), "base"], `${c.cat} : une miniature par modèle, et « Partir de zéro »`);
    assert.ok(h.includes('data-tpl="zero"'), `${c.cat} : « Partir de zéro » visible`);
    assert.ok(!/anim-[nd]/.test(h.slice(h.indexOf('class="tpls"'))), `${c.cat} : miniatures immobiles`);
    uniques(`modèles ${c.cat}`, h);
  }
  assert.ok(CSS.includes(":root,[data-theme]{"), "chaque miniature garde les couleurs de son thème dans une page d'un autre thème (Mystère compris)");
});
await test("Choisis un modèle : pas de filtre « Tous », Amour par défaut, catégorie de l'accueil", () => {
  const S = PAGE.lire("S");
  Object.assign(S, { step: 1, tplCat: "Tous" }); PAGE.lire("renderCreator")();
  const h = PAGE.zones["#app"].innerHTML;
  assert.ok(!h.includes('data-cat="Tous"'), "filtre « Tous » retiré");
  assert.ok(h.includes('data-cat="Amour" aria-pressed="true"'), "Amour ouvert par défaut");
  assert.ok(/<button type="button" class="chip" data-cat="Famille" aria-pressed="false">/.test(h), "filtres : vrais boutons, accessibles au clavier");
  const src = PAGE.lire("bindCreator").toString(), demo = PAGE.lire("bindDemoTicket").toString();
  assert.ok(src.includes("S.tplCat=b.dataset.home; go(1)"), "carte de l'accueil : sa catégorie");
  assert.ok(demo.includes('S.tplCat="Amour"') && !/Tous/.test(src + demo), "sinon Amour");
});
await test("Scène de l'accueil : ton sur ton, légère, immobile, version simplifiée sur téléphone", () => {
  const H = PAGE.lire("HOME_SCENE");
  assert.ok(H.length < 8000, `scène de l'accueil trop lourde (${H.length} caractères)`);
  assert.ok(!/<image|href="http|url\(http|data:image|(fill|stroke)="#|style="|<animate|<set\b/.test(H), "ni image, ni couleur écrite, ni animation SVG");
  const classes = new Set([...H.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(" ")));
  for(const c of classes) assert.ok(/^(sc-(bg|a|b|out|line|dash|speck-[ld])|hs-(wide|tint))$/.test(c), `classe « ${c} » dans la scène de l'accueil (ton sur ton seulement)`);
  for(const m of H.matchAll(/transform="scale\(([\d.]+)\)"/g)) assert.ok(+m[1] <= 1 || H.includes('vector-effect="non-scaling-stroke" transform="scale(' + m[1]), "trait agrandi au-delà de 2 px");
  for(const mot of ["sc-courrier", "hs-wide", "hs-tint", "M0-78v-32a34 26"]) assert.ok(H.includes(mot), `élément manquant : ${mot}`);
  const hors = H.replace(/<g class="hs-wide">[\s\S]*?<\/g><svg x="74%"/, "");
  assert.ok(hors.includes("M0-78v-32a34 26") && !hors.includes('x="90%"'), "téléphone : boîte aux lettres gardée, éléments des côtés retirés");
  assert.ok(/@media \(max-width:640px\)\{#scene \.hs-wide\{display:none\}\}/.test(CSS), "éléments des côtés masqués sur téléphone");
  for(const sel of [".sc-dash", ".hs-tint", "#scene.tinted .hs-tint"]) assert.ok(!/animation\s*:/.test(regleCSS(sel)), `${sel} : aucune animation`);
  const h = PAGE.lire("homeHTML")();
  assert.ok(h.indexOf("demo-ticket") < h.indexOf("home-cards") && !/scene-sign/.test(h), "le mini-billet reste l'élément principal");
});
await test("Scène de l'accueil : couleur de la catégorie au survol, au focus et au toucher, textes lisibles", () => {
  const a = +(regleCSS("#scene.tinted .hs-tint").match(/opacity:([\d.]+)/) || [])[1];
  assert.ok(a > 0 && a <= .2, `opacité du voile : ${a}`);
  assert.ok(regleCSS(".hs-tint").includes("fill:var(--tint,none)") && regleCSS(".hs-tint").includes("opacity:0"), "voile invisible au repos");
  assert.ok(CSS.includes("#scene.tinted .sc-line,#scene.tinted .sc-out{stroke:var(--tint)}"), "contours fins à la couleur de la catégorie (aucun texte ne repose dessus)");
  const mix = (f, c) => "#" + [1, 3, 5].map(i => Math.round(parseInt(f.slice(i, i + 2), 16) * (1 - a) + parseInt(c.slice(i, i + 2), 16) * a).toString(16).padStart(2, "0")).join("").toUpperCase();
  for(const cat of PAGE.lire("HOME_CATS")){
    const teinte = L.THEMES.find(t => t.id === cat.theme).a;
    for(const t of L.THEMES){ const v = THEME_CSS[t.id];
      for(const c of ["bg", "soft", "surface"]){
        exige(`${t.name}, voile ${cat.cat} : encre sur --${c}`, v.ink, mix(v[c], teinte), 4.5);
        exige(`${t.name}, voile ${cat.cat} : texte atténué sur --${c}`, v.muted, mix(v[c], teinte), 4.5);
      }
    }
  }
  const src = PAGE.lire("bindCreator").toString();
  for(const ev of ["pointerenter", "pointerleave", "focus", "blur", "touchstart"]) assert.ok(src.includes(`"${ev}"`), `carte de catégorie : ${ev}`);
  assert.ok(PAGE.lire("tintScene").toString().includes('"scene-home"'), "voile seulement sur la scène de l'accueil");
});
await test("Accueil : plus de bloc « Privé par conception », lien « Confidentialité » vers les mentions légales", () => {
  const h = PAGE.lire("homeHTML")();
  assert.ok(!/privacy|Privé par conception/.test(h), "bloc retiré");
  const S = PAGE.lire("S"); Object.assign(S, { step: "home" }); PAGE.lire("renderCreator")();
  const app = PAGE.zones["#app"].innerHTML;
  assert.ok(app.includes(`<a href="/mentions-legales.html#confidentialite">Confidentialité</a>`) && app.includes("© 2026 Ose Demander — Rien n'est stocké en clair en ligne."), "pied de page : « Confidentialité » et la phrase du bas");
  assert.ok(!/\.privacy/.test(CSS), "styles du bloc retirés");
  const ml = readFileSync(RACINE + "mentions-legales.html", "utf8"), sec = ml.slice(ml.indexOf('id="confidentialite"'), ml.indexOf('id="donnees"'));
  assert.ok(sec.length > 100, "section #confidentialite des mentions légales");
  for(const idee of ["tient dans son lien", "Pas de compte", "reste sur votre appareil"]) assert.ok(sec.includes(idee), `section Confidentialité : « ${idee} »`);
  assert.ok(!/pas de serveur|aucun serveur|sans serveur/i.test(sec), "formulations qui resteront vraies avec un serveur de liens courts chiffrés");
});
await test("Scènes : immobiles en animations « Aucune » et avec « moins de mouvement »", () => {
  ouvrir(INV({ th: "fete", an: "0" })); PAGE.lire("renderEnvelope")();
  assert.ok(PAGE.zones["#app"].innerHTML.includes('class="scene-sign anim-0"'));
  for(const [sel, decl] of reglesScene) if(/animation\s*:/.test(decl)) assert.ok(/\.anim-(n|d)\b/.test(sel), `${sel} : animation hors des niveaux Normales / Discrètes`);
  assert.ok(!/<animate|<set\b/.test(Object.values(SCENES).map(s => s.wall + s.sign).join("")), "pas d'animation SVG interne (incontrôlable)");
  assert.ok(CSS.includes("@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}"), "règle globale « moins de mouvement »");
});
await test("Textes des éléments vedettes : tutoiement, neutres, sans flèche ni « · »", () => {
  const textes = Object.values(SCENES).flatMap(s => [...s.sign.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(m => m[1].replace(/<[^>]+>/g, "")));
  assert.ok(textes.length >= 8);
  for(const t of textes){
    assert.ok(!/[→←]| · /.test(t), `« ${t} » : flèche ou « · »`);
    assert.ok(!/(?<![-\p{L}])(vous|votre|vos)(?![-\p{L}])/iu.test(t), `« ${t} » : vouvoiement`);
    assert.ok(!/·|\(e\)|\b(ravie?|prête?|invitée?)\b/i.test(t), `« ${t} » : formulation genrée`);
  }
});

/* =========================================================
   10. Saisons : occasions proposées à la création seulement pendant leur période, chaque année
   ========================================================= */
titre("10. Saisons");
const SAISONS = PAGE.lire("SEASONS"), fenetre = PAGE.lire("seasonWindow"), saisonA = PAGE.lire("seasonAt"), ouverte = PAGE.lire("seasonOpen");
const jourJ = (f, y) => PAGE.lire("isoDay")(f(y));
const decale = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
await test("Pâques : dates connues (calendrier grégorien)", () => {
  const paques = { 2000: "2000-04-23", 2008: "2008-03-23", 2011: "2011-04-24", 2019: "2019-04-21", 2024: "2024-03-31", 2025: "2025-04-20",
    2026: "2026-04-05", 2027: "2027-03-28", 2028: "2028-04-16", 2038: "2038-04-25", 2285: "2285-03-22" };
  for(const [y, d] of Object.entries(paques)) assert.equal(jourJ(PAGE.lire("easter"), +y), d, `Pâques ${y}`);
});
await test("Fête des mères (repoussée si Pentecôte) et fête des pères", () => {
  const meres = { 2009: "2009-06-07", 2020: "2020-06-07", 2024: "2024-05-26", 2025: "2025-05-25", 2026: "2026-05-31", 2027: "2027-05-30", 2028: "2028-05-28" };
  for(const [y, d] of Object.entries(meres)) assert.equal(jourJ(PAGE.lire("mothersDay"), +y), d, `fête des mères ${y}`);
  const peres = { 2024: "2024-06-16", 2025: "2025-06-15", 2026: "2026-06-21", 2027: "2027-06-20" };
  for(const [y, d] of Object.entries(peres)) assert.equal(fenetre("peres", +y).day, d, `fête des pères ${y}`);
});
await test("Périodes attendues (dont deux années à cheval et dates variables)", () => {
  const attendu = [
    ["galette", 2027, "2026-12-15", "2027-01-31"], ["valentin", 2027, "2027-01-01", "2027-02-28"], ["valentin", 2028, "2028-01-01", "2028-02-29"],
    ["paques", 2027, "2027-02-28", "2027-04-04"], ["paques", 2026, "2026-03-08", "2026-04-12"],
    ["meres", 2027, "2027-05-01", "2027-06-06"], ["meres", 2020, "2020-05-01", "2020-06-14"], ["peres", 2027, "2027-05-15", "2027-06-27"],
    ["musique", 2027, "2027-06-01", "2027-06-30"], ["halloween", 2026, "2026-10-01", "2026-11-05"],
    ["noel", 2026, "2026-11-01", "2026-12-31"], ["reveillon", 2026, "2026-12-01", "2027-01-10"]
  ];
  for(const [id, y, from, to] of attendu){ const w = fenetre(id, y); assert.deepEqual([w.from, w.to], [from, to], `${id} ${y}`); }
});
await test("Premier et dernier jour inclus, veille et lendemain exclus, de 2000 à 2100", () => {
  for(const id of Object.keys(SAISONS)) for(let y = 2000; y <= 2100; y++){
    const w = fenetre(id, y);
    assert.ok(w.from <= w.day && w.day <= w.to, `${id} ${y} : le jour J est dans la période`);
    assert.ok(saisonA(id, w.from) && saisonA(id, w.to) && saisonA(id, w.day), `${id} ${y} : ouverte du ${w.from} au ${w.to}`);
    assert.ok(!saisonA(id, decale(w.from, -1)) && !saisonA(id, decale(w.to, 1)), `${id} ${y} : fermée la veille et le lendemain`);
  }
});
await test("Années bissextiles et chevauchement de deux années", () => {
  const cas = [
    ["valentin", "2028-02-29", true], ["valentin", "2028-03-01", false], ["valentin", "2027-02-28", true], ["valentin", "2027-03-01", false],
    ["valentin", "2100-02-28", true], ["valentin", "2100-03-01", false], ["valentin", "2026-12-31", false],
    ["galette", "2026-12-14", false], ["galette", "2026-12-15", true], ["galette", "2027-01-01", true], ["galette", "2027-01-31", true], ["galette", "2027-02-01", false],
    ["reveillon", "2026-11-30", false], ["reveillon", "2026-12-31", true], ["reveillon", "2027-01-01", true], ["reveillon", "2027-01-10", true], ["reveillon", "2027-01-11", false],
    ["noel", "2026-12-31", true], ["noel", "2027-01-01", false], ["halloween", "2026-11-05", true], ["halloween", "2026-11-06", false]
  ];
  for(const [id, iso, ok] of cas) assert.equal(!!saisonA(id, iso), ok, `${id} le ${iso}`);
  assert.equal(saisonA("reveillon", "2027-01-05").day, "2026-12-31", "réveillon de janvier : celui du 31 décembre précédent");
  assert.equal(saisonA("galette", "2026-12-20").day, "2027-01-06", "galette de décembre : celle du 6 janvier suivant");
});
await test("Occasions ouvertes selon la date du jour ; permanentes toute l'année", () => {
  const ouvertes = iso => Object.keys(SAISONS).filter(id => saisonA(id, iso)).sort();
  assert.deepEqual(ouvertes("2026-10-15"), ["halloween"]);
  assert.deepEqual(ouvertes("2026-11-03"), ["halloween", "noel"]);
  assert.deepEqual(ouvertes("2027-01-05"), ["galette", "reveillon", "valentin"]);
  assert.deepEqual(ouvertes("2026-08-15"), []);
  for(const id of ["date", "annivamour", "couple", "grands", "annivfam", "sortie", "annivami", "temoin", "surprise", "pardon", "juste", "libre"])
    for(const iso of ["2026-01-01", "2026-08-15", "2026-12-31"]) assert.ok(ouverte(id, iso), `${id} : permanente`);
  assert.ok(!SAISONS.grands, "la fête des grands-parents reste permanente");
});
await test("Le décodage des liens ne dépend jamais de la date", () => {
  for(const nom of ["sanitize", "unpackLink", "packLink", "decodeLink"]){
    let src = ""; try{ src = PAGE.lire(nom).toString(); }catch(e){ continue; }
    assert.ok(!/season|SEASONS|todayISO\(\)/.test(src), `${nom} ne doit pas regarder la date du jour`);
  }
});

await test("Création selon la date : modèles, descriptions, occasions, emojis", () => {
  const S = PAGE.lire("S"), cat = c => PAGE.lire("catTemplates")(c).map(t => t.id), desc = PAGE.lire("catDesc");
  const le = iso => PAGE.ecrire("SEASON_TODAY", iso);
  le("2026-08-15");
  assert.deepEqual(cat("Amour"), ["rdv", "annivamour", "couple", "weekend", "dinerspecial"], "août : pas de Saint-Valentin");
  assert.deepEqual(cat("Famille"), ["annivfam", "nouvelle", "parrain", "babyshower", "repasfam"], "août : ni fête des mères ni fête des pères");
  assert.equal(desc("Amour"), "Rendez-vous, anniversaire de mon amour, couple");
  assert.equal(desc("Famille"), "Anniversaire en famille, grande nouvelle, parrain ou marraine");
  assert.ok(PAGE.lire("catTemplates")("Amour", "valentin").some(t => t.id === "valentin"), "modèle choisi gardé après la fin de sa saison");
  le("2027-01-20");
  assert.deepEqual(cat("Amour"), ["valentin", "rdv", "annivamour", "couple", "weekend", "dinerspecial"], "janvier : Saint-Valentin en tête");
  assert.equal(desc("Amour"), "Saint-Valentin, rendez-vous, anniversaire de mon amour");
  le("2027-05-20");
  assert.deepEqual(cat("Famille"), ["meres", "peres", "annivfam", "nouvelle", "parrain", "babyshower", "repasfam"], "mai : jour J le plus proche d'abord");
  le("2026-08-15");
  Object.assign(S, { step: 4, occ: "date", tpl: "rdv", from: "Alex", to: "Sam", link: "", moreOpen: true, open: new Set(["occ", "style"]) });
  PAGE.lire("renderCreator")();
  let h = PAGE.zones["#app"].innerHTML;
  assert.ok(!/data-occ="(valentin|meres|peres)"/.test(h) && h.includes('data-occ="annivfam"') && h.includes('data-occ="date"'), "occasions hors saison masquées, permanentes gardées");
  S.occ = "valentin"; PAGE.lire("renderCreator")(); h = PAGE.zones["#app"].innerHTML;
  assert.ok(h.includes('data-occ="valentin" aria-pressed="true"'), "occasion déjà choisie gardée");
  const ouvert = PAGE.lire("emojiOpen");
  assert.ok(ouvert("🌹") && ouvert("🌷") && ouvert("👔"), "emojis déjà proposés toute l'année : gardés");
  assert.ok(!ouvert("🎃") && !ouvert("🎄"), "août : emojis de saison masqués");
  le("2026-10-15"); assert.ok(ouvert("🎃") && !ouvert("🎄"));
  le("2026-12-20"); assert.ok(ouvert("🎄") && ouvert("🥂") && ouvert("👑") && !ouvert("🎃"));
  Object.assign(S, { step: "home", occ: "juste", tpl: "", moreOpen: false, open: new Set() });
  le("2026-10-15");
});
await test("Bandeau de saison : une seule occasion, la plus proche, textes selon le jour J", () => {
  const le = iso => PAGE.ecrire("SEASON_TODAY", iso), home = () => PAGE.lire("homeHTML")();
  le("2026-08-15"); assert.ok(!home().includes('class="season"'), "août : pas de bandeau");
  const cas = [["2027-01-20", "valentin", "Bientôt la Saint-Valentin"], ["2027-02-14", "valentin", "C'est la Saint-Valentin aujourd'hui"],
    ["2027-02-20", "valentin", "Il est encore temps de la fêter"], ["2027-05-20", "meres", "Bientôt la fête des mères"], ["2027-06-10", "peres", "Bientôt la fête des pères"]];
  for(const [iso, id, txt] of cas){
    le(iso); const h = home();
    assert.equal((h.match(/class="season"/g) || []).length, 1, `${iso} : un seul bandeau`);
    assert.ok(h.includes(`data-season="${id}"`) && h.includes(`${txt.replace(/'/g, "&#39;")} <span aria-hidden="true">`), `${iso} : ${txt}`);
    assert.deepEqual(principales(h), ["Oui"], `${iso} : le Oui reste la seule action principale`);
    assert.ok(h.indexOf("demo-ticket") < h.indexOf('class="season"') && h.indexOf('class="season"') < h.indexOf("home-cards"), "sous le mini-billet, avant les cartes");
  }
  for(const s of Object.values(PAGE.lire("SEASONS"))) for(const t of s.ban) assert.ok(!/[→←]| · /.test(t) && t.length <= 60, `texte du bandeau : ${t}`);
  assert.ok(PAGE.lire("bindCreator").toString().includes('$$("[data-season]")'), "le bouton ouvre le modèle");
  le("2026-10-15");
});

await test("Thèmes de saison : proposés en période, toujours affichés dans une invitation reçue, décor complet", () => {
  const S = PAGE.lire("S"), SAIS = PAGE.lire("SEASONS"), DECOR = PAGE.lire("DECOR"), le = iso => PAGE.ecrire("SEASON_TODAY", iso);
  const style = () => { Object.assign(S, { step: 4, from: "Alex", to: "Sam", link: "", moreOpen: true, open: new Set(["style"]) }); PAGE.lire("renderCreator")(); return PAGE.zones["#app"].innerHTML; };
  const saisonniers = L.THEMES.filter(t => t.season);
  assert.ok(saisonniers.length >= 1, "aucun thème de saison");
  for(const t of saisonniers){
    assert.ok(SAIS[t.season], `${t.name} : saison ${t.season} inconnue`);
    const w = fenetre(t.season, 2026), hors = decale(w.to, 1);
    le(hors); S.theme = "base";
    assert.ok(!style().includes(`data-th="${t.id}"`), `${t.name} : masqué à la création hors saison (${hors})`);
    S.theme = t.id; assert.ok(style().includes(`data-th="${t.id}" aria-pressed="true"`), `${t.name} : gardé s'il est déjà choisi`);
    le(w.day); S.theme = "base"; assert.ok(style().includes(`data-th="${t.id}"`), `${t.name} : proposé pendant sa saison`);
    le(hors); ouvrir(INV({ th: t.id })); PAGE.lire("renderEnvelope")();
    assert.equal(sceneZone.className, `scene-${t.id}`, `${t.name} : invitation reçue hors saison, avec son thème`);
  }
  const formes = PAGE.lire("Decor").toString ? readFileSync(RACINE + "index.html", "utf8") : "";
  for(const t of L.THEMES){
    const d = DECOR[t.id]; assert.ok(d, `${t.name} : décor animé manquant`);
    for(const k of [].concat(d.shape, d.burst || [])){
      if(k.startsWith("e:")) assert.equal([...new Intl.Segmenter().segment(k.slice(2))].length, 1, `${t.name} : « ${k} » doit être un seul emoji`);
      else assert.ok(formes.includes(`case "${k}"`), `${t.name} : forme « ${k} » non dessinée`);
    }
    assert.ok(["fall", "break", "pop", "gust", "scatter"].includes(d.react || "fall"), `${t.name} : réaction au Non inconnue`);
  }
  Object.assign(S, { step: "home", theme: "base", moreOpen: false, open: new Set() }); le("2026-10-15");
});

await test("Modèles de saison : catégorie, première position, « De saison », bandeau, disparition hors saison", () => {
  const CATEGORIE = { valentin: "Amour", noel: "Famille", paques: "Famille", meres: "Famille", peres: "Famille",
    halloween: "Amis", reveillon: "Amis", galette: "Amis", musique: "Amis" };
  const TPL = PAGE.lire("TEMPLATES"), SAIS = PAGE.lire("SEASONS"), S = PAGE.lire("S"), le = iso => PAGE.ecrire("SEASON_TODAY", iso);
  assert.deepEqual(Object.keys(CATEGORIE).sort(), Object.keys(SAIS).sort(), "une catégorie prévue pour chaque saison");
  for(const id of Object.keys(SAIS)) assert.ok(TPL.some(t => t.occ === id), `saison ${id} sans modèle`);
  const etape1 = cat => { Object.assign(S, { step: 1, tplCat: cat, tpl: "", link: "" }); PAGE.lire("renderCreator")(); return PAGE.zones["#app"].innerHTML; };
  for(const t of TPL.filter(t => SAIS[t.occ])){
    assert.equal(t.cat, CATEGORIE[t.occ], `${t.label} : catégorie`);
    assert.ok(t.q && t.msg && t.no && t.tone && t.em, `${t.label} : question, message, Non, ton et emoji`);
    assert.equal(t.theme, t.occ, `${t.label} : thème de saison`);
    const o = PAGE.lire("OCC")[t.occ]; assert.equal(o.createTheme || o.theme, t.theme, `${t.label} : l'occasion choisie seule donne aussi le thème de saison`);
    const w = fenetre(t.occ, 2027);
    for(const iso of [w.from, w.day, w.to]){
      le(iso); const h = etape1(t.cat), cartes = [...h.matchAll(/data-tpl="([a-z]+)"/g)].map(m => m[1]);
      const saison = cartes.filter(id => id !== "zero" && SAIS[TPL.find(x => x.id === id).occ]);
      assert.deepEqual(cartes.slice(0, saison.length), saison, `${t.label} le ${iso} : modèles de saison avant les permanents`);
      assert.ok(saison.includes(t.id), `${t.label} le ${iso} : proposé`);
      if(iso === w.day) assert.equal(cartes[0], t.id, `${t.label} : en première position le jour J`);
      const carte = h.slice(h.indexOf(`data-tpl="${t.id}"`), h.indexOf("</button>", h.indexOf(`data-tpl="${t.id}"`)));
      assert.ok(carte.includes('<span class="tpl-tag">De saison</span>'), `${t.label} : étiquette « De saison »`);
    }
    le(w.day);
    assert.equal(PAGE.lire("seasonPick")().t.id, t.id, `${t.label} : le bandeau du jour J ouvre ce modèle`);
    assert.ok(PAGE.lire("homeHTML")().includes(`data-season="${t.id}"`));
    for(const iso of [decale(w.from, -1), decale(w.to, 1)]){
      le(iso);
      assert.ok(!etape1(t.cat).includes(`data-tpl="${t.id}"`), `${t.label} le ${iso} : modèle absent hors saison`);
      assert.ok(!PAGE.lire("homeHTML")().includes(`data-season="${t.id}"`), `${t.label} le ${iso} : pas de bandeau`);
    }
  }
  le("2026-10-15"); const h = etape1("Amis");
  assert.equal((h.match(/class="tpl-tag"/g) || []).length, 1, "seuls les modèles de saison portent l'étiquette");
  const clic = PAGE.lire("bindCreator").toString();
  assert.ok(clic.includes('$$("[data-season]")') && clic.includes("S.tplCat=t.cat; applyTemplate(t.id); go(2);"), "le bandeau ouvre directement le modèle");
  for(const [iso, id] of [["2026-11-03", "noel"], ["2026-12-20", "noel"], ["2026-12-27", "reveillon"], ["2026-10-31", "halloween"], ["2027-05-20", "meres"], ["2027-06-05", "peres"]]){
    le(iso); assert.equal(PAGE.lire("seasonPick")().t.id, id, `${iso} : bandeau ${id} (jour J à venir le plus proche)`);
  }
  le("2026-12-20"); assert.deepEqual(PAGE.lire("catTemplates")("Amis").slice(0, 1).map(t => t.id), ["reveillon"], "décembre : réveillon en tête des Amis");
  le("2027-06-05"); assert.deepEqual(PAGE.lire("catTemplates")("Famille").map(t => t.id), ["peres", "meres", "annivfam", "nouvelle", "parrain", "babyshower", "repasfam"], "juin : fête des pères (à venir) avant fête des mères (passée)");
  Object.assign(S, { step: "home", tplCat: "Amour", tpl: "" }); le("2026-10-15");
});

await test("Saint-Valentin, fêtes des mères et des pères : anciens liens inchangés, nouveaux avec le thème de saison", async () => {
  const OCC = PAGE.lire("OCC"), enc = PAGE.lire("encodeData"), dec = PAGE.lire("decodeData");
  for(const [occ, ancien] of [["valentin", "amour"], ["meres", "maman"], ["peres", "papa"]]){
    assert.equal(OCC[occ].theme, ancien, `${occ} : thème de décodage inchangé`);
    const base = { f: "Alex", t: "Sam", o: occ, q: OCC[occ].q, n: "fuit", c: "any", a: { v: "s" }, d: "2027-02-14", h: "20:00" };
    const vieux = await enc({ ...base, th: ancien }), neuf = await enc({ ...base, th: occ });
    assert.equal((await dec(vieux)).th, ancien, `${occ} : un lien au thème ${ancien} se rouvre au thème ${ancien}`);
    assert.equal((await dec(neuf)).th, occ, `${occ} : un lien au thème de saison se rouvre au thème de saison`);
    assert.ok(neuf !== vieux, `${occ} : le thème de saison est écrit dans le lien`);
  }
});

await test("Saint-Valentin et fête des mères : cupidons, coupes, mamans ; flèche qui traverse le cœur", () => {
  const DECOR = PAGE.lire("DECOR"), SIGN = PAGE.lire("SCENES").valentin.sign, ouvert = PAGE.lire("emojiOpen"), le = iso => PAGE.ecrire("SEASON_TODAY", iso);
  for(const e of ["e:👼", "e:🥂", "e:💘", "e:🌹"]) assert.ok(DECOR.valentin.shape.includes(e), `Saint-Valentin : ${e} dans le décor animé`);
  for(const e of ["e:🤰", "e:🤱", "e:👩‍👧", "e:💐"]) assert.ok(DECOR.meres.shape.includes(e), `fête des mères : ${e} dans le décor animé`);
  assert.ok(SIGN.includes('class="sg-float sg-cupid"'), "cupidon dessiné sur l'élément vedette");
  const hampe = SIGN.indexOf('<path class="sg-wire" d="M40.0 142.0'), coeur = SIGN.indexOf('<path class="sg-acc sg-out" d="M130 156'), pointe = SIGN.lastIndexOf('<path class="sg-ink sg-out" d="M232.0 40.0');
  assert.ok(hampe >= 0 && coeur > hampe && pointe > coeur, "la hampe passe derrière le cœur, la pointe ressort devant");
  le("2027-02-01"); assert.ok(ouvert("🥂") && ouvert("💘") && !ouvert("🤰"), "février : coupes et cœur fléché proposés");
  le("2026-12-20"); assert.ok(ouvert("🥂") && !ouvert("💘"), "décembre : coupes (réveillon), pas de cœur fléché");
  le("2027-05-20"); assert.ok(ouvert("🤰") && ouvert("🤱") && ouvert("💐"), "mai : emojis maman proposés");
  le("2026-10-15");
});

await test("Saisons qui se chevauchent : même jour J départagé par l'ordre des modèles", () => {
  const ids = Object.keys(SAISONS), ordre = PAGE.lire("seasonOrder");
  // Seule coïncidence possible : fête des pères (3e dimanche de juin) le 21 juin, jour de la fête de la musique
  const egales = [];
  for(let y = 2000; y <= 2100; y++){
    const jours = ids.map(id => [id, fenetre(id, y).day]);
    for(const [i, [a, da]] of jours.entries()) for(const [b, db] of jours.slice(i + 1)) if(da === db) egales.push(`${y}:${[a, b].sort().join("+")}`);
  }
  assert.ok(egales.length > 0 && egales.every(e => e.endsWith(":musique+peres")), `jours J identiques inattendus : ${egales.filter(e => !e.endsWith(":musique+peres")).join(", ")}`);
  assert.ok(egales.includes("2026:musique+peres") && egales.includes("2037:musique+peres"), "21 juin 2026 et 2037 : fête des pères et fête de la musique");
  PAGE.ecrire("SEASON_TODAY", "2037-06-21");
  assert.equal(PAGE.lire("seasonPick")().t.id, "peres", "même jour J : la fête des pères (avant dans la liste des modèles) a le bandeau");
  assert.equal(PAGE.lire("catTemplates")("Amis")[0].id, "musique", "la fête de la musique reste en tête des Amis");
  assert.equal(PAGE.lire("catTemplates")("Famille")[0].id, "peres", "la fête des pères reste en tête de la Famille");
  PAGE.ecrire("SEASON_TODAY", "2026-10-15");
  assert.equal(ordre("2027-01-06", "2027-01-06", "2027-01-01"), 0, "même jour J : égalité, départagée par l'appelant");
  assert.equal(ordre("2027-01-06", "2027-02-14", "2027-01-01"), -1, "à venir : le plus proche d'abord");
  assert.equal(ordre("2026-12-31", "2027-01-06", "2027-01-02"), 1, "un jour J passé après un jour J à venir");
  assert.equal(ordre("2026-12-25", "2026-12-31", "2027-01-08"), 1, "passés : le plus récent d'abord");
  for(const nom of ["catTemplates", "seasonPick"]) assert.ok(/indexOf\(/.test(PAGE.lire(nom).toString()), `${nom} : départage par l'ordre des modèles`);
});

/* =========================================================
   11. Occasions permanentes (liste révisée le 2026-10-16) et ambiances
   ========================================================= */
titre("11. Occasions permanentes et ambiances");
await test("Occasions proposées à la création : liste révisée ; les autres masquées mais toujours décodées", () => {
  const S = PAGE.lire("S"), OCC = PAGE.lire("OCC"), LINK_OCC = PAGE.lire("LINK_OCC"), le = iso => PAGE.ecrire("SEASON_TODAY", iso);
  le("2026-08-15");
  Object.assign(S, { step: 4, occ: "date", tpl: "rdv", from: "Alex", to: "Sam", link: "", moreOpen: true, open: new Set(["occ"]) });
  PAGE.lire("renderCreator")();
  let h = PAGE.zones["#app"].innerHTML;
  const puces = [...h.matchAll(/data-occ="([a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(puces, ["date", "annivamour", "couple", "weekend", "dinerspecial", "annivfam", "nouvelle", "parrain", "babyshower", "repasfam", "monanniv", "temoin", "evc", "cremaillere", "soiree", "voyage", "fetesurprise", "surprise", "voyagesurprise", "libre"], "puces d'occasion en août (sans les saisons)");
  for(const id of ["mariage", "grands", "sortie", "annivami", "pardon", "juste"]){
    assert.ok(!puces.includes(id), `${id} masquée à la création`);
    assert.ok(OCC[id] && Object.values(LINK_OCC).includes(id), `${id} toujours décodée`);
  }
  PAGE.lire("applyTemplate")("zero"); S.step = 4; PAGE.lire("renderCreator")(); h = PAGE.zones["#app"].innerHTML;
  assert.equal(S.occ, "juste", "« Partir de zéro » garde « Juste comme ça » en coulisse");
  assert.ok(!h.includes('data-occ="juste"'), "« Juste comme ça » : jamais en puce, même choisie");
  S.occ = "grands"; PAGE.lire("renderCreator")(); assert.ok(PAGE.zones["#app"].innerHTML.includes('data-occ="grands" aria-pressed="true"'), "occasion masquée déjà choisie : gardée");
  const tpl = c => PAGE.lire("catTemplates")(c).map(t => t.id);
  assert.deepEqual([tpl("Amour"), tpl("Famille"), tpl("Amis"), tpl("Surprise")], [["rdv", "annivamour", "couple", "weekend", "dinerspecial"], ["annivfam", "nouvelle", "parrain", "babyshower", "repasfam"], ["monanniv", "temoin", "evc", "cremaillere", "soiree", "voyage"], ["fetesurprise", "mystere", "voyagesurprise"]], "modèles permanents (les 4 lots)");
  const TPL = PAGE.lire("TEMPLATES");
  assert.equal(TPL.find(t => t.id === "couple").label, "Notre anniversaire de couple");
  assert.equal(TPL.find(t => t.id === "mystere").label, "Une journée surprise");
  assert.ok(!TPL.some(t => ["grands", "anniv", "diner"].includes(t.id)) && !TPL.some(t => ["sortie", "annivami", "grands", "pardon"].includes(t.occ)), "anciens modèles retirés");
  assert.equal(TPL.find(t => t.id === "soiree").occ, "soiree", "« Une soirée » : nouvelle occasion, plus « Une sortie entre amis »");
  Object.assign(S, { step: "home", occ: "juste", tpl: "", moreOpen: false, open: new Set() }); le("2026-10-15");
});
await test("Ambiances : occasions existantes au thème de décodage inchangé, nouvelles nées avec leur thème", async () => {
  const OCC = PAGE.lire("OCC"), TPL = PAGE.lire("TEMPLATES"), enc = PAGE.lire("encodeData"), dec = PAGE.lire("decodeData");
  for(const [occ, ancien, ambiance] of [["date", "amour", "date"], ["annivfam", "fete", "annivfam"], ["temoin", "amis", "temoin"], ["annivamour", "amour", "annivamour"], ["couple", "amour", "couple"], ["surprise", "mystere", "journeesurprise"]]){
    assert.equal(OCC[occ].theme, ancien, `${occ} : thème de décodage inchangé`);
    assert.equal(OCC[occ].createTheme, ambiance, `${occ} : ambiance à la création`);
    const base = { f: "Alex", t: "Sam", o: occ, q: OCC[occ].q, n: "fuit", c: "any", a: { v: "s" }, d: "2027-02-14", h: "20:00" };
    assert.equal((await dec(await enc({ ...base, th: ancien }))).th, ancien, `${occ} : ancien lien inchangé`);
    assert.equal((await dec(await enc({ ...base, th: ambiance }))).th, ambiance, `${occ} : nouveau lien avec l'ambiance`);
  }
  for(const occ of ["monanniv", "fetesurprise", "weekend", "dinerspecial", "nouvelle", "parrain", "babyshower", "repasfam", "evc", "cremaillere", "soiree", "voyage", "voyagesurprise"]) assert.equal(OCC[occ].theme, occ, `${occ} : née avec son ambiance`);
  for(const t of TPL.filter(t => ["rdv", "annivfam", "monanniv", "temoin", "fetesurprise", "annivamour", "couple", "weekend", "dinerspecial", "nouvelle", "parrain", "babyshower", "repasfam", "evc", "cremaillere", "soiree", "voyage", "mystere", "voyagesurprise"].includes(t.id))){
    assert.equal(t.theme, OCC[t.occ].createTheme || OCC[t.occ].theme, `${t.label} : modèle et occasion donnent la même ambiance`);
    assert.ok(L.THEMES.some(x => x.id === t.theme) && PAGE.lire("SCENES")[t.theme] && PAGE.lire("DECOR")[t.theme], `${t.label} : thème, scène et décor`);
  }
  for(const c of PAGE.lire("HOME_CATS")) assert.equal(PAGE.lire("catTemplates")(c.cat).find(t => !PAGE.lire("SEASONS")[t.occ]).theme, c.theme, `${c.cat} : miniature de l'accueil = ambiance du premier modèle`);
});
await test("Introductions : 2 cartes par occasion gardée (permanente ou de saison), courtes, tutoyées, neutres", () => {
  const I = PAGE.lire("INTROS"), IO = PAGE.lire("INTRO_OCC");
  assert.deepEqual(Object.keys(I), ["date", "annivamour", "couple", "weekend", "dinerspecial", "annivfam", "nouvelle", "parrain", "babyshower", "repasfam",
    "monanniv", "temoin", "evc", "cremaillere", "soiree", "voyage", "fetesurprise", "surprise", "voyagesurprise",
    "halloween", "noel", "reveillon", "galette", "valentin", "paques", "meres", "peres", "musique"]);
  for(const [o, c] of Object.entries(IO)){
    assert.ok(PAGE.lire("OCC")[o], `${o} : occasion inconnue`);
    assert.deepEqual(I[o], L.LINK_INTRO[c], `${o} : cartes du code ${c}`);
  }
  for(const t of PAGE.lire("TEMPLATES")) assert.ok(IO[t.occ], `${t.label} : introduction enregistrée (modèles de saison compris)`);
  for(const [id, cartes] of Object.entries(I)){
    assert.equal(cartes.length, 2, `${id} : deux cartes`);
    for(const c of cartes){
      assert.ok(c.length <= 50, `${id} : « ${c} » trop long`);
      assert.ok(!/[→←]| · |(?<![-\p{L}])(vous|votre|vos)(?![-\p{L}])|\b(prête?|invitée?|ravie?)\b/iu.test(c), `${id} : « ${c} »`);
    }
  }
});

/* =========================================================
   12. Introduction scénarisée (cartes après l'enveloppe)
   ========================================================= */
titre("12. Introduction scénarisée");
const avecIntro = (ix = 1, extra = {}) => INV({ ix, ...extra });
const ecranIntro = d => { ouvrir(d); PAGE.lire("renderIntro")(); return PAGE.zones["#app"].innerHTML; };
await test("Écran des cartes : titre focalisable, une seule action principale, « Passer » de 44 px", () => {
  PAGE.vus.length = 0;
  const h = ecranIntro(avecIntro(1));
  assert.match(h, /<h1 class="intro-text" tabindex="-1">J&#39;ai une idée derrière la tête…<\/h1>/, "première carte en titre focalisable");
  assert.ok(PAGE.vus.includes(".intro-text"), "le focus va à la première carte");
  assert.deepEqual(principales(h), ["La suite"]);
  assert.ok(h.includes('id="introSkip"') && h.includes(">Passer</button>"), "bouton « Passer »");
  assert.ok(+(regleCSS(".intro-skip").match(/min-height:(\d+)px/) || [])[1] >= 44, "« Passer » : 44 px au moins");
  assert.ok(/data-card="1" aria-hidden="true"/.test(h), "la carte suivante est cachée aux lecteurs d'écran");
  assert.ok(regleCSS(".intro-card.under .intro-text").includes("opacity:0"), "la carte suivante ne se lit pas par transparence");
  assert.ok(h.includes(PAGE.lire("SAFETY")), "mention anti-phishing");
  assert.ok(!/[←→]| · /.test(h), "ni flèche ni « · »");
});
await test("Cartes : le prénom remplace {pour}, échappé", () => {
  ouvrir(avecIntro(1, { t: "<b>Sam</b>" }));
  const t = PAGE.lire("introText")("Coucou {pour}, {pour} !");
  assert.equal(t, "Coucou &lt;b&gt;Sam&lt;/b&gt;, &lt;b&gt;Sam&lt;/b&gt; !");
});
await test("Chaque code d'introduction s'affiche (thème de son occasion), cartes courtes", () => {
  const IO = PAGE.lire("INTRO_OCC"), OCC = PAGE.lire("OCC");
  for(const [o, c] of Object.entries(IO)){
    const h = ecranIntro(avecIntro(c, { o, th: OCC[o].createTheme || OCC[o].theme }));
    for(const carte of L.LINK_INTRO[c]) assert.ok(h.includes(PAGE.lire("esc")(carte)), `${o} : « ${carte} » affichée`);
    assert.equal((h.match(/class="intro-card/g) || []).length, L.LINK_INTRO[c].length, `${o} : une carte par texte`);
  }
});
await test("Enveloppe : introduction si le lien en a une, sinon directement la question", () => {
  const src = PAGE.lire("renderEnvelope").toString();
  assert.ok(src.includes("D.ix ? renderIntro : renderInvite"));
});
await test("Le délai du vrai refus démarre à la question, pas pendant l'introduction", () => {
  const src = PAGE.lire("renderIntro").toString() + PAGE.lire("introNext").toString();
  assert.ok(!src.includes("refuseTimer") && !src.includes("showRefuseLink"), "aucune minuterie de refus dans l'introduction");
  assert.ok(src.includes("renderInvite()"), "« Passer » et la dernière carte mènent à la question");
  assert.ok(PAGE.lire("renderInvite").toString().includes("refuseTimer=setTimeout(showRefuseLink, REFUSE_DELAY)"));
});
await test("Trois niveaux d'animation : classe de l'écran, affichage direct en « Aucune »", () => {
  for(const an of ["n", "d", "0"]) assert.ok(ecranIntro(avecIntro(1, { an })).includes(`class="intro-screen anim-${an}"`), `niveau ${an}`);
  assert.ok(PAGE.lire("introNext").toString().includes('invAnim()==="0") top.remove()'), "« Aucune » : la carte disparaît sans attendre");
  assert.ok(regleCSS(".intro-screen.anim-0 .intro-card,.intro-screen.anim-0 .intro-text").includes("transition:none"), "« Aucune » : aucune transition");
  assert.ok(!/\.intro-screen\.anim-0[^{]*\{[^}]*animation:(?!none)/.test(CSS), "« Aucune » : aucune animation");
});
await test("Rappel d'agenda : jamais d'introduction (directement la carte)", () => {
  const src = PAGE.lire("route").toString();
  assert.ok(src.includes("if(D.rv){ Sound.init(); renderReminder(); } else renderEnvelope();"));
});
await test("Création : introduction activée avec un modèle, absente en partant de zéro, désactivable", async () => {
  const S = PAGE.lire("S"), app = PAGE.lire("applyTemplate"), lien = PAGE.lire("buildLink"), dec = PAGE.lire("decodeData");
  const lire = async () => { const u = await lien(); return dec(u.slice(u.indexOf("#i=") + 3)); };
  Object.assign(S, { from: "Alex", to: "Sam", date: "2027-10-31", time: "20:00", choose: false, mode: "one" });
  app("halloween"); assert.equal((await lire()).ix, 20, "Halloween : code 20");
  app("rdv"); assert.equal((await lire()).ix, 1, "Proposer un date : code 1");
  S.intro = false; assert.equal((await lire()).ix, undefined, "désactivée : rien dans le lien");
  app("zero"); assert.equal((await lire()).ix, undefined, "partir de zéro : pas d'introduction");
  S.occ = "libre"; S.occFree = "Fête"; S.intro = true; assert.equal((await lire()).ix, undefined, "occasion sans introduction : rien dans le lien");
  app("rdv"); Object.assign(S, { step: 4, link: "" }); PAGE.lire("renderCreator")();
  const h = PAGE.zones["#app"].innerHTML;
  assert.ok(h.includes('id="intro" checked') && h.includes("Montrer deux cartes avant la question"), "case à cocher dans « Les mots »");
  assert.ok(h.includes("<b>Introduction</b><span>« J&#39;ai une idée derrière la tête… » puis « Et elle te concerne. »</span>"), "récapitulatif");
  Object.assign(S, { step: "home", occ: "juste", tpl: "", intro: false });
});
await test("« Voir un exemple » montre l'introduction", () => {
  assert.equal(PAGE.lire("demoData")().ix, PAGE.lire("INTRO_OCC").date);
});

/* =========================================================
   13. Logo de saison : décor du « ? » et icône de l'onglet pendant les grands événements
   ========================================================= */
titre("13. Logo de saison");
const LOGO = PAGE.lire("LOGO_PERIODS"), logoA = PAGE.lire("logoAt"), logoH = PAGE.lire("logoHTML"), fav = PAGE.lire("logoFavicon"), fenLogo = PAGE.lire("periodWindow");
await test("Périodes attendues (dates fixes, à cheval sur deux années, Pâques et fêtes calculées)", () => {
  const attendu = [
    ["rose", 2026, "2026-10-01", "2026-10-31"], ["halloween", 2026, "2026-10-20", "2026-11-05"], ["noel", 2026, "2026-12-01", "2026-12-26"],
    ["reveillon", 2026, "2026-12-27", "2027-01-05"], ["galette", 2027, "2027-01-06", "2027-01-31"], ["valentin", 2027, "2027-02-01", "2027-02-15"],
    ["paques", 2026, "2026-03-29", "2026-04-06"], ["paques", 2027, "2027-03-21", "2027-03-29"], ["paques", 2038, "2038-04-18", "2038-04-26"],
    ["meres", 2026, "2026-05-24", "2026-06-01"], ["meres", 2020, "2020-05-31", "2020-06-08"],
    ["peres", 2026, "2026-06-14", "2026-06-22"], ["peres", 2025, "2025-06-08", "2025-06-16"], ["musique", 2026, "2026-06-15", "2026-06-21"]
  ];
  for(const [id, y, from, to] of attendu){ const w = fenLogo(LOGO[id], y); assert.deepEqual([w.from, w.to], [from, to], `${id} ${y}`); }
});
await test("Mêmes jours J que le calendrier des saisons", () => {
  for(const id of Object.keys(LOGO)) if(SAISONS[id]) for(const y of [2026, 2027, 2038]) assert.equal(fenLogo(LOGO[id], y).day, fenetre(id, y).day, `${id} ${y}`);
});
await test("Premier et dernier jour inclus, veille et lendemain exclus, de 2000 à 2100", () => {
  for(const id of Object.keys(LOGO)) for(let y = 2000; y <= 2100; y++){
    const w = fenLogo(LOGO[id], y);
    assert.ok(logoA(w.from).includes(id) && logoA(w.to).includes(id), `${id} ${y} : ouverte du ${w.from} au ${w.to}`);
    assert.ok(!logoA(decale(w.from, -1)).includes(id) && !logoA(decale(w.to, 1)).includes(id), `${id} ${y} : fermée la veille et le lendemain`);
  }
});
await test("Chevauchements : décors combinés, jamais deux décors à la même place (2000 à 2100)", () => {
  const cas = { "2026-10-19": ["rose"], "2026-10-20": ["rose", "halloween"], "2026-10-31": ["rose", "halloween"], "2026-11-01": ["halloween"],
    "2026-11-06": [], "2026-12-26": ["noel"], "2026-12-27": ["reveillon"], "2027-01-05": ["reveillon"], "2027-01-06": ["galette"],
    "2027-02-15": ["valentin"], "2027-02-16": [], "2026-06-16": ["peres", "musique"], "2020-06-08": ["meres"], "2026-08-15": [] };
  for(const [iso, ids] of Object.entries(cas)) assert.deepEqual(logoA(iso), ids, iso);
  const vus = new Set();
  for(let t = Date.UTC(2000, 0, 1); t <= Date.UTC(2100, 11, 31); t += 864e5){
    const ids = logoA(new Date(t).toISOString().slice(0, 10)); if(ids.length < 2 || vus.has(ids.join())) continue;
    vus.add(ids.join());
    const places = ids.flatMap(id => (LOGO[id].deco || []).map(d => d[0]));
    assert.equal(new Set(places).size, places.length, `${ids.join(" + ")} : deux décors à la même place`);
  }
  assert.ok(vus.has("rose,halloween") && vus.has("peres,musique"), "chevauchements rencontrés");
});
await test("Hors période : le logo habituel, inchangé ; icône de l'onglet habituelle", () => {
  assert.equal(logoH("2026-08-15"), `<a class="logo" href="./">Ose Demander<span class="q">?</span></a>`);
  assert.equal(fav("2026-08-15"), null);
});
await test("Chaque période : décor, texte pour les lecteurs d'écran, icône de l'onglet propre", () => {
  const icones = new Set();
  for(const id of Object.keys(LOGO)){
    const iso = fenLogo(LOGO[id], 2027).day, ids = logoA(iso), h = logoH(iso);
    assert.ok(ids.includes(id), `${id} ouverte le ${iso}`);
    assert.ok(h.includes(`aria-label="Ose Demander, édition ${PAGE.lire("esc")(PAGE.lire("logoName")(ids))}"`), `${id} : texte pour les lecteurs d'écran`);
    for(const [place, art] of LOGO[id].deco || []) assert.ok(h.includes(`class="lg-deco lg-${place} lg-a-${art}" viewBox="${PAGE.lire("LOGO_ART")[art][0]}" aria-hidden="true"`), `${id} : ${art}`);
    assert.equal((h.match(/<svg/g) || []).length, (h.match(/aria-hidden="true" focusable="false"/g) || []).length, `${id} : décors cachés aux lecteurs d'écran`);
    assert.ok(!/[←→]| · /.test(h), `${id} : ni flèche ni « · »`);
    let seul = fenLogo(LOGO[id], 2027).from; while(logoA(seul).join() !== id) seul = decale(seul, 1); // un jour où elle est seule
    const f = fav(seul); assert.ok(f.startsWith("data:image/svg+xml,"), `${id} : icône SVG`); icones.add(f);
  }
  assert.equal(icones.size, Object.keys(LOGO).length, "une icône différente par période");
  for(const f of icones){
    const n = (decodeURIComponent(f).match(/<svg/g) || []).length;
    assert.ok(n === 2 || n === 3, "l'enveloppe, le motif au centre du cachet, au plus un accessoire sur le coin");
  }
});
await test("Chevauchements : l'icône de l'onglet montre l'événement dont le jour J est le plus proche", () => {
  const principal = PAGE.lire("logoMain");
  assert.equal(principal("2026-10-19"), "rose");
  assert.equal(principal("2026-10-25"), "halloween", "fin octobre : Halloween");
  assert.equal(fav("2026-10-25"), fav("2026-11-02"), "même icône qu'Halloween seul");
  assert.equal(principal("2026-06-16"), "peres", "égalité (21 juin) : l'ordre de LOGO_PERIODS");
  assert.equal(principal("2028-06-17"), "peres"); assert.equal(principal("2028-06-20"), "musique");
  assert.equal(principal("2026-08-15"), null);
  assert.ok(logoH("2026-10-25").includes('aria-label="Ose Demander, édition Octobre rose et Halloween"'), "chevauchement : les deux noms");
  assert.ok(logoH("2027-02-10").includes("lg-nodot") && logoH("2026-10-25").includes("lg-nodot") && !logoH("2026-12-10").includes("lg-nodot"), "le point disparaît seulement quand un décor le remplace");
});
await test("Octobre rose : ruban cliquable vers la page de la Ligue contre le cancer, dans un nouvel onglet", () => {
  const h = logoH("2026-10-05");
  assert.ok(h.includes(`<a class="lg-ribbon lg-anim" href="https://www.ligue-cancer.net/nos-missions/le-depistage-du-cancer/depistage-du-cancer-du-sein" target="_blank" rel="noopener noreferrer"`));
  assert.ok(h.includes('aria-label="Octobre rose : s&#39;informer sur le dépistage du cancer du sein (nouvel onglet)"') || h.includes("aria-label=\"Octobre rose : s'informer sur le dépistage du cancer du sein (nouvel onglet)\""));
  assert.ok(h.indexOf("lg-ribbon") > h.indexOf("</a>"), "le ruban est un lien à part (pas un lien dans le lien)");
  assert.ok(+(regleCSS(".lg-ribbon").match(/min-height:(\d+)px/) || [])[1] >= 44, "ruban : 44 px de haut");
  assert.ok(!logoH("2026-11-02").includes("lg-ribbon"), "pas de ruban hors octobre");
});
await test("Animation au survol : absente en « Aucune », coupée par « moins de mouvement »", () => {
  assert.ok(logoH("2026-10-25", true).includes('class="logo lg-anim"'));
  assert.ok(!logoH("2026-10-25", false).includes("lg-anim"), "« Aucune » : pas d'animation");
  assert.ok(/\.lg-anim:hover \.lg-deco[^{]*\{animation:lg-wiggle/.test(CSS), "animation seulement sous .lg-anim");
  assert.ok(!/(^|[\n}])\s*\.lg-(deco|ribbon)[^{]*\{[^}]*animation:/.test(CSS.replace(/\.lg-anim:hover[^{]*\{[^}]*\}/, "")), "aucune animation hors survol");
  assert.ok(CSS.includes("@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}"));
  const S = PAGE.lire("S"); S.anim = "0"; PAGE.ecrire("SEASON_TODAY", "2026-10-25");
  assert.ok(!PAGE.lire("topHTML")(false).includes("lg-anim"), "en-tête : réglage d'animation de l'invitation respecté");
  S.anim = "n"; assert.ok(PAGE.lire("topHTML")(false).includes("édition Octobre rose et Halloween"), "en-tête : logo de la date du jour");
  PAGE.ecrire("SEASON_TODAY", "2026-10-15");
});

/* =========================================================
   14. Enveloppes décorées : décor et cachet selon l'occasion (jamais la date), rien dans le lien
   ========================================================= */
titre("14. Enveloppes décorées");
const DECO = PAGE.lire("ENV_DECO"), sceau = PAGE.lire("sealHTML"), decoEnv = PAGE.lire("envDecoHTML");
const enveloppe = (extra = {}) => { ouvrir(INV(extra)); PAGE.lire("renderEnvelope")(); const h = PAGE.zones["#app"].innerHTML; return h.slice(h.indexOf('class="envelope'), h.indexOf("</button>", h.indexOf('class="envelope'))); };
await test("Les 9 occasions saisonnières ont leur décor ; cachets citrouille, cœur, doré, couronne", () => {
  assert.deepEqual(Object.keys(DECO).sort(), ["galette", "halloween", "meres", "musique", "noel", "paques", "peres", "reveillon", "valentin"]);
  for(const o of Object.keys(DECO)) assert.ok(PAGE.lire("OCC")[o] && SAISONS[o], `${o} : occasion saisonnière`);
  const formes = { halloween: "pumpkin", valentin: "heart", reveillon: "gold", galette: "crown" };
  for(const [o, f] of Object.entries(formes)) assert.ok(enveloppe({ o, th: o }).includes(`class="seal shaped seal-${f} "`), `${o} : cachet ${f}`);
});
await test("Halloween : toiles dans les coins, araignée qui descend du rabat, cachet citrouille", () => {
  const h = enveloppe({ o: "halloween", th: "halloween" });
  assert.equal((h.match(/class="ed-web"/g) || []).length, 2, "deux toiles");
  assert.ok(h.includes('class="ed-thread"') && h.includes('class="ed-spider"'), "araignée au bout de son fil");
  assert.ok(h.includes("seal-pumpkin"));
});
await test("Le décor suit l'occasion, jamais la date du jour", () => {
  const vus = new Set();
  for(const iso of ["2026-10-31", "2027-04-15", "2027-08-15"]){ PAGE.ecrire("SEASON_TODAY", iso); vus.add(enveloppe({ o: "halloween", th: "base" })); }
  PAGE.ecrire("SEASON_TODAY", "2026-10-15");
  assert.equal(vus.size, 1, "même enveloppe toute l'année");
  assert.ok([...vus][0].includes("env-deco"), "décor même avec un autre thème que celui de l'occasion");
});
await test("Occasions sans décor : enveloppe inchangée", () => {
  const h = enveloppe({ o: "date", th: "amour" });
  assert.ok(!h.includes("env-deco") && !h.includes("shaped"));
  assert.ok(h.includes('<span class="seal " aria-hidden="true">A</span>'), "cachet habituel à l'initiale");
  assert.ok(enveloppe({ o: "date", th: "amour", em: "🌹" }).includes('<span class="seal emoji" aria-hidden="true">🌹</span>'), "cachet habituel à l'emoji");
});
await test("Occasions Surprise : enveloppe neutre, cachet 💌 même avec un emoji choisi", () => {
  for(const o of ["fetesurprise", "surprise", "voyagesurprise"]){
    const h = enveloppe({ o, th: "mystere", em: "🎁" });
    assert.ok(h.includes('<span class="seal emoji" aria-hidden="true">💌</span>') && !h.includes("🎁"), `${o} : 💌`);
    assert.ok(!h.includes("env-deco"), `${o} : pas de décor`);
  }
  const tpl = PAGE.lire("TEMPLATES").filter(t => t.cat === "Surprise").map(t => t.occ).sort();
  assert.deepEqual(tpl, [...PAGE.lire("ENV_NEUTRAL")].sort(), "toutes les occasions de la catégorie Surprise");
});
await test("Emoji ou initiale gardés sur le cachet décoré", () => {
  assert.ok(enveloppe({ o: "halloween", th: "halloween", em: "🎃" }).includes('<span class="seal-t">🎃</span>'));
  assert.ok(enveloppe({ o: "valentin", th: "valentin" }).includes('<span class="seal-t">A</span>'));
  assert.ok(sceau("halloween", "", "<").includes('<span class="seal-t">&lt;</span>'), "initiale échappée");
});
await test("Décor : caché aux lecteurs d'écran, sur les bords, effacé à l'ouverture (prénom lisible)", () => {
  for(const o of Object.keys(DECO)){
    const d = decoEnv(o, "n");
    assert.ok(d.startsWith('<svg class="env-deco ed-n" viewBox="0 0 300 200" aria-hidden="true" focusable="false">'), o);
    assert.ok(!/\sid="/.test(d), `${o} : aucun identifiant (pas de doublon possible)`);
    assert.ok(d.length < 4000, `${o} : dessin compact (${d.length} caractères)`);
  }
  assert.ok(regleCSS(".envelope.open .env-deco").includes("opacity:0"), "effacé à l'ouverture");
  assert.ok(regleCSS(".env-deco").includes("pointer-events:none"), "ne gêne pas le toucher de l'enveloppe");
});
await test("Trois niveaux d'animation : classe du calque, rien en « Aucune » ni avec « moins de mouvement »", () => {
  for(const an of ["n", "d", "0"]) assert.ok(enveloppe({ o: "noel", th: "noel", an }).includes(`class="env-deco ed-${an}"`), an);
  assert.ok(!/\.ed-0[^{]*\{[^}]*animation/.test(CSS), "aucune animation en « Aucune »");
  for(const r of CSS.match(/[^}]*\{[^}]*animation:ed-[^}]*\}/g) || []) assert.ok(/\.ed-[nd]\b|\.wiggle|\.beat-d/.test(r), `animation seulement en n ou d : ${r.trim().slice(0, 60)}`);
});
await test("Décors toujours derrière le contenu et transparents aux clics (scènes, cachets, enveloppe, logo)", () => {
  // Le contenu passe au-dessus des couches fixes du décor
  assert.ok(regleCSS(".wrap,.inv").includes("position:relative;z-index:1"), "création et invitation au-dessus du décor");
  for(const sel of [".env-screen", ".intro-screen"]) assert.ok(/position:relative;z-index:1/.test(regleCSS(sel)), `${sel} au-dessus du décor`);
  // Toute couche décorative laisse passer les clics
  for(const sel of ["#scene", "#decor", "#confetti", ".scene-sign", ".env-deco", ".seal-shape", ".lg-deco"])
    assert.ok(regleCSS(sel).includes("pointer-events:none"), `${sel} : pointer-events:none`);
  // Un dessin en position absolue reste dans son cachet : le cachet de l'aperçu ne doit jamais être « static »
  // (bug du 2026-10-17 : la citrouille du cachet Halloween recouvrait tout le formulaire de l'aperçu)
  assert.ok(regleCSS(".seal-shape").includes("position:absolute"));
  for(const sel of [".seal", ".pv-env .seal"]) assert.ok(/position:(relative|absolute)/.test(regleCSS(sel)), `${sel} : conteneur positionné`);
  assert.ok(!/position:static/.test(regleCSS(".pv-env .seal")));
});
await test("Aperçu de la création : même cachet que l'enveloppe", () => {
  const S = PAGE.lire("S");
  Object.assign(S, { step: 4, from: "Alex", to: "Sam", occ: "halloween", em: "", link: "" });
  PAGE.lire("renderCreator")();
  assert.ok(PAGE.zones["#app"].innerHTML.includes('class="seal shaped seal-pumpkin "'));
  Object.assign(S, { step: "home", occ: "juste" });
});
await test("Rien ne change dans les liens : le décodage ignore le décor", () => {
  for(const nom of ["sanitize", "unpackLink", "packLink", "decodeData", "encodeData"]) assert.ok(!/ENV_DECO|sealHTML|envDeco/.test(PAGE.lire(nom).toString()), nom);
});

/* =========================================================
   15. Partager la surprise : version en lecture seule, montrée par la personne invitée après son Oui
   ========================================================= */
titre("15. Partager la surprise");
const partage = PAGE.lire("shareData");
const COMPLETE = () => INV({ m: "Prépare ton plus beau sourire.", mh: 1, a: { v: "r", h: "Tu vas adorer", at: "2027-02-13T18:00", e: L.scramble("Dîner") },
  l: { v: "v", x: "Restaurant de l'Exemple" }, dt: "Code de la porte 0000", ix: 1, d: undefined, h: undefined, sl: [["2027-02-13", "20:00"], ["2027-02-14", "20:00"]] });
await test("Version partagée : sans canal ni identifiant, sans lieu, détails, message caché ni texte brouillé", async () => {
  const d = partage(COMPLETE(), 1);
  assert.equal(d.vu, 1); assert.equal(d.c, "any");
  for(const k of ["ci", "l", "dt", "m", "mh", "ix", "rv", "sl", "pa"]) assert.ok(!(k in d), `« ${k} » retiré`);
  assert.deepEqual(d.a, { v: "s", h: "Tu vas adorer" }, "révélation programmée devenue « Surprise » (indice gardé)");
  assert.deepEqual([d.d, d.h], ["2027-02-14", "20:00"], "seul le créneau choisi");
  const lien = await L.encodeData(d), relu = await L.decodeData(lien);
  assert.deepEqual(relu, d, "le lien se relit à l'identique");
  const txt = JSON.stringify(relu);
  for(const secret of ["06 00 00 00 01", "Exemple", "0000", "sourire", "Dîner"]) assert.ok(!txt.includes(secret), `« ${secret} » absent du lien partagé`);
  assert.ok(!/"e":/.test(txt), "aucun texte brouillé");
});
await test("Version partagée d'un programme : lieux des étapes et point de départ retirés, message visible gardé", () => {
  const d = partage(INV({ a: undefined, m: "À bientôt", me: "Gare de l'Exemple", br: "Des baskets",
    p: [{ h: "10 h", v: "v", a: "Balade", l: "Parc de l'Exemple" }, { h: "16 h", v: "r", i: "Indice", at: "2027-01-01T16:00", e: L.scramble(JSON.stringify({ a: "Musée", l: "Musée de l'Exemple" })) }] }), 0);
  assert.deepEqual(d.p, [{ h: "10 h", v: "v", a: "Balade", l: "" }, { h: "16 h", v: "s", i: "Indice" }]);
  assert.ok(!("me" in d) && d.br === "Des baskets" && d.m === "À bientôt");
});
await test("Liens de référence : version partagée aux formats p et y, partage refusé", () => {
  for(const f of ["p", "y"]) assert.ok(REFERENCES.some(r => r.attendu.vu && r.lien[0] === f), `aucune version partagée au format ${f}`);
  assert.ok(REFERENCES.some(r => r.attendu.pa === 0), "aucun lien avec le partage refusé");
});
await test("Indicateurs stricts : V = 1 et P = 0 seulement", async () => {
  const c = L.packLink(partage(INV(), 0));
  assert.equal(c.V, 1);
  assert.throws(() => L.unpackLink({ ...c, V: 2 })); assert.throws(() => L.unpackLink({ ...c, P: 1 }));
  assert.ok(!("vu" in L.sanitize({ ...INV(), vu: 2 })) && !("pa" in L.sanitize({ ...INV(), pa: 1 })), "valeurs inattendues ignorées");
  assert.equal(L.sanitize({ ...INV(), pa: 0 }).pa, 0);
});
await test("Écran partagé : lecture seule, « Gardé secret 🤫 », une seule action principale, titre focalisable", () => {
  PAGE.vus.length = 0;
  ouvrir(partage(COMPLETE(), 0)); PAGE.lire("renderShared")();
  const h = PAGE.zones["#app"].innerHTML, main = h.slice(h.indexOf('<div class="pop-in">'), h.indexOf('<p class="foot">'));
  assert.ok(h.includes('<h1 class="question" tabindex="-1" style="margin-bottom:8px">Sam a dit oui ! 🎉</h1>'));
  assert.ok(PAGE.vus.includes(".question"), "focus sur le titre");
  assert.deepEqual(principales(h), ["Créer ma propre invitation"]);
  assert.ok(main.includes("<small>Lieu</small><strong>Gardé secret 🤫</strong>"));
  assert.ok(!/id="(yes|no|reply|copyR|refuse)"/.test(h), "aucun moyen de répondre");
  assert.ok(!h.includes("google.com/maps") && !h.includes("sourire"), "ni carte ni message caché");
  assert.ok(main.includes("«&nbsp;Ça te dit un rendez-vous avec moi ?&nbsp;»"), "la question citée, sans guillemet isolé en fin de ligne");
  assert.ok(h.includes(PAGE.lire("SAFETY")), "mention anti-phishing");
  assert.ok(!/[←→]| · /.test(main), "ni flèche ni « · »");
  assert.ok(PAGE.lire("route").toString().includes("if(D.vu){ Sound.init(); renderShared(); }"), "le lien partagé ouvre cet écran");
});
await test("Après le Oui : « Partager la surprise » secondaire, si autorisé et le créneau choisi", () => {
  const actions = (d, slot = null) => { ouvrir(d, slot); PAGE.ecrire("shareState", d.pa === 0 ? "none" : "ok"); return PAGE.lire("actionsHTML")(); };
  const h = actions(INV());
  assert.ok(h.includes('<button type="button" class="btn" id="shareSur">Partager la surprise</button>'), "bouton secondaire");
  assert.ok(!actions(INV({ pa: 0 })).includes("shareSur"), "refusé par le créateur : pas de bouton");
  assert.ok(!actions(INV({ d: undefined, h: undefined, sl: [["2026-11-14", "20:00"], ["2026-11-21", "20:00"]] })).includes("shareSur"), "créneau pas encore choisi");
  const prep = PAGE.lire("prepReminder").toString();
  assert.ok(prep.includes('if(D.pa===0 || D.vu) shareState="none";') && prep.includes("shareData(D, slot)"));
  ouvrir(INV()); PAGE.ecrire("shareState", "ok"); PAGE.ecrire("remState", "ok");
  const page = PAGE.lire("ticketHTML")(PAGE.lire("afterHTML")("C'est un oui !", ""));
  assert.equal(principales(page).length, 1, "toujours une seule action principale (la réponse)");
});
await test("Création : « Autoriser le partage » activé par défaut, pa = 0 seulement s'il est décoché", async () => {
  const S = PAGE.lire("S"), lien = PAGE.lire("buildLink"), dec = PAGE.lire("decodeData");
  const lire = async () => { const u = await lien(); return dec(u.slice(u.indexOf("#i=") + 3)); };
  Object.assign(S, { from: "Alex", to: "Sam", date: "2027-10-31", time: "20:00", choose: false, mode: "one", occ: "date", ch: "any", chId: "" });
  assert.equal(S.share, true, "activé par défaut");
  assert.ok(!("pa" in await lire()), "autorisé : rien dans le lien (comme les anciens liens)");
  S.share = false; assert.equal((await lire()).pa, 0);
  Object.assign(S, { step: 4, link: "" }); PAGE.lire("renderCreator")();
  assert.ok(PAGE.zones["#app"].innerHTML.includes("<b>Partage</b><span><em>Non autorisé</em></span>"), "récapitulatif");
  S.share = true; S.open.add("reply"); PAGE.lire("renderCreator")();
  const h = PAGE.zones["#app"].innerHTML;
  assert.ok(h.includes('<input type="checkbox" id="allowShare" checked><span>Autoriser le partage de la surprise</span>'), "case à cocher");
  Object.assign(S, { step: "home", occ: "juste" }); S.open.delete("reply");
});

/* =========================================================
   16. Textes neutres (ni masculin ni féminin pour les personnes)
   ========================================================= */
titre("16. Textes neutres");
await test("Bas des billets : « Invitation créée avec Ose Demander. »", () => {
  ouvrir(INV()); const h = PAGE.lire("ticketHTML")("");
  assert.ok(h.includes("<br>Invitation créée avec Ose Demander.<br>"));
  assert.ok(!/utilisateur d'Ose|créée par un/.test(h));
});
await test("Mentions légales : « la personne qui a créé l'invitation », jamais l'auteur, le créateur ou l'éditeur", () => {
  const ml = readFileSync(RACINE + "mentions-legales.html", "utf8");
  for(const mot of [/l'auteur/i, /créat(eur|rice)/i, /les utilisateurs/i, /l'éditeur/i, /seul responsable/i]) assert.ok(!mot.test(ml), `« ${mot.source} » trouvé`);
  assert.ok(ml.includes("la réponse n'est envoyée qu'à la personne qui a créé l'invitation"));
});

/* =========================================================
   17. Safari (iPhone, iPad, Mac)
   ========================================================= */
titre("17. Safari");
await test("« Tester l'invitation » : l'onglet s'ouvre pendant le toucher, avant toute attente", () => {
  const src = PAGE.lire("bindCreator").toString(), i = src.indexOf('$("#preview")');
  assert.ok(i >= 0, "bouton « Tester l'invitation » branché");
  const bloc = src.slice(i, src.indexOf("});", i));
  assert.ok(bloc.indexOf('window.open("","_blank")') >= 0 && bloc.indexOf('window.open("","_blank")') < bloc.indexOf("await"), "window.open avant le premier await (sinon Safari bloque l'onglet)");
  assert.ok(bloc.includes("w.location.href=url") && bloc.includes("w.opener=null"), "le lien est ensuite chargé dans cet onglet, sans lien vers la page de création");
});
await test("Aucune fenêtre ouverte après une attente ailleurs dans la page", () => {
  const html = readFileSync(RACINE + "index.html", "utf8");
  for(const m of html.matchAll(/await [^;]*;[^\n]*window\.open\(/g)) assert.fail(`window.open après await : ${m[0].slice(0, 80)}`);
});
await test("Champs de date et d'heure : jamais plus larges que leur cadre (Safari sur iPhone)", () => {
  assert.ok(regleCSS(".row2>.field").includes("min-width:0"));
  assert.ok(regleCSS("input.input[type=date],input.input[type=time]").includes("min-width:0;max-width:100%"));
  assert.ok(/@supports \(-webkit-touch-callout:none\)\{\s*input\.input\[type=date\],input\.input\[type=time\]\{-webkit-appearance:none;appearance:none;display:block/.test(CSS), "apparence native retirée sur iPhone et iPad");
});

/* =========================================================
   18. Liens courts : le Worker (worker/src/index.js), testé avec une vraie base SQLite et le vrai schéma
   ========================================================= */
titre("18. Liens courts : le Worker");
// Le module principal du Worker n'exporte que ses gestionnaires ; les règles (limites, SQL) sont dans regles.js
const WORKER_MAIN = await import(new URL("../worker/src/index.js", import.meta.url).href);
const WORKER = { ...(await import(new URL("../worker/src/regles.js", import.meta.url).href)), default: WORKER_MAIN.default };
let sqlite = null; try{ sqlite = await import("node:sqlite"); }catch{}
const SITE = "https://osedemander.fr";
// Base D1 simulée sur SQLite (mêmes appels que D1 : prepare().bind().run() / first())
const baseD1 = () => {
  const db = new sqlite.DatabaseSync(":memory:");
  db.exec(readFileSync(RACINE + "worker/schema.sql", "utf8"));
  let panne = false;
  return { db, panne: v => { panne = v; }, prepare: sql => ({ bind: (...a) => ({
    run: async () => { if(panne) throw new Error("D1_ERROR: quota"); db.prepare(sql.replace(/\?(\d)/g, "?")).run(...a); return { success: true }; },
    first: async () => { if(panne) throw new Error("D1_ERROR: quota"); return db.prepare(sql.replace(/\?(\d)/g, "?")).get(...a) || null; },
    all: async () => { if(panne) throw new Error("D1_ERROR: quota"); return { results: db.prepare(sql.replace(/\?(\d)/g, "?")).all(...a) }; }
  }) }) };
};
const ENV = (extra = {}) => ({ DB: baseD1(), ORIGINES: SITE, ...extra });
const appel = (env, methode, chemin, corps, origine = SITE, ip = "203.0.113.7") => WORKER.default.fetch(new Request("https://ose-liens.exemple.workers.dev" + chemin, {
  method: methode, headers: { ...(origine ? { Origin: origine } : {}), "CF-Connecting-IP": ip, ...(corps !== undefined ? { "Content-Type": "application/json" } : {}) },
  body: corps === undefined ? undefined : typeof corps === "string" ? corps : JSON.stringify(corps) }), env);
const ID_EX = "AAAAAAAAAAAAAAAAAAAAAA", JETON_EX = "B".repeat(43);
const empreinteDe = async j => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(j))).toString("base64url");
const creer = async (env, id = ID_EX, ct = "Q2hpZmZyZQ", jeton = JETON_EX) => appel(env, "POST", "/v1/liens", { id, ct, del: await empreinteDe(jeton) });
const essaiWorker = (nom, f) => test(nom, async () => { if(!sqlite){ console.log("    (node:sqlite absent : test sauté, Node 22.5 ou plus requis)"); return; } await f(); });

await essaiWorker("Créer puis lire : 201, puis le contenu chiffré tel quel ; doublon refusé (409)", async () => {
  const env = ENV();
  const r = await creer(env); assert.equal(r.status, 201);
  const e = await r.json(); assert.ok(e.expire > Date.now() + 364 * 864e5 && e.expire <= Date.now() + 365 * 864e5, "expiration : 1 an");
  const l = await appel(env, "GET", "/v1/liens/" + ID_EX); assert.equal(l.status, 200); assert.deepEqual(await l.json(), { ct: "Q2hpZmZyZQ" });
  assert.equal((await creer(env, ID_EX, "QXV0cmU")).status, 409, "un lien existant n'est jamais écrasé");
});
await essaiWorker("Contenus refusés : identifiant mal formé, champ inconnu, plus de 16 Ko", async () => {
  const env = ENV(), del = await empreinteDe(JETON_EX);
  assert.equal((await appel(env, "POST", "/v1/liens", { id: "court", ct: "QQ", del })).status, 400);
  assert.equal((await appel(env, "POST", "/v1/liens", { id: ID_EX, ct: "QQ", del, x: 1 })).status, 400);
  assert.equal((await appel(env, "POST", "/v1/liens", { id: ID_EX, ct: "Q+Q=", del })).status, 400, "contenu hors base64url");
  assert.equal((await appel(env, "POST", "/v1/liens", { id: ID_EX, ct: "Q".repeat(WORKER.CT_MAX + 1), del })).status, 413, "16 Ko au plus");
  assert.equal((await appel(env, "POST", "/v1/liens", "x".repeat(WORKER.CORPS_MAX + 1))).status, 413);
  assert.equal((await appel(env, "POST", "/v1/liens", "pas du json")).status, 400);
  assert.equal((await creer(env, ID_EX, "Q".repeat(WORKER.CT_MAX))).status, 201, "exactement 16 Ko : accepté");
});
await essaiWorker("Introuvable : 404 (identifiant inconnu ou mal formé)", async () => {
  const env = ENV();
  assert.equal((await appel(env, "GET", "/v1/liens/" + "Z".repeat(22))).status, 404);
  assert.equal((await appel(env, "GET", "/v1/liens/../../etc")).status, 404);
  assert.equal((await appel(env, "GET", "/autre")).status, 404);
});
await essaiWorker("Suppression : jeton faux refusé (403), bon jeton accepté, puis « supprimé » (410)", async () => {
  const env = ENV(); await creer(env);
  assert.equal((await appel(env, "POST", `/v1/liens/${ID_EX}/supprimer`, { jeton: "C".repeat(43) })).status, 403, "jeton faux");
  assert.equal((await appel(env, "GET", "/v1/liens/" + ID_EX)).status, 200, "toujours lisible après un jeton faux");
  assert.equal((await appel(env, "POST", `/v1/liens/${ID_EX}/supprimer`, { jeton: JETON_EX })).status, 200, "bon jeton");
  const l = await appel(env, "GET", "/v1/liens/" + ID_EX); assert.equal(l.status, 410); assert.deepEqual(await l.json(), { raison: "supprime" });
  assert.equal(env.DB.db.prepare("SELECT ct FROM liens").get().ct, null, "contenu chiffré effacé de la base");
  assert.equal((await appel(env, "POST", `/v1/liens/${ID_EX}/supprimer`, { jeton: JETON_EX })).status, 410, "déjà supprimé");
  assert.equal((await appel(env, "POST", `/v1/liens/${"Z".repeat(22)}/supprimer`, { jeton: JETON_EX })).status, 404);
  assert.equal((await appel(env, "POST", `/v1/liens/${ID_EX}/supprimer`, { jeton: "court" })).status, 400);
});
await essaiWorker("Expiration : 410 « expiré » dès la date passée, contenu effacé par la tâche quotidienne, identifiant oublié un an plus tard", async () => {
  const env = ENV(); await creer(env);
  env.DB.db.prepare("UPDATE liens SET expire = ?").run(Date.now() - 1000);
  const l = await appel(env, "GET", "/v1/liens/" + ID_EX); assert.equal(l.status, 410); assert.deepEqual(await l.json(), { raison: "expire" });
  await WORKER.default.scheduled({}, env);
  assert.deepEqual({ ...env.DB.db.prepare("SELECT ct, etat FROM liens").get() }, { ct: null, etat: "expire" }, "contenu effacé");
  env.DB.db.prepare("UPDATE liens SET expire = ?").run(Date.now() - WORKER.GARDE - 1000);
  await WORKER.default.scheduled({}, env);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) AS n FROM liens").get().n, 0, "identifiant oublié");
  assert.equal((await appel(env, "GET", "/v1/liens/" + ID_EX)).status, 404);
});
await essaiWorker("CORS limité à osedemander.fr ; aucune réponse mise en cache (no-store)", async () => {
  const env = ENV(), reps = [];
  const o = await appel(env, "OPTIONS", "/v1/liens", undefined); reps.push(o);
  assert.equal(o.status, 204); assert.equal(o.headers.get("Access-Control-Allow-Origin"), SITE);
  const autre = await appel(env, "POST", "/v1/liens", { id: ID_EX, ct: "QQ", del: await empreinteDe(JETON_EX) }, "https://pirate.example"); reps.push(autre);
  assert.equal(autre.status, 403); assert.equal(autre.headers.get("Access-Control-Allow-Origin"), null, "aucune autorisation pour un autre site");
  assert.equal((await appel(env, "GET", "/v1/liens/" + ID_EX, undefined, "http://localhost:8000")).status, 403, "localhost refusé en production");
  reps.push(await creer(env), await appel(env, "GET", "/v1/liens/" + ID_EX), await appel(env, "GET", "/v1/liens/" + "Z".repeat(22)),
    await appel(env, "POST", `/v1/liens/${ID_EX}/supprimer`, { jeton: JETON_EX }), await appel(env, "GET", "/v1/liens/" + ID_EX));
  for(const r of reps) assert.equal(r.headers.get("Cache-Control"), "no-store", `réponse ${r.status} sans no-store`);
  assert.ok(reps.every(r => r.headers.get("Vary") === "Origin"));
});
await essaiWorker("Limite par adresse IP (429) et quota gratuit atteint (503, le site repasse au lien long)", async () => {
  const comptes = new Map(), limiteur = { limit: async ({ key }) => { const n = (comptes.get(key) || 0) + 1; comptes.set(key, n); return { success: n <= 2 }; } };
  const env = ENV({ LIMITE_CREATION: limiteur, LIMITE_LECTURE: limiteur }), del = await empreinteDe(JETON_EX);
  const c = i => appel(env, "POST", "/v1/liens", { id: String(i).padStart(22, "A"), ct: "QQ", del });
  assert.deepEqual([(await c(1)).status, (await c(2)).status, (await c(3)).status], [201, 201, 429]);
  assert.equal((await appel(env, "POST", "/v1/liens", { id: "9".padStart(22, "A"), ct: "QQ", del }, SITE, "198.51.100.9")).status, 201, "autre adresse : pas concernée");
  const env2 = ENV(); env2.DB.panne(true);
  assert.equal((await creer(env2)).status, 503); assert.equal((await appel(env2, "GET", "/v1/liens/" + ID_EX)).status, 503);
});
await test("Worker : le module principal n'exporte que ses gestionnaires (sinon Cloudflare refuse de le lancer)", () => {
  assert.deepEqual(Object.keys(WORKER_MAIN), ["default"]);
  assert.deepEqual(Object.keys(WORKER_MAIN.default).sort(), ["fetch", "scheduled"]);
});
await test("Worker : aucun journal, aucun secret, fichiers locaux ignorés", () => {
  const src = readFileSync(RACINE + "worker/src/index.js", "utf8") + readFileSync(RACINE + "worker/src/regles.js", "utf8"), toml = readFileSync(RACINE + "worker/wrangler.toml", "utf8");
  assert.ok(!/console\.|\.log\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun console.* dans le Worker");
  assert.ok(/\[observability\]\s*\nenabled = false/.test(toml), "journaux Cloudflare coupés");
  for(const motif of [/api[_-]?token/i, /secret\s*=/i, /password/i, /CLOUDFLARE_API/i, /account_id/i])
    assert.ok(!motif.test(toml) && !motif.test(src), `motif interdit ${motif}`);
  assert.ok(toml.includes('ORIGINES = "https://osedemander.fr"'), "CORS de production : osedemander.fr seulement");
  const gi = readFileSync(RACINE + "worker/.gitignore", "utf8");
  assert.ok(gi.includes(".wrangler/") && gi.includes(".dev.vars"));
});

/* =========================================================
   19. Liens courts : le site (chiffrement, création, ouverture, repli, suppression)
   Le « réseau » du banc envoie les requêtes au vrai Worker (base SQLite) et les enregistre toutes.
   ========================================================= */
titre("19. Liens courts : le site");
const LOCAL = "http://localhost:8000";
const reseau = (env = ENV({ ORIGINES: LOCAL })) => {
  const journal = [];
  const f = async (u, o = {}) => {
    journal.push({ url: u, body: o.body || "", headers: JSON.stringify(o.headers || {}) });
    assert.equal(o.cache, "no-store", "requête sans cache"); assert.equal(o.credentials, "omit");
    return WORKER.default.fetch(new Request(u.replace("http://localhost:8787", "https://ose-liens.exemple.workers.dev"),
      { method: o.method || "GET", headers: { ...(o.headers || {}), Origin: LOCAL, "CF-Connecting-IP": "203.0.113.9" }, body: o.body }), env);
  };
  return { env, journal, f };
};
const brancher = r => PAGE.ecrire("shortFetch", r.f);
const CODE_EX = async (extra = {}) => (await L.encodeData(INV(extra)));
await essaiWorker("Chiffrement : aller-retour, clé et identifiant de 128 bits, contenu lié à son identifiant", async () => {
  const seal = PAGE.lire("sealShort"), open = PAGE.lire("openShort"), code = await CODE_EX();
  const s = await seal(code);
  assert.match(s.id, /^[A-Za-z0-9_-]{22}$/); assert.match(s.key, /^[A-Za-z0-9_-]{22}$/);
  assert.equal(Buffer.from(s.key, "base64url").length, 16, "clé de 128 bits"); assert.equal(Buffer.from(s.id, "base64url").length, 16, "identifiant de 128 bits");
  assert.equal(await open(s.id, s.key, s.ct), code);
  assert.ok(!s.ct.includes(code.slice(1, 30)), "contenu illisible");
  await assert.rejects(open("B".repeat(22), s.key, s.ct), "déplacé sous un autre identifiant : refusé");
  await assert.rejects(open(s.id, (await seal(code)).key, s.ct), "autre clé : refusée");
  const s2 = await seal(code); assert.notEqual(s2.id, s.id); assert.notEqual(s2.ct, s.ct, "chaque lien a sa clé et son IV");
});
await essaiWorker("Création : lien #s=ID.CLÉ, la clé et l'invitation en clair ne partent jamais", async () => {
  const r = reseau(); brancher(r);
  const code = await CODE_EX(), sh = await PAGE.lire("createShort")(code, LOCAL + "/");
  assert.ok(sh, "lien court créé");
  const [, id, key] = sh.link.match(/^http:\/\/localhost:8000\/#s=([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{22})$/) || [];
  assert.ok(id && key, `format osedemander.fr/#s=ID.CLÉ : ${sh.link}`);
  assert.match(sh.jeton, /^[A-Za-z0-9_-]{43}$/);
  for(const req of r.journal){
    for(const secret of [key, sh.jeton, code.slice(1, 40), "Alex", "Sam"]) assert.ok(!(req.url + req.body + req.headers).includes(secret), `« ${secret.slice(0, 12)}… » envoyé au service`);
  }
  const ligne = r.env.DB.db.prepare("SELECT ct, del FROM liens WHERE id = ?").get(id);
  assert.ok(ligne && !ligne.ct.includes(code.slice(1, 30)), "la base ne contient que du chiffré");
  assert.equal(ligne.del, Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sh.jeton))).toString("base64url"), "seulement l'empreinte du jeton");
  assert.equal(await PAGE.lire("readShort")(id, key), code, "relu à l'identique");
});
await essaiWorker("Repli sur le lien long : service absent, quota atteint (503), limite (429), délai dépassé, contenu trop gros", async () => {
  const cs = PAGE.lire("createShort"), code = await CODE_EX();
  for(const [nom, f] of [["réseau", async () => { throw new TypeError("Failed to fetch"); }], ["délai", async () => { throw new DOMException("délai", "AbortError"); }],
    ["503", async () => new Response("{}", { status: 503 })], ["429", async () => new Response("{}", { status: 429 })], ["400", async () => new Response("{}", { status: 400 })]]){
    PAGE.ecrire("shortFetch", f); assert.equal(await cs(code, LOCAL + "/"), null, nom);
  }
  const r = reseau(); brancher(r);
  assert.equal(await cs("y" + "A".repeat(8000), LOCAL + "/"), null, "plus long que MAX_LINK : lien long");
  assert.equal(await cs("pas un code", LOCAL + "/"), null);
  assert.equal(r.journal.length, 0, "rien n'est envoyé dans ces cas");
  assert.ok(PAGE.lire("route").toString().includes("readShort(ms[1], ms[2])"));
  const make = PAGE.lire("bindCreator").toString();
  assert.ok(make.includes("S.link = sh ? sh.link : long;") && make.includes("addToHistory(long, sh, notif)"), "création : le court si possible, sinon le long ; l'historique garde les deux");
});
// Ouvre un lien comme la page : location.hash puis route() ; renvoie le HTML affiché
const ouvrirLien = async lien => { PAGE.lire("location").hash = lien.slice(lien.indexOf("#")); await PAGE.lire("route")(); const h = PAGE.zones["#app"].innerHTML; PAGE.lire("location").hash = ""; return h; };
await essaiWorker("Ouverture d'un lien court : l'invitation, validée par sanitize", async () => {
  const r = reseau(); brancher(r);
  const sh = await PAGE.lire("createShort")(await CODE_EX(), LOCAL + "/");
  const h = await ouvrirLien(sh.link);
  assert.ok(h.includes('class="envelope') && h.includes("Alex t'a envoyé une invitation"), "enveloppe de l'invitation");
  assert.equal(PAGE.lire("D").f, "Alex");
  // Contenu chiffré valide mais invitation piégée : refusée par sanitize (« incomplet »)
  const seal = PAGE.lire("sealShort"), piege = "x" + Buffer.from(JSON.stringify({ f: "<b>", t: "Sam" })).toString("base64url"), s = await seal(piege);
  await r.env.DB.prepare(WORKER.SQL.creer).bind(s.id, s.ct, "D".repeat(43), Date.now() + 1e9).run();
  assert.ok((await ouvrirLien(`${LOCAL}/#s=${s.id}.${s.key}`)).includes("Ce lien est incomplet"));
  const s2 = await seal("<script>alert(1)</script>");
  await r.env.DB.prepare(WORKER.SQL.creer).bind(s2.id, s2.ct, "D".repeat(43), Date.now() + 1e9).run();
  assert.ok((await ouvrirLien(`${LOCAL}/#s=${s2.id}.${s2.key}`)).includes("Ce lien est incomplet"), "contenu qui n'est pas un code d'invitation : refusé");
});
await essaiWorker("Messages clairs : introuvable, expiré, supprimé, incomplet (clé fausse), service muet (avec « Réessayer »)", async () => {
  const r = reseau(); brancher(r);
  const sh = await PAGE.lire("createShort")(await CODE_EX(), LOCAL + "/"), [, id, key] = sh.link.match(/#s=([^.]+)\.(.+)$/);
  const titre = h => (h.match(/<h1 class="question" tabindex="-1">([^<]+)<\/h1>/) || [])[1];
  assert.equal(titre(await ouvrirLien(`${LOCAL}/#s=${"Z".repeat(22)}.${key}`)), "Ce lien est introuvable");
  assert.equal(titre(await ouvrirLien(`${LOCAL}/#s=${id}.${"A".repeat(22)}`)), "Ce lien est incomplet", "clé abîmée");
  r.env.DB.db.prepare("UPDATE liens SET expire = ? WHERE id = ?").run(Date.now() - 1, id);
  assert.equal(titre(await ouvrirLien(sh.link)), "Cette invitation a expiré");
  const sh2 = await PAGE.lire("createShort")(await CODE_EX(), LOCAL + "/");
  assert.equal(await PAGE.lire("deleteShort")(sh2.id, sh2.jeton), "ok");
  const h = await ouvrirLien(sh2.link);
  assert.equal(titre(h), "Cette invitation a été supprimée"); assert.ok(h.includes("La personne qui t'a envoyé cette invitation l'a retirée."));
  PAGE.ecrire("shortFetch", async () => { throw new TypeError("Failed to fetch"); });
  const muet = await ouvrirLien(sh2.link);
  assert.equal(titre(muet), "Le service ne répond pas");
  assert.deepEqual(principales(muet), ["Créer ma propre invitation"], "une seule action principale");
  assert.ok(muet.includes('<button type="button" class="btn" id="retry">Réessayer</button>'), "« Réessayer » en action secondaire");
  for(const k of ["introuvable", "expire", "supprime", "incomplet"]){ PAGE.lire("renderLinkError")(k); assert.equal(principales(PAGE.zones["#app"].innerHTML).length, 1, k); }
});
await essaiWorker("Suppression du lien en ligne : jeton faux refusé, bon jeton accepté, lien supprimé qui l'annonce", async () => {
  const r = reseau(); brancher(r);
  const del = PAGE.lire("deleteShort"), sh = await PAGE.lire("createShort")(await CODE_EX(), LOCAL + "/");
  assert.equal(await del(sh.id, "E".repeat(43)), "jeton", "jeton faux : refusé");
  assert.equal(await PAGE.lire("readShort")(sh.id, sh.link.split(".").pop()), await CODE_EX(), "toujours lisible après un jeton faux");
  assert.equal(await del(sh.id, sh.jeton), "ok");
  assert.equal(await del(sh.id, sh.jeton), "deja");
  await assert.rejects(PAGE.lire("readShort")(sh.id, sh.link.split(".").pop()), e => e.kind === "supprime");
  PAGE.ecrire("shortFetch", async () => { throw new TypeError("Failed to fetch"); });
  assert.equal(await del(sh.id, sh.jeton), "reseau");
  const src = PAGE.lire("unpublishShort").toString();
  assert.ok(src.includes("confirmSheet(") && src.indexOf("confirmSheet(") < src.indexOf("deleteShort("), "confirmation avant la suppression");
  assert.ok(src.includes("gone:true"), "l'historique note la suppression");
});
await test("« Mes invitations » : lien court, lien complet et jeton validés strictement ; bouton « Supprimer le lien en ligne »", () => {
  const ok = PAGE.lire("validEntry"), base = { id: "abc123", from: "Alex", to: "Sam", occ: "date", when: [["2026-11-14", "20:00"]], created: "2026-10-17T10:00:00.000Z" };
  const court = `${LOCAL}/#s=${"A".repeat(22)}.${"B".repeat(22)}`, long = `${LOCAL}/#i=yAAAA`;
  assert.ok(ok({ ...base, link: long }), "lien long seul");
  assert.ok(ok({ ...base, link: court, long, jeton: "C".repeat(43) }), "lien court, lien complet, jeton");
  assert.ok(ok({ ...base, link: court, long, jeton: "C".repeat(43), gone: true }), "supprimé en ligne");
  assert.ok(!ok({ ...base, link: court }), "lien court sans lien complet : refusé");
  assert.ok(!ok({ ...base, link: court, long: court }), "le lien complet doit être un #i=");
  assert.ok(!ok({ ...base, link: court, long, jeton: "court" }), "jeton mal formé");
  assert.ok(!ok({ ...base, link: court, long, gone: "oui" }));
  assert.ok(!ok({ ...base, link: long, jeton: "C".repeat(43) }), "jeton sans lien court");
  assert.ok(!ok({ ...base, link: `${LOCAL}/#s=court.cle` }));
  const rh = PAGE.lire("renderHistory").toString();
  assert.ok(rh.includes('${it.jeton && !it.gone ? `<button type="button" class="btn sm danger" data-act="unpub">Supprimer le lien en ligne</button>` : ""}'));
  assert.ok(PAGE.lire("duplicateInvitation").toString().includes("linkData(invLink(it))"), "dupliquer relit le lien complet (sans le service)");
});

/* =========================================================
   20. Liens courts du rappel d'agenda et de « Partager la surprise » (chacun son contenu allégé, chiffré)
   ========================================================= */
titre("20. Liens courts du rappel et du partage");
const attendre = async cond => { for(let i = 0; i < 200 && !cond(); i++) await new Promise(r => setTimeout(r, 10)); };
const relire = async lien => { const [, id, key] = lien.match(/#s=([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{22})$/) || []; assert.ok(id, `lien court attendu : ${lien.slice(0, 60)}`); return L.decodeData(await PAGE.lire("readShort")(id, key)); };
const apresOuiCourt = async d => { ouvrir(d); PAGE.ecrire("remState", "wait"); PAGE.lire("prepReminder")(); await attendre(() => PAGE.lire("remState") !== "wait" && PAGE.lire("shareState") !== "wait"); return [PAGE.lire("remLink"), PAGE.lire("shareLink")]; };
await essaiWorker("Après le Oui : rappel et partage en liens courts, chacun avec son propre contenu allégé", async () => {
  const r = reseau(); brancher(r);
  const d = INV({ m: "Secret", mh: 1, l: { v: "v", x: "Restaurant de l'Exemple" } });
  const [rem, part] = await apresOuiCourt(d);
  const dr = await relire(rem), dp = await relire(part);
  assert.deepEqual(dr, PAGE.lire("reminderData")(d, null), "rappel : contenu de reminderData");
  assert.equal(dr.rv, 1); assert.ok(!("ci" in dr), "rappel : sans le numéro du créateur");
  assert.deepEqual(dp, PAGE.lire("shareData")(d, null), "partage : contenu de shareData");
  assert.equal(dp.vu, 1); assert.ok(!("l" in dp) && !("m" in dp) && !("ci" in dp), "partage : sans lieu, message caché ni numéro");
  assert.notEqual(rem.split("#s=")[1].split(".")[1], part.split("#s=")[1].split(".")[1], "deux clés différentes");
  for(const req of r.journal) assert.ok(!req.body.includes("Restaurant") && !req.url.includes(rem.split(".").pop()), "rien en clair, aucune clé envoyée");
});
await essaiWorker("Repli : service muet, le rappel et le partage gardent le lien complet ; exemple : jamais de dépôt", async () => {
  PAGE.ecrire("shortFetch", async () => { throw new TypeError("Failed to fetch"); });
  const [rem, part] = await apresOuiCourt(INV());
  assert.ok(rem.includes("#i=") && part.includes("#i="), "liens complets");
  assert.equal((await L.decodeData(rem.split("#i=")[1])).rv, 1);
  const r = reseau(); brancher(r); PAGE.ecrire("EXAMPLE", true);
  const [rem2] = await apresOuiCourt(INV());
  PAGE.ecrire("EXAMPLE", false);
  assert.ok(rem2.includes("#i=") && r.journal.length === 0, "mode exemple : rien n'est déposé");
});
await essaiWorker("Carte ouverte depuis un lien de rappel court : ce même lien va dans l'agenda (aucun nouveau dépôt)", async () => {
  const r = reseau(); brancher(r);
  const d = PAGE.lire("reminderData")(INV(), null), sh = await PAGE.lire("createShort")(await L.encodeData(d), LOCAL + "/");
  const n = r.journal.length;
  PAGE.lire("location").hash = sh.link.slice(sh.link.indexOf("#"));
  const [rem] = await apresOuiCourt(d);
  PAGE.lire("location").hash = "";
  assert.equal(rem, sh.link);
  assert.equal(r.journal.filter(q => q.body.includes('"ct"')).length - n, 1, "seulement le lien de partage est déposé");
});
await test("Cas où le partage n'est pas proposé : aucun dépôt (refusé par le créateur ou version partagée)", () => {
  const src = PAGE.lire("prepReminder").toString();
  assert.ok(src.indexOf('if(D.pa===0 || D.vu) shareState="none";') < src.indexOf("encodeData(shareData(D, slot)).then(publish)"));
});

/* =========================================================
   21. Liens courts : mentions légales et textes
   ========================================================= */
titre("21. Liens courts : mentions légales et textes");
await test("Mentions légales : Cloudflare, chiffrement, clé jamais envoyée, un an, suppression, ouvertures visibles", () => {
  const ml = readFileSync(RACINE + "mentions-legales.html", "utf8").replace(/\s+/g, " ");
  for(const t of ['<h3 id="liens-courts">Liens courts</h3>', "Cloudflare, Inc., une entreprise américaine", "elle n'est jamais envoyée",
    "supprimé automatiquement un an après la création", "« Supprimer le lien en ligne »", "seulement une empreinte",
    "l'identifiant du lien et l'adresse IP de l'appareil qui l'ouvre", "Le service ne tient aucun journal",
    "ne sont mises en cache ni par Cloudflare ni par le navigateur", "Rien n'est stocké en clair en ligne", "101 Townsend Street"].map(x => x.replace("seulement une empreinte", "n'en conserve qu'une empreinte")))
    assert.ok(ml.includes(t), `« ${t} » absent des mentions légales`);
  for(const t of ["ne possède ni base de données", "n'en stocke aucune sur un serveur", "Aucun serveur"]) assert.ok(!ml.includes(t), `« ${t} » n'est plus vrai`);
});
await test("Textes du site : « rien n'est stocké en clair en ligne », plus de « rien n'est envoyé à un serveur »", () => {
  const html = readFileSync(RACINE + "index.html", "utf8");
  assert.ok(html.includes("Sans compte, rien n'est stocké en clair en ligne."), "description de la page");
  assert.ok(!/Rien n'expire, rien n'est envoyé à un serveur|rien n'est stocké en ligne/.test(html));
  assert.ok(readFileSync(RACINE + "README.md", "utf8").includes("Rien n'est stocké en clair en ligne"));
});

/* =========================================================
   22. Identifiants uniques : un identifiant en double branche un bouton sur le mauvais élément
   (bug du 2026-10-17 : « Partager le lien » et la case « Autoriser le partage » portaient tous deux id="share")
   ========================================================= */
titre("22. Identifiants uniques");
const doublons = h => { const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]); return [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))]; };
await test("Création : aucun identifiant en double, à chaque étape et avec chaque modèle (lien prêt compris)", () => {
  for(const P of [PAGE, PAGE_PARTAGE]){
    const S = P.lire("S");
    for(const tpl of P.lire("TEMPLATES").map(t => t.id).concat("zero")){
      P.lire("applyTemplate")(tpl);
      for(const step of ["home", 1, 2, 3, 4]){
        Object.assign(S, { from: "Alex", to: "Sam", step, link: step === 4 ? LIEN_EX : "", choose: false });
        P.lire("renderCreator")();
        const d = doublons(P.zones["#app"].innerHTML);
        assert.deepEqual(d, [], `${tpl}, étape ${step} : identifiants en double ${d.join(", ")}`);
      }
      S.choose = true; S.step = 3; P.lire("renderCreator")();
      assert.deepEqual(doublons(P.zones["#app"].innerHTML), [], `${tpl}, créneaux au choix`);
    }
    Object.assign(S, { step: "home", occ: "juste", choose: false, link: "" });
  }
});
await test("Invitation : aucun identifiant en double (enveloppe, question, après le Oui, rappel, version partagée)", () => {
  for(const [nom, f] of [["enveloppe", () => { ouvrir(INV()); PAGE.lire("renderEnvelope")(); }], ["question", () => { ouvrir(INV()); PAGE.lire("renderInvite")(); }],
    ["après le Oui", () => { ouvrir(INV()); PAGE.ecrire("shareState", "ok"); PAGE.zones["#app"].innerHTML = PAGE.lire("ticketHTML")(PAGE.lire("afterHTML")("C'est un oui !", "")); }],
    ["rappel", () => { ouvrir(PAGE.lire("reminderData")(INV(), null), null, "reminder"); PAGE.lire("renderReminder")(); }],
    ["version partagée", () => { ouvrir(PAGE.lire("shareData")(INV(), 0)); PAGE.lire("renderShared")(); }]]){
    f(); const d = doublons(PAGE.zones["#app"].innerHTML); assert.deepEqual(d, [], `${nom} : ${d.join(", ")}`);
  }
});
await test("« Partager le lien » est branché sur le bouton, la case de partage a son propre identifiant", () => {
  const src = PAGE.lire("bindCreator").toString(), lire = PAGE.lire("readAll").toString();
  assert.ok(src.includes('$("#share")?.addEventListener("click",()=>navigator.share('));
  assert.ok(lire.includes('$("#allowShare").checked') && !lire.includes('$("#share")'));
});

/* =========================================================
   23. Pages d'un lien qui ne s'ouvre pas (supprimé, expiré, introuvable, incomplet, service muet)
   ========================================================= */
titre("23. Pages d'erreur des liens");
const ERREURS = { supprime: "Cette invitation a été supprimée", expire: "Cette invitation a expiré", introuvable: "Ce lien est introuvable", incomplet: "Ce lien est incomplet", reseau: "Le service ne répond pas" };
const pageErreur = (k, lv = "n") => { PAGE.vus.length = 0; PAGE.lire("renderLinkError")(k, lv); return PAGE.zones["#app"].innerHTML; };
await test("Chaque cas : titre focalisable, texte qui explique quoi faire, illustration cachée aux lecteurs d'écran", () => {
  for(const [k, t] of Object.entries(ERREURS)){
    const h = pageErreur(k);
    assert.ok(h.includes(`<h1 class="question" tabindex="-1">${t}</h1>`), k);
    assert.ok(PAGE.vus.includes(".question"), `${k} : le focus va au titre`);
    assert.ok(new RegExp(`<svg class="err-ill anim-n" viewBox="0 0 200 140" aria-hidden="true" focusable="false">`).test(h), `${k} : illustration décorative`);
    assert.ok(h.includes(`data-err="${k}"`), `${k} : illustration propre au cas`);
    const texte = (h.match(/<p class="err-text">([^<]+)<\/p>/) || [])[1] || "";
    assert.ok(texte.length > 60 && /demande|réessaie/i.test(texte), `${k} : dit quoi faire`);
    assert.ok(!/[←→]| · /.test(h), `${k} : ni flèche ni « · »`);
  }
  assert.equal(new Set(Object.values(PAGE.lire("ERR_ART"))).size, 5, "cinq illustrations différentes");
  assert.equal(PAGE.lire("LINK_ERRORS").supprime.p, "La personne qui t'a envoyé cette invitation l'a retirée. Si tu penses que c'est une erreur, demande-lui de te la renvoyer.");
});
await test("Actions : « Créer ma propre invitation » principale partout, « Réessayer » seulement quand le service ne répond pas", () => {
  for(const k of Object.keys(ERREURS)){
    const h = pageErreur(k);
    assert.deepEqual(principales(h), ["Créer ma propre invitation"], k);
    assert.equal(h.includes('id="retry"'), k === "reseau", `${k} : « Réessayer »`);
  }
  assert.ok(PAGE.lire("renderLinkError").toString().includes("route();"), "« Réessayer » relance l'ouverture du lien");
  assert.ok(pageErreur("inconnu").includes("Ce lien est incomplet"), "cas inconnu : incomplet");
});
await test("Scène de l'accueil en fond, décor animé, trois niveaux d'animation", () => {
  const src = PAGE.lire("renderLinkError").toString();
  assert.ok(src.includes('setTheme("base", lv, "", "home")'), "scène de l'accueil et décor animé au niveau choisi");
  assert.ok(src.includes('lv=REDUCED_ANIM ? "0" : "n"'), "« moins de mouvement » : aucune animation");
  for(const lv of ["n", "d", "0"]) assert.ok(pageErreur("reseau", lv).includes(`class="err-ill anim-${lv}"`), lv);
  assert.ok(!pageErreur("reseau", "0").includes("pop-in"), "« Aucune » : pas d'apparition animée");
  assert.ok(!/\.err-ill\.anim-0[^{]*\{[^}]*animation/.test(CSS), "aucune animation en « Aucune »");
  for(const r of CSS.match(/[^}]*\{[^}]*animation:ea-[^}]*\}/g) || []) assert.ok(/\.err-ill\.anim-[nd]/.test(r), `animation seulement en n ou d : ${r.trim().slice(0, 50)}`);
});

/* =========================================================
   24. QR code : encodeur du site, relu par un lecteur indépendant (tests/qr-lecteur.mjs)
   ========================================================= */
titre("24. QR code");
const { lireQR, capaciteOctets, NIVEAUX, VERSIONS_LUES, tableauCoherent } = await import(new URL("./qr-lecteur.mjs", import.meta.url).href);
const qr = PAGE.lire("qrEncode");
const relireQR = q => lireQR(q.size, q.dark);
const lienAuHasard = (n, graine) => { let x = graine, t = ""; const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; while(t.length < n){ x = (x * 1103515245 + 12345) % 2147483648; t += a[x % 64]; } return t; };
await test("Capacités de la norme (mode octets) : tableau du lecteur et calcul de l'encodeur d'accord", () => {
  assert.ok(tableauCoherent(), "tableau du lecteur cohérent");
  const norme = { 1: [17, 14, 11, 7], 5: [106, 84, 60, 44], 6: [134, 106, 74, 58], 10: [271, 213, 151, 119], 20: [858, 666, 482, 382], 27: [1465, 1125, 805, 625], 29: [1628, 1264, 908, 698] };
  for(const [v, caps] of Object.entries(norme)) NIVEAUX.forEach((n, i) => assert.equal(capaciteOctets(+v, n), caps[i], `version ${v}-${n}`));
  const dc = PAGE.lire("qrDataCodewords");
  for(const v of VERSIONS_LUES) NIVEAUX.forEach((n, e) => assert.equal(Math.floor((dc(v, e) * 8 - 4 - (v < 10 ? 8 : 16)) / 8), capaciteOctets(v, n), `encodeur ${v}-${n}`));
});
await test("Reed-Solomon : exemple de la norme (« 01234567 », version 1-M)", () => {
  const donnees = [0x10, 0x20, 0x0C, 0x56, 0x61, 0x80, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11];
  assert.deepEqual(PAGE.lire("qrReedSolomon")(donnees, 10), [0xA5, 0x24, 0xD4, 0xC1, 0xED, 0x36, 0xC7, 0x87, 0x2C, 0x55]);
});
await test("Informations de format et de version : valeurs connues de la norme", () => {
  const fmt = q => [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]].reduce((v, [x, y], i) => v | (q.dark(x, y) ? 1 << i : 0), 0);
  const connus = { L: "111011111000100", M: "101010000010010", Q: "011010101011111", H: "001011010001001" }; // masque 0
  for(const [n, bits] of Object.entries(connus)) assert.equal(fmt(qr("test", n, 0)).toString(2).padStart(15, "0"), bits, `format ${n}, masque 0`);
  const q7 = qr(lienAuHasard(110, 7), "M"); assert.equal(q7.version, 7);
  let v = 0; for(let i = 0; i < 18; i++) if(q7.dark(q7.size - 11 + i % 3, Math.floor(i / 3))) v |= 1 << i;
  assert.equal(v.toString(2).padStart(18, "0"), "000111110010010100", "information de version 7");
});
await test("Lien court : niveau Q, version 6 (41 × 41), relu à l'identique avec chacun des 8 masques", () => {
  const lien = "https://osedemander.fr/#s=" + lienAuHasard(22, 1) + "." + lienAuHasard(22, 2);
  const q = qr(lien, "Q"); assert.equal(q.version, 6); assert.equal(q.size, 41);
  assert.equal(relireQR(q).texte, lien);
  for(let m = 0; m < 8; m++){ const r = relireQR(qr(lien, "Q", m)); assert.equal(r.texte, lien, `masque ${m}`); assert.equal(r.masque, m); }
  for(const n of NIVEAUX) assert.equal(relireQR(qr(lien, n)).texte, lien, `niveau ${n}`);
});
await test("Liens complets jusqu'à 1 200 caractères (niveau M) : relus à l'identique, version 29 au plus", () => {
  for(let n = 30; n <= 1200; n += 47){
    const lien = "https://osedemander.fr/#i=y" + lienAuHasard(n - 27, n);
    const q = qr(lien, "M"); assert.ok(q && q.version <= 29, `${n} caractères : version ${q && q.version}`);
    assert.equal(relireQR(q).texte, lien, `${n} caractères`);
  }
  for(let m = 0; m < 8; m++){ const lien = "https://osedemander.fr/#i=y" + lienAuHasard(900, m); assert.equal(relireQR(qr(lien, "M", m)).texte, lien, `900 caractères, masque ${m}`); }
  assert.equal(qr("x".repeat(3000), "H"), null, "trop long : null");
});

/* =========================================================
   25. Partager en image : lien de l'image, dessin relu par le lecteur QR, rien de secret, Safari
   ========================================================= */
titre("25. Partager en image");
// Faux canevas : enregistre ce qui est peint (rectangles et textes)
const fauxCanevas = () => { const peint = [], textes = [];
  const base = { fillStyle: "", strokeStyle: "", font: "", lineWidth: 1, globalAlpha: 1, textAlign: "", textBaseline: "", lineCap: "",
    fillRect(x, y, w, h){ peint.push({ c: this.fillStyle, x, y, w, h }); }, fillText(t){ textes.push(t); }, measureText: t => ({ width: [...t].length * 30 }) };
  // Toute autre méthode du canevas (tracés, rotations, images…) : ne fait rien
  const ctx = new Proxy(base, { get: (t, k) => k in t ? t[k] : () => {} });
  return { canvas: { width: 0, height: 0, getContext: () => ctx }, peint, textes };
};
// Relit le QR code à partir des rectangles peints (un rectangle par module foncé). Les modules sous le logo ne sont pas peints :
// ils sont inconnus, et le lecteur doit les reconstituer (comme un téléphone), sinon le code ne se lit pas.
const relirePeint = (peint, q) => {
  const fonce = new Set(peint.filter(r => r.c === q.color && r.w === q.module).map(r => `${Math.round((r.x - q.x) / q.module)},${Math.round((r.y - q.y) / q.module)}`));
  const lg = q.logo, cache = lg ? (x, y) => x >= lg.from && x < lg.from + lg.size && y >= lg.from && y < lg.from + lg.size : () => false;
  return lireQR(q.size, (x, y) => fonce.has(`${x},${y}`), cache);
};
const DESSIN = { to: "Sam", th: "halloween", ac: "", occ: "halloween", em: "🎃", initial: "A" };
await test("Le dessin : dans chaque thème, en story et en carré, le QR code peint (logo compris) redonne exactement le lien", async () => {
  const court = "https://osedemander.fr/#s=" + lienAuHasard(22, 3) + "." + lienAuHasard(22, 4), long = "https://osedemander.fr/#i=y" + lienAuHasard(1100, 5);
  const themes = PAGE.lire("THEMES").map(t => t.id), contraste = PAGE.lire("contrast");
  for(const fmt of ["story", "carre"]) for(const [lien, niveau] of [[court, "Q"], [long, "M"]]) for(const th of themes){
    const f = fauxCanevas(), { qr: q } = await PAGE.lire("drawInviteImage")(fmt, { ...DESSIN, th, link: lien }, f.canvas);
    const r = relirePeint(f.peint, q), ou = `${fmt}, ${th}, ${lien.length} caractères`;
    assert.equal(r.texte, lien, ou); assert.equal(r.niveau, niveau, ou);
    if(lien === court){
      assert.ok(q.logo, `${ou} : logo sur le lien court`); assert.ok(r.effaces > 0, "les modules cachés sont bien reconstitués");
      assert.equal(r.version, 6, "version 6 : aucun motif d'alignement au centre");
      assert.ok(q.logo.size * q.logo.size / (q.size * q.size) <= .06, `logo : ${(100 * q.logo.size ** 2 / q.size ** 2).toFixed(1)} % des modules`);
    } else assert.equal(q.logo, null, `${ou} : pas de logo sur un code dense`);
    assert.ok(!f.peint.some(p => p.c === q.color && p.w === q.module && (p.x < q.x || p.y < q.y || p.x >= q.x + q.size * q.module || p.y >= q.y + q.size * q.module)), "rien dans la marge");
    assert.ok(q.module >= (lien === court ? 9 : 5), `${ou} : modules assez gros (${q.module} px)`);
    assert.ok(contraste(q.color, "#FFFFFF") >= 7, `${th} : QR code foncé sur blanc`);
  }
});
await test("Lecteur QR : sans reconstitution, un code au logo ne se lit pas ; au-delà de la capacité du niveau, illisible", () => {
  const q = qr("https://osedemander.fr/#s=" + lienAuHasard(22, 11) + "." + lienAuHasard(22, 12), "Q");
  const zone = k => { const L = Math.round(q.size * k) | 1, a = (q.size - L) / 2; return (x, y) => x >= a && x < a + L && y >= a && y < a + L; };
  const faux = z => (x, y) => z(x, y) ? !q.dark(x, y) : q.dark(x, y), logo = zone(.21);
  assert.throws(() => lireQR(q.size, faux(logo)), /abîmé/, "modules du logo lus tels quels : refusé");
  assert.equal(lireQR(q.size, faux(logo), logo).texte.length, 71);
  // Au-delà de la capacité du niveau (24 mots de code par bloc en Q, version 6) : illisible. 40 % des modules cachés au hasard (hors format)
  const hasard = (x, y) => !(x <= 8 && y <= 8) && !(x >= q.size - 8 && y <= 8) && !(x <= 8 && y >= q.size - 8) && ((x * 7919 + y * 104729) % 100) < 40;
  assert.throws(() => lireQR(q.size, q.dark, hasard), /trop de modules cachés/, "trop de modules cachés : illisible");
});
await test("L'image ne contient que le prénom, le texte prévu, le cachet et le pied (jamais la question, le message, le lieu, la date ni les coordonnées)", async () => {
  const f = fauxCanevas();
  await PAGE.lire("drawInviteImage")("story", { ...DESSIN, link: "https://osedemander.fr/#s=" + lienAuHasard(22, 6) + "." + lienAuHasard(22, 7) }, f.canvas);
  const permis = new Set(["🎃", "Scanne-moi", "osedemander.fr", "?"]);
  assert.equal(f.textes.filter(t => !permis.has(t)).join(" "), "Sam, j'ai une question pour toi\u00A0💌");
  const src = PAGE.lire("openImageSheet").toString();
  assert.ok(src.includes('{to:S.to, th:S.theme, ac:S.ac, occ:S.occ, em:S.em, initial:(S.from||"?").trim().charAt(0).toUpperCase(), link}'), "le dessin ne reçoit que ces champs");
  const f2 = fauxCanevas(); await PAGE.lire("drawInviteImage")("carre", { ...DESSIN, occ: "voyagesurprise", em: "🎁", link: "https://osedemander.fr/#s=" + lienAuHasard(22, 8) + "." + lienAuHasard(22, 9) }, f2.canvas);
  assert.ok(f2.textes.includes("💌") && !f2.textes.includes("🎁"), "occasion Surprise : cachet 💌");
});
await essaiWorker("« Retirer mes coordonnées » : lien court séparé, sans le canal ni l'identifiant (le numéro n'y est jamais)", async () => {
  const r = reseau(); brancher(r);
  const S = PAGE.lire("S"), d = INV({ c: "wa", ci: "06 00 00 00 01", l: { v: "v", x: "Salle de l'Exemple" } });
  const long = LOCAL + "/#i=" + await L.encodeData(d), sh = await PAGE.lire("createShort")(long.split("#i=")[1], LOCAL + "/");
  Object.assign(S, { link: sh.link, longLink: long, imgLinks: {}, chId: "06 00 00 00 01", to: "Sam" });
  const lienImage = await PAGE.lire("imageLink")(true);
  assert.ok(lienImage && lienImage !== sh.link && /#s=/.test(lienImage), "lien court séparé");
  const relu = await relire(lienImage);
  assert.equal(relu.c, "any"); assert.ok(!("ci" in relu), "aucun identifiant");
  assert.ok(!JSON.stringify(relu).includes("06 00 00 00 01"), "le numéro n'est nulle part");
  assert.equal(relu.l.x, "Salle de l'Exemple", "le reste de l'invitation est gardé");
  for(const q of r.journal) assert.ok(!q.body.includes("06 00 00 00 01"), "rien en clair envoyé");
  assert.equal(await PAGE.lire("imageLink")(false), sh.link, "sans l'option : le lien de l'invitation");
  assert.equal(await PAGE.lire("imageLink")(true), lienImage, "préparé une seule fois");
  Object.assign(S, { link: LOCAL + "/#i=y" + "A".repeat(1300), longLink: "", imgLinks: {} });
  assert.equal(await PAGE.lire("imageLink")(false), null, "plus de 1 200 caractères : pas d'image");
  Object.assign(S, { link: "", longLink: undefined, imgLinks: {}, chId: "" });
});
await test("Panneau : mention de confidentialité, image indisponible, Safari (aucune attente avant le partage), une action principale", () => {
  const src = PAGE.lire("openImageSheet").toString();
  assert.ok(src.includes("Toute personne qui scanne ce code peut ouvrir l'invitation, avec son lieu et sa date. Pour une story publique, pense à qui pourra la voir."));
  assert.ok(src.includes(`<p class="img-q" id="imgWhoLbl">Pour qui est cette image ?</p>`), "une seule question");
  assert.ok(src.includes(`<button type="button" data-who="groupe" aria-pressed="true">Pour une story ou un groupe</button>`), "« story ou groupe » par défaut");
  assert.ok(src.includes('<button type="button" data-who="perso" aria-pressed="false">Pour ${esc(S.to)} uniquement</button>'));
  assert.ok(src.includes('const hasId=!!S.chId, hasNz=!!S.nz, ask=hasId||hasNz, st={fmt:"story", strip:true'), "seulement s'il y a des coordonnées ou une notification");
  assert.ok(!src.includes("imgStrip"), "plus de case séparée");
  assert.equal(PAGE.lire("IMG_UNAVAILABLE"), "L'image n'est pas disponible pour le moment. Réessaie dans quelques minutes.");
  const clic = src.slice(src.indexOf('send.addEventListener("click"'), src.indexOf('$("#imgClose", d)'));
  assert.ok(clic.includes("navigator.share({files:[st.file]") && !clic.includes("await"), "partage lancé pendant le toucher, fichier déjà prêt");
  assert.ok(src.includes('save.classList.toggle("primary", !canShare)') && src.includes("send.hidden=!canShare"), "une seule action principale");
  assert.ok(src.includes('focusScreen("#imgTitle")') && src.includes('e.key==="Escape"'), "focus et Échap");
});
await test("Carte « Ton lien est prêt » : « Partager en image » en action secondaire", () => {
  const h = PAGE_PARTAGE.lire("readyHTML")();
  assert.ok(h.includes('<button type="button" class="btn" id="imgOpen">Partager en image</button>'));
  assert.deepEqual(principales(h), ["Partager le lien"]);
});
await test("« Mes invitations » : lien de l'image et son jeton validés, supprimés avec le lien en ligne", () => {
  const ok = PAGE.lire("validEntry"), base = { id: "abc123", from: "Alex", to: "Sam", occ: "date", when: [["2026-11-14", "20:00"]], created: "2026-10-17T10:00:00.000Z",
    link: `${LOCAL}/#s=${"A".repeat(22)}.${"B".repeat(22)}`, long: `${LOCAL}/#i=yAAAA`, jeton: "C".repeat(43) };
  assert.ok(ok({ ...base, img: `${LOCAL}/#s=${"D".repeat(22)}.${"E".repeat(22)}`, imgJeton: "F".repeat(43) }));
  assert.ok(!ok({ ...base, img: `${LOCAL}/#s=${"D".repeat(22)}.${"E".repeat(22)}` }), "lien de l'image sans jeton");
  assert.ok(!ok({ ...base, imgJeton: "F".repeat(43) }), "jeton sans lien");
  assert.ok(!ok({ ...base, img: `${LOCAL}/#i=yAAAA`, imgJeton: "F".repeat(43) }), "l'image utilise toujours un lien court");
  assert.ok(PAGE.lire("unpublishShort").toString().includes("if(it.img && it.imgJeton) await deleteShort(shortId(it.img), it.imgJeton);"));
});

/* =========================================================
   26. Référencement : bases techniques (robots.txt, sitemap.xml, canonique, données structurées, invitations jamais indexées)
   ========================================================= */
titre("26. Référencement : bases");
const SITE_URL = "https://osedemander.fr/";
const lireFichier = f => readFileSync(RACINE + f, "utf8").replace(/\r\n/g, "\n"); // fins de ligne Windows possibles (git)
const pagesDuPlan = () => [...lireFichier("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
await test("robots.txt : tout autorisé sauf tests, worker et outils ; adresse du plan du site", () => {
  const r = lireFichier("robots.txt");
  assert.match(r, /^User-agent: \*$/m);
  for(const d of ["/tests/", "/worker/", "/outils/"]) assert.ok(r.includes(`Disallow: ${d}\n`), `Disallow: ${d}`);
  assert.ok(!/^Disallow: \/$/m.test(r), "le site n'est jamais bloqué en entier");
  assert.ok(r.includes(`Sitemap: ${SITE_URL}sitemap.xml`));
});
await test("sitemap.xml : bien formé, adresses du site seulement, jamais d'invitation", () => {
  const x = lireFichier("sitemap.xml");
  assert.ok(x.startsWith('<?xml version="1.0" encoding="UTF-8"?>') && x.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') && x.trim().endsWith("</urlset>"));
  const locs = pagesDuPlan();
  assert.ok(locs.includes(SITE_URL) && locs.includes(SITE_URL + "mentions-legales.html"));
  assert.equal(new Set(locs).size, locs.length, "aucune adresse en double");
  for(const l of locs){ assert.ok(l.startsWith(SITE_URL) && !l.includes("#"), l); }
  assert.equal((x.match(/<url>/g) || []).length, (x.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length, "une date par adresse");
});
await test("Accueil : adresse canonique et données structurées (application web gratuite)", () => {
  const h = lireFichier("index.html");
  assert.ok(h.includes('<link rel="canonical" href="https://osedemander.fr/">'));
  const j = JSON.parse(h.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(j["@type"], "WebApplication"); assert.equal(j.url, SITE_URL); assert.equal(j.inLanguage, "fr");
  assert.equal(j.isAccessibleForFree, true); assert.deepEqual(j.offers, { "@type": "Offer", price: "0", priceCurrency: "EUR" });
  assert.ok(lireFichier("mentions-legales.html").includes('<link rel="canonical" href="https://osedemander.fr/mentions-legales.html">'));
});
await test("Invitations jamais indexées : « noindex » dès qu'une invitation s'ouvre (#i=, #s=, exemple)", () => {
  const route = PAGE.lire("route").toString(), ni = PAGE.lire("setNoindex").toString();
  assert.ok(route.includes("setNoindex(!!(m || ms || EXAMPLE));"));
  assert.ok(ni.includes('m.content="noindex, nofollow"') && ni.includes("m.remove()"), "posé à l'ouverture, retiré au retour à la création");
  assert.ok(!/<meta name="robots"/.test(lireFichier("index.html")), "l'accueil lui-même reste indexable");
});

/* =========================================================
   27. Référencement : route #modele= (pages d'occasion) et liens « Idées d'invitations »
   ========================================================= */
titre("27. Référencement : route #modele=");
const ouvrirModele = async hash => { const S = PAGE.lire("S"); Object.assign(S, { step: "home", tpl: "" }); PAGE.lire("location").hash = hash; await PAGE.lire("route")(); return S; };
await test("#modele= ouvre directement le modèle (étape 2), comme un choix sur l'accueil, puis disparaît de l'adresse", async () => {
  for(const p of PAGE.lire("OCC_PAGES")){
    const S = await ouvrirModele("#modele=" + p.tpl);
    assert.equal(S.tpl, p.tpl, p.path); assert.equal(S.step, 2, `${p.path} : étape 2`);
    assert.equal(PAGE.lire("location").hash, "", `${p.path} : #modele= retiré de l'adresse`);
  }
});
await test("Modèles de saison ouverts toute l'année par lien, sans changer la liste proposée à la création", async () => {
  PAGE.ecrire("SEASON_TODAY", "2026-08-15");
  const S = await ouvrirModele("#modele=noel");
  assert.equal(S.tpl, "noel"); assert.equal(S.theme, "noel");
  assert.ok(!PAGE.lire("catTemplates")("Famille").map(t => t.id).includes("noel"), "en août, Noël reste absent de la liste");
  PAGE.ecrire("SEASON_TODAY", "2026-10-15");
});
await test("Identifiant inconnu ou piégé : l'accueil, rien n'est appliqué", async () => {
  for(const h of ["#modele=inconnu", "#modele=../../etc", "#modele=noel<script>", "#modele="]){
    const S = await ouvrirModele(h);
    assert.equal(S.step, "home", h); assert.equal(S.tpl, "", h);
  }
  PAGE.lire("location").hash = "";
});
await test("Accueil : colonne « Idées » du pied de page, un lien par page d'occasion, cibles de 44 px", () => {
  const S = PAGE.lire("S"); Object.assign(S, { step: "home" }); PAGE.lire("renderCreator")();
  const h = PAGE.zones["#app"].innerHTML, P = PAGE.lire("OCC_PAGES");
  assert.equal(P.length, 6);
  for(const p of P){ assert.ok(h.includes(`<a href="/${p.path}/">`), p.path); assert.ok(PAGE.lire("TEMPLATES").some(t => t.id === p.tpl), `${p.tpl} : modèle existant`); }
  assert.ok(+(regleCSS(".site-foot li a").match(/min-height:(\d+)px/) || [])[1] >= 44);
  assert.ok(h.includes('<h2 id="sfIdees">Idées</h2>'));
  assert.deepEqual(P.map(p => p.path).sort(), ["demande-parrain-marraine", "demande-temoin-mariage", "invitation-anniversaire", "invitation-repas-de-noel", "invitation-reveillon-nouvel-an", "invitation-saint-valentin"]);
  S.step = 2; PAGE.lire("renderCreator")(); assert.ok(!PAGE.zones["#app"].innerHTML.includes('class="site-foot"'), "seulement sur l'accueil");
  S.step = "home";
});

/* =========================================================
   28. Pages d'occasion et page 404 (outils/pages.mjs) : à jour, uniques, accessibles, légères, jamais d'invitation
   ========================================================= */
titre("28. Pages d'occasion");
const { fichiers: fabriquer } = await import(new URL("../outils/pages.mjs", import.meta.url).href);
const { PAGES: PAGES_OCC } = await import(new URL("../outils/pages-data.mjs", import.meta.url).href);
const FAB = fabriquer();
await test("Pages publiées à jour (identiques à ce que fabrique outils/pages.mjs)", () => {
  for(const [nom, contenu] of Object.entries(FAB)) assert.equal(lireFichier(nom).replace(/\r\n/g, "\n"), contenu, `${nom} : relancer « node outils/pages.mjs »`);
});
await test("Chaque page : titre et description uniques, adresse canonique, un seul h1, plan du site", () => {
  const titres = new Set(), descriptions = new Set(), plan = pagesDuPlan();
  for(const p of PAGES_OCC){
    const h = FAB[`${p.path}/index.html`], titre = h.match(/<title>([^<]+)<\/title>/)[1], desc = h.match(/<meta name="description" content="([^"]+)">/)[1];
    assert.ok(titre.length >= 30 && titre.length <= 65, `${p.path} : titre de ${titre.length} caractères`);
    assert.ok(desc.length >= 110 && desc.length <= 170, `${p.path} : description de ${desc.length} caractères`);
    assert.ok(!titres.has(titre) && !descriptions.has(desc), `${p.path} : titre et description uniques`); titres.add(titre); descriptions.add(desc);
    assert.ok(h.includes(`<link rel="canonical" href="${SITE_URL}${p.path}/">`), `${p.path} : canonique`);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, `${p.path} : un seul h1`);
    assert.ok(plan.includes(`${SITE_URL}${p.path}/`), `${p.path} : dans le plan du site`);
    assert.ok(h.includes('<html lang="fr"'), "langue");
  }
});
await test("Données structurées : fil d'Ariane et questions fréquentes, identiques au texte de la page", () => {
  for(const p of PAGES_OCC){
    const h = FAB[`${p.path}/index.html`], j = JSON.parse(h.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
    const [fil, faq] = j["@graph"];
    assert.equal(fil["@type"], "BreadcrumbList"); assert.equal(fil.itemListElement[1].item, `${SITE_URL}${p.path}/`);
    assert.equal(faq["@type"], "FAQPage");
    assert.equal(faq.mainEntity.length, (h.match(/<details>/g) || []).length, `${p.path} : autant de questions que dans la page`);
  }
});
await test("Une seule action principale : « Créer mon invitation » vers le bon modèle (/#modele=)", () => {
  const T = PAGE.lire("TEMPLATES"), OP = PAGE.lire("OCC_PAGES");
  for(const p of PAGES_OCC){
    const h = FAB[`${p.path}/index.html`];
    assert.deepEqual(principales(h), ["Créer mon invitation"], p.path);
    assert.ok(h.includes(`<a class="btn primary" href="/#modele=${p.tpl}">`), `${p.path} : lien du modèle`);
    assert.ok(T.some(t => t.id === p.tpl), `${p.tpl} : modèle existant`);
    for(const [, id] of h.matchAll(/href="\/#modele=([a-z]+)"/g)) assert.ok(T.some(t => t.id === id), `${p.path} : modèle ${id}`);
    const o = OP.find(x => x.path === p.path); assert.ok(o && o.tpl === p.tpl && o.label === p.label, `${p.path} : même adresse, nom et modèle que OCC_PAGES (index.html)`);
  }
});
await test("Pages légères, sans appel extérieur, sans aucun lien d'invitation, textes neutres sans flèche", () => {
  for(const [nom, h] of Object.entries(FAB)){
    if(!nom.endsWith(".html")) continue;
    assert.ok(gzipSync(h).length < 20000, `${nom} : ${gzipSync(h).length} octets compressés`);
    for(const [, u] of h.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(u.startsWith("/") || u.startsWith("#") || u.startsWith(SITE_URL) || u.startsWith("mailto:contact" + "@osedemander.fr"), `${nom} : ressource extérieure ${u}`);
    assert.ok(!/#i=|#s=/.test(h.replace(/href="\/#exemple"/g, "")) && !/#exemple/.test(h.replace(/href="\/#exemple"/g, "")), `${nom} : aucun lien d'invitation (seulement la démonstration « Voir un exemple »)`);
    assert.ok(!/<script(?! type="application\/ld\+json")/.test(h), `${nom} : aucun script (contenu lisible sans JavaScript)`);
    const texte = h.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>/g, "");
    assert.ok(!/[←→]| · /.test(texte), `${nom} : ni flèche ni « · »`);
    const mots = texte.replace(/<[^>]+>|&nbsp;/g, " ").split(/[\s,.;:!?«»()]+/);
    for(const m of ["Prêt", "prêt", "Prête", "prête", "invité", "invités", "Invité"]) assert.ok(!mots.includes(m), `${nom} : formulation genrée « ${m} »`);
  }
});
await test("Accessibilité : lien d'évitement, décor caché aux lecteurs d'écran, questions au clavier, cibles de 44 px", () => {
  for(const p of PAGES_OCC){
    const h = FAB[`${p.path}/index.html`];
    assert.ok(h.includes('<a class="skip" href="#contenu">Aller au contenu</a>') && h.includes('<main id="contenu">'));
    assert.ok(h.includes('<div id="scene" aria-hidden="true">') && h.includes('<div class="scene-sign anim-n" aria-hidden="true">'));
    assert.ok(/summary\{[^}]*min-height:48px/.test(h) && /\.site-foot li a\{[^}]*min-height:44px/.test(h) && /\.btn\{[^}]*min-height:50px/.test(h));
    assert.ok(h.includes("@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}"), "moins de mouvement");
  }
});
await test("Page 404 : jamais indexée, lien vers l'accueil et les idées d'invitations", () => {
  const h = FAB["404.html"];
  assert.ok(h.includes('<meta name="robots" content="noindex">') && !h.includes('rel="canonical"'));
  assert.deepEqual(principales(h), ["Créer ma propre invitation"]);
  for(const p of PAGES_OCC) assert.ok(h.includes(`<a href="/${p.path}/">`), p.path);
});

await test("Service worker : pages d'occasion gardées à la visite (jamais une 404), plan du site et robots.txt jamais en cache", () => {
  const sw = lireFichier("sw.js");
  assert.ok(sw.includes('if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") return;'), "plan du site et robots.txt : toujours le serveur");
  assert.ok(sw.includes('if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }'), "une page 404 n'est jamais gardée");
  assert.ok(sw.includes('.catch(() => caches.match(req).then(r => r || caches.match("./index.html")))'), "hors connexion : la page gardée, sinon l'accueil");
  assert.ok(!/invitation-|demande-/.test(sw.slice(sw.indexOf("const CORE"), sw.indexOf("];"))), "pages d'occasion non préchargées (installation légère)");
});

/* =========================================================
   29. Texte des décors lisible sans mise en page (moteurs de recherche, lecteurs d'écran, copier-coller)
   ========================================================= */
titre("29. Texte des décors");
// Lecture « à plat », comme un moteur de recherche : on retire les balises sans rien ajouter
const aPlat = svg => svg.replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
await test("Scènes, page d'accueil et pages d'erreur : jamais deux lignes de texte collées", () => {
  const S = PAGE.lire("SCENES"), E = PAGE.lire("ERR_ART");
  const svgs = [...Object.entries(S).flatMap(([k, s]) => [[`${k} (élément vedette)`, s.sign], [`${k} (décor)`, s.wall]]), ...Object.entries(E).map(([k, s]) => [`erreur ${k}`, s])];
  for(const [nom, s] of svgs) assert.ok(!/<\/text>(?!\s)/.test(s), `${nom} : </text> suivi d'une autre balise sans espace`);
  assert.equal(aPlat(S.valentin.sign), "Un cœur pour toi");
  assert.equal(aPlat(S.noel.sign).replace(/ ?\?$/, ""), "Il reste une place à table");
});
await test("Pages d'occasion : le texte de l'élément vedette se lit avec ses espaces", () => {
  const attendu = { "invitation-saint-valentin": "Un cœur pour toi", "invitation-repas-de-noel": "Il reste une place à table", "invitation-reveillon-nouvel-an": "Bientôt minuit…",
    "demande-temoin-mariage": "À mes côtés ?", "demande-parrain-marraine": "Un rôle pour toi", "invitation-anniversaire": "C'est ma fête !" };
  for(const [p, phrase] of Object.entries(attendu)){
    const h = lireFichier(`${p}/index.html`), signe = h.slice(h.indexOf('<div class="scene-sign'), h.indexOf("</div>", h.indexOf('<div class="scene-sign')));
    assert.ok(aPlat(signe).includes(phrase), `${p} : « ${aPlat(signe)} » au lieu de « ${phrase} »`);
  }
});

/* =========================================================
   30. IndexNow : fichier de clé, adresses signalées, corps de la requête
   ========================================================= */
titre("30. IndexNow");
const IN = await import(new URL("../outils/indexnow.mjs", import.meta.url).href);
await test("Fichier de clé à la racine : un seul, nommé d'après la clé, qui contient exactement la clé", () => {
  const cles = readdirSync(RACINE).filter(f => /^[a-f0-9]{32}\.txt$/.test(f));
  assert.deepEqual(cles, [IN.FICHIER_CLE], "un seul fichier de clé, celui du script");
  assert.equal(lireFichier(IN.FICHIER_CLE).trim(), IN.CLE);
  assert.ok(/^[a-f0-9]{32}$/.test(IN.CLE), "clé de 32 caractères hexadécimaux (8 à 128 autorisés)");
  assert.ok(!pagesDuPlan().some(u => u.includes(IN.CLE)), "le fichier de clé n'est pas dans le plan du site");
});
await test("Adresses signalées : seulement celles du plan du site, d'après les fichiers modifiés", () => {
  const plan = pagesDuPlan();
  assert.deepEqual(IN.adressesModifiees(["index.html", "invitation-saint-valentin/index.html", "sw.js", "tests/run.mjs", "404.html", "outils/pages.mjs"], plan),
    [SITE_URL, SITE_URL + "invitation-saint-valentin/"], "accueil et page modifiée ; rien de technique");
  assert.deepEqual(IN.adressesModifiees(["mentions-legales.html"], plan), [SITE_URL + "mentions-legales.html"]);
  assert.deepEqual(IN.adressesModifiees(["README.md", "worker/src/index.js"], plan), [], "rien à signaler");
  assert.deepEqual(IN.adressesDuPlan(), plan);
});
await test("Corps de la requête : hôte, clé, emplacement de la clé, jamais d'invitation", () => {
  const c = IN.corps(pagesDuPlan());
  assert.equal(c.host, "osedemander.fr"); assert.equal(c.key, IN.CLE); assert.equal(c.keyLocation, `${SITE_URL}${IN.FICHIER_CLE}`);
  for(const u of c.urlList) assert.ok(u.startsWith(SITE_URL) && !u.includes("#"), u);
  assert.equal(IN.POINT, "https://api.indexnow.org/indexnow");
  const src = readFileSync(RACINE + "outils/indexnow.mjs", "utf8");
  assert.ok(src.indexOf("fetch(SITE + FICHIER_CLE") < src.indexOf("fetch(POINT"), "le fichier de clé est vérifié en ligne avant l'envoi");
});

/* =========================================================
   31. Retours et carte d'exemple de l'accueil
   ========================================================= */
titre("31. Retours et carte d'exemple");
await test("Choix du modèle : « Retour » en haut de l'étape (plus de bouton « Accueil » tout en bas)", () => {
  const S = PAGE.lire("S"); PAGE.lire("applyTemplate")("rdv");
  Object.assign(S, { step: 1 }); PAGE.lire("renderCreator")();
  const h = PAGE.zones["#app"].innerHTML;
  assert.ok(h.includes('<button type="button" class="back-top" id="back">Retour</button>'));
  assert.ok(h.indexOf('id="back"') < h.indexOf('class="progress"'), "avant la barre de progression, en haut");
  assert.ok(!h.includes('class="nav"') && !h.includes(">Accueil</button>"), "plus rien tout en bas");
  assert.ok(+(regleCSS(".back-top").match(/min-height:(\d+)px/) || [])[1] >= 44, "cible de 44 px");
  for(const step of [2, 3]){ S.step = step; PAGE.lire("renderCreator")(); const h2 = PAGE.zones["#app"].innerHTML;
    assert.ok(h2.includes('<button type="button" class="btn ghost" id="back">Retour</button>') && !h2.includes("back-top"), `étape ${step} : Retour en bas, à côté de Continuer`); }
  S.step = "home";
  assert.ok(PAGE.lire("bindCreator").toString().includes('go(S.step===1 ? "home" : S.step-1)'), "Retour de l'étape 1 : l'accueil");
});
await test("« Voir un exemple » : un bouton « Retour » de 44 px vers l'accueil, texte lisible", () => {
  PAGE.ecrire("EXAMPLE", true); const b = PAGE.lire("demoBanner")(); PAGE.ecrire("EXAMPLE", false);
  assert.equal(b, `<p class="demo-banner"><a class="demo-back" href="./">Retour</a> <span>Exemple : aucune réponse n'est envoyée.</span></p>`);
  assert.ok(+(regleCSS(".demo-back").match(/min-height:(\d+)px/) || [])[1] >= 44);
  assert.equal(PAGE.lire("demoBanner")(), "", "rien hors de l'exemple");
});
await test("Carte d'exemple de l'accueil : le Non reste toujours à 20 px au moins du Oui, même sur un téléphone étroit", () => {
  const src = PAGE.lire("bindDemoTicket").toString();
  assert.ok(src.includes('box.classList.add("dodging")') && src.includes("const G=20"), "zone agrandie et marge de 20 px");
  assert.ok(src.includes("x+r.width<=yl-G || x>=yl+y.width+G || t+r.height<=yt-G || t>=yt+y.height+G"), "position libre seulement hors de la marge du Oui");
  assert.ok(src.includes("const coins=[[0,H],[W,H],[0,0],[W,0]].filter(([a,c])=>libre(a,c))"), "repli sur un coin libre, jamais sur le Oui");
  assert.ok(CSS.includes("@media (max-width:560px){.demo-answer.dodging{min-height:176px;align-items:flex-start}}"));
});

/* =========================================================
   32. Appli Android (TWA) : configuration, aucun secret dans le dépôt, liaison avec le site
   ========================================================= */
titre("32. Appli Android");
const TWA = JSON.parse(lireFichier("android/twa-manifest.json")), MANIF = JSON.parse(lireFichier("manifest.webmanifest"));
await test("Configuration : paquet fr.osedemander.app, osedemander.fr, nom, couleurs et icônes du site, notifications de réponse", () => {
  assert.equal(TWA.packageId, "fr.osedemander.app"); assert.equal(TWA.host, "osedemander.fr");
  assert.equal(TWA.name, "Ose Demander"); assert.equal(TWA.launcherName, "Ose Demander");
  assert.equal(TWA.startUrl, "/"); assert.equal(TWA.display, "standalone"); assert.equal(TWA.enableNotifications, true, "notifications de réponse : Chrome les confie à l'appli (autorisation demandée seulement si la case est cochée)");
  assert.equal(TWA.themeColor, MANIF.theme_color); assert.equal(TWA.backgroundColor, MANIF.background_color);
  assert.equal(TWA.iconUrl, SITE_URL + "icons/icon-512.png"); assert.equal(TWA.maskableIconUrl, SITE_URL + "icons/maskable-512.png");
  assert.ok(Number.isInteger(TWA.appVersionCode) && TWA.appVersionCode >= 1, "numéro de version entier (à augmenter à chaque envoi)");
  assert.equal(TWA.webManifestUrl, SITE_URL + "manifest.webmanifest");
  // Petite icône des notifications : silhouette blanche sur fond transparent (une icône opaque donnerait un carré blanc dans la barre d'état)
  assert.equal(TWA.monochromeIconUrl, SITE_URL + "icons/monochrome-512.png");
  assert.ok(MANIF.icons.some(i => i.src === "icons/monochrome-512.png" && i.purpose === "monochrome"), "icône monochrome dans le manifeste du site");
  const mono = readFileSync(RACINE + "icons/monochrome-512.png");
  assert.deepEqual([mono.readUInt32BE(16), mono.readUInt32BE(20), mono[25]], [512, 512, 6], "512 × 512, RVBA (transparence)");
  assert.equal(TWA.enableSiteSettingsShortcut, true, "raccourci « Paramètres du site » activé (sinon R8 renomme ManageDataLauncherActivity et l'appli plante au démarrage)");
  assert.ok(TWA.minSdkVersion >= 24,"minSdkVersion 24 au moins (exigé par androidbrowserhelper, sinon bubblewrap build échoue)");
});
await test("Clé de signature : hors du dépôt, chemin relatif sans nom d'utilisateur, jamais suivie par Git", () => {
  const p = TWA.signingKey.path;
  assert.ok(p.startsWith("../../") && !/^[A-Za-z]:|Users|HENRI|home/i.test(p), `chemin hors du dépôt et anonyme : ${p}`);
  const gi = lireFichier(".gitignore");
  for(const r of ["*.keystore", "*.jks", "*.p12", "*.apk", "*.aab", "/android/*", "!/android/twa-manifest.json"]) assert.ok(gi.split("\n").includes(r), `.gitignore : ${r}`);
  const suivis = execFileSync("git", ["ls-files"], { cwd: RACINE, encoding: "utf8" }).split("\n");
  assert.ok(!suivis.some(f => /\.(keystore|jks|p12|pfx|apk|aab|idsig)$/i.test(f)), "aucune clé ni appli compilée suivie par Git");
  assert.deepEqual(suivis.filter(f => f.startsWith("android/")).sort(), ["android/README.md", "android/fiche/banniere-1024x500.png", "android/fiche/icone-512.png", "android/twa-manifest.json"].filter(f => suivis.includes(f)).sort());
});
await test("Site : .well-known publié par GitHub Pages (_config.yml), projet Android exclu", () => {
  const c = lireFichier("_config.yml");
  assert.ok(/^include:\n  - \.well-known$/m.test(c), "include: .well-known");
  assert.ok(/^exclude:\n  - android$/m.test(c));
});
await test("Liaison (.well-known/assetlinks.json) : relie fr.osedemander.app à des empreintes SHA-256 valides", () => {
  let txt; try{ txt = lireFichier(".well-known/assetlinks.json"); }catch{ console.log("    (assetlinks.json pas encore créé : en attente de l'empreinte de la clé)"); return; }
  const j = JSON.parse(txt);
  assert.ok(Array.isArray(j) && j.length >= 1);
  for(const e of j){
    assert.deepEqual(e.relation, ["delegate_permission/common.handle_all_urls"]);
    assert.equal(e.target.namespace, "android_app"); assert.equal(e.target.package_name, "fr.osedemander.app");
    assert.ok(e.target.sha256_cert_fingerprints.length >= 1);
    for(const f of e.target.sha256_cert_fingerprints) assert.match(f, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/, "empreinte SHA-256 en majuscules, octets séparés par « : »");
  }
  // Les deux empreintes : la clé locale (apk installé à la main) et Google Play App Signing (appli du Play Store)
  const fp = j[0].target.sha256_cert_fingerprints;
  assert.ok(fp.includes("21:E0:78:45:3E:FD:8C:3E:24:D1:69:17:48:83:F4:E8:B9:4E:68:59:64:62:31:BB:82:9A:32:30:B0:6F:6D:12"), "clé de signature locale");
  assert.ok(fp.includes("AD:2D:84:89:74:FE:65:DD:99:F8:8C:D2:E5:89:74:22:36:5E:FC:E3:75:E8:43:4B:34:63:A9:04:62:90:7A:29"), "Google Play App Signing");
  assert.equal(new Set(fp).size, fp.length, "aucune empreinte en double");
});
await test("Fiche du Play Store : icône 512 × 512 et bannière 1 024 × 500", () => {
  const taille = f => { const b = readFileSync(RACINE + f); return [b.readUInt32BE(16), b.readUInt32BE(20), b[25]]; }; // largeur, hauteur, type de couleur PNG
  assert.deepEqual(taille("android/fiche/icone-512.png"), [512, 512, 6], "icône : 512 × 512, PNG 32 bits (RVBA)");
  assert.deepEqual(taille("android/fiche/banniere-1024x500.png").slice(0, 2), [1024, 500]);
  assert.ok(taille("android/fiche/banniere-1024x500.png")[2] === 2, "bannière sans transparence");
  assert.ok(lireFichier("mentions-legales.html").includes('<h3 id="android">Application Android</h3>'), "mentions légales : l'appli Android");
});

/* =========================================================
   33. Thème sombre du téléphone : pas d'assombrissement forcé par Chrome
   ========================================================= */
titre("33. Thème sombre du téléphone");
const PAGES_HTML = ["index.html", "mentions-legales.html", ...Object.keys(FAB).filter(f => f.endsWith(".html"))];
await test("Chaque page se déclare « light dark » (sinon Chrome, en thème sombre, inverse ses couleurs, y compris dans l'appli Android)", () => {
  for(const p of PAGES_HTML){
    const h = lireFichier(p);
    assert.equal((h.match(/<meta name="color-scheme" content="light dark">/g) || []).length, 1, `${p} : balise color-scheme`);
  }
  const css = lireFichier("index.html");
  assert.ok(!/color-scheme:\s*(only )?light\b(?!\s+dark)/.test(css.replace(/content="light dark"/, "")), "aucun élément « clair seulement » : Chrome l'assombrirait quand même");
});
await test("Thème sombre du téléphone : cases à cocher dessinées, icônes de date lisibles dans les thèmes clairs et sombres", () => {
  const css = lireFichier("index.html");
  assert.ok(/\.check input\{-webkit-appearance:none;appearance:none;/.test(css), "cases à cocher aux couleurs du thème");
  assert.ok(css.includes("@media (prefers-color-scheme:dark){input::-webkit-calendar-picker-indicator{filter:invert(1)}}"));
  const sombres = [...css.matchAll(/\[data-theme="(\w+)"\] \.error/g)].map(m => m[1]); // thèmes sombres (variante sombre des erreurs)
  assert.ok(sombres.length >= 4);
  for(const t of sombres) assert.ok(css.includes(`[data-theme="${t}"] input::-webkit-calendar-picker-indicator`) && [",", "{"].some(c => css.includes(`[data-theme="${t}"] input${c}`)),`thème sombre ${t} : icônes claires`);
});
await test("Pages fabriquées : mots insécables avec espace en « &nbsp; » (un <span> perdait l'espace avant lui : « duNouvel An »)", () => {
  for(const [nom, h] of Object.entries(FAB)) assert.ok(!/<span class="nw">[^<]* [^<]*<\/span>/.test(h), `${nom} : espace dans un .nw`);
});

/* =========================================================
   34. Notifications de réponse : le Worker (Web Push chiffré, VAPID, un seul envoi, expiration, limites)
   Le « service de notification » est simulé : le banc intercepte l'envoi, le déchiffre comme l'appareil abonné
   (tests/webpush-lecteur.mjs, node:crypto) et vérifie la signature VAPID.
   ========================================================= */
titre("34. Notifications : le Worker");
const WP = await import(new URL("./webpush-lecteur.mjs", import.meta.url).href);
const PUSH = await import(new URL("../worker/src/push.js", import.meta.url).href);
// Clés de test, tirées à chaque passage (jamais les vraies : celles-ci sont des secrets Cloudflare)
const VAPID_TEST = await (async () => {
  const p = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  return { pub: Buffer.from(await crypto.subtle.exportKey("raw", p.publicKey)).toString("base64url"), d: (await crypto.subtle.exportKey("jwk", p.privateKey)).d };
})();
const ENV_N = (extra = {}) => ENV({ VAPID_PUBLIQUE: VAPID_TEST.pub, VAPID_PRIVEE: VAPID_TEST.d, CLE_STOCKAGE: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url"), ...extra });
const ENDPOINT_EX = "https://fcm.googleapis.com/fcm/send/exemple-abonnement-fictif";
const NID = "NNNNNNNNNNNNNNNNNNNNNN", REP_EX = "R".repeat(60);
// Service de notification simulé : enregistre chaque envoi et répond avec le code demandé
let envois = [], codePush = 201;
const vraiFetch = globalThis.fetch;
const avecPush = async f => {
  envois = []; codePush = 201;
  globalThis.fetch = async (url, o) => { envois.push({ url: String(url), headers: o.headers, corps: Buffer.from(o.body) }); return new Response(null, { status: codePush }); };
  try{ await f(); }finally{ globalThis.fetch = vraiFetch; }
};
const abonner = async (env, app, extra = {}) => appel(env, "POST", "/v1/notifs", { id: NID, abo: { endpoint: ENDPOINT_EX, keys: app.keys }, del: await empreinteDe(JETON_EX), expire: Date.now() + 30 * 864e5, ...extra });
const repondre = (env, c = REP_EX, id = NID, ip) => appel(env, "POST", `/v1/notifs/${id}/reponse`, { c }, SITE, ip);

await essaiWorker("S'abonner puis répondre : la notification part chiffrée (RFC 8291), signée (VAPID), avec seulement la réponse chiffrée", async () => {
  await avecPush(async () => {
    const env = ENV_N(), app = WP.appareil();
    const r = await abonner(env, app); assert.equal(r.status, 201);
    const rep = await repondre(env); assert.equal(rep.status, 200); assert.deepEqual(await rep.json(), { ok: true });
    assert.equal(envois.length, 1); const e = envois[0];
    assert.equal(e.url, ENDPOINT_EX);
    assert.equal(e.headers["Content-Encoding"], "aes128gcm"); assert.ok(+e.headers.TTL > 0 && +e.headers.TTL <= 7 * 86400);
    const rev = WP.verifierVapid(e.headers.Authorization, ENDPOINT_EX, VAPID_TEST.pub);
    assert.equal(rev.sub, WORKER.SUJET_VAPID); assert.match(rev.sub, /^mailto:contact.osedemander\.fr$/);
    const message = JSON.parse(WP.dechiffrer(app, e.corps));
    assert.deepEqual(message, { v: 1, i: NID, c: REP_EX }, "le message ne contient que l'identifiant et la réponse chiffrée par la personne invitée");
  });
});
await essaiWorker("Un seul envoi : l'abonnement est effacé dès l'envoi, puis « déjà envoyée » (410) ; identifiant oublié 30 jours après l'expiration", async () => {
  await avecPush(async () => {
    const env = ENV_N(); await abonner(env, WP.appareil()); await repondre(env);
    assert.deepEqual({ ...env.DB.db.prepare("SELECT abo, etat FROM notifs").get() }, { abo: null, etat: "envoye" }, "abonnement effacé de la base");
    const r2 = await repondre(env); assert.equal(r2.status, 410); assert.deepEqual(await r2.json(), { raison: "envoye" });
    assert.equal(envois.length, 1, "aucun second envoi");
    env.DB.db.prepare("UPDATE notifs SET expire = ?").run(Date.now() - WORKER.NOTIF_GARDE - 1000);
    await WORKER.default.scheduled({}, env);
    assert.equal(env.DB.db.prepare("SELECT COUNT(*) AS n FROM notifs").get().n, 0);
    assert.equal((await repondre(env)).status, 404);
  });
});
await essaiWorker("Abonnement chiffré au repos : ni l'adresse du service ni les clés de l'appareil ne sont lisibles dans la base", async () => {
  await avecPush(async () => {
    const env = ENV_N(), app = WP.appareil(); await abonner(env, app);
    const abo = env.DB.db.prepare("SELECT abo FROM notifs").get().abo;
    for(const fragment of ["fcm.googleapis.com", "exemple-abonnement", app.keys.p256dh.slice(0, 20), app.keys.auth]) assert.ok(!abo.includes(fragment), `en clair : ${fragment}`);
    assert.match(abo, /^[\w-]{16}\.[\w-]+$/);
    // Lié à son identifiant : recopié sur un autre identifiant, il ne s'ouvre pas
    await assert.rejects(PUSH.ouvrirAbo(abo, "M".repeat(22), env));
    assert.equal((await PUSH.ouvrirAbo(abo, NID, env)).endpoint, ENDPOINT_EX);
  });
});
await essaiWorker("Expiration : dernier créneau + 7 jours, un an au plus ; abonnement jamais utilisé effacé par la tâche quotidienne", async () => {
  await avecPush(async () => {
    const env = ENV_N();
    const r = await abonner(env, WP.appareil(), { expire: Date.now() + 3 * 365 * 864e5 });
    assert.ok((await r.json()).expire <= Date.now() + 365 * 864e5, "plafonné à un an");
    assert.equal((await abonner(ENV_N(), WP.appareil(), { expire: Date.now() - 1000 })).status, 400, "date passée refusée");
    env.DB.db.prepare("UPDATE notifs SET expire = ?").run(Date.now() - 1000);
    const rep = await repondre(env); assert.equal(rep.status, 410); assert.deepEqual(await rep.json(), { raison: "expire" });
    assert.equal(envois.length, 0, "rien n'est envoyé après l'expiration");
    const env2 = ENV_N(); await abonner(env2, WP.appareil());
    env2.DB.db.prepare("UPDATE notifs SET expire = ?").run(Date.now() - 1000);
    await WORKER.default.scheduled({}, env2);
    assert.deepEqual({ ...env2.DB.db.prepare("SELECT abo, etat FROM notifs").get() }, { abo: null, etat: "expire" });
  });
});
await essaiWorker("Appareil désabonné (404 / 410 du service) : abonnement effacé ; erreur passagère (500) : gardé, on peut réessayer (502)", async () => {
  await avecPush(async () => {
    const env = ENV_N(); await abonner(env, WP.appareil());
    codePush = 500; assert.equal((await repondre(env)).status, 502);
    assert.equal(env.DB.db.prepare("SELECT etat FROM notifs").get().etat, null, "gardé après une erreur passagère");
    codePush = 410; const r = await repondre(env); assert.equal(r.status, 410); assert.deepEqual(await r.json(), { raison: "expire" });
    assert.deepEqual({ ...env.DB.db.prepare("SELECT abo, etat FROM notifs").get() }, { abo: null, etat: "expire" });
  });
});
await essaiWorker("Renoncer : jeton faux refusé (403), bon jeton accepté, plus aucun envoi ensuite", async () => {
  await avecPush(async () => {
    const env = ENV_N(); await abonner(env, WP.appareil());
    assert.equal((await appel(env, "POST", `/v1/notifs/${NID}/supprimer`, { jeton: "C".repeat(43) })).status, 403);
    assert.equal((await appel(env, "POST", `/v1/notifs/${NID}/supprimer`, { jeton: JETON_EX })).status, 200);
    const r = await repondre(env); assert.equal(r.status, 410); assert.deepEqual(await r.json(), { raison: "supprime" });
    assert.equal(envois.length, 0);
  });
});
await essaiWorker("Validation stricte : service de notification inconnu, http, clés mal formées, champ en trop, réponse trop longue ou trop courte", async () => {
  await avecPush(async () => {
    const app = WP.appareil(), del = await empreinteDe(JETON_EX), exp = Date.now() + 864e5;
    const abo = (endpoint, keys = app.keys, plus = {}) => appel(ENV_N(), "POST", "/v1/notifs", { id: NID, abo: { endpoint, keys, ...plus }, del, expire: exp });
    for(const ep of ["https://exemple.com/push", "http://fcm.googleapis.com/fcm/send/x", "https://fcm.googleapis.com:8443/x", "https://fcm.googleapis.com.exemple.com/x", "https://u:p" + "@fcm.googleapis.com/x", "fcm.googleapis.com/x"])
      assert.equal((await abo(ep)).status, 400, ep);
    for(const ep of ["https://updates.push.services.mozilla.com/wpush/v2/x", "https://web.push.apple.com/x", "https://wns2-par02p.notify.windows.com/w/?token=x"])
      assert.equal((await abo(ep)).status, 201, ep);
    assert.equal((await abo(ENDPOINT_EX, { ...app.keys, p256dh: "A".repeat(87) })).status, 400, "pas un point P-256 non compressé");
    assert.equal((await abo(ENDPOINT_EX, { p256dh: app.keys.p256dh })).status, 400);
    assert.equal((await abo(ENDPOINT_EX, app.keys, { expirationTime: null })).status, 400, "champ en trop");
    assert.equal((await appel(ENV_N(), "POST", "/v1/notifs", { id: NID, abo: { endpoint: ENDPOINT_EX, keys: app.keys }, del, expire: exp, x: 1 })).status, 400);
    assert.equal((await appel(ENV_N(), "POST", "/v1/notifs", "x".repeat(WORKER.NOTIF_CORPS_MAX + 1))).status, 413);
    const env = ENV_N(); await abonner(env, app);
    assert.equal((await repondre(env, "R".repeat(WORKER.REPONSE_MAX + 1))).status, 400);
    assert.equal((await repondre(env, "R".repeat(20))).status, 400);
    assert.equal((await repondre(env, "R+R/".repeat(15))).status, 400, "hors base64url");
    assert.equal((await appel(env, "GET", `/v1/notifs/${NID}/reponse`)).status, 405, "aucune lecture");
    assert.equal((await appel(env, "GET", `/v1/notifs/${NID}`)).status, 404);
    assert.equal(envois.length, 0);
  });
});
await essaiWorker("Limites par adresse IP (429), clés absentes ou base indisponible (503)", async () => {
  await avecPush(async () => {
    const comptes = new Map(), limiteur = { limit: async ({ key }) => { const n = (comptes.get(key) || 0) + 1; comptes.set(key, n); return { success: n <= 2 }; } };
    const env = ENV_N({ LIMITE_ENVOI: limiteur }); await abonner(env, WP.appareil());
    codePush = 500;
    assert.deepEqual([(await repondre(env)).status, (await repondre(env)).status, (await repondre(env)).status], [502, 502, 429]);
    assert.equal((await repondre(env, REP_EX, NID, "198.51.100.9")).status, 502, "autre adresse : pas concernée");
    comptes.clear(); const env2 = ENV_N({ LIMITE_ABO: limiteur });
    const a = i => appel(env2, "POST", "/v1/notifs", { id: String(i).padStart(22, "N"), abo: { endpoint: ENDPOINT_EX, keys: WP.appareil().keys }, del: JETON_EX.slice(0, 43), expire: Date.now() + 864e5 });
    assert.deepEqual([(await a(1)).status, (await a(2)).status, (await a(3)).status], [201, 201, 429]);
    assert.equal((await abonner(ENV_N({ VAPID_PRIVEE: undefined }), WP.appareil())).status, 503, "sans clé VAPID");
    const env3 = ENV_N(); env3.DB.panne(true); assert.equal((await abonner(env3, WP.appareil())).status, 503);
  });
});
await test("Notifications : clés hors du dépôt (secrets Cloudflare), clé publique identique dans wrangler.toml et index.html", () => {
  const toml = readFileSync(RACINE + "worker/wrangler.toml", "utf8"), push = readFileSync(RACINE + "worker/src/push.js", "utf8");
  const pub = /^VAPID_PUBLIQUE = "([\w-]{87})"$/m.exec(toml);
  assert.ok(pub, "clé publique VAPID dans wrangler.toml");
  assert.ok(!/VAPID_PRIVEE\s*=|CLE_STOCKAGE\s*=/.test(toml), "jamais la clé privée ni la clé de stockage dans wrangler.toml");
  assert.ok(!/console\.|\.log\(/.test(push.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun journal");
  // Aucune clé privée EC dans le dépôt : ni JWK « d », ni PEM
  const suivis = execFileSync("git", ["ls-files"], { cwd: RACINE, encoding: "utf8" }).split("\n").filter(f => /\.(js|mjs|json|toml|html|md|txt)$/.test(f));
  for(const f of suivis){ const t = readFileSync(RACINE + f, "utf8"); assert.ok(!/"d"\s*:\s*"[\w-]{43}"/.test(t) && !/BEGIN (EC )?PRIVATE KEY/.test(t), `clé privée possible dans ${f}`); }
  for(const r of ["LIMITE_ABO", "LIMITE_ENVOI"]) assert.ok(toml.includes(`name = "${r}"`), r);
  const sch = readFileSync(RACINE + "worker/schema.sql", "utf8");
  assert.ok(/CREATE TABLE IF NOT EXISTS notifs \(\s*id\s+TEXT PRIMARY KEY,\s*abo\s+TEXT,\s*del\s+TEXT NOT NULL,\s*expire INTEGER NOT NULL,\s*etat\s+TEXT\s*\)/.test(sch), "aucune colonne pour la réponse ni pour l'invitation");
});

/* =========================================================
   35. Notifications de réponse : le site (lien, confidentialité, écrans, envoi de bout en bout, historique, sw.js)
   ========================================================= */
titre("35. Notifications : le site");
const NZ_EX = "QUJDREVGR0hJSktMTU5PUA.ZXhlbXBsZS1kZS1jbGUxMg";
await test("Lien : champ nz / Z validé strictement ; jamais dans un rappel ni une version partagée", async () => {
  const d = INV({ nz: NZ_EX });
  assert.equal(d.nz, NZ_EX);
  assert.equal((await L.decodeData(await L.encodeData(d))).nz, NZ_EX, "aller-retour (format compact)");
  for(const faux of ["court.court", NZ_EX + "A", NZ_EX.replace(".", ":"), 12, null, NZ_EX + ".x"]) assert.ok(!("nz" in INV({ nz: faux })), `refusé : ${faux}`);
  assert.ok(!("nz" in L.sanitize({ ...INV(), nz: NZ_EX, rv: 1 })) && !("nz" in L.sanitize({ ...INV(), nz: NZ_EX, vu: 1 })), "ni rappel ni version partagée");
  const compact = c => L.decodeData("x" + Buffer.from(JSON.stringify(c)).toString("base64url"));
  const base = { f: "Alex", t: "Sam", q: 1, a: "Dîner", w: 600000 };
  assert.equal((await compact({ ...base, Z: NZ_EX })).nz, NZ_EX);
  await assert.rejects(compact({ ...base, Z: "court" }), "Z mal formé : lien refusé");
  await assert.rejects(compact({ ...base, Z: 5 }));
  assert.ok(L.LINK_KEYS.includes("Z"));
});
await test("Liens dérivés sans notification : rappel d'agenda, « Partager la surprise », image (avec ou sans coordonnées)", () => {
  const d = INV({ nz: NZ_EX, c: "wa", ci: "06 00 00 00 01" });
  assert.ok(!("nz" in PAGE.lire("reminderData")(d, 0)), "rappel");
  assert.ok(!("nz" in PAGE.lire("shareData")(d, 0)), "partage");
  const img = PAGE.lire("imageData");
  assert.ok(!("nz" in img(d)) && !("ci" in img(d)) && img(d).c === "any", "image « story ou groupe » : ni coordonnées ni notification");
});
await essaiWorker("Image « Pour qui ? » : « {prénom} uniquement » = le lien de l'invitation (coordonnées et notification) ; « story ou groupe » = lien séparé sans les deux", async () => {
  const r = reseau(); brancher(r);
  const S = PAGE.lire("S"), image = PAGE.lire("imageLink");
  try{
    // Notification seule (sans coordonnées)
    const d = INV({ nz: NZ_EX, c: "any" }), long = LOCAL + "/#i=" + await L.encodeData(d), sh = await PAGE.lire("createShort")(long.split("#i=")[1], LOCAL + "/");
    Object.assign(S, { link: sh.link, longLink: long, imgLinks: {}, chId: "", nz: NZ_EX, to: "Sam" });
    assert.equal(await image(false), sh.link, "pour Sam : le même lien court que le lien direct");
    assert.equal((await relire(await image(false))).nz, NZ_EX, "avec la notification");
    const groupe = await image(true);
    assert.ok(groupe !== sh.link && /#s=/.test(groupe), "story ou groupe : lien court séparé");
    assert.ok(!("nz" in await relire(groupe)), "sans la notification");
    // Rien à retirer : le même lien dans les deux cas, aucun dépôt de plus
    const d2 = INV({ c: "any" }), long2 = LOCAL + "/#i=" + await L.encodeData(d2), sh2 = await PAGE.lire("createShort")(long2.split("#i=")[1], LOCAL + "/");
    Object.assign(S, { link: sh2.link, longLink: long2, imgLinks: {}, chId: "", nz: "" });
    const n = r.journal.length;
    assert.equal(await image(true), sh2.link); assert.equal(r.journal.length, n, "aucun lien séparé inutile");
  } finally { Object.assign(S, { link: "", longLink: undefined, imgLinks: {}, chId: "", nz: "", to: "" }); }
  const note = PAGE.lire("imageWhoNote");
  Object.assign(S, { to: "Sam" });
  assert.equal(note(true, true, true), "L'image ouvre une version sans tes coordonnées ni la notification de réponse : elle peut circuler sans risque. La réponse se fera par le partage du téléphone.");
  assert.equal(note(true, false, true), "L'image ouvre une version sans la notification de réponse : elle peut circuler sans risque. La réponse se fera par le partage du téléphone.");
  assert.equal(note(false, true, true), "L'image ouvre l'invitation comme le lien direct, avec tes coordonnées et la notification de réponse. Envoie-la seulement à Sam.");
  assert.equal(note(false, false, true), "L'image ouvre l'invitation comme le lien direct, avec la notification de réponse. Envoie-la seulement à Sam.");
  assert.equal(note(false, true, false), "L'image ouvre l'invitation comme le lien direct, avec tes coordonnées. Envoie-la seulement à Sam.");
  Object.assign(S, { to: "" });
  assert.ok(PAGE.lire("bindCreator").toString().includes('S.nz = notif?.nz || "";'), "la notification du lien est retenue à la création");
});
await essaiWorker("Ouvrir une invitation avec notification n'appelle jamais le Worker (aucun suivi des ouvertures)", async () => {
  const r = reseau(); brancher(r);
  const lien = LOCAL + "/#i=" + await L.encodeData(INV({ nz: NZ_EX }));
  const h = await ouvrirLien(lien);
  assert.ok(h.includes('class="envelope'), "l'invitation s'ouvre");
  assert.equal(PAGE.lire("D").nz, NZ_EX);
  assert.equal(r.journal.length, 0, "aucune requête à l'ouverture");
});
await essaiWorker("Envoi de bout en bout : la page chiffre, le Worker transmet sans lire, l'appareil abonné déchiffre « oui » et le créneau, rien d'autre", async () => {
  await avecPush(async () => {
    const r = reseau(ENV_N({ ORIGINES: LOCAL })); brancher(r);
    const app = WP.appareil(), key = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url"), nz = NID + "." + key;
    assert.equal((await appel(r.env, "POST", "/v1/notifs", { id: NID, abo: { endpoint: ENDPOINT_EX, keys: app.keys }, del: await empreinteDe(JETON_EX), expire: Date.now() + 864e5 }, LOCAL)).status, 201);
    const envoyer = PAGE.lire("sendNotif");
    assert.equal(await envoyer(nz, "o", 1), "ok");
    const corps = r.journal.at(-1).body;
    assert.ok(/^\{"c":"[\w-]+"\}$/.test(corps), "la requête ne contient que la réponse chiffrée");
    for(const clair of ['"r"', '"o"', "Alex", "Sam", key]) assert.ok(!corps.includes(clair), `en clair dans la requête : ${clair}`);
    const m = JSON.parse(WP.dechiffrer(app, envois[0].corps));
    // Ce que fait sw.js : AES-GCM avec la clé du lien, l'identifiant en données associées
    const blob = Buffer.from(m.c, "base64url"); assert.equal(blob[0], 1);
    const k = await crypto.subtle.importKey("raw", Buffer.from(key, "base64url"), "AES-GCM", false, ["decrypt"]);
    const rep = JSON.parse(Buffer.from(await crypto.subtle.decrypt({ name: "AES-GCM", iv: blob.subarray(1, 13), additionalData: Buffer.from(NID) }, k, blob.subarray(13))));
    assert.deepEqual(rep, { r: "o", s: 1 }, "seulement la réponse et le créneau");
    assert.equal(await envoyer(nz, "n", null), "deja", "second envoi : « déjà envoyée »");
    assert.equal(await envoyer("M".repeat(22) + "." + key, "o", null), "fini", "inconnu : plus possible");
    PAGE.ecrire("shortFetch", async () => { throw new TypeError("Failed to fetch"); });
    assert.equal(await envoyer(nz, "o", null), "reseau");
  });
});
await test("Fin de vie de l'abonnement : dernier créneau + 7 jours, un an au plus, jamais dans le passé", () => {
  const exp = PAGE.lire("notifExpire"), j = 864e5, iso = t => { const x = new Date(t); return [x.toISOString().slice(0, 10), "12:00"]; };
  const loin = Date.now() + 30 * j, plusLoin = Date.now() + 60 * j;
  const e = exp([iso(loin), iso(plusLoin)]);
  assert.ok(Math.abs(e - (new Date(iso(plusLoin)[0] + "T12:00").getTime() + 7 * j)) < 1000, "dernier créneau + 7 jours");
  assert.ok(exp([iso(Date.now() + 900 * j)]) <= Date.now() + 365 * j + 1000, "un an au plus");
  assert.ok(exp([["2020-01-01", "10:00"]]) > Date.now(), "jamais dans le passé");
});
await test("Création : case décochée par défaut, cochée si l'autorisation est déjà accordée ; messages clairs quand ce n'est pas possible", () => {
  const S = PAGE.lire("S"), html = PAGE.lire("notifHTML"), avant = PAGE.lire("notifSupport");
  const essai = (support, permission) => {
    globalThis.Notification = { permission }; PAGE.ecrire("notifSupport", () => support);
    Object.assign(S, { notif: undefined, to: "Sam", link: "" });
    return html();
  };
  try{
    let h = essai("ok", "default");
    assert.ok(h.includes("🔔 Me prévenir dès que Sam répond") && !/id="notifMe" checked/.test(h), "décochée par défaut");
    assert.ok(h.includes("Ton navigateur te demandera l'autorisation."));
    h = essai("ok", "granted");
    assert.ok(/id="notifMe" checked/.test(h), "déjà autorisé : cochée");
    h = essai("ios", "default");
    assert.ok(/id="notifMe"\s+disabled/.test(h) && h.includes("Sur iPhone, ajoute d'abord Ose Demander à ton écran d'accueil"));
    h = essai("refuse", "denied");
    assert.ok(h.includes("disabled") && h.includes("Les notifications sont bloquées pour ce site."));
    h = essai("non", "default");
    assert.ok(h.includes("disabled") && h.includes("Ce navigateur ne permet pas les notifications"));
    assert.deepEqual(principales(h), [], "aucune action principale de plus");
  } finally { delete globalThis.Notification; PAGE.ecrire("notifSupport", avant); Object.assign(S, { notif: undefined, to: "" }); }
  // Sans navigateur compatible (banc) : « non » ; iPhone hors de l'appli installée : « ios »
  assert.equal(PAGE.lire("notifSupport")(), "non");
  assert.equal(chargerPage({ ios: true }).lire("notifSupport")(), "ios");
  const make = PAGE.lire("bindCreator").toString();
  const avantAttente = make.slice(make.indexOf('$("#make")?.addEventListener'), make.indexOf("await perm"));
  assert.ok(avantAttente.includes("Notification.requestPermission()") && !avantAttente.includes("await "), "autorisation demandée pendant le toucher, avant toute attente (Safari)");
  assert.ok(make.includes("S.notif && notifSupport()===\"ok\""), "seulement si la case est cochée");
  assert.ok(make.includes("buildLink(notif?.nz)"));
});
await test("Personne invitée : « Prévenir … de ma réponse » en bouton secondaire, après le Oui et après un vrai refus ; états clairs", () => {
  const D0 = PAGE.lire("D"), html = PAGE.lire("notifBtnHTML");
  try{
    PAGE.ecrire("D", INV({ nz: NZ_EX })); PAGE.ecrire("notifSent", "");
    let h = html("o");
    assert.ok(h.includes('class="btn" id="notifR"') && h.includes("🔔 Prévenir Alex de ma réponse"), "bouton secondaire");
    assert.ok(h.includes("Seulement ta réponse et le créneau choisi, rien d'autre."));
    assert.ok(html("n").includes("Seulement ta réponse, sans ton message."), "refus : sans le texte écrit");
    assert.deepEqual(principales(h), []);
    PAGE.ecrire("notifSent", "ok"); assert.ok(html("o").includes("Notification envoyée à Alex.") && html("o").includes('role="status"'));
    PAGE.ecrire("notifSent", "deja"); assert.ok(html("o").includes("Ta réponse a déjà été envoyée en notification."));
    PAGE.ecrire("notifSent", "fini"); assert.ok(html("o").includes("Plus possible de prévenir Alex par notification : envoie ta réponse par message."));
    PAGE.ecrire("notifSent", "reseau"); assert.ok(html("o").includes("La notification n'est pas partie. Réessaie dans un instant.") && html("o").includes('id="notifR"'));
    PAGE.ecrire("D", INV()); PAGE.ecrire("notifSent", ""); assert.equal(html("o"), "", "sans notification demandée : rien");
  } finally { PAGE.ecrire("D", D0); PAGE.ecrire("notifSent", ""); }
  assert.ok(PAGE.lire("sendHTML").toString().includes('afterMode==="yes" ? `<div class="notif-box" id="notifBox">${notifBtnHTML("o")}</div>`'), "après le Oui (jamais depuis le rappel)");
  assert.ok(PAGE.lire("openRefuse").toString().includes('notifBtnHTML("n")'), "après un vrai refus");
  assert.ok(PAGE.lire("notifyReply").toString().includes('toast("Choisis d\'abord ton créneau")'), "créneau choisi d'abord");
});
await test("Mes invitations : statut « Répondu : Oui / Non » gardé sur l'appareil, validé strictement, exporté", async () => {
  const lien = LOCAL + "/#i=" + await L.encodeData(INV({ nz: NZ_EX, sl: [["2027-03-12", "20:00"], ["2027-03-13", "19:30"]], d: undefined, h: undefined }));
  const d = await L.decodeData(lien.split("#i=")[1]);
  const e = PAGE.lire("entryFrom")(d, lien, undefined, undefined, { njeton: JETON_EX });
  assert.equal(e.nid, NZ_EX.slice(0, 22), "identifiant tiré du lien");
  const ok = PAGE.lire("validEntry");
  assert.ok(ok(e));
  const recu = { ...e, rep: "o", repAt: "2027-03-01T10:00:00.000Z", repSlot: 1 };
  assert.ok(ok(recu));
  for(const faux of [{ rep: "peut-être" }, { repSlot: 2 }, { repAt: "hier" }, { nid: "court" }, { njeton: "x" }, { rep: undefined }])
    assert.ok(!ok({ ...recu, ...faux }), `refusé : ${JSON.stringify(faux)}`);
  assert.ok(!ok({ ...e, nid: undefined, njeton: JETON_EX }), "pas de jeton sans identifiant");
  const aff = PAGE.lire("histReply");
  assert.ok(aff(recu).includes("Répondu : Oui 🎉, samedi 13 mars à 19 h 30"), aff(recu));
  assert.ok(aff({ ...recu, rep: "n", repSlot: undefined }).includes("Répondu : Non"));
  assert.ok(aff(e).includes("🔔 Notification activée sur cet appareil"));
  assert.equal(aff({ ...e, nid: undefined, njeton: undefined }), "");
  assert.ok(PAGE.lire("HIST_FIELDS").includes("rep"), "le statut part avec l'export");
});
await test("sw.js : notification toujours affichée, réponse déchiffrée sur l'appareil, aucun envoi ailleurs", () => {
  const sw = readFileSync(RACINE + "sw.js", "utf8"), push = sw.slice(sw.indexOf("Notifications de réponse"));
  assert.ok(push.includes('self.addEventListener("push"') && push.includes('self.addEventListener("notificationclick"'));
  assert.ok(push.includes("await self.registration.showNotification(title"), "toujours une notification (exigé par les navigateurs)");
  assert.ok(!/\bfetch\(/.test(push), "aucune requête réseau à la réception");
  assert.ok(push.includes("additionalData: new TextEncoder().encode(nid)"), "réponse liée à son identifiant");
  assert.ok(push.includes('a répondu oui 🎉') && push.includes('a répondu non') && push.includes("Merci d'avoir osé demander 💛"));
  assert.ok(push.includes('"./#mes-invitations"'), "le toucher ouvre « Mes invitations »");
  const idx = readFileSync(RACINE + "index.html", "utf8");
  assert.ok(idx.includes('const NOTIF_DB = "ose-notifs";') && sw.includes('const NOTIF_DB = "ose-notifs";'), "même base des deux côtés");
});
await test("Notifications : clé publique VAPID identique dans index.html et wrangler.toml", () => {
  const toml = readFileSync(RACINE + "worker/wrangler.toml", "utf8");
  assert.equal(PAGE.lire("PUSH_PUB"), /^VAPID_PUBLIQUE = "([\w-]{87})"$/m.exec(toml)[1]);
  assert.equal(Buffer.from(PAGE.lire("PUSH_PUB"), "base64url")[0], 4, "point P-256 non compressé");
});

await test("Mentions légales : notifications facultatives, ce qui est gardé, combien de temps, chiffrement de bout en bout, appli Android", () => {
  const ml = readFileSync(RACINE + "mentions-legales.html", "utf8").replace(/\s+/g, " ");
  for(const t of ['<h3 id="notifications">Notifications de réponse</h3>', "facultative et décochée par défaut", "Seuls sa réponse (oui ou non) et le créneau choisi",
    "Le message écrit pour un refus n'est jamais transmis", "elle n'est déchiffrée que sur votre appareil", "l'abonnement est effacé dès que la notification est partie",
    "sept jours après le dernier créneau proposé, et au plus tard un an", "Ouvrir une invitation n'envoie rien à ce service", "jamais dans le code publié",
    "Elle ne demande qu'une autorisation, celle d'afficher des notifications", "Notifications de réponse, seulement si vous les demandez.",
    "une question est posée : « Pour qui est cette image ? »", "Avec « Pour une story ou un groupe », choisi par défaut", "n'envoyez cette image qu'à la personne invitée"])
    assert.ok(ml.includes(t), `« ${t} » absent des mentions légales`);
  const rd = readFileSync(RACINE + "android/README.md", "utf8");
  assert.ok(rd.includes("Identifiants de l'appareil ou autres") && rd.includes("POST_NOTIFICATIONS"), "README : formulaire « Sécurité des données »");
});

/* =========================================================
   36. Page « Supprimer mes données » (lien demandé par la Play Console)
   ========================================================= */
titre("36. Supprimer mes données");
await test("Page /supprimer-mes-donnees/ : nom de l'appli, suppression soi-même, demande par e-mail, durées, liens", () => {
  const h = FAB["supprimer-mes-donnees/index.html"];
  assert.ok(h, "page fabriquée par outils/pages.mjs");
  const txt = h.replace(/<style>[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");
  for(const t of ["l'appli « Ose Demander », sur Google Play", "« Supprimer le lien en ligne »", "effacé automatiquement dès que la notification est partie",
    "« Retirer de l'historique »", "Il reste uniquement sur ton appareil", "« Effacer les données »", "le lien de l'invitation concernée",
    "dans un délai d'un mois au plus, comme le prévoit le RGPD", "un an au plus après la création du lien", "7 jours après le dernier créneau proposé",
    "Journaux : aucun.", "jamais conservée"])
    assert.ok(txt.includes(t), `« ${t} » absent`);
  assert.ok(h.includes('href="mailto:contact' + '@osedemander.fr?subject=Suppression%20de%20mes%20donn%C3%A9es"'), "lien e-mail avec objet");
  assert.ok(h.includes('href="/mentions-legales.html#confidentialite"'), "lien vers la confidentialité");
  assert.ok(h.includes('<a class="btn primary" href="/#mes-invitations">Ouvrir « Mes invitations »</a>'), "une action principale : Mes invitations");
  assert.equal((h.match(/class="btn primary"/g) || []).length, 1);
  assert.equal((h.match(/<h1[ >]/g) || []).length, 1);
  assert.ok(h.includes(`<link rel="canonical" href="${SITE_URL}supprimer-mes-donnees/">`));
  assert.ok(!/noindex/.test(h), "page indexable (la Play Console doit pouvoir l'ouvrir)");
  assert.ok(pagesDuPlan().includes(`${SITE_URL}supprimer-mes-donnees/`), "dans le plan du site");
  assert.ok(lireFichier("mentions-legales.html").includes('<a href="/supprimer-mes-donnees/">Supprimer mes données</a>'), "lien depuis les mentions légales");
  assert.ok(!/\b(prévenu|averti|informé)\b/.test(txt), "textes neutres");
});

/* =========================================================
   37. Notifications de révélation : le Worker (tâche planifiée à la minute, rien que l'identifiant, effacement, limites, temps de calcul)
   ========================================================= */
titre("37. Révélation : le Worker");
const RID = i => String(i).padStart(22, "R");
const minute = 60 * 1000;
const abonnerRappels = async (env, app, envois, extra = {}) => appel(env, "POST", "/v1/rappels", { abo: { endpoint: ENDPOINT_EX, keys: app.keys }, envois, del: await empreinteDe(JETON_EX), ...extra });
const passage = (env, quand = Date.now()) => WORKER.default.scheduled({ scheduledTime: quand }, env);
// Une ligne arrivée à échéance (heure dans le passé) : on recule l'heure prévue dans la base
const echeance = (env, id, avant = 0) => env.DB.db.prepare("UPDATE rappels SET heure = ?, prochain = ? WHERE id = ?").run(Date.now() - avant, Date.now() - avant, id);

await essaiWorker("S'abonner : une ligne par heure, abonnement chiffré, ni lien ni contenu ; rien n'est envoyé avant l'heure", async () => {
  await avecPush(async () => {
    const env = ENV_N(), app = WP.appareil();
    const r = await abonnerRappels(env, app, [{ id: RID(1), heure: Date.now() + 30 * minute }, { id: RID(2), heure: Date.now() + 90 * minute }]);
    assert.equal(r.status, 201); assert.deepEqual(await r.json(), { n: 2 });
    const lignes = env.DB.db.prepare("SELECT * FROM rappels ORDER BY id").all();
    assert.equal(lignes.length, 2);
    for(const l of lignes){
      assert.deepEqual(Object.keys(l).sort(), ["abo", "del", "etat", "heure", "id", "prochain"], "aucune colonne pour le lien, la clé ou la surprise");
      for(const clair of ["fcm.googleapis.com", app.keys.auth]) assert.ok(!l.abo.includes(clair), "abonnement chiffré");
    }
    await passage(env);
    assert.equal(envois.length, 0, "rien avant l'heure prévue");
  });
});
await essaiWorker("À l'heure : la notification part chiffrée et signée, avec seulement l'identifiant ; l'abonnement est effacé, jamais renvoyé", async () => {
  await avecPush(async () => {
    const env = ENV_N(), app = WP.appareil();
    await abonnerRappels(env, app, [{ id: RID(1), heure: Date.now() + 30 * minute }, { id: RID(2), heure: Date.now() + 90 * minute }]);
    echeance(env, RID(1));
    await passage(env);
    assert.equal(envois.length, 1, "seulement celle arrivée à échéance");
    WP.verifierVapid(envois[0].headers.Authorization, ENDPOINT_EX, VAPID_TEST.pub);
    assert.equal(envois[0].headers.Urgency, "high");
    assert.deepEqual(JSON.parse(WP.dechiffrer(app, envois[0].corps)), { v: 1, k: "rv", i: RID(1) }, "rien d'autre que l'identifiant");
    assert.deepEqual({ ...env.DB.db.prepare("SELECT abo, etat FROM rappels WHERE id = ?").get(RID(1)) }, { abo: null, etat: "envoye" });
    await passage(env); await passage(env);
    assert.equal(envois.length, 1, "jamais renvoyée");
  });
});
await essaiWorker(`Par passage : ${WORKER.RAPPEL_LOT} envois au plus, le reste part au passage suivant`, async () => {
  await avecPush(async () => {
    const env = ENV_N(), app = WP.appareil(), n = WORKER.RAPPEL_LOT + 3;
    for(let k = 0; k < n; k += 6) await abonnerRappels(env, app, Array.from({ length: Math.min(6, n - k) }, (_, j) => ({ id: RID(100 + k + j), heure: Date.now() + 30 * minute })));
    env.DB.db.prepare("UPDATE rappels SET heure = ?, prochain = ?").run(Date.now() - 1000, Date.now() - 1000);
    await passage(env); assert.equal(envois.length, WORKER.RAPPEL_LOT);
    await passage(env); assert.equal(envois.length, n);
  });
});
await essaiWorker("Temps de calcul d'un passage complet (chiffrement et signature) : loin de la limite de 10 ms de l'offre gratuite", async () => {
  await avecPush(async () => {
    const env = ENV_N(), app = WP.appareil(), mesures = [];
    for(let essai = 0; essai < 7; essai++){
      env.DB.db.exec("DELETE FROM rappels");
      await abonnerRappels(env, app, Array.from({ length: WORKER.RAPPEL_LOT }, (_, j) => ({ id: RID(200 + essai * 10 + j), heure: Date.now() + 30 * minute })));
      env.DB.db.prepare("UPDATE rappels SET heure = ?, prochain = ?").run(Date.now() - 1000, Date.now() - 1000);
      // Temps écoulé (majore le temps de calcul : ici rien n'attend le réseau) ; le compteur de calcul de Windows est trop grossier
      const avant = envois.length, t0 = performance.now(); await passage(env); mesures.push(performance.now() - t0);
      assert.equal(envois.length - avant, WORKER.RAPPEL_LOT, "le passage a bien envoyé le lot");
    }
    mesures.sort((a, b) => a - b);
    // Ce que Cloudflare compte (la base D1 tourne ailleurs) : par envoi, ouvrir l'abonnement et chiffrer le message ;
    // la signature VAPID, une fois par passage. Meilleur temps sur 50 essais (le moins perturbé par la machine).
    const abo = env.DB.db.prepare("SELECT abo, id FROM rappels LIMIT 1").get();
    const scelle = await PUSH.scellerAbo({ endpoint: ENDPOINT_EX, keys: app.keys }, RID(999), env), msg = new TextEncoder().encode(JSON.stringify({ v: 1, k: "rv", i: RID(999) }));
    // Plusieurs séries de 50 essais : on garde le meilleur temps (une machine chargée ne doit pas faire échouer le banc)
    let parEnvoi = Infinity, signature = Infinity;
    for(let i = 0; i < 250 && !(i >= 50 && WORKER.RAPPEL_LOT * parEnvoi + signature <= 6); i++){
      let t = performance.now(); await PUSH.chiffrerPush(await PUSH.ouvrirAbo(scelle, RID(999), env), msg); parEnvoi = Math.min(parEnvoi, performance.now() - t);
      t = performance.now(); await PUSH.enteteVapid(ENDPOINT_EX, VAPID_TEST.pub, VAPID_TEST.d); signature = Math.min(signature, performance.now() - t);
    }
    const estime = WORKER.RAPPEL_LOT * parEnvoi + signature;
    console.log(`    (calcul d'un passage de ${WORKER.RAPPEL_LOT} envois : ${estime.toFixed(1)} ms ; ${parEnvoi.toFixed(2)} ms par envoi + ${signature.toFixed(2)} ms de signature ; passage complet avec la base simulée : ${mesures[3].toFixed(1)} ms)`);
    assert.ok(abo, "lot en base");
    // Machine de test chargée : simple avertissement au-delà de 6 ms ; échec seulement au-delà de 9 ms (la limite gratuite est de 10 ms)
    if(estime > 6) console.log(`    (attention : ${estime.toFixed(1)} ms, la machine de test semble chargée ; à revérifier au calme)`);
    assert.ok(estime <= 9, `${estime.toFixed(1)} ms de calcul : trop près de la limite de 10 ms, réduire RAPPEL_LOT`);
    assert.ok(WORKER.RAPPEL_LOT >= 3 && WORKER.RAPPEL_LOT <= 6, "6 envois par passage au plus (~0,9 ms chacun)");
  });
});
await essaiWorker("Erreur passagère : nouvel essai 15 minutes plus tard ; appareil désabonné : effacé ; 7 jours après l'heure : effacé sans envoi", async () => {
  await avecPush(async () => {
    const env = ENV_N(), app = WP.appareil();
    await abonnerRappels(env, app, [{ id: RID(1), heure: Date.now() + 30 * minute }, { id: RID(2), heure: Date.now() + 30 * minute }, { id: RID(3), heure: Date.now() + 30 * minute }]);
    echeance(env, RID(1)); codePush = 503;
    await passage(env);
    const l = env.DB.db.prepare("SELECT etat, prochain, abo FROM rappels WHERE id = ?").get(RID(1));
    assert.equal(l.etat, null); assert.ok(l.abo); assert.ok(l.prochain > Date.now() + 14 * minute, "nouvel essai dans 15 minutes");
    await passage(env); assert.equal(envois.length, 1, "pas de nouvel essai avant 15 minutes");
    echeance(env, RID(2)); codePush = 410;
    await passage(env);
    assert.deepEqual({ ...env.DB.db.prepare("SELECT abo, etat FROM rappels WHERE id = ?").get(RID(2)) }, { abo: null, etat: "expire" });
    echeance(env, RID(3), WORKER.RAPPEL_GARDE + minute); const avant = envois.length;
    await passage(env);
    assert.equal(envois.length, avant, "trop tard : rien n'est envoyé");
    assert.deepEqual({ ...env.DB.db.prepare("SELECT abo, etat FROM rappels WHERE id = ?").get(RID(3)) }, { abo: null, etat: "expire" });
  });
});
await essaiWorker("Renoncer (case décochée) : jeton faux refusé, bon jeton accepté, rien n'est envoyé ensuite ; identifiants oubliés par le nettoyage quotidien", async () => {
  await avecPush(async () => {
    const env = ENV_N();
    await abonnerRappels(env, WP.appareil(), [{ id: RID(1), heure: Date.now() + 30 * minute }]);
    assert.equal((await appel(env, "POST", `/v1/rappels/${RID(1)}/supprimer`, { jeton: "C".repeat(43) })).status, 403);
    assert.equal((await appel(env, "POST", `/v1/rappels/${RID(1)}/supprimer`, { jeton: JETON_EX })).status, 200);
    assert.equal((await appel(env, "POST", `/v1/rappels/${RID(1)}/supprimer`, { jeton: JETON_EX })).status, 410);
    echeance(env, RID(1)); await passage(env);
    assert.equal(envois.length, 0);
    env.DB.db.prepare("UPDATE rappels SET heure = ?").run(Date.now() - WORKER.RAPPEL_GARDE - WORKER.NOTIF_GARDE - minute);
    await passage(env, Date.UTC(2026, 9, 21, 12, 0)); assert.equal(env.DB.db.prepare("SELECT COUNT(*) AS n FROM rappels").get().n, 1, "pas de nettoyage à midi");
    await passage(env, Date.UTC(2026, 9, 21, 3, 17)); assert.equal(env.DB.db.prepare("SELECT COUNT(*) AS n FROM rappels").get().n, 0, "nettoyage quotidien à 3 h 17 UTC");
  });
});
await essaiWorker("Validation stricte : 6 heures au plus, heure passée ou trop lointaine, doublons, champs en trop, service inconnu, taille ; aucune lecture", async () => {
  await avecPush(async () => {
    const app = WP.appareil(), h = Date.now() + 30 * minute, essai = (envois, extra) => abonnerRappels(ENV_N(), app, envois, extra);
    assert.equal((await essai(Array.from({ length: 7 }, (_, j) => ({ id: RID(j), heure: h })))).status, 400, "7 heures");
    assert.equal((await essai([])).status, 400);
    assert.equal((await essai([{ id: RID(1), heure: Date.now() - minute }])).status, 400, "heure passée");
    assert.equal((await essai([{ id: RID(1), heure: Date.now() + 10 * 1000 }])).status, 400, "moins d'une minute");
    assert.equal((await essai([{ id: RID(1), heure: Date.now() + 400 * 864e5 }])).status, 400, "plus d'un an");
    assert.equal((await essai([{ id: RID(1), heure: h }, { id: RID(1), heure: h + minute }])).status, 400, "identifiant en double");
    assert.equal((await essai([{ id: RID(1), heure: h, lien: "x" }])).status, 400, "champ en trop dans un envoi");
    assert.equal((await essai([{ id: RID(1), heure: h }], { lien: "https://osedemander.fr/#s=x" })).status, 400, "jamais de lien");
    assert.equal((await appel(ENV_N(), "POST", "/v1/rappels", { abo: { endpoint: "https://exemple.com/x", keys: app.keys }, envois: [{ id: RID(1), heure: h }], del: await empreinteDe(JETON_EX) })).status, 400);
    assert.equal((await appel(ENV_N(), "POST", "/v1/rappels", "x".repeat(WORKER.NOTIF_CORPS_MAX + 1))).status, 413);
    const env = ENV_N(); await abonnerRappels(env, app, [{ id: RID(1), heure: h }]);
    assert.equal((await abonnerRappels(env, app, [{ id: RID(1), heure: h }])).status, 409);
    assert.equal((await appel(env, "GET", "/v1/rappels")).status, 405, "aucune lecture");
    assert.equal((await appel(env, "GET", `/v1/rappels/${RID(1)}`)).status, 404);
    assert.equal(envois.length, 0);
  });
});
await essaiWorker("Limite par adresse IP (429), CORS limité et no-store, clés absentes (503)", async () => {
  const comptes = new Map(), limiteur = { limit: async ({ key }) => { const n = (comptes.get(key) || 0) + 1; comptes.set(key, n); return { success: n <= 2 }; } };
  const env = ENV_N({ LIMITE_ABO: limiteur }), app = WP.appareil(), h = Date.now() + 30 * minute;
  const st = [];
  for(let i = 0; i < 3; i++) st.push((await abonnerRappels(env, app, [{ id: RID(i), heure: h }])).status);
  assert.deepEqual(st, [201, 201, 429]);
  const autre = await appel(ENV_N(), "POST", "/v1/rappels", {}, "https://pirate.example"); assert.equal(autre.status, 403);
  const r = await abonnerRappels(ENV_N(), app, [{ id: RID(9), heure: h }]); assert.equal(r.headers.get("Cache-Control"), "no-store");
  assert.equal((await abonnerRappels(ENV_N({ VAPID_PRIVEE: undefined }), app, [{ id: RID(9), heure: h }])).status, 503);
});
await test("Tâche planifiée : une seule, chaque minute (offre gratuite) ; signature VAPID gardée en mémoire", () => {
  const toml = readFileSync(RACINE + "worker/wrangler.toml", "utf8");
  assert.ok(/^crons = \["\* \* \* \* \*"\]/m.test(toml), "chaque minute");
  assert.equal((toml.match(/^crons = /gm) || []).length, 1);
  const push = readFileSync(RACINE + "worker/src/push.js", "utf8");
  assert.ok(push.includes("Authorization: await vapid(abo.endpoint, env)") && push.includes("const vapidMemo = new Map();"));
});

/* =========================================================
   38. Notifications de révélation : le site (heures, corps envoyé, case, iPhone et navigateurs intégrés, sw.js)
   ========================================================= */
titre("38. Révélation : le site");
const atLocal = ms => { const x = new Date(ms), p = n => String(n).padStart(2, "0"); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`; };
const INV_REV = (decalages = [3 * 3600e3]) => {
  const sc = PAGE.lire("scramble");
  if(decalages.length === 1) return INV({ a: { v: "r", h: "Indice de l'Exemple", at: atLocal(Date.now() + decalages[0]), e: sc("Dîner au Café de l'Exemple") } });
  return INV({ p: decalages.map((d, i) => ({ h: `${10 + i}:00`, v: "r", i: "", at: atLocal(Date.now() + d), e: sc(JSON.stringify({ a: "Étape de l'Exemple", l: "Salle de l'Exemple" })) })), a: undefined });
};
await test("Heures envoyées : seulement les révélations à venir (70 s au moins), sans doublon, 6 au plus, dans l'ordre", () => {
  const T = PAGE.lire("revealTimes"), h = 3600e3;
  assert.equal(T(INV_REV([3 * h])).length, 1);
  assert.deepEqual(T(INV_REV([-h, 2 * h])).length, 1, "révélation passée : ignorée");
  assert.equal(T(INV_REV([30 * 1000])).length, 0, "moins de 70 s : ignorée");
  assert.equal(T(INV_REV([2 * h, 2 * h, 5 * h])).length, 2, "même minute : une seule notification");
  const six = T(INV_REV([1, 2, 3, 4, 5, 6].map(k => k * h)));
  assert.equal(six.length, 6); assert.deepEqual([...six].sort((a, b) => a - b), six);
  assert.equal(T(INV()).length, 0, "sans « Révélé plus tard » : rien");
});
await essaiWorker("Ce qui part au serveur : l'abonnement, un identifiant aléatoire par heure, l'empreinte du jeton ; jamais le lien, les prénoms ni la surprise", async () => {
  await avecPush(async () => {
    const r = reseau(ENV_N({ ORIGINES: LOCAL })); brancher(r);
    const app = WP.appareil(), abo = { endpoint: ENDPOINT_EX, keys: app.keys }, d = INV_REV([2 * 3600e3, 4 * 3600e3]);
    const lien = LOCAL + "/#s=" + "L".repeat(22) + "." + "K".repeat(22), local = new Map(), avant = PAGE.lire("notifStore");
    // IndexedDB simulé : ce qui reste sur l'appareil
    PAGE.ecrire("notifStore", async (store, mode, fn) => { const st = { put: x => local.set(x.id, x), getAll: () => ({ result: [...local.values()] }), delete: id => local.delete(id) }; const q = fn(st); return q && q.result; });
    try{
      const etat = await PAGE.lire("scheduleReveal")(abo, PAGE.lire("revealTimes")(d), lien, "INV");
      assert.equal(etat, "ok");
      const q = r.journal.find(x => x.url.endsWith("/v1/rappels"));
      assert.ok(q, "une seule demande, vers /v1/rappels");
      const corps = JSON.parse(q.body);
      assert.deepEqual(Object.keys(corps).sort(), ["abo", "del", "envois"]);
      for(const e of corps.envois) assert.deepEqual(Object.keys(e).sort(), ["heure", "id"]);
      for(const secret of ["#s=", "L".repeat(22), "K".repeat(22), "Alex", "Sam", "Exemple", "Indice", lien]) assert.ok(!q.body.includes(secret), `envoyé au serveur : ${secret}`);
      assert.equal(local.size, 2, "le lien reste sur l'appareil, une entrée par heure");
      for(const x of local.values()){ assert.equal(x.lien, lien); assert.ok(corps.envois.some(e => e.id === x.id && e.heure === x.heure)); }
      // À l'heure, le message ne contient que l'identifiant rangé sur l'appareil
      r.env.DB.db.prepare("UPDATE rappels SET heure = ?, prochain = ?").run(Date.now() - 1000, Date.now() - 1000);
      await WORKER.default.scheduled({ scheduledTime: Date.now() }, r.env);
      assert.equal(envois.length, 2);
      for(const e of envois){ const m = JSON.parse(WP.dechiffrer(app, e.corps)); assert.equal(m.k, "rv"); assert.ok(local.has(m.i)); assert.deepEqual(Object.keys(m).sort(), ["i", "k", "v"]); }
      // Décocher : chaque abonnement est annulé avec le jeton, et oublié sur l'appareil
      const env2 = ENV_N({ ORIGINES: LOCAL }), r2 = reseau(env2); brancher(r2); local.clear();
      await PAGE.lire("scheduleReveal")(abo, PAGE.lire("revealTimes")(d), lien, "INV2");
      await PAGE.lire("cancelReveal")("INV2");
      assert.equal(local.size, 0);
      assert.equal(env2.DB.db.prepare("SELECT COUNT(*) AS n FROM rappels WHERE etat = 'supprime'").get().n, 2);
    } finally { PAGE.ecrire("notifStore", avant); }
  });
});
await essaiWorker("Ouvrir une invitation avec des révélations n'appelle jamais le service des notifications", async () => {
  const r = reseau(); brancher(r);
  await ouvrirLien(LOCAL + "/#i=" + await L.encodeData(INV_REV()));
  assert.ok(!r.journal.some(q => q.url.includes("/v1/rappels")), "aucune demande à l'ouverture");
});
await test("Carte après le Oui : la case (décochée, cochée, bloquée), jamais dans le rappel, la version partagée ni sans révélation à venir ; une seule action principale", () => {
  const ch = ["D", "afterMode", "remLink", "revNotif", "notifSupport", "chosenSlot"], avant = Object.fromEntries(ch.map(k => [k, PAGE.lire(k)]));
  const html = PAGE.lire("revealNotifHTML"), actions = PAGE.lire("actionsHTML");
  const regle = (d, mode, support, etat, permission = "default") => {
    globalThis.Notification = { permission };
    PAGE.ecrire("D", d); PAGE.ecrire("afterMode", mode); PAGE.ecrire("remLink", LOCAL + "/#s=" + "A".repeat(22) + "." + "B".repeat(22));
    PAGE.ecrire("revNotif", { etat, inv: "X" }); PAGE.ecrire("notifSupport", () => support); PAGE.ecrire("chosenSlot", null);
  };
  try{
    regle(INV_REV(), "yes", "ok", "off");
    let h = html();
    assert.ok(h.includes("🔔 Me prévenir quand la surprise se révèle") && !/id="revNotif" checked/.test(h), "décochée par défaut");
    assert.ok(h.includes("Une notification à l'heure de la révélation, sans rien dévoiler."));
    assert.deepEqual(principales(h), []);
    regle(INV_REV([2 * 3600e3, 5 * 3600e3]), "yes", "ok", "actif", "granted");
    h = html(); assert.ok(/id="revNotif" checked/.test(h) && h.includes("quand les surprises se révèlent") && h.includes("🔔 C'est noté : une notification à l'heure de chaque révélation, sans rien dévoiler."));
    regle(INV_REV(), "yes", "refuse", "off", "denied");
    h = html(); assert.ok(/disabled/.test(h) && h.includes("Les notifications sont bloquées pour ce site."));
    regle(INV_REV(), "yes", "ok", "reseau"); assert.ok(html().includes("La notification n'a pas pu être programmée.") && html().includes('role="alert"'));
    regle(INV_REV(), "reminder", "ok", "off"); assert.equal(html(), "", "rappel d'agenda : il a déjà ses alertes");
    regle({ ...INV_REV(), vu: 1 }, "yes", "ok", "off"); assert.equal(html(), "", "version partagée");
    regle(INV_REV([-3600e3]), "yes", "ok", "off"); assert.equal(html(), "", "heure passée : pas de case");
    regle(INV(), "yes", "ok", "off"); assert.equal(html(), "", "sans révélation");
    regle(INV_REV(), "yes", "ok", "off"); assert.equal(principales(actions()).length, 0, "aucune action principale ajoutée sous les détails");
  } finally { delete globalThis.Notification; for(const k of ch) PAGE.ecrire(k, avant[k]); }
});
await test("iPhone hors de l'appli, navigateurs intégrés : pas de case désactivée, mais le rappel d'agenda bien visible, avec une phrase", () => {
  const ch = ["D", "afterMode", "remLink", "revNotif", "notifSupport"], avant = Object.fromEntries(ch.map(k => [k, PAGE.lire(k)]));
  try{
    for(const support of ["ios", "integre", "non"]){
      PAGE.ecrire("D", INV_REV()); PAGE.ecrire("afterMode", "yes"); PAGE.ecrire("remLink", LOCAL + "/#s=" + "A".repeat(22) + "." + "B".repeat(22));
      PAGE.ecrire("revNotif", { etat: "off", inv: "X" }); PAGE.ecrire("notifSupport", () => support);
      assert.equal(PAGE.lire("revealNotifHTML")(), "", `${support} : pas de case`);
      const b = PAGE.lire("revealButtonsHTML")();
      assert.ok(b.startsWith('<p class="rev-agenda">Ajoute un rappel à ton agenda pour ne pas manquer la surprise.</p>'), `${support} : la phrase`);
      assert.ok(/class="btn"[^>]*>Me rappeler la révélation/.test(b) || b.includes('class="btn" id="calRev">Me rappeler la révélation'), `${support} : le bouton d'agenda, bien visible`);
    }
  } finally { for(const k of ch) PAGE.ecrire(k, avant[k]); }
  const P = chargerPage(), ua = ua => { P.navigator.userAgent = ua; return P.lire("isInAppBrowser")(); };
  for(const u of ["Mozilla/5.0 (iPhone) Instagram 300.0", "Mozilla/5.0 [FBAN/FBIOS;FBAV/400.0]", "Snapchat/12.0", "Mozilla/5.0 musical_ly_33.0 BytedanceWebview"]) assert.ok(ua(u), u);
  for(const u of ["Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36", "Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari/604.1"]) assert.ok(!ua(u), u);
  assert.equal((P.navigator.userAgent = "Instagram", P.lire("notifSupport")()), "integre");
});
await test("sw.js : « 🔓 Ta surprise est prête ! », rien de la surprise, aucune requête, le lien rangé sur l'appareil (même site) ; IndexedDB version 2 des deux côtés", () => {
  const sw = readFileSync(RACINE + "sw.js", "utf8"), rv = sw.slice(sw.indexOf("async function onReveal"), sw.indexOf("async function onPush"));
  assert.ok(rv.includes('showNotification("🔓 Ta surprise est prête !", { body: "Touche pour la découvrir."'));
  assert.ok(!/\bfetch\(/.test(rv), "aucune requête");
  assert.ok(rv.includes("new URL(x.lien).origin === self.location.origin"), "n'ouvre qu'une page du site");
  assert.ok(sw.includes('if (m && m.k === "rv") return onReveal(String(m.i || ""));'));
  const idx = readFileSync(RACINE + "index.html", "utf8");
  assert.ok(idx.includes("indexedDB.open(NOTIF_DB,2)") && sw.includes("indexedDB.open(NOTIF_DB, 2)"), "même version de la base");
  assert.ok(idx.includes('mk("revelations","id")') && sw.includes('mk("revelations", "id")'));
});

await test("Création : phrase d'honnêteté sous « Révélé plus tard » (activité, lieu et chaque étape d'un programme)", () => {
  const H = "Le contenu est dans le lien, caché pour qu'on ne le voie pas par accident. Pour un secret absolu, choisis « Surprise » : rien n'est alors dans le lien.";
  const idx = readFileSync(RACINE + "index.html", "utf8");
  assert.equal(idx.split(H).length - 1, 2, "élément simple et étape de programme");
  assert.ok(idx.includes('${it.v==="r" ? `<p class="vis-note">' + H), "seulement quand « Révélé plus tard » est choisi");
});

await test("Mentions légales et page de suppression : la notification de révélation (rien que l'abonnement, l'heure, un identifiant ; durées ; iPhone)", () => {
  const ml = readFileSync(RACINE + "mentions-legales.html", "utf8").replace(/\s+/g, " ");
  for(const t of ['<h3 id="revelation">Notification de révélation</h3>', "Il ne reçoit jamais le lien de l'invitation, sa clé, les prénoms, ni le contenu de la surprise",
    "Le lien qui rouvre l'invitation reste uniquement sur votre appareil", "« 🔓 Ta surprise est prête ! »", "au plus tard sept jours après l'heure prévue",
    "Décocher la case l'efface tout de suite", "Notification de révélation, seulement si vous la demandez.", "« Me prévenir quand la surprise se révèle »"])
    assert.ok(ml.includes(t), `« ${t} » absent des mentions légales`);
  const sup = FAB["supprimer-mes-donnees/index.html"].replace(/&nbsp;/g, " ").replace(/&#39;/g, "'");
  for(const t of ["<h3>Une notification de révélation</h3>", "rouvre l'invitation et décoche la case", "jamais le lien ni la surprise"]) assert.ok(sup.includes(t), `« ${t} » absent de la page de suppression`);
});

/* =========================================================
   39. Pied de page (accueil, pages d'occasion, mentions légales, suppression des données, 404)
   ========================================================= */
titre("39. Pied de page");
const PIED = await import(new URL("../outils/pages.mjs", import.meta.url).href);
await test("Structure : footer, trois navigations nommées, liens attendus, phrase du bas, logo", () => {
  const f = PAGE.lire("footerHTML")({ logo: '<a class="logo" href="/">Ose Demander</a>' });
  assert.ok(f.startsWith('<footer class="site-foot"'));
  for(const [id, titre] of [["sfSite", "Ose Demander"], ["sfIdees", "Idées"], ["sfInfos", "Informations"]])
    assert.ok(f.includes(`<nav class="sf-col" aria-labelledby="${id}"><h2 id="${id}">${titre}</h2>`), titre);
  for(const [href, txt] of [["/#choisir", "Créer une invitation"], ["/#exemple", "Voir un exemple"], ["/#mes-invitations", "Mes invitations"], ["/#installer", "Installer l'appli"],
    ["/mentions-legales.html", "Mentions légales"], ["/mentions-legales.html#confidentialite", "Confidentialité"], ["/supprimer-mes-donnees/", "Supprimer mes données"]])
    assert.ok(f.includes(`<a href="${href}">${txt}</a>`), txt);
  for(const p of PAGE.lire("OCC_PAGES")) assert.ok(f.includes(`<a href="/${p.path}/">`), p.path);
  assert.ok(f.includes('<a href="mailto:contact' + '@osedemander.fr">Contact<span class="sf-mail">contact' + '@osedemander.fr</span></a>'));
  assert.ok(f.includes("Des invitations animées à envoyer par message. Gratuit, sans compte, sans pub."));
  assert.ok(f.includes('<p class="sf-bas">© 2026 Ose Demander — Rien n\'est stocké en clair en ligne.</p>'));
  assert.ok(!PAGE.lire("footerHTML")({ logo: "", installer: false }).includes("Installer l'appli"), "masqué dans l'appli installée");
  assert.deepEqual(principales(f), [], "aucune action principale dans le pied de page");
  assert.ok(!/[←→]| · /.test(f.replace(/<[^>]+>/g, "")), "ni flèche ni « · »");
});
await test("Contrastes (WCAG AA) : texte, texte atténué et titres sur le fond sombre, pour l'accent de chaque thème", () => {
  const c = PAGE.lire("contrast"), r = regleCSS(".site-foot"), v = n => (r.match(new RegExp(`--f-${n}:(#[0-9A-Fa-f]{6})`)) || [])[1];
  const bg = v("bg"); assert.equal(bg, PAGE.lire("FOOT_BG"));
  for(const n of ["ink", "mut", "acc"]) assert.ok(c(v(n), bg) >= 4.5, `--f-${n} : ${c(v(n), bg).toFixed(2)}:1`);
  const readable = PAGE.lire("readable");
  for(const t of PAGE.lire("THEMES")){ const a = readable(t.a, [bg], 4.5); assert.ok(c(a, bg) >= 4.5, `${t.id} : ${a}`); }
  for(const [nom, h] of Object.entries(FAB)){
    if(!nom.endsWith(".html")) continue;
    const acc = (h.match(/<footer class="site-foot" style="--f-acc:(#[0-9A-F]{6})">/) || [])[1];
    assert.ok(acc && c(acc, bg) >= 4.5, `${nom} : accent du pied de page`);
  }
});
await test("Partout : accueil, pages d'occasion, suppression des données, 404, mentions légales (à jour) ; plus de doublon « Idées d'invitations »", () => {
  const S = PAGE.lire("S"); Object.assign(S, { step: "home" }); PAGE.lire("renderCreator")();
  const accueil = PAGE.zones["#app"].innerHTML;
  assert.equal((accueil.match(/<footer class="site-foot"/g) || []).length, 1);
  assert.ok(!accueil.includes("Idées d'invitations"), "la rubrique de l'accueil est remplacée par la colonne « Idées »");
  assert.ok(accueil.includes('<div class="home-cards" id="choisir">'), "cible de « Créer une invitation »");
  for(const [nom, h] of Object.entries(FAB)){
    if(!nom.endsWith(".html")) continue;
    assert.equal((h.match(/<footer class="site-foot"/g) || []).length, 1, nom);
    assert.ok(!h.includes("Autres idées d'invitations") && !h.includes('class="ideas"'), `${nom} : pas de doublon`);
    assert.ok(h.includes(".site-foot{") && h.includes("@media (max-width:520px){.sf-in{grid-template-columns:1fr}}"), `${nom} : styles du pied de page`);
  }
  const ml = lireFichier("mentions-legales.html").replace(/\r\n/g, "\n");
  assert.equal(ml, PIED.piedMentions(ml), "mentions légales : pied de page à jour (relancer « node outils/pages.mjs »)");
  assert.equal((ml.match(/<footer class="site-foot"/g) || []).length, 1);
});
await test("Téléphone et clavier : colonnes les unes sous les autres, cibles de 44 px, focus visible ; routes #choisir et #installer", () => {
  assert.ok(+(regleCSS(".site-foot li a").match(/min-height:(\d+)px/) || [])[1] >= 44);
  assert.ok(regleCSS(".site-foot a:focus-visible").includes("outline:3px solid var(--f-acc)"));
  const idx = lireFichier("index.html");
  assert.ok(idx.includes("@media (max-width:520px){.sf-in{grid-template-columns:1fr}}"));
  const route = PAGE.lire("route").toString();
  assert.ok(route.includes('location.hash==="#choisir" || location.hash==="#installer"') && route.includes("installHelp()"));
  assert.ok(PAGE.lire("installHelp").toString().includes("showIOSHelp(!isIOS())"), "aide à l'installation sur iPhone comme ailleurs");
});

await essaiWorker("L'image porte toujours un lien court : service muet, pas d'image (« Réessaie ») ; lien complet de l'invitation, un lien court est créé pour l'image", async () => {
  const S = PAGE.lire("S"), image = PAGE.lire("imageLink"), avant = PAGE.lire("shortFetch");
  try{
    const d = INV({ c: "any" }), long = LOCAL + "/#i=" + await L.encodeData(d);
    // Le lien de l'invitation est complet (service muet à la création), et le service ne répond toujours pas
    PAGE.ecrire("shortFetch", async () => { throw new TypeError("Failed to fetch"); });
    Object.assign(S, { link: long, longLink: long, imgLinks: {}, chId: "", nz: "", to: "Sam" });
    assert.equal(await image(false), null, "pas d'image au lien complet"); assert.equal(await image(true), null);
    assert.deepEqual(S.imgLinks, {}, "rien n'est gardé : un nouvel essai refait la demande");
    // Le service répond de nouveau : un lien court est créé pour l'image, puis réutilisé
    const r = reseau(); brancher(r);
    const l = await image(false);
    assert.ok(/#s=/.test(l), "lien court"); assert.equal((await relire(l)).f, "Alex", "la même invitation");
    assert.equal(await image(false), l, "préparé une seule fois");
  } finally { PAGE.ecrire("shortFetch", avant); Object.assign(S, { link: "", longLink: undefined, imgLinks: {}, chId: "", nz: "", to: "" }); }
  assert.ok(!PAGE.lire("imageLink").toString().includes('"#i="+code'), "jamais de lien complet dans une image");
});

/* =========================================================
   40. Confiance : security.txt (RFC 9116), « Signaler une faille », politique de sécurité du contenu (CSP)
   ========================================================= */
titre("40. Confiance et sécurité");
const CSP = await import(new URL("../outils/csp.mjs", import.meta.url).href);
await test("security.txt : contact, expiration dans moins d'un an (et pas dans moins de 30 jours), langues, adresse canonique, politique", () => {
  const txt = lireFichier(".well-known/security.txt"), champs = {};
  for(const l of txt.trim().split("\n")){ const m = l.match(/^([A-Za-z-]+): (.+)$/); assert.ok(m, `ligne mal formée : ${l}`); (champs[m[1]] ||= []).push(m[2]); }
  assert.deepEqual(Object.keys(champs).sort(), ["Canonical", "Contact", "Expires", "Policy", "Preferred-Languages"]);
  assert.deepEqual(champs.Contact, ["mailto:contact" + "@osedemander.fr"]);
  assert.equal(champs.Expires.length, 1, "une seule date d'expiration (RFC 9116)");
  assert.match(champs.Expires[0], /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/);
  const jours = (Date.parse(champs.Expires[0]) - Date.now()) / 864e5;
  assert.ok(jours >= 30, `security.txt expire dans ${Math.floor(jours)} jours : repousser « Expires » (moins d'un an) et publier`);
  assert.ok(jours <= 366, "Expires : moins d'un an (RFC 9116)");
  assert.equal(champs["Preferred-Languages"][0].split(",")[0].trim(), "fr");
  assert.deepEqual(champs.Canonical, ["https://osedemander.fr/.well-known/security.txt"]);
  assert.deepEqual(champs.Policy, ["https://osedemander.fr/mentions-legales.html#faille"]);
  assert.ok(/include:\s*\n\s*- \.well-known/.test(lireFichier("_config.yml")), "_config.yml publie .well-known");
});
await test("Mentions légales : section « Signaler une faille de sécurité », adresse de contact et lien vers security.txt", () => {
  const ml = lireFichier("mentions-legales.html"), i = ml.indexOf('<h2 id="faille">'), sec = ml.slice(i, ml.indexOf("<h2", i + 1));
  assert.ok(i > 0);
  assert.ok(sec.includes('href="mailto:contact' + '@osedemander.fr?subject=') && sec.includes('href="/.well-known/security.txt"'));
  assert.ok(!/[←→]| · /.test(sec.replace(/<[^>]+>/g, "")), "ni flèche ni « · »");
});
await test("CSP de l'accueil : balise en tête, empreinte du script à jour (sinon : node outils/csp.mjs), ni 'unsafe-inline' ni 'unsafe-eval' pour les scripts", () => {
  const html = lireFichier("index.html"), csp = CSP.cspDe(html);
  assert.ok(csp, "balise CSP absente");
  assert.ok(html.indexOf("Content-Security-Policy") < html.search(/<script|<style|<link/), "avant tout script, style ou lien");
  assert.equal(csp, CSP.cspAccueil(CSP.empreinte(html)), "empreinte du script pas à jour : lancer « node outils/csp.mjs » (sinon le navigateur bloque tout le site)");
  const script = csp.split("; ").find(d => d.startsWith("script-src "));
  assert.ok(!/unsafe-inline|unsafe-eval|https?:|\*/.test(script), script);
  assert.ok(csp.startsWith("default-src 'none'"));
  for(const d of ["frame-ancestors", "report-uri", "sandbox"]) assert.ok(!csp.includes(d), `${d} est ignorée dans une balise meta`);
  const connect = csp.split("; ").find(d => d.startsWith("connect-src ")).split(" ");
  assert.ok(connect.includes("https://ose-liens.osedemander.workers.dev"), "le service des liens courts est autorisé");
  assert.ok(!/http:\/\//.test(csp), "aucune adresse en http:// (Observatory : csp-implemented-with-insecure-scheme)");
  assert.equal((html.match(/<script>/g) || []).length, 1, "un seul script exécuté (celui de l'empreinte)");
});
await test("Rien que la CSP bloquerait : ni gestionnaire on…= dans le HTML, ni javascript:, ni eval, ni appel à un autre domaine", () => {
  const html = lireFichier("index.html"), code = CSP.scriptPage(html);
  assert.ok(!/<[a-z][^>]*\son[a-z]+\s*=\s*["'{]/i.test(html), "attribut on…= (bloqué par la CSP) : utiliser addEventListener");
  assert.ok(!/javascript:/i.test(html));
  assert.ok(!/\beval\(|new Function\(|set(Timeout|Interval)\(\s*["'`]/.test(code));
  assert.ok(!/<script[^>]+src=|<iframe|<object|<embed/i.test(html));
  const appels = [...code.matchAll(/fetch\(\s*["'`](https?:\/\/[^/"'`]+)/g)].map(m => m[1]);
  for(const o of appels) assert.ok(CSP.CONNEXIONS.includes(o), `connexion à ${o} non autorisée par la CSP`);
});
await test("Pages statiques (occasions, 404, suppression, mentions légales) : CSP stricte, aucun script exécuté", () => {
  const pages = { ...Object.fromEntries(Object.entries(FAB).filter(([n]) => n.endsWith(".html"))), "mentions-legales.html": lireFichier("mentions-legales.html") };
  assert.ok(Object.keys(pages).length >= 9);
  for(const [nom, h] of Object.entries(pages)){
    assert.equal(CSP.cspDe(h), CSP.CSP_STATIQUE, nom);
    assert.ok(h.indexOf("Content-Security-Policy") < h.search(/<script|<style|<link/), `${nom} : balise en tête`);
    assert.ok(!/<script(?![^>]*type="application\/ld\+json")/.test(h), `${nom} : script exécuté`);
  }
});

/* =========================================================
   41. Motifs de l'enveloppe : selon le thème, rien dans le lien, hors du cachet, cachés aux lecteurs d'écran
   ========================================================= */
titre("41. Motifs de l'enveloppe");
const MOTIFS = PAGE.lire("ENVELOPE_MOTIFS"), motifHTML = PAGE.lire("envMotifHTML");
const PERMANENTS = ["base", "amour", "maman", "papa", "amis", "fete", "mystere"];
// Points d'ancrage d'un dessin (fins de segments, centres, coins), transformations des groupes comprises : de quoi vérifier les zones interdites
function pointsSVG(svg){
  const mul = (a, b) => [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
  const tf = s => { let m = [1,0,0,1,0,0];
    for(const [, f, a] of (s || "").matchAll(/(\w+)\(([^)]*)\)/g)){ const v = a.split(/[\s,]+/).filter(Boolean).map(Number);
      if(f === "translate") m = mul(m, [1,0,0,1,v[0],v[1]||0]);
      else if(f === "scale") m = mul(m, [v[0],0,0,v[1]??v[0],0,0]);
      else if(f === "rotate"){ const r = v[0]*Math.PI/180, c = Math.cos(r), s2 = Math.sin(r), [cx, cy] = [v[1]||0, v[2]||0];
        m = mul(mul(mul(m, [1,0,0,1,cx,cy]), [c,s2,-s2,c,0,0]), [1,0,0,1,-cx,-cy]); } }
    return m; };
  const pts = [], pile = [[1,0,0,1,0,0]], app = (m, x, y) => pts.push([m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]]);
  for(const [, fin, nom, attrs, auto] of svg.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)){
    if(fin){ pile.pop(); continue; }
    const at = n => (attrs.match(new RegExp(`\\s${n}="([^"]*)"`)) || [])[1], m = mul(pile.at(-1), tf(at("transform")));
    if(nom === "circle" || nom === "ellipse") app(m, +at("cx") || 0, +at("cy") || 0);
    if(nom === "rect"){ const x = +at("x"), y = +at("y"), w = +at("width"), h = +at("height"); for(const [a, b] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]) app(m, a, b); }
    if(nom === "path"){ let cx = 0, cy = 0, sx = 0, sy = 0;
      const tok = at("d").match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g); let cmd = "", i = 0; const n = () => +tok[i++];
      const NB = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7, z:0 };
      while(i < tok.length){ if(/[a-zA-Z]/.test(tok[i])) cmd = tok[i++]; const k = cmd.toLowerCase(), rel = cmd !== cmd.toUpperCase();
        if(k === "z"){ cx = sx; cy = sy; app(m, cx, cy); continue; }
        const v = Array.from({ length: NB[k] }, n), dx = rel ? cx : 0, dy = rel ? cy : 0;
        if(k === "h") cx = v[0] + dx; else if(k === "v") cy = v[0] + dy; else { cx = v.at(-2) + dx; cy = v.at(-1) + dy; }
        if(k === "m"){ sx = cx; sy = cy; cmd = rel ? "l" : "L"; }
        app(m, cx, cy); } }
    if(!auto && !["circle", "ellipse", "rect", "path"].includes(nom)) pile.push(m);
  }
  return pts;
}
await test("Les 7 thèmes permanents ont leur motif (style cadre ou trait, rabat et corps)", () => {
  for(const th of PERMANENTS){
    const m = MOTIFS[th]; assert.ok(m, th);
    assert.ok(["C", "T"].includes(m.style), `${th} : style`);
    assert.ok(m.flap && m.body, `${th} : rabat et corps`);
  }
  for(const th of Object.keys(MOTIFS)) assert.ok(PAGE.lire("THEMES").some(t => t.id === th), `${th} : thème connu`);
});
await test("SVG valide : balises équilibrées, attributs bien formés, aucun identifiant", () => {
  for(const [th, m] of Object.entries(MOTIFS)) for(const part of ["flap", "body"]){
    const s = motifHTML(part, th, "juste", "n"), pile = [];
    for(const [, fin, nom, , auto] of s.matchAll(/<(\/?)(\w+)((?:\s+[\w:-]+="[^"<>]*")*)\s*(\/?)>/g)){
      if(fin) assert.equal(pile.pop(), nom, `${th}.${part} : </${nom}>`); else if(!auto) pile.push(nom); }
    assert.equal(pile.length, 0, `${th}.${part} : balise non fermée`);
    assert.equal(s.replace(/<\/?\w+((?:\s+[\w:-]+="[^"<>]*")*)\s*\/?>/g, "").trim(), "", `${th}.${part} : texte ou balise mal formée`);
    assert.ok(!/\sid="|NaN|undefined/.test(s), `${th}.${part}`);
  }
});
await test("Chaque classe de motif a sa règle CSS (sinon la forme serait noire)", () => {
  const classes = new Set(Object.values(MOTIFS).flatMap(m => [m.flap, m.body]).join(" ").match(/em-[a-z0-9]+/g));
  assert.ok(classes.size > 8);
  for(const c of classes) assert.ok(new RegExp("[.]" + c + "(?![a-z0-9-])").test(CSS), `.${c} sans règle CSS`);
});
await test("Aucune couleur écrite en dur : classes du thème seulement", () => {
  for(const [th, m] of Object.entries(MOTIFS)) for(const part of ["flap", "body"])
    assert.ok(!/#[0-9a-f]{3,6}\b|rgba?\(|\s(fill|stroke)="(?!none")|(fill|stroke|color):/i.test(m[part]), `${th}.${part}`);
});
await test("Cachés aux lecteurs d'écran : aria-hidden, aucun texte lisible", () => {
  for(const th of Object.keys(MOTIFS)) for(const part of ["flap", "body"]){
    const s = motifHTML(part, th, "juste", "n");
    assert.ok(s.startsWith(`<g class="em em-${part} em-n" aria-hidden="true">`), `${th}.${part}`);
    assert.ok(!/<(text|title|desc|foreignObject|a)\b|aria-label|role=|tabindex/.test(s), `${th}.${part} : rien à lire`);
  }
  const h = enveloppe({ th: "amour" });
  for(const cl of ["env-front", "env-flap"]){ const i = h.indexOf(cl); assert.ok(i > 0 && /^[^>]*aria-hidden="true"/.test(h.slice(h.indexOf("<svg", i))), `${cl} : svg aria-hidden`); }
});
await test("Poids : moins de 2 Ko de code par motif en moyenne (2,5 Ko au plus), dessin produit compact", () => {
  // Code de chaque entrée dans index.html (ce que la page pèse) ; les formes semées par emSpray sont produites au chargement
  const src = lireFichier("index.html"), deb = src.indexOf("const ENVELOPE_MOTIFS = {"), fin = src.indexOf("\n};", deb), bloc = src.slice(deb, fin);
  const ths = Object.keys(MOTIFS), pos = ths.map(th => bloc.indexOf(`\n  ${th}: {`));
  assert.ok(pos.every(p => p > 0), "entrées trouvées");
  const poids = ths.map((th, i) => [th, (i + 1 < ths.length ? pos[i + 1] : bloc.length) - pos[i], MOTIFS[th].flap.length + MOTIFS[th].body.length]);
  const moy = poids.reduce((a, [, p]) => a + p, 0) / poids.length;
  console.log(`      code : ${poids.map(([th, p]) => `${th} ${(p / 1000).toFixed(2)}`).join(", ")} ; moyenne ${(moy / 1000).toFixed(2)} Ko`);
  console.log(`      dessin produit : ${poids.map(([th, , d]) => `${th} ${(d / 1000).toFixed(1)}`).join(", ")} Ko`);
  assert.ok(moy < 2000, `moyenne ${moy}`);
  for(const [th, p, d] of poids){ assert.ok(p < 2500, `${th} : ${p}`); assert.ok(d < 16000, `${th} : dessin de ${d} caractères`); }
});
await test("Zone dégagée : rien à moins de 45 du cachet, rien au-dessus du bord haut, débord léger ailleurs", () => {
  for(const [th, m] of Object.entries(MOTIFS)) for(const part of ["flap", "body"]){
    const pts = pointsSVG(m[part]); assert.ok(pts.length > 3, `${th}.${part} : points lus`);
    for(const [x, y] of pts){
      assert.ok(Math.hypot(x - 150, y - 110) >= 45, `${th}.${part} : (${x.toFixed(0)}, ${y.toFixed(0)}) trop près du cachet`);
      assert.ok(y >= 3, `${th}.${part} : (${x.toFixed(0)}, ${y.toFixed(0)}) au-dessus du bord haut`);
      assert.ok(x > -15 && x < 315 && y < 215, `${th}.${part} : (${x.toFixed(0)}, ${y.toFixed(0)}) déborde trop`);
      if(part === "body") assert.ok(y >= 2 + 116 * Math.min(x - 2, 298 - x) / 148 - 2, `${th}.body : (${x.toFixed(0)}, ${y.toFixed(0)}) au-dessus des plis (passerait sur le papier)`);
      if(part === "flap") assert.ok(y <= 2 + 112 * Math.min(x - 2, 298 - x) / 148 + 4, `${th}.flap : (${x.toFixed(0)}, ${y.toFixed(0)}) hors du rabat`);
    }
  }
});
await test("Teinte des motifs (--env-mark) : au moins 3:1 sur l'enveloppe, pour chaque thème et chaque accent", () => {
  const envMark = PAGE.lire("envMark"), contraste = PAGE.lire("contrast");
  for(const t of PAGE.lire("THEMES")) for(const a of [t.a, ...PAGE.lire("ACCENTS").filter(x => PAGE.lire("accentOk")(t.id, x.id)).map(x => x.c)])
    assert.ok(contraste(envMark(a), a) >= 3, `${t.id} / ${a}`);
  // setTheme la calcule depuis l'accent choisi (s'il est accepté), sinon depuis l'accent du thème
  const st = PAGE.lire("setTheme").toString();
  assert.ok(st.includes("const ea = v ? v.accent : (THEMES.find(t=>t.id===id)||THEMES[0]).a;") && st.includes('setProperty("--env-mark", envMark(ea))') && st.includes('setProperty("--env-hi", envHi(ea))'));
});
await test("Sur l'enveloppe : motif du thème au rabat et au corps ; une occasion décorée (ENV_DECO) garde son décor seul", () => {
  for(const th of PERMANENTS){
    const h = enveloppe({ th, o: "juste" });
    assert.ok(h.includes(`<g class="em em-body em-n"`) && h.includes(`<g class="em em-flap em-n"`), th);
    assert.ok(h.indexOf("em-flap") > h.indexOf("env-flap"), `${th} : motif du rabat dans le rabat`);
  }
  for(const o of Object.keys(DECO)){ const h = enveloppe({ th: "base", o }); assert.ok(!/class="em /.test(h) && h.includes("env-deco"), o); }
});
await test("Ancien lien figé : décodé, son enveloppe porte le motif de son thème", async () => {
  const r = REFERENCES[0]; assert.equal(r.attendu.th, "amour");
  const h = await ouvrirLien("https://osedemander.fr/#i=" + r.lien);
  assert.ok(h.includes('class="envelope') && h.includes(MOTIFS.amour.body.slice(0, 60)), "motif Amour");
});
await test("Mouvements : trois niveaux, balancement lent sans rotation continue, transform et opacity seulement", () => {
  for(const an of ["n", "d", "0"]) assert.ok(enveloppe({ th: "fete", o: "juste", an }).includes(`class="em em-flap em-${an}"`), an);
  const regles = CSS.match(/[^}]*\{[^{}]*animation:em-[^}]*\}/g) || [];
  assert.ok(regles.length >= 3);
  for(const r of regles) assert.ok(/\.em-n\b|\.em-d\b[^{]*\.em-1\b/.test(r), `seulement en n (ou l'élément .em-1 en d) : ${r.trim().slice(0, 70)}`);
  for(const [, nom, corps] of CSS.matchAll(/@keyframes (em-\w+)\{((?:[^{}]*\{[^}]*\})*)\}/g)){
    assert.ok(!/(transform|opacity)/.test(corps) || !/(?:^|[;{])(?!transform|opacity)[a-z-]+:/.test(corps.replace(/\{|\}/g, ";").replace(/[\d%,\s]+;/g, ";")), `${nom} : transform et opacity seulement`);
    for(const [, deg] of corps.matchAll(/rotate\((-?\d+)deg\)/g)) assert.ok(Math.abs(+deg) <= 10, `${nom} : pas de rotation continue (${deg}°)`);
  }
  assert.ok(regleCSS(".envelope.open .em-flap").includes("opacity:0"), "motif du rabat effacé à l'ouverture (jamais vu à l'envers)");
});
await test("Rien ne change dans les liens : le décodage ignore les motifs", () => {
  for(const nom of ["sanitize", "unpackLink", "packLink", "decodeData", "encodeData"]) assert.ok(!/ENVELOPE_MOTIFS|envMotif|envMark/.test(PAGE.lire(nom).toString()), nom);
});

/* ---------- Bilan ---------- */
console.log(`\n${ko ? "❌" : "✅"} ${ok} tests réussis, ${ko} en échec (graine ${GRAINE}${ko ? ` — pour rejouer : node tests/run.mjs --graine=${GRAINE}` : ""})`);
if(ko){ console.log(echecs.map(e => "  - " + e).join("\n")); process.exitCode = 1; }
