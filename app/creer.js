/* Ose Demander — création, accueil, « Mes invitations », image à partager (avec son encodeur de QR code).
   Chargé à la demande par index.html (need("creer")) : jamais pour ouvrir une invitation.
   Script classique : ses déclarations rejoignent celles de index.html (mêmes noms globaux, aucun en double, vérifié par le banc).
   La dernière ligne déclare sa version (empreinte du contenu, écrite par node outils/csp.mjs) : index.html la compare à celle attendue. */
/* ---------- QR code (norme ISO/IEC 18004), calculé ici : le lien ne sort jamais de l'appareil ----------
   Mode octets seulement (les liens), niveaux de correction L, M, Q, H, versions 1 à 40, masque choisi par le calcul de pénalité.
   qrEncode(texte, niveau) -> {size, version, mask, dark(x, y)} ; null si le texte est trop long pour ce niveau. */
const QR_ECL = {L:{i:0, bits:1}, M:{i:1, bits:0}, Q:{i:2, bits:3}, H:{i:3, bits:2}};
// Codes correcteurs par bloc et nombre de blocs, par niveau (L, M, Q, H) et par version (index 0 inutilisé)
const QR_ECC = [
  [0,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [0,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
  [0,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [0,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]];
const QR_BLOCKS = [
  [0,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
  [0,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
  [0,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
  [0,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]];
const qrRawModules = v => { let r=(16*v+128)*v+64; if(v>=2){ const n=Math.floor(v/7)+2; r-=(25*n-10)*n-55; if(v>=7) r-=36; } return r; };
const qrDataCodewords = (v, e) => Math.floor(qrRawModules(v)/8) - QR_ECC[e][v]*QR_BLOCKS[e][v];
const qrAlign = v => { if(v===1) return []; const n=Math.floor(v/7)+2, size=v*4+17, step=v===32 ? 26 : Math.ceil((v*4+4)/(n*2-2))*2;
  const r=[6]; for(let i=0, p=size-7; i<n-1; i++, p-=step) r.splice(1, 0, p); return r; };
// Corps de Galois GF(256), polynôme 0x11D ; reste de la division par le polynôme générateur de degré n
const QR_EXP=new Uint8Array(512), QR_LOG=new Uint8Array(256);
for(let i=0, x=1; i<255; i++){ QR_EXP[i]=x; QR_LOG[x]=i; x<<=1; if(x&256) x^=0x11D; }
for(let i=255; i<512; i++) QR_EXP[i]=QR_EXP[i-255];
const qrMul = (a, b) => a && b ? QR_EXP[QR_LOG[a]+QR_LOG[b]] : 0;
function qrReedSolomon(data, n){
  let g=[1]; for(let i=0; i<n; i++){ const ng=new Array(g.length+1).fill(0); g.forEach((c,j)=>{ ng[j]^=c; ng[j+1]^=qrMul(c, QR_EXP[i]); }); g=ng; }
  const r=new Array(n).fill(0);
  for(const b of data){ const f=b^r.shift(); r.push(0); for(let j=0; j<n; j++) r[j]^=qrMul(g[j+1], f); }
  return r;
}
const QR_MASKS = [(x,y)=>(x+y)%2===0, (x,y)=>y%2===0, (x,y)=>x%3===0, (x,y)=>(x+y)%3===0, (x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,
  (x,y)=>x*y%2+x*y%3===0, (x,y)=>(x*y%2+x*y%3)%2===0, (x,y)=>((x+y)%2+x*y%3)%2===0];
function qrEncode(text, level="Q", forceMask=-1){
  const bytes=utf8(text), e=QR_ECL[level].i;
  let v=1; for(; v<=40; v++) if(4+(v<10?8:16)+bytes.length*8 <= qrDataCodewords(v, e)*8) break;
  if(v>40) return null;
  // Bits : mode octets (0100), longueur, octets, fin, remplissage
  const cap=qrDataCodewords(v, e)*8, bits=[];
  const put=(val, len)=>{ for(let i=len-1; i>=0; i--) bits.push((val>>>i)&1); };
  put(4, 4); put(bytes.length, v<10 ? 8 : 16); for(const b of bytes) put(b, 8);
  put(0, Math.min(4, cap-bits.length)); while(bits.length%8) bits.push(0);
  for(let pad=0xEC; bits.length<cap; pad^=0xEC^0x11) put(pad, 8);
  const data=[]; for(let i=0; i<bits.length; i+=8) data.push(bits.slice(i, i+8).reduce((a,b)=>a*2+b, 0));
  // Blocs (les derniers ont un octet de données de plus), codes correcteurs, entrelacement
  const nb=QR_BLOCKS[e][v], ne=QR_ECC[e][v], raw=Math.floor(qrRawModules(v)/8), nShort=nb-raw%nb, shortLen=Math.floor(raw/nb)-ne;
  const blocks=[]; for(let i=0, k=0; i<nb; i++){ const len=shortLen+(i<nShort ? 0 : 1); blocks.push(data.slice(k, k+len)); k+=len; }
  const eccs=blocks.map(b=>qrReedSolomon(b, ne)), all=[];
  for(let i=0; i<=shortLen; i++) for(const b of blocks) if(i<b.length) all.push(b[i]);
  for(let i=0; i<ne; i++) for(const c of eccs) all.push(c[i]);
  // Matrice : motifs fixes, puis données en zigzag
  const size=v*4+17, M=[...Array(size)].map(()=>new Array(size).fill(false)), F=[...Array(size)].map(()=>new Array(size).fill(false));
  const set=(x, y, d)=>{ M[y][x]=d; F[y][x]=true; };
  for(let i=0; i<size; i++){ set(6, i, i%2===0); set(i, 6, i%2===0); }
  for(const [cx, cy] of [[3,3],[size-4,3],[3,size-4]]) for(let dy=-4; dy<=4; dy++) for(let dx=-4; dx<=4; dx++){
    const x=cx+dx, y=cy+dy, d=Math.max(Math.abs(dx), Math.abs(dy)); if(x>=0 && x<size && y>=0 && y<size) set(x, y, d!==2 && d!==4); }
  const al=qrAlign(v);
  al.forEach((ay, i)=>al.forEach((ax, j)=>{ if((i===0&&j===0) || (i===0&&j===al.length-1) || (i===al.length-1&&j===0)) return;
    for(let dy=-2; dy<=2; dy++) for(let dx=-2; dx<=2; dx++) set(ax+dx, ay+dy, Math.max(Math.abs(dx), Math.abs(dy))!==1); }));
  const format=mask=>{ const d=QR_ECL[level].bits<<3|mask; let r=d; for(let i=0; i<10; i++) r=(r<<1)^((r>>>9)*0x537); return (d<<10|r)^0x5412; };
  const drawFormat=mask=>{ const b=format(mask), bit=i=>((b>>>i)&1)===1;
    for(let i=0; i<=5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for(let i=9; i<15; i++) set(14-i, 8, bit(i));
    for(let i=0; i<8; i++) set(size-1-i, 8, bit(i)); for(let i=8; i<15; i++) set(8, size-15+i, bit(i));
    set(8, size-8, true); };
  drawFormat(0);
  if(v>=7){ let r=v; for(let i=0; i<12; i++) r=(r<<1)^((r>>>11)*0x1F25); const b=v<<12|r;
    for(let i=0; i<18; i++){ const d=((b>>>i)&1)===1, a=size-11+i%3, c=Math.floor(i/3); set(a, c, d); set(c, a, d); } }
  let n=0;
  for(let right=size-1; right>=1; right-=2){ if(right===6) right=5;
    for(let vert=0; vert<size; vert++) for(let j=0; j<2; j++){ const x=right-j, up=((right+1)&2)===0, y=up ? size-1-vert : vert;
      if(!F[y][x] && n<all.length*8){ M[y][x]=((all[n>>>3]>>>(7-(n&7)))&1)===1; n++; } } }
  const apply=mask=>{ for(let y=0; y<size; y++) for(let x=0; x<size; x++) if(!F[y][x] && QR_MASKS[mask](x, y)) M[y][x]=!M[y][x]; };
  // Masque : le moins pénalisé (longues lignes, carrés 2 × 2, faux motifs de repérage, déséquilibre clair / foncé)
  const penalty=()=>{ let p=0, dark=0;
    const line=get=>{ let run=1; for(let i=1; i<=size; i++){ if(i<size && get(i)===get(i-1)) run++; else { if(run>=5) p+=run-2; run=1; } }
      for(let i=0; i+7<=size; i++){ const s=[0,1,2,3,4,5,6].map(k=>get(i+k)?1:0).join("");
        if(s==="1011101"){ const l=k=>i-k<0 || !get(i-k), r=k=>i+6+k>=size || !get(i+6+k); if([1,2,3,4].every(l) || [1,2,3,4].every(r)) p+=40; } } };
    for(let y=0; y<size; y++){ line(x=>M[y][x]); line(x=>M[x][y]); }
    for(let y=0; y<size-1; y++) for(let x=0; x<size-1; x++){ const c=M[y][x]; if(c===M[y][x+1] && c===M[y+1][x] && c===M[y+1][x+1]) p+=3; }
    for(const row of M) for(const c of row) if(c) dark++;
    return p+(Math.ceil(Math.abs(dark*20-size*size*10)/(size*size))-1)*10; };
  let best=forceMask;
  if(best<0){ let min=Infinity; for(let m=0; m<8; m++){ apply(m); drawFormat(m); const p=penalty(); if(p<min){ min=p; best=m; } apply(m); } }
  apply(best); drawFormat(best);
  return {size, version:v, mask:best, level, dark:(x, y)=>M[y][x]};
}

/* Modèles prêts à l'emploi : ils pré-remplissent des champs existants, rien de nouveau n'est mis dans le lien */
const TEMPLATES = [
  {id:"rdv", cat:"Amour", label:"Proposer un date", short:"rendez-vous", occ:"date", theme:"date", no:"fuit", em:"💌",
    q:"Ça te dit un rendez-vous avec moi ?", msg:"Prépare ton plus beau sourire, je m'occupe du reste."},
  {id:"valentin", cat:"Amour", label:"Saint-Valentin", short:"Saint-Valentin", occ:"valentin", theme:"valentin", no:"retrecit", tone:"romantique", em:"🌹",
    q:"Tu passes la Saint-Valentin avec moi ?", msg:"Tu n'as rien à prévoir, juste à dire oui."},
  {id:"annivamour", cat:"Amour", label:"L'anniversaire de mon amour", short:"anniversaire de mon amour", occ:"annivamour", theme:"annivamour", no:"retrecit", tone:"romantique", em:"🎂",
    q:"Je peux t'emmener fêter ton anniversaire ?", msg:"Ton jour, rien que pour toi : je m'occupe de tout."},
  {id:"couple", cat:"Amour", label:"Notre anniversaire de couple", short:"couple", occ:"couple", theme:"couple", no:"supplie", tone:"romantique", em:"❤️",
    q:"On fête notre anniversaire ensemble ?", msg:"J'ai envie de passer ce moment avec toi, rien qu'avec toi."},
  {id:"weekend", cat:"Amour", label:"Un week-end en amoureux", short:"week-end en amoureux", occ:"weekend", theme:"weekend", no:"fuit", tone:"romantique", em:"❤️",
    q:"On s'offre un week-end rien qu'à deux ?", msg:"Prépare juste un petit sac, je m'occupe du reste."},
  {id:"dinerspecial", cat:"Amour", label:"Un dîner un peu spécial", short:"dîner un peu spécial", occ:"dinerspecial", theme:"dinerspecial", no:"transforme", tone:"romantique", em:"🌹",
    q:"Tu me laisses t'inviter à dîner ?", msg:"Une jolie table, une belle soirée, et toi en face de moi."},
  {id:"meres", cat:"Famille", label:"Fête des mères", short:"fête des mères", occ:"meres", theme:"meres", no:"transforme", tone:"mignon", em:"🌷",
    q:"Maman, je t'emmène pour la fête des mères ?", msg:"Tu t'occupes toujours de nous, cette fois c'est mon tour."},
  {id:"peres", cat:"Famille", label:"Fête des pères", short:"fête des pères", occ:"peres", theme:"peres", no:"retrecit", tone:"drole", em:"👔",
    q:"Papa, je t'emmène pour la fête des pères ?", msg:"Merci pour tout. Ce moment, c'est pour toi."},
  {id:"annivfam", cat:"Famille", label:"Un anniversaire en famille", short:"anniversaire en famille", occ:"annivfam", theme:"annivfam", no:"supplie", tone:"mignon", em:"🎂",
    q:"Tu viens fêter ton anniversaire avec moi ?", msg:"Toute la famille sera là pour toi."},
  {id:"nouvelle", cat:"Famille", label:"Annoncer une grande nouvelle", short:"grande nouvelle", occ:"nouvelle", theme:"nouvelle", no:"fuit", tone:"theatral", em:"✨",
    q:"J'ai une grande nouvelle à t'annoncer : tu viens ?", msg:"Je préfère te le dire en vrai."},
  {id:"parrain", cat:"Famille", label:"Être parrain ou marraine", short:"parrain ou marraine", occ:"parrain", theme:"parrain", no:"supplie", tone:"mignon", em:"💌",
    q:"Tu veux bien être parrain ou marraine ?", msg:"Je ne vois personne de mieux pour ce rôle."},
  {id:"babyshower", cat:"Famille", label:"Une baby shower", short:"baby shower", occ:"babyshower", theme:"babyshower", no:"fuit", tone:"mignon", em:"🎁",
    q:"Tu viens à la baby shower ?", msg:"On fête l'arrivée du bébé, il ne manque plus que toi."},
  {id:"repasfam", cat:"Famille", label:"Un repas de famille", short:"repas de famille", occ:"repasfam", theme:"repasfam", no:"retrecit", tone:"mignon", em:"❤️",
    q:"Tu viens au repas de famille ?", msg:"Il y aura une place pour toi à table, comme toujours."},
  {id:"monanniv", cat:"Amis", label:"Mon anniversaire", short:"mon anniversaire", occ:"monanniv", theme:"monanniv", no:"fuit", tone:"drole", em:"🎂",
    q:"Tu viens fêter mon anniversaire ?", msg:"Ce ne sera pas pareil sans toi."},
  {id:"temoin", cat:"Amis", label:"Être mon témoin", short:"témoin", occ:"temoin", theme:"temoin", no:"supplie", tone:"theatral", em:"🎉",
    q:"Tu veux être mon témoin ?", msg:"Je ne vois personne d'autre à mes côtés ce jour-là."},
  {id:"evc", cat:"Amis", label:"Un enterrement de vie de célibataire", short:"enterrement de vie de célibataire", occ:"evc", theme:"evc", no:"fuit", tone:"theatral", em:"🎉",
    q:"Tu viens à l'enterrement de vie de célibataire ?", msg:"Une dernière folie avant le grand jour, ne rate pas ça."},
  {id:"cremaillere", cat:"Amis", label:"Une pendaison de crémaillère", short:"crémaillère", occ:"cremaillere", theme:"cremaillere", no:"transforme", tone:"drole", em:"🎁",
    q:"Tu viens pendre la crémaillère chez moi ?", msg:"Nouvelle adresse, même bonne humeur : je t'attends."},
  {id:"soiree", cat:"Amis", label:"Une soirée", short:"soirée", occ:"soiree", theme:"soiree", no:"fuit", tone:"drole", em:"🍕",
    q:"Tu viens à ma soirée ?", msg:"Pas d'excuse cette fois, je t'attends."},
  {id:"voyage", cat:"Amis", label:"Un week-end ou un voyage", short:"week-end ou voyage", occ:"voyage", theme:"voyage", no:"retrecit", tone:"drole", em:"✨",
    q:"On part ensemble ?", msg:"Fais ta valise, l'aventure commence bientôt."},
  {id:"fetesurprise", cat:"Surprise", label:"Une fête surprise", short:"fête surprise", occ:"fetesurprise", theme:"fetesurprise", no:"fuit", em:"🎁",
    q:"Tu viens à la fête surprise ?", msg:"Surtout, pas un mot à la personne fêtée."},
  {id:"mystere", cat:"Surprise", label:"Une journée surprise", short:"journée surprise", occ:"surprise", theme:"journeesurprise", no:"fuit", em:"✨",
    q:"Tu me confies ta journée ?", msg:"Fais-moi confiance, tu vas aimer.",
    plan:{steps:[{h:"10 h",hint:"Prévois des baskets"},{h:"13 h",hint:"Tu vas te régaler"},{h:"17 h",hint:"Garde des forces"}]}},
  // Saisonniers (SEASONS) : proposés seulement pendant leur période, en tête de leur catégorie
  {id:"voyagesurprise", cat:"Surprise", label:"Un voyage surprise", short:"voyage surprise", occ:"voyagesurprise", theme:"voyagesurprise", no:"fuit", em:"💌",
    q:"Tu me suis pour un voyage surprise ?", msg:"Prépare un sac, la destination reste secrète.", plan:{lieuHint:"Prépare ta valise"}},
  {id:"halloween", cat:"Amis", label:"Soirée Halloween", short:"Halloween", occ:"halloween", theme:"halloween", no:"fuit", tone:"theatral", em:"🎃",
    q:"Tu oses venir fêter Halloween avec moi ?", msg:"Viens avec ton meilleur déguisement."},
  {id:"noel", cat:"Famille", label:"Repas de Noël", short:"repas de Noël", occ:"noel", theme:"noel", no:"supplie", tone:"mignon", em:"🎄",
    q:"Tu viens au repas de Noël ?", msg:"La table ne sera pas complète sans toi."},
  {id:"reveillon", cat:"Amis", label:"Réveillon du Nouvel An", short:"réveillon", occ:"reveillon", theme:"reveillon", no:"retrecit", tone:"drole", em:"🥂",
    q:"On passe le réveillon ensemble ?", msg:"On finit l'année ensemble, et on commence la suivante pareil."},
  {id:"galette", cat:"Amis", label:"Galette des rois", short:"galette des rois", occ:"galette", theme:"galette", no:"transforme", tone:"drole", em:"👑",
    q:"On partage la galette ensemble ?", msg:"La fève est peut-être pour toi."},
  {id:"paques", cat:"Famille", label:"Pâques", short:"Pâques", occ:"paques", theme:"paques", no:"fuit", tone:"mignon", em:"🐣",
    q:"Tu viens fêter Pâques avec moi ?", msg:"Il y aura du chocolat, c'est promis."},
  {id:"musique", cat:"Amis", label:"Fête de la musique", short:"fête de la musique", occ:"musique", theme:"musique", no:"fuit", tone:"drole", em:"🎶",
    q:"On sort pour la fête de la musique ?", msg:"Prépare tes oreilles, la soirée va être longue."}
];
const INTROS = Object.fromEntries(Object.entries(INTRO_OCC).map(([o,c])=>[o, LINK_INTRO[c]]));
const HOME_CATS = [
  {cat:"Amour", theme:"date", ico:"❤️"},
  {cat:"Famille", theme:"annivfam", ico:"🌷"},
  {cat:"Amis", theme:"monanniv", ico:"🎉"},
  {cat:"Surprise", theme:"fetesurprise", ico:"✨"}
];
/* Modèles proposés ce jour-là dans une catégorie : saisonniers ouverts d'abord (jour J le plus proche), puis permanents.
   keep : modèle déjà choisi, gardé même si sa saison vient de se terminer pendant la création. */
function catTemplates(cat, keep=""){
  const today=seasonToday(), day=t=>seasonAt(t.occ, today)?.day;
  const list=TEMPLATES.filter(t=>t.cat===cat && (seasonOpen(t.occ, today) || t.id===keep));
  const rank=t=>TEMPLATES.indexOf(t);
  return [...list.filter(day).sort((a,b)=>seasonOrder(day(a), day(b), today) || rank(a)-rank(b)), ...list.filter(t=>!day(t))];
}
/* Ordre des saisons ouvertes (modèles et bandeau) : jour J à venir le plus proche d'abord, puis les jours J passés,
   du plus récent au plus ancien. 0 si même jour J : l'appelant départage par l'ordre de la liste des modèles. */
const seasonOrder = (a, b, today) => a===b ? 0 : (a>=today) !== (b>=today) ? (a>=today ? -1 : 1) : a>=today ? (a<b ? -1 : 1) : (a>b ? -1 : 1);
/* Description d'une carte de l'accueil : les trois premiers modèles proposés (jamais un modèle hors saison) */
function catDesc(cat){
  const d=catTemplates(cat).slice(0,3).map(t=>t.short).join(", ");
  return d.charAt(0).toUpperCase()+d.slice(1);
}

const S = {
  step:"home", tplCat:"Amour", tpl:"", preset:{},
  from:"", to:"", occ:"", occFree:"", theme:"base", themeManual:false, anim:"n",
  mode:"one",
  act:{v:"v", x:"", h:"", at:""}, lieu:{v:"v", x:"", h:"", at:""}, details:"",
  steps:[{h:"", a:"", l:"", v:"v", hint:"", at:""}],
  end:"", bring:"", meet:"",
  date:"", time:"", choose:false, slots:[{d:"",t:""},{d:"",t:""}],
  q:"", qEdited:false, msg:"", hidden:false,
  no:"fuit", tone:"taquin", ch:"any", chId:"", link:"",
  ac:"", em:"", sg:"", snd:true, intro:false, share:true,
  moreOpen:false, open:new Set(), err:"", errSec:""
};

/* Pages d'occasion (référencement) : adresse, nom affiché, modèle ouvert par « Créer mon invitation » (/#modele=…) */
const OCC_PAGES = [
  {path:"invitation-repas-de-noel", label:"Repas de Noël", tpl:"noel"},
  {path:"invitation-reveillon-nouvel-an", label:"Réveillon du Nouvel An", tpl:"reveillon"},
  {path:"invitation-saint-valentin", label:"Saint-Valentin", tpl:"valentin"},
  {path:"demande-temoin-mariage", label:"Demande de témoin", tpl:"temoin"},
  {path:"demande-parrain-marraine", label:"Parrain ou marraine", tpl:"parrain"},
  {path:"invitation-anniversaire", label:"Anniversaire", tpl:"monanniv"}
];
/* ---------- Pied de page : accueil, et pages statiques (outils/pages.mjs le reprend tel quel) ----------
   Bandeau sombre à l'encre Lilas sur toutes les pages, quel que soit le thème (exception assumée, comme le logo de saison) :
   textes clairs (≥ 4,5:1, vérifié par le banc), titres de colonnes à l'accent du thème rendu lisible sur ce fond (acc).
   logo : celui de l'accueil (de saison) ou le logo habituel ; installer : lien « Installer l'appli » (masqué dans l'appli installée). */
const FOOT_BG = "#1F1546";
function footerHTML({logo, acc="", installer=true}={}){
  const lien=(href, txt)=>`<li><a href="${href}">${txt}</a></li>`;
  return `<footer class="site-foot"${acc ? ` style="--f-acc:${acc}"` : ""}>
  <div class="sf-in">
    <div class="sf-brand">${logo}<p>Des invitations animées à envoyer par message. Gratuit, sans compte, sans pub.</p></div>
    <nav class="sf-col" aria-labelledby="sfSite"><h2 id="sfSite">Ose Demander</h2><ul>${lien("/#choisir","Créer une invitation")}${lien("/#exemple","Voir un exemple")}${lien("/#mes-invitations","Mes invitations")}${installer ? lien("/#installer","Installer l'appli") : ""}</ul></nav>
    <nav class="sf-col" aria-labelledby="sfIdees"><h2 id="sfIdees">Idées</h2><ul>${OCC_PAGES.map(p=>lien(`/${p.path}/`, esc(p.label))).join("")}</ul></nav>
    <nav class="sf-col" aria-labelledby="sfInfos"><h2 id="sfInfos">Informations</h2><ul>${lien("/mentions-legales.html","Mentions légales")}${lien("/mentions-legales.html#confidentialite","Confidentialité")}${lien("/supprimer-mes-donnees/","Supprimer mes données")}<li><a href="mailto:contact@osedemander.fr">Contact<span class="sf-mail">contact@osedemander.fr</span></a></li></ul></nav>
  </div>
  <p class="sf-bas">© 2026 Ose Demander — Rien n'est stocké en clair en ligne.</p>
</footer>`;
}
function applyTemplate(id){
  const t=TEMPLATES.find(x=>x.id===id);
  const p=(t&&t.plan)||{}, pr=S.preset||{};
  if(t) Object.assign(S,{tpl:t.id, occ:t.occ, occFree:"", theme:t.theme, q:t.q, qEdited:true, msg:t.msg, no:t.no, tone:t.tone||"taquin", em:t.em});
  else Object.assign(S,{tpl:"zero", occ:"juste", occFree:"", theme:"base", q:OCC.juste.q, qEdited:false, msg:"", no:"fuit", tone:"taquin", em:""});
  Object.assign(S,{themeManual:false, hidden:false, ac:"", intro:!!t}); // introduction : activée avec un modèle, pas en partant de zéro
  // On défait ce que le modèle précédent avait préréglé, si la personne n'y a pas touché
  if(pr.prog && !p.steps) S.mode="one";
  if(pr.act && !p.act && S.act.x===pr.act) S.act={v:"v",x:"",h:"",at:""};
  if(pr.lieu && !p.lieuHint && S.lieu.v==="s") S.lieu={v:"v",x:"",h:"",at:""};
  if(p.steps){ S.mode="prog"; S.steps=p.steps.map(st=>({h:st.h, a:"", l:"", v:"s", hint:st.hint, at:""})); }
  if(p.act && !S.act.x) S.act={v:"v",x:p.act,h:"",at:""};
  if(p.lieuHint && !S.lieu.x) S.lieu={v:"s",x:"",h:p.lieuHint,at:""};
  S.preset={prog:!!p.steps, act:p.act||"", lieu:!!p.lieuHint};
}

const SITE_TITLE = document.title;
function topHTML(onHistory){
  const n = onHistory ? 0 : loadHistory().length;
  return `<header class="top">
      ${logoHTML(seasonToday(), S.anim!=="0")}
      <div class="top-actions">
        <button type="button" class="snd-inline" id="snd" aria-pressed="${Sound.on}" aria-label="${Sound.on?"Couper le son":"Activer le son"}">${Sound.on?"🔊":"🔇"}</button>
        ${onHistory ? "" : `<a class="hist-btn" href="#mes-invitations">Mes invitations<span class="badge ${n?"":"hidden"}" id="histBadge">${n}</span></a>`}
        <span id="installSlot"><small>Gratuit, sans compte</small></span>
      </div>
    </header>`;
}

function renderCreator(){
  // Accueil et choix du modèle : toujours le thème de base (un modèle choisi puis quitté par « Retour » n'y laisse pas ses couleurs)
  const neutre = S.step==="home" || S.step===1;
  setTheme(neutre ? "base" : S.theme, S.anim, neutre ? "" : S.ac, S.step==="home" ? "home" : S.step===4 ? true : "dim"); // accueil : sa scène ; aperçu : la scène entière ; saisie : atténuée
  document.title = SITE_TITLE;
  const n=S.step;
  $("#app").innerHTML = `
  <div class="wrap">
    ${topHTML(false)}
    ${n==="home" ? homeHTML() : `
    <form class="panel" id="form" novalidate>
      ${n===1 ? `<button type="button" class="back-top" id="back">Retour</button>` : ""}
      <div class="progress" aria-hidden="true">${STEP_TITLES.map((_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}</div>
      <p class="stepnum">Étape ${n} sur ${STEP_TITLES.length} · ${STEP_TITLES[n-1]}</p>
      ${screenHTML()}
      <p class="error ${S.err && !S.errSec ? "" : "hidden"}" id="err" role="alert">${esc(S.errSec ? "" : S.err)}</p>
      ${n===1 ? "" : `<div class="nav">
        <button type="button" class="btn ghost" id="back">Retour</button>
        ${n===2||n===3 ? `<button type="submit" class="btn primary">${n===3 ? "Voir l'aperçu" : "Continuer"}</button>` : ""}
      </div>`}
    </form>`}
    ${n==="home" ? "" : `<p class="foot">Rien n'est stocké en clair en ligne : l'invitation tient dans son lien, chiffrée si le lien est court. <a href="mentions-legales.html#confidentialite">Confidentialité</a><br><a href="mentions-legales.html">Mentions légales</a></p>`}
  </div>
  ${n==="home" ? footerHTML({logo:logoHTML(seasonToday(), false), installer:!isStandalone()}) : ""}`;
  S.err=""; S.errSec="";
  bindCreator();
  bindSound(true);
  refreshInstall();
}

/* ---------- Accueil ---------- */
function homeHTML(){
  return `<section class="hero">
      <h1 tabindex="-1"><span>Tu as quelque chose à demander ?</span><span>Fais-le autrement.</span></h1>
      <p>Une invitation animée à envoyer par message. On te répond en un clic, et le Non résiste… un peu.</p>
    </section>
    <div class="ticket demo-ticket" role="group" aria-label="Essaie : un exemple d'invitation">
      <div class="stub"><div>De<b>toi</b></div><div style="text-align:right">Pour<b>qui tu veux</b></div></div>
      <div class="perf" aria-hidden="true"></div>
      <div class="main demo-main">
        <p class="question">Tu viens ?</p>
        <div class="answer demo-answer" id="demoAnswer">
          <button type="button" class="yes" id="demoYes" aria-label="Oui : créer mon invitation">Oui</button>
          <button type="button" class="no" id="demoNo">Non</button>
        </div>
        <p class="tease" id="demoTease" aria-live="polite">Essaie de dire non… puis dis oui pour créer la tienne.</p>
      </div>
    </div>
    ${seasonBannerHTML()}
    <div class="home-cards" id="choisir">${HOME_CATS.map(c=>`<button type="button" class="home-card" data-home="${c.cat}">${sceneMini(c.theme)}
      <span class="hc-txt"><b><span class="ico" aria-hidden="true">${c.ico}</span>${c.cat}</b><span>${esc(catDesc(c.cat))}</span></span></button>`).join("")}</div>
    <div class="home-actions">
      <a class="btn" href="#exemple">Voir un exemple</a>
      <button type="button" class="linkbtn" id="fromScratch">Partir de zéro →</button>
    </div>`;
}

/* Bandeau de saison : l'occasion ouverte dont le jour J à venir est le plus proche (sinon la dernière passée),
   seulement si son modèle existe. Bouton secondaire : le Oui du mini-billet reste la seule action principale. */
function seasonPick(){
  const today=seasonToday(), open=TEMPLATES.map(t=>({t, w:seasonAt(t.occ, today)})).filter(x=>x.w);
  return open.sort((a,b)=>seasonOrder(a.w.day, b.w.day, today) || TEMPLATES.indexOf(a.t)-TEMPLATES.indexOf(b.t))[0] || null;
}
function seasonBannerHTML(){
  const p=seasonPick(); if(!p) return "";
  const s=SEASONS[p.t.occ], today=seasonToday(), i = today<p.w.day ? 0 : today===p.w.day ? 1 : 2;
  return `<section class="season" aria-labelledby="seasonT">${sceneMini(p.t.theme)}
      <div class="season-body"><p class="season-t" id="seasonT">${esc(s.ban[i])} <span aria-hidden="true">${s.em}</span></p>
      <button type="button" class="btn" data-season="${p.t.id}" aria-label="Créer mon invitation : ${esc(p.t.label)}">Créer mon invitation</button></div>
    </section>`;
}

/* ---------- Les 4 écrans ---------- */
function screenHTML(){
  switch(S.step){
  case 1: {
    const cats=HOME_CATS.map(c=>c.cat); // une catégorie toujours ouverte (Amour par défaut) ; « Partir de zéro » dans chacune
    if(!cats.includes(S.tplCat)) S.tplCat="Amour";
    const list=catTemplates(S.tplCat, S.tpl);
    return `
    <h2 tabindex="-1">Choisis un modèle</h2>
    <p class="lead">Il règle l'occasion, les couleurs, la question et le message. Tu pourras tout changer.</p>
    <div class="chips" role="group" aria-label="Catégorie" style="margin-bottom:16px">${cats.map(c=>`<button type="button" class="chip" data-cat="${c}" aria-pressed="${S.tplCat===c}">${c}</button>`).join("")}</div>
    <div class="tpls">${list.map(t=>`<button type="button" class="tpl" data-tpl="${t.id}" aria-pressed="${S.tpl===t.id}">${sceneMini(t.theme)}
        <span class="tpl-row"><span class="ico" aria-hidden="true">${t.em}</span>
        <span>${SEASONS[t.occ] ? `<span class="tpl-tag">De saison</span>` : ""}<b>${esc(t.label)}</b><span class="tq">« ${esc(t.q)} »</span><small>${esc(themeName(t.theme))} · ${esc(noLabel(t.no))}</small></span></span></button>`).join("")}
      <button type="button" class="tpl" data-tpl="zero" aria-pressed="${S.tpl==="zero"}">${sceneMini("base")}
        <span class="tpl-row"><span class="ico" aria-hidden="true">✏️</span>
        <span><b>Partir de zéro</b><small>Tu choisis tout toi-même</small></span></span></button>
    </div>`;
  }
  case 2: return `
    <h2 tabindex="-1">Qui invite qui ?</h2>
    <p class="lead">Un prénom ou un surnom, celui que vous utilisez entre vous.</p>
    <div class="row2">
      <label class="field"><span>Son prénom</span><input class="input" id="to" maxlength="30" placeholder="Ex. Loulou" value="${esc(S.to)}" autocomplete="off"></label>
      <label class="field"><span>Ton prénom</span><input class="input" id="from" maxlength="30" placeholder="Ex. Keke" value="${esc(S.from)}" autocomplete="off"></label>
    </div>`;
  case 3: return `
    <h2 tabindex="-1">Quand et où ?</h2>
    <p class="lead">${S.mode==="prog" ? "Le jour et l'heure de début." : "Le jour, l'heure et ce qui est prévu."}</p>
    ${whenHTML()}
    ${S.mode==="prog"
      ? advNote(`Un programme en ${S.steps.length} étape${S.steps.length>1?"s":""} est prévu.`, "plan")
      : visBlock("act","Ce qui est prévu","Ex. Dîner au restaurant, cinéma…",S.act,false) + visBlock("lieu","Le lieu","Ex. Le Petit Bistrot, 12 rue de Charonne, Paris",S.lieu,false)}
    <p class="hint">Programme en étapes, révélation programmée ou détails : dans « Personnaliser davantage », à l'étape suivante.</p>`;
  case 4: return `
    <h2 tabindex="-1">Voilà ce que ${esc(S.to)} va recevoir</h2>
    <p class="lead">Vérifie, teste, puis crée ton lien.</p>
    ${previewHTML()}
    <ul class="recap edit">
      ${recapRow("De / pour", `${esc(S.from)} → ${esc(S.to)}`, 'data-edit="2"')}
      ${recapRow("Quand", whenRecap(), 'data-edit="3"')}
      ${S.mode==="one"
        ? recapRow("Prévu", itemRecap(S.act), S.act.v==="r" ? 'data-goto="plan"' : 'data-edit="3"')
          + recapRow("Lieu", S.lieu.v==="v"&&!S.lieu.x ? "<em>Non précisé</em>" : itemRecap(S.lieu), S.lieu.v==="r" ? 'data-goto="plan"' : 'data-edit="3"')
        : recapRow("Programme", recapPlan(), 'data-goto="plan"')}
      ${recapRow("Occasion", esc(occLabel()), 'data-goto="occ"')}
      ${recapRow("Question", esc(S.q), 'data-goto="words"')}
      ${recapRow("Message", S.msg ? esc(S.msg)+(S.hidden?" <em>(caché jusqu'au Oui)</em>":"") : "<em>Aucun</em>", 'data-goto="words"')}
      ${INTRO_OCC[S.occ] ? recapRow("Introduction", introCode() ? introRecap(introCode()) : "<em>Aucune</em>", 'data-goto="words"') : ""}
      ${recapRow("Style", styleRecap(), 'data-goto="style"')}
      ${recapRow("Le Non", esc(NO_MODES.find(m=>m.id===S.no).t)+" · ton "+esc(noTone(S.tone).t.toLowerCase()), 'data-goto="no"')}
      ${recapRow("Réponse via", esc(CHANNELS.find(c=>c.id===S.ch).t)+(S.chId?" ("+esc(S.chId)+")":""), 'data-goto="reply"')}
      ${recapRow("Partage", S.share ? "Autorisé, sans le lieu ni les surprises" : "<em>Non autorisé</em>", 'data-goto="reply"')}
    </ul>
    <details class="more" id="more" ${S.moreOpen?"open":""}>
      <summary>Personnaliser davantage</summary>
      ${section("occ","L'occasion",secOcc())}
      ${section("words","Les mots",secWords())}
      ${section("style","Le style",secStyle())}
      ${section("plan","Le programme",secPlan())}
      ${section("no","Le Non",secNo())}
      ${section("reply","La réponse",secReply())}
    </details>
    ${notifHTML()}
    <div class="btns" style="margin-top:18px">
      <button type="button" class="btn" id="preview">Tester l'invitation</button>
      <button type="button" class="btn primary ${S.link?"hidden":""}" id="make">Créer mon lien</button>
    </div>
    ${readyHTML()}`;
  }
}
/* Notifications de réponse : case décochée par défaut (une demande d'autorisation non sollicitée est souvent refusée,
   et un refus bloque le site durablement), mais déjà cochée si l'autorisation a été accordée auparavant */
function notifHTML(){
  const st=notifSupport();
  if(S.notif===undefined) S.notif = st==="ok" && Notification.permission==="granted";
  const to=esc(S.to||"la personne invitée");
  const note = st==="ios" ? "Sur iPhone, ajoute d'abord Ose Demander à ton écran d'accueil (bouton Partager, puis « Sur l'écran d'accueil »), puis crée ton invitation depuis l'appli."
    : st==="refuse" ? "Les notifications sont bloquées pour ce site. Autorise-les dans les réglages de ton navigateur pour utiliser cette option."
    : st==="non" ? "Ce navigateur ne permet pas les notifications : la réponse t'arrivera par message, comme d'habitude."
    : Notification.permission==="granted" ? `Une seule notification, si ${to} choisit de te prévenir : sa réponse et le créneau, rien d'autre.`
    : `Ton navigateur te demandera l'autorisation. Une seule notification, si ${to} choisit de te prévenir : sa réponse et le créneau, rien d'autre.`;
  return `<div class="notif-opt ${S.link?"hidden":""}">
      <label class="check"><input type="checkbox" id="notifMe" ${st==="ok"&&S.notif?"checked":""} ${st==="ok"?"":"disabled"}><span>🔔 Me prévenir dès que ${to} répond</span></label>
      <p class="hint" id="notifNote">${note}</p>
    </div>`;
}
const whenList = () => S.choose ? S.slots.filter(s=>s.d&&s.t).map(s=>[s.d,s.t]) : [[S.date,S.time]];
/* Le lien est prêt : une seule action principale (Partager si le téléphone le permet, sinon Copier),
   le message qui part avec le lien, et l'adresse repliée sur une ligne (elle est longue et intimidante) */
const shareText = () => `${S.to}, j'ai une question pour toi 💌`;
function readyHTML(){
  const share=!!navigator.share;
  return `<div id="result" class="ready ${S.link?"":"hidden"}">
      <h3 class="ready-title" tabindex="-1">Ton lien est prêt 💌</h3>
      <p class="ready-lead">${share
        ? `Envoie-le à ${esc(S.to)} : il partira avec le message « ${esc(shareText())} ».`
        : `Copie-le, puis colle-le dans ta conversation avec ${esc(S.to)}.`}</p>
      <div class="ready-btns">
        ${share ? `<button type="button" class="btn primary" id="share">Partager le lien</button>
        <button type="button" class="btn" id="copy">Copier le lien</button>`
        : `<button type="button" class="btn primary" id="copy">Copier le lien</button>`}
        <button type="button" class="btn" id="imgOpen">Partager en image</button>
      </div>
      <div class="linkbox one" id="linkbox">${esc(S.link)}</div>
      <button type="button" class="linkbtn" id="showLink" aria-expanded="false" aria-controls="linkbox">Afficher le lien en entier</button>
      <p class="hint" id="shortNote"></p>
      <p class="hint" id="notifDone"></p>
      <p class="hint" id="savedNote"></p>
      <p class="hint">Toute personne qui a ce lien peut lire l'invitation : ne le partage qu'avec la bonne personne.</p>
    </div>`;
}
const themeName = id => (THEMES.find(t=>t.id===id)||THEMES[0]).name;
const noLabel = id => "le Non "+NO_MODES.find(m=>m.id===id).t.replace(/^Il /,"");
function advNote(text, sec){ return `<div class="adv"><span>${esc(text)}</span><button type="button" class="linkbtn" data-goto="${sec}">Modifier</button></div>`; }
function recapRow(label, value, attr){
  return `<li><div><b>${label}</b><span>${value}</span></div><button type="button" class="linkbtn" ${attr} aria-label="Modifier : ${label}">Modifier</button></li>`;
}
function section(key, title, body){
  return `<details class="sec" data-sec="${key}" ${S.open.has(key)?"open":""}><summary>${title}</summary>
    <div class="sec-body">${S.errSec===key ? `<p class="error" role="alert">${esc(S.err)}</p>` : ""}${body}</div></details>`;
}

/* ---------- Aperçu (statique, mis à jour pendant la saisie) ---------- */
function previewHTML(){
  const occ=occLabel(), initial=(S.from||"?").trim().charAt(0).toUpperCase();
  return `<div class="preview" aria-label="Aperçu de l'invitation">
    <p class="pv-env">${sealHTML(S.occ, S.em, initial)}Sur l'enveloppe</p>
    <div class="pv-stage">${sceneWallCopy(S.theme)}${sceneSignHTML(S.theme, REDUCED ? "0" : S.anim)}
    <div class="ticket">
      <div class="stub"><div>De<b>${esc(S.from)}</b></div><div style="text-align:right">Pour<b>${esc(S.to)}</b></div></div>
      <div class="perf" aria-hidden="true"></div>
      <div class="main">
        ${occ?`<p class="occ">${esc(occ)}</p>`:""}
        <p class="question" id="pvQ">${esc(S.q)}</p>
        <p class="handnote" id="pvMsg" ${S.msg&&!S.hidden?"":"hidden"}>${esc(S.msg)}</p>
        <p class="hint" id="pvHidden" ${S.msg&&S.hidden?"":"hidden"}>🔒 Message caché jusqu'au Oui</p>
        <div class="answer" aria-hidden="true"><span class="yes">Oui</span><span class="no">Non</span></div>
        <p class="sign" id="pvSign" ${S.sg?"":"hidden"}>${esc(S.sg)}</p>
      </div>
    </div>
    </div>
  </div>`;
}
function whenRecap(){
  return S.choose ? S.slots.filter(s=>s.d&&s.t).map(s=>esc(frDate(s.d)+" à "+frTime(s.t))).join("<br>")+"<br><em>Au choix</em>"
    : esc(frDate(S.date)+" à "+frTime(S.time));
}
function styleRecap(){
  const a=ACCENTS.find(x=>x.id===S.ac);
  return [themeName(S.theme), a ? "accent "+a.name : "", "enveloppe "+(S.em||"avec l'initiale"),
    S.sg ? "signé « "+S.sg+" »" : "", {n:"",d:"animations discrètes","0":"sans animation"}[S.anim], S.snd ? "" : "sans son"].filter(Boolean).map(esc).join(" · ");
}

/* ---------- Sections de « Personnaliser davantage » ---------- */
function dateTimeHTML(){
  return `<label class="field"><span>Date</span><input class="input" type="date" id="date" min="${todayISO()}" value="${esc(S.date)}"></label>
    <div class="field"><span>Heure</span>
      <div class="chips">${HOURS.map(h=>`<button type="button" class="chip" data-hour="${h}" aria-pressed="${S.time===h}">${frTime(h)}</button>`).join("")}</div>
    </div>
    <label class="field"><span>Ou une heure précise</span><input class="input" type="time" id="time" value="${esc(S.time)}" style="max-width:180px"></label>`;
}
/* Écran « Quand et où » : une date et une heure, ou 2 à 3 créneaux au choix */
function whenHTML(){
  return `<label class="check"><input type="checkbox" id="choose" ${S.choose?"checked":""}><span>Lui laisser choisir parmi plusieurs créneaux</span></label>
    ${!S.choose ? dateTimeHTML() : `
      <p class="hint" style="margin:0 0 12px">Propose 2 ou 3 créneaux : le choix se fera après le Oui.</p>
      ${S.slots.map((sl,i)=>`<div class="slot-box" data-slot="${i}">
        <header>Créneau ${i+1}${i>=2 ? `<button type="button" class="linkbtn" data-delslot="${i}">Retirer</button>` : ""}</header>
        <div class="row2">
          <label class="field"><span>Date</span><input class="input" type="date" data-sl="d" min="${todayISO()}" value="${esc(sl.d)}"></label>
          <label class="field"><span>Heure</span><input class="input" type="time" data-sl="t" value="${esc(sl.t)}"></label>
        </div>
      </div>`).join("")}
      ${S.slots.length<3 ? `<button type="button" class="btn" id="addSlot" style="width:100%;margin-bottom:16px">Ajouter un 3ᵉ créneau</button>` : ""}`}`;
}
function visBlock(key, label, ph, it, reveal=true){
  if(!reveal && it.v==="r")
    return advNote(`${label} : révélé le ${(it.at||"").replace("T"," à ")}.`, "plan");
  return `<div class="vis-box" data-vis="${key}">
    <div class="field"><span>${label}</span>
      <div class="seg" role="group" aria-label="Visibilité : ${label}">
        <button type="button" data-v="v" aria-pressed="${it.v==="v"}">Visible</button>
        <button type="button" data-v="s" aria-pressed="${it.v==="s"}">Surprise</button>
        ${reveal ? `<button type="button" data-v="r" aria-pressed="${it.v==="r"}">Révélé plus tard</button>` : ""}
      </div>
      <p class="vis-note">${it.v==="v" ? "Affiché dès le Oui." : it.v==="s" ? "Jamais affiché ni inclus dans le lien. Tu peux donner un indice." : "Caché, puis révélé automatiquement à l'heure que tu choisis."}</p>
      ${it.v==="r" ? `<p class="vis-note">Le contenu est dans le lien, caché pour qu'on ne le voie pas par accident. Pour un secret absolu, choisis « Surprise » : rien n'est alors dans le lien.</p>` : ""}
    </div>
    ${it.v!=="s" ? `<label class="field"><span class="sr">${label}</span><input class="input" data-k="x" maxlength="120" placeholder="${ph}" value="${esc(it.x)}"></label>` : ""}
    ${it.v!=="v" ? `<label class="field"><span>Indice <em>(facultatif)</em></span><input class="input" data-k="h" maxlength="100" placeholder="Ex. Prévois des baskets" value="${esc(it.h)}"></label>` : ""}
    ${it.v==="r" ? `<label class="field"><span>Révéler le</span><input class="input" type="datetime-local" data-k="at" value="${esc(it.at)}"></label>` : ""}
  </div>`;
}
function secPlan(){
  return `<div class="seg" role="group" aria-label="Type de plan">
      <button type="button" data-mode="one" aria-pressed="${S.mode==="one"}">Une activité</button>
      <button type="button" data-mode="prog" aria-pressed="${S.mode==="prog"}">Un programme (plusieurs étapes)</button>
    </div>
    ${S.mode==="one" ? `
      ${visBlock("act","Ce qui est prévu","Ex. Escape game, dîner, cinéma…",S.act)}
      ${visBlock("lieu","Le lieu","Ex. Le Petit Bistrot, 12 rue de Charonne, Paris",S.lieu)}
      <label class="field"><span>Détails <em>(facultatif)</em></span><textarea class="input" id="details" maxlength="200" placeholder="Ex. Tenue chic, je réserve la table">${esc(S.details)}</textarea></label>
    ` : `
      ${S.steps.map((st,i)=>`
      <div class="prog-step" data-step="${i}">
        <header>Étape ${i+1}${S.steps.length>1?`<button type="button" class="linkbtn" data-del="${i}">Retirer</button>`:""}</header>
        <div class="row2">
          <label class="field"><span>Vers quelle heure</span><input class="input" data-s="h" maxlength="20" placeholder="Ex. 11 h, midi" value="${esc(st.h)}"></label>
          <div class="field"><span>Visibilité</span>
            <div class="seg" role="group" aria-label="Visibilité de l'étape ${i+1}">
              <button type="button" data-sv="v" aria-pressed="${st.v==="v"}">Visible</button>
              <button type="button" data-sv="s" aria-pressed="${st.v==="s"}">Surprise</button>
              <button type="button" data-sv="r" aria-pressed="${st.v==="r"}">Plus tard</button>
            </div></div>
        </div>
        ${st.v!=="s" ? `<label class="field"><span>Activité</span><input class="input" data-s="a" maxlength="80" placeholder="Ex. Brunch" value="${esc(st.a)}"></label>
        <label class="field"><span>Lieu <em>(facultatif)</em></span><input class="input" data-s="l" maxlength="120" placeholder="Ex. Café Oberkampf, Paris" value="${esc(st.l)}"></label>` : ""}
        ${st.v!=="v" ? `<label class="field"><span>Indice <em>(facultatif)</em></span><input class="input" data-s="hint" maxlength="100" placeholder="Ex. Prépare ton cerveau" value="${esc(st.hint)}"></label>` : ""}
        ${st.v==="r" ? `<label class="field"><span>Révéler le</span><input class="input" type="datetime-local" data-s="at" value="${esc(st.at)}"></label>
        <p class="vis-note">Le contenu est dans le lien, caché pour qu'on ne le voie pas par accident. Pour un secret absolu, choisis « Surprise » : rien n'est alors dans le lien.</p>` : ""}
      </div>`).join("")}
      ${S.steps.length<6 ? `<button type="button" class="btn" id="addStep" style="width:100%;margin-bottom:18px">Ajouter une étape</button>` : `<p class="hint">6 étapes maximum, pour que le lien reste partageable.</p>`}
      <p class="group-title">Infos pour la journée <em style="font-weight:400;color:var(--muted)">(facultatif)</em></p>
      <div class="row2">
        <label class="field"><span>Fin vers</span><input class="input" type="time" id="end" value="${esc(S.end)}"></label>
        <label class="field"><span>Point de départ</span><input class="input" id="meet" maxlength="100" placeholder="Ex. Je passe te chercher" value="${esc(S.meet)}"></label>
      </div>
      <label class="field"><span>À prévoir</span><input class="input" id="bring" maxlength="100" placeholder="Ex. Tenue confortable, maillot de bain" value="${esc(S.bring)}"></label>
    `}`;
}
function secOcc(){
  return `${OCCASIONS.map(g=>`<p class="group-title">${g.cat}</p><div class="chips">${g.items.filter(o=>!o.hide && ((!o.old && seasonOpen(o.id))||S.occ===o.id)).map(o=>`<button type="button" class="chip" data-occ="${o.id}" aria-pressed="${S.occ===o.id}">${o.label}</button>`).join("")}</div>`).join("")}
    ${S.occ==="libre" ? `<label class="field" style="margin-top:14px"><span>Laquelle ?</span><input class="input" id="occFree" maxlength="40" placeholder="Ex. Ma pendaison de crémaillère" value="${esc(S.occFree)}"></label>` : ""}`;
}
function secWords(){
  const o=OCC[S.occ]; const cat=o?o.cat:"Autre";
  if(!S.qEdited) S.q = o ? o.q : "Tu dis oui ?";
  return `<label class="field"><span>La question</span><input class="input" id="q" maxlength="80" value="${esc(S.q)}"></label>
    <label class="field"><span>Ton message <em>(facultatif)</em></span><textarea class="input" id="msg" maxlength="300" placeholder="Écris un petit mot…">${esc(S.msg)}</textarea><div class="counter" id="cnt">${S.msg.length} / 300</div></label>
    <p class="group-title">Besoin d'inspiration ?</p>
    <div class="chips" style="margin-bottom:16px">${MSG_SUGG[cat].map((m,i)=>`<button type="button" class="chip" data-sugg="${i}">${esc(m)}</button>`).join("")}</div>
    <label class="check"><input type="checkbox" id="hidden" ${S.hidden?"checked":""}><span>Garder le message caché jusqu'au Oui</span></label>
    ${INTRO_OCC[S.occ] ? `<p class="group-title">Introduction</p>
    <label class="check"><input type="checkbox" id="intro" ${S.intro?"checked":""}><span>Montrer deux cartes avant la question</span></label>
    <p class="hint">${introRecap(INTRO_OCC[S.occ])}. Elles peuvent toujours être passées.</p>` : ""}`;
}
/* Introduction choisie : le code de l'occasion si elle est activée, sinon 0 (directement la question) */
const introCode = () => (S.intro && INTRO_OCC[S.occ]) || 0;
const introRecap = c => LINK_INTRO[c].map(t=>`« ${esc(t.replace("{pour}", S.to||"…"))} »`).join(" puis ");
function secStyle(){
  const th=THEMES.find(t=>t.id===S.theme)||THEMES[0], initial=(S.from||"?").trim().charAt(0).toUpperCase();
  return `<p class="group-title">Thème</p>
    <div class="swatches">${THEMES.filter(t=>!t.season||seasonOpen(t.season)||S.theme===t.id).map(t=>`<button type="button" class="swatch" data-th="${t.id}" aria-pressed="${S.theme===t.id}" title="${t.name}" aria-label="Thème ${t.name}" style="background:linear-gradient(135deg,${t.c} 55%,${t.a} 55%)"></button>`).join("")}</div>
    <p class="group-title">Couleur d'accent</p>
    <div class="swatches">
      <button type="button" class="swatch acc" data-ac="" aria-pressed="${!S.ac}" title="Celle du thème" aria-label="Couleur du thème" style="background:${th.a}"></button>
      ${ACCENTS.map(a=>{ const ok=accentOk(S.theme,a.id);
        return `<button type="button" class="swatch acc" data-ac="${a.id}" aria-pressed="${S.ac===a.id}" title="${a.name}${ok?"":" : peu lisible avec ce thème"}" aria-label="Accent ${a.name}" style="background:${a.c}" ${ok?"":"disabled"}></button>`; }).join("")}
    </div>
    <p class="hint">Les couleurs grisées seraient peu lisibles avec ce thème.</p>
    <p class="group-title">Sur l'enveloppe</p>
    <div class="chips">
      <button type="button" class="chip" data-em="" aria-pressed="${!S.em}">L'initiale (${esc(initial)})</button>
      ${EMOJIS.filter(e=>emojiOpen(e)||S.em===e).map(e=>`<button type="button" class="chip emo" data-em="${e}" aria-pressed="${S.em===e}" aria-label="Emoji ${e}">${e}</button>`).join("")}
    </div>
    <label class="field" style="margin-top:16px"><span>Signature manuscrite <em>(facultatif)</em></span><input class="input" id="sg" maxlength="30" placeholder="Ex. Ton Keke" value="${esc(S.sg)}"></label>
    <p class="group-title">Animations</p>
    <div class="seg" role="group" aria-label="Animations">
      <button type="button" data-anim="n" aria-pressed="${S.anim==="n"}">Normales</button>
      <button type="button" data-anim="d" aria-pressed="${S.anim==="d"}">Discrètes</button>
      <button type="button" data-anim="0" aria-pressed="${S.anim==="0"}">Aucune</button>
    </div>
    <p class="hint">Le décor bouge en fond, et explose au moment du Oui. Choisis « Aucune » pour une invitation sobre.</p>
    <label class="check" style="margin-top:14px"><input type="checkbox" id="sndInv" ${S.snd?"checked":""}><span>Sons dans l'invitation <em style="color:var(--muted)">(sons brefs à l'ouverture, au Non et au Oui ; la personne invitée peut toujours les couper)</em></span></label>`;
}
function secNo(){
  const t=noTone(S.tone);
  const ex = S.no==="supplie" ? t.beg.slice(0,3) : S.no==="transforme" ? [t.turn] : S.no==="retrecit" ? [t.lines[0], t.small] : t.lines.slice(0,3);
  return `<div class="cards">${NO_MODES.map(m=>`<button type="button" class="optcard" data-no="${m.id}" aria-pressed="${S.no===m.id}"><b>${m.t}</b><span>${m.d}</span></button>`).join("")}</div>
    <p class="group-title">Le ton des messages</p>
    <div class="chips" role="group" aria-label="Ton des messages">${NO_TONES.map(x=>`<button type="button" class="chip" data-tone="${x.id}" aria-pressed="${S.tone===x.id}">${x.t}</button>`).join("")}</div>
    <p class="hint">Par exemple : ${ex.map(e=>`« ${esc(e)} »`).join(" · ")}</p>
    <p class="hint">Quel que soit le mode, un lien discret permet toujours de répondre non pour de vrai.</p>`;
}
function secReply(){
  const ch=CHANNELS.find(c=>c.id===S.ch), tel=S.ch==="wa"||S.ch==="sms";
  return `<div class="field"><span>Comment veux-tu recevoir la réponse ?</span>
      <div class="chips">${CHANNELS.map(c=>`<button type="button" class="chip" data-ch="${c.id}" aria-pressed="${S.ch===c.id}">${c.t}</button>`).join("")}</div>
      <p class="hint">${S.ch==="any" ? "L'appli sera choisie au moment de répondre." : tel ? "Le message s'ouvrira déjà écrit, il n'y aura plus qu'à l'envoyer." : "Cette appli ne permet pas de pré-écrire le message : la réponse sera copiée, il suffira de la coller."}</p>
    </div>
    ${ch.need ? `<label class="field"><span>${tel?"Ton numéro":"Ton nom d'utilisateur"}</span><input class="input" id="chId" maxlength="40" placeholder="${ch.ph}" value="${esc(S.chId)}" ${tel?'inputmode="tel"':''}></label>
    <p class="hint">Il sera inclus dans le lien, visible seulement par les personnes qui l'ont.</p>` : ""}
    <p class="group-title">Après le Oui</p>
    <label class="check"><input type="checkbox" id="allowShare" ${S.share?"checked":""}><span>Autoriser le partage de la surprise</span></label>
    <p class="hint">${esc(S.to||"La personne invitée")} pourra montrer l'invitation à ses proches : une version en lecture seule, sans le lieu, les surprises, le message caché ni tes coordonnées.</p>`;
}
function occLabel(){ if(S.occ==="libre") return S.occFree || "Autre"; return OCC[S.occ]?.label || ""; }
function itemRecap(it){ return it.v==="s" ? "Surprise"+(it.h?` (indice : ${esc(it.h)})`:"") : it.v==="r" ? `${esc(it.x)} <em>(révélé le ${esc(it.at.replace("T"," à "))})</em>` : esc(it.x); }
function recapPlan(){
  return S.steps.map(st=>`${esc(st.h||"?")} : ${st.v==="s"?"Surprise":esc(st.a)}${st.v==="r"?" <em>(révélé plus tard)</em>":""}`).join("<br>");
}

/* ---------- Lecture et vérification ---------- */
/* Lit tous les champs présents à l'écran (quel que soit l'écran) */
function readAll(){
  const v=id=>{ const e=$("#"+id); return e ? e.value.trim() : undefined; };
  if($("#to")){ S.to=v("to"); S.from=v("from"); }
  if($("#occFree")) S.occFree=v("occFree");
  ["act","lieu"].forEach(k=>{ const box=$(`[data-vis="${k}"]`); if(box) $$("[data-k]",box).forEach(inp=>S[k][inp.dataset.k]=inp.value.trim()); });
  if($("#details")) S.details=v("details");
  $$(".prog-step").forEach(box=>{ const st=S.steps[+box.dataset.step]; $$("[data-s]",box).forEach(inp=>st[inp.dataset.s]=inp.value.trim()); });
  if($("#end")){ S.end=v("end"); S.meet=v("meet"); S.bring=v("bring"); }
  if($("#date")){ S.date=v("date"); const t=v("time"); if(t) S.time=t; }
  $$("[data-slot]").forEach(r=>{ const sl=S.slots[+r.dataset.slot]; $$("[data-sl]",r).forEach(i=>sl[i.dataset.sl]=i.value); });
  if($("#q")){ const q=v("q"); if(q!==S.q){ S.q=q; S.qEdited=true; } }
  if($("#msg")) S.msg=$("#msg").value.trim();
  if($("#hidden")) S.hidden=$("#hidden").checked;
  if($("#allowShare")) S.share=$("#allowShare").checked; // (pas « share » : c'est l'identifiant du bouton « Partager le lien »)
  if($("#chId")) S.chId=v("chId");
  if($("#sg")) S.sg=v("sg");
  if($("#sndInv")) S.snd=$("#sndInv").checked;
  if($("#intro")) S.intro=$("#intro").checked;
}
/* Chaque vérification indique où corriger : un écran (nombre) ou une section de « Personnaliser davantage » */
const CHECKS = {
  who(){ if(!S.to||!S.from) return {m:"Indique vos deux prénoms (ou surnoms).", go:2}; },
  occ(){ if(!S.occ) return {m:"Choisis une occasion.", go:"occ"}; },
  when(){
    const go=3;
    if(!S.choose){ if(!S.date) return {m:"Choisis une date.",go}; if(S.date<todayISO()) return {m:"Cette date est déjà passée.",go}; if(!S.time) return {m:"Choisis une heure.",go}; }
    else {
      const half=S.slots.findIndex(s=>!!s.d!==!!s.t);
      if(half>=0) return {m:`Le créneau ${half+1} est incomplet : indique la date et l'heure${half>=2?", ou retire-le":""}.`,go};
      const ok=S.slots.filter(s=>s.d&&s.t);
      if(ok.length<2) return {m:"Propose au moins deux créneaux complets (date et heure).",go};
      if(ok.some(s=>s.d<todayISO())) return {m:"Un des créneaux est déjà passé.",go};
      if(new Set(ok.map(s=>s.d+" "+s.t)).size<ok.length) return {m:"Deux créneaux sont identiques.",go};
    }
  },
  plan(){
    const now=new Date(), futureOk=at=>at && new Date(at)>now;
    if(S.mode==="one"){
      if(S.act.v!=="s" && !S.act.x) return {m:"Décris ce qui est prévu, ou choisis « Surprise ».", go:S.act.v==="r"?"plan":3};
      for(const [k,n] of [["act","ce qui est prévu"],["lieu","le lieu"]]){ const it=S[k];
        if(it.v==="r" && !it.x) return {m:`Indique ${n} à révéler.`, go:"plan"};
        if(it.v==="r" && !futureOk(it.at)) return {m:`Choisis une date de révélation à venir pour ${n}.`, go:"plan"}; }
    } else {
      for(const [i,st] of S.steps.entries()){
        if(st.v!=="s" && !st.a) return {m:`Indique l'activité de l'étape ${i+1}, ou choisis « Surprise ».`, go:"plan"};
        if(st.v==="r" && !futureOk(st.at)) return {m:`Choisis une date de révélation à venir pour l'étape ${i+1}.`, go:"plan"};
      }
    }
  },
  words(){ if(!S.q) return {m:"Écris la question à poser.", go:"words"}; },
  reply(){ if(CHANNELS.find(c=>c.id===S.ch).need && !S.chId) return {m:"Indique où recevoir la réponse.", go:"reply"}; }
};
function checkScreen(n){
  const keys = n===2 ? ["who"] : n===3 ? ["when","plan"] : ["who","occ","when","plan","words","reply"];
  for(const k of keys){ const e=CHECKS[k](); if(e) return e; }
  return null;
}
function showErr(e){
  if(e.go===S.step){ const el=$("#err"); el.textContent=e.m; el.classList.remove("hidden"); el.scrollIntoView({block:"center"}); return; }
  S.err=e.m;
  if(typeof e.go==="number") go(e.go);
  else { S.errSec=e.go; openSection(e.go); }
}
function go(step){ S.step=step; S.link=""; renderCreator(); window.scrollTo({top:0}); focusScreen(step==="home" ? ".hero h1" : ".panel h2"); Sound.step(); }
function openSection(key){
  S.step=4; S.moreOpen=true; S.open.add(key); renderCreator();
  $(`details[data-sec="${key}"]`)?.scrollIntoView({block:"start"});
}

/* Accueil : le mini-billet vivant. Le Non s'esquive dans le billet (ton taquin), le Oui lance la création.
   Animations coupées (réglage ou « moins de mouvement ») : le Non ne bouge pas, seule la phrase change. */
function bindDemoTicket(){
  const yes=$("#demoYes"), no=$("#demoNo"), box=$("#demoAnswer"), tease=$("#demoTease");
  if(!yes) return;
  const still=()=>REDUCED || S.anim==="0", lines=noTone("taquin").lines;
  let n=0, last=0;
  const dodge=e=>{
    if(e) e.preventDefault();
    const now=Date.now(); if(now-last<250) return; last=now; // un seul effet par geste
    tease.textContent=lines[Math.min(n++,lines.length-1)]; Sound.no();
    if(still()) return;
    let r=no.getBoundingClientRect();
    if(!no.classList.contains("dodge")){ const b0=box.getBoundingClientRect(); no.style.left=(r.left-b0.left)+"px"; no.style.top=(r.top-b0.top)+"px"; no.classList.add("dodge"); box.classList.add("dodging"); no.offsetHeight; }
    // Mesures après la mise en place (la zone a pu grandir et le Oui se déplacer)
    const b=box.getBoundingClientRect(), y=yes.getBoundingClientRect(); r=no.getBoundingClientRect();
    const G=20, yl=y.left-b.left, yt=y.top-b.top, cl=r.left-b.left, ct=r.top-b.top, W=Math.max(0,b.width-r.width), H=Math.max(0,b.height-r.height);
    const libre=(x,t)=>x+r.width<=yl-G || x>=yl+y.width+G || t+r.height<=yt-G || t>=yt+y.height+G; // jamais à moins de 20 px du Oui
    let x, t, tries=0;
    do{ x=Math.random()*W; t=Math.random()*H; tries++; } while(tries<60 && (!libre(x,t) || Math.hypot(x-cl,t-ct)<60));
    if(!libre(x,t)){ // repli : le coin libre le plus éloigné de la place actuelle
      const coins=[[0,H],[W,H],[0,0],[W,0]].filter(([a,c])=>libre(a,c)).sort((p,q)=>Math.hypot(q[0]-cl,q[1]-ct)-Math.hypot(p[0]-cl,p[1]-ct));
      if(coins.length) [x,t]=coins[0]; else { x=cl; t=ct; }
    }
    no.style.left=x+"px"; no.style.top=t+"px";
  };
  no.addEventListener("pointerenter",e=>{ if(e.pointerType==="mouse") dodge(); });
  no.addEventListener("touchstart",dodge,{passive:false});
  no.addEventListener("click",dodge);
  yes.addEventListener("click",()=>{
    const r=yes.getBoundingClientRect(); Decor.burst(r.left+r.width/2, r.top+r.height/2, 60, true); Sound.yes();
    S.tplCat="Amour"; setTimeout(()=>go(1), still() ? 0 : 450);
  });
}
function bindCreator(){
  // Toute modification relit les champs, puis réaffiche (le lien déjà créé n'est plus à jour)
  const on=(sel, fn)=>$$(sel).forEach(b=>b.addEventListener("click",()=>{ const k=focusKey(b); readAll(); fn(b); S.link=""; renderCreator(); refocus(k, ".panel h2"); Sound.tick(); }));
  const fixAccent=()=>{ if(S.ac && !accentOk(S.theme,S.ac)) S.ac=""; };

  // Accueil et modèles
  $$("[data-home]").forEach(b=>{
    const th=HOME_CATS.find(c=>c.cat===b.dataset.home).theme;
    b.addEventListener("click",()=>{ S.tplCat=b.dataset.home; go(1); });
    // La scène prend la couleur de la catégorie : le temps du survol ou du focus, ou un instant au toucher
    b.addEventListener("pointerenter",e=>{ if(e.pointerType==="mouse") tintScene(th); });
    b.addEventListener("pointerleave",e=>{ if(e.pointerType==="mouse") tintScene(null); });
    b.addEventListener("focus",()=>tintScene(th));
    b.addEventListener("blur",()=>tintScene(null));
    b.addEventListener("touchstart",()=>{ tintScene(th); tintTimer=setTimeout(()=>tintScene(null),900); },{passive:true});
  });
  $("#fromScratch")?.addEventListener("click",()=>{ applyTemplate("zero"); S.tplCat="Amour"; go(2); });
  bindDemoTicket();
  on("[data-cat]", b=>{ S.tplCat=b.dataset.cat; });
  $$("[data-tpl]").forEach(b=>b.addEventListener("click",()=>{ applyTemplate(b.dataset.tpl); go(2); }));
  $$("[data-season]").forEach(b=>b.addEventListener("click",()=>{ const t=TEMPLATES.find(x=>x.id===b.dataset.season); S.tplCat=t.cat; applyTemplate(t.id); go(2); }));

  const f=$("#form"); if(!f) return;
  f.addEventListener("submit",e=>{
    e.preventDefault(); readAll();
    const err=checkScreen(S.step); if(err){ showErr(err); return; }
    go(S.step+1);
  });
  f.addEventListener("input",()=>{ if(S.link){ S.link=""; $("#result")?.classList.add("hidden"); $("#make")?.classList.remove("hidden"); $(".notif-opt")?.classList.remove("hidden"); } });
  $("#back")?.addEventListener("click",()=>{ readAll(); go(S.step===1 ? "home" : S.step-1); });
  $$("[data-edit]").forEach(b=>b.addEventListener("click",()=>{ readAll(); go(+b.dataset.edit); }));
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>{ readAll(); openSection(b.dataset.goto); }));
  $("#more")?.addEventListener("toggle",e=>{ S.moreOpen=e.target.open; });
  $$("details[data-sec]").forEach(d=>d.addEventListener("toggle",()=>{ d.open ? S.open.add(d.dataset.sec) : S.open.delete(d.dataset.sec); }));

  // Occasion et style
  on("[data-occ]", b=>{ S.occ=b.dataset.occ; if(!S.themeManual){ S.theme=OCC[S.occ].createTheme||OCC[S.occ].theme; fixAccent(); } if(!S.qEdited) S.q=OCC[S.occ].q; });
  on("[data-th]", b=>{ S.theme=b.dataset.th; S.themeManual=true; fixAccent(); });
  on("[data-ac]", b=>{ S.ac=b.dataset.ac; });
  on("[data-em]", b=>{ S.em=b.dataset.em; });
  on("[data-anim]", b=>{ S.anim=b.dataset.anim; });
  // Programme
  on("[data-mode]", b=>{ S.mode=b.dataset.mode; });
  $$("[data-vis]").forEach(box=>on(`[data-vis="${box.dataset.vis}"] [data-v]`, b=>{ S[box.dataset.vis].v=b.dataset.v; }));
  $$(".prog-step").forEach(box=>on(`.prog-step[data-step="${box.dataset.step}"] [data-sv]`, b=>{ S.steps[+box.dataset.step].v=b.dataset.sv; }));
  on("[data-del]", b=>{ S.steps.splice(+b.dataset.del,1); });
  on("#addStep", ()=>{ S.steps.push({h:"",a:"",l:"",v:"v",hint:"",at:""}); });
  // Quand
  $("#choose")?.addEventListener("change",e=>{ readAll(); S.choose=e.target.checked; S.link=""; renderCreator(); refocus("#choose"); Sound.tick(); });
  $("#sndInv")?.addEventListener("change",()=>{ readAll(); S.link=""; renderCreator(); refocus("#sndInv"); Sound.tick(); });
  $("#intro")?.addEventListener("change",()=>{ readAll(); S.link=""; renderCreator(); refocus("#intro"); Sound.tick(); });
  on("[data-hour]", b=>{ S.time=b.dataset.hour; });
  on("#addSlot", ()=>{ if(S.slots.length<3) S.slots.push({d:"",t:""}); });
  on("[data-delslot]", b=>{ S.slots.splice(+b.dataset.delslot,1); });
  // Le Non, la réponse
  on("[data-no]", b=>{ S.no=b.dataset.no; });
  on("[data-tone]", b=>{ S.tone=b.dataset.tone; });
  on("[data-ch]", b=>{ if(S.ch!==b.dataset.ch) S.chId=""; S.ch=b.dataset.ch; });

  // Aperçu en direct pendant la saisie
  const pv=(id,txt,show)=>{ const el=$("#"+id); if(el){ el.textContent=txt; el.hidden=!show; } };
  const msgPv=()=>{ const m=$("#msg").value.trim(), h=$("#hidden").checked; $("#cnt").textContent=`${$("#msg").value.length} / 300`; pv("pvMsg",m,m&&!h); pv("pvHidden","🔒 Message caché jusqu'au Oui",m&&h); };
  $("#q")?.addEventListener("input",e=>pv("pvQ",e.target.value,true));
  $("#msg")?.addEventListener("input",msgPv);
  $("#hidden")?.addEventListener("change",msgPv);
  $("#sg")?.addEventListener("input",e=>pv("pvSign",e.target.value.trim(),!!e.target.value.trim()));
  $$("[data-sugg]").forEach(b=>b.addEventListener("click",()=>{ $("#msg").value=b.textContent; msgPv(); }));

  // Tester, créer, partager
  const ready=()=>{ readAll(); const err=checkScreen(4); if(err){ showErr(err); return false; } return true; };
  // Safari bloque une fenêtre ouverte après une attente (compression du lien) : l'onglet est ouvert tout de suite, pendant le toucher,
  // puis reçoit le lien. S'il a quand même été bloqué, un message l'explique (rien n'est perdu de la création en cours).
  $("#preview")?.addEventListener("click",async()=>{
    if(!ready()) return;
    const w=window.open("","_blank");
    try{
      const url=await buildLink();
      if(w){ try{ w.opener=null; }catch(e){} w.location.href=url; }
      else toast("Ton navigateur a bloqué le nouvel onglet : autorise-le, ou crée ton lien et ouvre-le");
    }catch(e){ if(w) w.close(); }
  });
  $("#notifMe")?.addEventListener("change",e=>{ S.notif=e.target.checked; });
  $("#make")?.addEventListener("click",async()=>{
    if(!ready()) return;
    // Notification : l'autorisation est demandée ICI, pendant le toucher (Safari l'exige), et seulement si la case est cochée
    const wantNotif = S.notif && notifSupport()==="ok";
    const perm = !wantNotif ? null : Notification.permission==="granted" ? Promise.resolve("granted")
      : (()=>{ try{ return Promise.resolve(Notification.requestPermission()).catch(()=>"denied"); }catch(e){ return Promise.resolve("denied"); } })();
    $$(".sec-body .error").forEach(el=>el.remove()); // erreurs corrigées
    const mk=$("#make"); mk.disabled=true; mk.textContent="Création du lien…";
    const granted = perm ? (await perm)==="granted" : false;
    const notif = granted ? await subscribeNotif(notifExpire(whenList()), {to:S.to, when:whenList()}) : null;
    const long=await buildLink(notif?.nz), sh=await createShort(linkData(long), location.origin+location.pathname); // lien court chiffré, sinon le long
    mk.disabled=false; mk.textContent="Créer mon lien";
    S.link = sh ? sh.link : long; S.longLink = long; S.imgLinks = {}; S.nz = notif?.nz || ""; // liens de l'image : préparés à l'ouverture de « Partager en image »
    $("#linkbox").textContent=S.link; $("#result").classList.remove("hidden"); Sound.done();
    $("#shortNote").textContent = sh ? "Lien court : l'invitation est chiffrée, gardée un an en ligne sans pouvoir y être lue, puis effacée."
      : SHORT_ORIGIN ? "Le service des liens courts n'a pas répondu : voici le lien complet. Il n'expire pas, et rien n'est envoyé en ligne."
      : "Le lien complet n'expire pas, et rien n'est envoyé en ligne.";
    $("#make").classList.add("hidden"); // le lien affiché est à jour : une seule action principale, Partager ou Copier
    $(".notif-opt")?.classList.add("hidden");
    $("#notifDone").textContent = !wantNotif ? ""
      : notif ? `🔔 Notification activée : tu la recevras sur cet appareil si ${S.to} choisit de te prévenir.`
      : !granted ? "Notifications non autorisées : la réponse t'arrivera par message, comme d'habitude."
      : "La notification n'a pas pu être activée : la réponse t'arrivera par message, comme d'habitude.";
    focusScreen(".ready-title");
    if(S.link.length>1800) toast("Le lien est long : raccourcis le message si l'appli le coupe.");
    // Historique : uniquement ici, côté créateur (jamais côté destinataire)
    const saved=await addToHistory(long, sh, notif);
    $("#savedNote").textContent = saved ? "Ajoutée à « Mes invitations ». Ton historique reste uniquement sur cet appareil." : "";
    const n=loadHistory().length, badge=$("#histBadge");
    if(badge){ badge.textContent=n; badge.classList.toggle("hidden",!n); }
    $("#result").scrollIntoView({block:"nearest"});
  });
  $("#copy")?.addEventListener("click",async()=>{ toast(await copyText(S.link)?"Lien copié":"Copie impossible, sélectionne le lien à la main"); });
  $("#imgOpen")?.addEventListener("click", e=>openImageSheet(e.currentTarget));
  $("#share")?.addEventListener("click",()=>navigator.share({title:"Ose Demander",text:shareText(),url:S.link}).catch(()=>{}));
  $("#showLink")?.addEventListener("click",e=>{
    const open=$("#linkbox").classList.toggle("one")===false;
    e.currentTarget.setAttribute("aria-expanded",open); e.currentTarget.textContent = open ? "Replier le lien" : "Afficher le lien en entier";
  });
}

/* ---------- Partager en image : QR code et enveloppe de l'occasion, dessinés ici (rien n'est envoyé pour fabriquer l'image) ----------
   L'image ne contient que le prénom de la personne invitée, les couleurs du thème, l'enveloppe de l'occasion, le cachet et le lien.
   Jamais la question, le message, le lieu, la date, les surprises, ni le numéro ou le nom d'utilisateur de qui a créé l'invitation. */
const IMG_FORMATS = {story:{w:1080, h:1920, label:"Story"}, carre:{w:1080, h:1080, label:"Carré"}};
const IMG_UNAVAILABLE = "L'image n'est pas disponible pour le moment. Réessaie dans quelques minutes.";
/* Version de l'invitation pour l'image quand on retire ses coordonnées : sans canal ni identifiant (réponse par le partage du téléphone) */
/* Image « Pour une story ou un groupe » : sans coordonnées ni notification de réponse (le QR code peut circuler) ;
   la réponse se fait alors par le partage du téléphone */
function imageData(d){ const x={...d, c:"any"}; delete x.ci; delete x.nz; return sanitize(JSON.parse(JSON.stringify(x))); }
/* Lien que porte l'image : « Pour {prénom} uniquement » (strip=false) = le lien de l'invitation, comme le lien direct ;
   « Pour une story ou un groupe » (strip=true) = un lien court séparé, sans coordonnées ni notification
   (ou le même lien s'il n'y a rien à retirer) ; null si trop long */
async function imageLink(strip){
  const key = strip ? "strip" : "main", long = S.longLink || (S.link.includes("#i=") ? S.link : "");
  S.imgLinks ||= {};
  if(S.imgLinks[key]) return S.imgLinks[key];
  // L'image porte toujours un lien court (code peu dense, avec le logo au centre) : si le service des liens courts ne répond pas,
  // pas d'image pour l'instant (« Réessaie dans quelques minutes »), jamais de code géant au lien complet
  let link = S.link, d0 = null; if(long){ try{ d0 = await decodeData(linkData(long)); }catch(e){} }
  const base = location.origin+location.pathname, separe = strip && (!d0 || d0.ci || d0.nz); // lien séparé seulement s'il y a quelque chose à retirer
  if(separe || !link.includes("#s=")){
    if(!d0) return null;
    const sh = await createShort(separe ? await encodeData(imageData(d0)) : linkData(long), base);
    if(!sh) return null; // rien n'est gardé : un nouvel essai refera la demande
    link = sh.link; noteImageLink(sh); // gardé dans « Mes invitations », pour pouvoir le supprimer en ligne
  }
  return S.imgLinks[key] = link;
}
function noteImageLink(sh){
  const list=loadHistory(), it=list.find(x=>x.link===S.link);
  if(it){ it.img=sh.link; it.imgJeton=sh.jeton; storeHistory(list); }
}
/* Couleurs du thème (et de l'accent choisi) pour le dessin ; le QR code est toujours foncé sur blanc */
function imageColors(th, ac){
  const t=THEMES.find(x=>x.id===th)||THEMES[0], v=ac ? accentVars(th, ac) : null, a=v ? v.accent : t.a;
  return {bg:t.c, surface:t.s||"#FFFFFF", ink:t.i, accent:a, seal:readable(a, [t.i], 3), mark:envMark(a), hi:envHi(a), qr:contrast(t.i, "#FFFFFF")>=7 ? t.i : "#1F1546"};
}
/* L'enveloppe de l'invitation (mêmes formes que renderEnvelope, décor de l'occasion ou motifs du thème compris), en SVG autonome aux couleurs résolues */
function envelopeSVG(col, occ, shape, th){
  const deco=envDecoOcc(occ, th);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 320 222" width="640" height="444">
    <style>.o{stroke:${col.ink};stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.ed-ink{fill:none;stroke:${col.ink};stroke-linecap:round}
    .ed-web{fill:none;stroke:#FFF;stroke-opacity:.85;stroke-width:1.6;stroke-linejoin:round}.ed-staff{fill:none;stroke:${col.ink};stroke-width:1.3;opacity:.45}
    .em-o{stroke:${col.ink};stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.em-s{fill:${col.surface}}.em-b{fill:${col.bg}}.em-h{fill:${col.hi}}.em-m{fill:${col.mark}}
    .em-l,.em-k,.em-ks,.em-kb,.em-kh{fill:none;stroke-linecap:round;stroke-linejoin:round}.em-l{stroke:${col.mark};stroke-width:2.6}.em-l2{stroke-width:1.3;opacity:.55}
    .em-k{stroke:${col.ink};stroke-width:8}.em-ks{stroke:${col.surface};stroke-width:4.4}.em-kb{stroke:${col.bg};stroke-width:4.4}.em-kh{stroke:${col.hi};stroke-width:4.4}.em-dot{stroke-width:3;stroke-dasharray:.1 7}</style>
    <rect x="8" y="8" width="300" height="200" rx="12" fill="${col.ink}"/>
    <rect x="0" y="0" width="300" height="200" rx="12" fill="${col.accent}" stroke="${col.ink}" stroke-width="2.5"/>
    <path d="M2 2 L150 118 L298 2 L298 188 Q298 198 288 198 L12 198 Q2 198 2 188 Z" fill="${col.accent}"/>
    <path d="M2 2 L150 118 L298 2 L298 188 Q298 198 288 198 L12 198 Q2 198 2 188 Z" fill="rgba(0,0,0,.08)" stroke="${col.ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M4 196 L122 96 M296 196 L178 96" stroke="${col.ink}" stroke-width="1.5" opacity=".3"/>
    ${envMotifHTML("body", th, deco, "0")}
    <path d="M2 2 L298 2 L150 114 Z" fill="${col.accent}" stroke="${col.ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M2 2 L298 2 L150 114 Z" fill="rgba(255,255,255,.14)"/>
    ${envMotifHTML("flap", th, deco, "0")}
    ${shape ? `<svg x="124" y="84" width="52" height="52" viewBox="0 0 56 56" overflow="visible">${SEAL_SHAPES[shape]}</svg>`
      : `<circle cx="150" cy="110" r="22" fill="${col.ink}" stroke="${col.surface}" stroke-width="3"/>`}
    ${ENV_DECO[deco] ? ENV_DECO[deco].svg() : ""}
  </svg>`;
}
const svgImage = svg => new Promise((ok, ko)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=ko; i.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg); });
/* Coupe le texte en lignes équilibrées (comme text-wrap:balance) : sur deux lignes, la coupure qui rend la plus longue la plus courte */
function wrapText(ctx, text, max){
  const words=text.split(" "), wd=t=>ctx.measureText(t).width;
  if(wd(text)<=max) return [text];
  let best=null;
  for(let i=1; i<words.length; i++){ const a=words.slice(0,i).join(" "), b=words.slice(i).join(" "), m=Math.max(wd(a), wd(b));
    if(m<=max && (!best || m<best.m)) best={m, lines:[a, b]}; }
  if(best) return best.lines;
  const lines=[]; let line="";
  for(const w of words){ const t=line ? line+" "+w : w; if(wd(t)>max && line){ lines.push(line); line=w; } else line=t; }
  if(line) lines.push(line); return lines;
}
/* ---------- Dessin de l'image : un faire-part ----------
   Fond : la scène du thème (SCENES, couleurs résolues) et des décors du thème (formes du décor animé), jamais sur le texte ni sur le QR code.
   Le QR code reste droit, foncé sur blanc (≥ 7:1), avec sa marge blanche de 4 modules ; rien ne le recouvre sauf le petit logo central,
   posé seulement sur un lien court (niveau Q : 25 % de modules récupérables ; version 6, sans motif d'alignement au centre ;
   le logo n'en cache qu'environ 5 %). Lien complet (code dense) : niveau M, sans logo.
   Mise en scène (choisie le 2026-10-23) : la fête (scène en plein cadre, décors du thème, enveloppe penchée, texte manuscrit sur une
   banderole) et le billet du site (talon « Scanne-moi », perforation à encoches) qui porte le QR code, une carte à l'accent penchée derrière. */
/* Couleurs résolues du thème (et de l'accent choisi) pour le dessin */
function imageTheme(th, ac){
  const c=imageColors(th, ac), t=THEMES.find(x=>x.id===th)||THEMES[0], v=ac ? accentVars(th, ac) : null;
  const r={...c, soft:t.so||c.surface, line:c.bg, btn:v ? v.btn : c.accent, btnInk:v ? v.ink : "#FFFFFF"};
  try{ // valeurs exactes du thème, lues dans la feuille de style (navigateur)
    const el=document.createElement("div"); el.dataset.theme=th; el.style.display="none"; document.body.appendChild(el);
    const cs=getComputedStyle(el), g=n=>cs.getPropertyValue(n).trim();
    if(g("--line")) Object.assign(r, {soft:g("--soft")||r.soft, line:g("--line"), btn:v ? v.btn : g("--accent-btn")||r.btn, btnInk:v ? v.ink : g("--accent-ink")||r.btnInk});
    el.remove();
  }catch(e){}
  return r;
}
/* Le décor de fond de la scène, en SVG autonome aux couleurs résolues (dessiné à l'échelle 2, comme sur un téléphone) */
function sceneImageSVG(th, w, h, col){
  const sc=SCENES[th]||SCENES.base, css=`.sc-bg{fill:${col.bg}}.sc-a{fill:${col.soft}}.sc-b{fill:${col.surface}}.sc-out{stroke:${col.line};stroke-width:1.5;stroke-linejoin:round}
.sc-line{fill:none;stroke:${col.line};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.sc-wire{fill:none;stroke:${col.line};stroke-width:3;stroke-linecap:round}
.sc-mount{fill:${col.line};stroke:${col.bg};stroke-width:2}.sc-speck-l{fill:${col.ink};opacity:.06}.sc-speck-d{fill:${col.bg};opacity:.5}.sc-dash{stroke-dasharray:5 7}
.sc-neon text{font-family:sans-serif;font-weight:700}.sc-halo text{fill:none;stroke:${col.accent};stroke-width:9;opacity:.2}.sc-tube text{fill:${col.accent}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w/2} ${h/2}"><style>${css}</style>${sc.wall}</svg>`;
}
/* Décors du thème semés sur le fond, hors des zones protégées (texte, QR code, cartes) */
function sprinkle(x, th, w, h, avoid, n, seed, big=1){
  const cfg=DECOR[th]||DECOR.base, kinds=[...new Set([...(Array.isArray(cfg.shape)?cfg.shape:[cfg.shape]), ...(cfg.burst||[])])], rnd=imgRand(seed);
  let posed=0;
  for(let essai=0; essai<n*25 && posed<n; essai++){
    const px=rnd()*w, py=rnd()*h, sz=(16+rnd()*22)*big, m=sz*1.6;
    if(avoid.some(([ax,ay,aw,ah])=>px>ax-m && px<ax+aw+m && py>ay-m && py<ay+ah+m)) continue;
    const kind=kinds[Math.floor(rnd()*kinds.length)], cols=(cfg.kcols&&cfg.kcols[kind])||cfg.cols;
    x.save(); x.translate(px, py); x.rotate(rnd()*6.28); x.globalAlpha=.55+rnd()*.4;
    try{ Decor.paint(x, kind, sz, cols[Math.floor(rnd()*cols.length)]); }catch(e){}
    x.restore(); posed++;
  }
}
/* Rectangle arrondi (tracé) */
function rrect(x, X, Y, W, H, r){ x.beginPath(); x.moveTo(X+r, Y); x.arcTo(X+W, Y, X+W, Y+H, r); x.arcTo(X+W, Y+H, X, Y+H, r); x.arcTo(X, Y+H, X, Y, r); x.arcTo(X, Y, X+W, Y, r); x.closePath(); }
/* Carte en papier : ombre décalée à l'encre, fond, contour (la signature du site) */
function paperCard(x, X, Y, W, H, r, col, fill=col.surface, sh=16){
  x.fillStyle=col.ink; rrect(x, X+sh, Y+sh, W, H, r); x.fill();
  x.fillStyle=fill; rrect(x, X, Y, W, H, r); x.fill();
  x.lineWidth=6; x.strokeStyle=col.ink; rrect(x, X+3, Y+3, W-6, H-6, r-3); x.stroke();
}
/* Le QR code : carte blanche (marge de 4 modules), modules foncés, petit logo central si le niveau le permet ; renvoie sa place */
function drawQR(x, q, X, Y, side, col, logo){
  x.fillStyle="#FFFFFF"; rrect(x, X, Y, side, side, Math.round(side*.06)); x.fill();
  const m=Math.floor(side/(q.size+8)), qs=m*q.size, qx=Math.round(X+(side-qs)/2), qy=Math.round(Y+(side-qs)/2);
  const L = logo ? (Math.round(q.size*.21)|1) : 0, l0=(q.size-L)/2, inLogo=(a,b)=>L && a>=l0 && a<l0+L && b>=l0 && b<l0+L;
  x.fillStyle=col.qr;
  for(let yy=0; yy<q.size; yy++) for(let xx=0; xx<q.size; xx++) if(q.dark(xx, yy) && !inLogo(xx, yy)) x.fillRect(qx+xx*m, qy+yy*m, m, m);
  if(L){ // logo : pastille à l'accent cernée de blanc, « ? » blanc
    const lx=qx+l0*m, ly=qy+l0*m, ls=L*m, p=m*.9;
    x.fillStyle=col.btn; rrect(x, lx+p, ly+p, ls-2*p, ls-2*p, (ls-2*p)*.28); x.fill();
    x.fillStyle=col.btnInk; x.font=`800 ${Math.round(ls*.62)}px "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif`; x.textAlign="center"; x.textBaseline="middle";
    x.fillText("?", lx+ls/2, ly+ls/2+ls*.03);
  }
  return {x:qx, y:qy, module:m, size:q.size, color:col.qr, logo:L ? {from:l0, size:L} : null};
}
/* L'enveloppe de l'occasion et son cachet (emoji, initiale, ou 💌 pour les occasions Surprise) */
async function drawEnvelope(x, o, col, X, Y, W, rot=0){
  const shape=(ENV_DECO[o.occ]||{}).seal, H=W*222/320, k=W/320;
  x.save(); x.translate(X+W/2, Y+H/2); x.rotate(rot);
  try{ x.drawImage(await svgImage(envelopeSVG(col, o.occ, shape, o.th)), -W/2, -H/2, W, H); }catch(e){}
  const seal = ENV_NEUTRAL.includes(o.occ) ? "💌" : o.em || o.initial;
  x.fillStyle = shape==="pumpkin" ? "#3B1F0A" : shape==="heart" ? "#FFFFFF" : shape==="gold" ? "#4A2C10" : col.seal;
  x.font=`800 ${Math.round((o.em || seal==="💌" ? 25 : 21)*k*1.15)}px "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif`; x.textAlign="center"; x.textBaseline="middle";
  x.fillText(seal, (156-160)*k, (116-111)*k + (shape==="pumpkin" ? 6*k : shape==="heart" ? -3*k : 0));
  x.restore();
  return H;
}
/* Texte manuscrit (Caveat) sur une ou deux lignes équilibrées ; renvoie la hauteur */
function handText(x, txt, cx, y, maxW, px, color, centre=false, maxL=2){ // centre : y est le milieu du bloc, sinon la première ligne
  x.fillStyle=color; x.textAlign="center"; x.textBaseline="middle";
  let lines; // prénom long : le texte rapetisse jusqu'à tenir sur maxL lignes
  for(;;){ x.font=`700 ${px}px "Caveat", "Comic Sans MS", cursive`; lines=wrapText(x, txt, maxW); if(lines.length<=maxL || px<=36) break; px=Math.round(px*.9); }
  const lh=px*1.02, y0=centre ? y-(lines.length-1)*lh/2 : y;
  lines.forEach((l, i)=>x.fillText(l, cx, y0+i*lh)); return lines.length*lh;
}
/* Banderole à l'accent, bouts découpés, ombre décalée à l'encre */
function banner(x, bx, by, bw, bh, col){
  const cut=bh*.35, path=(dx, dy)=>{ x.beginPath(); x.moveTo(bx+dx, by+dy); x.lineTo(bx+bw+dx, by+dy); x.lineTo(bx+bw-cut+dx, by+bh/2+dy); x.lineTo(bx+bw+dx, by+bh+dy);
    x.lineTo(bx+dx, by+bh+dy); x.lineTo(bx+cut+dx, by+bh/2+dy); x.closePath(); };
  x.fillStyle=col.ink; path(12, 12); x.fill(); x.fillStyle=col.btn; path(0, 0); x.fill(); x.lineWidth=6; x.strokeStyle=col.ink; x.stroke();
  return cut;
}
/* Le billet : carte en papier, talon (« Scanne-moi », manuscrit), perforation en pointillés et deux encoches */
function ticket(x, X, Y, W, H, stub, col){
  x.save(); x.translate(X+W/2, Y+H/2); x.rotate(.05); x.fillStyle=col.accent; rrect(x, -W/2-18, -H/2-14, W+36, H+28, 40); x.fill(); x.restore(); // carte penchée derrière
  paperCard(x, X, Y, W, H, 40, col);
  const py=Y+stub;
  x.fillStyle=col.ink; x.font=`700 ${Math.round(stub*.52)}px "Caveat", "Comic Sans MS", cursive`; x.textAlign="center"; x.textBaseline="middle"; x.fillText("Scanne-moi", X+W/2, Y+stub/2+4);
  x.strokeStyle=col.line; x.lineWidth=6; x.setLineDash([18, 16]); x.beginPath(); x.moveTo(X+56, py); x.lineTo(X+W-56, py); x.stroke(); x.setLineDash([]);
  for(const ex of [X, X+W]){ // encoches (couleur du fond, cernées d'encre côté billet)
    x.fillStyle=col.bg; x.beginPath(); x.arc(ex, py, 30, 0, 6.29); x.fill();
    x.strokeStyle=col.ink; x.lineWidth=6; x.beginPath(); x.arc(ex, py, 30, ex===X ? -1.57 : 1.57, ex===X ? 1.57 : 4.71); x.stroke();
  }
  return py;
}
async function drawInviteImage(fmt, o, canvas=document.createElement("canvas")){
  const {w, h}=IMG_FORMATS[fmt], story=fmt==="story", col=imageTheme(o.th, o.ac);
  canvas.width=w; canvas.height=h;
  const x=canvas.getContext("2d"), font=(weight, px)=>`${weight} ${px}px "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif`;
  try{ await Promise.all([font(800, 64), font(600, 34), `700 90px "Caveat"`].map(f=>document.fonts.load(f))); }catch(e){}
  const court=o.link.includes("#s="), q=qrEncode(o.link, court ? "Q" : "M"), dense=q.size>61, logo=court && !dense;
  const texte=`${o.to}, j'ai une question pour toi\u00A0💌`, seed=[...o.to].reduce((a, c)=>a*31+c.charCodeAt(0), 7);
  // Disposition. Code dense (lien complet, en repli seulement) : enveloppe et banderole plus petites, code plus grand
  const L = story
    ? (dense ? {env:300, envX:w/2-150, envY:40, ban:[60, 270, w-120, 190], tk:[70, 540, w-140, 1330], stub:150, qr:900}
             : {env:460, envX:w/2-230, envY:70, ban:[60, 470, w-120, 240], tk:[120, 820, w-240, 1000], stub:190, qr:600})
    : (dense ? {env:0, ban:[40, 24, w-80, 120], tk:[150, 180, w-300, 880], stub:110, qr:740}
             : {env:300, envX:50, envY:330, ban:[40, 40, w-80, 170], tk:[430, 260, w-470, 790], stub:130, qr:470});
  // Fond : couleur et scène du thème, puis les décors (hors des zones de lecture)
  x.fillStyle=col.bg; x.fillRect(0, 0, w, h);
  try{ x.drawImage(await svgImage(sceneImageSVG(o.th, w, h, col)), 0, 0, w, h); }catch(e){}
  const [tx, ty, tw, th]=L.tk, [bx, by, bw, bh]=L.ban;
  sprinkle(x, o.th, w, h, [[tx-30, ty-30, tw+60, th+60], [bx, by, bw, bh], ...(L.env ? [[L.envX, L.envY, L.env, L.env*.72]] : [])], story ? (dense ? 24 : 54) : (dense ? 14 : 30), seed, 1.2);
  if(L.env) await drawEnvelope(x, o, col, L.envX, L.envY, L.env, -.07);
  const cut=banner(x, bx, by, bw, bh, col);
  handText(x, texte, w/2, by+bh/2, bw-2*cut-40, story ? (dense ? 84 : 104) : (dense ? 54 : 62), col.btnInk, true);
  // Le billet et le QR code (droit, centré dans la partie principale)
  const py=ticket(x, tx, ty, tw, th, L.stub, col), mainH=ty+th-py;
  const qx=tx+tw/2-L.qr/2, qy=py+(mainH-L.qr)/2-(story && !dense ? 28 : 0);
  const info=drawQR(x, q, qx, qy, L.qr, col, logo);
  if(story && !dense){ x.fillStyle=col.ink; x.globalAlpha=.75; x.font=font(600, 34); x.textAlign="center"; x.textBaseline="middle"; x.fillText("osedemander.fr", tx+tw/2, qy+L.qr+48); x.globalAlpha=1; }
  return {canvas, qr:info};
}
/* Panneau « Partager en image » : aperçu, format, « Pour qui est cette image ? » (story ou groupe par défaut), partager ou enregistrer.
   La question n'apparaît que si l'invitation contient des coordonnées ou une notification de réponse (sinon les deux choix sont identiques).
   Safari : le fichier est préparé AVANT le toucher, navigator.share est appelé sans aucune attente. */
function imageWhoNote(group, hasId, hasNz){
  const to=esc(S.to);
  if(group) return `L'image ouvre une version ${hasId && hasNz ? "sans tes coordonnées ni la notification de réponse" : hasId ? "sans ton numéro ni ton nom d'utilisateur" : "sans la notification de réponse"} : elle peut circuler sans risque. La réponse se fera par le partage du téléphone.`;
  return `L'image ouvre l'invitation comme le lien direct${hasId ? ", avec tes coordonnées" : ""}${hasNz ? (hasId ? " et la notification de réponse" : ", avec la notification de réponse") : ""}. Envoie-la seulement à ${to}.`;
}
function openImageSheet(opener){
  const hasId=!!S.chId, hasNz=!!S.nz, ask=hasId||hasNz, st={fmt:"story", strip:true, file:null, url:"", job:0};
  const d=document.createElement("div"); d.className="sheet img-sheet"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-labelledby","imgTitle");
  d.innerHTML=`<div class="sheet-card">
    <h3 id="imgTitle" tabindex="-1">Partager en image</h3>
    <div class="seg" role="group" aria-label="Format de l'image">${Object.entries(IMG_FORMATS).map(([k,f])=>`<button type="button" data-fmt="${k}" aria-pressed="${k===st.fmt}">${f.label}</button>`).join("")}</div>
    ${ask ? `<p class="img-q" id="imgWhoLbl">Pour qui est cette image ?</p>
    <div class="seg img-who" role="group" aria-labelledby="imgWhoLbl">
      <button type="button" data-who="groupe" aria-pressed="true">Pour une story ou un groupe</button>
      <button type="button" data-who="perso" aria-pressed="false">Pour ${esc(S.to)} uniquement</button>
    </div>
    <p class="hint" id="imgWhoNote" aria-live="polite">${imageWhoNote(true, hasId, hasNz)}</p>` : ""}
    <div class="img-prev" id="imgPrevBox"><p class="img-wait" role="status">Préparation de l'image…</p></div>
    <p class="hint">Toute personne qui scanne ce code peut ouvrir l'invitation, avec son lieu et sa date. Pour une story publique, pense à qui pourra la voir.</p>
    <div class="btns img-btns" id="imgBtns" hidden>
      <button type="button" class="btn primary" id="imgSend">Partager l'image</button>
      <a class="btn" id="imgSave" href="#" download="invitation-ose-demander.png">Enregistrer l'image</a>
    </div>
    <button type="button" class="linkbtn img-close" id="imgClose">Fermer</button>
  </div>`;
  const onKey=e=>{ if(e.key==="Escape") close(); };
  const close=()=>{ d.remove(); document.removeEventListener("keydown", onKey); if(st.url) URL.revokeObjectURL(st.url); try{ opener?.focus(); }catch(e){} };
  const box=$("#imgPrevBox", d), btns=$("#imgBtns", d), send=$("#imgSend", d), save=$("#imgSave", d);
  const prepare=async()=>{
    const job=++st.job; btns.hidden=true; box.innerHTML=`<p class="img-wait" role="status">Préparation de l'image…</p>`;
    let link=null; try{ link=await imageLink(st.strip); }catch(e){}
    if(job!==st.job) return;
    if(!link){ box.innerHTML=`<p class="img-wait" role="status">${IMG_UNAVAILABLE}</p>`; return; }
    const {canvas}=await drawInviteImage(st.fmt, {to:S.to, th:S.theme, ac:S.ac, occ:S.occ, em:S.em, initial:(S.from||"?").trim().charAt(0).toUpperCase(), link});
    const blob=await new Promise(r=>canvas.toBlob(r, "image/png"));
    if(job!==st.job || !blob) return;
    if(st.url) URL.revokeObjectURL(st.url);
    st.url=URL.createObjectURL(blob);
    st.file=new File([blob], `invitation-ose-demander-${st.fmt}.png`, {type:"image/png"});
    box.innerHTML=`<img src="${st.url}" alt="Image à partager : « ${esc(S.to)}, j'ai une question pour toi », avec un QR code qui ouvre l'invitation">`;
    save.href=st.url; save.download=st.file.name;
    const canShare=!!(navigator.canShare && navigator.canShare({files:[st.file]}));
    send.hidden=!canShare; save.classList.toggle("primary", !canShare); // une seule action principale
    btns.hidden=false;
  };
  d.addEventListener("click", e=>{
    if(e.target===d) return close();
    const f=e.target.closest("[data-fmt]");
    if(f){ st.fmt=f.dataset.fmt; $$("[data-fmt]", d).forEach(b=>b.setAttribute("aria-pressed", b===f)); prepare(); }
    const who=e.target.closest("[data-who]");
    if(who && (who.dataset.who==="groupe")!==st.strip){
      st.strip=who.dataset.who==="groupe";
      $$("[data-who]", d).forEach(b=>b.setAttribute("aria-pressed", b===who));
      $("#imgWhoNote", d).innerHTML=imageWhoNote(st.strip, hasId, hasNz);
      prepare();
    }
  });
  send.addEventListener("click", ()=>{ if(st.file) navigator.share({files:[st.file], title:"Ose Demander", text:shareText()}).catch(()=>{}); });
  $("#imgClose", d).addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(d); focusScreen("#imgTitle");
  prepare();
}

function packItem(it){
  if(it.v==="s") return {v:"s", h:it.h||undefined};
  if(it.v==="r") return {v:"r", h:it.h||undefined, at:it.at, e:scramble(it.x)};
  return it.x ? {v:"v", x:it.x} : undefined;
}
async function buildLink(nz){
  const d={ f:S.from, t:S.to, o:S.occ, th:S.theme, q:S.q, n:S.no, c:S.ch };
  if(S.occ==="libre") d.of=S.occFree;
  if(S.tone!=="taquin") d.tn=S.tone;
  if(S.chId) d.ci=S.chId;
  if(S.anim!=="n") d.an=S.anim;
  if(S.ac) d.ac=S.ac; if(S.em) d.em=S.em; if(S.sg) d.sg=S.sg;
  if(!S.snd) d.so=0;
  if(!S.share) d.pa=0; // partage de la surprise refusé (absent = autorisé)
  if(nz) d.nz=nz; // notification de réponse (voir subscribeNotif)
  if(S.msg){ d.m=S.msg; if(S.hidden) d.mh=1; }
  if(S.mode==="one"){
    d.a=packItem(S.act); const l=packItem(S.lieu); if(l) d.l=l; if(S.details) d.dt=S.details;
  } else {
    d.p=S.steps.map(st=>{
      if(st.v==="s") return {h:st.h, v:"s", i:st.hint||undefined};
      if(st.v==="r") return {h:st.h, v:"r", i:st.hint||undefined, at:st.at, e:scramble(JSON.stringify({a:st.a,l:st.l}))};
      return {h:st.h, v:"v", a:st.a, l:st.l||undefined};
    });
    if(S.end) d.en=S.end; if(S.meet) d.me=S.meet; if(S.bring) d.br=S.bring;
  }
  if(S.choose) d.sl=S.slots.filter(s=>s.d&&s.t).map(s=>[s.d,s.t]);
  else { d.d=S.date; d.h=S.time; }
  const ix=introCode(); if(ix) d.ix=ix;
  const base=location.origin+location.pathname; // sans « ?… » (ex. traceurs ajoutés par les réseaux sociaux)
  return base+"#i="+await encodeData(d);
}

/* =========================================================
   MES INVITATIONS — historique stocké uniquement sur cet appareil
   (localStorage). Jamais envoyé nulle part, jamais lu côté destinataire.
   ========================================================= */
const HIST_KEY="ose-historique", HIST_MAX=200, SITE_HOST="osedemander.fr";
const HIST_FIELDS=["id","from","to","occ","occFree","when","link","created","long","jeton","gone","img","imgJeton","nid","njeton","rep","repAt","repSlot"];
// Notification : nid = identifiant (dans le lien), njeton = pour y renoncer ; rep = "o" ou "n", repAt = date de réception, repSlot = créneau choisi
// Lien court : link = #s=…, long = le lien complet (#i=…, l'historique fonctionne même sans le service), jeton = pour supprimer le lien en ligne
const invLink = it => it.long || it.link;
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const byNewest=(a,b)=>Date.parse(b.created)-Date.parse(a.created);
const linkData=link=>link.slice(link.indexOf("#i=")+3);
const shortId=link=>(String(link).match(/#s=([A-Za-z0-9_-]{22})\./)||[])[1]||"";

/* Seuls les liens d'invitation d'Ose Demander sont acceptés */
function isOwnLink(link){
  if(typeof link!=="string" || link.length>MAX_LINK+60) return false;
  let u; try{ u=new URL(link); }catch(e){ return false; }
  const prod = u.protocol==="https:" && u.hostname===SITE_HOST && !u.port;
  const dev = location.hostname==="localhost" && u.origin===location.origin; // test en local uniquement
  return (prod||dev) && u.href===link && !u.username && !u.password && !u.search
    && (u.pathname==="/" || u.pathname==="/index.html") && (/^#i=[zpyx][A-Za-z0-9_-]+$/.test(u.hash) || SHORT_HASH.test(u.hash));
}
/* Validation stricte d'une entrée : champs connus seulement, bons types, bonnes longueurs */
function validEntry(x){
  if(!x || typeof x!=="object" || Array.isArray(x)) return false;
  if(Object.keys(x).some(k=>!HIST_FIELDS.includes(k))) return false;
  const txt=(v,max)=>typeof v==="string" && v.trim()!=="" && v.length<=max;
  const isDate=v=>typeof v==="string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const isTime=v=>typeof v==="string" && /^\d{2}:\d{2}$/.test(v);
  return typeof x.id==="string" && /^[a-z0-9]{6,24}$/.test(x.id)
    && txt(x.from,30) && txt(x.to,30)
    && typeof x.occ==="string" && Object.keys(OCC).includes(x.occ)
    && (x.occFree===undefined || (typeof x.occFree==="string" && x.occFree.length<=40))
    && Array.isArray(x.when) && x.when.length>=1 && x.when.length<=3
    && x.when.every(w=>Array.isArray(w) && w.length===2 && isDate(w[0]) && isTime(w[1]))
    && typeof x.created==="string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(x.created) && !isNaN(Date.parse(x.created))
    && isOwnLink(x.link)
    && (shortId(x.link)
      ? isOwnLink(x.long) && x.long.includes("#i=") && (x.jeton===undefined || (typeof x.jeton==="string" && /^[A-Za-z0-9_-]{43}$/.test(x.jeton))) && (x.gone===undefined || x.gone===true)
      : x.long===undefined && x.jeton===undefined && x.gone===undefined)
    // Lien de l'image (sans coordonnées) : un lien court, avec son jeton de suppression
    && (x.img===undefined ? x.imgJeton===undefined : !!shortId(x.img) && isOwnLink(x.img) && typeof x.imgJeton==="string" && /^[A-Za-z0-9_-]{43}$/.test(x.imgJeton))
    // Notification de réponse
    && (x.nid===undefined ? x.njeton===undefined && x.rep===undefined : typeof x.nid==="string" && /^[A-Za-z0-9_-]{22}$/.test(x.nid))
    && (x.njeton===undefined || (typeof x.njeton==="string" && /^[A-Za-z0-9_-]{43}$/.test(x.njeton)))
    && (x.rep===undefined ? x.repAt===undefined && x.repSlot===undefined
      : (x.rep==="o" || x.rep==="n") && typeof x.repAt==="string" && !isNaN(Date.parse(x.repAt)) && x.repAt.length<=30
        && (x.repSlot===undefined || (Number.isInteger(x.repSlot) && x.repSlot>=0 && x.repSlot<x.when.length)));
}
/* L'entrée est toujours reconstruite à partir du lien décodé et validé : ce qui est affiché correspond au lien */
function entryFrom(d, link, created=new Date().toISOString(), id=newId(), extra={}){
  const e={id, from:d.f, to:d.t, occ:d.o, when: d.sl ? d.sl.map(s=>[s[0],s[1]]) : [[d.d,d.h]], link, created};
  if(d.o==="libre" && d.of) e.occFree=d.of;
  if(shortId(link)){ e.long=extra.long; if(extra.jeton) e.jeton=extra.jeton; if(extra.gone) e.gone=true; }
  if(extra.img && extra.imgJeton){ e.img=extra.img; e.imgJeton=extra.imgJeton; }
  if(d.nz){ // l'identifiant vient du lien : le statut ne peut concerner que cette invitation
    e.nid=d.nz.slice(0,22);
    if(extra.njeton) e.njeton=extra.njeton;
    if(extra.rep){ e.rep=extra.rep; e.repAt=extra.repAt; if(extra.repSlot!==undefined) e.repSlot=extra.repSlot; }
  }
  return e;
}
function loadHistory(){
  try{ const a=JSON.parse(localStorage.getItem(HIST_KEY)||"[]"); return Array.isArray(a) ? a.filter(validEntry).sort(byNewest) : []; }
  catch(e){ return []; }
}
function storeHistory(list){
  try{
    if(list.length) localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0,HIST_MAX)));
    else localStorage.removeItem(HIST_KEY);
    return true;
  }catch(e){ return false; }
}
/* Réponses reçues par notification (enregistrées par sw.js dans IndexedDB) : ajoutées à l'historique. true si quelque chose a changé */
async function syncReplies(){
  if(typeof indexedDB==="undefined") return false;
  let reps; try{ reps=await notifStore("reponses","readonly",st=>st.getAll()); }catch(e){ return false; }
  if(!Array.isArray(reps) || !reps.length) return false;
  let changed=false;
  const list=loadHistory().map(it=>{
    const r=it.nid && reps.find(x=>x && x.nid===it.nid);
    if(!r || it.rep) return it;
    const e={...it, rep:r.r==="o" ? "o" : "n", repAt:String(r.at||new Date().toISOString()).slice(0,30)};
    if(e.rep==="o" && Number.isInteger(r.s) && r.s>=0 && r.s<it.when.length) e.repSlot=r.s;
    if(!validEntry(e)) return it;
    changed=true; return e;
  });
  if(changed) storeHistory(list);
  return changed;
}
function histReply(it){
  if(it.rep){
    const w = it.rep==="o" && it.when.length>1 && it.repSlot!==undefined ? it.when[it.repSlot] : null;
    return `<p class="rep rep-${it.rep}">Répondu : ${it.rep==="o" ? "Oui 🎉" : "Non"}${w ? `, ${esc(frDate(w[0]))} à ${esc(frTime(w[1]))}` : ""}</p>`;
  }
  return it.nid ? `<p class="meta">🔔 Notification activée sur cet appareil</p>` : "";
}
/* Demande au navigateur de ne pas effacer l'historique automatiquement */
function askPersist(){
  try{ navigator.storage?.persisted?.().then(p=>{ if(!p) return navigator.storage.persist(); }).catch(()=>{}); }catch(e){}
}
async function addToHistory(link, sh=null, notif=null){
  try{
    const e=entryFrom(await decodeData(linkData(link)), sh ? sh.link : link, undefined, undefined, {...(sh ? {long:link, jeton:sh.jeton} : {}), ...(notif ? {njeton:notif.jeton} : {})});
    link=e.link;
    if(!validEntry(e)) return false;
    const list=loadHistory().filter(x=>x.link!==link);
    list.unshift(e);
    if(!storeHistory(list)) return false;
    askPersist();
    return true;
  }catch(e){ return false; }
}

function histOcc(it){ return it.occ==="libre" ? (it.occFree||"Autre chose") : OCC[it.occ].label; }
function histWhen(it){
  if(it.when.length===1) return `${frDate(it.when[0][0])} à ${frTime(it.when[0][1])}`;
  const short=iso=>{ const [y,m,d]=iso.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}); };
  return "Au choix : "+it.when.map(w=>`${short(w[0])} ${frTime(w[1])}`).join(", ");
}
function renderHistory(){
  setTheme("base","n");
  document.title = "Mes invitations — Ose Demander";
  const list=loadHistory();
  $("#app").innerHTML = `
  <div class="wrap">
    ${topHTML(true)}
    <section class="panel">
      <a class="back" href="#">← Retour</a>
      <h2 tabindex="-1">Mes invitations</h2>
      <p class="lead">Ton historique reste uniquement sur cet appareil.</p>
      ${isStandalone() ? "" : `<p class="tip">💡 Installe l'appli pour mieux conserver ton historique.</p>`}
      ${list.length ? `<ul class="hist" id="histList">${list.map(it=>`
        <li data-id="${esc(it.id)}">
          <p class="who">Pour ${esc(it.to)}</p>
          ${histReply(it)}
          <p class="meta">De ${esc(it.from)} · ${esc(histOcc(it))}</p>
          <p class="meta">${esc(histWhen(it))}</p>
          <p class="meta">Créée le ${esc(new Date(it.created).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}))}</p>
          ${it.long ? `<p class="meta">${it.gone ? "Lien court supprimé en ligne : le lien complet reste dans ton historique" : "Lien court, chiffré"}</p>` : ""}
          <div class="acts">
            <button type="button" class="btn sm primary" data-act="copy">Copier le lien</button>
            <button type="button" class="btn sm" data-act="open">Ouvrir</button>
            <button type="button" class="btn sm" data-act="dup">Dupliquer</button>
            <button type="button" class="btn sm ghost" data-act="del">Retirer de l'historique</button>
            ${it.jeton && !it.gone ? `<button type="button" class="btn sm danger" data-act="unpub">Supprimer le lien en ligne</button>` : ""}
          </div>
        </li>`).join("")}</ul>`
      : `<p class="empty">Aucune invitation pour l'instant.<br>Quand tu cliques sur « Créer mon lien », elle s'ajoute ici.</p>`}
      <div class="hist-tools">
        ${list.length ? `<button type="button" class="btn sm" id="histExport">Exporter mon historique</button>` : ""}
        <button type="button" class="btn sm" id="histImport">Importer un historique</button>
        ${list.length ? `<button type="button" class="btn sm danger" id="histClear">Tout effacer</button>` : ""}
      </div>
      <input type="file" id="histFile" accept=".json,application/json" class="hidden">
      <p class="hint">L'export crée un fichier .json à garder pour toi : il contient tes liens, donc tes invitations, et de quoi supprimer tes liens courts. Pratique pour changer de téléphone ou passer du navigateur à l'appli.</p>
    </section>
    <p class="foot">Rien n'est envoyé en ligne : l'historique est enregistré dans ce navigateur.<br><a href="mentions-legales.html#historique">En savoir plus</a></p>
  </div>`;
  refreshInstall();
  bindSound(true);
  syncReplies().then(ch=>{ if(ch && location.hash==="#mes-invitations") renderHistory(); });

  $("#histList")?.addEventListener("click", async e=>{
    const b=e.target.closest("[data-act]"); if(!b) return;
    const id=b.closest("[data-id]").dataset.id, it=loadHistory().find(x=>x.id===id);
    if(!it){ renderHistory(); return; }
    switch(b.dataset.act){
      case "copy": { const l=it.gone ? it.long : it.link; toast(await copyText(l) ? (it.gone ? "Lien complet copié (le lien court a été supprimé)" : "Lien copié") : "Copie impossible"); break; }
      case "open": window.open(invLink(it),"_blank","noopener"); break;
      case "dup": duplicateInvitation(it); break;
      case "unpub": unpublishShort(it); break;
      case "del":
        if(it.nid && it.njeton && !it.rep) cancelNotif(it.nid, it.njeton); // plus de statut à afficher : plus de notification
        if(storeHistory(loadHistory().filter(x=>x.id!==id))){ renderHistory(); toast("Invitation retirée de l'historique"); }
        else toast("Impossible de modifier l'historique sur cet appareil");
        break;
    }
  });
  $("#histExport")?.addEventListener("click", exportHistory);
  $("#histImport").addEventListener("click", ()=>$("#histFile").click());
  $("#histFile").addEventListener("change", e=>{ importHistory(e.target.files[0]); e.target.value=""; });
  $("#histClear")?.addEventListener("click", async()=>{
    const n=loadHistory().length;
    const ok=await confirmSheet("Tout effacer ?",
      `${n>1?`Les ${n} invitations`:"L'invitation"} de cet appareil ${n>1?"seront retirées":"sera retirée"} de l'historique. Les liens déjà envoyés continueront de fonctionner. Exporte ton historique avant si tu veux le garder.`,
      "Tout effacer");
    if(!ok) return;
    for(const it of loadHistory()) if(it.nid && it.njeton && !it.rep) cancelNotif(it.nid, it.njeton);
    if(storeHistory([])){ renderHistory(); toast("Historique effacé"); }
    else toast("Impossible d'effacer l'historique sur cet appareil");
  });
}
/* « Supprimer le lien en ligne » : le contenu chiffré est effacé chez le service des liens courts, avec le jeton gardé ici.
   Le lien court affichera « Cette invitation a été supprimée » ; l'invitation reste dans l'historique avec son lien complet. */
async function unpublishShort(it){
  const ok=await confirmSheet("Supprimer le lien en ligne ?",
    `Le lien court envoyé à ${it.to} ne s'ouvrira plus : il affichera « Cette invitation a été supprimée »${it.img ? ", tout comme le QR code de l'image" : ""}. Le contenu chiffré est effacé tout de suite. L'invitation reste dans ton historique, avec son lien complet.`,
    "Supprimer le lien");
  if(!ok) return;
  const r=await deleteShort(shortId(it.link), it.jeton);
  if(it.img && it.imgJeton) await deleteShort(shortId(it.img), it.imgJeton); // le lien de l'image aussi
  if(r==="ok" || r==="deja" || r==="introuvable"){
    storeHistory(loadHistory().map(x=>x.id===it.id ? {...x, gone:true} : x));
    renderHistory(); toast(r==="ok" ? "Lien en ligne supprimé" : "Ce lien n'est déjà plus en ligne");
  }
  else toast(r==="jeton" ? "Suppression refusée : ce lien n'a pas été créé sur cet appareil" : "Le service des liens courts ne répond pas : réessaie plus tard");
}
function confirmSheet(title, text, okLabel){
  return new Promise(resolve=>{
    const d=document.createElement("div"); d.className="sheet"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label",title);
    d.innerHTML=`<div class="sheet-card"><h3>${esc(title)}</h3><p>${esc(text)}</p>
      <div class="btns"><button type="button" class="btn" data-r="0">Annuler</button><button type="button" class="btn primary" data-r="1">${esc(okLabel)}</button></div></div>`;
    const onKey=e=>{ if(e.key==="Escape") close(false); };
    const close=v=>{ d.remove(); document.removeEventListener("keydown",onKey); resolve(v); };
    d.addEventListener("click",e=>{ if(e.target===d) return close(false); const b=e.target.closest("[data-r]"); if(b) close(b.dataset.r==="1"); });
    document.addEventListener("keydown",onKey);
    document.body.appendChild(d); $("[data-r='0']",d).focus();
  });
}
/* Dupliquer : on relit le lien pour pré-remplir tout le formulaire */
async function duplicateInvitation(it){
  let d; try{ d=await decodeData(linkData(invLink(it))); }catch(e){ toast("Impossible de relire ce lien"); return; }
  const blank={v:"v",x:"",h:"",at:""};
  const unpack=x=>{
    if(!x) return {...blank};
    if(x.v==="v") return {...blank, x:x.x};
    if(x.v==="r"){ let val=""; try{ val=unscramble(x.e).slice(0,120); }catch(e){} return {v:"r",x:val,h:x.h||"",at:x.at}; }
    return {v:"s",x:"",h:x.h||"",at:""};
  };
  const o=OCC[d.o];
  Object.assign(S,{
    step:4, tpl:"", preset:{}, moreOpen:false, open:new Set(), err:"", errSec:"", // ouvre directement l'aperçu
    from:d.f, to:d.t, occ:d.o, occFree:d.of||"", theme:d.th, themeManual:!o||d.th!==o.theme, anim:d.an||"n",
    mode:d.p?"prog":"one", act:unpack(d.a), lieu:unpack(d.l), details:d.dt||"",
    steps:d.p ? d.p.map(st=>{
      if(st.v==="v") return {h:st.h, a:st.a, l:st.l||"", v:"v", hint:"", at:""};
      if(st.v==="r"){ let x={}; try{ const p=JSON.parse(unscramble(st.e)); if(p && typeof p==="object") x=p; }catch(e){}
        return {h:st.h, a:String(x.a||"").slice(0,80), l:String(x.l||"").slice(0,120), v:"r", hint:st.i||"", at:st.at}; }
      return {h:st.h, a:"", l:"", v:"s", hint:st.i||"", at:""};
    }) : [{h:"",a:"",l:"",v:"v",hint:"",at:""}],
    end:d.en||"", meet:d.me||"", bring:d.br||"",
    choose:!!d.sl, date:d.sl?"":d.d, time:d.sl?"":d.h,
    slots:d.sl ? d.sl.map(s=>({d:s[0],t:s[1]})) : [{d:"",t:""},{d:"",t:""}],
    q:d.q, qEdited:!o||d.q!==o.q, msg:d.m||"", hidden:!!d.mh,
    no:d.n, tone:d.tn||"taquin", ch:d.c, chId:d.ci||"", link:"",
    ac:d.ac||"", em:d.em||"", sg:d.sg||"", snd:d.so!==0, share:d.pa!==0
  });
  location.hash=""; // retour au formulaire (voir route)
  window.scrollTo({top:0});
  toast("Invitation dupliquée : modifie ce que tu veux");
}
function exportHistory(){
  const items=loadHistory();
  if(!items.length){ toast("Ton historique est vide"); return; }
  const json=JSON.stringify({app:"ose-demander", version:1, exported:new Date().toISOString(), items}, null, 2);
  saveFile(`ose-demander-historique-${todayISO()}.json`, json, "application/json");
  toast("Historique exporté");
}
async function importHistory(file){
  if(!file) return;
  const bad="Ce fichier n'est pas un historique Ose Demander";
  if(file.size>2e6){ toast(bad); return; }
  let data; try{ data=JSON.parse(await file.text()); }catch(e){ toast(bad); return; }
  const okTop = data && typeof data==="object" && !Array.isArray(data)
    && Object.keys(data).every(k=>["app","version","exported","items"].includes(k))
    && data.app==="ose-demander" && data.version===1
    && (data.exported===undefined || (typeof data.exported==="string" && data.exported.length<=40))
    && Array.isArray(data.items) && data.items.length<=1000;
  if(!okTop){ toast(bad); return; }
  const list=loadHistory(), links=new Set(list.map(x=>x.link)), ids=new Set(list.map(x=>x.id));
  let added=0, skipped=0;
  for(const x of data.items){
    if(!validEntry(x)){ skipped++; continue; }
    if(links.has(x.link)) continue; // déjà dans l'historique
    let d; try{ d=await decodeData(linkData(invLink(x))); }catch(e){ skipped++; continue; }
    const e=entryFrom(d, x.link, x.created, ids.has(x.id) ? newId() : x.id, x);
    if(!validEntry(e)){ skipped++; continue; }
    list.push(e); links.add(e.link); ids.add(e.id); added++;
  }
  list.sort(byNewest);
  if(added && !storeHistory(list)){ toast("Impossible d'enregistrer l'historique sur cet appareil"); return; }
  if(added) askPersist();
  renderHistory();
  let msg = added ? `${added} invitation${added>1?"s":""} importée${added>1?"s":""}` : "Aucune nouvelle invitation à importer";
  if(skipped) msg += ` · ${skipped} ignorée${skipped>1?"s":""} (invalide${skipped>1?"s":""})`;
  if(list.length>HIST_MAX) msg += ` · seules les ${HIST_MAX} plus récentes sont gardées`;
  toast(msg);
}

oseLoaded("creer", "6069d263d5");
