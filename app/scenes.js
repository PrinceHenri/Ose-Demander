/* Ose Demander — scènes illustrées des thèmes (décor de fond et élément vedette), chargées à part par index.html (need("scenes")).
   Sans elles, chaque écran garde le fond du thème : rien ne dépend de leur arrivée. Les formes communes (sceneWall, at, fanions…)
   restent dans index.html. La dernière ligne déclare la version (empreinte écrite par node outils/csp.mjs). */
Object.assign(SCENES, {
  // Lilas : papier peint à rayures, étagère et objets en papier ; pancarte suspendue qui se balance
  base: {
    wall: sceneWall(
      `<pattern id="sc-rayures" width="96" height="120" patternUnits="userSpaceOnUse"><rect class="sc-a" width="48" height="120"/><path class="sc-line" d="M72 52l7 8-7 8-7-8z"/></pattern>`,
      fill("sc-rayures") +
      at("0","92%",`<rect class="sc-b sc-out" x="-4" width="4000" height="12"/>`) +
      at("9%","92%",`<g transform="translate(0,-38)"><rect class="sc-b sc-out" width="30" height="38" rx="4"/><path class="sc-line" d="M30 10h6a8 8 0 0 1 0 16h-6"/></g>`) +
      at("40%","92%",`<g transform="translate(0,-56)"><rect class="sc-b sc-out" width="44" height="56" rx="2"/><rect class="sc-a sc-out" x="7" y="7" width="30" height="42"/></g>`) +
      at("78%","92%",`<path class="sc-a sc-out" d="M17-30c-14-10-18-26-6-34 6 8 8 20 6 34zm0 0c10-12 24-14 30-4-8 6-18 8-30 4z"/><path class="sc-b sc-out" d="M0-30h34l-4 30H4z"/>`)),
    sign: sceneSign(150, `<g class="sg-swing">
      <path class="sg-wire" d="M160 8 96 52M160 8l64 44"/><circle class="sg-ink" cx="160" cy="8" r="5"/>
      ${panel(58,50,204,86,12)}${label(160,86,26,"Une question")}
      <text class="sg-text" x="160" y="120" font-size="26" text-anchor="middle">pour toi <tspan class="sg-t-acc">?</tspan></text></g>`)
  },
  // Amour : façade de café (planches, fenêtres) ; enseigne, store rayé et lampions qui s'allument
  amour: {
    wall: sceneWall(
      `<pattern id="sc-planches" width="44" height="200" patternUnits="userSpaceOnUse"><rect class="sc-a" width="42" height="200"/><path class="sc-line" d="M43 0v200M8 60h2M30 150h2"/></pattern>`,
      fill("sc-planches") +
      [["5%","52%"],["74%","56%"]].map(([x,y]) => at(x,y,`<rect class="sc-b sc-out" width="104" height="140" rx="6"/><rect class="sc-a sc-out" x="10" y="10" width="84" height="120" rx="3"/><path class="sc-line" d="M52 10v120M10 70h84"/><rect class="sc-b sc-out" x="-6" y="136" width="116" height="12" rx="3"/>`)).join("")),
    sign: sceneSign(172, `<path class="sg-wire" d="M8 8Q160 36 312 8"/>
      ${garland(7,8,14).map(([x,y],i)=>`<g class="sg-lamp" style="animation-delay:${i*.45}s"><path class="sg-string" d="M${x} ${y}v6"/><circle class="${i%2?"sg-surf":"sg-acc"} sg-out" cx="${x}" cy="${y+16}" r="10"/></g>`).join("")}
      ${panel(40,62,240,62)}${label(160,88,18,"Le café des")}${label(160,114,26,"rendez-vous")}
      ${Array.from({length:8},(_,i)=>`<path class="${i%2?"sg-surf":"sg-acc"} sg-out" d="M${40+30*i} 130h30v20a15 15 0 0 1-30 0z"/>`).join("")}`)
  },
  // Pétales : jardin de grandes fleurs en papier et clôture basse ; pot de fleurs « Pour toi », la fleur s'ouvre
  maman: {
    wall: sceneWall(
      `<pattern id="sc-fleurs" width="240" height="240" patternUnits="userSpaceOnUse">${[[60,70,"sc-b"],[180,180,"sc-a"]].map(([x,y,c]) =>
        [0,72,144,216,288].map(a=>`<ellipse class="${c} sc-out" cx="${x}" cy="${y-22}" rx="13" ry="22" transform="rotate(${a} ${x} ${y})"/>`).join("") + `<circle class="sc-b sc-out" cx="${x}" cy="${y}" r="9"/>`).join("")}
        <path class="sc-a sc-out" d="M150 60c20-24 50-20 56-4-20 14-40 14-56 4zM50 170c-6-26 12-46 30-40-4 22-14 36-30 40z"/></pattern>
       <pattern id="sc-cloture" width="30" height="120" patternUnits="userSpaceOnUse"><path class="sc-b sc-out" d="M5 120V16l10-12 10 12v104z"/></pattern>`,
      fill("sc-fleurs") + at("0","89%",`<rect width="4000" height="400" fill="url(#sc-cloture)"/><path class="sc-line" d="M0 40h4000M0 80h4000"/>`)),
    sign: sceneSign(172, `<path class="sg-wire" d="M150 150C150 120 148 96 150 70"/>
      <path class="sg-soft sg-out" d="M150 124c-26-2-40-18-38-30 18 0 32 12 38 30zM151 108c18-16 36-16 44-6-12 12-28 14-44 6z"/>
      <g class="sg-bloom">${[0,60,120,180,240,300].map(a=>`<ellipse class="sg-surf sg-out" cx="150" cy="38" rx="12" ry="22" transform="rotate(${a} 150 60)"/>`).join("")}<circle class="sg-acc sg-out" cx="150" cy="60" r="12"/></g>
      <rect class="sg-acc sg-out" x="104" y="132" width="92" height="14" rx="3"/><path class="sg-acc sg-out" d="M110 146h80l-8 24h-64z"/>
      <path class="sg-wire" d="M244 170v-44"/>${panel(198,92,96,36,6)}${label(246,116,19,"Pour toi")}`)
  },
  // Cravate : bureau rétro (papier peint à losanges, lambris) ; horloge murale dont l'aiguille avance
  papa: {
    wall: sceneWall(
      `<pattern id="sc-losanges" width="72" height="72" patternUnits="userSpaceOnUse"><path class="sc-line" d="M36 22l14 14-14 14-14-14z"/></pattern>
       <pattern id="sc-lambris" width="140" height="400" patternUnits="userSpaceOnUse"><rect class="sc-b sc-out" x="16" y="34" width="108" height="170" rx="4"/></pattern>`,
      fill("sc-losanges") + at("0","70%",`<rect class="sc-a" width="4000" height="1000"/><rect width="4000" height="1000" fill="url(#sc-lambris)"/><rect class="sc-b sc-out" x="-4" width="4000" height="14"/>`)),
    sign: sceneSign(172, `<circle class="sg-ink" cx="166" cy="72" r="54"/><circle class="sg-surf sg-out" cx="160" cy="66" r="54"/>
      ${Array.from({length:12},(_,i)=>{ const a=i*Math.PI/6, r1=i%3?44:40; return `<path class="sg-wire" d="M${(160+r1*Math.sin(a)).toFixed(1)} ${(66-r1*Math.cos(a)).toFixed(1)}L${(160+48*Math.sin(a)).toFixed(1)} ${(66-48*Math.cos(a)).toFixed(1)}"/>`; }).join("")}
      <path class="sg-hand" d="M160 66l-18-14M160 66l20-30"/><path class="sg-sec" d="M160 76V24"/><circle class="sg-ink" cx="160" cy="66" r="5"/>
      ${panel(98,132,124,34,6)}${label(160,155,18,"C'est l'heure ?")}`)
  },
  // Pop : mur de briques claires et affiches ; bulle de BD « Tu viens ? », une affiche frémit
  amis: {
    wall: sceneWall(
      BRICKS + `<pattern id="sc-affiches" width="440" height="520" patternUnits="userSpaceOnUse">
        <g transform="rotate(-4 70 95)"><rect class="sc-b sc-out" x="20" y="30" width="100" height="130" rx="2"/><circle class="sc-a sc-out" cx="70" cy="80" r="18"/><path class="sc-line" d="M36 118h68M36 132h48M36 146h60"/></g>
        <g transform="rotate(5 340 380)"><rect class="sc-b sc-out" x="296" y="326" width="88" height="110" rx="2"/><path class="sc-line" d="M310 352h60M310 366h40M316 392l24 24 24-24z"/></g></pattern>`,
      fill("sc-briques") + fill("sc-affiches")),
    sign: sceneSign(160, `<g transform="rotate(-8 64 40)"><g class="sg-flutter"><rect class="sg-soft sg-out" x="18" y="34" width="90" height="112" rx="3"/><path class="sg-lline" d="M34 62h58M34 78h42M34 120h58"/><rect class="sg-lin" x="48" y="24" width="30" height="16" rx="2"/></g></g>
      <path class="sg-acc sg-out" d="${Array.from({length:24},(_,i)=>{ const a=i*Math.PI/12, r=i%2?50:74; return `${i?"L":"M"}${(244+r*Math.cos(a)).toFixed(1)} ${(66+r*Math.sin(a)).toFixed(1)}`; }).join("")}z"/>
      <path class="sg-ink" d="M140 42h146a16 16 0 0 1 16 16v40a16 16 0 0 1-16 16H198l-22 22 4-22h-40a16 16 0 0 1-16-16V58a16 16 0 0 1 16-16z" transform="translate(5 5)"/>
      <path class="sg-surf sg-out" d="M140 42h146a16 16 0 0 1 16 16v40a16 16 0 0 1-16 16H198l-22 22 4-22h-40a16 16 0 0 1-16-16V58a16 16 0 0 1 16-16z"/>
      ${label(213,90,32,"Tu viens ?")}`)
  },
  // Confettis : rideau de scène et lambrequin ; banderole, fanions et ballons qui flottent
  fete: {
    wall: sceneWall(
      `<pattern id="sc-rideau" width="72" height="200" patternUnits="userSpaceOnUse"><rect class="sc-a" width="36" height="200"/><path class="sc-line" d="M36 0v200M72 0v200"/></pattern>
       <pattern id="sc-lambrequin" width="60" height="60" patternUnits="userSpaceOnUse"><path class="sc-b sc-out" d="M0 0h60v24a30 18 0 0 1-60 0z"/></pattern>`,
      fill("sc-rideau") + `<rect width="100%" height="56" fill="url(#sc-lambrequin)"/>`),
    sign: sceneSign(172, `<path class="sg-wire" d="M6 10Q160 50 314 10"/>
      ${garland(9,10,20).map(([x,y],i)=>`<path class="${CYCLE[i%3]} sg-out" d="M${(x-11).toFixed(1)} ${y.toFixed(1)}h22l-11 24z"/>`).join("")}
      <path class="sg-acc sg-out" d="M58 82h30v40H58l10-20zM262 82h-30v40h30l-10-20z"/>
      ${panel(78,70,164,48,4)}${label(160,102,26,"C'est la fête")}
      ${[[30,92,"sg-acc",0],[286,80,"sg-lin",.8],[300,118,"sg-surf",1.6]].map(([x,y,c,d])=>`<g class="sg-float" style="animation-delay:-${d}s"><path class="sg-string" d="M${x} ${y+22}q-6 22 4 46"/><ellipse class="${c} sg-out" cx="${x}" cy="${y}" rx="15" ry="19"/></g>`).join("")}`)
  },
  // Mystère : mur de briques sombres ; enseigne néon qui scintille
  mystere: {
    wall: sceneWall(BRICKS, fill("sc-briques")),
    sign: (()=>{
      const txt=`<text class="sc-neon-big" x="160" y="70" text-anchor="middle">Chut<tspan class="sc-flick">…</tspan></text>
        <text class="sc-neon-small" x="160" y="108" text-anchor="middle">c'est une surprise</text>`;
      return sceneSign(124, `<path class="sc-wire" d="M160 0V14M96 24V14h128v10"/>
        <rect class="sc-mount" x="90" y="22" width="12" height="8" rx="2"/><rect class="sc-mount" x="218" y="22" width="12" height="8" rx="2"/>
        <g class="sc-neon"><g class="sc-halo">${txt}</g><g class="sc-tube">${txt}</g></g>`);
    })()
  },
  // Halloween : nuit, lune, maison hantée, clôture et citrouilles ; citrouille souriante qui oscille, chauve-souris
  halloween: {
    wall: sceneWall(
      `<pattern id="sc-nuit" width="260" height="260" patternUnits="userSpaceOnUse"><path class="sc-line" d="M40 40v10M35 45h10M190 120v8M186 124h8M120 210v10M115 215h10"/>
        <path class="sc-a" d="M200 40c5-7 12-7 14-2 2-5 9-5 14 2-5-1-8 0-9 4-2-3-7-3-10 0-1-4-4-5-9-4zM70 150c4-6 10-6 12-2 2-4 8-4 12 2-4-1-7 0-8 3-2-2-6-2-8 0-1-3-4-4-8-3z"/></pattern>
       <pattern id="sc-grille" width="34" height="400" patternUnits="userSpaceOnUse"><path class="sc-b sc-out" d="M8 400V22l9-14 9 14v378z"/></pattern>`,
      fill("sc-nuit") +
      at("74%","5%",`<circle class="sc-b sc-out" cx="50" cy="50" r="46"/><circle class="sc-a" cx="34" cy="40" r="9"/><circle class="sc-a" cx="62" cy="66" r="6"/><circle class="sc-a" cx="62" cy="30" r="4"/>`) +
      at("0","88%",`<path class="sc-a" d="M0 40Q300-20 700 30T1400 20T2100 30T2800 20T3500 30T4200 20V900H0z"/>`) +
      at("3%","94%",`<g transform="translate(0 -200)"><path class="sc-b sc-out" d="M10 200V90h120v110z"/><path class="sc-a sc-out" d="M0 92L70 40l70 52z"/>
        <path class="sc-b sc-out" d="M96 92V30h30v62z"/><path class="sc-a sc-out" d="M90 32l21-32 21 32z"/><rect class="sc-a sc-out" x="104" y="46" width="14" height="18" rx="7"/>
        <rect class="sc-a sc-out" x="30" y="112" width="24" height="28" rx="12"/><rect class="sc-a sc-out" x="86" y="112" width="24" height="28" rx="12"/>
        <path class="sc-line" d="M30 126h24M42 112v28M86 126h24M98 112v28"/><path class="sc-a sc-out" d="M58 200v-36a12 12 0 0 1 24 0v36z"/></g>`) +
      at("86%","94%",`<path class="sc-a sc-out" d="M14 0l4-90-26-36 6-3 24 30 2-30h6v28l22-26 6 4-26 34 2 89z"/>`) +
      at("0","92%",`<rect width="4000" height="400" fill="url(#sc-grille)"/><path class="sc-line" d="M0 40h4000M0 90h4000"/>`) +
      at("66%","97%",`<g transform="translate(0 -34)"><ellipse class="sc-b sc-out" cx="24" cy="18" rx="24" ry="17"/><path class="sc-line" d="M24 2v32M12 4q-6 14 0 28M36 4q6 14 0 28"/><path class="sc-a sc-out" d="M22 2l2-8 5 1-3 8z"/></g>`)),
    sign: sceneSign(170, `<g class="sg-wobble"><ellipse class="sg-ink" cx="96" cy="120" rx="66" ry="52"/>
        <path class="sg-acc sg-out" d="M90 62c-40 0-66 22-66 52s26 52 66 52 66-22 66-52-26-52-66-52z"/>
        <path class="sg-rib" d="M90 64c-22 14-22 86 0 100M90 64c22 14 22 86 0 100M58 72c-18 20-18 66 0 86M122 72c18 20 18 66 0 86"/>
        <path class="sg-lin sg-out" d="M84 66l2-20c0-5 10-5 10 1l-2 19z"/>
        <g class="sg-glow"><path class="sg-ink" d="M56 102l14-17 14 17zM96 102l14-17 14 17zM54 124q36 24 72 0q-6 20-36 22q-30-2-36-22z"/></g></g>
      <path class="sg-wire" d="M240 132v34"/>
      <g transform="rotate(-4 240 92)">${panel(176,58,128,74,8)}${label(240,90,24,"Même pas")}<text class="sg-text" x="240" y="120" font-size="24" text-anchor="middle">peur <tspan class="sg-t-acc">?</tspan></text></g>
      <g transform="translate(270 24)"><g class="sg-flap"><path class="sg-lin sg-out" d="M0 2c-4-2-6-6-6-10 4 2 4 4 6 4s2-2 6-4c0 4-2 8-6 10zM-4 0c-10-10-22-10-28-2 6 0 8 4 8 8 4-4 10-2 12 2 2-4 6-6 8-8zM4 0c10-10 22-10 28-2-6 0-8 4-8 8-4-4-10-2-12 2-2-4-6-6-8-8z"/></g></g>`)
  },
  // Noël : guirlande, cheminée et chaussettes, sapin, cadeaux ; sapin décoré dont les lumières s'allument, étoile qui luit
  noel: {
    wall: sceneWall(
      `<pattern id="sc-hiver" width="200" height="200" patternUnits="userSpaceOnUse"><path class="sc-line" d="M40 30v16M33 34l14 8M33 42l14-8M150 116v12M145 119l10 6M145 125l10-6"/>
        <circle class="sc-a" cx="110" cy="60" r="3"/><circle class="sc-a" cx="60" cy="150" r="3"/><circle class="sc-a" cx="170" cy="30" r="2.5"/></pattern>
       <pattern id="sc-guirlande" width="80" height="40" patternUnits="userSpaceOnUse"><path class="sc-line" d="M0 6Q40 34 80 6"/><circle class="sc-b sc-out" cx="40" cy="20" r="6"/></pattern>`,
      fill("sc-hiver") + `<rect width="100%" height="40" fill="url(#sc-guirlande)"/>` +
      at("3%","100%",`<g transform="translate(0 -170)"><rect class="sc-b sc-out" y="20" width="170" height="150"/><rect class="sc-b sc-out" x="-10" y="6" width="190" height="18" rx="3"/>
        <path class="sc-a sc-out" d="M35 170V90a50 40 0 0 1 100 0v80z"/><path class="sc-line" d="M50 160h70M58 150h54M0 50h35M135 50h35M0 80h35M135 80h35M0 110h35M135 110h35M0 140h35M135 140h35"/>
        <path class="sc-a sc-out" d="M40 24v28l-10 8a6 6 0 0 0 8 8l14-10V24zM120 24v28l-10 8a6 6 0 0 0 8 8l14-10V24z"/></g>`) +
      at("80%","100%",`<g transform="translate(0 -200)"><path class="sc-a sc-out" d="M60 90l60 80H0z"/><path class="sc-a sc-out" d="M60 40l50 70H10z"/><path class="sc-a sc-out" d="M60 0l40 60H20z"/>
        <rect class="sc-b sc-out" x="50" y="170" width="20" height="30"/><path class="sc-b sc-out" d="M60-14l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/></g>`) +
      at("62%","100%",`<g transform="translate(0 -40)"><rect class="sc-b sc-out" width="44" height="40"/><path class="sc-line" d="M22 0v40M0 16h44"/><rect class="sc-a sc-out" x="50" y="14" width="30" height="26"/><path class="sc-line" d="M65 14v26"/></g>`)),
    sign: sceneSign(180, `<path class="sg-ink sg-out" d="M84 20L130 76H112L146 116H126L162 154H6L42 116H22L56 76H38Z"/><rect class="sg-lin sg-out" x="74" y="154" width="20" height="14"/>
      <path class="sg-lline" d="M58 70q30 14 56 0M44 108q42 18 84 0M30 146q56 16 110 0"/>
      ${[[66,74],[98,76],[52,112],[86,118],[118,112],[40,150],[84,156],[128,150]].map(([x,y],i)=>`<circle class="sg-lamp ${i%2?"sg-surf":"sg-acc"} sg-out" style="animation-delay:${i*.4}s" cx="${x}" cy="${y}" r="6"/>`).join("")}
      <path class="sg-surf sg-out sg-glow" d="M84 2l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z"/>
      <rect class="sg-acc sg-out" x="118" y="140" width="40" height="34" rx="2"/><path class="sg-surf" d="M134 141h8v32h-8z"/>
      <rect class="sg-soft sg-out" x="14" y="150" width="32" height="24" rx="2"/><path class="sg-acc" d="M27 151h6v22h-6z"/>
      <path class="sg-wire" d="M246 120v56"/>${panel(178,42,136,78,8)}${label(246,74,20,"Il reste une")}${label(246,102,20,"place à table")}`)
  },
  // Réveillon : ville de nuit, feux d'artifice au loin ; horloge sur minuit dont l'aiguille avance, coupes de champagne
  reveillon: {
    wall: sceneWall(
      `<pattern id="sc-ciel" width="220" height="220" patternUnits="userSpaceOnUse"><path class="sc-line" d="M30 30v6M27 33h6M150 90v8M146 94h8M90 170v6M87 173h6"/><circle class="sc-a" cx="190" cy="40" r="2"/></pattern>
       <pattern id="sc-ville" width="300" height="600" patternUnits="userSpaceOnUse">${
        [[4,66,150,"b"],[74,56,210,"a"],[134,80,120,"b"],[218,44,180,"a"],[266,30,100,"b"]].map(([x,w,h,c])=>`<rect class="sc-${c} sc-out" x="${x}" y="${600-h}" width="${w}" height="${h}"/>`+
          Array.from({length:Math.floor((h-30)/30)},(_,r)=>`<path class="sc-line" d="M${x+10} ${600-h+20+r*30}h${Math.min(10,w-20)}${w>40?`M${x+w-20} ${600-h+20+r*30}h10`:""}"/>`).join("")).join("")}
        <path class="sc-line" d="M240 420v-30"/></pattern>`,
      fill("sc-ciel") +
      `<g class="hs-wide">${[["8%","22%"],["86%","30%"]].map(([x,y])=>at(x,y,`<path class="sc-line" d="${Array.from({length:12},(_,i)=>{ const a=i*Math.PI/6; return `M${(14*Math.cos(a)).toFixed(1)} ${(14*Math.sin(a)).toFixed(1)}L${(34*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)}`; }).join("")}"/>`)).join("")}</g>` +
      at("78%","9%",`<path class="sc-line" d="${Array.from({length:8},(_,i)=>{ const a=i*Math.PI/4; return `M${(8*Math.cos(a)).toFixed(1)} ${(8*Math.sin(a)).toFixed(1)}L${(20*Math.cos(a)).toFixed(1)} ${(20*Math.sin(a)).toFixed(1)}`; }).join("")}"/>`) +
      at("0","100%",`<rect y="-260" width="4000" height="260" fill="url(#sc-ville)"/>`)),
    sign: sceneSign(176, `<circle class="sg-ink" cx="166" cy="72" r="56"/><circle class="sg-acc sg-out" cx="160" cy="66" r="56"/><circle class="sg-surf sg-out" cx="160" cy="66" r="44"/>
      ${Array.from({length:12},(_,i)=>{ const a=i*Math.PI/6, r1=i%3?36:32; return `<path class="sg-wire" d="M${(160+r1*Math.sin(a)).toFixed(1)} ${(66-r1*Math.cos(a)).toFixed(1)}L${(160+40*Math.sin(a)).toFixed(1)} ${(66-40*Math.cos(a)).toFixed(1)}"/>`; }).join("")}
      <path class="sg-hand" d="M160 66V40"/><g transform="rotate(-6 160 66)"><g class="sg-mid"><path class="sg-hand" d="M160 66V32"/></g></g><circle class="sg-ink" cx="160" cy="66" r="5"/>
      ${[[54,1],[266,-1]].map(([x,d])=>`<g transform="rotate(${12*d} ${x} 100)"><path class="sg-surf sg-out" d="M${x-14} 58h28l-4 42a10 10 0 0 1-20 0z"/><path class="sg-acc" d="M${x-11} 70h22l-3 29a8 8 0 0 1-16 0z"/><path class="sg-wire" d="M${x} 110v34M${x-12} 146h24"/></g>`).join("")}
      <g class="sg-glow"><path class="sg-acc sg-out" d="M108 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM214 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>
      ${panel(90,132,140,34,6)}${label(160,155,17,"Bientôt minuit…")}`)
  },
  // Galette des rois : cuisine, étagères, nappe à carreaux ; galette dorée et couronne qui flotte
  galette: {
    wall: sceneWall(
      `<pattern id="sc-couronnes" width="220" height="220" patternUnits="userSpaceOnUse"><path class="sc-line" d="M40 52V36l8 7 8-11 8 11 8-7v16zM150 150v-12l6 5 6-8 6 8 6-5v12z"/><circle class="sc-a" cx="120" cy="70" r="3"/><circle class="sc-a" cx="60" cy="170" r="2.5"/></pattern>
       <pattern id="sc-vichy" width="28" height="28" patternUnits="userSpaceOnUse"><rect class="sc-a" width="14" height="14"/><rect class="sc-a" x="14" y="14" width="14" height="14"/></pattern>`,
      fill("sc-couronnes") +
      `<g class="hs-wide">${[["5%","38%"],["84%","46%"]].map(([x,y])=>at(x,y,`<rect class="sc-b sc-out" y="54" width="150" height="12" rx="2"/>
        <rect class="sc-a sc-out" x="14" y="10" width="34" height="44" rx="6"/><rect class="sc-b sc-out" x="20" y="2" width="22" height="10" rx="2"/>
        <rect class="sc-a sc-out" x="62" y="22" width="28" height="32" rx="5"/><path class="sc-line" d="M104 54V26h30v28M110 34h18"/>`)).join("")}</g>` +
      at("0","86%",`<rect class="sc-b" width="4000" height="1000"/><rect width="4000" height="1000" fill="url(#sc-vichy)"/><path class="sc-line" d="M0 1h4000"/>`)),
    sign: sceneSign(170, `<ellipse class="sg-ink" cx="116" cy="132" rx="92" ry="34"/>
      <path class="sg-acc sg-out" d="M18 112v16a92 34 0 0 0 184 0v-16"/><ellipse class="sg-acc sg-out" cx="110" cy="112" rx="92" ry="34"/>
      <path class="sg-score" d="M46 104q64-26 128 0M38 116q72-26 144 0M52 128q58-20 116 0M110 80v64"/>
      <g class="sg-float"><path class="sg-surf sg-out" d="M76 76V36l17 15 17-24 17 24 17-15v40z"/><circle class="sg-acc sg-out" cx="93" cy="62" r="4"/><circle class="sg-acc sg-out" cx="110" cy="58" r="4"/><circle class="sg-acc sg-out" cx="127" cy="62" r="4"/></g>
      <path class="sg-wire" d="M262 116v52"/>${panel(212,40,100,76,8)}${label(262,72,21,"Qui aura")}<text class="sg-text" x="262" y="102" font-size="21" text-anchor="middle">la fève <tspan class="sg-t-acc">?</tspan></text>`)
  },
  // Saint-Valentin : papier peint à cœurs, guirlande de cœurs, lettres et roses ; grand cœur qui bat, traversé d'une flèche
  valentin: {
    wall: sceneWall(
      `<pattern id="sc-coeurs" width="120" height="120" patternUnits="userSpaceOnUse"><path class="sc-line" d="M30 42c-4-6-13-3-9 4l9 9 9-9c4-7-5-10-9-4zM90 102c-4-6-13-3-9 4l9 9 9-9c4-7-5-10-9-4z"/><circle class="sc-a" cx="90" cy="30" r="3"/><circle class="sc-a" cx="30" cy="90" r="3"/></pattern>
       <pattern id="sc-fil" width="70" height="44" patternUnits="userSpaceOnUse"><path class="sc-line" d="M0 6Q35 22 70 6"/><path class="sc-b sc-out" d="M35 22c-5-7-15-3-10 5l10 10 10-10c5-8-5-12-10-5z"/></pattern>`,
      fill("sc-coeurs") + `<rect width="100%" height="44" fill="url(#sc-fil)"/>` +
      at("4%","100%",`<g transform="translate(0 -40)"><rect class="sc-b sc-out" width="60" height="40" rx="3"/><path class="sc-line" d="M0 2l30 22 30-22"/><g transform="rotate(-10 90 20)"><rect class="sc-a sc-out" x="62" y="4" width="56" height="36" rx="3"/><path class="sc-line" d="M62 6l28 18 28-18"/></g></g>`) +
      at("80%","100%",`<g transform="translate(0 -120)"><path class="sc-line" d="M30 70V20M40 70l8-46M20 70l-6-44"/><circle class="sc-a sc-out" cx="30" cy="18" r="11"/><circle class="sc-a sc-out" cx="49" cy="24" r="10"/><circle class="sc-a sc-out" cx="13" cy="26" r="10"/>
        <path class="sc-b sc-out" d="M8 70h44l-6 50H14z"/></g>`)),
    sign: (()=>{
      // Flèche de (40,142) à (232,40) : la hampe et l'empennage passent DERRIÈRE le cœur, la pointe ressort devant, dans l'axe
      const A=[40,142], B=[232,40], L=Math.hypot(B[0]-A[0],B[1]-A[1]), u=[(B[0]-A[0])/L,(B[1]-A[1])/L], n=[-u[1],u[0]];
      const pt=(t,k=0)=>`${(A[0]+u[0]*t+n[0]*k).toFixed(1)} ${(A[1]+u[1]*t+n[1]*k).toFixed(1)}`;
      const plume=t=>`M${pt(t)}L${pt(t+14,0)}L${pt(t+4,8)}L${pt(t-8,8)}zM${pt(t)}L${pt(t+14,0)}L${pt(t+4,-8)}L${pt(t-8,-8)}z`;
      return sceneSign(170, `<path class="sg-wire" d="M${pt(0)}L${pt(L-14)}"/><path class="sg-lin sg-out" d="${plume(4)}${plume(18)}"/>
      <g class="sg-beat"><path class="sg-ink" d="M136 162C66 116 60 68 96 56c20-7 34 4 40 18 6-14 20-25 40-18 36 12 30 60-40 106z"/>
        <path class="sg-acc sg-out" d="M130 156C60 110 54 62 90 50c20-7 34 4 40 18 6-14 20-25 40-18 36 12 30 60-40 106z"/><path class="sg-score" d="M92 70q-8 14 0 30"/></g>
      <path class="sg-wire" d="M${pt(L-64)}L${pt(L-14)}"/><path class="sg-ink sg-out" d="M${pt(L)}L${pt(L-20,8)}L${pt(L-16,0)}L${pt(L-20,-8)}z"/>
      <g class="sg-float sg-cupid"><ellipse class="sg-surf sg-out" cx="18" cy="30" rx="13" ry="8" transform="rotate(-30 18 30)"/><ellipse class="sg-surf sg-out" cx="44" cy="26" rx="13" ry="8" transform="rotate(25 44 26)"/>
        <ellipse class="sg-soft sg-out" cx="31" cy="44" rx="11" ry="13"/><circle class="sg-soft sg-out" cx="31" cy="22" r="10"/><path class="sg-score" d="M27 22h.5M35 22h.5M28 27q3 3 6 0"/>
        <path class="sg-wire" d="M50 30q16 16 0 32"/><path class="sg-string" d="M50 30v32"/><path class="sg-acc sg-out" d="M38 46h20l6-4v8l-6-4"/></g>
      <path class="sg-wire" d="M266 120v48"/>${panel(216,48,100,72,8)}${label(266,78,21,"Un cœur")}${label(266,106,21,"pour toi")}`);
    })()
  },
  // Pâques : herbe, œufs cachés, buissons ; panier d'œufs décorés, oreilles de lapin qui frétillent
  paques: {
    wall: sceneWall(
      `<pattern id="sc-paques" width="200" height="200" patternUnits="userSpaceOnUse"><ellipse class="sc-line" cx="40" cy="40" rx="9" ry="12"/><ellipse class="sc-line" cx="150" cy="130" rx="8" ry="11"/>
        ${[[110,60],[50,160]].map(([x,y])=>[0,72,144,216,288].map(a=>`<circle class="sc-a" cx="${(x+6*Math.cos(a*Math.PI/180)).toFixed(1)}" cy="${(y+6*Math.sin(a*Math.PI/180)).toFixed(1)}" r="4"/>`).join("")).join("")}</pattern>
       <pattern id="sc-herbe" width="24" height="400" patternUnits="userSpaceOnUse"><path class="sc-a sc-out" d="M0 400V14l6 10 6-24 6 24 6-10v386z"/></pattern>`,
      fill("sc-paques") +
      `<g class="hs-wide">${[["4%","58%"],["86%","62%"]].map(([x,y])=>at(x,y,`<path class="sc-a sc-out" d="M0 60c0-34 20-50 40-40 10-20 40-20 50 0 20-8 40 8 34 40z"/>`)).join("")}</g>` +
      at("0","91%",`<rect width="4000" height="1000" fill="url(#sc-herbe)"/>`) +
      [["12%"],["46%"],["76%"]].map(([x],i)=>at(x,"97%",`<g transform="translate(0 -26) rotate(${i%2?12:-10} 12 14)"><ellipse class="sc-b sc-out" cx="12" cy="14" rx="12" ry="15"/><path class="sc-line" d="M1 12l5-4 6 4 6-4 5 4"/></g>`)).join("")),
    sign: sceneSign(172, `<g class="sg-flutter"><ellipse class="sg-surf sg-out" cx="62" cy="54" rx="10" ry="32" transform="rotate(-14 62 54)"/><ellipse class="sg-soft" cx="62" cy="56" rx="5" ry="22" transform="rotate(-14 62 56)"/>
        <ellipse class="sg-surf sg-out" cx="96" cy="52" rx="10" ry="32" transform="rotate(12 96 52)"/><ellipse class="sg-soft" cx="96" cy="54" rx="5" ry="22" transform="rotate(12 96 54)"/></g>
      <path class="sg-wire" d="M30 104c0-64 100-64 100 0"/>
      <g transform="rotate(-8 52 92)"><ellipse class="sg-acc sg-out" cx="52" cy="92" rx="15" ry="20"/><path class="sg-score" d="M38 88l7-5 7 5 7-5 7 5"/></g>
      <ellipse class="sg-soft sg-out" cx="80" cy="86" rx="15" ry="20"/><path class="sg-score" d="M66 84h28M68 94h24"/>
      <g transform="rotate(10 108 92)"><ellipse class="sg-lin sg-out" cx="108" cy="92" rx="15" ry="20"/><circle class="sg-acc" cx="103" cy="86" r="3"/><circle class="sg-acc" cx="113" cy="96" r="3"/></g>
      <path class="sg-ink" d="M24 106h120l-12 56H36z" transform="translate(5 5)"/><path class="sg-surf sg-out" d="M20 102h120l-12 56H32z"/><path class="sg-lline" d="M26 118h108M30 134h100M34 150h92"/>
      <path class="sg-wire" d="M240 124v48"/>${panel(172,26,136,98,8)}${label(240,56,20,"La chasse")}${label(240,82,20,"aux œufs")}${label(240,108,20,"est ouverte")}`)
  },
  // Fête des mères : papier peint fleuri, table, vase de tulipes et cadre ; bouquet qui se balance
  meres: {
    wall: sceneWall(
      `<pattern id="sc-fleurettes" width="160" height="160" patternUnits="userSpaceOnUse">${[[40,40],[120,120]].map(([x,y])=>[0,72,144,216,288].map(a=>`<circle class="sc-a" cx="${(x+8*Math.cos(a*Math.PI/180)).toFixed(1)}" cy="${(y+8*Math.sin(a*Math.PI/180)).toFixed(1)}" r="6"/>`).join("")+`<circle class="sc-b" cx="${x}" cy="${y}" r="4"/>`).join("")}
        <path class="sc-line" d="M60 54c10 2 16 8 18 16M100 110c-10-2-16-8-18-16"/></pattern>`,
      fill("sc-fleurettes") +
      at("0","90%",`<rect class="sc-b sc-out" x="-4" width="4000" height="14"/>`) +
      at("6%","90%",`<g transform="translate(0 -96)"><path class="sc-line" d="M30 50V10M20 52L12 18M40 52l8-30"/><path class="sc-a sc-out" d="M22 10q0-12 8-12t8 12q-8 6-16 0zM4 18q0-12 8-12t8 12q-8 6-16 0zM40 22q0-12 8-12t8 12q-8 6-16 0z"/><path class="sc-b sc-out" d="M10 50h40l-6 46H16z"/></g>`) +
      at("78%","90%",`<g transform="translate(0 -70)"><rect class="sc-b sc-out" width="60" height="70" rx="3"/><rect class="sc-a sc-out" x="8" y="8" width="44" height="54"/><path class="sc-line" d="M30 46c-4-6-12-3-8 4l8 8 8-8c4-7-4-10-8-4z"/></g>`)),
    sign: sceneSign(172, `<g class="sg-swing">
      ${[[70,56],[100,40],[130,56]].map(([x,y])=>`<path class="sg-wire" d="M${x} ${y+16}L100 120"/><path class="sg-acc sg-out" d="M${x-13} ${y}q0 20 13 20q13 0 13-20l-6 7-7-9-7 9z"/>`).join("")}
      <path class="sg-lin sg-out" d="M100 118c-28-8-38-28-34-40 14 6 26 20 34 40zM100 118c28-8 38-28 34-40-14 6-26 20-34 40z"/>
      <path class="sg-ink" d="M66 112h80l-40 60z"/><path class="sg-surf sg-out" d="M60 106h80l-40 60z"/><path class="sg-acc sg-out" d="M90 124l10 8 10-8v14l-10-6-10 6z"/></g>
      <path class="sg-wire" d="M254 118v52"/>${panel(196,46,116,72,8)}${label(254,76,22,"Pour toi,")}${label(254,104,22,"maman")}`)
  },
  // Fête des pères : mur en planches, fauteuil et lampe ; médaille qui se balance au bout de son ruban
  peres: {
    wall: sceneWall(
      `<pattern id="sc-planches-h" width="360" height="128" patternUnits="userSpaceOnUse"><rect class="sc-a" width="360" height="62"/><rect class="sc-a" y="64" width="360" height="62"/>
        <path class="sc-line" d="M0 63h360M0 127h360M120 0v62M300 0v62M40 64v62M220 64v62M14 30h40M170 96h50"/><circle class="sc-b" cx="128" cy="31" r="2"/><circle class="sc-b" cx="48" cy="95" r="2"/></pattern>`,
      fill("sc-planches-h") +
      at("4%","100%",`<g transform="translate(0 -120)"><path class="sc-b sc-out" d="M10 120V30a20 20 0 0 1 20-20h80a20 20 0 0 1 20 20v90z"/><path class="sc-a sc-out" d="M0 60h24v60H0zM116 60h24v60h-24z"/><rect class="sc-a sc-out" x="24" y="76" width="92" height="22" rx="4"/></g>`) +
      at("84%","100%",`<g transform="translate(0 -170)"><path class="sc-a sc-out" d="M10 40L22 0h32l12 40z"/><path class="sc-line" d="M38 40v122M22 168h32"/></g>`)),
    sign: sceneSign(172, `<g class="sg-swing"><path class="sg-acc sg-out" d="M78 4h24l20 60h-24z"/><path class="sg-surf sg-out" d="M142 4h-24l-20 60h24z"/>
      <circle class="sg-ink" cx="116" cy="112" r="42"/><circle class="sg-acc sg-out" cx="110" cy="106" r="42"/><circle class="sg-surf sg-out" cx="110" cy="106" r="31"/>
      <path class="sg-acc sg-out" d="M110 84l6 13 14 2-10 10 3 14-13-7-13 7 3-14-10-10 14-2z"/></g>
      <path class="sg-wire" d="M254 118v52"/>${panel(196,46,116,72,8)}${label(254,76,22,"Pour toi,")}${label(254,104,22,"papa")}`)
  },
  // Fête de la musique : portées, guirlande d'ampoules, scène et enceintes ; enceinte qui bat la mesure, notes qui flottent
  musique: {
    wall: sceneWall(
      `<pattern id="sc-portees" width="300" height="220" patternUnits="userSpaceOnUse"><path class="sc-line" d="M0 60q75-14 150 0t150 0M0 70q75-14 150 0t150 0M0 80q75-14 150 0t150 0"/>
        <ellipse class="sc-a" cx="80" cy="150" rx="7" ry="5"/><path class="sc-line" d="M86 150v-26"/><ellipse class="sc-a" cx="220" cy="170" rx="7" ry="5"/><path class="sc-line" d="M226 170v-26l14 6"/></pattern>
       <pattern id="sc-ampoules" width="60" height="40" patternUnits="userSpaceOnUse"><path class="sc-line" d="M0 4Q30 20 60 4"/><circle class="sc-b sc-out" cx="30" cy="20" r="6"/></pattern>`,
      fill("sc-portees") + `<rect width="100%" height="40" fill="url(#sc-ampoules)"/>` +
      at("0","92%",`<rect class="sc-b sc-out" x="-4" width="4000" height="1000"/>`) +
      [["3%"],["83%"]].map(([x])=>at(x,"92%",`<g transform="translate(0 -110)"><rect class="sc-b sc-out" width="70" height="110" rx="4"/><circle class="sc-a sc-out" cx="35" cy="70" r="24"/><circle class="sc-a sc-out" cx="35" cy="26" r="11"/></g>`)).join("")),
    sign: sceneSign(170, `<rect class="sg-ink" x="36" y="24" width="96" height="140" rx="10"/><rect class="sg-surf sg-out" x="30" y="18" width="96" height="140" rx="10"/>
      <circle class="sg-soft sg-out" cx="78" cy="50" r="16"/><circle class="sg-acc" cx="78" cy="50" r="6"/>
      <g class="sg-beat"><circle class="sg-soft sg-out" cx="78" cy="112" r="34"/><circle class="sg-acc sg-out" cx="78" cy="112" r="16"/></g>
      <g class="sg-float"><path class="sg-ink" d="M150 70a8 6 0 1 1-2-1V36l18 6v8l-14-4z"/><path class="sg-ink" d="M168 120a7 5 0 1 1-2-1V94h16v26a7 5 0 1 1-2-1v-18h-12z"/></g>
      <path class="sg-wire" d="M254 118v52"/>${panel(196,46,116,72,8)}${label(254,76,24,"Monte")}<text class="sg-text" x="254" y="106" font-size="24" text-anchor="middle">le son <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Proposer un date : soir en ville (étoiles, lune, toits, réverbère, banc) ; deux tasses qui trinquent, un cœur qui flotte
  date: {
    wall: sceneWall(
      `<pattern id="sc-soir" width="200" height="200" patternUnits="userSpaceOnUse"><path class="sc-line" d="M40 40v8M36 44h8M150 110v6M147 113h6M90 170v8M86 174h8"/><circle class="sc-a" cx="120" cy="50" r="3"/></pattern>
       <pattern id="sc-toits" width="320" height="600" patternUnits="userSpaceOnUse"><path class="sc-a sc-out" d="M0 600V530h60v-26l20-18 20 18v26h50v-40h70v40h40v-64h60V600z"/><path class="sc-line" d="M170 576h12M196 576h12M276 556h10M296 556h10M276 580h10M296 580h10"/></pattern>`,
      fill("sc-soir") +
      at("76%","6%",`<circle class="sc-b sc-out" cx="40" cy="40" r="34"/><circle class="sc-bg" cx="56" cy="30" r="30"/>`) +
      at("0","100%",`<rect y="-160" width="4000" height="160" fill="url(#sc-toits)"/>`) +
      at("7%","100%",`<circle class="sc-a" cx="21" cy="-178" r="32"/><rect class="sc-b sc-out" x="16" y="-180" width="10" height="180"/><path class="sc-b sc-out" d="M6-206h30l-5 28H11z"/>`) +
      at("80%","100%",`<g transform="translate(0 -46)"><rect class="sc-b sc-out" y="-26" width="90" height="10" rx="2"/><rect class="sc-b sc-out" width="90" height="10" rx="2"/><path class="sc-line" d="M10 10v36M80 10v36"/></g>`)),
    sign: sceneSign(170, `${[[38,12,1,"l"],[126,-12,-1,"r"]].map(([x,r,d,c])=>`<g transform="rotate(${r} ${x+29} 110)"><g class="sg-clink-${c}"><rect class="sg-ink" x="${x+6}" y="80" width="58" height="66" rx="8"/><rect class="sg-surf sg-out" x="${x}" y="74" width="58" height="66" rx="8"/>
        <path class="sg-acc sg-out" d="M${x} 84h58v10H${x}z"/><path class="sg-wire" d="${d>0?`M${x} 92h-8a12 12 0 0 0 0 24h8`:`M${x+58} 92h8a12 12 0 0 1 0 24h-8`}"/></g></g>`).join("")}
      ${[[62,0],[164,1.5]].map(([x,d])=>`<g class="sg-rise" style="animation-delay:${d}s"><path class="sg-lline" d="M${x} 60q-6-8 0-16t0-16"/></g>`).join("")}
      <g class="sg-float"><path class="sg-acc sg-out" d="M112 56c-12-10-26-1-17 12l17 15 17-15c9-13-5-22-17-12z"/></g>
      ${petitCoeur(92,40,"sg-acc",.8)}${petitCoeur(134,36,"sg-surf",2.2)}
      <path class="sg-wire" d="M262 114v54"/>${panel(212,40,100,74,8)}${label(262,72,22,"Toi")}<text class="sg-text" x="262" y="102" font-size="22" text-anchor="middle">et moi <tspan class="sg-t-acc">?</tspan></text>`)
  },
  // Mon anniversaire : fanions, confettis, ballons, table et cadeaux ; gâteau aux bougies qui vacillent
  monanniv: {
    wall: sceneWall(
      fanions("sc-fanions-a") + `<pattern id="sc-confettis" width="160" height="160" patternUnits="userSpaceOnUse"><rect class="sc-a" x="30" y="40" width="10" height="5" rx="2" transform="rotate(30 35 42)"/><rect class="sc-a" x="110" y="100" width="10" height="5" rx="2" transform="rotate(-20 115 102)"/><circle class="sc-a" cx="120" cy="30" r="3"/><circle class="sc-a" cx="50" cy="130" r="3"/></pattern>`,
      fill("sc-confettis") + `<rect width="100%" height="50" fill="url(#sc-fanions-a)"/>` +
      [["4%","34%",24],["10%","46%",18],["86%","30%",24],["92%","43%",18]].map(([x,y,r])=>at(x,y,ballon(r))).join("") +
      plateau("88%") + at("12%","88%",`<g transform="translate(0 -40)">${paquet(44,40)}</g>`) + at("70%","88%",`<g transform="translate(0 -30)">${paquet(34,30,"a")}</g>`)),
    sign: sceneSign(170, `${petitBallon(34,150,"sg-acc",0)}${petitBallon(170,146,"sg-soft",1.5)}${gateau(100,162,2,3)}
      ${confettiMontant(54,70,30,0)}${confettiMontant(150,64,-20,.7)}${confettiMontant(72,40,60,1.4)}${confettiMontant(128,34,-50,2.1)}
      <path class="sg-wire" d="M256 114v54"/>${panel(198,40,116,74,8)}${label(256,72,22,"C'est ma")}<text class="sg-text" x="256" y="102" font-size="22" text-anchor="middle">fête <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Un anniversaire en famille : guirlande d'ampoules, papier peint, cadres de famille, table dressée ; gâteau à trois étages
  annivfam: {
    wall: sceneWall(
      ampoules("sc-ampoules-f") + `<pattern id="sc-tapisserie" width="80" height="80" patternUnits="userSpaceOnUse"><rect class="sc-a" width="40" height="80"/><circle class="sc-b" cx="60" cy="40" r="3"/></pattern>`,
      fill("sc-tapisserie") + `<rect width="100%" height="40" fill="url(#sc-ampoules-f)"/>` +
      `<g class="hs-wide">${at("5%","38%",cadre(76,92))}${at("12%","56%",cadre(56,70))}${at("84%","34%",cadre(64,80))}${at("88%","52%",cadre(72,58))}</g>` +
      plateau("86%")),
    sign: sceneSign(170, `${petitBallon(30,152,"sg-soft",.6)}${petitBallon(164,150,"sg-acc",2)}${gateau(96,164,3,4)}
      ${petitCoeur(58,92,"sg-acc",0)}${petitCoeur(136,88,"sg-acc",1)}${petitCoeur(64,52,"sg-surf",2)}${petitCoeur(130,46,"sg-surf",.5)}
      <path class="sg-wire" d="M255 114v54"/>${panel(198,40,114,74,8)}${label(255,72,22,"En")}<text class="sg-text" x="255" y="102" font-size="22" text-anchor="middle">famille <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Être mon témoin : arche fleurie, rangées de chaises de cérémonie ; deux alliances entrelacées qui se balancent, éclats dorés
  temoin: {
    wall: sceneWall(
      `<pattern id="sc-alliances" width="180" height="180" patternUnits="userSpaceOnUse"><circle class="sc-line" cx="40" cy="44" r="7"/><circle class="sc-line" cx="49" cy="44" r="7"/><circle class="sc-a" cx="130" cy="120" r="3"/></pattern>
       <pattern id="sc-chaises" width="56" height="400" patternUnits="userSpaceOnUse"><rect class="sc-b sc-out" x="10" width="36" height="34" rx="4"/><path class="sc-line" d="M14 34v40M42 34v40M10 50h36"/></pattern>`,
      fill("sc-alliances") +
      at("50%","0",`<path class="sc-line" d="M-230 280V150a230 140 0 0 1 460 0v130"/>${Array.from({length:9},(_,i)=>{ const a=Math.PI*(1-i/8); return `<circle class="sc-a sc-out" cx="${(230*Math.cos(a)).toFixed(0)}" cy="${(150-140*Math.sin(a)).toFixed(0)}" r="${i%2?9:12}"/>`; }).join("")}`) +
      at("0","90%",`<rect width="4000" height="400" fill="url(#sc-chaises)"/>`)),
    sign: sceneSign(170, `<g class="sg-swing">${[[88],[132]].map(([x])=>`<circle class="sg-ringo" cx="${x}" cy="104" r="34"/><circle class="sg-ring" cx="${x}" cy="104" r="34"/>`).join("")}
        <path class="sg-ringo" d="M117.4 121A34 34 0 0 1 99.6 136"/><path class="sg-ring" d="M117.4 121A34 34 0 0 1 99.6 136"/>
        <path class="sg-surf sg-out" d="M132 58l11 11-11 13-11-13z"/></g>
      ${eclatMontant(56,60,0)}${eclatMontant(176,56,1)}${eclatMontant(110,40,2)}${eclatMontant(30,110,1.5)}
      ${[[44,30,0],[170,20,1.2],[98,14,2.4]].map(([x,y,d])=>`<g class="sg-fall" style="animation-delay:${d}s"><ellipse class="sg-soft sg-out" cx="${x}" cy="${y}" rx="5" ry="8" transform="rotate(30 ${x} ${y})"/></g>`).join("")}
      <path class="sg-wire" d="M256 114v54"/>${panel(200,40,112,74,8)}${label(256,72,22,"À mes")}<text class="sg-text" x="256" y="102" font-size="22" text-anchor="middle">côtés <tspan class="sg-t-acc">?</tspan></text>`)
  },
  // Une fête surprise : fanions, confettis, canapé et ballons cachés derrière, porte entrouverte ; cadeau dont le couvercle se soulève
  fetesurprise: {
    wall: sceneWall(
      fanions("sc-fanions-s") + `<pattern id="sc-confettis-s" width="150" height="150" patternUnits="userSpaceOnUse"><rect class="sc-a" x="20" y="30" width="10" height="5" rx="2" transform="rotate(-30 25 32)"/><circle class="sc-a" cx="110" cy="100" r="3"/><rect class="sc-a" x="100" y="20" width="9" height="5" rx="2" transform="rotate(40 104 22)"/></pattern>`,
      fill("sc-confettis-s") + `<rect width="100%" height="50" fill="url(#sc-fanions-s)"/>` +
      at("8%","84%",ballon(20)) + at("16%","82%",ballon(16)) +
      at("4%","100%",`<g transform="translate(0 -92)"><rect class="sc-a sc-out" x="20" y="8" width="150" height="44" rx="10"/><path class="sc-b sc-out" d="M0 30a14 14 0 0 1 28 0v30h134V30a14 14 0 0 1 28 0v62H0z"/></g>`) +
      at("82%","100%",`<g transform="translate(0 -180)"><rect class="sc-b sc-out" width="84" height="180"/><path class="sc-a sc-out" d="M0 0l36 14v166H0z"/><circle class="sc-line" cx="70" cy="96" r="4"/></g>`)),
    sign: sceneSign(170, `<rect class="sg-ink" x="56" y="98" width="100" height="68" rx="4"/><rect class="sg-acc sg-out" x="50" y="92" width="100" height="68" rx="4"/><path class="sg-surf sg-out" d="M92 92h16v68H92z"/>
      ${confettiMontant(70,80,30,.2)}${confettiMontant(130,76,-30,.5)}${confettiMontant(90,60,70,.8)}${confettiMontant(116,56,-60,1.1)}${eclatMontant(60,52,.3)}${eclatMontant(144,46,.9)}
      <g class="sg-pop"><rect class="sg-acc sg-out" x="42" y="70" width="116" height="22" rx="4"/><path class="sg-surf sg-out" d="M92 70h16v22H92z"/>
        <path class="sg-surf sg-out" d="M100 70c-22-26-44-4-20 0zM100 70c22-26 44-4 20 0z"/></g>
      <g class="sg-glow"><path class="sg-lin sg-out" d="M28 42l4 8 8 2-6 6 2 8-8-4-8 4 2-8-6-6 8-2zM178 34l4 8 8 2-6 6 2 8-8-4-8 4 2-8-6-6 8-2z"/></g>
      <path class="sg-wire" d="M255 114v54"/>${panel(198,40,114,74,8)}${label(255,72,22,"Pas un")}<text class="sg-text" x="255" y="102" font-size="22" text-anchor="middle">mot <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // L'anniversaire de mon amour : ampoules, petits cœurs, ballons, table ; gâteau en forme de cœur et sa bougie
  annivamour: {
    wall: sceneWall(
      ampoules("sc-ampoules-am") + `<pattern id="sc-petitscoeurs" width="140" height="140" patternUnits="userSpaceOnUse"><path class="sc-a" d="M35 40c-4-6-13-3-9 4l9 9 9-9c4-7-5-10-9-4zM105 110c-3-5-10-2-7 3l7 7 7-7c3-5-4-8-7-3z"/><circle class="sc-a" cx="105" cy="35" r="3"/></pattern>`,
      fill("sc-petitscoeurs") + `<rect width="100%" height="40" fill="url(#sc-ampoules-am)"/>` +
      [["5%","32%",22],["11%","44%",16],["87%","30%",22],["93%","42%",16]].map(([x,y,r])=>at(x,y,ballon(r))).join("") + plateau("90%")),
    sign: sceneSign(170, `${gateau(100,164,2,2)}<path class="sg-wire" d="M100 96V46"/>
      <g class="sg-beat"><path class="sg-ink" d="M103 49c-18-11-21-25-12-30 5-2 10 0 12 5 2-5 7-7 12-5 9 5 6 19-12 30z"/><path class="sg-acc sg-out" d="M100 46c-18-11-21-25-12-30 5-2 10 0 12 5 2-5 7-7 12-5 9 5 6 19-12 30z"/></g>
      ${petitCoeur(38,112,"sg-acc",0)}${petitCoeur(164,104,"sg-surf",1)}${petitCoeur(52,70,"sg-surf",2)}${petitCoeur(150,62,"sg-acc",.5)}
      <g class="sg-glow"><path class="sg-acc sg-out" d="M30 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM172 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>
      <path class="sg-wire" d="M256 114v54"/>${panel(200,40,112,74,8)}${label(256,72,22,"Rien que")}${label(256,102,22,"pour toi")}`)
  },
  // Notre anniversaire de couple : photos-souvenirs accrochées à une ficelle ; calendrier dont une date est entourée d'un cœur qui bat
  couple: {
    wall: sceneWall(
      `<pattern id="sc-photos" width="170" height="120" patternUnits="userSpaceOnUse"><path class="sc-line" d="M0 10Q85 34 170 10"/>${[[50,-6],[125,5]].map(([x,r])=>`<g transform="rotate(${r} ${x} 46)"><rect class="sc-b sc-out" x="${x-22}" y="20" width="44" height="52" rx="2"/><rect class="sc-a" x="${x-17}" y="25" width="34" height="32"/><rect class="sc-a sc-out" x="${x-4}" y="13" width="8" height="12"/></g>`).join("")}</pattern>
       <pattern id="sc-points" width="60" height="60" patternUnits="userSpaceOnUse"><circle class="sc-a" cx="15" cy="15" r="3"/></pattern>`,
      fill("sc-points") + at("0","7%",`<rect width="4000" height="120" fill="url(#sc-photos)"/>`) + `<g class="hs-wide">${at("0","44%",`<rect width="4000" height="120" fill="url(#sc-photos)"/>`)}</g>` +
      plateau("90%") + at("8%","90%",`<g transform="translate(0 -64)">${cadre(52,64)}</g>`)),
    sign: sceneSign(172, `<rect class="sg-ink" x="36" y="36" width="120" height="132" rx="8"/><rect class="sg-surf sg-out" x="30" y="30" width="120" height="132" rx="8"/>
      <path class="sg-acc sg-out" d="M30 38a8 8 0 0 1 8-8h104a8 8 0 0 1 8 8v22H30z"/><path class="sg-wire" d="M62 22v18M118 22v18"/>
      <path class="sg-score" d="${Array.from({length:4},(_,r)=>Array.from({length:5},(_,c)=>`M${41+c*22} ${80+r*22}h10`).join("")).join("")}"/>
      <g class="sg-flip"><path class="sg-soft sg-out" d="M150 136v18a8 8 0 0 1-8 8h-18z"/></g>
      <g class="sg-beat"><path class="sg-hearto" d="M95 134c-15-9-18-21-10-25 4-2 8 0 10 4 2-4 6-6 10-4 8 4 5 16-10 25z"/></g>
      ${petitCoeur(80,104,"sg-acc",0)}${petitCoeur(112,100,"sg-acc",1.2)}
      <g class="sg-swing" style="animation-delay:-1s"><path class="sg-string" d="M172 6v14"/><g transform="rotate(8 172 50)"><rect class="sg-surf sg-out" x="154" y="20" width="36" height="44" rx="2"/><rect class="sg-soft" x="159" y="25" width="26" height="26"/><path class="sg-acc" d="M172 44c-6-4-8-9-4-11 2-1 3 0 4 2 1-2 2-3 4-2 4 2 2 7-4 11z"/><circle class="sg-acc sg-out" cx="172" cy="18" r="4"/></g></g>
      <path class="sg-wire" d="M262 114v54"/>${panel(206,40,108,74,8)}${label(260,72,22,"Notre")}${label(260,102,22,"jour")}`)
  },
  // Un week-end en amoureux : soleil, montagnes, sapins, chalet ; valise dont l'étiquette en cœur se balance
  weekend: {
    wall: sceneWall(
      `<pattern id="sc-monts" width="500" height="600" patternUnits="userSpaceOnUse"><path class="sc-a sc-out" d="M0 600V470L120 340l80 80 110-130 120 140 70-50V600z"/><path class="sc-line" d="M310 290l-24 28 18-4M120 340l-18 22 14-4"/></pattern>
       <pattern id="sc-sapins" width="64" height="600" patternUnits="userSpaceOnUse"><path class="sc-b sc-out" d="M32 470l20 34H40l16 30H8l16-30H12z"/><path class="sc-line" d="M32 534v16"/></pattern>`,
      at("10%","7%",`<circle class="sc-b sc-out" cx="30" cy="30" r="30"/>`) +
      at("0","100%",`<rect y="-330" width="4000" height="330" fill="url(#sc-monts)"/><rect y="-130" width="4000" height="130" fill="url(#sc-sapins)"/>`) +
      at("80%","100%",`<g transform="translate(0 -120)"><path class="sc-b sc-out" d="M10 120V50h100v70z"/><path class="sc-a sc-out" d="M0 54L60 0l60 54z"/><rect class="sc-a sc-out" x="46" y="80" width="28" height="40"/><rect class="sc-a sc-out" x="20" y="64" width="18" height="16"/><path class="sc-line" d="M86 22V6h10v26"/></g>`)),
    sign: sceneSign(170, `<g class="sg-spin"><path class="sg-wire" d="${Array.from({length:8},(_,i)=>{ const a=i*Math.PI/4; return `M${(30+19*Math.cos(a)).toFixed(1)} ${(30+19*Math.sin(a)).toFixed(1)}L${(30+27*Math.cos(a)).toFixed(1)} ${(30+27*Math.sin(a)).toFixed(1)}`; }).join("")}"/></g>
      <circle class="sg-acc sg-out" cx="30" cy="30" r="13"/>
      <g class="sg-fly"><path class="sg-wire" d="M150 26q6-7 12 0q6-7 12 0M178 40q5-6 10 0q5-6 10 0"/></g>
      <g class="sg-roll"><path class="sg-wire" d="M78 70V50a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10v20"/>
        <rect class="sg-ink" x="46" y="76" width="120" height="84" rx="12"/><rect class="sg-acc sg-out" x="40" y="70" width="120" height="84" rx="12"/>
        <path class="sg-surf sg-out" d="M66 70h12v84H66zM122 70h12v84h-12z"/><circle class="sg-ink" cx="60" cy="160" r="5"/><circle class="sg-ink" cx="140" cy="160" r="5"/>
        <g class="sg-swing"><path class="sg-string" d="M150 80l14 18"/><g transform="rotate(14 172 112)"><rect class="sg-surf sg-out" x="156" y="96" width="32" height="34" rx="4"/><path class="sg-acc" d="M172 122c-7-5-9-11-5-13 2-1 4 0 5 2 1-2 3-3 5-2 4 2 2 8-5 13z"/></g></g></g>
      <path class="sg-wire" d="M256 114v54"/>${panel(194,40,124,74,8)}${label(256,72,21,"Rien")}${label(256,102,21,"qu'à deux")}`)
  },
  // Un dîner un peu spécial : salle de restaurant le soir (fenêtres sur la nuit, lustres, tables) ; cloche soulevée sur un cœur, bougies
  dinerspecial: {
    wall: sceneWall(
      `<pattern id="sc-losanges-d" width="60" height="60" patternUnits="userSpaceOnUse"><path class="sc-line" d="M30 18l12 12-12 12-12-12z"/></pattern>
       <pattern id="sc-lustres" width="180" height="110" patternUnits="userSpaceOnUse"><path class="sc-line" d="M90 0v60"/><path class="sc-b sc-out" d="M66 80a24 20 0 0 1 48 0z"/></pattern>
       <pattern id="sc-tables" width="150" height="600" patternUnits="userSpaceOnUse"><path class="sc-b sc-out" d="M20 540h110l10 60H10z"/><path class="sc-line" d="M75 540v-22M60 540v-14M90 540v-14"/></pattern>`,
      fill("sc-losanges-d") + `<rect width="100%" height="110" fill="url(#sc-lustres)"/>` +
      `<g class="hs-wide">${[["5%","32%"],["86%","32%"]].map(([x,y])=>at(x,y,`<path class="sc-a sc-out" d="M0 160V50a45 45 0 0 1 90 0v110z"/><path class="sc-line" d="M45 6v154M0 92h90"/><circle class="sc-b" cx="66" cy="40" r="3"/>`)).join("")}</g>` +
      at("0","100%",`<rect y="-90" width="4000" height="90" fill="url(#sc-tables)"/>`)),
    sign: sceneSign(170, `<ellipse class="sg-surf sg-out" cx="100" cy="134" rx="70" ry="11"/>
      <path class="sg-acc sg-out" d="M100 130c-13-8-15-19-9-22 4-2 7 0 9 3 2-3 5-5 9-3 6 3 4 14-9 22z"/>
      ${petitCoeur(86,118,"sg-acc",.4)}${petitCoeur(114,116,"sg-surf",1.6)}
      <g class="sg-lift"><path class="sg-soft sg-out" d="M50 112a50 44 0 0 1 100 0z"/><circle class="sg-soft sg-out" cx="100" cy="62" r="7"/><path class="sg-score" d="M70 98q10-22 30-26"/></g>
      ${[18,182].map(x=>`<rect class="sg-surf sg-out" x="${x-3}" y="100" width="6" height="44"/><path class="sg-acc sg-out sg-flame" d="M${x} 82q7 9 0 14q-7-5 0-14z"/>`).join("")}
      <g class="sg-glow"><path class="sg-acc sg-out" d="M46 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM156 34l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>
      <path class="sg-wire" d="M256 114v54"/>${panel(194,40,124,74,8)}${label(256,72,21,"Table")}${label(256,102,21,"pour deux")}`)
  },
  // Annoncer une grande nouvelle : rideaux de scène, projecteurs (ordinateur), « ? » au mur ; enveloppe scellée qui frémit, s'ouvre et laisse s'échapper des « ? »
  nouvelle: {
    wall: sceneWall(
      `<pattern id="sc-questions" width="160" height="160" patternUnits="userSpaceOnUse"><path class="sc-line" d="M34 40a8 8 0 1 1 10 7c-3 1-3 3-3 6M41 62v1M114 108a6 6 0 1 1 8 5c-2 1-2 2-2 4M120 124v1"/><circle class="sc-a" cx="120" cy="40" r="3"/></pattern>`,
      fill("sc-questions") +
      `<g class="hs-wide">${at("50%","0",`<path class="sc-b" d="M-330 0h50l140 900h-250zM330 0h-50l-140 900h250z"/>`)}</g>` +
      at("0","0",`<path class="sc-a sc-out" d="M0 0h86q-30 320 10 640q-40 380-96 760z"/><path class="sc-line" d="M28 0q-12 500-20 1400M58 0q-16 340-4 760"/>`) +
      at("100%","0",`<path class="sc-a sc-out" d="M0 0h-86q30 320-10 640q40 380 96 760z"/><path class="sc-line" d="M-28 0q12 500 20 1400M-58 0q16 340 4 760"/>`) +
      plateau("92%")),
    sign: sceneSign(170, `${[[80,0],[118,1.1],[100,2.2]].map(([x,d])=>`<g class="sg-rise" style="animation-delay:${d}s"><text class="sg-text" x="${x}" y="62" font-size="22" text-anchor="middle"><tspan class="sg-t-acc">?</tspan></text></g>`).join("")}
      ${eclatMontant(54,70,.6)}${eclatMontant(150,66,1.7)}
      <g class="sg-shake"><rect class="sg-ink" x="46" y="76" width="120" height="80" rx="6"/><rect class="sg-surf sg-out" x="40" y="70" width="120" height="80" rx="6"/>
        <path class="sg-lline" d="M40 150l46-38M160 150l-46-38"/>
        <g class="sg-open"><path class="sg-soft sg-out" d="M40 72l60 46 60-46z"/></g><circle class="sg-acc sg-out" cx="100" cy="116" r="11"/></g>
      <path class="sg-wire" d="M256 114v54"/>${panel(198,40,116,74,8)}${label(256,72,22,"Devine")}<text class="sg-text" x="256" y="102" font-size="22" text-anchor="middle">quoi <tspan class="sg-t-acc">?</tspan></text>`)
  },
  // Être parrain ou marraine : chambre de bébé (nuages, étoiles, berceau) ; mobile qui se balance au-dessus d'un berceau, cœurs qui montent
  parrain: {
    wall: sceneWall(
      `<pattern id="sc-nuages" width="260" height="200" patternUnits="userSpaceOnUse"><path class="sc-b sc-out" d="M40 60a16 16 0 0 1 28-10a20 20 0 0 1 36 4a14 14 0 0 1 2 28H44a14 14 0 0 1-4-22z"/><path class="sc-line" d="M190 130v10M185 135h10M150 40v6M147 43h6"/><circle class="sc-a" cx="210" cy="60" r="3"/></pattern>`,
      fill("sc-nuages") + plateau("94%") +
      at("6%","94%",`<g transform="translate(0 -110)"><rect class="sc-b sc-out" width="150" height="14" rx="3"/><rect class="sc-b sc-out" y="70" width="150" height="14" rx="3"/><path class="sc-line" d="M14 14v56M34 14v56M54 14v56M74 14v56M94 14v56M114 14v56M134 14v56M6 0v110M144 0v110"/></g>`)),
    sign: sceneSign(172, `<path class="sg-wire" d="M110 0v20"/>
      <g class="sg-swing"><path class="sg-wire" d="M50 22h120"/>
        ${[[56,64,`<path class="sg-acc sg-out" d="M56 48l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z"/>`,0],[90,74,`<path class="sg-soft sg-out" d="M96 60a16 16 0 1 0 0 28a12 12 0 1 1 0-28z"/>`,.8],[130,62,`<path class="sg-surf sg-out" d="M116 70a8 8 0 0 1 14-5a10 10 0 0 1 18 2a7 7 0 0 1 0 14h-28a7 7 0 0 1-4-11z"/>`,1.6],[164,70,`<path class="sg-acc sg-out" d="M164 86c-11-7-13-15-8-18 3-1 6 0 8 3 2-3 5-4 8-3 5 3 3 11-8 18z"/>`,2.4]].map(([x,y,f,d])=>`<g class="sg-float" style="animation-delay:-${d}s"><path class="sg-string" d="M${x} 22V${y-22}"/>${f}</g>`).join("")}</g>
      <path class="sg-wire" d="M62 116v52M154 116v52M78 130v18M93 130v18M108 130v18M123 130v18M138 130v18"/><rect class="sg-surf sg-out" x="56" y="122" width="104" height="10" rx="4"/><rect class="sg-surf sg-out" x="56" y="148" width="104" height="10" rx="4"/><circle class="sg-acc sg-out" cx="62" cy="114" r="5"/><circle class="sg-acc sg-out" cx="154" cy="114" r="5"/>
      ${petitCoeur(40,130,"sg-acc",.4)}${petitCoeur(180,124,"sg-acc",1.8)}
      <path class="sg-wire" d="M262 114v54"/>${panel(206,40,108,74,8)}${label(260,72,22,"Un rôle")}${label(260,102,22,"pour toi")}`)
  },
  // Une baby shower : corde à linge et petits bodies, ballons, table et cadeau ; biberon dont les bulles montent, hochet qui s'agite
  babyshower: {
    wall: sceneWall(
      `<pattern id="sc-linge" width="180" height="110" patternUnits="userSpaceOnUse"><path class="sc-line" d="M0 10Q90 30 180 10"/>${[[40,0],[130,1]].map(([x,i])=>`<path class="sc-b sc-out" d="M${x-15} 22h30l10 10-6 8-6-4v30h-32V36l-6 4-6-8z"/><rect class="sc-a sc-out" x="${x-14}" y="16" width="6" height="10"/><rect class="sc-a sc-out" x="${x+8}" y="16" width="6" height="10"/>`).join("")}</pattern>
       <pattern id="sc-pois" width="70" height="70" patternUnits="userSpaceOnUse"><circle class="sc-a" cx="18" cy="18" r="4"/><circle class="sc-a" cx="52" cy="52" r="3"/></pattern>`,
      fill("sc-pois") + at("0","6%",`<rect width="4000" height="110" fill="url(#sc-linge)"/>`) +
      [["4%","40%",22],["10%","52%",16],["87%","38%",22],["93%","50%",16]].map(([x,y,r])=>at(x,y,ballon(r))).join("") +
      plateau("90%") + at("72%","90%",`<g transform="translate(0 -36)">${paquet(40,36)}</g>`)),
    sign: sceneSign(170, `${[[70,0],[60,.9],[80,1.8]].map(([x,d])=>`<g class="sg-rise" style="animation-delay:${d}s"><circle class="sg-surf sg-out" cx="${x}" cy="30" r="5"/></g>`).join("")}
      <path class="sg-acc sg-out" d="M60 50q10-18 20 0z"/><rect class="sg-acc sg-out" x="54" y="50" width="32" height="10" rx="3"/>
      <rect class="sg-ink" x="52" y="66" width="44" height="94" rx="12"/><rect class="sg-surf sg-out" x="46" y="60" width="44" height="94" rx="12"/>
      <path class="sg-soft" d="M48 110h40v32a10 10 0 0 1-10 10H58a10 10 0 0 1-10-10z"/><path class="sg-score" d="M48 82h12M48 96h12M48 110h12M48 124h12"/>
      <g class="sg-shake"><path class="sg-wire" d="M150 162v-60"/><circle class="sg-acc sg-out" cx="150" cy="82" r="24"/><circle class="sg-surf" cx="142" cy="74" r="5"/><circle class="sg-surf" cx="158" cy="88" r="4"/><circle class="sg-surf sg-out" cx="150" cy="166" r="6"/></g>
      <path class="sg-wire" d="M256 114v54"/>${panel(198,40,116,74,8)}${label(256,72,22,"Bébé")}<text class="sg-text" x="256" y="102" font-size="22" text-anchor="middle">arrive <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Un repas de famille : suspensions, cadres (ordinateur), chaises et longue table dressée ; cocotte fumante dont le couvercle saute
  repasfam: {
    wall: sceneWall(
      `<pattern id="sc-suspensions" width="200" height="130" patternUnits="userSpaceOnUse"><path class="sc-line" d="M100 0v70"/><path class="sc-b sc-out" d="M80 96l8-26h24l8 26z"/></pattern>
       <pattern id="sc-dossiers" width="70" height="600" patternUnits="userSpaceOnUse"><path class="sc-a sc-out" d="M18 600V530a17 17 0 0 1 34 0v70z"/><path class="sc-line" d="M18 560h34"/></pattern>`,
      `<rect width="100%" height="130" fill="url(#sc-suspensions)"/>` +
      `<g class="hs-wide">${at("6%","38%",cadre(70,86))}${at("86%","34%",cadre(60,74))}</g>` +
      at("0","84%",`<rect y="-100" width="4000" height="100" fill="url(#sc-dossiers)"/>`) + plateau("84%") +
      at("30%","84%",`<path class="sc-line" d="M0 0v-14M60 0v-14M120 0v-14M180 0v-14"/>`)),
    sign: sceneSign(170, `${[[84,0],[104,1.2],[124,2.2]].map(([x,d])=>`<g class="sg-rise" style="animation-delay:${d}s"><path class="sg-lline" d="M${x} 66q-6-8 0-16t0-16"/></g>`).join("")}
      <path class="sg-wire" d="M40 110h-16a8 8 0 0 0 0 16h18M160 110h16a8 8 0 0 1 0 16h-18"/>
      <path class="sg-ink" d="M50 106h112v26a30 30 0 0 1-30 30h-52a30 30 0 0 1-30-30z"/><path class="sg-acc sg-out" d="M44 100h112v26a30 30 0 0 1-30 30H74a30 30 0 0 1-30-30z"/>
      <g class="sg-jiggle"><path class="sg-acc sg-out" d="M38 100q62-34 124 0z"/><rect class="sg-surf sg-out" x="90" y="72" width="20" height="10" rx="4"/></g>
      <path class="sg-wire" d="M14 98v66M8 98v18M20 98v18M186 98v66"/><path class="sg-surf sg-out" d="M186 98q10 18 0 34z"/>
      <path class="sg-wire" d="M256 114v54"/>${panel(198,52,116,50,8)}<text class="sg-text" x="256" y="85" font-size="23" text-anchor="middle">À table <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Enterrement de vie de célibataire : piste de danse à damier, boules à facettes (ordinateur) ; boule à facettes qui se balance et scintille, bouteille qui fait sauter son bouchon
  evc: {
    wall: sceneWall(
      `<pattern id="sc-damier" width="56" height="56" patternUnits="userSpaceOnUse"><rect class="sc-a" width="28" height="28"/><rect class="sc-a" x="28" y="28" width="28" height="28"/></pattern>
       <pattern id="sc-etoiles-e" width="150" height="150" patternUnits="userSpaceOnUse"><path class="sc-line" d="M30 30v8M26 34h8M110 100v6M107 103h6"/><circle class="sc-a" cx="110" cy="30" r="3"/></pattern>`,
      fill("sc-etoiles-e") +
      `<g class="hs-wide">${[["12%"],["86%"]].map(([x])=>at(x,"0",`<path class="sc-line" d="M0 0v110"/><circle class="sc-b sc-out" cx="0" cy="140" r="30"/><path class="sc-line" d="M-30 140h60M-26 125h52M-26 155h52M0 110v60M-15 113q-6 27 0 54M15 113q6 27 0 54"/>`)).join("")}</g>` +
      at("0","100%",`<rect y="-150" width="4000" height="150" class="sc-b"/><rect y="-150" width="4000" height="150" fill="url(#sc-damier)"/><path class="sc-line" d="M0-150h4000"/>`)),
    sign: sceneSign(170, `<path class="sg-soft" d="M76 112l-44 54h34zM116 112l44 54h-34z"/>
      <g class="sg-swing"><path class="sg-wire" d="M96 0v32"/><circle class="sg-ink" cx="100" cy="76" r="42"/><circle class="sg-surf sg-out" cx="96" cy="72" r="42"/>
        <path class="sg-score" d="M54 72h84M58 52h76M58 92h76M66 34h60M66 110h60M96 30v84M74 34q-14 38 0 76M118 34q14 38 0 76"/>
        <path class="sg-lin" d="M70 44h12v10H70zM104 60h12v10h-12zM82 84h12v10H82zM112 96h10v8h-10z"/></g>
      <g class="sg-glow"><path class="sg-acc sg-out" d="M34 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM150 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>
      ${eclatMontant(40,110,.4)}${eclatMontant(150,104,1.4)}
      <rect class="sg-ink" x="164" y="96" width="26" height="70" rx="8"/><path class="sg-acc sg-out" d="M160 92h26v70a6 6 0 0 1-6 6h-14a6 6 0 0 1-6-6z"/><rect class="sg-acc sg-out" x="167" y="64" width="12" height="30" rx="3"/><rect class="sg-surf sg-out" x="163" y="118" width="20" height="22" rx="2"/>
      <g class="sg-pop"><rect class="sg-soft sg-out" x="166" y="52" width="14" height="14" rx="3"/></g>
      ${[[173,0],[168,1],[178,2]].map(([x,d])=>`<g class="sg-rise" style="animation-delay:${d}s"><circle class="sg-surf sg-out" cx="${x}" cy="44" r="3"/></g>`).join("")}
      <path class="sg-wire" d="M262 114v54"/>${panel(206,40,108,74,8)}${label(260,72,21,"Dernière")}<text class="sg-text" x="260" y="102" font-size="21" text-anchor="middle">folie <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Pendaison de crémaillère : peinture fraîche, cartons empilés, plante ; maison dont la porte s'ouvre, fumée de cheminée, trousseau de clés qui se balance
  cremaillere: {
    wall: sceneWall(
      `<pattern id="sc-peinture" width="90" height="90" patternUnits="userSpaceOnUse"><rect class="sc-a" width="30" height="90"/><circle class="sc-b" cx="66" cy="44" r="3"/></pattern>`,
      fill("sc-peinture") +
      `<g class="hs-wide">${at("84%","34%",`<rect class="sc-b sc-out" width="90" height="110" rx="4"/><path class="sc-line" d="M45 0v110M0 55h90"/>`)}</g>` +
      plateau("92%") +
      at("5%","92%",`<g transform="translate(0 -96)">${paquet(70,46)}<g transform="translate(10 46)">${paquet(80,50,"a")}</g><g transform="translate(22 -38)">${paquet(46,38,"a")}</g></g>`) +
      at("78%","92%",`<path class="sc-a sc-out" d="M20-40c-14-12-18-30-4-38 6 10 8 24 4 38zm0 0c12-14 28-16 34-4-10 6-20 8-34 4z"/><path class="sc-b sc-out" d="M2-40h40l-5 40H7z"/>`)),
    sign: sceneSign(172, `${[[72,0],[66,1.3]].map(([x,d])=>`<g class="sg-rise" style="animation-delay:${d}s"><path class="sg-lline" d="M${x} 34q-6-8 0-16t0-16"/></g>`).join("")}
      <rect class="sg-acc sg-out" x="60" y="34" width="16" height="30"/>
      <path class="sg-ink" d="M50 86v80h112V86z"/><path class="sg-surf sg-out" d="M44 80v80h112V80z"/><path class="sg-acc sg-out" d="M32 84l68-58 68 58z"/>
      <rect class="sg-soft sg-out" x="56" y="98" width="28" height="24"/><path class="sg-score" d="M70 98v24M56 110h28"/>
      <rect class="sg-ink" x="104" y="110" width="34" height="50"/><g class="sg-door"><rect class="sg-soft sg-out" x="104" y="110" width="34" height="50"/><circle class="sg-acc" cx="130" cy="136" r="3"/></g>
      <path class="sg-acc sg-out" d="M100 72c-9-6-11-14-6-16 3-1 5 0 6 2 1-2 3-3 6-2 5 2 3 10-6 16z"/>
      <g class="sg-swing"><path class="sg-string" d="M16 70v20"/><circle class="sg-wire" cx="16" cy="98" r="8"/>
        <circle class="sg-acc sg-out" cx="10" cy="118" r="8"/><path class="sg-acc sg-out" d="M7 124h6v32H7zM13 144h6v4h-6zM13 151h6v4h-6z"/><circle class="sg-surf sg-out" cx="24" cy="116" r="7"/><path class="sg-surf sg-out" d="M21 122h6v26h-6zM27 136h5v4h-5z"/></g>
      <path class="sg-wire" d="M261 114v54"/>${panel(202,40,118,74,8)}${label(261,72,19,"Bienvenue")}<text class="sg-text" x="261" y="102" font-size="19" text-anchor="middle">chez moi <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Une soirée : guirlande d'ampoules, petits disques, table et verres ; platine dont le disque tourne, notes qui s'envolent
  soiree: {
    wall: sceneWall(
      ampoules("sc-ampoules-s") + `<pattern id="sc-disques" width="150" height="150" patternUnits="userSpaceOnUse"><circle class="sc-line" cx="40" cy="40" r="12"/><circle class="sc-a" cx="40" cy="40" r="4"/><circle class="sc-a" cx="115" cy="110" r="3"/></pattern>`,
      fill("sc-disques") + `<rect width="100%" height="40" fill="url(#sc-ampoules-s)"/>` + plateau("90%") +
      at("10%","90%",`<path class="sc-b sc-out" d="M0 0v-40h10v-12h6v12h10V0zM40 0l-6-30h20l-6 30zM70 0l-6-30h20l-6 30z"/>`)),
    sign: sceneSign(170, `<rect class="sg-ink" x="36" y="76" width="140" height="84" rx="10"/><rect class="sg-surf sg-out" x="30" y="70" width="140" height="84" rx="10"/>
      <g class="sg-spin"><circle class="sg-ink sg-out" cx="88" cy="112" r="36"/><circle class="sg-lline" cx="88" cy="112" r="26"/><circle class="sg-lline" cx="88" cy="112" r="17"/><circle class="sg-acc sg-out" cx="88" cy="112" r="10"/><circle class="sg-surf" cx="80" cy="106" r="3"/></g>
      <circle class="sg-soft sg-out" cx="150" cy="86" r="7"/><path class="sg-wire" d="M150 86l-6 32-14 8"/><circle class="sg-soft sg-out" cx="156" cy="138" r="6"/>
      ${[[40,0],[120,1],[66,2]].map(([x,d])=>`<g class="sg-rise" style="animation-delay:${d}s"><path class="sg-acc sg-out" d="M${x} 56a7 5 0 1 1-2-1V30l12 4v6l-10-3z"/></g>`).join("")}
      <path class="sg-wire" d="M256 114v54"/>${panel(198,40,116,74,8)}${label(256,72,22,"On")}<text class="sg-text" x="256" y="102" font-size="22" text-anchor="middle">danse <tspan class="sg-t-acc">?</tspan></text>`)
  },
  // Un week-end ou un voyage : carte au trésor (pointillés, croix, boussole), palmier ; globe qui oscille, avion qui fait le tour
  voyage: {
    wall: sceneWall(
      `<pattern id="sc-carte" width="280" height="240" patternUnits="userSpaceOnUse"><path class="sc-a" d="M30 60c20-24 70-20 80 4 6 18-20 30-44 26-24-4-46-12-36-30zM170 160c16-20 60-18 70 4 4 16-24 26-44 20-20-6-34-10-26-24z"/>
        <path class="sc-line sc-dash" d="M110 70q40 30 60 90"/><path class="sc-line" d="M176 154l10 10M186 154l-10 10M240 40v20M230 50h20"/></pattern>`,
      fill("sc-carte") + plateau("94%") +
      at("82%","94%",`<path class="sc-b sc-out" d="M30 0q-4-80 6-130l8 2q-8 60-4 128z"/><path class="sc-a sc-out" d="M38-128c-20-14-46-10-56 2 20 2 38 4 56-2zM38-128c18-18 46-16 56-4-20 4-38 6-56 4zM38-128c-6-20 6-40 22-44-2 18-10 34-22 44zM38-128c-16-16-14-38-2-46 6 16 6 32 2 46z"/>`)),
    sign: sceneSign(172, `<path class="sg-wire" d="M42 100a52 52 0 0 0 96 28M90 152v12M64 166h52"/>
      <g class="sg-swing"><circle class="sg-ink" cx="94" cy="104" r="46"/><circle class="sg-surf sg-out" cx="90" cy="100" r="46"/>
        <path class="sg-lin sg-out" d="M62 80c10-12 30-10 34 2 2 10-10 16-22 14-12-2-18-6-12-16zM96 118c8-10 26-8 30 2 2 8-10 14-20 12-10-2-16-6-10-14z"/><path class="sg-score" d="M44 100h92M90 54v92M60 66q-16 34 0 68M120 66q16 34 0 68"/></g>
      <path class="sg-lline sg-dashed" d="M30 40q60-36 130 0"/>
      <g class="sg-fly"><path class="sg-acc sg-out" d="M144 22l-4-10h8l7 10z"/><path class="sg-surf sg-out" d="M140 22h40q9 0 9 5t-9 5h-40z"/><path class="sg-acc sg-out" d="M158 27l-12 15h9l16-15z"/><path class="sg-score" d="M166 25h2M172 25h2M178 25h2"/></g>
      <path class="sg-wire" d="M256 114v54"/>${panel(198,40,116,74,8)}${label(256,72,22,"En")}<text class="sg-text" x="256" y="102" font-size="22" text-anchor="middle">route <tspan class="sg-t-acc">!</tspan></text>`)
  },
  // Une journée surprise : tickets mystère au mur, soleil, table et cadeau ; trois cartes « ? » qui se retournent l'une après l'autre, soleil qui tourne
  journeesurprise: {
    wall: sceneWall(
      `<pattern id="sc-tickets" width="180" height="160" patternUnits="userSpaceOnUse"><g transform="rotate(-8 50 50)"><rect class="sc-b sc-out" x="24" y="34" width="56" height="30" rx="4"/><path class="sc-line" d="M64 34v30M42 44a5 5 0 1 1 6 4v3M45 56v1"/></g><circle class="sc-a" cx="140" cy="120" r="4"/></pattern>`,
      fill("sc-tickets") + at("80%","7%",`<circle class="sc-b sc-out" cx="30" cy="30" r="28"/>`) + plateau("90%") +
      at("12%","90%",`<g transform="translate(0 -40)">${paquet(44,40)}</g>`)),
    sign: sceneSign(170, `<g class="sg-spin"><path class="sg-wire" d="${Array.from({length:8},(_,i)=>{ const a=i*Math.PI/4; return `M${(176+17*Math.cos(a)).toFixed(1)} ${(30+17*Math.sin(a)).toFixed(1)}L${(176+24*Math.cos(a)).toFixed(1)} ${(30+24*Math.sin(a)).toFixed(1)}`; }).join("")}"/></g><circle class="sg-acc sg-out" cx="176" cy="30" r="11"/>
      ${[[34,0],[84,1],[134,2]].map(([x,d],i)=>`<g transform="rotate(${(i-1)*6} ${x+21} 120)"><rect class="sg-ink" x="${x+4}" y="${78+4}" width="42" height="60" rx="6"/><g class="sg-turn" style="animation-delay:${d}s"><rect class="sg-surf sg-out" x="${x}" y="78" width="42" height="60" rx="6"/><rect class="sg-soft" x="${x+5}" y="83" width="32" height="50" rx="3"/><text class="sg-text" x="${x+21}" y="118" font-size="30" text-anchor="middle"><tspan class="sg-t-acc">?</tspan></text></g></g>`).join("")}
      <path class="sg-wire" d="M258 114v54"/>${panel(198,40,120,74,8)}${label(258,72,18,"Programme")}${label(258,102,18,"secret")}`)
  },
  // Un voyage surprise : hall d'aéroport (baies vitrées et avions, ordinateur), avions au mur ; tableau des départs dont les lettres tournent, étiquette de valise qui se balance
  voyagesurprise: {
    wall: sceneWall(
      `<pattern id="sc-avions" width="200" height="180" patternUnits="userSpaceOnUse"><path class="sc-a" d="M30 60l40-8 6 5-18 10 12 12-5 4-18-9-16 7-4-4 10-10z"/><circle class="sc-line" cx="150" cy="130" r="3"/></pattern>`,
      fill("sc-avions") +
      `<g class="hs-wide">${[["4%"],["84%"]].map(([x])=>at(x,"30%",`<rect class="sc-b sc-out" width="120" height="150" rx="6"/><path class="sc-line" d="M40 0v150M80 0v150"/><path class="sc-a" d="M20 60l50-10 8 6-22 12 14 14-6 5-22-11-20 9-5-5 12-12z"/>`)).join("")}</g>` +
      plateau("92%") + at("74%","92%",`<g transform="translate(0 -60)"><rect class="sc-b sc-out" width="44" height="60" rx="8"/><path class="sc-line" d="M12 0v-16h20v16M14 60v8M30 60v8"/></g>`)),
    sign: sceneSign(170, `<rect class="sg-ink" x="30" y="40" width="150" height="90" rx="8"/><rect class="sg-surf sg-out" x="24" y="34" width="150" height="90" rx="8"/>
      <path class="sg-acc sg-out" d="M24 42a8 8 0 0 1 8-8h134a8 8 0 0 1 8 8v12H24z"/><path class="sg-surf" d="M40 40l10-2 2 2-5 3 3 3-2 1-4-2-4 2-1-1 3-3z"/>
      ${[0,1,2,3].map(i=>`<g class="sg-turnv" style="animation-delay:${i*.4}s"><rect class="sg-soft sg-out" x="${38+i*32}" y="66" width="26" height="40" rx="3"/><path class="sg-score" d="M${38+i*32} 86h26"/><text class="sg-text" x="${51+i*32}" y="96" font-size="24" text-anchor="middle"><tspan class="sg-t-acc">?</tspan></text></g>`).join("")}
      <g class="sg-swing"><path class="sg-string" d="M150 124v14"/><g transform="rotate(10 150 150)"><rect class="sg-acc sg-out" x="132" y="138" width="36" height="26" rx="4"/><circle class="sg-surf sg-out" cx="140" cy="151" r="3"/><path class="sg-score" d="M148 146h14M148 156h10"/></g></g>
      <path class="sg-wire" d="M258 114v54"/>${panel(196,40,122,74,8)}${label(257,72,19,"Destination")}${label(257,102,19,"secrète")}`)
  }
});
for(const sc of Object.values(SCENES)){ sc.sign=sepText(sc.sign); sc.wall=sepText(sc.wall); }
oseLoaded("scenes", "ad35c435a6");
