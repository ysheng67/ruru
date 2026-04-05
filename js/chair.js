import { ctx, FY, ITERS, hypot } from './config.js';
import { VP, Con } from './physics.js';

const WOOD_DARK = '#5c2e08';
const WOOD_MID = '#7a3e14';
const WOOD_LIGHT = '#9a5424';

export class Chair {
  /** @param {number} cx  Horizontal centre of the chair */
  constructor(cx) {
    this.active = false;
    this.cx = cx;

    const fy = FY();
    const sy = fy - 52; // seat surface Y

    // ── Verlet nodes ──
    this.sl = new VP(cx - 27, sy, { bounce: 0.28, friction: 0.92 }); // seat left
    this.sr = new VP(cx + 27, sy, { bounce: 0.28, friction: 0.92 }); // seat right
    this.fll = new VP(cx - 25, fy, { bounce: 0.12, friction: 0.88 }); // front-leg left
    this.flr = new VP(cx + 25, fy, { bounce: 0.12, friction: 0.88 }); // front-leg right
    this.bt = new VP(cx - 27, sy - 46);                                    // back-top

    this.all = [this.sl, this.sr, this.fll, this.flr, this.bt];
    this.seatY = sy;

    // ── Break thresholds ──
    // Higher = tougher. Tune these in config if you want softer/harder chairs.
    const bf = 21; // main structural members
    const lbf = 15; // legs and back post

    this.cons = [
      new Con(this.sl, this.sr, 54, bf * 2.2), // [0] seat beam
      new Con(this.sl, this.fll, 52, lbf),       // [1] left leg
      new Con(this.sr, this.flr, 52, lbf),       // [2] right leg
      new Con(this.sl, this.flr, hypot(54, 52), bf * 1.4), // [3] cross brace L→R
      new Con(this.sr, this.fll, hypot(54, 52), bf * 1.4), // [4] cross brace R→L
      new Con(this.sl, this.bt, 46, lbf),       // [5] back post
      new Con(this.sr, this.bt, hypot(54, 46), lbf * 1.2), // [6] back diagonal
    ];
  }

  /** Push all nodes away from the hit point, scaled by proximity. */
  applyImpulse(ix, iy, px, py) {
    this.active = true;
    this.all.forEach(p => {
      const d = hypot(p.x - px, p.y - py);
      const f = Math.max(0, 1 - d / 150) * 0.65;
      p.push(ix * f, iy * f);
    });
  }

  update() {
    if (!this.active) return;
    this.all.forEach(p => p.step());
    for (let i = 0; i < ITERS; i++) this.cons.forEach(c => c.solve());
  }

  draw() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const seg = (a, b, w, col, con) => {
      if (con?.broken) return;
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    // Subtle floor shadow while chair is still upright
    if (!this.active) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(this.cx, FY() + 2, 30, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw order: back-most first
    seg(this.sl, this.flr, 5, WOOD_DARK, this.cons[3]); // cross brace
    seg(this.sr, this.fll, 5, WOOD_DARK, this.cons[4]); // cross brace
    seg(this.sl, this.fll, 9, WOOD_MID, this.cons[1]); // left leg
    seg(this.sr, this.flr, 9, WOOD_MID, this.cons[2]); // right leg
    seg(this.sl, this.sr, 13, WOOD_LIGHT, this.cons[0]); // seat
    seg(this.sl, this.bt, 9, WOOD_MID, this.cons[5]); // back post

    // Backrest rails (derived from back post angle)
    if (!this.cons[5].broken) {
      const bx = this.bt.x;
      const by = this.bt.y;
      const ang = Math.atan2(this.bt.y - this.sl.y, this.bt.x - this.sl.x);
      const perp = ang + Math.PI / 2;

      const rx = bx + Math.cos(perp) * 52;
      const ry = by + Math.sin(perp) * 52;

      ctx.strokeStyle = WOOD_MID;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      // Mid rail
      const mx = this.sl.x + Math.cos(perp) * 52;
      const my = this.sl.y + Math.sin(perp) * 52;
      const halfX = (bx + this.sl.x) / 2;
      const halfY = (by + this.sl.y) / 2;
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(halfX, halfY);
      ctx.lineTo((rx + mx) / 2, (ry + my) / 2);
      ctx.stroke();
    }
  }
}
