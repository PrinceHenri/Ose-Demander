/* Ose Demander — scanner une invitation depuis un QR code (chargé à la demande au toucher de l'icône, voir need).
   Tout se passe sur l'appareil : l'image choisie ou la vidéo de la caméra n'est jamais envoyée ni enregistrée.
   Lecture : BarcodeDetector quand le navigateur l'a (Chrome sur Android, donc l'appli), sinon jsQR 1.4.0 (Apache 2.0,
   app/vendor/jsqr.js, hébergé ici, chargé seulement s'il sert). Filtre strict (scanLien) : seule l'adresse
   https://osedemander.fr/ avec #i=, #s= ou #g= est acceptée ; tout le reste (dont le lien organisateur #ga=) est refusé
   sans être affiché ni ouvert. Une invitation acceptée devient l'ancre de la page : le routeur et sanitize font le reste.
   Textes regroupés dans SCAN_TEXTES (clés prêtes pour lang/en.json). */
const SCAN_TEXTES = {
  "scan.titre": "Tu as reçu une invitation ?",
  "scan.texte": "Scanne son QR code : tout se passe sur ton téléphone, rien n'est envoyé.",
  "scan.image": "Choisir une image",
  "scan.camera": "Utiliser la caméra",
  "scan.fermer": "Fermer",
  "scan.fermer.aria": "Fermer le scanner",
  "scan.vue": "Scanner une invitation",
  "scan.cadre": "Place le QR code dans le cadre",
  "scan.lecture": "Lecture du QR code…",
  "scan.trouve": "Invitation trouvée",
  "scan.refus": "Ce QR code ne vient pas d'Ose Demander",
  "scan.reessayer": "Réessayer",
  "scan.rien": "Aucun QR code sur cette image. Essaie avec une image plus nette.",
  "scan.cam.refusee": "La caméra n'est pas autorisée. Tu peux choisir une image du QR code à la place.",
  "scan.cam.absente": "Aucune caméra disponible : choisis une image du QR code.",
  "scan.charge": "Le lecteur n'a pas pu se charger. Vérifie ta connexion, puis réessaie."
};
const scanT = k => SCAN_TEXTES[k];

/* ---------- Filtre strict : l'ancre à ouvrir, ou null ---------- */
const SCAN_ORIGINE = "https://osedemander.fr";
function scanLien(texte){
  if(typeof texte!=="string" || texte.length>MAX_LINK+80) return null;
  let u; try{ u=new URL(texte.trim()); }catch(e){ return null; }
  if(u.protocol!=="https:" || u.hostname!=="osedemander.fr" || u.origin!==SCAN_ORIGINE || u.port || u.username || u.password || u.search) return null;
  if(u.pathname!=="/" && u.pathname!=="/index.html") return null;
  const h=u.hash;
  return /^#i=[zpyx][A-Za-z0-9_-]+$/.test(h) || SHORT_HASH.test(h) || GRP_HASH.test(h) ? h : null;
}

/* ---------- Lecture d'une image, d'un canevas ou de la vidéo ---------- */
const JSQR_V = "bc40c8a151"; // début de l'empreinte SHA-256 du fichier publié (jsQR 1.4.0), voir README
function scanJsQR(){
  if(typeof jsQR==="function") return Promise.resolve();
  return scanJsQR.p ||= new Promise((ok, ko)=>{
    const s=document.createElement("script"); s.src="app/vendor/jsqr.js?v="+JSQR_V;
    s.onload=()=> typeof jsQR==="function" ? ok() : ko(new Error("jsqr"));
    s.onerror=()=>{ s.remove(); delete scanJsQR.p; ko(new Error("jsqr")); };
    document.head.appendChild(s);
  });
}
/* Renvoie une fonction lire(source, côté max) -> texte lu ou null. La source est d'abord réduite dans un canevas
   (une photo de 4 000 px ne fige pas le téléphone). */
