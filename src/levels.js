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
  {
    // La petite caisse est fixe. Son ombre monte le long de la grande caisse
    // d'autant plus haut que la grande est loin : il faut l'éloigner (x ≥ 142
    // environ) pour que la créature la gravisse sans sortir la tête de l'ombre.
    phrase: "Pour monter, il faut une ombre plus grande que soi.",
    lampe: { x: 26, y: 146, drag: null },
    objets: [
      { type: 'caisse', x: 60, y: 140, w: 24, h: 24, drag: null },
      { type: 'caisse', x: 118, y: 124, w: 24, h: 40, drag: 'x', max: { x: 200 } },
    ],
    joueur: { x: 87, y: 155 },
    fenetre: { y: 60, h: 40 },
  },
  {
    // L'étagère est fixe, la lanterne se règle en hauteur. Trop haute, l'ombre de
    // l'étagère tombe trop bas sur le mur ; trop basse, la lumière passe dessous et
    // atteint la créature. Ça passe entre y = 82 et 92 environ.
    phrase: "La lampe se lève et se couche, comme le soleil.",
    lampe: { x: 26, y: 40, drag: 'y', min: { y: 30 }, max: { y: 146 }, suspendue: true },
    objets: [
      { type: 'etagere', x: 40, y: 100, w: 100, h: 4 },
    ],
    joueur: { x: 130, y: 155 },
    fenetre: { y: 84, h: 36 },
  },
  {
    // Un drap sur une corde : son ombre est grise. On y glisse plus vite, sans
    // pouvoir s'arrêter ni s'agripper. Il faut l'amener assez à gauche (x ≤ 68)
    // pour que son ombre prenne le relais de celle de la caisse.
    phrase: "Dans l'ombre du linge, on glisse sans pouvoir s'arrêter.",
    lampe: { x: 26, y: 80, drag: null, suspendue: true },
    corde: 60,
    objets: [
      { type: 'caisse', x: 50, y: 124, w: 24, h: 40, drag: null },
      { type: 'drap', verre: true, x: 150, y: 60, w: 30, h: 60, drag: 'x', min: { x: 44 }, max: { x: 190 } },
    ],
    joueur: { x: 74, y: 155 },
    fenetre: { y: 128, h: 36 },
  },
  {
    // L'étagère est haute, la lampe glisse le long de la poutre. Quand la lampe va
    // à gauche, l'ombre de l'étagère part à droite : il faut l'escorter jusqu'au bout,
    // et elle doit aussi couvrir la petite caisse qu'il enjambe.
    phrase: "Quand la lampe s'en va, les ombres viennent.",
    lampe: { x: 130, y: 40, drag: 'x', min: { x: 8 }, max: { x: 160 }, suspendue: true },
    objets: [
      { type: 'etagere', x: 100, y: 100, w: 28, h: 4 },
      { type: 'caisse', x: 150, y: 148, w: 24, h: 16, drag: null },
    ],
    joueur: { x: 96, y: 155 },
    fenetre: { y: 128, h: 36 },
  },
  {
    // Une caisse seule fait une ombre courte (la lampe est plus haute qu'elle).
    // Posée sur l'autre, elle dépasse la flamme : l'ombre monte jusqu'à la fenêtre.
    phrase: "Seul, on ne fait pas une bien grande ombre.",
    lampe: { x: 26, y: 124, drag: null, suspendue: true },
    objets: [
      { type: 'caisse', x: 70, y: 140, w: 24, h: 24, drag: null },
      { type: 'caisse', x: 170, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
    ],
    joueur: { x: 96, y: 155 },
    fenetre: { y: 74, h: 36 },
  },
  {
    // Casse-tête. Deux caisses, et il en faudrait partout : l'une doit couvrir la
    // trappe (ou faire pont au bord), l'autre allonger l'ombre (sur la petite caisse,
    // devant elle, ou même posée sur la lampe). Empiler les deux : on tombe dans le trou.
    phrase: "Une caisse ne peut pas être partout à la fois.",
    attend: true,
    lampe: { x: 26, y: 146, drag: null },
    trous: [{ x: 150, w: 24 }],
    objets: [
      { type: 'caisse', x: 70, y: 140, w: 24, h: 24, drag: null },
      { type: 'caisse', x: 120, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
      { type: 'caisse', x: 182, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
    ],
    joueur: { x: 96, y: 155 },
    fenetre: { y: 44, h: 36 },
  },
  {
    // Casse-tête. La lampe se porte. Cachée sous l'étagère (posée sur la caisse),
    // elle ouvre au-dessus un grand V d'ombre : la créature descend le bord gauche,
    // traverse l'étagère et remonte le bord droit, qui est une pente de lumière.
    // Autre solution : la caisse en équilibre au bord de l'étagère, la lampe au sol.
    phrase: "Une lumière qu'on cache fait les plus grandes ombres.",
    attend: true,
    lampe: { x: 150, y: 146, drag: 'xy', pesant: true },
    objets: [
      { type: 'armoire', x: 8, y: 88, w: 28, h: 76, drag: null },
      { type: 'etagere', x: 70, y: 112, w: 60, h: 4 },
      { type: 'caisse', x: 176, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
    ],
    joueur: { x: 12, y: 79 },
    fenetre: { y: 50, h: 36 },
  },
  {
    // Casse-tête. L'étagère est plus haute : il faut un piédestal de deux caisses
    // pour cacher la lampe dessous. Ou bien enfermer la lampe sur l'étagère, entre
    // les deux caisses : la lumière ne s'échappe plus que vers le plafond.
    phrase: "Pour cacher la lumière, il faut parfois l'élever.",
    attend: true,
    lampe: { x: 160, y: 146, drag: 'xy', pesant: true },
    objets: [
      { type: 'armoire', x: 8, y: 64, w: 28, h: 100, drag: null },
      { type: 'etagere', x: 76, y: 88, w: 60, h: 4 },
      { type: 'caisse', x: 120, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
      { type: 'caisse', x: 182, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
    ],
    joueur: { x: 12, y: 55 },
    fenetre: { y: 24, h: 36 },
  },
  {
    // Le dernier : la lampe descend seule en 40 s, puis s'éteint. Il faut répartir
    // les deux caisses (la trappe, l'ombre), retenir la créature et la lâcher au bon
    // moment, entre 16 et 22 s environ.
    phrase: "Le soleil se couche. Les ombres s'allongent, puis elles s'en vont.",
    lampe: { x: 26, y: 30, drag: null, suspendue: true },
    coucher: { de: 30, a: 146, duree: 40 },
    attend: true,
    trous: [{ x: 150, w: 24 }],
    objets: [
      { type: 'caisse', x: 70, y: 140, w: 24, h: 24, drag: null },
      { type: 'caisse', x: 120, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
      { type: 'caisse', x: 182, y: 140, w: 24, h: 24, drag: 'xy', pesant: true },
    ],
    joueur: { x: 96, y: 155 },
    fenetre: { y: 40, h: 36 },
  },
];

export const FIN = "La nuit est tombée. Dehors, toutes les ombres se rejoignent.";
