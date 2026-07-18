/**
 * Local-first accessibility preferences — companions to the OS settings.
 * Each toggles a root attribute the stylesheet responds to, and all are
 * applied before first paint so there is no flash of the un-adjusted
 * page. Reduce motion also mirrors the `prefers-reduced-motion` query.
 */

interface Spec {
  key: string;
  attr: string;
}

const PREFS = {
  reduceMotion: { key: 'fathom-reduce-motion', attr: 'data-reduce-motion' },
  highContrast: { key: 'fathom-high-contrast', attr: 'data-contrast' },
  largerText: { key: 'fathom-larger-text', attr: 'data-text-scale' },
  focusRings: { key: 'fathom-focus-rings', attr: 'data-focus-rings' },
} satisfies Record<string, Spec>;

export type A11yPref = keyof typeof PREFS;
export const A11Y_PREFS = Object.keys(PREFS) as A11yPref[];

export function loadA11y(pref: A11yPref): boolean {
  try {
    return window.localStorage.getItem(PREFS[pref].key) === 'on';
  } catch {
    return false;
  }
}

export function saveA11y(pref: A11yPref, on: boolean): void {
  try {
    window.localStorage.setItem(PREFS[pref].key, on ? 'on' : 'off');
  } catch {
    // Storage unavailable — the choice simply won't survive a reload.
  }
}

export function applyA11y(pref: A11yPref, on: boolean): void {
  const root = document.documentElement;
  if (on) root.setAttribute(PREFS[pref].attr, 'on');
  else root.removeAttribute(PREFS[pref].attr);
}

/** Re-apply every saved preference — call once, before first paint. */
export function applyAllA11y(): void {
  for (const pref of A11Y_PREFS) applyA11y(pref, loadA11y(pref));
}
