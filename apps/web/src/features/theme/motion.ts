/**
 * The "reduce motion" accessibility preference — a manual companion to
 * the `prefers-reduced-motion` media query. When on, a root attribute
 * lets the stylesheet still every animation and transition. Local-first,
 * like appearance and language.
 */

const KEY = 'fathom-reduce-motion';

export function loadReduceMotion(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveReduceMotion(on: boolean): void {
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Storage unavailable — the choice simply won't survive a reload.
  }
}

export function applyReduceMotion(on: boolean): void {
  const root = document.documentElement;
  if (on) root.setAttribute('data-reduce-motion', 'on');
  else root.removeAttribute('data-reduce-motion');
}
