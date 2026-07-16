import type { ReactNode } from 'react';

import { NavLink, Link } from 'react-router';

import { useT } from '../../i18n/locale';

interface AtlasHeaderProps {
  onSearchOpen: () => void;
  /** Header-controls slot; the app places locale and theme controls here. */
  children?: ReactNode;
}

/**
 * One quiet line: the wordmark, four destinations, and a search icon.
 * Everything else the atlas can do surfaces contextually on the pages
 * themselves.
 */
export function AtlasHeader({ onSearchOpen, children }: AtlasHeaderProps) {
  const t = useT();
  return (
    <header className="topbar">
      <h1 className="wordmark">
        <Link to="/">
          FATHOM<span>.</span>
        </Link>
      </h1>
      <nav className="site-nav" aria-label="Primary">
        <NavLink to="/explore">{t('nav.explore')}</NavLink>
        <NavLink to="/journeys">{t('nav.journeys')}</NavLink>
        <NavLink to="/map">{t('nav.map')}</NavLink>
        <NavLink to="/learn">{t('nav.learn')}</NavLink>
      </nav>
      <div className="header-controls">
        <button
          type="button"
          className="search-trigger"
          aria-label={t('search.open')}
          title={`${t('search.open')} ( / )`}
          onClick={onSearchOpen}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        {children}
      </div>
    </header>
  );
}
