/**
 * Centralised mutable state.
 * Exported as a plain object so any module can read AND write by reference,
 * without needing getter/setter boilerplate.
 *
 *   import { state } from './state.js';
 *   state.timeScale = 0.2;   // write
 *   console.log(state.shake); // read
 */
export const state = {
  // Input
  mouse:      { x: innerWidth / 2, y: innerHeight / 2 },
  slowmoKeys: new Set(),  // keys currently held that trigger slow-mo

  // Physics multiplier — 1 = normal, <1 = slow motion
  timeScale: 1,

  // Camera shake magnitude (px). Decays each frame.
  shake: 0,
};
