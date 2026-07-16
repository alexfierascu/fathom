import { useEffect, useMemo, useRef } from 'react';

import { Outlet, ScrollRestoration, useLocation } from 'react-router';

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
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // Move focus to the content landmark on navigation so keyboard and
  // screen-reader users land on the new page, not mid-old-page.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  // Primary-nav hash targets (e.g. /#explore-seas) scroll into view.
  useEffect(() => {
    if (!location.hash) return;
    document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <div className="wrap">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AtlasHeader straitCount={straitCount}>
        <ThemeSwitcher theme={theme} onChange={setTheme} />
      </AtlasHeader>
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet context={context} />
      </main>
      <AtlasFooter straitCount={straitCount} />
      <ScrollRestoration />
    </div>
  );
}
