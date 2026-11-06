import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * A soft pointer for mouse users: a dot that follows exactly and a ring that
 * trails behind it. Over a small button the ring wraps the button (like the
 * iPad pointer); over bigger clickable things it swells; over a text field it
 * steps aside for the normal I-beam. Elements with `data-cursor="Label"` show
 * that label in the ring.
 *
 * Never runs on touch screens or with reduced motion.
 */
const CLICKABLE = 'a, button, [role="button"], [role="radio"], [role="switch"], [role="tab"], label[for], select, summary, [data-cursor]';
const TEXT = 'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

export const CustomCursor: React.FC = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
    if (!mq.matches || reduced()) return;
    const root = document.documentElement;
    root.classList.add('mm-cursor');

    const pos = { x: -100, y: -100 };
    // Ring state, eased towards its target every frame
    const cur = { x: -100, y: -100, w: 34, h: 34, r: 17 };
    const tgt = { x: -100, y: -100, w: 34, h: 34, r: 17 };
    let mode: 'idle' | 'hover' | 'wrap' | 'text' | 'label' = 'idle';
    let pressed = false, visible = false, raf = 0;
    let wrapEl: HTMLElement | null = null;

    const setMode = (m: typeof mode, text = '') => {
      if (m === mode && (m !== 'label' || label.current?.textContent === text)) return;
      mode = m;
      ring.current!.dataset.mode = m;
      dot.current!.dataset.mode = m;
      if (label.current) label.current.textContent = text;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pos.x = e.clientX; pos.y = e.clientY;
      if (!visible) { visible = true; root.classList.add('mm-cursor-on'); cur.x = pos.x; cur.y = pos.y; }
      const t = e.target as HTMLElement | null;
      if (!t || t.closest(TEXT)) { wrapEl = null; setMode('text'); return; }
      const hit = t.closest<HTMLElement>(CLICKABLE);
      if (!hit || (hit as HTMLButtonElement).disabled) { wrapEl = null; setMode('idle'); return; }
      const lbl = hit.dataset.cursor;
      if (lbl) { wrapEl = null; setMode('label', lbl); return; }
      const r = hit.getBoundingClientRect();
      if (r.width <= 64 && r.height <= 64) { wrapEl = hit; setMode('wrap'); }
      else { wrapEl = null; setMode('hover'); }
    };
    const onDown = () => { pressed = true; ring.current?.classList.add('is-pressed'); };
    const onUp = () => { pressed = false; ring.current?.classList.remove('is-pressed'); };
    const onLeave = () => { visible = false; root.classList.remove('mm-cursor-on'); };

    const tick = () => {
      if (mode === 'wrap' && wrapEl?.isConnected) {
        const r = wrapEl.getBoundingClientRect();
        const pad = 6;
        // Lean slightly towards the pointer so the wrap feels attached, not frozen
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        tgt.x = cx + (pos.x - cx) * 0.18; tgt.y = cy + (pos.y - cy) * 0.18;
        tgt.w = r.width + pad * 2; tgt.h = r.height + pad * 2;
        tgt.r = Math.min(16, parseFloat(getComputedStyle(wrapEl).borderTopLeftRadius) + pad || 12);
      } else {
        const size = mode === 'hover' ? 54 : mode === 'label' ? 74 : mode === 'text' ? 8 : 34;
        tgt.x = pos.x; tgt.y = pos.y; tgt.w = size; tgt.h = size; tgt.r = size / 2;
      }
      const k = mode === 'wrap' ? 0.28 : 0.2;
      cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k;
      cur.w += (tgt.w - cur.w) * 0.22; cur.h += (tgt.h - cur.h) * 0.22; cur.r += (tgt.r - cur.r) * 0.22;
      const s = pressed ? 0.86 : 1;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${cur.x - cur.w / 2}px, ${cur.y - cur.h / 2}px, 0) scale(${s})`;
        ring.current.style.width = `${cur.w}px`;
        ring.current.style.height = `${cur.h}px`;
        ring.current.style.borderRadius = `${cur.r}px`;
      }
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      root.classList.remove('mm-cursor', 'mm-cursor-on');
    };
  }, []);

  return createPortal(
    <div aria-hidden className="mm-cursor-layer">
      <div ref={ring} className="mm-cursor-ring" data-mode="idle"><span ref={label} /></div>
      <div ref={dot} className="mm-cursor-dot" data-mode="idle" />
    </div>,
    document.body,
  );
};
