// Le grenier, en pixel art dessiné à la main (au code) : planches, chevrons,
// plancher, lucarne au soleil couchant, caisses, lampe à pétrole.

import { W, H, SOL, MUR_G, MUR_D, OMBRE, GRIS, LUMIERE } from './world.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Petit générateur pseudo-aléatoire reproductible, pour que le décor ne change pas.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function px(ctx, x, y, c, w = 1, h = 1) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

export function dessinerDecor(fenetre, trous = []) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const r = rng(7);

  // Mur du fond : planches verticales.
  const planches = ['#7b4a2b', '#71432a', '#7f4f2e', '#6c4027'];
  for (let x = 0, k = 0; x < W; x += 12, k++) {
    px(ctx, x, 0, planches[k % planches.length], 12, SOL);
    px(ctx, x, 0, '#4b2a19', 1, SOL);           // joint
    px(ctx, x + 1, 0, '#87573a', 1, SOL);       // arête claire
    // veines du bois
    for (let v = 0; v < 5; v++) {
      const vx = x + 3 + Math.floor(r() * 7);
      const vy = Math.floor(r() * SOL);
      px(ctx, vx, vy, 'rgba(60,32,18,0.35)', 1, 6 + Math.floor(r() * 14));
    }
    // nœud
    if (r() < 0.6) {
      const nx = x + 4 + Math.floor(r() * 4);
      const ny = 30 + Math.floor(r() * 110);
      px(ctx, nx, ny, '#55301c', 3, 2);
      px(ctx, nx + 1, ny - 1, '#55301c', 1, 1);
      px(ctx, nx + 1, ny + 2, '#5f3820', 1, 1);
    }
    // clous
    px(ctx, x + 6, 26, '#3a2316');
    px(ctx, x + 6, 118, '#3a2316');
  }

  // Lisse horizontale (traverse) à mi-hauteur.
  px(ctx, 0, 112, '#5a341f', W, 4);
  px(ctx, 0, 112, '#8a5a3a', W, 1);
  px(ctx, 0, 116, '#3d2215', W, 1);

  // Chevrons du toit : deux grandes pentes et un entrait.
  ctx.fillStyle = '#3b2216';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(70, 0); ctx.lineTo(0, 46); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0); ctx.lineTo(W - 90, 0); ctx.lineTo(W, 40); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 70; i++) px(ctx, 70 - i, Math.round(i * 46 / 70), '#5c3722', 1, 2);
  for (let i = 0; i < 90; i++) px(ctx, W - 90 + i, Math.round(i * 40 / 90), '#5c3722', 1, 2);
  px(ctx, 0, 8, '#4a2b1a', W, 6);
  px(ctx, 0, 8, '#6d4429', W, 1);
  px(ctx, 0, 14, '#2c180f', W, 1);
  for (let x = 10; x < W; x += 40) px(ctx, x, 10, '#2c180f', 2, 2);

  // Toiles d'araignée dans les coins.
  ctx.strokeStyle = 'rgba(230,210,190,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(MUR_G, 15 + i * 5);
    ctx.quadraticCurveTo(MUR_G + 4 + i * 3, 17 + i * 3, MUR_G + 6 + i * 5, 15);
    ctx.stroke();
  }

  // Mur gauche (épaisseur).
  px(ctx, 0, 0, '#3e2416', MUR_G, SOL);
  px(ctx, MUR_G - 1, 0, '#5d3822', 1, SOL);

  // Plancher.
  px(ctx, 0, SOL, '#5e3820', W, H - SOL);
  px(ctx, 0, SOL, '#9a6740', W, 1);
  px(ctx, 0, SOL + 1, '#7d4f31', W, 1);
  for (let y = SOL + 5; y < H; y += 5) px(ctx, 0, y, '#4a2b18', W, 1);
  for (let y = SOL + 1, k = 0; y < H; y += 5, k++) {
    for (let x = (k * 17) % 34; x < W; x += 34) px(ctx, x, y, '#3e2414', 1, 4);
  }

  // Trappes ouvertes : un escalier qui descend dans le noir.
  for (const t of trous) {
    px(ctx, t.x, SOL, '#0c0606', t.w, H - SOL);
    for (let k = 0; k < 4; k++) {
      px(ctx, t.x + 2 + k * 5, SOL + 3 + k * 4, '#3b2314', t.w - 4 - k * 5, 1);
      px(ctx, t.x + 2 + k * 5, SOL + 4 + k * 4, '#1f120b', t.w - 4 - k * 5, 2);
    }
    px(ctx, t.x - 1, SOL, '#2a170d', 1, H - SOL);
    px(ctx, t.x + t.w, SOL, '#2a170d', 1, H - SOL);
    px(ctx, t.x - 1, SOL, '#b07a4c', t.w + 2, 1);
  }

  // Mur droit, épais, avec la lucarne.
  px(ctx, MUR_D, 0, '#4a2a19', W - MUR_D, SOL);
  px(ctx, MUR_D, 0, '#6a4128', 1, SOL);
  for (let y = 4; y < SOL; y += 9) px(ctx, MUR_D + 1, y, '#3d2215', W - MUR_D - 1, 1);

  // Ciel de fin d'après-midi dans l'embrasure.
  const f = fenetre;
  const ciel = ['#f5b16a', '#f6a466', '#f59762', '#f2895e', '#ee7b5c', '#e86f5c'];
  for (let y = 0; y < f.h; y++) {
    const t = y / f.h;
    const k = Math.min(ciel.length - 1, Math.floor(t * ciel.length + BAYER[(y & 3) * 4] / 16 - 0.5));
    px(ctx, f.x, f.y + y, ciel[Math.max(0, k)], f.w, 1);
  }
  // soleil bas
  const sx = f.x + 9;
  const sy = f.y + f.h - 9;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    if (dx * dx + dy * dy <= 16) px(ctx, sx + dx, sy + dy, dx * dx + dy * dy <= 6 ? '#fff1c4' : '#ffd99a');
  }
  // toits lointains
  const toits = [3, 3, 4, 5, 5, 4, 2, 2, 3, 6, 6, 6, 4, 3, 3, 2];
  toits.forEach((h, i) => px(ctx, f.x + i, f.y + f.h - h, '#6b3a4f', 1, h));
  px(ctx, f.x + 10, f.y + f.h - 9, '#6b3a4f', 1, 3);
  // cadre
  px(ctx, f.x, f.y - 2, '#2e1a10', f.w, 2);
  px(ctx, f.x, f.y + f.h, '#a0704a', f.w, 1);   // appui éclairé
  px(ctx, f.x, f.y + f.h + 1, '#2e1a10', f.w, 2);
  px(ctx, f.x, f.y, '#3a2216', 1, f.h);

  return c;
}

