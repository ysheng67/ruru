import { C, FY, G, hypot, abs, clamp } from './config.js';
import { state } from './state.js';

// ─── Verlet Point ─────────────────────────────────────────────────────
/**
 * A single particle integrated with implicit-velocity Verlet.
 * Velocity is stored implicitly as (current - previous) position.
 */
export class VP {
  /**
   * @param {number} x
   * @param {number} y
   * @param {{ pinned?: boolean, friction?: number, bounce?: number }} opts
   */
  constructor(x, y, opts = {}) {
    this.x  = x;  this.y  = y;
    this.px = x;  this.py = y;
    this.pinned   = opts.pinned   ?? false;
    this.friction = opts.friction ?? 0.985;
    this.bounce   = opts.bounce   ?? 0.22;
  }

  step() {
    if (this.pinned) return;

    // Safety: reset any point that exploded to NaN / Infinity
    if (!isFinite(this.x) || !isFinite(this.y)) {
      this.x  = clamp(isFinite(this.x) ? this.x : C.width / 2, 0, C.width);
      this.y  = clamp(isFinite(this.y) ? this.y : FY(),         0, FY());
      this.px = this.x;
      this.py = this.y;
      return;
    }

    let vx = (this.x - this.px) * this.friction;
    let vy = (this.y - this.py) * this.friction;

    // Velocity cap — prevents runaway energy accumulation on repeated hits
    const spd = hypot(vx, vy);
    if (spd > 60) { const s = 60 / spd; vx *= s; vy *= s; }

    this.px = this.x;
    this.py = this.y;

    // Scale displacement by timeScale for slow-motion support
    const ts = state.timeScale;
    this.x += vx * ts;
    this.y += vy * ts + G * ts;

    // ── Boundary collisions ───────────────────────────────────────────
    const fy = FY();
    if (this.y > fy) {
      this.y  = fy;
      this.py = this.y + vy * this.bounce;
      this.px = this.x - vx * 0.5;
    }
    if (this.x < 0) {
      const vv = this.x - this.px;
      this.x   = 0;
      this.px  = this.x + vv * this.bounce;
    }
    if (this.x > C.width) {
      const vv = this.x - this.px;
      this.x   = C.width;
      this.px  = this.x + vv * this.bounce;
    }
    if (this.y < 0) {
      const vv = this.y - this.py;
      this.y   = 0;
      this.py  = this.y + vv * this.bounce;
    }
  }

  /** Apply an instantaneous impulse by shifting the previous position. */
  push(fx, fy) {
    if (this.pinned) return;
    this.px -= fx;
    this.py -= fy;
  }
}

// ─── Distance Constraint ─────────────────────────────────────────────
/**
 * Keeps two VP nodes a fixed distance apart.
 * If the stretch exceeds `breakAt`, the constraint snaps permanently.
 */
export class Con {
  /**
   * @param {VP} a
   * @param {VP} b
   * @param {number} len   Rest length in px
   * @param {number} breakAt  Max stretch before snapping (default: never)
   */
  constructor(a, b, len, breakAt = Infinity) {
    this.a       = a;
    this.b       = b;
    this.len     = len;
    this.breakAt = breakAt;
    this.broken  = false;
  }

  solve() {
    if (this.broken) return;

    const dx      = this.b.x - this.a.x;
    const dy      = this.b.y - this.a.y;
    const d       = hypot(dx, dy) || 1e-9;
    const stretch = d - this.len;

    if (abs(stretch) > this.breakAt) { this.broken = true; return; }

    const half = stretch / d * 0.5;
    const am   = this.a.pinned ? 0 : 1;
    const bm   = this.b.pinned ? 0 : 1;
    const tot  = am + bm || 1;

    if (!this.a.pinned) {
      this.a.x += dx * half * am / tot;
      this.a.y += dy * half * am / tot;
    }
    if (!this.b.pinned) {
      this.b.x -= dx * half * bm / tot;
      this.b.y -= dy * half * bm / tot;
    }
  }
}
