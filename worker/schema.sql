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
