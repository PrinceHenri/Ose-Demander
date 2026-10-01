# Ose Demander

Générateur gratuit d'invitations animées : date, fête des mères, journée surprise…
Le bouton « Non » résiste, et la réponse arrive par WhatsApp, SMS, Snapchat, Instagram ou Messenger.

Aucun serveur, aucune base de données : toute l'invitation est compressée dans le lien (`#i=...`).

## Fichiers

- `index.html` : tout le site (création + invitation), en un seul fichier.
- `mentions-legales.html` : page obligatoire pour un site public en France. **À compléter** (les zones surlignées).
- `README.md` : ce guide.

## Mettre en ligne sur GitHub Pages (5 minutes)

1. Crée un compte sur [github.com](https://github.com) si tu n'en as pas.
2. Clique sur **New repository**. Nom conseillé : `ose-demander`. Coche **Public**, puis **Create repository**.
3. Sur la page du dépôt, clique sur **uploading an existing file**, glisse les trois fichiers, puis **Commit changes**.
4. Va dans **Settings** → **Pages**. Dans **Source**, choisis **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
5. Attends 1 à 2 minutes. Ton site est en ligne à l'adresse :
   `https://TON-PSEUDO.github.io/ose-demander/`

Pour une mise à jour : remplace le fichier dans le dépôt, GitHub Pages republie tout seul.

## Nom de domaine (facultatif)

Si tu achètes un domaine (ex. `osedemander.fr`, environ 10 €/an) :
1. Dans **Settings** → **Pages** → **Custom domain**, entre ton domaine.
2. Chez ton registraire, ajoute un enregistrement `CNAME` pointant vers `TON-PSEUDO.github.io`.
3. Coche **Enforce HTTPS** quand l'option apparaît.

## Bon à savoir

- **Liens longs** : plus l'invitation contient de texte, plus le lien est long. Il est compressé, et les champs sont limités en caractères.
- **Mode « Surprise »** : l'info n'est jamais mise dans le lien. Totalement sûr.
- **Mode « Révélé plus tard »** : l'info est brouillée dans le lien et s'affiche à l'heure choisie (selon l'horloge du téléphone du destinataire). Illisible pour 99 % des gens, mais pas inviolable pour quelqu'un de technique.
- **Snapchat, Instagram, Messenger** ne permettent pas de pré-écrire un message : la réponse est copiée, puis l'appli s'ouvre.
- Fonctionne sur tous les navigateurs récents (Chrome, Safari, Firefox, Edge), mobile et ordinateur.
