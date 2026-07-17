import { useEffect, useState } from 'react';

import { appearanceToTheme, loadAppearance } from './appearance';
import { type ThemeKey } from './themes';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeKey>(() => appearanceToTheme(loadAppearance()));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // When following the system, track OS light/dark changes live.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (loadAppearance() === 'system') setTheme(appearanceToTheme('system'));
    };
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  }, []);

  return { theme, setTheme };
}
