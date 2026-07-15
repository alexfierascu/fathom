import { useMemo } from 'react';

import { Outlet, ScrollRestoration } from 'react-router';

import { loadAllStraits } from '@fathom/data';

import { AtlasFooter } from '../features/atlas/components/AtlasFooter';
import { AtlasHeader } from '../features/atlas/components/AtlasHeader';
import { ThemeSwitcher } from '../features/theme/ThemeSwitcher';
import { THEMES, type TileStyle } from '../features/theme/themes';
import { useTheme } from '../features/theme/useTheme';

export interface LayoutContext {
  tileStyle: TileStyle;
}

const straitCount = loadAllStraits().length;

export function RootLayout() {
  const { theme, setTheme } = useTheme();
  const context = useMemo<LayoutContext>(() => ({ tileStyle: THEMES[theme].tile }), [theme]);

  return (
    <div className="wrap">
      <AtlasHeader straitCount={straitCount}>
        <ThemeSwitcher theme={theme} onChange={setTheme} />
      </AtlasHeader>
      <Outlet context={context} />
      <AtlasFooter straitCount={straitCount} />
      <ScrollRestoration />
    </div>
  );
}
