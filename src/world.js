// Le monde d'un niveau : murs, objets, lampe, et carte de lumière au pixel près.
// La même carte sert au rendu et aux collisions : ce que l'on voit éclairé tue.

export const W = 240;
export const H = 180;
export const SOL = 164;        // premier pixel du plancher
export const MUR_G = 8;        // premier pixel libre à gauche
export const MUR_D = 224;      // premier pixel du mur droit
export const PLAFOND = 6;

export const OMBRE = 0;
export const GRIS = 1;
export const LUMIERE = 2;

export const LAMPE_W = 9;
export const LAMPE_H = 18;

export class World {
  constructor(level) {
    this.level = level;
    this.lampe = { ...level.lampe, w: LAMPE_W, h: LAMPE_H };
    this.objets = level.objets.map((o) => ({ ...o, min: { ...o.min }, max: { ...o.max } }));
    this.fenetre = { x: MUR_D, y: level.fenetre.y, w: W - MUR_D, h: level.fenetre.h };
    this.mask = new Uint8Array(W * H);
    this.dirty = true;
    this.joueurRect = null; // fourni par le jeu, pour bloquer les objets
  }

  get lx() { return this.lampe.x + 4.5; }
  get ly() { return this.lampe.y + 4.5; }

  // --- Matière -------------------------------------------------------------

  dansFenetre(x, y) {
    const f = this.fenetre;
    return x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h;
  }

  // Pixel solide pour le joueur : murs, plancher, plafond, caisses.
  solide(x, y) {
    if (y >= SOL || y < PLAFOND || x < MUR_G) return true;
    if (x >= MUR_D) return !this.dansFenetre(x, y) || x >= W;
    for (const o of this.objets) {
      if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) return true;
    }
    return false;
  }

  lumiere(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return OMBRE;
    return this.mask[y * W + x];
  }

  // --- Lumière -------------------------------------------------------------

  // Le segment lampe → (px, py) traverse-t-il le rectangle r ? (Liang–Barsky)
  static coupe(lx, ly, px, py, r) {
    const dx = px - lx;
    const dy = py - ly;
    let t0 = 0;
    let t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [lx - r.x, r.x + r.w - lx, ly - r.y, r.y + r.h - ly];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return false;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) { if (t > t0) t0 = t; } else if (t < t1) t1 = t;
        if (t0 >= t1) return false;
      }
    }
    return t1 - t0 > 1e-9;
  }

  calculerLumiere() {
    const { mask, objets } = this;
    const lx = this.lx;
    const ly = this.ly;
    const n = objets.length;
    for (let y = 0; y < H; y++) {
      const py = y + 0.5;
      for (let x = 0; x < W; x++) {
        const px = x + 0.5;
        let v = LUMIERE;
        for (let i = 0; i < n; i++) {
          const o = objets[i];
          // La face visible d'un objet n'est pas dans sa propre ombre.
          if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) continue;
          if (World.coupe(lx, ly, px, py, o)) {
            if (o.verre) v = GRIS;
            else { v = OMBRE; break; }
          }
        }
        mask[y * W + x] = v;
      }
    }
    this.dirty = false;
    this.version = (this.version || 0) + 1;
  }

  // --- Déplacement des objets ----------------------------------------------

  static chevauche(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Une position est-elle permise pour l'objet o (caisse ou lampe) ?
  placeLibre(o, x, y) {
    const r = { x, y, w: o.w, h: o.h };
    if (x < MUR_G || x + o.w > MUR_D || y < PLAFOND || y + o.h > SOL) return false;
    if (o.min) {
      if (o.min.x != null && x < o.min.x) return false;
      if (o.min.y != null && y < o.min.y) return false;
    }
    if (o.max) {
      if (o.max.x != null && x > o.max.x) return false;
      if (o.max.y != null && y > o.max.y) return false;
    }
    for (const autre of this.objets) {
      if (autre !== o && World.chevauche(r, autre)) return false;
    }
    if (o !== this.lampe && World.chevauche(r, this.lampe)) return false;
    if (this.joueurRect && World.chevauche(r, this.joueurRect)) return false;
    return true;
  }

  // Avance l'objet pixel par pixel vers la cible, en s'arrêtant au premier obstacle.
  deplacer(o, tx, ty) {
    tx = Math.round(tx);
    ty = Math.round(ty);
    if (o.drag === 'x') ty = o.y;
    if (o.drag === 'y') tx = o.x;
    let bouge = false;
    // Un axe puis l'autre, pour glisser le long des obstacles.
    for (const axe of ['x', 'y']) {
      const cible = axe === 'x' ? tx : ty;
      while (o[axe] !== cible) {
        const pas = Math.sign(cible - o[axe]);
        const nx = axe === 'x' ? o.x + pas : o.x;
        const ny = axe === 'y' ? o.y + pas : o.y;
        if (!this.placeLibre(o, nx, ny)) break;
        o.x = nx;
        o.y = ny;
        bouge = true;
      }
    }
    if (bouge) this.dirty = true;
    return bouge;
  }

  mobiles() {
    const liste = this.objets.filter((o) => o.drag);
    if (this.lampe.drag) liste.push(this.lampe);
    return liste;
  }
}
