---
name: ose-design
description: Identité visuelle et ton d'Ose Demander (couleurs des 7 thèmes, contours épais et ombres décalées, billet, enveloppe, motifs, typographie Bricolage Grotesque / Caveat, trois niveaux d'animation, accessibilité, textes tutoyés et neutres). À charger AVANT toute création ou modification d'interface, de style, d'animation ou de texte visible dans index.html ou mentions-legales.html (intro scénarisée, « Partager la surprise », nouveaux écrans, boutons, messages). Prime sur les conseils de design génériques.
---

# Design d'Ose Demander

Ose Demander a déjà une identité forte : **papier découpé, BD, jeu**. Tout ce qui s'ajoute doit avoir l'air d'avoir toujours été là. On **réutilise** les variables, les classes et les gestes existants de `index.html` ; on n'invente pas un second style. Ce skill décrit l'existant (relevé dans `index.html`, octobre 2026) : en cas de doute, c'est le code qui fait foi, et on met ce skill à jour.

## 1. Couleurs : uniquement les variables des thèmes

Chaque thème redéfinit les mêmes variables CSS (`:root` = thème « base », puis `[data-theme="…"]`). **Ne jamais écrire une couleur en dur** dans un nouveau composant : toujours `var(--…)`.

| Variable | Rôle |
|---|---|
| `--bg` | fond de page (porte aussi `--pattern`) |
| `--surface` | cartes, billet, boutons secondaires |
| `--ink` | texte, **contours et ombres** |
| `--muted` | texte secondaire, indications, liens discrets |
| `--line` | bordures douces, pointillés, éléments verrouillés |
| `--accent` | **remplissages et décors** : enveloppe, pastilles du programme, barre de progression, « ? » du logo, décor animé |
| `--accent-btn` | fond des boutons qui portent du texte (Oui, `.btn.primary`, `.install`, pastille de compteur) : ≥ 4,5:1 avec `--accent-ink` |
| `--accent-ink` | texte posé sur `--accent-btn` |
| `--accent-text` | **texte, liens, compte à rebours, contour de focus, bordure de champ actif** : ≥ 4,5:1 sur `--bg`, `--surface` et `--soft` |
| `--accent-seal` | initiale du sceau, posée sur `--ink` (grand texte gras : ≥ 3:1) |
| `--soft` | fond des champs, puces, encadrés |

| Thème (`th`) | Nom affiché | `--bg` | `--ink` | `--accent` | `--accent-text` | `--accent-btn` | `--accent-seal` | Motif de fond |
|---|---|---|---|---|---|---|---|---|
| `base` | Lilas | #ECE6FF | #1F1546 | #E83F86 | #C9196D | #D82D79 | = accent | points d'interrogation |
| `amour` | Amour | #FFE4EC | #4B0F2E | #D9245F | #CE1257 | = accent | = accent | cœurs |
| `maman` | Pétales | #FFEBDD | #5A2416 | #E0592F | #C23D09 | #CE491C | = accent | fleurs |
| `papa` | Cravate | #E3EAF6 | #14254A | #D99A1E (texte des boutons #14254A) | #8C6101 | = accent | = accent | rayures de cravate |
| `amis` | Pop | #FFF2B3 | #22200F | #2F5BFF | = accent | = accent | = accent | bulles |
| `fete` | Confettis | #E6F6EF | #10372B | #F2484B | #D32532 | #DE333B | = accent | confettis |
| `mystere` | Mystère | #1C1838 (surface #29234D) | #F2EEFF | #FFC94A (texte des boutons #1C1838) | = accent | = accent | #AF8406 | étoiles — **seul thème sombre** |

