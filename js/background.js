import { C, ctx, FY } from './config.js';

// ─── Background ───────────────────────────────────────────────────────
let bgCanvas = null;

/**
 * Render the room interior to an offscreen canvas.
 * Expensive — only call on init or resize.
 */
export function buildBG() {
  bgCanvas        = document.createElement('canvas');
  bgCanvas.width  = C.width;
  bgCanvas.height = C.height;
  const bc = bgCanvas.getContext('2d');
  const fy = FY();

  // Wall
  const wg = bc.createLinearGradient(0, 0, 0, fy);
  wg.addColorStop(0,   '#120806');
  wg.addColorStop(0.5, '#201008');
  wg.addColorStop(1,   '#2e180c');
  bc.fillStyle = wg;
  bc.fillRect(0, 0, C.width, fy);

  // Wallpaper — subtle diamond pattern
  bc.strokeStyle = 'rgba(180,100,40,0.045)';
  bc.lineWidth   = 1;
  const dm = 55;
  for (let y = 0; y < fy; y += dm) {
    for (let x = -dm; x < C.width + dm; x += dm) {
      bc.beginPath();
      bc.moveTo(x + dm / 2, y);
      bc.lineTo(x + dm,     y + dm / 2);
      bc.lineTo(x + dm / 2, y + dm);
      bc.lineTo(x,          y + dm / 2);
      bc.closePath();
      bc.stroke();
    }
  }

  // Wainscoting panel
  const wainH = 75;
  const wainG = bc.createLinearGradient(0, fy - wainH, 0, fy);
  wainG.addColorStop(0, '#3a2010');
  wainG.addColorStop(1, '#4e2c14');
  bc.fillStyle = wainG;
  bc.fillRect(0, fy - wainH, C.width, wainH);
  bc.strokeStyle = '#6a3c18';
  bc.lineWidth   = 2;
  bc.beginPath(); bc.moveTo(0, fy - wainH); bc.lineTo(C.width, fy - wainH); bc.stroke();
  bc.strokeStyle = 'rgba(255,180,80,0.12)';
  bc.lineWidth   = 1;
  bc.beginPath(); bc.moveTo(0, fy - wainH + 2); bc.lineTo(C.width, fy - wainH + 2); bc.stroke();

  // Baseboard
  const bsbG = bc.createLinearGradient(0, fy - 12, 0, fy);
  bsbG.addColorStop(0, '#6a3c18');
  bsbG.addColorStop(1, '#4a2810');
  bc.fillStyle = bsbG;
  bc.fillRect(0, fy - 12, C.width, 12);

  // Floor
  const flG = bc.createLinearGradient(0, fy, 0, C.height);
  flG.addColorStop(0,   '#6a4020');
  flG.addColorStop(0.3, '#5a3418');
  flG.addColorStop(1,   '#2a1408');
  bc.fillStyle = flG;
  bc.fillRect(0, fy, C.width, C.height - fy);

  // Floor planks (vertical dividers)
  for (let x = 0; x < C.width + 100; x += 100) {
    bc.strokeStyle = 'rgba(0,0,0,0.2)';
    bc.lineWidth   = 2;
    bc.beginPath(); bc.moveTo(x, fy); bc.lineTo(x, C.height); bc.stroke();
    bc.strokeStyle = 'rgba(255,200,100,0.03)';
    bc.lineWidth   = 1;
    bc.beginPath(); bc.moveTo(x + 4, fy); bc.lineTo(x + 4, C.height); bc.stroke();
  }

  // Floor grain lines (horizontal)
  for (let y = fy + 15; y < C.height; y += 22) {
    bc.strokeStyle = 'rgba(0,0,0,0.07)';
    bc.lineWidth   = 1;
    bc.beginPath(); bc.moveTo(0, y); bc.lineTo(C.width, y); bc.stroke();
  }

  // Floor/wall edge shadow
  const edgeG = bc.createLinearGradient(0, fy - 8, 0, fy + 18);
  edgeG.addColorStop(0,   'rgba(0,0,0,0)');
  edgeG.addColorStop(0.6, 'rgba(0,0,0,0.5)');
  edgeG.addColorStop(1,   'rgba(0,0,0,0)');
  bc.fillStyle = edgeG;
  bc.fillRect(0, fy - 8, C.width, 26);
}

/** Blit the pre-rendered background. Rebuilds automatically on resize. */
export function drawBG() {
  if (!bgCanvas || bgCanvas.width !== C.width || bgCanvas.height !== C.height) buildBG();
  ctx.drawImage(bgCanvas, 0, 0);
}

// ─── Ambient Dust ─────────────────────────────────────────────────────
let dust = [];

/** Initialise floating dust motes — call after resize so FY() is correct. */
export function initDust() {
  dust = Array.from({ length: 18 }, () => ({
    x:     Math.random() * C.width,
    y:     Math.random() * FY(),
    vx:    (Math.random() - 0.5) * 0.2,
    vy:    -0.1 - Math.random() * 0.15,
    r:     1 + Math.random() * 2,
    alpha: 0.02 + Math.random() * 0.06,
  }));
}

/** Advance and render all dust motes. */
export function updateDust() {
  dust.forEach(d => {
    d.x += d.vx;
    d.y += d.vy;
    if (d.y < -10) { d.y = FY(); d.x = Math.random() * C.width; }
    ctx.fillStyle = `rgba(220,180,100,${d.alpha})`;
    ctx.beginPath();
    ctx.arc(d.x % C.width, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  });
}
