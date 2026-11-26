# Ose Demander

Ose Demander est un générateur gratuit d'invitations animées : on crée une invitation (un rendez-vous, un anniversaire, une demande de témoin…), on envoie le lien par message, et la personne invitée répond. Le bouton « Non » résiste un peu, mais un vrai refus reste toujours possible.

- Site : https://osedemander.fr
- Appli Android en test fermé, bientôt disponible sur Google Play (elle affiche le même site en plein écran)
- Sans compte, sans publicité, sans mesure d'audience. Rien n'est stocké en clair en ligne.

## Fonctionnalités

- **Création guidée** : modèles prêts à l'emploi par catégorie (Amour, Famille, Amis, Surprise, modèles de saison), ou création libre ; un ou plusieurs créneaux au choix ; programme en étapes ; éléments « Surprise » (jamais dans le lien) ou « Révélé plus tard » (affichés à l'heure choisie) ; message caché jusqu'au Oui ; ton du Non ; couleur, emoji, signature ; aperçu fidèle avant l'envoi.
- **Expérience de la personne invitée** : enveloppe animée, introduction en cartes, scène illustrée propre à chaque thème (35 ambiances), bouton « Non » qui s'échappe, vrai refus avec un message bienveillant, révélation animée des surprises, ajout à l'agenda, partage d'une version sans le lieu.
- **Réponse** : par WhatsApp, SMS, Snapchat, Instagram, Messenger ou par le partage du téléphone ; notification de réponse facultative pour la personne qui invite.
- **Invitations de groupe** : un seul lien pour plusieurs personnes ; chacune répond (Oui, Peut-être, Non, accompagnants, petit mot) et peut modifier ou supprimer sa réponse ; seule la personne qui organise lit les réponses, dans un tableau de bord (compteurs, clôture, suppression), avec des notifications regroupées.
- **Mes invitations** : historique des invitations envoyées et reçues, gardé sur l'appareil ; statuts, compte à rebours, ajout à l'agenda, rappel 3 h avant, export et import.
- **Images avec QR code** : formats story et carré, aux couleurs du thème ; **scanner** intégré pour ouvrir une invitation depuis un QR code (image ou caméra).
- **Appli installable** (PWA) et utilisable hors connexion ; logos et thèmes de saison ; pages d'idées d'invitations pour le référencement.
- **Accessibilité** : contrastes vérifiés dans chaque thème, navigation au clavier, lecteurs d'écran, trois niveaux d'animation et respect de « moins de mouvement ».

## Confidentialité et chiffrement

Le principe : l'invitation vit dans son lien, et ce qui passe par le serveur est chiffré sur l'appareil. Tout ce qui suit le « # » d'une adresse n'est jamais envoyé au serveur par le navigateur.

| Lien | Contenu | Ce que voit le service en ligne |
|---|---|---|
| `#i=…` (lien complet) | l'invitation compressée, entièrement dans le lien | rien : aucun appel au service |
| `#s=ID.CLÉ` (lien court) | l'invitation chiffrée dans le navigateur (AES-GCM, clé aléatoire de 128 bits) ; la clé reste dans le lien | un contenu chiffré illisible, effacé au plus tard un an après sa création |
| `#g=ID.CLÉ` (invitation de groupe, lien invités) | comme un lien court ; l'invitation chiffrée contient la clé publique de la personne qui organise | l'invitation chiffrée et des réponses chiffrées (leur nombre et leur date) |
| `#ga=ID.CLÉ.D` (lien organisateur) | en plus, la clé privée qui permet de lire les réponses | jamais transmis : seule l'empreinte d'une clé de gestion dérivée est connue du service |

