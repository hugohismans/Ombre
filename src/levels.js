// Données des niveaux. Coordonnées en pixels logiques (scène de 240 × 180).
// Le sol est à y = 164, le mur droit commence à x = 224.
//
// lampe   : { x, y, drag, min, max } — la flamme est à (x + 4.5, y + 4.5).
//           drag : null (fixe), 'x', 'y' ou 'xy'.
// objets  : caisses (et plus tard étagères, bouteilles) :
//           { type, x, y, w, h, drag, min: {x, y}, max: {x, y}, verre }
//           verre: true → objet translucide, ombre grise.
// joueur  : position de départ (coin haut gauche de son corps 6 × 9).
// fenetre : ouverture dans le mur droit, de y à y + h.

export const LEVELS = [
  {
    phrase: "On m'a oublié là-haut. La fenêtre est encore ouverte.",
    lampe: { x: 26, y: 146, drag: null },
    objets: [
      { type: 'caisse', x: 120, y: 140, w: 24, h: 24, drag: 'x', min: { x: 40 }, max: { x: 196 } },
    ],
    joueur: { x: 150, y: 155 },
    fenetre: { y: 60, h: 36 },
  },
];

export const FIN = "Dehors, il reste encore un peu de jour.";
