// Ombre : boucle de jeu, entrées (tap sur la créature, glisser les objets),
// fondus entre les essais et entre les niveaux.

import { LEVELS, FIN } from './levels.js';
import { World, W, H, LUMIERE, MUR_D, SOL } from './world.js';
import { Player, PW, PH, SPRITES } from './player.js';
import {
  dessinerDecor, dessinerCaisse, dessinerEtagere, dessinerDrap, dessinerCorde, dessinerLampe, remplirCalque, dessinerPoignees, dessinerJoueur,
} from './art.js';

const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const scene = document.getElementById('scene');
const phraseEl = document.getElementById('phrase');
const btnRejouer = document.getElementById('rejouer');

canvas.width = W;
canvas.height = H;
ctx.imageSmoothingEnabled = false;

const calque = document.createElement('canvas');
calque.width = W;
calque.height = H;
const calqueCtx = calque.getContext('2d');
const calqueImg = calqueCtx.createImageData(W, H);

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- État ------------------------------------------------------------------

const params = new URLSearchParams(location.search);
const borne = (n) => Math.max(0, Math.min(LEVELS.length - 1, n));
let niveau = 0;
if (params.has('n')) niveau = borne((parseInt(params.get('n'), 10) || 1) - 1);
else {
  try { niveau = borne(parseInt(localStorage.getItem('ombre.niveau'), 10) || 0); } catch { /* rien */ }
}

let world;
let joueur;
let decor;
let phase;        // 'entree' | 'jeu' | 'dissolution' | 'sortie' | 'fin'
let tPhase = 0;
let voile = 1;    // fondu au noir (1 = noir)
let essais = 0;
let particules = [];
let fumerolles = [];
let drag = null;  // { o, dx, dy }
let survol = null;
let temps = 0;
let dejaVuPhrase = -1;
let calqueVersion = -1;
let dejaTouche = false; // la créature a-t-elle déjà été mise en marche ?
let calqueMonde = null;

const poussiere = Array.from({ length: 46 }, (_, i) => ({
  x: Math.random() * W,
  y: 16 + Math.random() * (SOL - 20),
  v: 1 + Math.random() * 2.5,
  p: Math.random() * 6.28,
  a: 0.25 + Math.random() * 0.45,
  k: i,
}));

function chargerNiveau(n, garderPhrase = false) {
  const level = LEVELS[n];
  world = new World(level);
  joueur = new Player(world, level.joueur);
  joueur.marche = false; // il attend que le rideau se lève
  decor = dessinerDecor(world.fenetre);
  world.joueurRect = joueur.rect;
  world.calculerLumiere();
  particules = [];
  fumerolles = [];
  drag = null;
  phase = 'entree';
  tPhase = 0;
  if (!garderPhrase || dejaVuPhrase !== n) montrerPhrase(level.phrase);
  dejaTouche = false;
  dejaVuPhrase = n;
}

let phraseTimer = 0;
function montrerPhrase(texte, rester = false) {
  phraseEl.textContent = texte;
  phraseEl.classList.remove('visible', 'discrete');
  void phraseEl.offsetWidth;
  phraseEl.classList.add('visible');
  clearTimeout(phraseTimer);
  if (!rester) phraseTimer = setTimeout(() => phraseEl.classList.add('discrete'), 5200);
}

// --- Boucle ----------------------------------------------------------------

const DT = 1 / 60;
let acc = 0;
let dernier = performance.now();

function boucle(now) {
  const ecoule = Math.min(0.1, (now - dernier) / 1000);
  dernier = now;
  acc += ecoule;
  while (acc >= DT) {
    step(DT);
    acc -= DT;
  }
  render();
  requestAnimationFrame(boucle);
}

