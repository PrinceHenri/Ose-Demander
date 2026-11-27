/* « Partager en story » (côté personne invitée, après le Oui, et sur les Reçues acceptées) : une image verticale 1080 × 1920
   dessinée sur l'appareil, aux couleurs du thème, avec les chatons si l'invitation les affiche, un texte selon la famille de
   l'occasion et « Crée la tienne sur osedemander.fr ».
   Ce que l'image NE contient JAMAIS : le lien ni le QR code de l'invitation, le message, la date, l'heure, le lieu, ni rien
   d'un groupe. Elle ne reçoit d'ailleurs que {th, ac, occ, em, fam, chats, groupe, prenom} (storyInfo, index.html) ; le prénom de
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
/* Dessine l'image avec les éléments de l'invitation elle-même (dessins de l'image « fête et billet », app/creer.js, passés
   dans K) : la scène du thème en plein cadre et ses décors semés, l'enveloppe de l'occasion (cachet : l'emoji choisi, 💌 pour
   une surprise, jamais une initiale), la phrase manuscrite sur la banderole à l'accent, le billet (talon « Invitation acceptée »,
   perforation et encoches, carte à l'accent penchée derrière) qui porte les chatons, puis la signature.
   Hauts et bas laissés libres (barres d'une story). o = {avecPrenom, emoji (affichable ?), chats (image ou null)}.
   Seuls textes dessinés : la phrase, « Invitation acceptée », la signature (et le cachet) ; aucune autre donnée n'arrive ici. */
const ZONES = {env: [345, 210, 390], ban: [70, 560, 940, 230], tk: [130, 880, 820, 760], stub: 150};
async function dessiner(x, info, o, K){
  const col = K.imageTheme(info.th, info.ac), [ex, ey, ew] = ZONES.env, [bx, by, bw, bh] = ZONES.ban, [tx, ty, tw, th] = ZONES.tk, stub = ZONES.stub;
  x.fillStyle = col.bg; x.fillRect(0, 0, W, H);
  try{ x.drawImage(await K.svgImage(K.sceneImageSVG(info.th, W, H, col)), 0, 0, W, H); }catch(e){}
  K.sprinkle(x, info.th, W, H, [[tx - 40, ty - 40, tw + 80, th + 80], [bx, by, bw, bh], [ex, ey, ew, ew * .72]], 44, 7 + (info.occ || "").length * 37, 1.3);
  try{ await K.drawEnvelope(x, {occ: info.occ, th: info.th, em: info.em, initial: "💌"}, col, ex, ey, ew, -.07); }catch(e){}
  // La phrase, manuscrite sur la banderole (jamais « ! » ni un emoji seul en début de ligne)
  let t = texte(info, o.avecPrenom);
  if(!o.emoji) t = sansEmoji(t);
  const cut = K.banner(x, bx, by, bw, bh, col);
  K.handText(x, t.replace(/ (?=[!?;:]|\p{Extended_Pictographic}|\p{Regional_Indicator})/gu, "\u00A0"), W / 2, by + bh / 2, bw - 2 * cut - 40, 112, col.btnInk, true);
  // Le billet : carte à l'accent penchée derrière, papier, talon, perforation à encoches
  x.save(); x.translate(tx + tw / 2, ty + th / 2); x.rotate(.05); x.fillStyle = col.accent; K.rrect(x, -tw / 2 - 18, -th / 2 - 14, tw + 36, th + 28, 40); x.fill(); x.restore();
  K.paperCard(x, tx, ty, tw, th, 40, col);
  const py = ty + stub;
  x.fillStyle = col.ink; x.font = `700 ${Math.round(stub * .48)}px "Caveat", "Comic Sans MS", cursive`; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("Invitation acceptée", tx + tw / 2, ty + stub / 2 + 4);
  x.strokeStyle = col.line; x.lineWidth = 6; x.setLineDash([18, 16]); x.beginPath(); x.moveTo(tx + 56, py); x.lineTo(tx + tw - 56, py); x.stroke(); x.setLineDash([]);
  for(const bord of [tx, tx + tw]){
    x.fillStyle = col.bg; x.beginPath(); x.arc(bord, py, 30, 0, 6.29); x.fill();
    x.strokeStyle = col.ink; x.lineWidth = 6; x.beginPath(); x.arc(bord, py, 30, bord === tx ? -1.57 : 1.57, bord === tx ? 1.57 : 4.71); x.stroke();
  }
  // Dans le billet : les chatons, sinon l'emoji de la famille en grand (ou une forme du décor du thème s'il ne s'affiche pas)
  const mh = ty + th - py;
  if(o.chats) x.drawImage(o.chats, W / 2 - 330, py + 40, 660, 412);
  else if(o.emoji){ x.font = `260px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; x.fillStyle = col.ink; x.fillText(EMO[info.fam] || "✨", W / 2, py + mh / 2 - 50); }
  else { const cfg = (typeof DECOR !== "undefined" && (DECOR[info.th] || DECOR.base)) || {}, f = [].concat(cfg.shape || "heart")[0];
    x.save(); x.translate(W / 2, py + mh / 2 - 50); try{ Decor.paint(x, f, 150, col.accent); }catch(e){} x.restore(); }
  x.fillStyle = col.ink; x.globalAlpha = .85; x.font = POLICE(600, 40); x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("Crée la tienne sur osedemander.fr", W / 2, ty + th - 64);
  x.globalAlpha = 1;
  return t;
}
// Les dessins de l'image « fête et billet » (app/creer.js, chargé à la demande)
const kit = () => ({imageTheme, svgImage, sceneImageSVG, sprinkle, drawEnvelope, banner, handText, rrect, paperCard});
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
  await need("creer"); // les dessins de l'invitation (déjà là côté création et dans « Mes invitations »)
  try{ await Promise.all([POLICE(600, 40), `700 112px "Caveat"`].map(p => document.fonts.load(p))); }catch(e){}
  const c = fabrique(W, H), x = c.getContext("2d");
  const phrase = texte(info, avecPrenom), e = (phrase.match(PICTO) || [""])[0].trim();
  await dessiner(x, info, {avecPrenom, emoji: !e || emojiVisible(fabrique, e), chats}, kit());
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

oseLoaded("story", "bc89b34813");
