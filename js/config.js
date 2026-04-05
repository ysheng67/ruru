// ─── Canvas ───────────────────────────────────────────────────────────
export const C   = document.getElementById('c');
export const ctx = C.getContext('2d');

// ─── Physics constants ────────────────────────────────────────────────
export const G          = 0.58;   // gravity acceleration (px/frame²)
export const ITERS      = 14;     // constraint solver iterations per frame
export const FLOOR_PAD  = 95;     // px from bottom of screen to floor surface

// ─── Rope / hammer constants ──────────────────────────────────────────
export const ROPE_SEGS  = 10;     // number of chain links
export const SEG_LEN    = 14;     // rest length of each link (px)
export const HANDLE_LEN = 58;     // hammer handle length (px)
export const HEAD_W     = 30;     // hammer head width  (px)
export const HEAD_H     = 22;     // hammer head height (px)
export const HIT_R      = 28;     // collision radius around hammer head centre

// ─── Helpers ─────────────────────────────────────────────────────────
/** Y-coordinate of the floor surface. Recalculated every call so it
 *  stays correct after window resize. */
export function FY() { return C.height - FLOOR_PAD; }

export const hypot = Math.hypot;
export const abs   = Math.abs;
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
