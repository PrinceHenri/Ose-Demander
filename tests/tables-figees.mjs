/* Tables de codes figées le 2026-10-15 (commit 036fa28). Un code existant ne change JAMAIS de valeur
   et n'est jamais supprimé ni réutilisé : les tests comparent index.html à ces copies.
   Nouvelle valeur ou nouvelle formulation = nouveau code, ajouté à la suite dans index.html ET ici. */

export const LINK_PHRASES = {
  "1": "Ça te dit un rendez-vous avec moi ?",
  "2": "Tu passes la Saint-Valentin avec moi ?",
  "3": "Je peux t'emmener fêter ton anniversaire ?",
  "4": "On fête notre anniversaire ensemble ?",
  "5": "Veux-tu m'épouser ?",
  "6": "Maman, je t'emmène pour la fête des mères ?",
  "7": "Papa, je t'emmène pour la fête des pères ?",
  "8": "Je vous invite pour la fête des grands-parents ?",
  "9": "Tu viens fêter ton anniversaire avec moi ?",
  "10": "Tu viens avec moi ?",
  "11": "Je t'invite pour ton anniversaire ?",
  "12": "Tu veux être mon témoin ?",
  "13": "Tu me confies ta journée ?",
  "14": "On se réconcilie autour d'un moment à deux ?",
  "15": "Ça te dit qu'on se voie ?",
  "16": "Tu dis oui ?",
  "17": "Je t'emmène dîner, sans rien te dire ?",
  "18": "J'ai envie de passer ce moment avec toi, rien qu'avec toi.",
  "19": "Prépare ton plus beau sourire, je m'occupe du reste.",
  "20": "Tu n'as rien à prévoir, juste à dire oui.",
  "21": "Merci pour tout. Ce moment, c'est pour toi.",
  "22": "Tu t'occupes toujours de nous, cette fois c'est mon tour.",
  "23": "Un petit moment rien que pour toi, tu l'as bien mérité.",
  "24": "Ça fait trop longtemps, on rattrape le temps perdu.",
  "25": "Pas d'excuse cette fois, je t'attends.",
  "26": "Ce ne sera pas pareil sans toi.",
  "27": "Fais-moi confiance, tu vas aimer.",
  "28": "Je ne dis rien de plus, c'est une surprise.",
  "29": "Garde ton agenda libre, j'ai prévu quelque chose.",
  "30": "Je veux passer tous mes moments avec toi.",
  "31": "Un petit moment rien que pour vous, vous l'avez bien mérité.",
  "32": "Je ne vois personne d'autre à mes côtés ce jour-là.",
  // Ajoutés le 2026-10-15 (occasion saisonnière Halloween)
  "33": "Tu oses venir fêter Halloween avec moi ?",
  "34": "Viens avec ton meilleur déguisement.",
  // Ajoutés le 2026-10-15 (occasions saisonnières Noël et réveillon)
  "35": "Tu viens au repas de Noël ?",
  "36": "La table ne sera pas complète sans toi.",
  "37": "On passe le réveillon ensemble ?",
  "38": "On finit l'année ensemble, et on commence la suivante pareil.",
  // Ajoutés le 2026-10-15 (occasions saisonnières galette des rois, Pâques, fête de la musique)
  "39": "On partage la galette ensemble ?",
  "40": "La fève est peut-être pour toi.",
  "41": "Tu viens fêter Pâques avec moi ?",
  "42": "Il y aura du chocolat, c'est promis.",
  "43": "On sort pour la fête de la musique ?",
  "44": "Prépare tes oreilles, la soirée va être longue.",
  // Ajoutés le 2026-10-16 (occasions permanentes, lot 1 d'ambiances)
  "45": "Tu viens fêter mon anniversaire ?",
  "46": "Toute la famille sera là pour toi.",
  "47": "Tu viens à la fête surprise ?",
  "48": "Surtout, pas un mot à la personne fêtée.",
  // Ajoutés le 2026-10-16 (ambiances, lot 2)
  "49": "Ton jour, rien que pour toi : je m'occupe de tout.",
  "50": "On s'offre un week-end rien qu'à deux ?",
  "51": "Prépare juste un petit sac, je m'occupe du reste.",
  "52": "Tu me laisses t'inviter à dîner ?",
  "53": "Une jolie table, une belle soirée, et toi en face de moi.",
  // Ajoutés le 2026-10-16 (ambiances, lot 3)
  "54": "J'ai une grande nouvelle à t'annoncer : tu viens ?",
  "55": "Je préfère te le dire en vrai.",
  "56": "Tu veux bien être parrain ou marraine ?",
  "57": "Je ne vois personne de mieux pour ce rôle.",
  "58": "Tu viens à la baby shower ?",
  "59": "On fête l'arrivée du bébé, il ne manque plus que toi.",
  "60": "Tu viens au repas de famille ?",
  "61": "Il y aura une place pour toi à table, comme toujours.",
  // Ajoutés le 2026-10-16 (ambiances, lot 4)
  "62": "Tu viens à l'enterrement de vie de célibataire ?",
  "63": "Une dernière folie avant le grand jour, ne rate pas ça.",
  "64": "Tu viens pendre la crémaillère chez moi ?",
  "65": "Nouvelle adresse, même bonne humeur : je t'attends.",
  "66": "Tu viens à ma soirée ?",
  "67": "On part ensemble ?",
  "68": "Fais ta valise, l'aventure commence bientôt.",
  "69": "Tu me suis pour un voyage surprise ?",
  "70": "Prépare un sac, la destination reste secrète."
};

