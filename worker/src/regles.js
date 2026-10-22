/* Ose Demander — règles du service des liens courts (limites, durées, requêtes SQL).
   Module à part : le module principal d'un Worker ne doit exporter que ses gestionnaires (fetch, scheduled). */
export const CT_MAX = 16384;                 // caractères du contenu chiffré (16 Ko)
export const CORPS_MAX = CT_MAX + 512;       // taille maximale d'une requête
export const DUREE = 365 * 24 * 3600 * 1000; // expiration : 1 an
export const GARDE = 365 * 24 * 3600 * 1000; // après l'expiration ou la suppression : on garde l'identifiant (sans contenu) un an de plus,
                                             // pour pouvoir dire « expirée » ou « supprimée » plutôt que « introuvable »
export const ID = /^[A-Za-z0-9_-]{22}$/, B64 = /^[A-Za-z0-9_-]+$/, EMPREINTE = /^[A-Za-z0-9_-]{43}$/;

/* Notifications de réponse */
export const NOTIF_MAX = 365 * 24 * 3600 * 1000;      // un abonnement vit jusqu'au dernier créneau + 7 jours (calculé par le site), un an au plus
export const NOTIF_GARDE = 30 * 24 * 3600 * 1000;     // après l'envoi, l'expiration ou la suppression : identifiant gardé 30 jours (sans abonnement),
                                                       // pour répondre « déjà envoyée » plutôt que « introuvable »
export const TTL_PUSH = 7 * 24 * 3600;                // secondes pendant lesquelles le service de notification garde le message si l'appareil est éteint
export const SUJET_VAPID = "mailto:contact@osedemander.fr";
export const NOTIF_CORPS_MAX = 2048;                  // taille maximale d'une requête de notification
export const REPONSE_MAX = 400;                       // réponse chiffrée par la personne invitée (base64url)
// Services de notification des navigateurs : le Worker n'envoie jamais rien ailleurs
export const HOTES_PUSH = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/;
export const P256 = /^[A-Za-z0-9_-]{87}$/, AUTH = /^[A-Za-z0-9_-]{22}$/;

/* Notifications de révélation (la personne invitée s'abonne pour elle-même, à l'heure des surprises « Révélé plus tard ») */
export const RAPPEL_MAX = 6;                          // heures de révélation par abonnement (un programme a 6 étapes au plus)
export const RAPPEL_LOT = 6;                          // envois par passage de la tâche planifiée : ~0,7 ms de calcul chacun (signature VAPID
                                                       // gardée en mémoire), pour rester loin des 10 ms de l'offre gratuite ; le reste part à la minute suivante
export const RAPPEL_MIN = 60 * 1000;                  // au moins une minute dans le futur
export const RAPPEL_GARDE = 7 * 24 * 3600 * 1000;     // pas encore parti 7 jours après l'heure prévue : effacé
export const RAPPEL_REESSAI = 15 * 60 * 1000;         // erreur passagère du service de notification : nouvel essai 15 minutes plus tard

/* Requêtes SQL (les seules utilisées ; le banc de test les reconnaît) */
export const SQL = {
  rappelCreer:    "INSERT INTO rappels (id, abo, del, heure, prochain, etat) VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
  rappelLire:     "SELECT abo, del, heure, etat FROM rappels WHERE id = ?1",
  rappelsDus:     "SELECT id, abo, heure FROM rappels WHERE etat IS NULL AND prochain <= ?1 ORDER BY prochain LIMIT ?2",
  rappelFin:      "UPDATE rappels SET abo = NULL, etat = ?1 WHERE id = ?2 AND etat IS NULL",
  rappelReessai:  "UPDATE rappels SET prochain = ?1 WHERE id = ?2 AND etat IS NULL",
  rappelOublier:  "DELETE FROM rappels WHERE heure < ?1",
  notifCreer:     "INSERT INTO notifs (id, abo, del, expire, etat) VALUES (?1, ?2, ?3, ?4, NULL)",
  notifLire:      "SELECT abo, del, expire, etat FROM notifs WHERE id = ?1",
  notifFin:       "UPDATE notifs SET abo = NULL, etat = ?1 WHERE id = ?2 AND etat IS NULL",
  notifExpirer:   "UPDATE notifs SET abo = NULL, etat = 'expire' WHERE expire < ?1 AND etat IS NULL",
  notifOublier:   "DELETE FROM notifs WHERE expire < ?1",
  creer:     "INSERT INTO liens (id, ct, del, expire, etat) VALUES (?1, ?2, ?3, ?4, NULL)",
  lire:      "SELECT ct, del, expire, etat FROM liens WHERE id = ?1",
  supprimer: "UPDATE liens SET ct = NULL, etat = 'supprime' WHERE id = ?1 AND etat IS NULL",
  expirer:   "UPDATE liens SET ct = NULL, etat = 'expire' WHERE expire < ?1 AND etat IS NULL",
  oublier:   "DELETE FROM liens WHERE expire < ?1"
};