// Caisse de bois, dessinée à toutes les tailles.
export function dessinerCaisse(ctx, o, survol) {
  const { x, y, w, h } = o;
  px(ctx, x, y, '#2f1b10', w, h);
  for (let j = 2; j < h - 2; j++) {
    const k = Math.floor((j - 2) / 5);
    px(ctx, x + 2, y + j, k % 2 ? '#9a6136' : '#a86d3f', w - 4, 1);
  }
  for (let j = 7; j < h - 2; j += 5) px(ctx, x + 2, y + j, '#6e4224', w - 4, 1);
  // cadre
  px(ctx, x + 1, y + 1, '#c08550', w - 2, 1);
  px(ctx, x + 1, y + 1, '#b47a47', 1, h - 2);
  px(ctx, x + 1, y + h - 2, '#5b361d', w - 2, 1);
  px(ctx, x + w - 2, y + 1, '#5b361d', 1, h - 2);
  // écharpe en diagonale
  const n = Math.min(w, h) - 4;
  for (let i = 0; i < n; i++) {
    const xx = x + 2 + Math.round((i * (w - 5)) / n);
    const yy = y + h - 3 - i * ((h - 5) / n);
    px(ctx, xx, Math.round(yy), '#7b4a28', 2, 1);
    px(ctx, xx, Math.round(yy) - 1, '#c48c58', 2, 1);
  }
  // clous
  for (const [cx, cy] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]]) px(ctx, x + cx, y + cy, '#2a1a12');
  if (survol) {
    ctx.fillStyle = 'rgba(255,230,190,0.08)';
    ctx.fillRect(x, y, w, h);
  }
}

// Un drap qui sèche sur une corde : il laisse passer une lumière adoucie.
export function dessinerDrap(ctx, o, t, survol) {
  const { x, y, w, h } = o;
  for (let i = 0; i < w; i++) {
    const pli = (i % 6 === 2) ? 0.9 : (i % 6 === 3 ? 0.78 : 0.84);
    const bas = h - (Math.round(1.2 + Math.sin(i * 0.7 + t * 1.3) * 1.2));
    ctx.fillStyle = `rgba(${Math.round(240 * pli)},${Math.round(226 * pli)},${Math.round(200 * pli)},0.86)`;
    ctx.fillRect(x + i, y, 1, bas);
  }
  px(ctx, x, y, 'rgba(255,245,225,0.6)', w, 1);
  for (const ex of [x + 3, x + w - 5]) {
    px(ctx, ex, y - 2, '#7a5634', 2, 4);
    px(ctx, ex, y - 2, '#a07448', 1, 4);
  }
  if (survol) {
    ctx.fillStyle = 'rgba(255,240,210,0.12)';
    ctx.fillRect(x, y, w, h);
  }
}

