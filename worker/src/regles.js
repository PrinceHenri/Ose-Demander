/* Ose Demander — règles du service des liens courts (limites, durées, requêtes SQL).
   Module à part : le module principal d'un Worker ne doit exporter que ses gestionnaires (fetch, scheduled). */
export const CT_MAX = 16384;                 // caractères du contenu chiffré (16 Ko)
export const CORPS_MAX = CT_MAX + 512;       // taille maximale d'une requête
export const DUREE = 365 * 24 * 3600 * 1000; // expiration : 1 an
export const GARDE = 365 * 24 * 3600 * 1000; // après l'expiration ou la suppression : on garde l'identifiant (sans contenu) un an de plus,
                                             // pour pouvoir dire « expirée » ou « supprimée » plutôt que « introuvable »
export const ID = /^[A-Za-z0-9_-]{22}$/, B64 = /^[A-Za-z0-9_-]+$/, EMPREINTE = /^[A-Za-z0-9_-]{43}$/;

/* Requêtes SQL (les seules utilisées ; le banc de test les reconnaît) */
export const SQL = {
  creer:     "INSERT INTO liens (id, ct, del, expire, etat) VALUES (?1, ?2, ?3, ?4, NULL)",
  lire:      "SELECT ct, del, expire, etat FROM liens WHERE id = ?1",
  supprimer: "UPDATE liens SET ct = NULL, etat = 'supprime' WHERE id = ?1 AND etat IS NULL",
  expirer:   "UPDATE liens SET ct = NULL, etat = 'expire' WHERE expire < ?1 AND etat IS NULL",
  oublier:   "DELETE FROM liens WHERE expire < ?1"
};