async function scanLecteur(){
  const cv=document.createElement("canvas"), cx=cv.getContext("2d", {willReadFrequently:true});
  const peindre=(src, max)=>{ const w=src.videoWidth||src.naturalWidth||src.width, h=src.videoHeight||src.naturalHeight||src.height;
    if(!w || !h) return false; const k=Math.min(1, max/Math.max(w, h)); cv.width=Math.max(1, Math.round(w*k)); cv.height=Math.max(1, Math.round(h*k));
    cx.drawImage(src, 0, 0, cv.width, cv.height); return true; };
  if(typeof BarcodeDetector!=="undefined"){
    try{
      if((await BarcodeDetector.getSupportedFormats()).includes("qr_code")){
        const det=new BarcodeDetector({formats:["qr_code"]});
        return async (src, max)=>{ if(!peindre(src, max)) return null; const r=await det.detect(cv); return r.length ? String(r[0].rawValue) : null; };
      }
    }catch(e){}
  }
  await scanJsQR();
  return async (src, max)=>{ if(!peindre(src, max)) return null;
    const d=cx.getImageData(0, 0, cv.width, cv.height), r=jsQR(d.data, cv.width, cv.height, {inversionAttempts:"attemptBoth"});
    return r ? String(r.data) : null; };
}
/* Image choisie, dans le bon sens (orientation EXIF des photos) */
async function scanOuvrirImage(file){
  if(typeof createImageBitmap==="function"){ try{ return await createImageBitmap(file, {imageOrientation:"from-image"}); }catch(e){} }
  return await new Promise((ok, ko)=>{ const u=URL.createObjectURL(file), i=new Image();
    i.onload=()=>{ URL.revokeObjectURL(u); ok(i); }; i.onerror=()=>{ URL.revokeObjectURL(u); ko(new Error("image")); }; i.src=u; });
}

/* ---------- Icônes ---------- */
const SCAN_ICO_IMAGE = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4.5 18l5-5 3.5 3.5 2.5-2.5 4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const SCAN_ICO_CAMERA = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="12.5" r="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;
const SCAN_ICO_FERMER = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;

