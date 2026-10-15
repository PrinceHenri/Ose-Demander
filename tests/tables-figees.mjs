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
  "32": "Je ne vois personne d'autre à mes côtés ce jour-là."
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
  "16": "libre"
};

export const LINK_TH = {
  "1": "base",
  "2": "amour",
  "3": "maman",
  "4": "papa",
  "5": "amis",
  "6": "fete",
  "7": "mystere"
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
  "12": "☕"
};

export const LINK_TONE = {
  "1": "taquin",
  "2": "drole",
  "3": "mignon",
  "4": "theatral",
  "5": "romantique"
};

/* Clés du format compact : aucune ne doit disparaître (de nouvelles peuvent s'ajouter). */
export const LINK_KEYS = ["f","t","o","F","q","T","n","N","A","C","E","s","S","c","i","m","H","a","l","D","p","e","M","b","w","L","R"];

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