function step(dt) {
  temps += dt;
  tPhase += dt;
  if (world.dirty) world.calculerLumiere();

  if (phase === 'entree' || phase === 'jeu') world.tomber(dt, drag?.o);

  switch (phase) {
    case 'entree':
      voile = Math.max(0, voile - dt / 0.35);
      if (voile === 0 && tPhase > (essais === 0 ? 1.4 : 0.5)) {
        phase = 'jeu';
        tPhase = 0;
        joueur.marche = !world.level.attend;
      }
      // Il peut déjà mourir si on bouge un objet trop tôt.
      verifierLumiereAuRepos();
      break;
    case 'jeu':
      if (joueur.marche) dejaTouche = true;
      if (world.avancerCoucher(dt)) {
        // Le soleil est couché : sans lumière, plus d'ombre où exister.
        joueur.vivant = false;
        dissoudre();
        break;
      }
      joueur.update(dt);
      world.joueurRect = joueur.rect;
      if (!joueur.vivant) dissoudre();
      else if (joueur.gagne) {
        phase = 'sortie';
        tPhase = 0;
        drag = null;
      }
      break;
    case 'dissolution':
      if (tPhase > 0.75) voile = Math.min(1, voile + dt / 0.3);
      if (voile >= 1) {
        essais++;
        chargerNiveau(niveau, true);
      }
      break;
    case 'sortie':
      // Il se glisse dehors, puis le grenier s'efface.
      if (tPhase < 1.2 && joueur.x < W - PW) joueur.x += dt * 14;
      if (tPhase > 1.4) voile = Math.min(1, voile + dt / 0.6);
      if (voile >= 1) {
        if (niveau + 1 < LEVELS.length) {
          niveau++;
          essais = 0;
          try { localStorage.setItem('ombre.niveau', String(niveau)); } catch { /* rien */ }
          chargerNiveau(niveau);
        } else {
          phase = 'fin';
          tPhase = 0;
          montrerPhrase(FIN, true);
          btnRejouer.classList.add('appel');
        }
      }
      break;
    case 'fin':
      break;
  }

  // particules de dissolution
  for (const p of particules) {
    p.vx += (Math.random() - 0.5) * 6 * dt;
    p.vy -= 12 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.t += dt;
  }
  particules = particules.filter((p) => p.t < p.vie);

  // fumerolles d'ombre derrière la créature
  if (phase === 'jeu' && !reduit && Math.random() < dt * 3) {
    fumerolles.push({ x: joueur.x + Math.random() * 2, y: joueur.y + 2 + Math.random() * 5, t: 0 });
  }
  for (const f of fumerolles) { f.t += dt; f.y -= dt * 3; f.x -= dt * 2; }
  fumerolles = fumerolles.filter((f) => f.t < 0.9 && world.lumiere(Math.floor(f.x), Math.floor(f.y)) !== LUMIERE);

  for (const m of poussiere) {
    m.y -= m.v * dt * 0.6;
    m.x += Math.sin(temps * 0.4 + m.p) * dt * 2;
    if (m.y < 14) { m.y = SOL - 2; m.x = Math.random() * W; }
  }
}

// Pendant l'entrée, la créature attend : si la lumière l'atteint, elle se dissout aussi.
function verifierLumiereAuRepos() {
  if (joueur.eclaire() === 'lumiere') {
    joueur.vivant = false;
    dissoudre();
  }
}

function dissoudre() {
  phase = 'dissolution';
  tPhase = 0;
  drag = null;
  const pixels = SPRITES[joueur.frame()];
  for (const [i, j] of pixels) {
    particules.push({
      x: joueur.x + i,
      y: joueur.y + j,
      vx: (Math.random() - 0.3) * 10,
      vy: -4 - Math.random() * 10,
      t: 0,
      vie: 0.5 + Math.random() * 0.6,
    });
  }
}

// --- Rendu -----------------------------------------------------------------

