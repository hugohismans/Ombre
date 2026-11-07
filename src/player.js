// La petite créature d'ombre : marche seule vers la droite, grimpe le long de la
// matière, tient debout sur le bord inférieur des ombres, et se dissout au premier
// pixel de lumière.

import { LUMIERE, GRIS } from './world.js';

export const PW = 6;
export const PH = 9;

// Silhouettes (6 × 9), tournées vers la droite. Pas de visage.
const FRAMES = {
  marche1: [
    '.#.#..',
    '.#.#..',
    '.####.',
    '#####.',
    '.####.',
    '.####.',
    '######',
    '.####.',
    '.#..#.',
  ],
  marche2: [
    '..#.#.',
    '.#.#..',
    '.####.',
    '#####.',
    '.####.',
    '.####.',
    '.#####',
    '.####.',
    '..##..',
  ],
  repos: [
    '......',
    '.#.#..',
    '.#.#..',
    '.####.',
    '#####.',
    '.####.',
    '.####.',
    '.####.',
    '######',
  ],
  grimpe1: [
    '.#.#.#',
    '.#.#.#',
    '.#####',
    '#####.',
    '.####.',
    '.####.',
    '.####.',
    '.####.',
    '.#..#.',
  ],
  grimpe2: [
    '.#.#..',
    '.#.#.#',
    '.####.',
    '######',
    '.####.',
    '.####.',
    '.####.',
    '.####.',
    '..#.#.',
  ],
};

const toPixels = (rows) => {
  const px = [];
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') px.push([i, j]); }));
  return px;
};

export const SPRITES = Object.fromEntries(Object.entries(FRAMES).map(([k, v]) => [k, toPixels(v)]));

// Le corps, pour la lumière : l'union de toutes les silhouettes.
const CORPS = (() => {
  const set = new Set();
  for (const px of Object.values(SPRITES)) for (const [i, j] of px) set.add(i + j * PW);
  return [...set].map((k) => [k % PW, Math.floor(k / PW)]);
})();

const VITESSE = 12;   // px/s, lentement
const GRIMPE = 14;    // px/s
const GRAVITE = 260;  // px/s²
const CHUTE_MAX = 120;
const MARCHE_MAX = 3; // hauteur d'une marche franchie sans grimper
const GLISSE = 2.2;   // dans l'ombre grise, il glisse plus vite

export class Player {
  constructor(world, start) {
    this.world = world;
    this.x = start.x;
    this.y = start.y;
    this.marche = true;   // avance ou attend (tap)
    this.mode = 'sol';    // 'sol' | 'grimpe' | 'chute'
    this.accX = 0;
    this.accY = 0;
    this.vy = 0;
    this.pas = 0;         // pour l'animation
    this.dansGris = false;
    this.bloqueGris = 0;
    this.vivant = true;
    this.gagne = false;
    this.protege = false;
  }

  get rect() { return { x: this.x, y: this.y, w: PW, h: PH }; }

  libre(x, y) {
    const w = this.world;
    for (let j = 0; j < PH; j++) for (let i = 0; i < PW; i++) if (w.solide(x + i, y + j)) return false;
    return true;
  }

  // Quelque chose le porte sous ses pieds : la matière, ou le bord de la lumière.
  porte(x, y) {
    const w = this.world;
    const yy = y + PH;
    for (let i = 0; i < PW; i++) {
      if (w.solide(x + i, yy) || w.lumiere(x + i, yy) === LUMIERE) return true;
    }
    return false;
  }

  piedsEclaires(x, y) {
    const w = this.world;
    for (let i = 0; i < PW; i++) if (w.lumiere(x + i, y + PH - 1) === LUMIERE) return true;
    return false;
  }

  devantBloque(x, y) {
    const w = this.world;
    for (let j = 0; j < PH; j++) if (w.solide(x + PW, y + j)) return true;
    return false;
  }

  eclaire() {
    const w = this.world;
    let gris = false;
    for (const [i, j] of CORPS) {
      const v = w.lumiere(this.x + i, this.y + j);
      if (v === LUMIERE) return 'lumiere';
      if (v === GRIS) gris = true;
    }
    return gris ? 'gris' : 'ombre';
  }

  basculer() {
    // Dans une ombre grise, on glisse : impossible de s'arrêter.
    if (this.dansGris && this.marche) return false;
    this.marche = !this.marche;
    return true;
  }

  // Si le bord de lumière monte sous lui, l'ombre le soulève (un peu).
  souleverSiBesoin() {
    let k = 0;
    while (k < MARCHE_MAX && this.piedsEclaires(this.x, this.y) && this.libre(this.x, this.y - 1)) {
      this.y -= 1;
      k++;
    }
  }

