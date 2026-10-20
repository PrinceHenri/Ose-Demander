/* Lecteur Web Push indépendant du Worker, pour le banc de test.
   Il joue le rôle de l'appareil abonné (et du service de notification) : il déchiffre un corps « aes128gcm » (RFC 8291 / 8188)
   et vérifie l'en-tête VAPID (RFC 8292). Écrit avec node:crypto (le Worker utilise WebCrypto) : deux mises en œuvre distinctes. */
import { createECDH, hkdfSync, createDecipheriv, createPublicKey, verify, randomBytes } from "node:crypto";

// Un appareil abonné : sa paire de clés ECDH P-256 et son secret d'authentification (16 octets)
export function appareil(){
  const ecdh = createECDH("prime256v1"); ecdh.generateKeys();
  const auth = randomBytes(16);
  return { ecdh, auth, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } };
}

// Déchiffre le corps reçu par le service de notification ; renvoie le message en clair (Buffer)
export function dechiffrer(app, corps){
  const b = Buffer.from(corps);
  const sel = b.subarray(0, 16), rs = b.readUInt32BE(16), idlen = b[20], asPub = b.subarray(21, 21 + idlen), ct = b.subarray(21 + idlen);
  if(idlen !== 65 || rs < 18) throw new Error("en-tête aes128gcm invalide");
  if(ct.length > rs) throw new Error("un seul enregistrement attendu");
  const ecdh = app.ecdh.computeSecret(asPub), uaPub = app.ecdh.getPublicKey();
  const info = Buffer.concat([Buffer.from("WebPush: info\0"), uaPub, asPub]);
  const ikm = Buffer.from(hkdfSync("sha256", ecdh, app.auth, info, 32));
  const cek = Buffer.from(hkdfSync("sha256", ikm, sel, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, sel, Buffer.from("Content-Encoding: nonce\0"), 12));
  const d = createDecipheriv("aes-128-gcm", cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const clair = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  let fin = clair.length - 1; while(fin >= 0 && clair[fin] === 0) fin--; // bourrage
  if(clair[fin] !== 2) throw new Error("délimiteur de dernier enregistrement absent");
  return clair.subarray(0, fin);
}

// Vérifie l'en-tête « vapid t=JWT, k=clé publique » : signature ES256, audience, expiration, sujet ; renvoie les revendications
export function verifierVapid(entete, endpoint, clePublique){
  const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(entete || "");
  if(!m) throw new Error("en-tête VAPID mal formé");
  const [, h, c, s, k] = m;
  if(k !== clePublique) throw new Error("clé publique VAPID inattendue");
  const p = Buffer.from(k, "base64url");
  const cle = createPublicKey({ key: { kty: "EC", crv: "P-256", x: p.subarray(1, 33).toString("base64url"), y: p.subarray(33, 65).toString("base64url") }, format: "jwk" });
  if(!verify("sha256", Buffer.from(h + "." + c), { key: cle, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"))) throw new Error("signature VAPID fausse");
  const entet = JSON.parse(Buffer.from(h, "base64url")), rev = JSON.parse(Buffer.from(c, "base64url"));
  if(entet.alg !== "ES256" || entet.typ !== "JWT") throw new Error("algorithme");
  if(rev.aud !== new URL(endpoint).origin) throw new Error("audience");
  const reste = rev.exp - Date.now() / 1000;
  if(!(reste > 0 && reste <= 24 * 3600)) throw new Error("expiration (24 h au plus, RFC 8292)");
  return rev;
}