- **Réponses d'un groupe** : chiffrées sur l'appareil de la personne qui répond, vers la clé publique de la personne qui organise (échange de clés ECDH P-256, dérivation HKDF, AES-GCM, liées à leur groupe et à leur place). Le service ne voit ni prénoms, ni réponses, ni messages.
- **Notifications** (réponse, révélation d'une surprise, rappel 3 h avant, nouvelles réponses d'un groupe) : facultatives. Le service garde l'abonnement aux notifications chiffré et n'envoie que des identifiants (ou une réponse déjà chiffrée de bout en bout) ; le texte affiché est composé par l'appareil, à partir de ce qu'il a gardé.
- **Jetons et clés de gestion** : les jetons qui permettent de supprimer un lien, de renoncer à une notification ou de modifier une réponse restent sur l'appareil ; le service n'en garde que l'empreinte.
- **Sur l'appareil** : l'historique « Mes invitations », les réponses envoyées à un groupe et les données des notifications restent dans le stockage du navigateur. Le scanner analyse l'image ou la caméra localement, sans rien envoyer.
- **Aucun suivi** : ni cookie, ni mesure d'audience, ni journal côté service ; ouvrir un lien complet n'envoie rien, ouvrir un lien court ne fait que lire le contenu chiffré.
- **« Révélé plus tard »** : le contenu est brouillé dans le lien pour ne pas être lu par accident, sans être un chiffrement ; pour un secret absolu, « Surprise » ne met rien dans le lien.
- Le détail est dans les [mentions légales](https://osedemander.fr/mentions-legales.html#confidentialite) et sur la page [Supprimer mes données](https://osedemander.fr/supprimer-mes-donnees/).

## Architecture

Site statique hébergé sur GitHub Pages, derrière Cloudflare (en-têtes de sécurité), et un service Cloudflare Worker pour les liens courts, les groupes et les notifications.

```
ose-demander/
├── index.html                ← la page : invitation (côté personne invitée), décor, liens, chargeur des fichiers de app/
├── app/                      ← chargés à la demande, versionnés par leur empreinte, gardés par le service worker
│   ├── creer.js, creer.css   ← création, accueil, Mes invitations, images avec QR code
│   ├── scenes.js             ← scènes illustrées des thèmes
│   ├── demo.js               ← démo du premier lancement
│   ├── groupe-commun.js      ← invitations de groupe : chiffrement et appels au service
│   ├── groupe-invite.js      ← formulaire de réponse d'un groupe
│   ├── groupe-orga.js        ← tableau de bord de la personne qui organise
│   ├── scanner.js            ← scanner une invitation depuis un QR code
│   └── vendor/               ← jsQR (logiciel tiers, publié tel quel)
├── sw.js                     ← service worker : installation, hors connexion, notifications
├── manifest.webmanifest      ← fiche de l'appli installable
├── mentions-legales.html     ← mentions légales et confidentialité
├── supprimer-mes-donnees/    ← page demandée par Google Play
├── invitation-…/, demande-…/ ← pages d'idées d'invitations (fabriquées par outils/pages.mjs)
├── 404.html, robots.txt, sitemap.xml
├── .well-known/              ← assetlinks.json (lien avec l'appli Android), security.txt
├── worker/                   ← service Cloudflare Worker et sa base D1
│   ├── src/index.js          ← routes des liens courts, des notifications, des rappels, tâche planifiée
│   ├── src/groupes.js        ← routes des invitations de groupe
│   ├── src/push.js           ← Web Push (RFC 8291) et VAPID, abonnements chiffrés au repos
│   ├── src/regles.js         ← règles et requêtes SQL
│   ├── schema.sql            ← tables D1
│   └── wrangler.toml         ← configuration (sans secret)
├── android/                  ← appli Android (Trusted Web Activity, Bubblewrap) et fiche Google Play
├── outils/                   ← csp.mjs, pages.mjs (+ pages-data.mjs), indexnow.mjs
├── tests/                    ← banc de test
├── icons/, fonts/, og-image.png
└── CNAME                     ← domaine de GitHub Pages, ne pas supprimer
```

- **Base D1** (`worker/schema.sql`) : `liens` (contenus chiffrés des liens courts et des invitations de groupe), `notifs` (notifications de réponse), `rappels` (notifications de révélation), `rdv` (rappels 3 h avant), `groupes` et `reponses` (invitations de groupe). Aucune colonne ne contient de prénom, de lieu ni de réponse en clair ; les abonnements aux notifications sont chiffrés au repos.
- **Tâche planifiée** : une fois par minute, elle envoie les notifications arrivées à échéance ; une fois par jour, elle efface ce qui a expiré.
- **Secrets** (clés des notifications, clé de chiffrement des abonnements) : uniquement dans les secrets Cloudflare, jamais dans le dépôt.
- **Appli Android** : elle affiche le site ; les mises à jour du site y arrivent sans nouvelle version de l'appli.

## Sécurité

- **Politique de sécurité du contenu** (balise meta sur chaque page) : le script de la page est autorisé par son empreinte SHA-256, les autres scripts seulement depuis le site ; les connexions sont limitées au site et au service des liens courts ; les pages statiques n'exécutent aucun script.
- **En-têtes ajoutés par Cloudflare** : HSTS, `X-Frame-Options: DENY` et `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`, `Permissions-Policy` (caméra réservée au site, pour le scanner ; micro, position, paiement et USB refusés). Les options de Cloudflare qui réécrivent les pages (masquage des adresses e-mail, Rocket Loader) restent coupées : elles seraient bloquées par la politique de sécurité.
- **Domaine** : HTTPS forcé, DNSSEC, enregistrements SPF, DKIM et DMARC pour l'adresse de contact, `security.txt` pour signaler une faille.
- **Dépôt** : commits signés, aucun secret ni donnée personnelle (vérifié par le banc). La double authentification sur le compte GitHub est indispensable : qui contrôle le compte contrôle le site.
- **Validation stricte** : tout ce qui vient d'un lien, d'une réponse déchiffrée ou d'un fichier importé passe par une validation (champs connus, types, longueurs, listes fermées) ; un lien trafiqué affiche « Ce lien est incomplet » au lieu de planter. Tout texte affiché est échappé.
- **Service** : seules les requêtes venant du site sont acceptées, les réponses ne sont jamais mises en cache, le nombre de demandes est limité sans enregistrer les adresses IP, aucun journal n'est tenu.

## Développement

### Banc de test

Avant chaque commit, depuis la racine du dépôt (Node 22.5 ou plus récent pour les tests du service, aucune installation) :

```
node tests/run.mjs
```

Environ 1 000 tests en 60 sections, qui chargent le vrai code de la page, des fichiers de `app/` et du service :
- **liens** : les liens de référence figés (`tests/references.mjs`) s'ouvrent toujours à l'identique ; encodage et décodage d'invitations aléatoires ; liens trafiqués refusés ; aucun code de texte ne change (`tests/tables-figees.mjs`) ;
- **écrans** : le HTML de chaque écran (une seule action principale, titres, textes, focus), les contrastes de chaque thème et couleur d'accent, aucun identifiant en double ;
- **service** : chaque route sur une base SQLite (création, lecture, suppression, expiration, limites, notifications chiffrées et signées, relues par un lecteur Web Push indépendant), temps de calcul de la tâche planifiée ;
- **chiffrement** : liens courts, réponses des groupes (mauvaise clé, réponse déplacée ou altérée refusées), clés de gestion ;
- **images et QR codes** : chaque thème, en story et en carré, relu par un lecteur QR indépendant (`tests/qr-lecteur.mjs`) et par jsQR ; le scanner (filtre des adresses) ;
- **publication** : versions des fichiers et politique de sécurité à jour, pages d'occasion à jour, appli Android, `security.txt`, absence de secrets et de données personnelles.

En cas d'échec sur une invitation tirée au hasard, la commande affiche la graine pour rejouer le tirage (`node tests/run.mjs --graine=N`). Ne jamais modifier une référence ou une table figée : pour une nouveauté, on **ajoute** une référence ou un code.

### Après une modification

- **Script de `index.html` ou fichier de `app/` modifié** : `node outils/csp.mjs`. Il recalcule les versions des fichiers de `app/` et l'empreinte du script dans la politique de sécurité ; sans lui, le navigateur bloquerait le site.
- **Textes des pages d'occasion** (`outils/pages-data.mjs`) : `node outils/pages.mjs`, qui refabrique ces pages, la 404 et le plan du site.
- **Publication d'une modification de `index.html`** : monter la version de `sw.js` (`ose-vN` vers `ose-vN+1`), une fois par publication, pour que les appareils qui ont installé l'appli prennent la nouvelle version.
- **Service** : `cd worker && npx wrangler@4 deploy` (après `npx wrangler@4 d1 execute ose-liens --remote --file=schema.sql` si une table est ajoutée). Essai local : `npx wrangler@4 dev`.

### Publication

1. Le travail se fait sur une branche ; le banc doit passer à chaque commit.
2. La branche est fusionnée dans `main` (commit de fusion), puis poussée : GitHub Pages publie le site.
3. Une fois la nouvelle version en ligne, `node outils/indexnow.mjs` signale aux moteurs de recherche compatibles IndexNow les pages modifiées (`--essai` pour voir sans envoyer, `--toutes` pour tout le plan du site). La clé IndexNow est publique par nature : c'est le fichier `4b649693dccca13e8d5110e80084e50b.txt` à la racine.
4. En cas de problème : annuler le commit de fusion et monter la version de `sw.js`.

## Logiciels tiers

- **jsQR 1.4.0** (licence Apache 2.0, texte complet : `app/vendor/jsqr-LICENSE.txt`) : lecteur de QR codes, utilisé par le scanner seulement quand le navigateur n'en a pas (`BarcodeDetector`). Fichier publié tel quel, sans modification : `app/vendor/jsqr.js`.
  - Source : `https://registry.npmjs.org/jsqr/-/jsqr-1.4.0.tgz`, intégrité npm `sha512-dxLob7q65Xg2DvstYkRpkYtmKm2sPJ9oFhrhmudT1dZvNFFTlroai3AWSpLey/w5vMcLBXRgOJsbXpdN9HzU/A==` (vérifiée au téléchargement).
  - SHA-256 du fichier `app/vendor/jsqr.js` : `bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859` (le banc le vérifie).
- Polices Bricolage Grotesque et Caveat : licence SIL OFL (`fonts/`).

## Bon à savoir

- **Liens longs** : plus l'invitation contient de texte, plus le lien complet est long. Il est compressé, les champs sont limités, et le lien court est proposé par défaut.
- **Mode « Surprise »** : l'information n'est jamais mise dans le lien.
- **Mode « Révélé plus tard »** : l'information est brouillée dans le lien et s'affiche à l'heure choisie, selon l'horloge du téléphone de la personne invitée ; illisible au premier coup d'œil, mais pas un chiffrement.
- **Snapchat, Instagram, Messenger** ne permettent pas de pré-écrire un message : la réponse est copiée, puis l'appli s'ouvre.
- **Notifications sur iPhone** : seulement dans l'appli installée sur l'écran d'accueil ; ailleurs, le site propose l'ajout à l'agenda.
- **Anciens liens** : tous les liens déjà envoyés continuent de s'ouvrir à l'identique, quel que soit leur format.
- Fonctionne sur les navigateurs récents (Chrome, Safari, Firefox, Edge), sur téléphone et sur ordinateur.