export function dessinerCorde(ctx, y) {
  px(ctx, MUR_G, y - 1, '#2f2015', MUR_D - MUR_G, 1);
  px(ctx, MUR_G, y - 1, '#4a3220', 2, 2);
  px(ctx, MUR_D - 2, y - 1, '#4a3220', 2, 2);
}

// Une vieille armoire : deux portes, une corniche, de petits pieds.
export function dessinerArmoire(ctx, o) {
  const { x, y, w, h } = o;
  px(ctx, x, y, '#2c190f', w, h);
  px(ctx, x - 1, y, '#6a4128', w + 2, 3);
  px(ctx, x - 1, y, '#8e5d38', w + 2, 1);
  const pw = Math.floor((w - 6) / 2);
  for (const dx of [2, 4 + pw]) {
    px(ctx, x + dx, y + 5, '#5a351f', pw, h - 12);
    px(ctx, x + dx + 2, y + 8, '#4a2b18', pw - 4, Math.floor((h - 20) / 2));
    px(ctx, x + dx + 2, y + 10 + Math.floor((h - 20) / 2), '#4a2b18', pw - 4, Math.floor((h - 20) / 2) - 2);
    px(ctx, x + dx, y + 5, '#7a4b2c', 1, h - 12);
  }
  px(ctx, x + 2 + pw - 1, y + Math.floor(h / 2), '#c79a55', 1, 2);
  px(ctx, x + 4 + pw, y + Math.floor(h / 2), '#c79a55', 1, 2);
  px(ctx, x, y + h - 6, '#3d2315', w, 2);
  px(ctx, x + 1, y + h - 3, '#2a170d', 3, 3);
  px(ctx, x + w - 4, y + h - 3, '#2a170d', 3, 3);
}

// Étagère fixée au mur du fond : une planche et deux équerres.
export function dessinerEtagere(ctx, o) {
  const { x, y, w, h } = o;
  for (const ex of [x + 8, x + w - 11]) {
    for (let k = 0; k < 7; k++) px(ctx, ex, y + h + k, '#3a2316', Math.max(1, 6 - k), 1);
    px(ctx, ex, y + h, '#6b4a2a', 1, 7);
  }
  px(ctx, x, y, '#b07444', w, 1);
  px(ctx, x, y + 1, '#94603a', w, h - 2);
  px(ctx, x, y + h - 1, '#4e2e1a', w, 1);
  px(ctx, x, y, '#5b3820', 1, h);
  px(ctx, x + w - 1, y, '#5b3820', 1, h);
  for (let k = 12; k < w - 4; k += 23) px(ctx, x + k, y + 2, '#6e4426', 3, 1);
}

