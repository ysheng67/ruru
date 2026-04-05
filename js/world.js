import { C, FY, HIT_R, hypot, clamp } from './config.js';
import { state } from './state.js';
import { Chair }   from './chair.js';
import { Ragdoll } from './ragdoll.js';
import { spawnParticles, clearParticles, clearFlashes, addFlash } from './particles.js';
import { playThud, playCrack } from './audio.js';
import { addSplat, initSplat } from './splatter.js';

/** @type {Chair[]} */
export let chairs = [];

/** @type {Ragdoll[]} */
export let ragdolls = [];

// ─── World Setup ─────────────────────────────────────────────────────
/**
 * Spawn chairs and ragdolls evenly across the screen width.
 * Also resets particles, flashes, and the splatter layer.
 */
export function initWorld() {
  chairs   = [];
  ragdolls = [];
  clearParticles();
  clearFlashes();
  initSplat();
  state.shake = 0;

  const count   = Math.max(3, Math.floor(C.width / 210));
  const spacing = C.width / (count + 1);

  for (let i = 0; i < count; i++) {
    const cx = spacing * (i + 1);
    const ch = new Chair(cx);
    ragdolls.push(new Ragdoll(cx, ch.seatY, i));
    chairs.push(ch);
  }
}

// ─── Collision ────────────────────────────────────────────────────────
/**
 * Test the hammer head against every chair + ragdoll pair.
 * Impulse magnitude scales quadratically with speed so slow grazes
 * do nothing while full swings launch everything.
 *
 * @param {number} hx       Hammer head X
 * @param {number} hy       Hammer head Y
 * @param {number} hamVX    Hammer velocity X (px/frame)
 * @param {number} hamVY    Hammer velocity Y
 * @param {number} hamSpeed Magnitude — already capped upstream
 */
export function doCollisions(hx, hy, hamVX, hamVY, hamSpeed) {
  const MIN_SPEED = 10; // below this, contact does nothing
  if (hamSpeed < MIN_SPEED) return;

  // Linear ramp: 0 at MIN_SPEED, 1 at speed 50
  const strength = (hamSpeed - MIN_SPEED) / 40;

  for (let i = 0; i < ragdolls.length; i++) {
    const doll  = ragdolls[i];
    const chair = chairs[i];

    // Cheap broad-phase: find closest node
    let closest = Infinity;
    for (const p of [...doll.all, ...chair.all]) {
      const d = hypot(p.x - hx, p.y - hy);
      if (d < closest) closest = d;
    }

    if (closest > HIT_R + 16) continue;

    const ix = hamVX * strength * 0.55;
    const iy = hamVY * strength * 0.55;

    // Count broken constraints before applying impulse
    const brokenBefore = [...doll.cons, ...chair.cons].filter(c => c.broken).length;

    doll.applyImpulse(ix,         iy,         hx, hy);
    chair.applyImpulse(ix * 0.72, iy * 0.72,  hx, hy);

    // Quick solve pass so snap events register before sound plays
    for (let s = 0; s < 4; s++) {
      doll.cons.forEach(c => c.solve());
      chair.cons.forEach(c => c.solve());
    }

    const brokenAfter = [...doll.cons, ...chair.cons].filter(c => c.broken).length;

    playThud(hamSpeed);
    if (brokenAfter > brokenBefore) playCrack();

    spawnParticles(hx, hy, hamVX, hamVY, hamSpeed * strength);
    addSplat(hx, hy, hamSpeed, hamVX, hamVY);

    state.shake = Math.min(hamSpeed * strength * 0.75, 20);
    addFlash(hx, hy, 44 + hamSpeed * strength * 2.2);
  }
}