function render() {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(decor, 0, 0);

  if (world.level.corde) dessinerCorde(ctx, world.level.corde);
  for (const o of world.objets) {
    if (o.type === 'etagere') dessinerEtagere(ctx, o);
    else if (o.type === 'drap') dessinerDrap(ctx, o, temps, survol === o || drag?.o === o);
    else dessinerCaisse(ctx, o, survol === o || drag?.o === o);
  }

  if (calqueVersion !== world.version || calqueMonde !== world) {
    remplirCalque(calqueImg, world);
    calqueCtx.putImageData(calqueImg, 0, 0);
    calqueVersion = world.version;
    calqueMonde = world;
  }
  ctx.drawImage(calque, 0, 0);

  // poussière, visible seulement dans la lumière
  if (!reduit) {
    for (const m of poussiere) {
      const x = Math.floor(m.x);
      const y = Math.floor(m.y);
      if (world.lumiere(x, y) === LUMIERE && x < MUR_D) {
        ctx.fillStyle = `rgba(255,222,170,${m.a * (0.6 + 0.4 * Math.sin(temps * 2 + m.p))})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  if (!world.eteinte) dessinerLampe(ctx, world.lampe, temps);
  if (world.crepuscule > 0) {
    const f = world.fenetre;
    ctx.fillStyle = `rgba(52,14,40,${world.crepuscule * 0.62})`;
    ctx.fillRect(f.x, f.y, f.w, f.h);
  }

  if (phase === 'jeu' || phase === 'entree') {
    for (const o of world.mobiles()) dessinerPoignees(ctx, o, temps, drag?.o === o);
  }

  for (const f of fumerolles) {
    ctx.fillStyle = `rgba(6,3,8,${0.5 * (1 - f.t / 0.9)})`;
    ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 1, 1);
  }

  // Elle attend qu'on la touche : un halo discret le suggère au bout d'un moment.
  if (phase === 'jeu' && world.level.attend && !dejaTouche && tPhase > 2.5 && joueur.vivant) {
    const k = (temps * 0.8) % 1;
    ctx.strokeStyle = `rgba(255,232,200,${0.5 * (1 - k)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(joueur.x + PW / 2, joueur.y + PH / 2, 6 + k * 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (joueur.vivant) {
    let alpha = 1;
    if (phase === 'sortie') alpha = Math.max(0, 1 - tPhase / 1.1);
    if (alpha > 0) dessinerJoueur(ctx, SPRITES[joueur.frame()], joueur.x, joueur.y, alpha);
  }

  for (const p of particules) {
    const k = p.t / p.vie;
    const c = Math.round(20 + k * 120);
    ctx.fillStyle = `rgba(${c},${Math.round(c * 0.8)},${Math.round(c * 0.7)},${1 - k})`;
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
  }

  if (phase === 'sortie') {
    ctx.fillStyle = `rgba(255,200,140,${0.25 * Math.sin(Math.min(1, tPhase / 1.4) * Math.PI)})`;
    ctx.fillRect(world.fenetre.x, world.fenetre.y, world.fenetre.w, world.fenetre.h);
  }

  if (world.eteinte) {
    ctx.fillStyle = 'rgba(12,6,14,0.78)';
    ctx.fillRect(0, 0, W, H);
  }

  if (voile > 0) {
    ctx.fillStyle = `rgba(10,6,8,${voile})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// --- Entrées ---------------------------------------------------------------

function versScene(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
}

function objetSous(p, marge) {
  let meilleur = null;
  let best = Infinity;
  for (const o of world.mobiles()) {
    const dx = Math.max(o.x - p.x, 0, p.x - (o.x + o.w));
    const dy = Math.max(o.y - p.y, 0, p.y - (o.y + o.h));
    const d = Math.hypot(dx, dy);
    if (d <= marge && d < best) { best = d; meilleur = o; }
  }
  return meilleur ? { o: meilleur, d: best } : null;
}

function distJoueur(p) {
  const cx = joueur.x + PW / 2;
  const cy = joueur.y + PH / 2;
  return Math.hypot(p.x - cx, p.y - cy);
}

let appui = null; // { id, x, y, cible: 'joueur' | 'objet', bouge }

canvas.addEventListener('pointerdown', (e) => {
  if (appui || (phase !== 'jeu' && phase !== 'entree')) return;
  const p = versScene(e);
  const tactile = e.pointerType !== 'mouse';
  const obj = objetSous(p, tactile ? 7 : 2);
  const dj = distJoueur(p);
  const prendJoueur = joueur.vivant && dj <= (tactile ? 13 : 9) && !(obj && obj.d === 0 && dj > 6);
  canvas.setPointerCapture(e.pointerId);
  if (prendJoueur) {
    appui = { id: e.pointerId, x: p.x, y: p.y, cible: 'joueur', bouge: false };
  } else if (obj) {
    appui = { id: e.pointerId, x: p.x, y: p.y, cible: 'objet' };
    drag = { o: obj.o, dx: p.x - obj.o.x, dy: p.y - obj.o.y };
  }
  e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
  const p = versScene(e);
  if (appui && e.pointerId === appui.id) {
    if (appui.cible === 'objet' && drag) {
      world.joueurRect = joueur.rect;
      world.deplacer(drag.o, p.x - drag.dx, p.y - drag.dy);
    } else if (Math.hypot(p.x - appui.x, p.y - appui.y) > 6) {
      appui.bouge = true;
    }
    return;
  }
  if (e.pointerType === 'mouse') {
    const obj = objetSous(p, 2);
    survol = obj ? obj.o : null;
    const surJoueur = distJoueur(p) <= 9;
    canvas.style.cursor = surJoueur ? 'pointer' : obj ? 'grab' : 'default';
  }
});

function finAppui(e) {
  if (!appui || e.pointerId !== appui.id) return;
  if (appui.cible === 'joueur' && !appui.bouge && (phase === 'jeu' || phase === 'entree')) {
    if (phase === 'entree') {
      // Toucher avant le départ : il ne part pas (ou, s'il attendait, il part).
      phase = 'jeu';
      tPhase = 0;
      joueur.marche = !!world.level.attend;
    } else {
      joueur.basculer();
    }
  }
  appui = null;
  drag = null;
}
canvas.addEventListener('pointerup', finAppui);
canvas.addEventListener('pointercancel', finAppui);

function recommencer() {
  btnRejouer.classList.remove('appel');
  if (phase === 'fin') {
    niveau = 0;
    essais = 0;
    voile = 1;
    chargerNiveau(niveau);
    return;
  }
  if (phase === 'jeu' || phase === 'entree') {
    joueur.vivant = false;
    dissoudre();
  }
}

btnRejouer.addEventListener('click', recommencer);

addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') recommencer();
  if (e.key === ' ' && phase === 'jeu') { joueur.basculer(); e.preventDefault(); }
});

// --- Mise à l'échelle ------------------------------------------------------

function ajuster() {
  const vw = innerWidth;
  const vh = innerHeight;
  let s = Math.min(vw / W, vh / H);
  if (s >= 2 && Math.floor(s) / s > 0.86) s = Math.floor(s);
  const w = Math.floor(W * s);
  const h = Math.floor(H * s);
  scene.style.width = `${w}px`;
  scene.style.height = `${h}px`;
  scene.style.setProperty('--px', `${w / W}px`);
}
addEventListener('resize', ajuster);
ajuster();

// --- Départ ----------------------------------------------------------------

chargerNiveau(niveau);
requestAnimationFrame(boucle);

// Accès pour les tests automatiques.
window.ombre = {
  get phase() { return phase; },
  get joueur() { return joueur; },
  get world() { return world; },
  get niveau() { return niveau; },
  get essais() { return essais; },
};
