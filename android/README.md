# Ose Demander pour Android (Play Store)

L'appli `fr.osedemander.app` est une **TWA** (Trusted Web Activity) : elle affiche https://osedemander.fr dans Chrome, en plein écran, sans barre d'adresse. Elle est fabriquée en local avec **Bubblewrap** à partir de `twa-manifest.json` (seul fichier de configuration, dans le dépôt). Le projet Android fabriqué, la clé de signature et les fichiers `.apk` / `.aab` ne sont **jamais** dans le dépôt (voir `.gitignore`).

## Ce qu'il ne faut jamais faire

- Mettre la clé de signature ou ses mots de passe dans le dépôt (il est public), ou les envoyer par message ou par e-mail.
- Supprimer `.well-known/assetlinks.json` du site, ni retirer `.well-known` de `_config.yml` : sans lui, l'appli s'ouvre avec une barre d'adresse.
- Perdre la clé : sans elle, impossible de publier une mise à jour sous le même nom de paquet (sauf procédure de réinitialisation auprès de Google, si Play App Signing est activé).

## Installation (une seule fois)

1. `npm install -g @bubblewrap/cli` (déjà fait).
2. Dans un terminal : `bubblewrap doctor`. Bubblewrap propose d'installer **Java (JDK 17)** et le **SDK Android** dans `%USERPROFILE%\.bubblewrap` (environ 1 Go) : répondre oui, et accepter (ou non) les conditions d'utilisation du SDK Android.

## Fabriquer l'appli

Dans un terminal, depuis le dossier `android` du projet :

1. `bubblewrap update --skipVersionUpgrade` : fabrique le projet Android à partir de `twa-manifest.json` (nom, icônes, couleurs, écran de démarrage). `minSdkVersion` vaut **24** (Android 7.0 au minimum) : c'est le minimum exigé par la bibliothèque `androidbrowserhelper` de Bubblewrap, ne pas le baisser (la fabrication échoue en dessous).
2. **Clé de signature** (une seule fois, à vie) :
   ```
   keytool -genkeypair -v -keystore ..\..\Ose-Demander-cle\ose-demander.keystore -alias ose-demander -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Ose Demander, O=Ose Demander, C=FR"
   ```
   Le dossier `Ose-Demander-cle` est à côté du dossier du projet, hors du dépôt. `keytool` demande un mot de passe (au moins 6 caractères) : le choisir long et unique.
3. `bubblewrap build` : demande le mot de passe du fichier de clé puis celui de la clé (le même), et fabrique :
   - `app-release-signed.apk` : à installer directement sur un téléphone pour tester ;
   - `app-release-bundle.aab` : à envoyer à la Play Console.
4. Empreinte de la clé (à mettre dans `.well-known/assetlinks.json` du site, elle n'est pas secrète) :
   ```
   keytool -list -v -keystore ..\..\Ose-Demander-cle\ose-demander.keystore -alias ose-demander
   ```
   Ligne « SHA256 : AA:BB:… ».

## Sauvegarder la clé

À conserver **à deux endroits au moins**, hors du dépôt : le fichier `ose-demander.keystore` (par exemple sur une clé USB rangée chez soi et dans un coffre en ligne chiffré), et le mot de passe dans un gestionnaire de mots de passe (Bitwarden, 1Password, KeePass…), avec l'alias `ose-demander`. Jamais le fichier et le mot de passe au même endroit en clair.

## Nouvel envoi au Play Store

- Les **mises à jour du site** arrivent toutes seules dans l'appli : aucun nouvel envoi.
- Un nouvel envoi n'est nécessaire que pour changer l'icône, le nom, l'écran de démarrage, ou pour l'exigence annuelle de Google (niveau d'API Android visé) : `bubblewrap update` (augmente `appVersionCode`), puis `bubblewrap build`. **Le numéro de version (`appVersionCode`) doit augmenter à chaque envoi.**
- Après le premier envoi, la Play Console (Configuration, Intégrité de l'application) donne l'empreinte SHA-256 de **Google Play App Signing** : elle doit être ajoutée à `.well-known/assetlinks.json`, à côté de celle de la clé locale.

## Fiche du Play Store

- Icône : `fiche/icone-512.png` (512 × 512, PNG 32 bits).
- Bannière : `fiche/banniere-1024x500.png` (1 024 × 500, sans transparence).
- Règles de confidentialité : https://osedemander.fr/mentions-legales.html#confidentialite
- Captures d'écran de téléphone (2 à 8, format portrait 1080 × 1920 conseillé) :
  1. L'accueil, avec le mini-billet « Tu viens ? » ;
  2. Le choix d'un modèle ;
  3. L'aperçu d'une invitation (étape 4), avec sa scène ;
  4. L'enveloppe d'une invitation reçue (par exemple Noël) ;
  5. La question, avec le bouton Non qui s'enfuit ;
  6. Après le Oui : « Dernière étape : envoie ta réponse » ;
  7. Partager en image (story avec le QR code) ;
  8. Mes invitations.
- Formulaire « Sécurité des données » : à mettre à jour si le traitement des données change (voir les mentions légales du site).
