import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Outlet, ScrollRestoration, useLocation } from 'react-router';

import { loadAllStraits } from '@fathom/data';

import { AtlasFooter } from '../features/atlas/components/AtlasFooter';
import { AtlasHeader } from '../features/atlas/components/AtlasHeader';
import { LocaleSwitcher } from '../features/i18n/LocaleSwitcher';
import { useT } from '../features/i18n/locale';
import { SearchOverlay } from '../features/search/SearchOverlay';
import { ThemeSwitcher } from '../features/theme/ThemeSwitcher';
import { THEMES, type TileStyle } from '../features/theme/themes';
import { useTheme } from '../features/theme/useTheme';

export interface LayoutContext {
  tileStyle: TileStyle;
}

const straitCount = loadAllStraits().length;

export function RootLayout() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  // Search is summonable anywhere: `/` or Cmd/Ctrl-K.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen((current) => !current);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);
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
        {t('skip.content')}
      </a>
      <AtlasHeader
        onSearchOpen={() => {
          setSearchOpen(true);
        }}
      >
        <LocaleSwitcher />
        <ThemeSwitcher theme={theme} onChange={setTheme} />
      </AtlasHeader>
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet context={context} />
      </main>
      <AtlasFooter straitCount={straitCount} />
      <ScrollRestoration />
    </div>
  );
}
