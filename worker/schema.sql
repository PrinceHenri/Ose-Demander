-- Ose Demander : table des liens courts (base D1 « ose-liens »)
-- ct     : contenu chiffré dans le navigateur (illisible sans la clé, qui reste dans le lien) ; NULL une fois expiré ou supprimé
-- del    : empreinte SHA-256 du jeton de suppression (le jeton reste sur l'appareil qui a créé le lien)
-- expire : date d'expiration (millisecondes depuis 1970) ; etat : NULL, 'expire' ou 'supprime'
CREATE TABLE IF NOT EXISTS liens (
  id     TEXT PRIMARY KEY,
  ct     TEXT,
  del    TEXT NOT NULL,
  expire INTEGER NOT NULL,
  etat   TEXT
);
CREATE INDEX IF NOT EXISTS liens_expire ON liens (expire);

-- Notifications de réponse (facultatives, demandées par la personne qui crée l'invitation)
-- abo    : abonnement Web Push de son appareil, chiffré au repos (clé CLE_STOCKAGE des secrets Cloudflare) ; NULL après l'envoi
-- del    : empreinte SHA-256 du jeton de suppression (le jeton reste sur son appareil)
-- expire : dernier créneau + 7 jours, un an au plus ; etat : NULL, 'envoye', 'expire' ou 'supprime'
-- Ni la réponse ni l'invitation ne sont jamais stockées : la réponse chiffrée est transmise puis oubliée.
CREATE TABLE IF NOT EXISTS notifs (
  id     TEXT PRIMARY KEY,
  abo    TEXT,
  del    TEXT NOT NULL,
  expire INTEGER NOT NULL,
  etat   TEXT
);
CREATE INDEX IF NOT EXISTS notifs_expire ON notifs (expire);

-- Notifications de révélation (facultatives, demandées par la personne invitée, pour son propre appareil)
-- Une ligne par heure de révélation. abo : abonnement Web Push, chiffré au repos (NULL après l'envoi) ;
-- heure : heure prévue (ms) ; prochain : prochain essai d'envoi ; etat : NULL, 'envoye', 'expire' ou 'supprime'.
-- Ni le lien de l'invitation, ni sa clé, ni les prénoms, ni le contenu de la surprise : le lien reste sur l'appareil.
CREATE TABLE IF NOT EXISTS rappels (
  id       TEXT PRIMARY KEY,
  abo      TEXT,
  del      TEXT NOT NULL,
  heure    INTEGER NOT NULL,
  prochain INTEGER NOT NULL,
  etat     TEXT
);
CREATE INDEX IF NOT EXISTS rappels_prochain ON rappels (prochain) WHERE etat IS NULL;

-- Rappels de rendez-vous « Me rappeler 3 h avant » (facultatifs, demandés pour son propre appareil, une fois l'invitation acceptée)
-- abo   : abonnement Web Push, chiffré au repos (CLE_STOCKAGE) ; aboh : empreinte HMAC de l'abonnement (clé dérivée de CLE_STOCKAGE),
--         sert seulement à limiter le nombre de rappels en attente par appareil (RDV_PAR_ABO) ; elle ne permet pas de retrouver l'abonnement.
-- heure : heure d'envoi (rendez-vous moins 3 h, ms) ; prochain : prochain essai.
-- La ligne est SUPPRIMÉE dès l'envoi, l'annulation, ou 2 h après l'heure si l'envoi n'a pas pu se faire.
-- Ni le lien, ni le titre, ni le lieu, ni les prénoms : l'appareil compose le texte lui-même (IndexedDB « ose-notifs », magasin « rdv »).
CREATE TABLE IF NOT EXISTS rdv (
  id       TEXT PRIMARY KEY,
  abo      TEXT NOT NULL,
  aboh     TEXT NOT NULL,
  del      TEXT NOT NULL,
  heure    INTEGER NOT NULL,
  prochain INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rdv_prochain ON rdv (prochain);
CREATE INDEX IF NOT EXISTS rdv_aboh ON rdv (aboh);
