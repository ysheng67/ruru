import { ctx, ITERS, hypot } from './config.js';
import { VP, Con } from './physics.js';

const SHIRTS = ['#c03028', '#2870d8', '#28a858', '#d490c0', '#d8a020', '#50c0d0'];
const PANTS = ['#1a2860', '#102818', '#502008', '#303030', '#50103a', '#1a4040'];
const SKINS = ['#d4a870', '#c8885a', '#f0c898', '#b87840', '#e8b880'];
const HAIRS = ['#2a1808', '#0a0a0a', '#8a6030', '#d09030', '#1a2840'];

export class Ragdoll {
  /**
   * @param {number} cx     Horizontal centre (aligned with chair)
   * @param {number} seatY  Y of seat surface
   * @param {number} idx    Index used to pick clothing colours
   */
  constructor(cx, seatY, idx) {
    this.active = false;
    const x = cx;
    const sy = seatY;

    // ── Verlet nodes ─────────────────────────────────────────────────
    this.head = new VP(x, sy - 80);
    this.neck = new VP(x, sy - 65);
    this.torsoT = new VP(x, sy - 57);
    this.torsoB = new VP(x, sy - 24);
    this.sholL = new VP(x - 21, sy - 56);
    this.sholR = new VP(x + 21, sy - 56);
    this.elbL = new VP(x - 26, sy - 37);
    this.elbR = new VP(x + 26, sy - 37);
    this.handL = new VP(x - 23, sy - 14);
    this.handR = new VP(x + 23, sy - 14);
    this.hipL = new VP(x - 12, sy - 21);
    this.hipR = new VP(x + 12, sy - 21);
    this.kneeL = new VP(x - 12, sy + 16);
    this.kneeR = new VP(x + 12, sy + 16);
    this.footL = new VP(x - 26, sy + 20);
    this.footR = new VP(x + 26, sy + 20);

    this.all = [
      this.head, this.neck, this.torsoT, this.torsoB,
      this.sholL, this.sholR, this.elbL, this.elbR, this.handL, this.handR,
      this.hipL, this.hipR, this.kneeL, this.kneeR, this.footL, this.footR,
    ];
    this.all.forEach(p => { p.px = p.x; p.py = p.y; });

    // Clothing palette
    this.shirt = SHIRTS[idx % SHIRTS.length];
    this.pants = PANTS[idx % PANTS.length];
    this.skin = SKINS[idx % SKINS.length];
    this.hair = HAIRS[idx % HAIRS.length];

    // ── Constraints ──────────────────────────────────────────────────
    // bf  = body/torso break threshold
    // lbf = limb break threshold
    // Higher = tougher.  Tune here to change overall durability.
    const bf = 20;
    const lbf = 15;
    const mk = (a, b, brk) => new Con(a, b, hypot(a.x - b.x, a.y - b.y), brk);

    this.cons = [
      mk(this.head, this.neck, bf * 1.6), // [0]  neck
      mk(this.neck, this.torsoT, bf * 2.0), // [1]  upper spine
      mk(this.torsoT, this.torsoB, bf * 2.5), // [2]  lower spine
      mk(this.torsoT, this.sholL, bf * 1.2), // [3]  left shoulder
      mk(this.torsoT, this.sholR, bf * 1.2), // [4]  right shoulder
      mk(this.sholL, this.elbL, lbf),        // [5]  left upper arm
      mk(this.elbL, this.handL, lbf),        // [6]  left forearm
      mk(this.sholR, this.elbR, lbf),        // [7]  right upper arm
      mk(this.elbR, this.handR, lbf),        // [8]  right forearm
      mk(this.torsoB, this.hipL, bf * 1.2), // [9]  left hip
      mk(this.torsoB, this.hipR, bf * 1.2), // [10] right hip
      mk(this.hipL, this.kneeL, lbf * 1.3), // [11] left thigh
      mk(this.kneeL, this.footL, lbf),        // [12] left shin
      mk(this.hipR, this.kneeR, lbf * 1.3), // [13] right thigh
      mk(this.kneeR, this.footR, lbf),        // [14] right shin
      // Structural cross-members (harder to break)
      mk(this.sholL, this.sholR, bf * 2.2), // [15] shoulder beam
      mk(this.hipL, this.hipR, bf * 2.2), // [16] hip beam
      mk(this.torsoT, this.hipL, bf * 1.6), // [17] left torso diagonal
      mk(this.torsoT, this.hipR, bf * 1.6), // [18] right torso diagonal
    ];
  }