export const LINK_OCC = {
  "1": "date",
  "2": "valentin",
  "3": "annivamour",
  "4": "couple",
  "5": "mariage",
  "6": "meres",
  "7": "peres",
  "8": "grands",
  "9": "annivfam",
  "10": "sortie",
  "11": "annivami",
  "12": "temoin",
  "13": "surprise",
  "14": "pardon",
  "15": "juste",
  "16": "libre",
  "17": "halloween",
  "18": "noel",
  "19": "reveillon",
  "20": "galette",
  "21": "paques",
  "22": "musique",
  "23": "monanniv",
  "24": "fetesurprise",
  "25": "weekend",
  "26": "dinerspecial",
  "27": "nouvelle",
  "28": "parrain",
  "29": "babyshower",
  "30": "repasfam",
  "31": "evc",
  "32": "cremaillere",
  "33": "soiree",
  "34": "voyage",
  "35": "voyagesurprise"
};

export const LINK_TH = {
  "1": "base",
  "2": "amour",
  "3": "maman",
  "4": "papa",
  "5": "amis",
  "6": "fete",
  "7": "mystere",
  "8": "halloween",
  "9": "noel",
  "10": "reveillon",
  "11": "galette",
  "12": "valentin",
  "13": "paques",
  "14": "meres",
  "15": "peres",
  "16": "musique",
  "17": "date",
  "18": "monanniv",
  "19": "annivfam",
  "20": "temoin",
  "21": "fetesurprise",
  "22": "annivamour",
  "23": "couple",
  "24": "weekend",
  "25": "dinerspecial",
  "26": "nouvelle",
  "27": "parrain",
  "28": "babyshower",
  "29": "repasfam",
  "30": "evc",
  "31": "cremaillere",
  "32": "soiree",
  "33": "voyage",
  "34": "journeesurprise",
  "35": "voyagesurprise"
};

export const LINK_NO = {
  "1": "fuit",
  "2": "retrecit",
  "3": "supplie",
  "4": "transforme"
};

export const LINK_CH = {
  "1": "any",
  "2": "wa",
  "3": "sms",
  "4": "snap",
  "5": "ig",
  "6": "fb"
};

export const LINK_AN = {
  "1": "n",
  "2": "d",
  "3": "0"
};

