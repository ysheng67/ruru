import { clamp } from './config.js';

let audioCtx = null;

/** Lazily create (or resume) the AudioContext on first use. */
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/**
 * Play a layered impact thud.
 * Volume and pitch scale with hammer speed so fast hits sound heavier.
 * @param {number} speed  Hammer head speed in px/frame
 */
export function playThud(speed) {
  try {
    const ac  = getAudio();
    const vol = clamp((speed - 10) / 50, 0, 1);
    if (vol < 0.05) return;

    // Low sine sweep — the body of the thud
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.7, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    g.connect(ac.destination);

    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80 + speed * 1.2, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.15);
    osc.connect(g);
    osc.start();
    osc.stop(ac.currentTime + 0.2);

    // Noise burst — the sharp attack transient
    const buf  = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src    = ac.createBufferSource();
    src.buffer   = buf;

    const filter = ac.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = 200 + speed * 8;
    filter.Q.value         = 0.8;

    const ng = ac.createGain();
    ng.gain.setValueAtTime(vol * 0.4, ac.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.03);

    src.connect(filter);
    filter.connect(ng);
    ng.connect(ac.destination);
    src.start();
    src.stop(ac.currentTime + 0.04);
  } catch (_) { /* audio not supported — silent fail */ }
}

/**
 * Play a sharp woody crack sound when a constraint breaks.
 * Uses decaying noise filtered to the high-mid range.
 */
export function playCrack() {
  try {
    const ac   = getAudio();
    const buf  = ac.createBuffer(1, ac.sampleRate * 0.12, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.04));
    }

    const src    = ac.createBufferSource();
    src.buffer   = buf;

    const filter = ac.createBiquadFilter();
    filter.type            = 'highpass';
    filter.frequency.value = 600;

    const g = ac.createGain();
    g.gain.setValueAtTime(0.5, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);

    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start();
    src.stop(ac.currentTime + 0.14);
  } catch (_) { /* silent fail */ }
}
