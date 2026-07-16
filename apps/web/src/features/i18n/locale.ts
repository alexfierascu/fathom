import { createContext, useContext } from 'react';

import {
  DEFAULT_LOCALE,
  LOCALES,
  STRINGS,
  formatString,
  type Locale,
  type StringKey,
} from './strings';

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
});

const STORAGE_KEY = 'fathom-locale';

export function loadStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  } catch {
    // Storage unavailable (private mode); fall through to the default.
  }
  return DEFAULT_LOCALE;
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Non-fatal: the choice simply won't survive a reload.
  }
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** The chrome-string translator for the active locale. */
export function useT(): (key: StringKey, values?: Record<string, string | number>) => string {
  const { locale } = useLocale();
  return (key, values) => formatString(STRINGS[locale][key], values);
}
