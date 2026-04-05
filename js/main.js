import { C, ctx, clamp, hypot } from './config.js';
import { state } from './state.js';
import { initRope, updateRope, getHammerHead, drawHammer } from './rope.js';
import { initWorld, chairs, ragdolls, doCollisions } from './world.js';
import { updateParticles } from './particles.js';
import { updateFlashes } from './particles.js';
import { buildBG, drawBG, initDust, updateDust } from './background.js';
import { drawSplat, initSplat } from './splatter.js';

//music

const music = document.getElementById("bg-music");
const muteBtn = document.getElementById("mute-btn");

let isMuted = false;

// browsers block autoplay → wait for first interaction
window.addEventListener("click", () => {
  if (music.paused) {
    music.volume = 0.5; // adjust if needed
    music.play();
  }
}, { once: true });

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  music.muted = isMuted;

  muteBtn.textContent = isMuted ? "🔇" : "🔊";
});

// ─── Canvas resize ────────────────────────────────────────────────────
function resize() {
  C.width = innerWidth;
  C.height = innerHeight;
}
resize();

window.addEventListener('resize', () => {
  resize();
  buildBG();
  initSplat();
  initWorld();
  initRope();
  initDust();
});

// ─── Input ────────────────────────────────────────────────────────────
window.addEventListener('mousemove', e => {
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault(); // prevent page scroll
    state.slowmoKeys.add('Space');
  }
  if (e.key === 'r' || e.key === 'R') {
    initWorld();
    buildBG();
    initDust();
  }
});

window.addEventListener('keyup', e => {
  if (e.code === 'Space') state.slowmoKeys.delete('Space');
});

// ─── Boot ─────────────────────────────────────────────────────────────
buildBG();
initDust();
initRope();
initWorld();

// Pre-warm rope so it doesn't snap to position on frame 1
for (let i = 0; i < 20; i++) updateRope();

let prevHead = (() => { const h = getHammerHead(); return { x: h.x, y: h.y }; })();

// ─── Game Loop ────────────────────────────────────────────────────────
function frame() {
  requestAnimationFrame(frame);

  // ── Slow-motion ──
  const targetTS = state.slowmoKeys.has('Space') ? 0.18 : 1;
  state.timeScale += (targetTS - state.timeScale) * 0.12; // smooth lerp

  // ── Physics ──
  updateRope();
  const hState = getHammerHead();

  const hamVX = hState.x - prevHead.x;
  const hamVY = hState.y - prevHead.y;
  const hamSpd = Math.min(hypot(hamVX, hamVY), 80); // cap to prevent one-frame spikes

  chairs.forEach(c => c.update());
  ragdolls.forEach(r => r.update());

  doCollisions(hState.x, hState.y, hamVX, hamVY, hamSpd);
  prevHead = { x: hState.x, y: hState.y };

  // ── Screen shake ──
  let sx = 0, sy = 0;
  if (state.shake > 0.08) {
    const ang = Math.random() * Math.PI * 2;
    sx = Math.cos(ang) * state.shake;
    sy = Math.sin(ang) * state.shake;
    state.shake *= 0.8;
  } else {
    state.shake = 0;
  }

  // ── Render ──
  ctx.save();
  try {
    if (state.shake > 0) ctx.translate(sx, sy);

    drawBG();
    drawSplat();      // persistent paint decals — drawn above BG, below objects
    updateFlashes();
    updateDust();

    chairs.forEach(c => c.draw());
    ragdolls.forEach(r => r.draw());

    updateParticles();
    drawHammer();

    // Vignette
    const vg = ctx.createRadialGradient(
      C.width / 2, C.height / 2, C.height * 0.3,
      C.width / 2, C.height / 2, C.height * 0.85,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, C.width, C.height);

    // Slow-mo overlay — blue tint + SLOW badge
    const ts = state.timeScale;
    if (ts < 0.8) {
      const t = 1 - ts / 0.8;
      ctx.fillStyle = `rgba(30,60,140,${t * 0.18})`;
      ctx.fillRect(0, 0, C.width, C.height);

      ctx.save();
      ctx.globalAlpha = t * 0.85;
      ctx.font = `bold ${14 + t * 4}px Georgia`;
      ctx.fillStyle = 'rgba(140,200,255,0.9)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('SLOW', C.width - 22, 18);
      ctx.restore();
    }
  } catch (e) {
    console.warn('[hammer] draw error (suppressed):', e);
  } finally {
    ctx.restore(); // always restore — prevents transform stack corruption
  }
}

frame();
