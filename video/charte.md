# Charte de la vidéo

Tirée de la skill `ose-design` (`.claude/skills/ose-design/SKILL.md`). En cas de doute, c'est le site qui fait foi.
Esprit : **papier découpé, BD, jeu**. La vidéo doit avoir l'air de sortir du site, pas d'un modèle de pub.

## Couleurs

Thème de base (Lilas) pour les titres, cartons et la fin ; thèmes Amour et Soirée pour les démonstrations.

| Rôle | Lilas (base) | Amour | Soirée |
|---|---|---|---|
| Fond `--bg` | #ECE6FF | #FFE4EC | #F7F3EA |
| Surface (cartes) | #FFFFFF | #FFFFFF | #FFFFFF (champs #FCFAF5) |
| Encre (texte, contours, ombres) | #1F1546 | #4B0F2E | #22163A |
| Accent (remplissages, décor) | #E83F86 | #D9245F | #6D28D9 |
| Texte en accent | #C9196D | #CE1257 | #6D28D9 |
| Fond des boutons à texte | #D82D79 | #D9245F | #6D28D9 |

- Texte posé sur un fond coloré : encre ou blanc, toujours ≥ 4,5:1.
- Bandeau de fin : encre Lilas #1F1546 (comme le pied de page du site), texte #ECE6FF, accent #EC4389.
- **Interdit** : dégradés, ombres floues, verre dépoli, couleurs hors de cette table.

## Formes

- Contour plein **2 px d'encre** (à l'échelle de l'image : 4 à 6 px en 1080p) + **ombre dure décalée** (aucun flou), comme les cartes du site.
- Cartons de texte = cartes en papier : fond surface, rayon 18 à 22 px, ombre décalée de 6 à 8 px.
- Pointillés `--line` pour les séparations douces, comme la perforation du billet.

## Polices (hébergées dans `fonts/`, licence SIL OFL)

- **Bricolage Grotesque** : tout le texte à l'écran (titres en 800, interlettrage serré, sous-titres en 700 à 800).
- **Caveat** : seulement ce qui doit paraître écrit à la main (une signature, « Pour Sam » sur l'enveloppe). Jamais pour un sous-titre ni un titre.
- Aucune autre police.

## Logo

- « Ose Demander » en Bricolage Grotesque 800, encre, suivi d'un **« ? » rose** (#E83F86) : c'est le logotype du site (`logoHTML`).
- Version habituelle seulement, **jamais de logo de saison** (citrouille, ruban…) : la vidéo ne doit pas dater. Les captures sont prises à une date simulée (10 septembre 2026) pour cette raison.
- Version courte : **pas de logo au début** (elle ouvre sur le Non qui s'échappe).

## Animations

- Vives et courtes, comme sur le site : apparition « pop » (0,5 s, léger rebond), glissements, cartes qui se posent.
- Pas de transitions gadget (zoom flou, tourbillon, éclats lumineux).
- Les mouvements montrés sont ceux du vrai site (enregistrements), jamais simulés.

## Son

- **Pas de musique** (aucune génération possible ici) : voix off + 3 ou 4 effets brefs et discrets (enveloppe, Non, Oui), dans la famille des sons du site.
- Version courte : une version avec voix et une version pensée pour accueillir un son ajouté dans l'appli (TikTok, Instagram, YouTube).

## Ton et textes

- **Tutoiement**, ton complice et bienveillant, jamais insistant. Le Non joue, mais un vrai non reste toujours possible : la vidéo le montre.
- **Neutre** : aucun accord au masculin ou au féminin (« la personne invitée », on tourne la phrase).
- Français soigné : « », espace avant `? ! :`, « 20 h ». Phrases courtes. Un emoji au plus.
- Pas de flèches décoratives ni de « · ».
- Adresse toujours écrite **osedemander.fr** (dite « ose demander point f r »).

## Sous-titres

- Bricolage Grotesque 800, encre sur carte blanche (contour encre, ombre décalée) : lisibles sur toutes les scènes.
- Une à deux lignes, 32 caractères par ligne au plus.
- **Version verticale (TikTok, Reels, Shorts)** : gros (64 à 72 px de haut en 1080 × 1920), placés **dans la bande centrale** : jamais dans les 480 px du bas (légende, boutons), ni dans les 160 px de droite (j'aime, commentaires, partage), ni dans les 220 px du haut. Zone sûre retenue : x de 64 à 900, y de 260 à 1400.
- `osedemander.fr` visible au moins 2,5 s à la fin, dans la zone sûre.
