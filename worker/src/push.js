/* Ose Demander — notifications de réponse (Web Push), sans dépendance : WebCrypto seulement.
   - Chiffrement du message pour l'appareil abonné : RFC 8291 (contenu « aes128gcm », RFC 8188)
   - Signature du Worker auprès du service de notification : VAPID, RFC 8292 (jeton JWT signé en ES256)
   - Abonnements chiffrés au repos dans D1 (AES-GCM, clé CLE_STOCKAGE gardée dans les secrets Cloudflare)
   Le message transmis est déjà chiffré par la personne invitée avec la clé du lien : le Worker ne peut pas le lire. */
import { TTL_PUSH, SUJET_VAPID } from "./regles.js";

const enc = new TextEncoder();
export const b64 = buf => { let s = ""; for(const o of new Uint8Array(buf)) s += String.fromCharCode(o); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
export const deB64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
const concat = (...l) => { const r = new Uint8Array(l.reduce((n, a) => n + a.length, 0)); let i = 0; for(const a of l){ r.set(a, i); i += a.length; } return r; };

async function hkdf(sel, ikm, info, bits){
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: sel, info }, k, bits));
}

/* Corps chiffré d'une notification (RFC 8291) : sel (16) | taille d'enregistrement (4) | 65 | clé publique éphémère (65) | contenu chiffré */
export async function chiffrerPush(abo, message){
  const uaPub = deB64(abo.keys.p256dh), auth = deB64(abo.keys.auth), sel = crypto.getRandomValues(new Uint8Array(16));
  const paire = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", paire.publicKey));
  const cleUA = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: cleUA }, paire.privateKey, 256));
  const ikm = await hkdf(auth, ecdh, concat(enc.encode("WebPush: info\0"), uaPub, asPub), 256);
  const cek = await hkdf(sel, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 128);
  const nonce = await hkdf(sel, ikm, enc.encode("Content-Encoding: nonce\0"), 96);
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, concat(message, Uint8Array.of(2)))); // 2 : dernier enregistrement
  const entete = new Uint8Array(21); entete.set(sel); new DataView(entete.buffer).setUint32(16, 4096); entete[20] = 65;
  return concat(entete, asPub, ct);
}

/* En-tête Authorization VAPID : jeton valable 12 h, pour l'origine du service de notification */
export async function enteteVapid(endpoint, publique, privee, maintenant = Date.now()){
  const p = deB64(publique);
  const cle = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d: privee, x: b64(p.slice(1, 33)), y: b64(p.slice(33, 65)), ext: true },
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const jeton = b64(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" }))) + "."
    + b64(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(maintenant / 1000) + 12 * 3600, sub: SUJET_VAPID })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cle, enc.encode(jeton)); // signature brute r|s, celle qu'attend JWS
  return `vapid t=${jeton}.${b64(sig)}, k=${publique}`;
}

/* Envoie le message ; renvoie le code HTTP du service de notification */
export async function envoyerPush(abo, message, env){
  const r = await fetch(abo.endpoint, { method: "POST", body: await chiffrerPush(abo, message), headers: {
    "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(TTL_PUSH), Urgency: "high",
    Authorization: await enteteVapid(abo.endpoint, env.VAPID_PUBLIQUE, env.VAPID_PRIVEE)
  } });
  return r.status;
}

/* Abonnement chiffré au repos, lié à son identifiant (données associées : une ligne ne peut pas être recopiée sur une autre) */
const cleStockage = env => crypto.subtle.importKey("raw", deB64(env.CLE_STOCKAGE), "AES-GCM", false, ["encrypt", "decrypt"]);
export async function scellerAbo(abo, id, env){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return b64(iv) + "." + b64(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(id) }, await cleStockage(env), enc.encode(JSON.stringify(abo))));
}
export async function ouvrirAbo(scelle, id, env){
  const [iv, ct] = scelle.split(".");
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(iv), additionalData: enc.encode(id) }, await cleStockage(env), deB64(ct))));
}