export const LINK_AC = {
  "1": "framboise",
  "2": "corail",
  "3": "mandarine",
  "4": "or",
  "5": "menthe",
  "6": "ocean",
  "7": "violet",
  "8": "nuit"
};

export const LINK_EM = {
  "1": "💌",
  "2": "❤️",
  "3": "🌹",
  "4": "💍",
  "5": "🌷",
  "6": "👔",
  "7": "🎂",
  "8": "🎉",
  "9": "🎁",
  "10": "✨",
  "11": "🍕",
  "12": "☕",
  "13": "🎃",
  "14": "🎄",
  "15": "🥂",
  "16": "👑",
  "17": "🐣",
  "18": "🎶",
  "19": "💘",
  "20": "🤰",
  "21": "🤱",
  "22": "💐"
};

export const LINK_TONE = {
  "1": "taquin",
  "2": "drole",
  "3": "mignon",
  "4": "theatral",
  "5": "romantique"
};

/* Introductions scénarisées (ajoutées le 2026-10-17) : les deux cartes d'un code ne changent jamais. */
export const LINK_INTRO = {
  "1": ["J'ai une idée derrière la tête…", "Et elle te concerne."],
  "2": ["Un jour pas comme les autres approche…", "Le tien."],
  "3": ["Tu te souviens de notre premier jour ?", "Moi, oui."],
  "4": ["Et si on s'échappait un peu ?", "Rien que nous deux."],
  "5": ["Ce soir-là, pas de cuisine pour toi…", "J'ai réservé."],
  "6": ["Une année de plus, ça se fête…", "En famille."],
  "7": ["J'ai quelque chose à te dire…", "Mais pas ici."],
  "8": ["Un petit être va avoir besoin de quelqu'un…", "Et j'ai pensé à toi."],
  "9": ["Quelqu'un de tout petit arrive bientôt…", "Et ça se fête !"],
  "10": ["La table est mise…", "Il manque juste toi."],
  "11": ["Une bougie de plus sur le gâteau…", "Et une place pour toi."],
  "12": ["J'ai une question très sérieuse…", "Enfin, presque."],
  "13": ["Le grand jour approche…", "Mais d'abord, la fête."],
  "14": ["J'ai de nouvelles clés…", "Et une porte ouverte pour toi."],
  "15": ["Musique, rires, bonne compagnie…", "Il ne manque que toi."],
  "16": ["Tu as envie de changer d'air ?", "Moi aussi."],
  "17": ["Chut…", "Tu sais garder un secret ?"],
  "18": ["Ne prévois rien ce jour-là…", "Je m'occupe de tout."],
  "19": ["Et si on partait…", "Sans te dire où ?"],
  "20": ["Les citrouilles sont prêtes…", "Les frissons aussi."],
  "21": ["Les guirlandes sont accrochées…", "Et j'ai une place pour toi."],
  "22": ["Le compte à rebours a commencé…", "Et je veux le finir avec toi."],
  "23": ["Une galette dorée sort du four…", "Et peut-être une couronne pour toi."],
  "24": ["Il y a des jours faits pour le dire…", "Celui-là en est un."],
  "25": ["Des œufs se cachent un peu partout…", "Et j'en ai gardé un pour toi."],
  "26": ["Tu as tant fait pour moi…", "À mon tour, maman."],
  "27": ["Tu as toujours été là pour moi…", "À mon tour, papa."],
  "28": ["Tu entends ce son au loin ?", "C'est la fête qui commence."]
};

/* Clés du format compact : aucune ne doit disparaître (de nouvelles peuvent s'ajouter). */
export const LINK_KEYS = ["f","t","o","F","q","T","n","N","A","C","E","s","S","c","i","m","H","a","l","D","p","e","M","b","w","L","R","I"];

/* Origine des dates du format compact : ne doit jamais changer. */
export const LINK_T0 = 1767225600000;

