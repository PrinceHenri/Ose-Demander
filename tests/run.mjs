/* Banc de test d'Ose Demander — une seule commande, depuis la racine du dépôt :
     node tests/run.mjs
   Options : --graine=N (rejoue un tirage aléatoire précis), --nombre=N (invitations aléatoires, 400 par défaut).
   À faire passer avant chaque commit. Aucune dépendance : Node 18 ou plus récent. */
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { charger } from "./charger.mjs";
import { REFERENCES } from "./references.mjs";
import * as FIGE from "./tables-figees.mjs";

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
  for(const k of ["p", "sl", "l"]) assert.ok(REFERENCES.some(r => r.attendu[k]), `aucune référence avec « ${k} »`);
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
  ["Un seul créneau valable : la date simple est gardée", { ...BASE_ANCIEN, sl: [["2026-11-14", "20:00"], ["mauvais", "20:00"]] }, BASE_ANCIEN]
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

/* ---------- Bilan ---------- */
console.log(`\n${ko ? "❌" : "✅"} ${ok} tests réussis, ${ko} en échec (graine ${GRAINE}${ko ? ` — pour rejouer : node tests/run.mjs --graine=${GRAINE}` : ""})`);
if(ko){ console.log(echecs.map(e => "  - " + e).join("\n")); process.exitCode = 1; }
