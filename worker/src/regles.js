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
export const RAPPEL_LOT = 4;                          // envois par passage de la tâche planifiée : ~0,9 ms de calcul chacun (mesuré par le banc ; signature
                                                       // VAPID gardée en mémoire) : ~4 ms, loin des 10 ms de l'offre gratuite ; le reste part à la minute suivante
export const RAPPEL_MIN = 60 * 1000;                  // au moins une minute dans le futur
export const RAPPEL_GARDE = 7 * 24 * 3600 * 1000;     // pas encore parti 7 jours après l'heure prévue : effacé
export const RAPPEL_REESSAI = 15 * 60 * 1000;         // erreur passagère du service de notification : nouvel essai 15 minutes plus tard

/* Rappels de rendez-vous « Me rappeler 3 h avant » (pour son propre appareil, une fois l'invitation acceptée) */
export const RDV_PAR_ABO = 10;                        // rappels en attente au plus par abonnement (empreinte HMAC de l'abonnement)
export const RDV_GARDE = 2 * 3600 * 1000;             // pas encore parti 2 h après l'heure prévue : supprimé sans envoi (il ne sert plus à rien)
export const RDV_REESSAI = 5 * 60 * 1000;             // erreur passagère du service de notification : nouvel essai 5 minutes plus tard

/* Invitations de groupe */
export const GROUPE_REP_MAX = 100;                    // réponses par groupe
export const GROUPE_BLOB_MIN = 140;                   // réponse chiffrée : version, clé éphémère, IV, contenu et étiquette (base64url)
export const GROUPE_BLOB_MAX = 2048;                  // 2 Ko au plus par réponse chiffrée
export const GROUPE_CORPS_MAX = 4096;                 // taille maximale d'une requête de réponse ou de gestion
export const GROUPE_DUREE_MAX = 365 * 24 * 3600 * 1000; // un an au plus (le site calcule : dernier créneau + 3 mois, sans date : 6 mois)
export const GROUPE_GARDE = 30 * 24 * 3600 * 1000;    // expiré ou supprimé : identifiant gardé 30 jours (sans réponse ni abonnement)
export const GROUPE_NOTIF_ECART = 15 * 60 * 1000;     // au plus une notification toutes les 15 minutes par groupe

/* Requêtes SQL (les seules utilisées ; le banc de test les reconnaît) */
export const SQL = {
  rappelCreer:    "INSERT INTO rappels (id, abo, del, heure, prochain, etat) VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
  rappelLire:     "SELECT abo, del, heure, etat FROM rappels WHERE id = ?1",
  rappelsDus:     "SELECT id, abo, heure FROM rappels WHERE etat IS NULL AND prochain <= ?1 ORDER BY prochain LIMIT ?2",
  rappelFin:      "UPDATE rappels SET abo = NULL, etat = ?1 WHERE id = ?2 AND etat IS NULL",
  rappelReessai:  "UPDATE rappels SET prochain = ?1 WHERE id = ?2 AND etat IS NULL",
  rappelOublier:  "DELETE FROM rappels WHERE heure < ?1",
  rdvCreer:       "INSERT INTO rdv (id, abo, aboh, del, heure, prochain) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
  rdvLire:        "SELECT del FROM rdv WHERE id = ?1",
  rdvCompter:     "SELECT COUNT(*) AS n FROM rdv WHERE aboh = ?1",
  rdvDus:         "SELECT id, abo, heure FROM rdv WHERE prochain <= ?1 ORDER BY prochain LIMIT ?2",
  rdvEffacer:     "DELETE FROM rdv WHERE id = ?1",
  rdvReessai:     "UPDATE rdv SET prochain = ?1 WHERE id = ?2",
  rdvOublier:     "DELETE FROM rdv WHERE heure < ?1",
  groupeCreer:    "INSERT INTO groupes (id, gestion, ferme, expire, cree, etat, abo, notif_der, notif_n) VALUES (?1, ?2, 0, ?3, ?4, NULL, NULL, NULL, 0)",
  groupeLire:     "SELECT gestion, ferme, expire, etat, abo FROM groupes WHERE id = ?1",
  groupeFerme:    "SELECT ferme FROM groupes WHERE id = ?1 AND etat IS NULL",
  groupeFermer:   "UPDATE groupes SET ferme = ?1 WHERE id = ?2",
  groupeAbo:      "UPDATE groupes SET abo = ?1, notif_n = 0 WHERE id = ?2",
  groupeNouvelle: "UPDATE groupes SET notif_n = notif_n + 1 WHERE id = ?1",
  groupeSignale:  "UPDATE groupes SET notif_der = ?1, notif_n = ?2 WHERE id = ?3",
  groupeFin:      "UPDATE groupes SET etat = ?1, expire = MIN(expire, ?2), abo = NULL, notif_n = 0 WHERE id = ?3",
  groupesASignaler: "SELECT id, abo, notif_n FROM groupes WHERE notif_n > 0 AND abo IS NOT NULL AND etat IS NULL AND (notif_der IS NULL OR notif_der <= ?1) AND expire > ?2 ORDER BY notif_der LIMIT ?3",
  groupesExpirer: "UPDATE groupes SET etat = 'expire', abo = NULL, notif_n = 0 WHERE expire < ?1 AND etat IS NULL",
  groupesOublier: "DELETE FROM groupes WHERE expire < ?1 AND etat IS NOT NULL",
  reponseCreer:   "INSERT INTO reponses (id, groupe_id, blob, edit, maj) VALUES (?1, ?2, ?3, ?4, ?5)",
  reponseLire:    "SELECT groupe_id, edit FROM reponses WHERE id = ?1",
  reponseModifier: "UPDATE reponses SET blob = ?1, maj = ?2 WHERE id = ?3",
  reponseEffacer: "DELETE FROM reponses WHERE id = ?1",
  reponsesCompter: "SELECT COUNT(*) AS n FROM reponses WHERE groupe_id = ?1",
  reponsesLire:   "SELECT id, blob, maj FROM reponses WHERE groupe_id = ?1 ORDER BY maj",
  reponsesEffacerGroupe: "DELETE FROM reponses WHERE groupe_id = ?1",
  reponsesOrphelines: "DELETE FROM reponses WHERE groupe_id IN (SELECT id FROM groupes WHERE etat IS NOT NULL)",
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