  applyImpulse(ix, iy, px, py) {
    this.active = true;
    this.all.forEach(p => {
      const d = hypot(p.x - px, p.y - py);
      const f = Math.max(0, 1 - d / 120) * 0.38;
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

    const {
      head, neck, torsoT, torsoB,
      sholL, sholR, elbL, elbR, handL, handR,
      hipL, hipR, kneeL, kneeR, footL, footR,
    } = this;

    const seg = (a, b, w, col, con) => {
      if (con?.broken) return;
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    // Legs
    seg(hipL, kneeL, 11, this.pants, this.cons[11]);
    seg(kneeL, footL, 9, this.pants, this.cons[12]);
    seg(hipR, kneeR, 11, this.pants, this.cons[13]);
    seg(kneeR, footR, 9, this.pants, this.cons[14]);

    // Shoes
    const drawShoe = (foot, knee, con) => {
      if (con?.broken) return;
      const ang = Math.atan2(foot.y - knee.y, foot.x - knee.x);
      ctx.save();
      ctx.translate(foot.x, foot.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#1a1008';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(8, 0, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    drawShoe(footL, kneeL, this.cons[12]);
    drawShoe(footR, kneeR, this.cons[14]);

    // Torso
    seg(torsoT, torsoB, 17, this.shirt, this.cons[2]);
    seg(sholL, sholR, 13, this.shirt, this.cons[15]);

    // Arms
    seg(sholL, elbL, 7, this.skin, this.cons[5]);
    seg(elbL, handL, 6, this.skin, this.cons[6]);
    seg(sholR, elbR, 7, this.skin, this.cons[7]);
    seg(elbR, handR, 6, this.skin, this.cons[8]);

    // Hands
    const drawHand = (pt, con) => {
      if (con?.broken) return;
      ctx.fillStyle = this.skin;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };
    drawHand(handL, this.cons[6]);
    drawHand(handR, this.cons[8]);

    // Neck
    seg(neck, torsoT, 9, this.skin, this.cons[1]);

    // Head (always drawn, even when detached)
    const shadow = ctx;
    shadow.fillStyle = 'rgba(0,0,0,0.2)';
    shadow.beginPath();
    shadow.ellipse(head.x + 2, head.y + 3, 11, 7, 0, 0, Math.PI * 2);
    shadow.fill();

    ctx.fillStyle = this.skin;
    ctx.strokeStyle = '#906030';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair
    ctx.fillStyle = this.hair;
    ctx.beginPath();
    ctx.arc(head.x, head.y - 4, 10.5, Math.PI * 1.05, Math.PI * 0.05, false);
    ctx.lineTo(head.x + 5, head.y - 4);
    ctx.lineTo(head.x, head.y - 14);
    ctx.lineTo(head.x - 5, head.y - 4);
    ctx.closePath();
    ctx.fill();

    // Face — oriented along neck→head axis
    const faceAng = Math.atan2(this.neck.y - head.y, this.neck.x - head.x) + Math.PI / 2;
    const px = Math.cos(faceAng - Math.PI / 2);
    const py = Math.sin(faceAng - Math.PI / 2);
    const ux = Math.cos(faceAng);
    const uy = Math.sin(faceAng);

    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(head.x - px * 4.5 - ux * 2, head.y - py * 4.5 - uy * 2, 2.2, 0, Math.PI * 2);
    ctx.arc(head.x + px * 4.5 - ux * 2, head.y + py * 4.5 - uy * 2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7a4020';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(head.x - ux * 3.5, head.y - uy * 3.5, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
}