Les variantes viennent de `readable(couleur, fonds, seuil)` : même teinte (OKLCH), plus foncée sur fond clair, plus claire sur fond sombre, juste assez pour atteindre le seuil (inchangée si elle l'atteint déjà). Les valeurs CSS des thèmes sont écrites en dur et **le banc vérifie qu'elles égalent ce calcul** ; la table `THEMES` (JS) reprend `--bg`, `--surface`, `--soft`, `--ink`. Nouveau thème = ajouter ses 3 variantes (calculées avec `readable`) et ses valeurs dans `THEMES`.

- **Couleurs d'accent facultatives** (`ACCENTS` : framboise, corail, mandarine, or, menthe, océan, violet, nuit) : appliquées par `setTheme` via `accentVars(thème, accent)`, **seulement si `accentOk`** (contraste ≥ 3:1 avec le fond et la surface du thème). `accentVars` calcule les 5 variables (`--accent`, `--accent-ink` choisi par `accentInk`, `--accent-text`, `--accent-btn`, `--accent-seal`) avec `readable`. Toute nouvelle couleur d'accent passe par cette table : le banc vérifie chaque combinaison thème × accent.
- **Motifs de fond** : SVG en `data:` dans `--pattern`, très transparents (opacité 0,07 à 0,35), petites formes du thème répétées. La **scène illustrée** du thème les remplace partout sauf sur « Mes invitations » (§ 2 bis). Un nouveau thème = un nouveau motif **et** une nouvelle scène dans le même esprit.
- **Exceptions existantes** (ne pas multiplier) : erreurs `#B3122E` sur `#FFE3E8` (variante sombre pour les thèmes sombres : `mystere`, `halloween`, `reveillon`), voile des feuilles `rgba(20,14,50,.45)`, surlignage de révélation doré `rgba(255,201,74,.5)` (l'accent de Mystère).
- Toujours vérifier le rendu dans **tous les thèmes** (les 7 permanents et les 9 de saison, § 2 ter), et en particulier les **thèmes sombres** Mystère, Halloween et Réveillon (`--surface` n'y est pas blanc ; dans `THEMES`, un thème sombre a un champ `s`).

## 2. Formes : contours épais, ombres décalées, boutons qui s'enfoncent

C'est la signature : **bordure pleine `2px solid var(--ink)` + ombre dure décalée `Xpx Xpx 0 var(--ink)`** (aucun flou, aucun dégradé).

| Élément | Bordure | Rayon | Ombre |
|---|---|---|---|
| Billet `.ticket` | 2px `--ink` | 22px | 8px 8px 0 |
| Enveloppe `.env-back` | 2px `--ink` | 12px | 8px 8px 0 |
| Panneau `.panel`, feuille `.sheet-card` | 2px `--ink` | `--r` (18px) / 20px | 6px 6px 0 |
| Carte d'accueil `.home-card` | 2px `--ink` | `--r` | 4px 4px 0 |
| Bouton Oui `.yes` (fond `--accent-btn`) | 2px `--ink` | 16px | 4px 4px 0 |
| Bouton principal `.btn.primary` (fond `--accent-btn`) | 2px `--ink` | 14px | 3px 3px 0 |
| Option choisie (`.optcard`, `.tpl`) | 2px `--ink` | 14px | 3px 3px 0 |
| Pastilles d'en-tête (`.hist-btn`, `.install`) | 2px `--ink` | 999px | 2px 2px 0 |
| Champs, puces, encadrés | 2px `--line` | 12–14px / 999px | aucune |

- **Bouton qui s'enfonce** : `:active{transform:translate(2px,2px)}` et l'ombre diminue d'autant (`3px` → `1px`, `4px` → `2px`), transition `.1s`. Tout nouveau bouton cliquable fait pareil.
- **Hiérarchie** : principal = `--accent-btn` + ombre ; secondaire = `--surface` (`.btn`) ; tertiaire = `.btn.ghost` transparent ; discret = lien souligné `--muted` (`.cal-alt`, `.linkbtn`) avec `text-underline-offset:3px`, ou pastille discrète (`.refuse` : texte atténué, bordure `--line`, 44 px) quand l'action est essentielle.
- **Une seule action principale par écran** (`.btn.primary`, le Oui `.yes`, `.install`) : c'est ce que la personne doit faire maintenant. Tout le reste est secondaire, tertiaire ou discret. Quand l'action principale change (ex. le lien est créé : « Créer mon lien » s'efface au profit de « Partager le lien » / « Copier le lien »), l'ancienne disparaît. Le banc compte les actions principales de chaque écran (section « Écrans »).
- **Pointillés** `2px dashed var(--line)` : séparations douces, zones facultatives (`.adv`, `.tip`, `.sec`, `.privacy` en `--ink`).
- **Billet** : talon « De / Pour » (`.stub`), perforation en pointillés avec deux demi-cercles découpés (`.perf::before/::after`, couleur `--bg`), corps centré (`.main`). Pour un nouvel écran côté personne invitée, **réutiliser `ticketHTML(inner)`** plutôt que recréer une carte.
- **Enveloppe** : rabat qui pivote (`rotateX(180deg)`), papier qui sort avec « Pour {prénom} » en Caveat, sceau rond (`.seal`) en `--ink` portant l'emoji ou l'initiale.
- Cadre de la page invitation : `max-width:480px`, création : `600px`. Pensé d'abord pour le **téléphone** (règles `max-width:460px`, zones sûres `env(safe-area-inset-*)`).

## 2 bis. Scènes illustrées (fond des écrans de la personne invitée)

Chaque thème a une scène (`SCENES` dans `index.html`), affichée sur l'enveloppe, la question, l'écran après le Oui et la carte du rappel. Elle remplace le motif de fond du thème.

**Côté création** (`setTheme(…, scene)` : `true` = entière, `"dim"` = atténuée, `false` = aucune) :
- **Accueil** : sa **propre scène** (`HOME_SCENE`, `setTheme(…, "home")`, classe `scene-home`), sur l'idée d'envoyer une demande : motif de « ? », de cœurs et d'enveloppes (`sc-courrier`), enveloppes qui volent avec trajets en pointillés (`.sc-dash`), boîte aux lettres en bas (≥ 88 %). Décor de fond seulement, ton sur ton, dans les couleurs du thème en cours, sans élément vedette : le **mini-billet reste l'élément principal**. Les éléments des côtés sont dans `.hs-wide`, masqués sous 640 px (**téléphone** : motif, boîte aux lettres et une enveloppe). Petites formes agrandies : `vector-effect="non-scaling-stroke"` pour garder des traits de 2 px au plus.
  - **Couleur de la catégorie** (`tintScene(thème)`) : au survol (souris), au focus, ou 0,9 s au toucher d'une carte de catégorie, la scène prend la couleur d'accent de cette catégorie : voile `.hs-tint` à **9 %** au plus (au-delà, le texte atténué de Pétales passe sous 4,5:1 avec le voile Amour, le banc le vérifie pour les 7 thèmes × 4 catégories) et contours fins (`.sc-line`, `.sc-out`) à cette couleur. Transition de 0,35 s, coupée par « moins de mouvement ».
- **Étapes 1 à 3** (saisie) : scène **atténuée** (`#scene.dim` : le décor à 40 % d'opacité sur `--bg`, sans flou, coûteux). Le banc vérifie l'encre et le texte atténué ≥ 4,5:1 sur ces surfaces atténuées.
- **Étape 4 (aperçu)** : scène **entière** en fond, et dans l'aperçu une **scène encadrée** (`.pv-stage`) : décor de fond, élément vedette, billet, exactement comme la personne invitée les verra (animation de l'élément vedette selon le réglage de l'invitation, immobile en « Aucune » et avec « moins de mouvement »).
- **Changement en direct** : tout choix de modèle, d'occasion ou de thème réaffiche l'écran, donc la scène change aussitôt.
- **Miniatures** (`sceneMini(thème)`, classes `.thumb` / `.mini` / `.mini-sign`) : en haut de chaque carte de catégorie de l'accueil (thème du premier modèle de la catégorie, champ `theme` de `HOME_CATS`) et de chaque carte de modèle (« Partir de zéro » : Lilas). Échantillon **immobile** (aucune classe `anim-*`), dans les couleurs de son propre thème grâce à `data-theme` sur `.mini` (d'où le sélecteur `:root,[data-theme]` : toute miniature repart des valeurs de base, puis son thème les remplace ; sans lui, une miniature Amour dans une page Mystère prenait la surface sombre de Mystère). Aucun texte de l'interface ne passe dessus : il est sous la miniature, sur `--surface` ou `--soft`.
- **Identifiants** : un décor posé une seconde fois dans la page (aperçu, miniatures) passe par `sceneWallCopy(thème)`, qui préfixe ses motifs (`id="sN-sc-…"`) ; sinon `url(#sc-…)` irait chercher le motif d'une autre scène. Le banc refuse les identifiants en double.
- **« Mes invitations »** : pas de scène (motif Lilas).

| Thème | Décor de fond (ton sur ton) | Élément vedette | Animation (Normales / Discrètes) |
|---|---|---|---|
| Lilas | papier peint à rayures, étagère avec tasse, cadre, plante (en bas) | pancarte suspendue « Une question pour toi ? » | balancement ±2° / ±0,8° |
| Amour | façade de café en planches, deux fenêtres (à mi-hauteur) | enseigne « Le café des rendez-vous », lampions, store rayé | lampions qui s'allument l'un après l'autre / aucune |
| Pétales | grandes fleurs en papier, clôture basse (en bas) | pot de fleurs et étiquette « Pour toi » | la fleur s'ouvre une fois / plus lentement |
| Cravate | papier peint à losanges, lambris (en bas) | horloge murale et plaque « C'est l'heure ? » | trotteuse qui avance / aucune |
| Pop | mur de briques claires, affiches | bulle de BD « Tu viens ? », étoile, affiche scotchée | l'affiche frémit / plus doucement |
| Confettis | rideau de scène, lambrequin (en haut) | banderole « C'est la fête », fanions, ballons | ballons qui flottent / plus doucement |
| Mystère | mur de briques sombres | enseigne néon « Chut… c'est une surprise » (Bricolage, halo en aplat) | scintillement doux / respiration lente |

Les 9 thèmes de saison ont aussi leur scène : voir § 2 ter.

- **Deux couches.** Le **décor de fond** (`sceneWall`, couche fixe `#scene`, sous le décor animé) est **ton sur ton** : grandes surfaces en `--bg`, `--soft`, `--surface` (`.sc-bg`, `.sc-a`, `.sc-b`), `--line` seulement en traits fins de 2 px au plus (`.sc-line`, `.sc-out`), grain léger (`#sc-grain`). Ni accent, ni encre : du texte peut passer dessus (titre de l'enveloppe, indications), il doit rester lisible (encre et texte atténué ≥ 4,5:1 sur chaque surface, vérifié par le banc). L'**élément vedette** (`sceneSign`, classe `.scene-sign`) est placé **dans la page**, au-dessus de l'enveloppe ou du billet : aucun texte ne passe jamais dessous. C'est lui qui porte la couleur, les contours épais à l'encre (`.sg-out`, 3 px), l'ombre décalée (`panel()`) et l'animation.
- **Textes des éléments vedettes** : courts, tutoyés, neutres, sans « → » ni « · », sans information qui pourrait contredire l'invitation (pas d'heure ni de lieu : « Ce soir, peut-être ? » a été écarté pour cette raison). Classe `.sg-text` (Bricolage Grotesque 800, encre) sur un panneau `--surface` ; un « ? » coloré en `.sg-t-acc` (`--accent-text`). Caveat interdite (ce n'est pas de l'écriture à la main).
- **Placement du décor** : les éléments marquants vont en bas (≥ 88 % de la hauteur), en haut (lambrequin) ou sur les côtés à mi-hauteur (derrière l'enveloppe ou le billet), pour ne pas passer sous le titre ni la mention de sécurité. Motifs en pixels réels (`patternUnits="userSpaceOnUse"`), éléments isolés placés en pourcentage de l'écran avec `at(x, y, …)` : même taille sur téléphone et ordinateur.
- **Animations** : uniquement sur l'élément vedette, sous `.scene-sign.anim-n` / `.anim-d` ; aucune dans le décor de fond (motifs SVG : coûteux et peu fiables), ni dans les miniatures, aucune balise `<animate>`. Immobile en « Aucune » et avec « moins de mouvement ». Le décor animé (canvas `#decor`) passe toujours par-dessus la scène (`#scene` vient avant lui dans la page).
- **Poids** : moins de 8 000 caractères par scène, 140 000 au total ; surtout, `index.html` compressé (gzip, ce que GitHub Pages envoie) reste **sous 150 Ko** (vérifié par le banc ; au-delà, scènes en fichiers séparés) ; aucune image, aucune couleur écrite dans le SVG (classes CSS uniquement).
- **Contrôle visuel** : le banc ne voit pas le rendu. Faire des captures avec Edge sans fenêtre, à **520 px** de large (en dessous, Edge garde une fenêtre d'environ 500 px et la capture coupe la page) et en animations « Aucune » pour un rendu stable :
  `msedge --headless=new --disable-gpu --hide-scrollbars --user-data-dir=<dossier temporaire> --window-size=520,1040 --virtual-time-budget=3000 --screenshot=<fichier.png> <lien>` (la carte s'ouvre directement avec un lien de rappel, `reminderData`).

## 2 ter. Thèmes de saison

Neuf occasions saisonnières (`SEASONS`) ont chacune leur thème complet : couleurs, motif, scène, décor animé, réaction au Non, explosion au Oui. Ce sont des **thèmes à part entière** (`THEMES`, champ `season`), avec les mêmes règles que les 7 thèmes permanents (variantes `readable`, contrastes vérifiés par le banc, y compris avec chaque couleur d'accent).

| Thème | Couleurs | Décor de fond | Élément vedette (animation) | Décor animé | Non | Oui |
|---|---|---|---|---|---|---|
| Halloween (sombre) | violet nuit, orange, crème | nuit étoilée, lune, maison hantée, clôture | citrouille souriante (oscille, visage qui luit), chauve-souris, « Même pas peur ? » | chauves-souris, petits fantômes (`fly`) | s'éparpillent (`scatter`) | citrouilles, bonbons |
| Noël | crème, vert sapin, rouge | guirlande, cheminée, sapin, cadeaux | sapin aux lumières qui s'allument, étoile, « Il reste une place à table » | flocons, bonnets | tourbillon | cadeaux, étoiles |
| Réveillon (sombre) | bleu nuit, or, argent | ville de nuit, feux d'artifice au loin (ordinateur) | horloge vers minuit, coupes, « Bientôt minuit… » | paillettes, bulles | éclatent (`pop`) | feu d'artifice (`fw`) |
| Galette | crème, doré, brun | étagères, nappe à carreaux | galette, couronne qui flotte, « Qui aura la fève ? » | couronnes, fèves | tourbillon | couronnes, étoiles |
| Saint-Valentin | rose, rouge, bordeaux | papier peint à cœurs, guirlande, lettres, roses | cœur qui bat traversé d'une flèche, cupidon, « Un cœur pour toi » | cœurs, lettres, 👼 💘 🥂 🌹 | se brisent | cœurs, pétales, 💘 🥂 |
| Pâques | vert tendre, lilas | herbe, œufs cachés, buissons | panier d'œufs, oreilles de lapin qui frétillent, « La chasse aux œufs est ouverte » | œufs, fleurs | chute | œufs, fleurs, confettis |
| Fête des mères | rose poudré, prune | papier peint fleuri, vase, cadre | bouquet de tulipes qui se balance, « Pour toi, maman » | pétales, cœurs, 🤰 🤱 👩‍👧 💐 | tourbillon | fleurs, cœurs, 💐 🤱 |
| Fête des pères | vert sauge, bleu canard | planches, fauteuil, lampe | médaille qui se balance, « Pour toi, papa » | étoiles, cravates | chute | étoiles, confettis |
| Musique | turquoise, magenta | portées, ampoules, scène, enceintes | enceinte qui bat la mesure, notes, « Monte le son ! » | notes | éclatent | notes, confettis, étoiles |

- **Proposés à la création seulement pendant leur période** (thème, occasion, modèle, emojis de saison : `seasonOpen`, `emojiOpen`) ; un choix déjà fait est gardé. **Une invitation reçue s'affiche toujours avec son thème**, toute l'année : le décodage ne regarde jamais la date.
- **Occasions existantes devenues saisonnières** (Saint-Valentin, fêtes des mères et des pères) : leur `theme` reste celui du décodage (Amour, Pétales, Cravate), pour que les liens déjà envoyés ne changent pas ; `createTheme` donne le thème de saison à la création (il est alors écrit dans le lien).
- **Modèles de saison** : étiquette « De saison » (`.tpl-tag`, pastille contour encre, texte encre), en tête de leur catégorie. **Bandeau de l'accueil** (`.season`) : une seule occasion, bouton secondaire (le Oui reste la seule action principale). Ordre commun (`seasonOrder`) : jour J à venir le plus proche, puis jours J passés du plus récent au plus ancien ; égalité (fête des pères le 21 juin, certaines années) départagée par l'ordre de `TEMPLATES`.
- **Décor animé** (`DECOR`) : `shape` peut être une liste ; `kcols` donne les couleurs propres à une forme ; `"e:🤰"` colle un emoji (rendu par l'appareil, donc différent sur Apple, Windows, Android : réservé à ce que le dessin ne sait pas faire, comme les cupidons ou les mamans). Formes dessinées : `bat`, `ghost`, `pumpkin`, `candy`, `flake`, `hat`, `gift`, `spark`, `crown`, `bean`, `letter`, `egg`, `flower`, `tie`, `note`, `note2`. Mouvement `fly` (vol horizontal), réaction `scatter` (s'éparpillent puis reviennent), explosion `fw` (gerbes rondes). Les couleurs du canvas sont écrites en dur (comme pour les 7 thèmes) : les reprendre du thème.
- **Nouveau thème de saison** : sa période dans `SEASONS` (jour J, début, fin, emoji, textes du bandeau), son thème complet, son occasion et son modèle, de nouveaux codes (index.html et `tables-figees.mjs`), une référence de lien, puis contrôle visuel sur téléphone et ordinateur.

## 2 quater. Ambiances des occasions permanentes

Chaque occasion permanente gardée à la création (liste révisée le 2026-10-16) reçoit son **ambiance** : un thème complet, avec les mêmes règles que les autres (variantes `readable`, contrastes vérifiés, scène, décor animé). Les ambiances arrivent par lots ; chaque nouvelle occasion est créée **dans le même lot que son ambiance**, pour naître avec son thème final (le lien n'écrit pas le thème par défaut de l'occasion). Une occasion qui existait déjà garde son `theme` de décodage et reçoit l'ambiance en `createTheme`.

| Ambiance | Couleurs | Décor de fond | Élément vedette | Décor animé | Non | Oui |
|---|---|---|---|---|---|---|
| Proposer un date (`date`) | corail pâle, rouge corail, bordeaux | soir en ville : étoiles, lune, toits, réverbère, banc | deux tasses qui trinquent, cœur qui flotte, « Toi et moi ? » | cœurs, étoiles, éclats | se brisent | cœurs, éclats, confettis |
| Mon anniversaire (`monanniv`) | rose bonbon, violet | fanions, confettis, ballons, table, cadeaux | gâteau à deux étages, bougies qui vacillent, « C'est ma fête ! » | ballons, confettis | éclatent | confettis, étoiles, ballons |
| Un anniversaire en famille (`annivfam`) | vanille, orange | ampoules, papier peint rayé, cadres (ordinateur), table | gâteau à trois étages, « En famille ! » | confettis, étoiles, cœurs | tourbillon | confettis, étoiles, cœurs |
| Être mon témoin (`temoin`) | ivoire, ardoise, doré | arche fleurie, chaises de cérémonie | alliances entrelacées qui se balancent, « À mes côtés ? » | pétales, alliances | tourbillon | pétales, cœurs, éclats, alliances |
| Une fête surprise (`fetesurprise`) | bleu ciel, rose vif | fanions, confettis, canapé et ballons cachés, porte entrouverte | cadeau dont le couvercle se soulève, « Pas un mot ! » | confettis, étoiles, ballons | tourbillon | confettis, ballons, étoiles |

- **Animations vivantes et propres à l'événement** : chaque élément vedette combine plusieurs mouvements qui racontent l'occasion (cœurs qui montent `.sg-rise` / `petitCoeur()`, soleil qui tourne `.sg-spin`, valise qui roule `.sg-roll`, cloche qui se soulève `.sg-lift`, coin de page qui se soulève `.sg-flip`, oiseaux `.sg-fly`, en plus de `.sg-beat`, `.sg-swing`, `.sg-flame`…), et le décor animé mêle formes dessinées et emojis du thème (`e:…`). Toujours immobile en « Aucune » et avec « moins de mouvement ».
- **Scènes compactes** : réutiliser les **formes communes** avant d'en dessiner de nouvelles. Décor de fond : `fanions(id)`, `ampoules(id)`, `ballon(r)`, `paquet(w, h)`, `cadre(w, h)`, `plateau(y)` ; élément vedette : `gateau(cx, base, étages, bougies)` (flammes `.sg-flame`), `.sg-ring` / `.sg-ringo` (anneaux à l'accent cernés d'encre). Formes du décor animé ajoutées : `balloon`, `ring`.
- **Poids** : donner à chaque lot le poids de `index.html`, brut et compressé (`gzip -6`, proche de ce que GitHub Pages envoie réellement). Au-delà de 150 Ko compressés, reparler de fichiers de scène séparés.
- **Liste révisée** : occasions masquées à la création par `old:1` (mariage, grands-parents, sortie entre amis, anniversaire entre amis, me faire pardonner), toujours décodées ; « Juste comme ça » en coulisse (`hide:1`) pour « Partir de zéro » ; « Autre chose… » gardée. Les introductions (2 cartes par occasion) sont dans `INTROS`, en attendant la fonctionnalité.

## 3. Typographie : deux polices, pas une de plus

Polices **hébergées dans `fonts/`** (licence SIL OFL, aucun appel à Google Fonts — RGPD).

- **Bricolage Grotesque** (`var(--display)`, variable 200–800) : **toute l'interface**. Titres en 800, interlettrage serré (`-.02em` à `-.035em`), `font-variation-settings:"opsz" 96` sur les grands titres (`.question`, `.hero h1`), tailles fluides `clamp()`. Texte courant 17px, interligne 1,5. Chiffres qui défilent : `font-variant-numeric:tabular-nums` (`.count`).
- **Caveat** (`var(--hand)`) : **uniquement ce qui doit paraître écrit à la main par une personne** — le message manuscrit (`.handnote`), la signature (`.sign`), « Pour {prénom} » sur le papier de l'enveloppe, la réponse de refus que l'on écrit soi-même (`.refuse-input`). Jamais pour un titre, un bouton, une indication ou une étiquette.
- Pas de nouvelle police, pas de police système en remplacement voulu, pas d'italique décorative (les `<em>` d'indication sont droits, en `--muted`).

## 4. Animations : trois niveaux, toujours respectés

Niveau de l'invitation `an` (`invAnim()`), choisi par le créateur : **`n` Normales**, **`d` Discrètes**, **`0` Aucune**. Si le téléphone demande **moins de mouvement** (`prefers-reduced-motion`), c'est `0`, quoi qu'ait choisi le créateur (et la règle CSS globale coupe transitions et animations).

| | `n` Normales | `d` Discrètes | `0` Aucune |
|---|---|---|---|
| Décor animé (canvas `Decor`) | 18 éléments (téléphone) / 26 | 10, plus lents | aucun |
| Explosions (`Decor.burst`) | pleines | 45 % des éléments | aucune |
| Enveloppe qui frétille, billet qui s'incline | oui | non | non |
| Vibrations (`buzz`) | oui | oui | non |
| Mise en scène (révélation…) | complète | raccourcie, plus sobre | **affichage direct**, sans attente |

Règles pour toute nouvelle animation (intro, partage…) :
- La **brancher sur `invAnim()`** (côté invitation) et prévoir le cas `0` : le contenu apparaît tout de suite, rien n'est caché derrière une animation, aucune attente imposée.
- Courtes et vives : apparition `pop` (0,5 s, léger rebond `cubic-bezier(.2,1.4,.4,1)`), boutons 0,1–0,2 s, transitions de page ≤ 1,2 s. Animer `transform` et `opacity` seulement.
- Les explosions et le décor reprennent les formes du thème (`DECOR` : cœurs, pétales, étoiles, bulles, confettis, étincelles) : pas de nouvel effet hors thème.
- **Son** : `Sound` (sons brefs synthétisés, jamais de musique), activé par défaut mais respecte le réglage de l'invitation (`so:0`) et le bouton 🔊/🔇 toujours visible ; aucun son avant un geste. Un nouveau moment fort peut avoir **son** son bref (`Sound.xxx`), dans la même famille.
- Une séquence (plusieurs étapes) se joue **l'une après l'autre**, avec défilement jusqu'à l'élément, et peut toujours être passée ou ignorée (bouton « Passer » pour l'intro).

## 5. Accessibilité

- **Seuils, vérifiés par le banc de test (section « Contrastes ») dans les 7 thèmes et pour chaque couleur d'accent autorisée** : texte ≥ 4,5:1 (encre, texte atténué, `--accent-text` sur `--bg`/`--surface`/`--soft` ; `--accent-ink` sur `--accent-btn`) ; grands textes et éléments graphiques ≥ 3:1 (initiale du sceau, contour de focus). Mesures actuelles : encre ≥ 10,7:1, texte atténué ≥ 5,2:1.
- **Règle d'usage** : du texte, un lien, un chiffre, un contour de focus ou une bordure d'état en couleur d'accent → `var(--accent-text)` ; un fond qui porte du texte → `var(--accent-btn)` avec `color:var(--accent-ink)` ; `var(--accent)` seulement pour les remplissages et décors sans texte. Le banc refuse `color:var(--accent)` (sauf le « ? » du logo, logotype exempté), un contour ou une bordure de focus en `--accent`, et un texte `--accent-ink` sans fond `--accent-btn`.
- Les remplissages purement décoratifs (enveloppe, pastilles du programme, barre de progression doublée du texte « Étape x sur 4 ») gardent `--accent` même sous 3:1 (Cravate) : ils ne portent aucune information seule.
- **Focus visible** : `:focus-visible{outline:3px solid var(--accent-text);outline-offset:2px}` partout ; les champs remplacent le contour par une bordure `--accent-text`. Ne jamais supprimer le focus d'une commande sans remplacement.
- **Clavier** : de vrais `<button>` (y compris l'enveloppe), des liens `<a>` pour naviguer ; état des choix par `aria-pressed` ; le Non qui « se transforme » réagit aussi au focus.
- **Changement d'écran** : chaque écran remplace la page, donc le focus doit être replacé. Le titre de chaque écran porte `tabindex="-1"` (focalisable sans entrer dans l'ordre de tabulation, sans contour : `[tabindex="-1"]:focus{outline:none}`) et reçoit le focus avec `focusScreen(sélecteur)` (sans défilement). Après un réaffichage dû au choix d'une option, `refocus(focusKey(bouton))` remet le focus sur le même contrôle. Exception : l'écran de refus met le focus sur sa réponse (`#replyNo`). Tout nouvel écran suit cette règle ; le banc le vérifie.
- **Lecteurs d'écran** : décor et explosions en `aria-hidden="true"`, emojis décoratifs aussi (`.lk`) ; messages qui changent en `aria-live="polite"` (`.tease`), notifications `role="status"` (`toast`) ; feuilles en `role="dialog" aria-modal="true"` ; texte réservé aux lecteurs d'écran : classe `.sr`.
- Le **vrai refus** reste toujours accessible au clavier, au lecteur d'écran et au toucher (« Répondre non, pour de vrai » : pastille de 44 px, que le Non qui s'enfuit ne recouvre jamais).
- **Cibles de 44 px minimum pour toute action essentielle** (répondre, refuser, revenir en arrière, créer, partager, copier, continuer, ouvrir) : `.btn` et Oui/Non font environ 50 px ; une action essentielle d'aspect discret prend une `min-height:44px` (ex. `.refuse`). Les liens discrets plus petits (`.cal-alt`, `.linkbtn`) sont réservés aux actions facultatives ou qui ont une autre voie. Rien d'essentiel au survol seul.

## 6. Textes

- **Tutoiement** partout (personne qui crée comme personne invitée) : « Crée la tienne », « Touche l'enveloppe pour l'ouvrir ».
- **Ton ludique et bienveillant** : complice, jamais insistant ni culpabilisant ; le refus est respecté (« Pas de souci, {prénom} comprendra. »). Le Non joue, mais un vrai non reste toujours possible.
- **Formulations neutres** : aucun accord au masculin ou au féminin pour la personne qui crée ni pour la personne invitée. Tourner la phrase : « Tant qu'elle n'est pas partie, {prénom} ne sait rien » (pas « il ou elle ne sait rien »), « Merci d'avoir osé demander » (pas « tu es gentil »), « Ta surprise de {prénom} » (pas « ton ami »), « la personne invitée ». Pas d'écriture inclusive à point médian : on reformule.
- Français soigné : guillemets « » avec espaces, espace avant `?` `!` `:`, « 20 h », dates longues (« samedi 14 novembre »). Phrases courtes. Un emoji au plus, à la fin, s'il ajoute du sens (💌 💛 🔓 ✨).
- **Pas de flèches décoratives ni de séparateurs « · »** : pas de `→` / `←` ajoutés à un bouton ou un lien (« Partir de zéro → », « ← Retour »), pas d'informations collées par « · » (« Lilas · le Non s'enfuit »). On écrit une courte phrase, on sépare par une virgule ou on met en forme (pastille, ligne à part). Il en reste 14 dans `index.html`, à retirer au point T2 de l'audit ; le banc refuse d'en ajouter.
- Dire ce qui se passe vraiment : une réponse n'est transmise que lorsqu'elle est envoyée (« Dernière étape : envoie ta réponse à {prénom} »), jamais de phrase qui laisse croire le contraire.
- Rassurer sur la confidentialité sans jargon (« Ton historique reste uniquement sur cet appareil »). Mention anti-phishing visible sur l'invitation. Sur l'accueil, pas de bloc dédié : la phrase du bas de page et le lien « Confidentialité » (`mentions-legales.html#confidentialite`, section qui résume : l'invitation tient dans son lien, pas de compte, historique sur l'appareil, aucun suivi). Ne jamais écrire « pas de serveur » : des liens courts chiffrés pourront en utiliser un ; on dit plutôt « aucune copie lisible », « seules les personnes qui ont le lien ».
- **Rappel du projet** : un texte mis dans un lien (question, message, intro, ton) **ne change jamais** ; une nouvelle formulation = un nouveau code (voir CLAUDE.md et le banc de test).

## 7. À éviter

- Les styles génériques : dégradés, ombres floues, glassmorphisme, cartes plates sans contour, coins très arrondis « appli bancaire », grilles d'icônes au trait fin, illustrations de banque d'images.
- Toute nouvelle police (y compris Google Fonts ou une police système choisie pour l'effet), et Caveat hors de l'écriture manuscrite.
- Toute couleur hors des variables de thème (sauf les exceptions listées au § 1) ; une couleur d'accent qui ne passe pas `accentOk`.
- Les animations qui ignorent `invAnim()` ou « moins de mouvement », qui bloquent la lecture, qui bouclent sans fin (hors frétillement léger de l'enveloppe), ou qui retardent la réponse.
- Les sons sans geste, la musique, le son qui ignore 🔇.
- Les bibliothèques d'interface, frameworks CSS, icônes externes, scripts tiers : le site est un seul `index.html` autonome, hors connexion, sans appel externe.
- Les textes genrés, culpabilisants (« Tu ne peux pas dire non ») ou qui forcent le Oui.
- Plusieurs actions principales sur un même écran ; une action essentielle sous 44 px ; les flèches décoratives et les séparateurs « · ».

## Avant de valider une interface

1. Vérifiée dans les 7 thèmes (dont Mystère) et avec une couleur d'accent ; couleurs d'accent utilisées selon la règle d'usage (`--accent-text` / `--accent-btn` / `--accent`).
2. Testée en animations `n`, `d`, `0` et avec « moins de mouvement ».
3. Parcourue au clavier seul ; focus toujours visible ; à chaque changement d'écran, le focus arrive sur le titre.
3 bis. Une seule action principale ; actions essentielles d'au moins 44 px ; ni flèche décorative ni « · ».
4. Lisible à 360px de large ; zones sûres respectées.
5. Textes tutoyés, neutres, sans faute ; aucun texte de lien existant modifié.
6. `node tests/run.mjs` passe.
