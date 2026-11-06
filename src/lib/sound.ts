/**
 * Synthesised UI sounds. No audio files: every sound is built from
 * oscillators with the Web Audio API, so they work offline, cost no bytes and
 * start instantly. Browsers only allow audio after a tap, which is always
 * when these play.
 */

let ctx: AudioContext | null = null;
let reverb: ConvolverNode | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) { enabled = on; }
export function soundEnabled() { return enabled; }

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A short, bright room so the chime rings rather than clicks. */
function room(ac: AudioContext) {
  if (reverb) return reverb;
  const len = Math.floor(ac.sampleRate * 1.1);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  reverb = ac.createConvolver();
  reverb.buffer = buf;
  const wet = ac.createGain();
  wet.gain.value = 0.22;
  reverb.connect(wet).connect(ac.destination);
  return reverb;
}

/** One struck bell: a fundamental plus a few inharmonic partials, each fading at its own rate. */
function bell(ac: AudioContext, out: AudioNode, freq: number, at: number, gain = 0.32, length = 1.4) {
  const partials: [ratio: number, amp: number, decay: number][] = [[1, 1, 1], [2, 0.42, 0.55], [3.01, 0.18, 0.35], [4.2, 0.09, 0.22], [5.43, 0.05, 0.16]];
  for (const [ratio, amp, decay] of partials) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * ratio, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain * amp, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + length * decay);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + length * decay + 0.05);
  }
}

/** A soft low thump under the chime, felt more than heard. */
function thump(ac: AudioContext, out: AudioNode, at: number) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(190, at);
  o.frequency.exponentialRampToValueAtTime(55, at + 0.16);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.35, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + 0.25);
}

function bus(ac: AudioContext) {
  const master = ac.createGain();
  master.gain.value = 0.9;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  master.connect(comp).connect(ac.destination);
  master.connect(room(ac));
  return master;
}

/** The "payment done" chime: a rising two-note bell over a soft thump. */
export function playSuccess() {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const out = bus(ac);
  thump(ac, out, t);
  bell(ac, out, 1318.5, t + 0.04, 0.26, 1.2); // E6
  bell(ac, out, 1975.5, t + 0.17, 0.3, 1.8); // B6
}

/** A quieter single coin "ting", for money moving into a goal. */
export function playCoin() {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  const out = bus(ac);
  bell(ac, out, 2637, t, 0.16, 0.9); // E7
  bell(ac, out, 3520, t + 0.07, 0.1, 0.7); // A7
}

/** Tiny pop for menus opening. */
export function playPop() {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(420, t);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.06);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.1);
}
