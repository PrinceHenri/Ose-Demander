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
    path: "invitation-repas-de-noel", tpl: "noel", label: "Repas de Noël",
    title: "Invitation repas de Noël animée et gratuite | Ose Demander",
    description: "Invite tes proches au repas de Noël avec une invitation animée à envoyer par message : un sapin qui s'illumine, un bouton Non qui résiste. Gratuit, sans compte.",
    h1: "Une invitation au repas de Noël, pleine de chaleur",
    lead: "Le repas de Noël se prépare souvent des semaines à l'avance : qui vient, à quelle heure, qui apporte la bûche. Une jolie invitation rend l'annonce plus festive. Avec Ose Demander, tu la crées en quelques minutes : l'enveloppe s'ouvre, la question apparaît, et chaque personne répond en un clic.",
    ideesTitre: "Des idées pour ton repas de Noël",
    fin: "Ton repas de Noël commence ici",
    idees: [
      "Un dîner le soir du 24 ou un déjeuner le 25, avec l'heure et l'adresse bien claires.",
      "Un plat ou un dessert à apporter, indiqué dans les détails, pour que tout le monde participe.",
      "Un échange de cadeaux surprise, annoncé dans le message.",
      "Plusieurs créneaux au choix, pour trouver le moment qui convient à tout le monde.",
      "Une invitation par personne, avec son prénom, pour que chacune soit unique."
    ],
    exemple: { de: "Alex", pour: "Lou", note: "Le texte se modifie librement : garde l'exemple ou écris le tien." },
    etapes: [
      "Choisis le modèle Repas de Noël, puis écris ton prénom et celui de la personne invitée.",
      "Indique le jour, l'heure et le lieu, ou propose plusieurs créneaux au choix.",
      "Envoie le lien par message, ou en image avec un QR code. La réponse t'arrive en un clic."
    ],
    faq: [
      ["Peut-on inviter plusieurs personnes ?", "Oui. Crée une invitation par personne, avec son prénom : chacune répond de son côté. « Dupliquer », dans « Mes invitations », te fait gagner du temps."],
      ["Quand l'envoyer ?", "Deux à trois semaines avant Noël, pour laisser le temps de s'organiser. Le modèle Repas de Noël est proposé en novembre et en décembre sur l'accueil, et reste accessible toute l'année depuis cette page."]
    ]
  },
  {
    path: "invitation-reveillon-nouvel-an", tpl: "reveillon", label: "Réveillon du Nouvel An",
    title: "Invitation réveillon du Nouvel An animée | Ose Demander",
    description: "Invite tes proches au réveillon du Nouvel An avec une invitation animée : une horloge vers minuit, des paillettes, un bouton Non qui résiste. Gratuit, sans compte.",
    h1: "Une invitation pour le réveillon du Nouvel An",
    lead: "Finir l'année ensemble, ça se prépare : le lieu, l'heure, la tenue, qui apporte quoi. Envoie une invitation qui donne le ton de la soirée : avec Ose Demander, l'enveloppe s'ouvre, l'horloge avance vers minuit, et la réponse arrive en un clic. Un vrai refus reste toujours possible.",
    ideesTitre: "Des idées pour ton réveillon",
    fin: "Ton réveillon commence ici",
    idees: [
      "Une soirée à thème, avec le code vestimentaire annoncé dans le message.",
      "Un dîner à la maison, puis le compte à rebours de minuit, ensemble.",
      "Une sortie en ville pour voir les feux d'artifice, avec le point de rendez-vous en détail.",
      "Un programme en étapes : apéritif, dîner, minuit, et une surprise pour la suite.",
      "Un lieu gardé secret jusqu'au 31, révélé à l'heure de ton choix."
    ],
    exemple: { de: "Noa", pour: "Eden", note: "Le texte se modifie librement : garde l'exemple ou écris le tien." },
    etapes: [
      "Choisis le modèle Réveillon du Nouvel An, puis écris ton prénom et celui de la personne invitée.",
      "Indique l'heure et le lieu, ou garde-les secrets jusqu'au moment voulu.",
      "Envoie le lien par message, ou en image avec un QR code. La réponse t'arrive en un clic."
    ],
    faq: [
      ["Peut-on garder le programme secret ?", "Oui. Chaque étape du programme peut rester une surprise, ou se révéler à l'heure de ton choix, avec un compte à rebours."],
      ["Quand l'envoyer ?", "Dès le début de décembre : les agendas de fin d'année se remplissent vite. Le modèle Réveillon est proposé en décembre et au début de janvier sur l'accueil, et reste accessible toute l'année depuis cette page."]
    ]
  },
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
  },
  {
    path: "demande-temoin-mariage", tpl: "temoin", label: "Demande de témoin",
    title: "Demande de témoin de mariage originale et gratuite | Ose Demander",
    description: "Demande à une personne chère d'être ton témoin de mariage avec une invitation animée : des alliances qui bougent, un bouton Non qui résiste. Gratuit, sans compte.",
    h1: "Demander à quelqu'un d'être ton témoin, autrement",
    lead: "Choisir son témoin de mariage, c'est dire à une personne qu'elle compte énormément. Plutôt qu'un simple message, envoie une demande qui marque le coup : l'enveloppe s'ouvre, les alliances se balancent, et la question apparaît. Le bouton Non résiste un peu, mais un vrai refus reste toujours possible.",
    ideesTitre: "Des idées pour ta demande de témoin",
    fin: "Ta demande de témoin commence ici",
    idees: [
      "Un dîner ou un verre à deux, pour poser la question de vive voix après l'invitation.",
      "Un message personnel caché jusqu'au Oui, pour dire pourquoi c'est cette personne.",
      "Un souvenir commun en indice : le lieu de votre première rencontre, une photo, une chanson.",
      "Une petite boîte à offrir le jour du rendez-vous, annoncée comme une surprise.",
      "La date du mariage dans l'invitation, pour une réponse en connaissance de cause."
    ],
    exemple: { de: "Sam", pour: "Charlie", note: "Le texte se modifie librement : garde l'exemple ou écris le tien." },
    etapes: [
      "Choisis le modèle Être mon témoin, puis écris ton prénom et celui de la personne choisie.",
      "Indique un moment pour en parler, ou la date du mariage, et ajoute un message personnel.",
      "Envoie le lien par message, ou en image avec un QR code. La réponse t'arrive en un clic."
    ],
    faq: [
      ["Peut-on demander à plusieurs témoins ?", "Oui. Crée une invitation par personne, avec son prénom : chaque demande reste personnelle. « Dupliquer », dans « Mes invitations », te fait gagner du temps."],
      ["Et si la réponse est non ?", "C'est possible, et c'est très bien ainsi : la personne peut répondre non pour de vrai, avec un message bienveillant déjà écrit qu'elle peut modifier."]
    ]
  },
  {
    path: "demande-parrain-marraine", tpl: "parrain", label: "Parrain ou marraine",
    title: "Demande de parrain ou marraine originale | Ose Demander",
    description: "Demande à une personne chère d'être parrain ou marraine avec une invitation animée et douce : un mobile qui tourne, un bouton Non qui résiste. Gratuit, sans compte.",
    h1: "Demander d'être parrain ou marraine, tout en douceur",
    lead: "Proposer à quelqu'un de devenir parrain ou marraine, c'est lui confier une place à part dans la vie d'un enfant. Une jolie demande rend ce moment inoubliable : l'enveloppe s'ouvre, le mobile tourne au-dessus du berceau, et la question apparaît. Un vrai refus reste toujours possible.",
    ideesTitre: "Des idées pour ta demande",
    fin: "Ta demande de parrainage commence ici",
    idees: [
      "Un message caché jusqu'au Oui, pour dire pourquoi cette personne compte pour vous.",
      "Une rencontre avec le bébé, à la maison, annoncée comme un simple goûter.",
      "Un petit cadeau symbolique, gardé en surprise jusqu'au rendez-vous.",
      "La date du baptême ou de la cérémonie, si elle est déjà fixée.",
      "Une demande à deux voix, signée par les deux parents."
    ],
    exemple: { de: "Camille", pour: "Alex", note: "Le texte se modifie librement : garde l'exemple ou écris le tien." },
    etapes: [
      "Choisis le modèle Être parrain ou marraine, puis écris ton prénom et celui de la personne choisie.",
      "Indique un moment pour se voir, ou la date de la cérémonie, et ajoute un message personnel.",
      "Envoie le lien par message, ou en image avec un QR code. La réponse t'arrive en un clic."
    ],
    faq: [
      ["Faut-il une cérémonie religieuse ?", "Non. Le parrainage peut être religieux, civil ou simplement symbolique : l'invitation s'adapte à toutes les situations."],
      ["Le bébé n'est pas encore né : est-ce trop tôt ?", "Pas du tout : beaucoup de parents posent la question pendant la grossesse. Indique simplement un moment pour en parler de vive voix."]
    ]
  },
  {
    path: "invitation-anniversaire", tpl: "monanniv", label: "Anniversaire",
    title: "Invitation anniversaire animée et gratuite | Ose Demander",
    description: "Crée une invitation d'anniversaire animée à envoyer par message : un gâteau, des bougies, un bouton Non qui résiste et une réponse en un clic. Gratuit, sans compte.",
    h1: "Une invitation d'anniversaire qui donne envie de venir",
    lead: "Que tu fêtes ton anniversaire ou celui d'une personne que tu aimes, une invitation animée met tout le monde dans l'ambiance : l'enveloppe s'ouvre, les bougies vacillent, et chaque personne répond en un clic. Le bouton Non résiste un peu, mais un vrai refus reste toujours possible.",
    autresIntro: "Pour l'anniversaire de quelqu'un d'autre :",
    autresModeles: [["annivfam", "Un anniversaire en famille"], ["annivamour", "L'anniversaire de mon amour"]],
    ideesTitre: "Des idées pour ton anniversaire",
    fin: "Ton anniversaire commence ici",
    idees: [
      "Une soirée chez toi, avec l'heure de fin indiquée pour que tout le monde s'organise.",
      "Un restaurant ou un bar, avec l'adresse et un lien vers la carte.",
      "Une fête surprise pour un proche, avec la consigne « Pas un mot ! » dans le message.",
      "Une journée en plusieurs étapes : activité, dîner, puis la suite en surprise.",
      "Plusieurs dates au choix, pour réunir le plus de monde possible."
    ],
    exemple: { de: "Charlie", pour: "Sam", note: "Le texte se modifie librement : garde l'exemple ou écris le tien." },
    etapes: [
      "Choisis le modèle Mon anniversaire, puis écris ton prénom et celui de la personne invitée.",
      "Indique le jour, l'heure et le lieu, ou propose plusieurs dates au choix.",
      "Envoie le lien par message, ou en image avec un QR code. La réponse t'arrive en un clic."
    ],
    faq: [
      ["Et pour l'anniversaire de quelqu'un d'autre ?", "Choisis le modèle « Un anniversaire en famille » ou « L'anniversaire de mon amour » : la question et l'ambiance s'adaptent."],
      ["Peut-on inviter plusieurs personnes ?", "Oui. Crée une invitation par personne, avec son prénom : chacune répond de son côté. « Dupliquer », dans « Mes invitations », te fait gagner du temps."]
    ]
  }
];