// Lampe à pétrole, posée au sol ou suspendue à une corde ; la flamme est à (x + 4.5, y + 4.5).
export function dessinerLampe(ctx, l, t) {
  const { x, y } = l;
  if (l.suspendue) {
    px(ctx, x + 4, 14, '#2a1a10', 1, Math.max(0, y - 17));
    px(ctx, x + 3, y - 3, '#6e4c1a', 3, 1);
    px(ctx, x + 2, y - 2, '#6e4c1a', 1, 2);
    px(ctx, x + 6, y - 2, '#6e4c1a', 1, 2);
  }
  // halo
  const fl = Math.sin(t * 9) * 0.5 + Math.sin(t * 23) * 0.3;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let r = 14; r >= 4; r -= 3) {
    ctx.fillStyle = `rgba(255,170,80,${0.05 + (14 - r) * 0.006})`;
    ctx.beginPath();
    ctx.arc(x + 4.5, y + 4.5, r + fl, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // verre
  px(ctx, x + 2, y + 1, 'rgba(255,236,200,0.35)', 5, 8);
  px(ctx, x + 1, y + 3, 'rgba(255,236,200,0.25)', 7, 4);
  px(ctx, x + 2, y, '#5a3a22', 5, 1);
  // flamme
  const h = 3 + (fl > 0.2 ? 1 : 0);
  px(ctx, x + 4, y + 7 - h, '#fff4d0', 1, h);
  px(ctx, x + 3, y + 6, '#ffcc66', 3, 1);
  px(ctx, x + 4, y + 2 - (h - 3), '#ffb347', 1, 1);
  // corps en laiton
  px(ctx, x + 1, y + 9, '#b8862f', 7, 2);
  px(ctx, x + 1, y + 9, '#e2b45a', 7, 1);
  px(ctx, x, y + 11, '#8a6223', 9, 5);
  px(ctx, x + 1, y + 11, '#c9973c', 2, 4);
  px(ctx, x + 6, y + 12, '#6e4c1a', 2, 3);
  px(ctx, x - 1, y + 16, '#5c3f16', 11, 2);
  px(ctx, x, y + 16, '#9a7029', 9, 1);
  // molette
  px(ctx, x + 8, y + 10, '#6e4c1a', 2, 1);
}

// Calque d'ombre et de lumière, au pixel près, à partir de la carte du monde.
export function remplirCalque(img, world) {
  const d = img.data;
  const { mask } = world;
  const lx = world.lx;
  const ly = world.ly;
  const f = world.fenetre;
  const crep = world.crepuscule || 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const o = i * 4;
      if (x >= f.x && y >= f.y && y < f.y + f.h) { d[o + 3] = 0; continue; }
      // Le plancher vu de face prend la lumière de sa surface.
      const v = y >= SOL && !world.dansTrou(x) ? mask[(SOL - 1) * W + x] : mask[i];
      const b = BAYER[(x & 3) + (y & 3) * 4] / 16;
      if (v === OMBRE) {
        // Sur un objet, l'ombre reste lisible : on doit voir la caisse dedans.
        d[o] = 22; d[o + 1] = 10; d[o + 2] = 30; d[o + 3] = world.surObjet[i] ? 140 : 186;
      } else if (v === GRIS) {
        // ombre grise, un peu froide pour se distinguer de l'ombre pleine
        d[o] = 44; d[o + 1] = 40; d[o + 2] = 72; d[o + 3] = 128;
      } else {
        const dist = Math.hypot(x + 0.5 - lx, y + 0.5 - ly);
        const proche = Math.max(0, 1 - dist / 70);
        if (proche > 0) {
          // halo chaud près de la lampe ; au crépuscule, la pénombre le grignote
          const g = proche * proche * 0.32 * (1 - crep * 0.5);
          const k = crep * 0.32 * (1 - proche);
          if (k > g) {
            const a = Math.floor((k - g) * 10 + b) / 10;
            d[o] = 40; d[o + 1] = 18; d[o + 2] = 22; d[o + 3] = Math.round(a * 255);
          } else {
            const a = Math.floor((g - k) * 10 + b) / 10;
            d[o] = 255; d[o + 1] = 190; d[o + 2] = 110; d[o + 3] = Math.round(a * 255);
          }
        } else {
          // la lumière faiblit avec la distance, sans jamais ressembler à une ombre
          const a = Math.floor((Math.min(0.2, (dist - 70) / 600) + crep * 0.32) * 10 + b) / 10;
          d[o] = 40; d[o + 1] = 18; d[o + 2] = 22; d[o + 3] = Math.round(a * 255);
        }
      }
    }
  }
}

// Flèches discrètes sur les objets que l'on peut déplacer.
export function dessinerPoignees(ctx, o, t, actif) {
  const a = actif ? 0.9 : 0.45 + 0.25 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(255,236,205,${a})`;
  const cx = o.x + Math.floor(o.w / 2);
  const cy = o.y + Math.floor(o.h / 2);
  const dec = actif ? 0 : Math.round(Math.sin(t * 3));
  if (o.drag === 'x' || o.drag === 'xy') {
    const g = o.x - 3 - dec;
    const dr = o.x + o.w + 2 + dec;
    ctx.fillRect(g, cy - 1, 1, 3); ctx.fillRect(g - 1, cy, 1, 1);
    ctx.fillRect(dr, cy - 1, 1, 3); ctx.fillRect(dr + 1, cy, 1, 1);
  }
  if (o.drag === 'y') {
    // Sur le côté, pour ne pas se mêler à la corde d'une lampe suspendue.
    const ax = o.x + o.w + 3;
    const hh = cy - 4 - dec;
    const bb = cy + 4 + dec;
    ctx.fillRect(ax - 1, hh, 3, 1); ctx.fillRect(ax, hh - 1, 1, 1);
    ctx.fillRect(ax - 1, bb, 3, 1); ctx.fillRect(ax, bb + 1, 1, 1);
  } else if (o.drag === 'xy') {
    const hh = o.y - 3 - dec;
    const bb = o.y + o.h + 2 + dec;
    ctx.fillRect(cx - 1, hh, 3, 1); ctx.fillRect(cx, hh - 1, 1, 1);
    ctx.fillRect(cx - 1, bb, 3, 1); ctx.fillRect(cx, bb + 1, 1, 1);
  }
}

export function dessinerJoueur(ctx, pixels, x, y, alpha = 1) {
  ctx.fillStyle = `rgba(255,214,170,${0.16 * alpha})`;
  for (const [i, j] of pixels) {
    ctx.fillRect(x + i - 1, y + j, 1, 1);
    ctx.fillRect(x + i + 1, y + j, 1, 1);
    ctx.fillRect(x + i, y + j - 1, 1, 1);
  }
  ctx.fillStyle = `rgba(4,2,6,${alpha})`;
  for (const [i, j] of pixels) ctx.fillRect(x + i, y + j, 1, 1);
}
