/**
 * Real-time 3D for MoneyMate, in plain three.js (no React renderer) so it can
 * be lazy-loaded as one chunk and torn down cleanly.
 *
 * Modes
 *  - hero:  a waving banknote with gold coins floating around it (sign-in page)
 *  - stack: a stack of coins whose height follows `value` (0..1), e.g. the
 *           share of this month's income still left. Coins drop in and hop.
 *  - coin:  one coin, slowly turning (empty states)
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type SceneMode = 'hero' | 'stack' | 'coin';
export interface SceneOptions { mode: SceneMode; value?: number; reduced?: boolean; maxCoins?: number }
export interface MoneyScene { setValue(v: number): void; hop(): void; setReduced(r: boolean): void; dispose(): void }

const GOLD = new THREE.Color('#D99A1E');
const NOTE = '#0F3A36';

/* ------------------------------------------------------------------ textures */

function faceTexture(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const m = size / 2;
  // Bump map: white is raised. A rim of beads, a ring, and the rupee sign.
  g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, size, size);
  g.strokeStyle = '#ffffff'; g.lineWidth = size * 0.018;
  g.beginPath(); g.arc(m, m, size * 0.40, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#ffffff';
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    g.beginPath(); g.arc(m + Math.cos(a) * size * 0.45, m + Math.sin(a) * size * 0.45, size * 0.011, 0, Math.PI * 2); g.fill();
  }
  g.font = `700 ${size * 0.42}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('₹', m, m + size * 0.02);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

function noteTexture() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#134842'); grad.addColorStop(1, NOTE);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // Guilloche line-work
  g.strokeStyle = 'rgba(232,241,238,0.16)'; g.lineWidth = 1.2;
  for (let k = 0; k < 22; k++) {
    g.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const t = (x / W) * Math.PI * 5;
      const y = H / 2 + Math.sin(t + k * 0.3) * (60 + k * 6) * Math.cos(t / 5 + k * 0.12);
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  // Rosette
  g.strokeStyle = 'rgba(245,196,81,0.35)'; g.lineWidth = 1.4;
  const cx = W * 0.78, cy = H * 0.5;
  for (let k = 0; k < 36; k++) {
    g.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.04) {
      const r = 92 + 18 * Math.sin(a * 6 + k * 0.17);
      const x = cx + Math.cos(a + k * 0.09) * r, y = cy + Math.sin(a + k * 0.09) * r;
      a ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  // Border
  g.strokeStyle = 'rgba(232,241,238,0.35)'; g.lineWidth = 3; g.strokeRect(24, 24, W - 48, H - 48);
  g.strokeStyle = 'rgba(232,241,238,0.18)'; g.lineWidth = 1; g.strokeRect(36, 36, W - 72, H - 72);
  // Mark and wordmark
  g.fillStyle = '#F5C451'; g.beginPath(); g.arc(W * 0.78, H * 0.5, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#E8F1EE';
  g.font = '600 64px "Bricolage Grotesque Variable", system-ui, sans-serif';
  g.textBaseline = 'alphabetic'; g.fillText('MoneyMate', 72, H - 78);
  g.font = '500 22px "Figtree Variable", system-ui, sans-serif';
  g.fillStyle = 'rgba(232,241,238,0.7)'; g.fillText('Know what’s safe to spend today', 74, H - 40);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* -------------------------------------------------------------------- coins */

function coinGeometry() {
  // Lathe profile: flat face, raised rim, rounded edge
  const p = [
    [0, 0.07], [0.80, 0.07], [0.84, 0.095], [0.95, 0.095], [0.995, 0.07],
    [1.0, 0.0], [0.995, -0.07], [0.95, -0.095], [0.84, -0.095], [0.80, -0.07], [0, -0.07],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(p, 48);
  g.computeVertexNormals();
  return g;
}

function makeCoinFactory(flat = false) {
  const body = coinGeometry();
  const faceGeo = new THREE.CircleGeometry(0.8, 48);
  const bump = faceTexture();
  const metal = new THREE.MeshStandardMaterial({ color: GOLD, metalness: flat ? 0.55 : 1, roughness: flat ? 0.35 : 0.24, envMapIntensity: 0.85 });
  const face = new THREE.MeshStandardMaterial({ color: GOLD, metalness: flat ? 0.55 : 1, roughness: flat ? 0.4 : 0.3, bumpMap: bump, bumpScale: 2.6, envMapIntensity: 0.85 });
  const make = () => {
    const coin = new THREE.Group();
    coin.add(new THREE.Mesh(body, metal));
    const top = new THREE.Mesh(faceGeo, face); top.rotation.x = -Math.PI / 2; top.position.y = 0.0705;
    const bottom = new THREE.Mesh(faceGeo, face); bottom.rotation.x = Math.PI / 2; bottom.position.y = -0.0705;
    coin.add(top, bottom);
    return coin;
  };
  const dispose = () => { body.dispose(); faceGeo.dispose(); bump.dispose(); metal.dispose(); face.dispose(); };
  return { make, dispose };
}

/* -------------------------------------------------------------------- scene */

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const bounce = (t: number) => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && c.getContext('webgl2')) || Boolean(c.getContext('webgl'));
  } catch { return false; }
}

export function createMoneyScene(container: HTMLElement, opts: SceneOptions): MoneyScene {
  const dpr = window.devicePixelRatio || 1;
  const renderer = new THREE.WebGLRenderer({ antialias: dpr < 2, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(dpr, 1.75));
  // Software-only WebGL (no GPU) can't afford a render loop: show still frames instead
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpuName = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  let lowPower = /swiftshader|llvmpipe|software|basic render/i.test(gpuName);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Pre-filtered reflections make the gold look like metal. They take a moment of
  // GPU work up front, which software-only WebGL can't spare, so it gets plain lights.
  let pmrem: THREE.PMREMGenerator | null = null;
  let env: THREE.Texture | null = null;
  if (!lowPower) {
    pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    env = pmrem.fromScene(room, 0.04).texture;
    room.dispose?.();
    scene.environment = env;
  } else {
    scene.add(new THREE.HemisphereLight('#fff6e0', '#2a3a36', 2.2));
  }
  const key = new THREE.DirectionalLight('#fff4dc', 1.6); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight('#7fe0cf', 0.9); rim.position.set(-4, 2, -3); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(opts.mode === 'hero' ? 34 : 30, 1, 0.1, 100);
  const root = new THREE.Group(); scene.add(root);
  const coins = makeCoinFactory(lowPower);
  const disposables: { dispose(): void }[] = [coins, ...(pmrem ? [pmrem] : []), ...(env ? [env] : [])];

  let reduced = Boolean(opts.reduced);
  let target = Math.max(0, Math.min(1, opts.value ?? 0));
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0, running = false, visible = true;
  const t0 = performance.now();
  const elapsed = () => (performance.now() - t0) / 1000;

  /* ---- hero: banknote + floating coins */
  let note: THREE.Mesh | null = null;
  let noteBase: Float32Array | null = null;
  const floaters: { obj: THREE.Object3D; base: THREE.Vector3; speed: number; phase: number; spin: THREE.Vector3 }[] = [];
  if (opts.mode === 'hero') {
    camera.position.set(0, 0.2, 9);
    const tex = noteTexture(); disposables.push(tex);
    const geo = new THREE.PlaneGeometry(4.2, 2.1, 36, 14); disposables.push(geo);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0.08, side: THREE.DoubleSide }); disposables.push(mat);
    note = new THREE.Mesh(geo, mat);
    note.rotation.set(-0.22, -0.38, 0.08);
    root.add(note);
    noteBase = Float32Array.from(geo.attributes.position.array as Float32Array);
    const spots: [number, number, number, number][] = [
      [-2.9, 0.9, 0.9, 0.6], [2.7, 1.0, 0.4, 0.5], [3.0, -0.8, 1.2, 0.66], [-2.6, -0.9, 1.5, 0.52],
      [0.9, 1.35, -0.8, 0.4], [-0.9, -1.3, 0.6, 0.45], [4.2, 0.1, -1.2, 0.42], [-4.2, 0.1, -0.6, 0.44],
    ];
    spots.forEach(([x, y, z, s], i) => {
      const c = coins.make(); c.scale.setScalar(s); c.position.set(x, y, z);
      c.rotation.set(Math.PI / 2 - 0.3 + i * 0.2, i * 0.7, i * 0.3);
      root.add(c);
      floaters.push({ obj: c, base: new THREE.Vector3(x, y, z), speed: 0.5 + (i % 3) * 0.18, phase: i * 1.3, spin: new THREE.Vector3(0.12 + i * 0.03, 0.35 + (i % 4) * 0.12, 0.05) });
    });
  }

  /* ---- coin: a single turning coin */
  let single: THREE.Object3D | null = null;
  if (opts.mode === 'coin') {
    camera.position.set(0, 0.6, 4.4); camera.lookAt(0, 0, 0);
    single = coins.make(); single.rotation.x = Math.PI / 2 - 0.25; root.add(single);
  }

  /* ---- stack: coins whose count follows the value */
  const maxCoins = opts.maxCoins ?? 10;
  const H = 0.19; // spacing between coins
  type StackCoin = { obj: THREE.Object3D; from: number; to: number; start: number; dur: number; leaving: boolean; jitter: number };
  const stack: StackCoin[] = [];
  if (opts.mode === 'stack') {
    camera.position.set(0, 2.0, 5.4);
    camera.lookAt(0, (maxCoins * H) / 2 - 0.9, 0);
  }
  const syncStack = (instant = false) => {
    const want = Math.round(target * maxCoins);
    const alive = stack.filter(s => !s.leaving);
    const now = elapsed();
    for (let i = alive.length; i < want; i++) {
      const obj = coins.make();
      const y = i * H - 0.6;
      const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      obj.position.set(jitter * 0.06, instant || reduced ? y : y + 3.2, Math.cos(i * 3.1) * 0.05);
      obj.rotation.y = i * 0.7;
      root.add(obj);
      stack.push({ obj, from: y + 3.2, to: y, start: now + (i - alive.length) * 0.09, dur: 0.75, leaving: false, jitter });
    }
    for (let i = alive.length - 1; i >= want; i--) {
      const s = alive[i];
      s.leaving = true; s.from = s.obj.position.y; s.to = s.obj.position.y + 2.6; s.start = now + (alive.length - 1 - i) * 0.06; s.dur = 0.5;
    }
  };
  if (opts.mode === 'stack') syncStack(false);

  let hopAt = -10;
  let frameNo = 0;

  /* ---- sizing */
  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the hero composition in frame on narrow screens
    // Fit the composition's width (about 9.5 units) whatever the shape of the box
    if (opts.mode === 'hero') camera.position.z = Math.max(7.5, 9.5 / (2 * Math.tan((camera.fov * Math.PI) / 360) * (w / h)) + 1.5);
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize); ro.observe(container);

  /* ---- input */
  const onMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!running && !lowPower && !reduced) start();
  };
  const onLeave = () => { pointer.tx = 0; pointer.ty = 0; };
  const moveTarget: HTMLElement | Window = opts.mode === 'hero' ? window : container;
  moveTarget.addEventListener('pointermove', onMove as EventListener, { passive: true });
  container.addEventListener('pointerleave', onLeave);

  /* ---- frame */
  const frame = () => {
    const t = elapsed();
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    root.rotation.y = pointer.x * (opts.mode === 'hero' ? 0.25 : 0.4);
    root.rotation.x = pointer.y * (opts.mode === 'hero' ? 0.15 : 0.12);

    if (note && noteBase) {
      const pos = note.geometry.attributes.position as THREE.BufferAttribute;
      const a = pos.array as Float32Array;
      for (let i = 0; i < a.length; i += 3) {
        const x = noteBase[i], y = noteBase[i + 1];
        a[i + 2] = Math.sin(x * 1.3 + t * 1.1) * 0.16 + Math.sin(y * 2.2 + t * 0.8) * 0.05 + Math.cos(x * 0.6 - t * 0.5) * 0.06;
      }
      pos.needsUpdate = true;
      if ((frameNo++ & 1) === 0) note.geometry.computeVertexNormals();
      note.position.y = Math.sin(t * 0.6) * 0.08;
      for (const f of floaters) {
        f.obj.position.y = f.base.y + Math.sin(t * f.speed + f.phase) * 0.22;
        f.obj.position.x = f.base.x + Math.cos(t * f.speed * 0.6 + f.phase) * 0.1;
        f.obj.rotation.x += f.spin.x * 0.016; f.obj.rotation.y += f.spin.y * 0.016;
      }
    }
    if (single) { single.rotation.z = t * 0.9; single.position.y = Math.sin(t * 1.2) * 0.08; }

    if (opts.mode === 'stack') {
      for (let i = stack.length - 1; i >= 0; i--) {
        const s = stack[i];
        const p = Math.max(0, Math.min(1, (t - s.start) / s.dur));
        const k = s.leaving ? ease(p) : bounce(p);
        const local = t - hopAt - i * 0.035;
        const lift = !s.leaving && local > 0 && local < 0.5 ? Math.sin((local / 0.5) * Math.PI) * 0.4 : 0;
        s.obj.position.y = s.from + (s.to - s.from) * k + lift;
        if (s.leaving) s.obj.rotation.y += 0.08;
        if (s.leaving && p >= 1) { root.remove(s.obj); stack.splice(i, 1); }
      }
    }
    renderer.render(scene, camera);
  };

  // Only the hero and single coin move constantly; the stack sleeps once settled.
  const continuous = opts.mode !== 'stack';
  const busyUntil = { t: 0 };
  const wake = (seconds = 1.2) => { busyUntil.t = Math.max(busyUntil.t, elapsed() + seconds); start(); };
  let lastDraw = 0, slowFrames = 0;
  const minGap = continuous ? 1000 / 30 : 0; // constant motion is capped at 30fps
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (now - lastDraw < minGap) return;
    const cost = performance.now();
    frame();
    const spent = performance.now() - cost;
    lastDraw = now;
    // Frame budget: if drawing keeps taking too long, fall back to a still picture
    slowFrames = spent > 28 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 12) { lowPower = true; stop(); settle(); return; }
    const pointerMoving = Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.002;
    if (!continuous && !pointerMoving && elapsed() > busyUntil.t) stop();
  };
  const start = () => { if (running || reduced || lowPower || !visible || document.hidden) return; running = true; lastDraw = 0; raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const settle = () => {
    // One finished frame: everything in its final place
    for (const s of stack) s.start = -100;
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].leaving) { root.remove(stack[i].obj); stack.splice(i, 1); }
    frame();
  };

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0.01 });
  io.observe(container);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  resize();
  if (reduced || lowPower) settle(); else { wake(2.5); start(); }

  return {
    setValue(v) {
      target = Math.max(0, Math.min(1, v));
      if (opts.mode === 'stack') { syncStack(false); if (reduced || lowPower) settle(); else wake(2.5); }
    },
    hop() { hopAt = elapsed(); if (single) single.rotation.z += Math.PI; if (reduced || lowPower) frame(); else wake(1.2); },
    setReduced(r) { reduced = r; if (r) { stop(); settle(); } else start(); },
    dispose() {
      stop(); io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      moveTarget.removeEventListener('pointermove', onMove as EventListener);
      container.removeEventListener('pointerleave', onLeave);
      scene.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && m.geometry && !disposables.includes(m.geometry)) m.geometry.dispose?.(); });
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
