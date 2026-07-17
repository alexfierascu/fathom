import type { ThemeKey } from './themes';

/**
 * Appearance is the reader-facing preference — System, Dark, or Light —
 * that the profile panel exposes. It resolves to one of the atlas's
 * concrete themes: Dark → Abyss, Light → Parchment, System → whichever
 * the operating system prefers. Stored so the choice survives reloads.
 */
export type Appearance = 'system' | 'dark' | 'light';

const STORAGE_KEY = 'fathom-appearance';

export function loadAppearance(): Appearance {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'system' || stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Storage unavailable; fall through to the default.
  }
  // Fathom's identity is the dark ocean — dark is the out-of-box default,
  // with System and Light offered in the profile panel.
  return 'dark';
}

export function saveAppearance(mode: Appearance): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Non-fatal: the choice simply won't survive a reload.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function appearanceToTheme(mode: Appearance): ThemeKey {
  if (mode === 'dark') return 'abyss';
  if (mode === 'light') return 'parchment';
  return systemPrefersDark() ? 'abyss' : 'parchment';
}
