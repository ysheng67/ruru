import { ctx, FY, clamp } from './config.js';

// ─── Particles ────────────────────────────────────────────────────────
const WOOD_COLOURS = ['#9a5424', '#7a3e14', '#5c2e08', '#c8a060', '#e0c080'];
const SPARK_COLOURS = ['#fff8c0', '#ffe070', '#ff8820'];

/** @type {Particle[]} */
export let particles = [];

class Particle {
  constructor(x, y, vx, vy, col, sz, isSquare) {
    this.x = x;  this.y = y;
    this.vx = vx; this.vy = vy;
    this.col      = col;
    this.sz       = sz;
    this.isSquare = isSquare;
    this.life     = 1;
    this.decay    = 0.011 + Math.random() * 0.018;
    this.angle    = Math.random() * Math.PI * 2;
    this.spin     = (Math.random() - 0.5) * 0.25;
    this.grav     = 0.25 + Math.random() * 0.2;
  }

  update() {
    this.vy    += this.grav;
    this.vx    *= 0.975;
    this.x     += this.vx;
    this.y     += this.vy;
    this.angle += this.spin;
    this.life  -= this.decay;
    if (this.life < 0) this.life = 0;
    const fy = FY();
    if (this.y > fy) { this.y = fy; this.vy *= -0.3; this.vx *= 0.7; }
  }

  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life * this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.col;
    if (this.isSquare) {
      const s = Math.max(0.01, this.sz * this.life);
      ctx.fillRect(-s / 2, -s / 2, s, s);
    } else {
      const r = Math.max(0.01, this.sz * this.life * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  get dead() { return this.life <= 0; }
}

/**
 * Eject debris and spark particles from an impact point.
 * @param {number} x  Impact X
 * @param {number} y  Impact Y
 * @param {number} vx Hammer velocity X (used to bias direction)
 * @param {number} vy Hammer velocity Y
 * @param {number} speed  Hammer speed magnitude
 */
export function spawnParticles(x, y, vx, vy, speed) {
  const n = Math.min(5 + (speed | 0), 30);

  for (let i = 0; i < n; i++) {
    const ang     = Math.random() * Math.PI * 2;
    const spd     = speed * 0.15 + Math.random() * speed * 0.35;
    const isWood  = Math.random() < 0.6;
    const isSpark = !isWood && speed > 10;
    const col = isWood
      ? WOOD_COLOURS [Math.floor(Math.random() * WOOD_COLOURS.length)]
      : isSpark
        ? SPARK_COLOURS[Math.floor(Math.random() * SPARK_COLOURS.length)]
        : '#ccc';

    particles.push(new Particle(
      x + (Math.random() - 0.5) * 12,
      y + (Math.random() - 0.5) * 12,
      Math.cos(ang) * spd + vx * 0.15,
      Math.sin(ang) * spd + vy * 0.1 - 2,
      col,
      2 + Math.random() * (speed > 14 ? 7 : 4),
      isWood,
    ));
  }
}

/** Advance and render all live particles; prune dead ones. */
export function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].dead) particles.splice(i, 1);
  }
}

/** Clear all particles (called on world reset). */
export function clearParticles() { particles = []; }

// ─── Impact Flashes ───────────────────────────────────────────────────
/** @type {Array<{x:number, y:number, r:number, life:number}>} */
export let flashes = [];

export function addFlash(x, y, r) {
  flashes.push({ x, y, r, life: 1 });
}

export function updateFlashes() {
  flashes = flashes.filter(f => f.life > 0.01);
  flashes.forEach(f => {
    const rr = Math.max(0.01, f.r * (1 - (1 - f.life) * 0.4));
    const g  = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rr);
    g.addColorStop(0,   `rgba(255,240,180,${f.life * 0.55})`);
    g.addColorStop(0.4, `rgba(255,160,40,${f.life  * 0.30})`);
    g.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, rr, 0, Math.PI * 2);
    ctx.fill();
    f.life -= 0.14;
  });
}

export function clearFlashes() { flashes = []; }