/* ---------- Styles (ceux du site : contours encre, ombres décalées, variables du thème) ---------- */
document.head.insertAdjacentHTML("beforeend", `<style>
.scan-card h3{font-size:24px;letter-spacing:-.02em}
.scan-btns{display:flex;flex-direction:column;gap:12px;margin-top:4px}
.scan-b{display:flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:12px 18px;border:2px solid var(--ink);border-radius:16px;font:800 18px/1.2 var(--display);cursor:pointer;transition:transform .1s, box-shadow .1s}
.scan-b svg{width:24px;height:24px;flex:none}
.scan-b.prim{background:var(--accent-btn);color:var(--accent-ink);box-shadow:4px 4px 0 var(--ink)}
.scan-b.sec{background:var(--surface);color:var(--ink);box-shadow:4px 4px 0 var(--ink)}
.scan-b:active{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}
.scan-fin{display:block;margin:14px auto 0;min-height:44px;padding:0 16px;background:none;border:0;color:var(--muted);font:700 16px var(--display);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.scan-vue{position:fixed;inset:0;z-index:70;background:var(--ink);color:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;transition:opacity .35s ease}
.scan-vue video,.scan-fige{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.scan-vue.ok .scan-bas{visibility:hidden}
.scan-vue.sortie{opacity:0}
.scan-cadre{z-index:1;position:relative;width:min(72vw,300px);aspect-ratio:1;border-radius:26px;box-shadow:0 0 0 100vmax color-mix(in srgb, var(--ink) 72%, transparent)}
.scan-cadre img{position:absolute;inset:10px;width:calc(100% - 20px);height:calc(100% - 20px);object-fit:contain;border-radius:16px;background:var(--surface)}
.scan-coin{position:absolute;width:56px;height:56px;border:0 solid var(--accent);transition:transform .45s cubic-bezier(.2,1.4,.4,1)}
.scan-coin.hg{top:-4px;left:-4px;border-top-width:7px;border-left-width:7px;border-top-left-radius:24px}
.scan-coin.hd{top:-4px;right:-4px;border-top-width:7px;border-right-width:7px;border-top-right-radius:24px}
.scan-coin.bg{bottom:-4px;left:-4px;border-bottom-width:7px;border-left-width:7px;border-bottom-left-radius:24px}
.scan-coin.bd{bottom:-4px;right:-4px;border-bottom-width:7px;border-right-width:7px;border-bottom-right-radius:24px}
.scan-vue.anim .scan-coin.hg{animation:scanPulse 1.6s ease-in-out infinite}
.scan-vue.anim .scan-coin.hd{animation:scanPulse 1.6s ease-in-out infinite .1s}
.scan-vue.anim .scan-coin.bg{animation:scanPulse 1.6s ease-in-out infinite .2s}
.scan-vue.anim .scan-coin.bd{animation:scanPulse 1.6s ease-in-out infinite .3s}
@keyframes scanPulse{50%{opacity:.6}}
.scan-vue.ok .scan-coin{animation:none}
.scan-vue.ok .scan-coin.hg{transform:translate(18%,18%)}.scan-vue.ok .scan-coin.hd{transform:translate(-18%,18%)}
.scan-vue.ok .scan-coin.bg{transform:translate(18%,-18%)}.scan-vue.ok .scan-coin.bd{transform:translate(-18%,-18%)}
.scan-vue.anim.refus .scan-cadre{animation:scanSecousse .42s ease}
@keyframes scanSecousse{20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
.scan-ligne{position:absolute;left:14px;right:14px;top:12%;height:4px;border-radius:4px;background:var(--accent);opacity:0}
.scan-vue.anim.lit .scan-ligne{opacity:1;animation:scanLigne 1s ease-in-out infinite alternate}
@keyframes scanLigne{to{top:85%}}
.scan-aide{z-index:2;position:relative;margin:22px 0 0;max-width:320px;text-align:center;font:800 18px/1.3 var(--display);color:var(--bg)}
.scan-bulle{z-index:2;position:relative;margin-top:22px;max-width:320px;background:var(--surface);color:var(--ink);border:2px solid var(--ink);border-radius:18px;box-shadow:4px 4px 0 var(--accent);padding:14px 16px;text-align:center;font:800 17px/1.35 var(--display)}
.scan-bulle::before{content:"";position:absolute;top:-11px;left:50%;width:18px;height:18px;margin-left:-9px;background:var(--surface);border-left:2px solid var(--ink);border-top:2px solid var(--ink);transform:rotate(45deg)}
.scan-bulle .scan-b{margin:12px auto 0;min-height:48px;font-size:17px}
.scan-ferme{z-index:2;position:absolute;top:calc(14px + env(safe-area-inset-top,0px));right:14px;width:48px;height:48px;display:grid;place-items:center;border:2px solid var(--ink);border-radius:999px;background:var(--surface);color:var(--ink);box-shadow:3px 3px 0 var(--ink);cursor:pointer;padding:0}
.scan-ferme svg{width:22px;height:22px}
.scan-ferme:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.scan-bas{z-index:2;position:absolute;left:16px;right:16px;bottom:calc(22px + env(safe-area-inset-bottom,0px));display:flex;justify-content:center}
.scan-bas .scan-b{min-width:220px}
.scan-vue .sr{position:absolute}
</style>`);

