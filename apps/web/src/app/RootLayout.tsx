import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Outlet, ScrollRestoration, useLocation } from 'react-router';

import { loadAllStraits } from '@fathom/data';

import { AtlasFooter } from '../features/atlas/components/AtlasFooter';
import { AtlasHeader } from '../features/atlas/components/AtlasHeader';
import { LocaleSwitcher } from '../features/i18n/LocaleSwitcher';
import { useT } from '../features/i18n/locale';
import { SearchOverlay } from '../features/search/SearchOverlay';
import { ThemeSwitcher } from '../features/theme/ThemeSwitcher';
import { THEMES, type ThemeKey, type TileStyle } from '../features/theme/themes';
import { useTheme } from '../features/theme/useTheme';

export interface LayoutContext {
  tileStyle: TileStyle;
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  cycleTheme: () => void;
  openSearch: () => void;
}

const straitCount = loadAllStraits().length;
const THEME_ORDER = ['abyss', 'parchment', 'midnight', 'daylight'] as const;

export function RootLayout() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);
  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);
  const cycleTheme = useCallback(() => {
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length] ?? 'abyss');
  }, [theme, setTheme]);

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
  const location = useLocation();
  const isHome = location.pathname === '/';
  const context = useMemo<LayoutContext>(
    () => ({ tileStyle: THEMES[theme].tile, theme, setTheme, cycleTheme, openSearch }),
    [theme, setTheme, cycleTheme, openSearch],
  );
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // The homepage is its own chrome-free launcher: no navbar, no footer,
  // one screen. It supplies its own floating logo, search, and controls.
  useEffect(() => {
    document.documentElement.classList.toggle('route-portal', isHome);
    return () => {
      document.documentElement.classList.remove('route-portal');
    };
  }, [isHome]);

  // Move focus to the content landmark on navigation so keyboard and
  // screen-reader users land on the new page, not mid-old-page.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  // Sections glide up as they enter the viewport. The 'reveal-ready'
  // class arms the effect only when the observer is actually running, so
  // content can never be stranded invisible.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('reveal-ready');

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    const watch = () => {
      const targets = document.querySelectorAll(
        '.detail-section:not(.in-view), .cinematic:not(.in-view), .one-fact:not(.in-view), .mode-cards:not(.in-view)',
      );
      for (const target of targets) io.observe(target);
    };
    watch();
    const mo = new MutationObserver(watch);
    const main = mainRef.current;
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      document.documentElement.classList.remove('reveal-ready');
    };
  }, []);

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
      {!isHome && (
        <AtlasHeader onSearchOpen={openSearch}>
          <LocaleSwitcher />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </AtlasHeader>
      )}
      <SearchOverlay open={searchOpen} onClose={closeSearch} onCycleTheme={cycleTheme} />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet context={context} />
      </main>
      {!isHome && <AtlasFooter straitCount={straitCount} />}
      <ScrollRestoration />
    </div>
  );
}