  avancerUnPixel() {
    const nx = this.x + 1;
    if (this.libre(nx, this.y)) {
      this.x = nx;
    } else {
      let monte = false;
      for (let s = 1; s <= MARCHE_MAX; s++) {
        if (this.libre(nx, this.y - s)) {
          this.x = nx;
          this.y -= s;
          monte = true;
          break;
        }
      }
      if (!monte) {
        // Dans le gris, on ne peut pas s'agripper : il bute et glisse sur place.
        if (!this.dansGris && this.devantBloque(this.x, this.y)) this.mode = 'grimpe';
        return false;
      }
    }
    this.pas++;
    this.souleverSiBesoin();
    if (!this.porte(this.x, this.y)) {
      // Suivre une pente qui descend, sinon tomber.
      let pose = false;
      for (let s = 1; s <= MARCHE_MAX; s++) {
        if (!this.libre(this.x, this.y + s)) break;
        if (this.porte(this.x, this.y + s)) {
          this.y += s;
          pose = true;
          break;
        }
      }
      if (!pose) {
        this.mode = 'chute';
        this.vy = 0;
        this.accY = 0;
      }
    }
    return true;
  }

  grimperUnPixel() {
    if (!this.devantBloque(this.x, this.y)) {
      // Arrivé en haut : se hisser par-dessus le bord.
      this.mode = 'sol';
      if (this.libre(this.x + 1, this.y)) {
        this.x += 1;
        this.pas++;
      }
      if (!this.porte(this.x, this.y)) {
        this.mode = 'chute';
        this.vy = 0;
      }
      return false;
    }
    if (!this.libre(this.x, this.y - 1)) return false; // coincé sous un plafond
    this.y -= 1;
    this.pas++;
    return true;
  }

  update(dt) {
    if (!this.vivant || this.gagne) return;
    // Tombé dans une trappe : perdu.
    if (this.y > 190) { this.vivant = false; this.perdu = true; return; }
    const avant = this.x + this.y * 1000;

    if (this.mode === 'chute') {
      this.vy = Math.min(this.vy + GRAVITE * dt, CHUTE_MAX);
      this.accY += this.vy * dt;
      while (this.accY >= 1) {
        this.accY -= 1;
        if (this.porte(this.x, this.y) || !this.libre(this.x, this.y + 1)) {
          this.mode = 'sol';
          this.vy = 0;
          this.accY = 0;
          break;
        }
        this.y += 1;
      }
      if (this.porte(this.x, this.y)) { this.mode = 'sol'; this.vy = 0; this.accY = 0; }
    } else if (this.mode === 'grimpe') {
      if (this.dansGris) {
        this.mode = 'chute';
        this.vy = 0;
        this.accY = 0;
      } else if (this.marche) {
        this.accY += GRIMPE * dt;
        while (this.accY >= 1 && this.mode === 'grimpe') {
          this.accY -= 1;
          if (!this.grimperUnPixel()) break;
        }
      }
    } else {
      if (this.marche) {
        this.accX += VITESSE * (this.dansGris ? GLISSE : 1) * dt;
        while (this.accX >= 1 && this.mode === 'sol') {
          this.accX -= 1;
          if (!this.avancerUnPixel()) break;
        }
      }
      if (this.mode === 'sol') {
        this.souleverSiBesoin();
        if (!this.porte(this.x, this.y)) { this.mode = 'chute'; this.vy = 0; this.accY = 0; }
      }
    }

    // Victoire : la moitié du corps passée dans l'embrasure, au-dessus de l'appui.
    const f = this.world.fenetre;
    if (this.x + PW / 2 >= f.x - 1 && this.y >= f.y - 2 && this.y + PH <= f.y + f.h) {
      this.gagne = true;
      return;
    }

    const etat = this.eclaire();
    this.dansGris = etat === 'gris';
    // Endormie (niveaux de réflexion) : elle ne craint rien tant qu'on ne l'a pas réveillée.
    if (this.protege) return;
    if (etat === 'lumiere') {
      this.vivant = false;
      return;
    }
    if (this.dansGris) {
      this.marche = true;
      const immobile = this.x + this.y * 1000 === avant;
      this.bloqueGris = immobile ? this.bloqueGris + dt : 0;
      if (this.bloqueGris > 0.5) this.vivant = false;
    } else {
      this.bloqueGris = 0;
    }
  }

  frame() {
    if (this.mode === 'grimpe') return (this.pas >> 2) % 2 ? 'grimpe2' : 'grimpe1';
    if (!this.marche && this.mode === 'sol') return 'repos';
    return (this.pas >> 2) % 2 ? 'marche2' : 'marche1';
  }
}
