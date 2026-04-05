import { C, FY, clamp } from './config.js';

const BLOODS = ['#8b0000', '#a00010', '#6b0808', '#c01020', '#500005'];

let splatCanvas = null;
let splatCtx    = null;

/** (Re)create the splatter canvas — call on init and window resize. */
export function initSplat() {
  splatCanvas        = document.createElement('canvas');
  splatCanvas.width  = C.width;
  splatCanvas.height = C.height;
  splatCtx           = splatCanvas.getContext('2d');
}

/**
 * Paint a splat at the impact point with radial drips.
 * @param {number} x      Impact X
 * @param {number} y      Impact Y
 * @param {number} speed  Hammer speed (controls splat size + drip count)
 * @param {number} vx     Hammer velocity X (biases drip direction)
 * @param {number} vy     Hammer velocity Y
 */
export function addSplat(x, y, speed, vx, vy) {
  if (!splatCtx) return;

  const sc  = splatCtx;
  const vol = clamp((speed - 10) / 50, 0, 1);
  const n   = Math.floor(3 + vol * 14);
  const col = BLOODS[Math.floor(Math.random() * BLOODS.length)];
  const fy  = FY();

  // Central blob
  sc.globalAlpha = 0.55 + vol * 0.3;
  sc.fillStyle   = col;
  sc.beginPath();
  sc.arc(x, clamp(y, 0, fy), Math.max(0.5, 3 + vol * 14), 0, Math.PI * 2);
  sc.fill();

  // Trailing drips
  for (let i = 0; i < n; i++) {
    const ang   = Math.random() * Math.PI * 2;
    const spd   = 10 + Math.random() * speed * 0.6;
    const dx    = Math.cos(ang) * spd + vx * 0.3;
    const dy    = Math.sin(ang) * spd + vy * 0.3;
    const steps = 4 + Math.floor(Math.random() * 8);
    let cx = x;
    let cy = y;

    for (let s = 0; s < steps; s++) {
      cx += dx * 0.6 * (1 - s / steps);
      cy += dy * 0.6 * (1 - s / steps) + 1.5; // gravity pulls drips down
      if (cy > fy) cy = fy;
      const cr = Math.max(0.4, (2 + vol * 5) * (1 - s / steps));
      sc.globalAlpha = (0.6 - (s / steps) * 0.5) * (0.4 + vol * 0.5);
      sc.fillStyle   = col;
      sc.beginPath();
      sc.arc(cx, cy, Math.max(0.3, cr), 0, Math.PI * 2);
      sc.fill();
    }

    // Terminal droplet
    sc.globalAlpha = 0.5 * vol;
    sc.beginPath();
    sc.arc(
      cx + (Math.random() - 0.5) * 6,
      Math.min(cy + Math.random() * 4, fy),
      Math.max(0.3, 1 + Math.random() * vol * 3),
      0, Math.PI * 2,
    );
    sc.fill();
  }

  sc.globalAlpha = 1;
}

/** Composite the splatter layer onto the main canvas. */
export function drawSplat() {
  if (splatCanvas) {
    // Import C.getContext('2d') indirectly via the main canvas reference
    const mainCtx = C.getContext('2d');
    mainCtx.drawImage(splatCanvas, 0, 0);
  }
}
