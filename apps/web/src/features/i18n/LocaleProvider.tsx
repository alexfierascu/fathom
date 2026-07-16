import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { LocaleContext, loadStoredLocale, storeLocale } from './locale';
import type { Locale } from './strings';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(loadStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    storeLocale(locale);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <LocaleContext value={value}>{children}</LocaleContext>;
}
