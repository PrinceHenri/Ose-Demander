/* « Partager en story » (côté personne invitée, après le Oui, et sur les Reçues acceptées) : une image verticale 1080 × 1920
   dessinée sur l'appareil, aux couleurs du thème, avec les chatons si l'invitation les affiche, un texte selon la famille de
   l'occasion et « Crée la tienne sur osedemander.fr ».
   Ce que l'image NE contient JAMAIS : le lien ni le QR code de l'invitation, le message, la date, l'heure, le lieu, ni rien
   d'un groupe. Elle ne reçoit d'ailleurs que {th, ac, fam, chats, groupe, prenom} (storyInfo, index.html) ; le prénom de
   l'expéditeur n'est écrit que si la case « Afficher le prénom de … » est cochée (décochée par défaut). Le PNG est nettoyé :
   aucun bloc de texte ni de métadonnées (pngPropre). Rien n'est envoyé : partage par le téléphone, sinon téléchargement. */
(function(){
const W = 1080, H = 1920;
const EMO = {amour:"💕", noel:"🎄", reveillon:"🥂", galette:"👑", anniv:"🎂", famille:"💐", bebe:"🍼", paques:"🐣", amis:"🎉",
  musique:"🎶", halloween:"🎃", honneur:"🎀", annonce:"✨", surprises:"🤫"};
// Annonce et Surprises : pas de prénom proposé (il pourrait en dire trop)
const prenomPossible = info => !!info.prenom && info.fam !== "annonce" && info.fam !== "surprises";
function texte(info, avecPrenom){
  const f = info.fam, e = EMO[f] || "✨", p = avecPrenom && prenomPossible(info) ? info.prenom : "";
  if(info.groupe) return p ? `Je viens chez ${p} ! ${e}` : `Je viens ! ${e}`;
  if(f === "amour") return p ? `J'ai rendez-vous avec ${p} ${e}` : `On a rendez-vous ${e}`;
  if(f === "honneur") return p ? `J'ai accepté, ${p} ${e}` : `J'ai accepté ${e}`;
  if(f === "annonce") return `J'ai hâte de savoir ${e}`;
  if(f === "surprises") return `Surprise acceptée ${e}`;
  if(!EMO[f]) return p ? `J'y serai, ${p} ! ✨` : "C'est oui ✨"; // Neutre et occasions sans famille
  return p ? `J'y serai, ${p} ! ${e}` : `J'y serai ! ${e}`;
}
const PICTO = /\s*(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍(?:\p{Extended_Pictographic}))*/gu;
const sansEmoji = t => t.replace(PICTO, "").trim();
const POLICE = (poids, px) => `${poids} ${px}px "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
/* L'emoji s'affiche-t-il en couleur sur cet appareil ? (sinon : un carré vide ou un dessin gris) → repli : texte sans emoji */
function emojiVisible(fabrique, e){
  try{
    const c = fabrique(48, 48), x = c.getContext("2d");
    x.font = POLICE(400, 36); x.textBaseline = "middle"; x.fillStyle = "#000"; x.fillText(e, 4, 24);
    const d = x.getImageData(0, 0, 48, 48).data;
    for(let i = 0; i < d.length; i += 4) if(d[i + 3] > 40 && (Math.abs(d[i] - d[i + 1]) > 24 || Math.abs(d[i + 1] - d[i + 2]) > 24)) return true;
  }catch(e){}
  return false;
}
// Couleurs du thème (et de la couleur d'accent choisie, si elle reste lisible)
function couleurs(th, ac){
  const t = THEMES.find(x => x.id === th) || THEMES[0], v = ac ? accentVars(t.id, ac) : null;
  return {bg: t.c, surface: t.s || "#FFFFFF", ink: t.i, soft: t.so, accent: v ? v.accent : t.a};
}
function hasard(graine){ let s = graine >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const arrondi = (x, X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
function coeur(x, cx, cy, s){ x.beginPath(); x.moveTo(cx, cy + s * .35); x.bezierCurveTo(cx - s, cy - s * .3, cx - s * .45, cy - s, cx, cy - s * .45); x.bezierCurveTo(cx + s * .45, cy - s, cx + s, cy - s * .3, cx, cy + s * .35); x.fill(); }
function etoile(x, cx, cy, s){ x.beginPath(); for(let i = 0; i < 8; i++){ const a = i * Math.PI / 4, r = i % 2 ? s * .38 : s; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fill(); }
// Découpe le texte en lignes d'au plus « large » pixels : le moins de lignes possible (1, puis 2, puis 3), police réduite
// au besoin, jamais sous 72 px tant qu'une ligne de plus suffit
function lignes(x, t, large){
  t = t.replace(/ (?=[!?;:]|\p{Extended_Pictographic}|\p{Regional_Indicator})/gu, "\u00A0"); // jamais « ! » ni un emoji seul en début de ligne
  const couper = px => { x.font = POLICE(800, px); const l = []; let cur = "";
    for(const m of t.split(" ")){ const essai = cur ? cur + " " + m : m; if(x.measureText(essai).width <= large || !cur) cur = essai; else { l.push(cur); cur = m; } }
    if(cur) l.push(cur); return l.every(s => x.measureText(s).width <= large) ? l : null; };
  for(let n = 1; n <= 3; n++) for(let px = 112; px >= (n < 3 ? 72 : 48); px -= 8){ const l = couper(px); if(l && l.length <= n) return {px, l}; }
  x.font = POLICE(800, 48); return {px: 48, l: [t]};
}
/* Dessine l'image. o = {avecPrenom, emoji (affichable ?), chats (image des chatons ou null)}. Seul texte dessiné : la phrase
   de la story et la signature ; aucune autre donnée n'arrive jusqu'ici. */
function dessiner(x, info, o){
  const c = couleurs(info.th, info.ac), al = hasard(7 + (info.fam || "").length * 31);
  x.fillStyle = c.bg; x.fillRect(0, 0, W, H);
  // Décor : quelques cœurs, étoiles et confettis ton sur ton, de l'espace (pas touffu)
  x.fillStyle = c.accent;
  for(let i = 0; i < 22; i++){
    const cx = al() * W, cy = al() * H, s = 14 + al() * 22, k = i % 3;
    x.globalAlpha = .16 + al() * .14;
    if(k === 0) coeur(x, cx, cy, s); else if(k === 1) etoile(x, cx, cy, s); else { x.beginPath(); x.arc(cx, cy, s * .4, 0, Math.PI * 2); x.fill(); }
  }
  x.globalAlpha = 1;
  // Carte : contour épais à l'encre, ombre dure décalée (comme le billet)
  const cy = o.chats ? 820 : 640, ch = o.chats ? 560 : 620, cx = 100, cw = 880;
  x.fillStyle = c.ink; arrondi(x, cx + 22, cy + 22, cw, ch, 56); x.fill();
  x.fillStyle = c.surface; arrondi(x, cx, cy, cw, ch, 56); x.fill();
  x.lineWidth = 8; x.strokeStyle = c.ink; arrondi(x, cx, cy, cw, ch, 56); x.stroke();
  if(o.chats) x.drawImage(o.chats, (W - 760) / 2, cy - 400, 760, 446);
  // Phrase
  let t = texte(info, o.avecPrenom);
  if(!o.emoji) t = sansEmoji(t);
  const {px, l} = lignes(x, t, cw - 140), hl = px * 1.18, haut = cy + ch / 2 + (o.chats ? 40 : 0) - (l.length * hl) / 2 - 30;
  x.fillStyle = c.ink; x.textAlign = "center"; x.textBaseline = "middle"; x.font = POLICE(800, px);
  l.forEach((s, i) => x.fillText(s, W / 2, haut + hl / 2 + i * hl));
  x.fillStyle = c.accent; arrondi(x, W / 2 - 80, haut + l.length * hl + 26, 160, 14, 7); x.fill();
  // Signature
  x.fillStyle = c.ink; x.globalAlpha = .85; x.font = POLICE(600, 46);
  x.fillText("Crée la tienne sur osedemander.fr", W / 2, 1660);
  x.globalAlpha = 1;
  return t;
}
/* PNG sans métadonnées : on ne garde que les blocs de l'image (IHDR, PLTE, tRNS, IDAT, IEND) */
function pngPropre(u8){
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if(u8.length < 8 || sig.some((b, i) => u8[i] !== b)) return null;
  const garde = ["IHDR", "PLTE", "tRNS", "IDAT", "IEND"], morceaux = [u8.slice(0, 8)];
  let p = 8;
  while(p + 12 <= u8.length){
    const n = ((u8[p] << 24) | (u8[p + 1] << 16) | (u8[p + 2] << 8) | u8[p + 3]) >>> 0, type = String.fromCharCode(...u8.slice(p + 4, p + 8)), fin = p + 12 + n;
    if(fin > u8.length) return null;
    if(garde.includes(type)) morceaux.push(u8.slice(p, fin));
    p = fin;
    if(type === "IEND") break;
  }
  const out = new Uint8Array(morceaux.reduce((s, m) => s + m.length, 0));
  let q = 0; for(const m of morceaux){ out.set(m, q); q += m.length; }
  return out;
}
/* Les chatons (si l'invitation les affiche) : le vrai dessin du moteur, joyeux, avec l'accessoire de la famille, immobile */
async function imageChats(fam){
  await need("mascotte"); await need(mcFichier(fam));
  const css = [...document.querySelectorAll("style")].map(s => s.textContent).filter(s => s.includes(".mc-")).join("\n");
  const duo = ["lilas", "praline"].map((q, i) => Mascotte.chat(q, {energie: "0", famille: fam, sens: i ? -1 : 1}));
  duo.forEach(c => c.etat("joie"));
  const corps = duo.map((c, i) => { const s = c.el.cloneNode(true); s.setAttribute("x", i ? 300 : 0); s.setAttribute("y", 0); s.setAttribute("width", 340); s.setAttribute("height", 400); return new XMLSerializer().serializeToString(s); }).join("");
  duo.forEach(c => c.detruire());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="1280" height="800"><style>${css}</style>${corps}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], {type: "image/svg+xml"}));
  try{ const img = new Image(); img.src = url; await img.decode(); return img; } finally{ setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
const fabrique = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
async function produire(info, avecPrenom, chats){
  try{ await document.fonts.load(POLICE(800, 112)); await document.fonts.load(POLICE(600, 46)); }catch(e){}
  const c = fabrique(W, H), x = c.getContext("2d");
  const phrase = texte(info, avecPrenom), e = (phrase.match(PICTO) || [""])[0].trim();
  dessiner(x, info, {avecPrenom, emoji: !e || emojiVisible(fabrique, e), chats});
  const brut = await new Promise(r => c.toBlob(r, "image/png"));
  const propre = brut && pngPropre(new Uint8Array(await brut.arrayBuffer()));
  return propre ? new Blob([propre], {type: "image/png"}) : null;
}
document.head.insertAdjacentHTML("beforeend", `<style>.story-prev{display:flex;justify-content:center;min-height:120px;margin:0 0 14px}
.story-prev img{display:block;max-height:46vh;max-width:100%;border:2px solid var(--ink);border-radius:14px}
.story-btns{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:4px 0 10px}</style>`);
/* Le panneau : aperçu, case du prénom (décochée), « Partager l'image » (le téléphone) ou « Enregistrer l'image » */
function ouvrir(opener, info){
  document.getElementById("storySheet")?.remove();
  const d = document.createElement("div"); d.className = "sheet"; d.id = "storySheet";
  d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "storyTitre");
  const st = {prenom: false, blob: null, url: "", job: 0, chats: null};
  d.innerHTML = `<div class="sheet-card">
    <h3 id="storyTitre" tabindex="-1">Partager en story</h3>
    <div class="story-prev" id="storyPrev"><p class="img-wait" role="status">Préparation de l'image…</p></div>
    ${prenomPossible(info) ? `<label class="check"><input type="checkbox" id="storyPrenom"><span>Afficher le prénom de ${esc(info.prenom)}</span></label>` : ""}
    <div class="story-btns" id="storyBtns" hidden>
      <button type="button" class="btn primary" id="storyEnvoi">Partager l'image</button>
      <a class="btn" id="storySave" href="#" download="ose-demander-story.png">Enregistrer l'image</a>
    </div>
    <button type="button" class="linkbtn" id="storyFermer">Fermer</button>
  </div>`;
  const onKey = e => { if(e.key === "Escape") fermer(); };
  const fermer = () => { st.job++; d.remove(); document.removeEventListener("keydown", onKey); if(st.url) URL.revokeObjectURL(st.url); try{ opener?.focus(); }catch(e){} };
  const prev = d.querySelector("#storyPrev"), btns = d.querySelector("#storyBtns"), envoi = d.querySelector("#storyEnvoi"), save = d.querySelector("#storySave");
  const fichier = () => new File([st.blob], "ose-demander-story.png", {type: "image/png"});
  const peutPartager = () => { try{ return !!(navigator.canShare && navigator.share && navigator.canShare({files: [fichier()]})); }catch(e){ return false; } };
  const preparer = async () => {
    const job = ++st.job; btns.hidden = true;
    if(info.chats && !st.chats){ try{ st.chats = await imageChats(info.fam); }catch(e){ st.chats = null; } }
    let blob = null; try{ blob = await produire(info, st.prenom, st.chats); }catch(e){}
    if(job !== st.job) return;
    if(!blob){ prev.innerHTML = `<p class="img-wait" role="status">L'image n'a pas pu être préparée sur cet appareil.</p>`; return; }
    if(st.url) URL.revokeObjectURL(st.url);
    st.blob = blob; st.url = URL.createObjectURL(blob);
    prev.innerHTML = `<img src="${st.url}" alt="${esc(sansEmoji(texte(info, st.prenom)))} : image à partager en story">`;
    save.href = st.url;
    envoi.hidden = !peutPartager(); save.className = envoi.hidden ? "btn primary" : "btn";
    btns.hidden = false;
  };
  envoi.addEventListener("click", () => { if(st.blob) navigator.share({files: [fichier()]}).catch(() => {}); });
  d.querySelector("#storyPrenom")?.addEventListener("change", e => { st.prenom = e.target.checked; preparer(); });
  d.querySelector("#storyFermer").addEventListener("click", fermer);
  d.addEventListener("click", e => { if(e.target === d) fermer(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(d); focusScreen("#storyTitre");
  preparer();
  return d;
}
window.Story = {ouvrir, texte, dessiner, pngPropre, prenomPossible, sansEmoji, emojiVisible};
})();

oseLoaded("story", "ed51480401");
