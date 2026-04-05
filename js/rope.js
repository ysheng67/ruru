import { ctx, ROPE_SEGS, SEG_LEN, HANDLE_LEN, HEAD_W, HEAD_H, ITERS, hypot } from './config.js';
import { state } from './state.js';
import { VP, Con } from './physics.js';

// ─── Rope state (module-private, exposed via exports below) ──────────
export let rope = [];
export let ropeCons = [];

// ─── Initialisation ──────────────────────────────────────────────────
export function initRope() {
  rope = [];
  ropeCons = [];

  for (let i = 0; i <= ROPE_SEGS; i++) {
    rope.push(new VP(state.mouse.x, state.mouse.y + i * SEG_LEN, { friction: 0.95 }));
  }
  rope[0].pinned = true;

  for (let i = 0; i < ROPE_SEGS; i++) {
    ropeCons.push(new Con(rope[i], rope[i + 1], SEG_LEN));
  }
}

// ─── Update ──────────────────────────────────────────────────────────
export function updateRope() {
  rope[0].x = state.mouse.x;
  rope[0].y = state.mouse.y;

  rope.forEach(p => p.step());

  for (let i = 0; i < ITERS; i++) {
    ropeCons.forEach(c => c.solve());
    rope[0].x = state.mouse.x;
    rope[0].y = state.mouse.y;
  }
}

// ─── Geometry ────────────────────────────────────────────────────────
/**
 * Returns the world position of the hammer head centre and the angle
 * of the handle, derived from the last two rope nodes.
 * @returns {{ x: number, y: number, tip: VP, ang: number }}
 */
export function getHammerHead() {
  const tip = rope[ROPE_SEGS];
  const prev = rope[ROPE_SEGS - 1];
  const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  return {
    x: tip.x + Math.cos(ang) * (HANDLE_LEN + HEAD_W * 0.5),
    y: tip.y + Math.sin(ang) * (HANDLE_LEN + HEAD_W * 0.5),
    tip,
    ang,
  };
}

// ─── Drawing ─────────────────────────────────────────────────────────
export function drawHammer() {
  const { tip, ang } = getHammerHead();

  // ── Chain backbone line ──
  ctx.strokeStyle = '#a08040';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  rope.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  // ── Individual link ellipses ──
  for (let i = 1; i < rope.length; i++) {
    const p = rope[i];
    const q = rope[i - 1];
    const la = Math.atan2(p.y - q.y, p.x - q.x);
    ctx.save();
    ctx.translate((p.x + q.x) / 2, (p.y + q.y) / 2);
    ctx.rotate(la);
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Hammer handle + head ──
  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(ang);

  // Wooden handle
  const hg = ctx.createLinearGradient(0, -4, 0, 4);
  hg.addColorStop(0, '#e0b860');
  hg.addColorStop(0.45, '#f8e090');
  hg.addColorStop(1, '#9a6820');
  ctx.fillStyle = hg;
  ctx.strokeStyle = '#6a4010';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0, -4, HANDLE_LEN, 8, 3);
  ctx.fill();
  ctx.stroke();

  // Grip wrap lines
  ctx.strokeStyle = 'rgba(80,40,0,0.4)';
  ctx.lineWidth = 1.5;
  for (let x = 6; x < HANDLE_LEN - 10; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, -4);
    ctx.lineTo(x, 4);
    ctx.stroke();
  }

  // Ferrule (metal collar)
  ctx.fillStyle = '#888';
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.fillRect(HANDLE_LEN - 4, -5.5, 7, 11);
  ctx.strokeRect(HANDLE_LEN - 4, -5.5, 7, 11);

  // ── Hammer head ──
  ctx.save();
  ctx.translate(HANDLE_LEN + HEAD_W * 0.5, 0);

  const mg = ctx.createLinearGradient(0, -HEAD_H / 2, 0, HEAD_H / 2);
  mg.addColorStop(0, '#bbb');
  mg.addColorStop(0.25, '#eee');
  mg.addColorStop(0.6, '#999');
  mg.addColorStop(1, '#666');
  ctx.fillStyle = mg;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-HEAD_W / 2, -HEAD_H / 2, HEAD_W, HEAD_H, 3);
  ctx.fill();
  ctx.stroke();

  // Strike face
  ctx.fillStyle = '#bbb';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(HEAD_W / 2 - 4, -HEAD_H / 2, 5, HEAD_H, [0, 3, 3, 0]);
  ctx.fill();
  ctx.stroke();

  // Eye hole (where handle enters head)
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.roundRect(-HEAD_W / 2 - 2, -4, 8, 8, 2);
  ctx.fill();

  ctx.restore(); // hammer head
  ctx.restore(); // handle transform

  // Cursor dot
  ctx.fillStyle = 'rgba(255,220,130,0.55)';
  ctx.beginPath();
  ctx.arc(state.mouse.x, state.mouse.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}
