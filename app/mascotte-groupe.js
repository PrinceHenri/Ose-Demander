/* Mascottes, invitation de groupe (partie B, chargé à la demande après app/mascotte.js et le fichier de la famille).
   Une scène décorative (aria-hidden) : Oui = des chatons installés au décor de la famille (table, gâteau, canapé, bus, coussins),
   un petit chaton par accompagnant ; Peut-être = sur le pas de la porte ; Non = une assiette mise de côté. Tableau de bord : la
   même scène pour toutes les réponses, prénom et petit mot au toucher (la liste sous l'illustration reste la source lisible
   au clavier et par les lecteurs d'écran), porte fermée « Complet ! » à la clôture. MascotteGroupe.dessiner(el, s). */
(function(){
const E = "#1F1546", T = (s, w, h, c) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${c}</svg>`;
const DECOR_OCC = {voyage:"bus", voyagesurprise:"bus", evc:"bus", sortie:"bus", soiree:"canape", cremaillere:"canape", nouvelle:"canape", babyshower:"coussins", libre:"coussins", juste:"coussins"};
const decorDe = (o, f) => DECOR_OCC[o] || (f === "anniv" ? "gateau" : "table");
const nappe = T(0, 180, 30, `<path d="M16 10V30M164 10V30" style="stroke:${E};stroke-width:3.4"/><rect x="2" y="1" width="176" height="10" rx="3" style="fill:#FFF4E8;stroke:${E};stroke-width:2"/>`
  + `<path d="M4 11H176V18${Array.from({length: 11}, () => "q-8 6-16 0").join("")}Z" style="fill:#F4A7C0;stroke:${E};stroke-width:1.6;stroke-linejoin:round"/>`);
const gateau = T(0, 32, 26, `<path d="M3 14h26v11H3Z" style="fill:#F4A7C0;stroke:${E};stroke-width:2"/><path d="M5 6h22v8H5Z" style="fill:#FFF4E8;stroke:${E};stroke-width:2"/>`
  + `<path d="M5 9q2.7 3 5.5 0t5.5 0 5.5 0 5.5 0" style="fill:none;stroke:#E83F86;stroke-width:1.6"/><circle cx="16" cy="3.5" r="2.6" style="fill:#D7263D;stroke:${E};stroke-width:1.3"/>`);
const DECORS = {
  table: {bas: 16, devant: nappe},
  gateau: {bas: 16, devant: nappe, centre: gateau},
  canape: {bas: 10, fond: T(0, 180, 54, `<path d="M10 54V14Q10 4 20 4H160Q170 4 170 14V54Z" style="fill:#a898ee;stroke:${E};stroke-width:2"/><rect x="0" y="22" width="20" height="32" rx="7" style="fill:#c9bdf5;stroke:${E};stroke-width:2"/><rect x="160" y="22" width="20" height="32" rx="7" style="fill:#c9bdf5;stroke:${E};stroke-width:2"/>`),
    devant: T(0, 180, 14, `<rect x="16" y="1" width="148" height="12" rx="4" style="fill:#c9bdf5;stroke:${E};stroke-width:2"/>`)},
  bus: {bas: 24, devant: T(0, 180, 64, `<path fill-rule="evenodd" d="M6 2H166Q178 2 178 16V54H2V8Q2 2 6 2Z${[0, 1, 2, 3].map(i => `M${12 + i * 42} 9h32v22h-32Z`).join("")}" style="fill:#FFC94A;stroke:${E};stroke-width:2"/>`
    + `<path d="M2 40H178" style="stroke:#E83F86;stroke-width:3"/>${[34, 146].map(x => `<circle cx="${x}" cy="55" r="7.5" style="fill:#4A4560;stroke:${E};stroke-width:2"/><circle cx="${x}" cy="55" r="2.6" style="fill:#FFF4E8"/>`).join("")}`)},
  coussins: {bas: 9, devant: T(0, 180, 16, [20, 55, 90, 125, 160].map((x, i) => `<ellipse cx="${x}" cy="9" rx="17" ry="6.5" style="fill:${["#F4A7C0", "#8DD3C7", "#FFC94A", "#a898ee", "#F2994A"][i]};stroke:${E};stroke-width:2"/>`).join(""))}
};
const porte = ferme => T(0, 46, 84, `<path fill-rule="evenodd" d="M2 84V6Q2 2 6 2H40Q44 2 44 6V84ZM9 84V9H37V84Z" style="fill:#C98F4E;stroke:${E};stroke-width:2"/>`
  + (ferme ? `<path d="M9 84V9H37V84Z" style="fill:#E0A866;stroke:${E};stroke-width:1.6"/><circle cx="32" cy="50" r="2.2" style="fill:#FFC94A;stroke:${E};stroke-width:1.2"/>`
    : `<path d="M37 9L45 4V82L37 84Z" style="fill:#E0A866;stroke:${E};stroke-width:1.6;stroke-linejoin:round"/>`));
const assiettes = n => T(0, 50, 46, `<path d="M25 24V44M15 45H35" style="stroke:${E};stroke-width:3;stroke-linecap:round"/><ellipse cx="25" cy="24" rx="20" ry="4.5" style="fill:#C98F4E;stroke:${E};stroke-width:2"/>`
  + Array.from({length: n}, (_, i) => `<ellipse cx="25" cy="${19 - i * 4}" rx="14" ry="3.6" style="fill:#FFF4E8;stroke:${E};stroke-width:1.6"/>`).join("")
  + `<path d="M19 ${16 - (n - 1) * 4}l12-1.5-2 -5.5Z" style="fill:#F2C14E;stroke:${E};stroke-width:1.4;stroke-linejoin:round"/>`);
const TEINTES = ["--mc-peau:#fffaf3;--mc-ombre:#f6e8d8;--mc-marque:#f9cdb3;--mc-collier:#8DD3C7", "--mc-peau:#ECE8F2;--mc-ombre:#D9D3E3;--mc-marque:#B9B1CB;--mc-collier:#FFC94A",
  "--mc-peau:#FFE6CC;--mc-ombre:#F6D0A8;--mc-marque:#EFA15E;--mc-collier:#E83F86"];
document.head.insertAdjacentHTML("beforeend", `<style>.mcgr{position:relative;width:288px;max-width:100%;height:108px;margin:6px auto 2px;pointer-events:none}
.mcgr>*{position:absolute;bottom:0}.mcgr-fond,.mcgr-devant{left:54px}.mcgr-centre{left:194px;bottom:27px;z-index:2}.mcgr-devant{z-index:2}
.mcgr-places{left:54px;width:180px;display:flex;justify-content:center;align-items:flex-end;z-index:1}.mcgr-bus .mcgr-places{justify-content:flex-start;padding-left:6px}
.mcgr-gateau .mcgr-places{width:140px}.mcgr-seuil .mc-chat+.mc-chat{margin-left:-24px}
.mcgr .mc-chat{width:44px;height:51px;margin:0 -4px}.mcgr-bus .mc-chat{margin:0 -1px}.mcgr .mcgr-petit{width:32px;height:37px;margin:0 -3px}.mcgr-table .mcgr-petit,.mcgr-gateau .mcgr-petit{margin-bottom:7px}
.mcgr-porte{right:2px;z-index:2}.mcgr-seuil{right:2px;width:46px;display:flex;justify-content:center;align-items:flex-end;z-index:1;bottom:0}
.mcgr-ass{left:0}.mcgr-plus{z-index:3;bottom:auto;top:0;font:700 13px/1 var(--display,sans-serif);background:var(--surface);color:var(--ink);border:2px solid var(--ink);border-radius:999px;padding:3px 8px}
.mcgr-complet{right:-4px;bottom:46px;z-index:3;transform:rotate(-8deg);font:800 12px/1 var(--display,sans-serif);background:#FFF4E8;color:${E};border:2px solid ${E};border-radius:6px;padding:3px 5px}
.grp-legende{text-align:center;margin:0 0 10px}.mcgr-qui{pointer-events:auto;cursor:pointer}.mcgr-bulle{z-index:5;bottom:auto;top:-6px;left:50%;transform:translateX(-50%);width:max-content;max-width:240px;background:var(--surface);color:var(--ink);border:2px solid var(--ink);border-radius:12px;box-shadow:3px 3px 0 var(--ink);padding:6px 10px;font-size:14px;line-height:1.3;overflow-wrap:anywhere}</style>`);
let vivants = [];
const menage = () => { vivants = vivants.filter(c => c.el.isConnected || (c.detruire(), false)); };
window.addEventListener("hashchange", () => setTimeout(menage, 0));
/* s : {famille, o, anim, oui:[{p, m, a}], peut:[…], non: nombre, ferme} */
function dessiner(el, s){
  (el._chats || []).forEach(c => c.detruire()); el._chats = []; menage();
  const d = decorDe(s.o, s.famille), D = DECORS[d], max = 4, e = s.anim === "0" ? "0" : "d";
  el.className = "mcgr mcgr-" + d; el.innerHTML = "";
  const ajoute = (html, cls) => { const x = document.createElement("div"); x.className = cls; x.innerHTML = html; el.appendChild(x); return x; };
  if(D.fond) ajoute(D.fond, "mcgr-fond");
  const places = ajoute("", "mcgr-places"); places.style.bottom = D.bas + "px";
  ajoute(D.devant, "mcgr-devant");
  if(D.centre) ajoute(D.centre, "mcgr-centre");
  const chaton = (qui, i, petit, r) => {
    const c = Mascotte.chat(qui, {energie: e, famille: petit ? "" : s.famille, sens: i % 2 ? -1 : 1});
    if(petit){ c.el.classList.add("mcgr-petit"); c.el.style.cssText += ";" + TEINTES[i % 3]; }
    c.etat(r === "p" ? "timide" : "attente"); el._chats.push(c); vivants.push(c); return c.el;
  };
  // Un groupe par réponse : le chaton de la personne, puis un petit chaton par accompagnant
  const groupes = (liste, r, limite) => { const out = []; let n = 0, reste = 0;
    liste.forEach((x, i) => { const g = document.createElement("span"); g.className = "mcgr-qui"; g.style.display = "flex"; g.style.alignItems = "flex-end";
      if(n >= limite){ reste += 1 + (x.a || 0); return; }
      g.appendChild(chaton(i % 2 ? "lilas" : "praline", i, false, r)); n++;
      for(let k = 0; k < (x.a || 0); k++){ if(n >= limite){ reste++; continue; } g.appendChild(chaton("praline", k, true, r)); n++; }
      if(x.p) g.addEventListener("click", ev => { ev.stopPropagation(); bulle(g, x); });
      out.push(g); });
    return {out, reste}; };
  const oui = groupes(s.oui || [], "o", max);
  places.append(...oui.out);
  if(oui.reste) ajoute("+" + oui.reste, "mcgr-plus").style.left = "54px";
  ajoute(porte(!!s.ferme), "mcgr-porte");
  if(s.ferme) ajoute("Complet !", "mcgr-complet");
  else if((s.peut || []).length){ const p = groupes(s.peut, "p", 2), seuil = ajoute("", "mcgr-seuil"); seuil.append(...p.out); if(p.reste) ajoute("+" + p.reste, "mcgr-plus").style.right = "0"; }
  if(s.non) ajoute(assiettes(Math.min(3, s.non)), "mcgr-ass");
}
function bulle(g, x){
  document.querySelectorAll(".mcgr-bulle").forEach(b => b.remove());
  const b = document.createElement("div"); b.className = "mcgr-bulle";
  const nom = document.createElement("b"); nom.textContent = x.p; b.appendChild(nom);
  if(x.m){ b.appendChild(document.createElement("br")); b.appendChild(document.createTextNode(x.m.length > 90 ? x.m.slice(0, 89) + "…" : x.m)); }
  g.closest(".mcgr").appendChild(b);
  setTimeout(() => document.addEventListener("click", () => b.remove(), {once: true}), 0);
}
// Formulaire de la personne invitée : sa réponse seule (r : o, p, n ; a : accompagnants). Page de l'invitation : MCF, D, invAnim
// Sous la scène (décorative), une légende lisible pour le Non. Textes regroupés (clés prêtes pour lang/en.json)
const MCGR_TEXTES = {"grp.part": "On te garde une part."};
const invite = (r, a) => { const box = document.getElementById("grpIllu"); if(!box) return;
  if(!box.firstChild) box.innerHTML = `<div aria-hidden="true"></div><p class="hint grp-legende"></p>`;
  const leg = box.lastChild; leg.textContent = MCGR_TEXTES["grp.part"]; leg.classList.toggle("hidden", r !== "n");
  dessiner(box.firstChild, {famille: MCF, o: D.o, anim: invAnim(), oui: r === "o" ? [{a}] : [], peut: r === "p" ? [{a}] : [], non: r === "n" ? 1 : 0}); };
window.MascotteGroupe = {dessiner, invite, decorDe};
})();

oseLoaded("mascotteGroupe", "599d5f81b9");
