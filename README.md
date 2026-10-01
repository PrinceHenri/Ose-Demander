# Ose Demander

Générateur gratuit d'invitations animées : date, fête des mères, journée surprise…
Le bouton « Non » résiste, et la réponse arrive par WhatsApp, SMS, Snapchat, Instagram ou Messenger.

Aucun serveur, aucune base de données : toute l'invitation est compressée dans le lien (`#i=...`).

## Fichiers

```
ose-demander/
├── index.html              ← tout le site (création + invitation)
├── mentions-legales.html   ← à compléter (zones surlignées, 2 fois l'e-mail)
├── README.md               ← ce guide
├── manifest.webmanifest    ← fiche de l'appli installable (PWA)
├── sw.js                   ← service worker : installation + hors connexion
├── og-image.png            ← image d'aperçu des liens
├── CNAME                   ← créé par GitHub pour le domaine, ne pas supprimer
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── maskable-512.png
│   ├── apple-touch-icon.png
│   └── favicon-64.png
└── fonts/
    ├── bricolage-grotesque.woff2
    ├── caveat.woff2
    ├── LICENSE-bricolage-grotesque.txt
    └── LICENSE-caveat.txt
```

Les polices sont hébergées sur le site : aucun appel à Google Fonts (RGPD).

## Mettre en ligne sur GitHub Pages (5 minutes)

1. Crée un compte sur [github.com](https://github.com) si tu n'en as pas.
2. Clique sur **New repository**. Nom conseillé : `ose-demander`. Coche **Public**, puis **Create repository**.
3. Sur la page du dépôt, clique sur **uploading an existing file**, glisse les trois fichiers **et le dossier `fonts`** (en entier, pas son contenu), puis **Commit changes**.
4. Va dans **Settings** → **Pages**. Dans **Source**, choisis **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
5. Attends 1 à 2 minutes. Ton site est en ligne à l'adresse :
   `https://TON-PSEUDO.github.io/ose-demander/`

Pour une mise à jour : **Add file** → **Upload files**, glisse le ou les fichiers modifiés (même nom), puis **Commit changes**. GitHub Pages republie tout seul en une minute.

## Nom de domaine (facultatif)

Si tu achètes un domaine (ex. `osedemander.fr`, environ 10 €/an) :
1. Dans **Settings** → **Pages** → **Custom domain**, entre ton domaine.
2. Chez ton registraire, ajoute un enregistrement `CNAME` pointant vers `TON-PSEUDO.github.io`.
3. Coche **Enforce HTTPS** quand l'option apparaît.

## Appli installable (PWA)

Le site s'installe comme une appli depuis le navigateur (bouton « Installer l'appli » en haut de la page d'accueil, ou « Partager » → « Sur l'écran d'accueil » sur iPhone). Il fonctionne aussi hors connexion.

**Après une mise à jour importante** de `index.html`, ouvre `sw.js` et change `ose-v1` en `ose-v2` (puis `ose-v3`…) : les appareils qui ont installé l'appli téléchargeront la nouvelle version.

## Sécurité

- **Active la double authentification (2FA)** sur ton compte GitHub : c'est la protection la plus importante, car quiconque contrôle le compte contrôle le site.
- Les données d'un lien sont validées strictement (types, longueurs) et limitées en taille : un lien trafiqué affiche « Ce lien est incomplet » au lieu de planter.
- Tout le texte affiché est échappé : pas d'injection de code possible via le contenu d'une invitation.
- `referrer: no-referrer` : rien n'est transmis aux sites ouverts depuis une invitation.
- Non mis en place : la Content-Security-Policy (choix volontaire) et la protection anti-iframe (impossible sur GitHub Pages).

## Bon à savoir

- **Liens longs** : plus l'invitation contient de texte, plus le lien est long. Il est compressé, et les champs sont limités en caractères.
- **Mode « Surprise »** : l'info n'est jamais mise dans le lien. Totalement sûr.
- **Mode « Révélé plus tard »** : l'info est brouillée dans le lien et s'affiche à l'heure choisie (selon l'horloge du téléphone du destinataire). Illisible pour 99 % des gens, mais pas inviolable pour quelqu'un de technique.
- **Snapchat, Instagram, Messenger** ne permettent pas de pré-écrire un message : la réponse est copiée, puis l'appli s'ouvre.
- Fonctionne sur tous les navigateurs récents (Chrome, Safari, Firefox, Edge), mobile et ordinateur.
