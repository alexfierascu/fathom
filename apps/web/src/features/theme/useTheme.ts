import { useEffect, useState } from 'react';

import { DEFAULT_THEME, type ThemeKey } from './themes';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
