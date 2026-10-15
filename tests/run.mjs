/* Banc de test d'Ose Demander — une seule commande, depuis la racine du dépôt :
     node tests/run.mjs
   Options : --graine=N (rejoue un tirage aléatoire précis), --nombre=N (invitations aléatoires, 400 par défaut).
   À faire passer avant chaque commit. Aucune dépendance : Node 18 ou plus récent. */
import assert from "node:assert/strict";
import { deflateRawSync, inflateRawSync } from "node:zlib";
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
  for(const k of ["p", "sl", "l", "rv"]) assert.ok(REFERENCES.some(r => r.attendu[k]), `aucune référence avec « ${k} »`);
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
  ["Code de thème inconnu", plat("x", { ...BASE, T: 8 })],
  ["Code de Non inconnu", plat("x", { ...BASE, n: 0 })],
  ["Code de ton inconnu", plat("x", { ...BASE, N: 9 })],
  ["Ton en texte au lieu d'un code", plat("x", { ...BASE, N: "drole" })],
  ["Code d'accent inconnu", plat("x", { ...BASE, C: 42 })],
  ["Code d'emoji inconnu", plat("x", { ...BASE, E: 13 })],
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
  ["Indicateur au nom du format compact (R) dans l'ancien format : ignoré", { ...BASE_ANCIEN, R: 1 }, BASE_ANCIEN]
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
titre("7. Contrastes des 7 thèmes");
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
  for(const t of L.THEMES.filter(t => t.id !== "mystere")) exige(`bouton danger (${t.name})`, "#B3122E", THEME_CSS[t.id].surface, 4.5);
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
await test("Scènes : une scène (décor + élément vedette) pour chacun des 7 thèmes", () => {
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
  assert.ok(total < 30000, `scènes trop lourdes au total (${total} caractères)`);
});
await test("Décor de fond : ton sur ton, texte et texte atténué lisibles (≥ 4,5:1) dans les 7 thèmes", () => {
  const surfaces = [".sc-bg", ".sc-a", ".sc-b", ".sc-speck-d"].map(s => varDe(s, "fill"));
  assert.ok(surfaces.every(Boolean), "couleurs du décor introuvables");
  for(const [sel] of [[".sc-out"], [".sc-line"]]){
    const w = +(declScene(sel).match(/stroke-width:([\d.]+)/) || [])[1];
    assert.ok(w && w <= 2, `${sel} : trait de ${w} px (2 px au plus : la couleur --line ne sert qu'aux traits fins)`);
  }
  for(const [id, sc] of Object.entries(SCENES)){
    const classes = new Set([...sc.wall.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(" ")));
    for(const c of classes) assert.ok(/^sc-(bg|a|b|out|line|speck-[ld])$/.test(c), `${id} : classe « ${c} » dans le décor de fond (réservée à l'élément vedette ?)`);
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
  const tpl = PAGE.lire("TEMPLATES").find(x => x.theme === "fete");
  Object.assign(S, { step: 1 }); PAGE.lire("applyTemplate")(tpl.id); S.step = 2; PAGE.lire("renderCreator")();
  assert.equal(sceneZone.className, "scene-fete dim", "le modèle choisi change aussitôt la scène");
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
  assert.deepEqual(minis(home), CATS.map(c => c.theme), "accueil : une miniature par catégorie");
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
  assert.ok(app.includes(`Rien n'est stocké en ligne : toute l'invitation tient dans le lien. <a href="mentions-legales.html#confidentialite">Confidentialité</a>`), "lien juste après la phrase du bas de page");
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
  assert.deepEqual(cat("Amour"), ["rdv", "couple"], "août : pas de Saint-Valentin");
  assert.deepEqual(cat("Famille"), ["grands"], "août : ni fête des mères ni fête des pères");
  assert.equal(desc("Amour"), "Rendez-vous, couple");
  assert.equal(desc("Famille"), "Grands-parents");
  assert.ok(PAGE.lire("catTemplates")("Amour", "valentin").some(t => t.id === "valentin"), "modèle choisi gardé après la fin de sa saison");
  le("2027-01-20");
  assert.deepEqual(cat("Amour"), ["valentin", "rdv", "couple"], "janvier : Saint-Valentin en tête");
  assert.equal(desc("Amour"), "Saint-Valentin, rendez-vous, couple");
  le("2027-05-20");
  assert.deepEqual(cat("Famille"), ["meres", "peres", "grands"], "mai : jour J le plus proche d'abord");
  le("2026-08-15");
  Object.assign(S, { step: 4, occ: "date", tpl: "rdv", from: "Alex", to: "Sam", link: "", moreOpen: true, open: new Set(["occ", "style"]) });
  PAGE.lire("renderCreator")();
  let h = PAGE.zones["#app"].innerHTML;
  assert.ok(!/data-occ="(valentin|meres|peres)"/.test(h) && h.includes('data-occ="grands"') && h.includes('data-occ="date"'), "occasions hors saison masquées, permanentes gardées");
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

/* ---------- Bilan ---------- */
console.log(`\n${ko ? "❌" : "✅"} ${ok} tests réussis, ${ko} en échec (graine ${GRAINE}${ko ? ` — pour rejouer : node tests/run.mjs --graine=${GRAINE}` : ""})`);
if(ko){ console.log(echecs.map(e => "  - " + e).join("\n")); process.exitCode = 1; }