/* Textes des tons du Non : le ton choisi est dans le lien, ses textes ne changent donc jamais.
   (Un ton peut recevoir de nouvelles phrases seulement via un nouveau ton = nouveau code.) */
export const NO_TONES = [
  {
    "id": "taquin",
    "t": "Taquin",
    "lines": [
      "Raté !",
      "Essaie encore",
      "Vraiment ?",
      "Le Non est en grève aujourd'hui",
      "Il reste un bouton, regarde à gauche 👀",
      "Allez…"
    ],
    "beg": [
      "Vraiment ?",
      "Vraiment vraiment ?",
      "Réfléchis bien…",
      "Je vais pleurer 🥺",
      "Tu me brises le cœur",
      "Dernière chance…"
    ],
    "giveUp": "Bon… d'accord 🥲",
    "small": "Il ne peut pas être plus petit 😇",
    "turn": "Il voulait tellement que tu dises oui…"
  },
  {
    "id": "drole",
    "t": "Drôle",
    "lines": [
      "Erreur 404 : Non introuvable",
      "Ce bouton est parti en vacances 🏖️",
      "Le Non fait la sieste, repasse plus tard",
      "Bien tenté, mais non",
      "Tu as essayé d'éteindre et de rallumer ?",
      "Le Oui, lui, est très disponible 👀"
    ],
    "beg": [
      "Tu rates un truc génial",
      "Le Oui a des snacks 🍿",
      "Même mon chat dirait oui",
      "Je rajoute un dessert ?",
      "Ça ira dans mes mémoires",
      "Allez, sois sympa 😅"
    ],
    "giveUp": "Bon, j'abandonne 🏳️",
    "small": "Il est devenu microscopique 🔬",
    "turn": "Le Non a changé de camp 😎"
  },
  {
    "id": "mignon",
    "t": "Mignon",
    "lines": [
      "Oh non 🥺",
      "Le Non a un peu peur de toi",
      "Il s'est caché !",
      "Le Non préfère faire un câlin",
      "Petit Non timide…",
      "Psst, le Oui est juste là 💛"
    ],
    "beg": [
      "Oh non 🥺",
      "S'il te plaît…",
      "Juste un petit oui ?",
      "Avec des paillettes ✨",
      "Mes yeux de chaton 🐱",
      "Pour me faire plaisir ?"
    ],
    "giveUp": "D'accord… 🥹",
    "small": "Il est tout petit maintenant 🐣",
    "turn": "Le Non voulait juste un câlin 💛"
  },
  {
    "id": "theatral",
    "t": "Théâtral",
    "lines": [
      "Ô désespoir !",
      "Quelle tragédie en trois actes…",
      "Le Non a fui la scène !",
      "Rideau ! Ah non, pas encore",
      "Le public retient son souffle",
      "Une ovation pour le Oui ?"
    ],
    "beg": [
      "Ô cruauté !",
      "Mon cœur se brise…",
      "Je m'effondre !",
      "Les violons pleurent 🎻",
      "Ainsi finit l'histoire ?",
      "Un dernier acte…"
    ],
    "giveUp": "Soit. Le rideau tombe 🎭",
    "small": "Il disparaît dans les coulisses",
    "turn": "Coup de théâtre : le Non voulait dire oui !"
  },
  {
    "id": "romantique",
    "t": "Romantique",
    "lines": [
      "Même le Non a envie de dire oui",
      "Mon cœur retient son souffle",
      "Le Non s'est perdu dans tes yeux",
      "Ce bouton rêve d'un oui",
      "Un oui, et tout commence",
      "Le Oui t'attend 💗"
    ],
    "beg": [
      "Penses-y encore…",
      "Mon cœur bat plus vite",
      "Imagine-nous là-bas",
      "Juste un petit oui ?",
      "Tant à vivre ensemble…",
      "Une chance pour nous ?"
    ],
    "giveUp": "Je comprends… 💔",
    "small": "Il s'efface doucement",
    "turn": "Le Non a fondu ❤️"
  }
];