/* ---------- État ---------- */
const scanCalme = () => (typeof REDUCED_ANIM!=="undefined" && REDUCED_ANIM) || (typeof matchMedia==="function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
let scanEtat=null; // {vue, flux, minuteur, opener, lire, pause}

/* 1. Le panneau : « Choisir une image » (principal), « Utiliser la caméra » (s'il y en a une), « Fermer » */
function ouvrirScanner(opener){
  document.getElementById("scanSheet")?.remove();
  const d=document.createElement("div"); d.className="sheet"; d.id="scanSheet";
  d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-labelledby","scanTitre");
  d.innerHTML=`<div class="sheet-card scan-card">
      <h3 id="scanTitre" tabindex="-1">${esc(scanT("scan.titre"))}</h3>
      <p>${esc(scanT("scan.texte"))}</p>
      <div class="scan-btns">
        <button type="button" class="scan-b prim" id="scanImage">${SCAN_ICO_IMAGE}<span>${esc(scanT("scan.image"))}</span></button>
        ${scanCameraPossible() ? `<button type="button" class="scan-b sec" id="scanCamera">${SCAN_ICO_CAMERA}<span>${esc(scanT("scan.camera"))}</span></button>` : ""}
      </div>
      <button type="button" class="scan-fin" id="scanFermer">${esc(scanT("scan.fermer"))}</button>
      <input type="file" accept="image/*" id="scanFichier" hidden>
    </div>`;
  const onKey=e=>{ if(e.key==="Escape") fermer(); };
  const fermer=(rendre=true)=>{ d.remove(); document.removeEventListener("keydown", onKey); if(rendre) try{ opener?.focus(); }catch(e){} };
  d.addEventListener("click", e=>{ if(e.target===d) fermer(); });
  document.addEventListener("keydown", onKey);
  const input=d.querySelector("#scanFichier");
  d.querySelector("#scanImage").addEventListener("click", ()=>input.click()); // pendant le toucher (Safari)
  input.addEventListener("change", ()=>{ const f=input.files && input.files[0]; if(!f) return; fermer(false); scanImage(f, opener); });
  d.querySelector("#scanCamera")?.addEventListener("click", ()=>{ fermer(false); scanCamera(opener); });
  d.querySelector("#scanFermer").addEventListener("click", ()=>fermer());
  document.body.appendChild(d); focusScreen("#scanTitre");
  // Aucune caméra sur l'appareil (ordinateur sans webcam) : on retire le bouton, sans rien demander
  if(scanCameraPossible() && navigator.mediaDevices.enumerateDevices)
    navigator.mediaDevices.enumerateDevices().then(l=>{ if(!l.some(x=>x.kind==="videoinput")) d.querySelector("#scanCamera")?.remove(); }).catch(()=>{});
  return d;
}
const scanCameraPossible = () => typeof navigator!=="undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

/* 2. La vue plein écran (caméra ou image choisie) */
function scanVue(opener, contenu){
  scanFin(false);
  const v=document.createElement("div"); v.className="scan-vue"+(scanCalme() ? "" : " anim"); v.id="scanVue";
  v.setAttribute("role","dialog"); v.setAttribute("aria-modal","true"); v.setAttribute("aria-label", scanT("scan.vue"));
  v.innerHTML=`${contenu.video ? `<video playsinline muted aria-hidden="true"></video>` : ""}
    <button type="button" class="scan-ferme" id="scanVueFermer" aria-label="${esc(scanT("scan.fermer.aria"))}">${SCAN_ICO_FERMER}</button>
    <div class="scan-cadre" aria-hidden="true">${contenu.vignette ? `<img src="${contenu.vignette}" alt="">` : ""}<i class="scan-coin hg"></i><i class="scan-coin hd"></i><i class="scan-coin bg"></i><i class="scan-coin bd"></i><i class="scan-ligne"></i></div>
    <p class="scan-aide" id="scanAide" role="status">${esc(contenu.aide)}</p>
    <div id="scanBulle"></div>
    ${contenu.video ? `<div class="scan-bas"><button type="button" class="scan-b sec" id="scanVueImage">${SCAN_ICO_IMAGE}<span>${esc(scanT("scan.image"))}</span></button></div>
    <input type="file" accept="image/*" id="scanVueFichier" hidden>` : ""}`;
  const onKey=e=>{ if(e.key==="Escape") scanFin(); };
  scanEtat={vue:v, flux:null, minuteur:0, opener, onKey, pause:false, vignette:contenu.vignette||""};
  document.addEventListener("keydown", onKey);
  v.querySelector("#scanVueFermer").addEventListener("click", ()=>scanFin());
  document.body.appendChild(v); v.querySelector("#scanVueFermer").focus();
  return v;
}
/* Ferme la vue : le flux de la caméra est arrêté tout de suite, la lecture aussi ; rien n'est gardé */
function scanFin(rendre=true){
  const e=scanEtat; if(!e) return; scanEtat=null;
  clearTimeout(e.minuteur);
  if(e.flux) e.flux.getTracks().forEach(t=>t.stop());
  document.removeEventListener("keydown", e.onKey);
  document.removeEventListener("visibilitychange", scanVisibilite);
  if(e.vignette) URL.revokeObjectURL(e.vignette);
  e.vue.remove();
  if(rendre) try{ e.opener?.focus(); }catch(x){}
}
function scanAide(t){ const a=document.getElementById("scanAide"); if(a) a.textContent=t; }
function scanBulle(message, bouton, action){ // message : toujours un texte prévu (SCAN_TEXTES), jamais ce qui a été lu
  const b=document.getElementById("scanBulle"); if(!b) return;
  b.innerHTML=`<div class="scan-bulle" role="alert">${esc(message)}${bouton ? `<button type="button" class="scan-b prim" id="scanBulleBtn">${bouton.ico||""}<span>${esc(bouton.t)}</span></button>` : ""}</div>`;
  if(bouton){ const x=b.querySelector("#scanBulleBtn"); x.addEventListener("click", action); x.focus(); }
}

/* 3. Ce qui a été lu : invitation d'Ose Demander (réussite) ou autre chose (refus, sans jamais l'afficher) */
function scanResultat(texte){
  const e=scanEtat; if(!e) return "ferme";
  const h=scanLien(texte);
  if(!h){
    e.pause=true; e.vue.classList.remove("refus", "lit"); void e.vue.offsetWidth; e.vue.classList.add("refus");
    scanAide("");
    scanBulle(scanT("scan.refus"), {t:scanT("scan.reessayer")}, ()=>{ e.vue.classList.remove("refus"); document.getElementById("scanBulle").innerHTML="";
      if(e.flux){ e.pause=false; scanAide(scanT("scan.cadre")); scanBoucle(); } else { scanFin(false); ouvrirScanner(e.opener); } });
    return "refus";
  }
  // Réussite : la dernière image reste à l'écran, la caméra s'arrête, les coins se resserrent, une courte vibration,
  // puis l'invitation apparaît en fondu
  clearTimeout(e.minuteur); if(e.flux){ scanFiger(e.vue); e.flux.getTracks().forEach(t=>t.stop()); e.flux=null; }
  e.vue.classList.remove("lit"); e.vue.classList.add("ok"); scanAide(scanT("scan.trouve"));
  if(!scanCalme()) try{ navigator.vibrate?.(30); }catch(x){}
  setTimeout(()=>{
    if(location.hash===h) route(); else location.hash=h; // le routeur habituel (sanitize compris) ouvre l'enveloppe derrière la vue
    e.vue.classList.add("sortie");
    setTimeout(()=>scanFin(false), scanCalme() ? 0 : 380);
  }, scanCalme() ? 0 : 520);
  return "ok";
}

/* Fige la dernière image de la caméra (un canevas à la place de la vidéo), pour que rien ne devienne noir à l'arrêt */
function scanFiger(vue){
  const v=vue.querySelector("video"); if(!v || !v.videoWidth) return;
  try{
    const c=document.createElement("canvas"); c.width=v.videoWidth; c.height=v.videoHeight; c.getContext("2d").drawImage(v, 0, 0);
    c.className="scan-fige"; c.setAttribute("aria-hidden","true"); v.replaceWith(c);
  }catch(x){}
}
/* 4. Image choisie : vignette, lecture (réduite à 1 200 px, puis 2 000 px si rien n'est trouvé), puis réussite ou refus */
async function scanImage(file, opener){
  const vignette=URL.createObjectURL(file);
  const v=scanVue(opener, {vignette, aide:scanT("scan.lecture")}); v.classList.add("lit");
  let texte=null;
  try{
    const [lire, img]=await Promise.all([scanLecteur(), scanOuvrirImage(file)]);
    texte = await lire(img, 1200) || await lire(img, 2000);
    img.close?.();
  }catch(e){
    if(scanEtat?.vue!==v) return;
    v.classList.remove("lit"); scanAide("");
    scanBulle(scanT("scan.charge"), {t:scanT("scan.reessayer")}, ()=>{ scanFin(false); ouvrirScanner(opener); }); return;
  }
  if(scanEtat?.vue!==v) return; // fermé entre-temps
  if(!texte){ v.classList.remove("lit"); scanAide(""); scanBulle(scanT("scan.rien"), {t:scanT("scan.image"), ico:SCAN_ICO_IMAGE}, ()=>{ scanFin(false); ouvrirScanner(opener); }); return; }
  scanResultat(texte);
}

/* 5. Caméra : demandée seulement ici, caméra arrière, 6 analyses par seconde au plus, en pause quand l'onglet est caché */
const SCAN_ECART = 160; // ms entre deux analyses (environ 6 par seconde)
async function scanCamera(opener){
  const v=scanVue(opener, {video:true, aide:scanT("scan.cadre")}), e=scanEtat;
  const fichier=v.querySelector("#scanVueFichier");
  v.querySelector("#scanVueImage").addEventListener("click", ()=>fichier.click()); // la caméra continue tant qu'aucune image n'est choisie
  fichier.addEventListener("change", ()=>{ const f=fichier.files && fichier.files[0]; if(f) scanImage(f, opener); });
  let flux;
  try{ flux=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}, audio:false}); }
  catch(err){
    if(scanEtat!==e) return;
    scanAide("");
    scanBulle(scanT(err && err.name==="NotAllowedError" ? "scan.cam.refusee" : "scan.cam.absente"), {t:scanT("scan.image"), ico:SCAN_ICO_IMAGE}, ()=>fichier.click());
    return;
  }
  if(scanEtat!==e){ flux.getTracks().forEach(t=>t.stop()); return; } // fermé pendant la demande d'autorisation
  e.flux=flux;
  const video=v.querySelector("video"); video.srcObject=flux;
  try{ await video.play(); }catch(x){}
  try{ e.lire=await scanLecteur(); }
  catch(x){ if(scanEtat===e){ scanAide(""); scanBulle(scanT("scan.charge"), {t:scanT("scan.image"), ico:SCAN_ICO_IMAGE}, ()=>fichier.click()); } return; }
  document.addEventListener("visibilitychange", scanVisibilite);
  scanBoucle();
}
function scanBoucle(){
  const e=scanEtat; if(!e || !e.flux) return;
  clearTimeout(e.minuteur);
  e.minuteur=setTimeout(async()=>{
    if(scanEtat!==e || !e.flux) return;
    if(e.pause || document.hidden){ scanBoucle(); return; }
    const video=e.vue.querySelector("video"); let t=null;
    if(video && video.readyState>=2) try{ t=await e.lire(video, 720); }catch(x){}
    if(scanEtat!==e) return;
    if(t){ scanResultat(t); if(scanEtat===e && !e.pause) scanBoucle(); return; }
    scanBoucle();
  }, SCAN_ECART);
}
function scanVisibilite(){ if(scanEtat && !document.hidden) scanBoucle(); }

oseLoaded("scanner", "37e73826ea");
