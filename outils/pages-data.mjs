/* Textes des pages d'occasion (référencement). Une page = une adresse, un modèle, des textes uniques.
   Tutoiement, formulations neutres, ni flèche ni « · » (skill ose-design). Les exemples d'invitation reprennent
   la question et le message du modèle (TEMPLATES dans index.html) : ils ne sont pas recopiés ici.
   Après toute modification : node outils/pages.mjs (le banc vérifie que les pages publiées sont à jour). */

export const MISE_A_JOUR = "2026-10-18"; // date des pages, pour sitemap.xml

/* Questions communes à toutes les pages (après les questions propres à l'occasion) */
export const FAQ_COMMUNE = [
  ["C'est vraiment gratuit ?", "Oui. Ose Demander est gratuit, sans compte et sans publicité."],
  ["La personne peut-elle dire non ?", "Oui. Le bouton Non joue un peu à cache-cache, mais un lien « Répondre non, pour de vrai » apparaît toujours : dire oui n'est jamais obligatoire."],
  ["Comment je reçois la réponse ?", "Par l'appli que tu choisis en créant l'invitation : WhatsApp, SMS, Snapchat, Instagram ou Messenger. La réponse part déjà écrite, il suffit de l'envoyer."],
  ["Mes informations sont-elles stockées ?", "Rien n'est stocké en clair en ligne. L'invitation tient dans son lien ; avec un lien court, elle est chiffrée sur ton appareil et seul ce lien permet de la lire."]
];

export const PAGES = [
  {
    path: "invitation-saint-valentin", tpl: "valentin", label: "Saint-Valentin",
    title: "Invitation Saint-Valentin animée et gratuite | Ose Demander",
    description: "Crée une invitation de Saint-Valentin animée à envoyer par message : un cœur qui bat, un bouton Non qui résiste, une réponse en un clic. Gratuit, sans compte.",
    h1: "Une invitation de Saint-Valentin qui fait sourire",
    lead: "Proposer un dîner, une sortie ou une soirée à deux pour le 14 février, c'est plus doux avec une jolie invitation. Ose Demander t'aide à la créer en quelques minutes : l'enveloppe s'ouvre, la question apparaît, et le bouton Non résiste juste assez pour faire sourire. Un vrai refus reste toujours possible.",
    ideesTitre: "Des idées pour ta Saint-Valentin",
    fin: "Ta Saint-Valentin commence ici",
    idees: [
      "Un dîner aux chandelles, au restaurant ou à la maison, avec le menu gardé en surprise.",
      "Une sortie qui vous ressemble : cinéma, patinoire, concert ou balade au coucher du soleil.",
      "Un programme en plusieurs étapes, chacune révélée à son heure le jour J.",
      "Un week-end à deux, avec un seul indice : « Prépare un petit sac ».",
      "Un message caché jusqu'au Oui, pour dire ce qui compte vraiment."
    ],
    exemple: { de: "Alex", pour: "Camille", note: "Le texte se modifie librement : garde l'exemple ou écris le tien." },
    etapes: [
      "Choisis le modèle Saint-Valentin, puis écris ton prénom et celui de la personne invitée.",
      "Indique le jour, l'heure et ce que tu prévois, ou garde la surprise jusqu'au bout.",
      "Envoie le lien par message, ou en image avec un QR code. La réponse t'arrive en un clic."
    ],
    faq: [
      ["Peut-on garder le lieu secret ?", "Oui. Le lieu, l'activité ou le message peuvent rester une surprise, ou se révéler à l'heure de ton choix, avec un compte à rebours."],
      ["Quand l'envoyer ?", "Quelques jours avant le 14 février, pour laisser le temps de s'organiser. Le modèle Saint-Valentin est proposé dès janvier sur l'accueil, et reste accessible toute l'année depuis cette page."]
    ]
  }
];
