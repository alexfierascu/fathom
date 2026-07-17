import { NavLink, Link } from 'react-router';

import { UserMenuButton } from '../../account/UserMenu';
import { useT } from '../../i18n/locale';
import type { StringKey } from '../../i18n/strings';
import type { ThemeKey } from '../../theme/themes';

/**
 * The one shell every page shares: a glass bar that floats over the
 * hero. Logo to port, the four modes amidships, search and the single
 * user menu to starboard — and nothing else. Language, theme, and
 * profile all live inside the user menu.
 */

interface GlassNavigationProps {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  onSearchOpen: () => void;
}

const MODES: { to: string; labelKey: StringKey }[] = [
  { to: '/explore', labelKey: 'mode.explore' },
  { to: '/journeys', labelKey: 'nav.journeys' },
  { to: '/map', labelKey: 'home.chart.title' },
  { to: '/learn', labelKey: 'home.academy.title' },
];

export function GlassNavigation({ theme, setTheme, onSearchOpen }: GlassNavigationProps) {
  const t = useT();
  return (
    <header className="glass-nav">
      <Link viewTransition className="glass-nav-logo" to="/">
        <span className="glass-nav-mark">FATHOM</span>
        <span className="glass-nav-sub">{t('home.platform')}</span>
      </Link>

      <nav className="glass-nav-modes" aria-label="Modes">
        {MODES.map((mode) => (
          <NavLink
            key={mode.to}
            viewTransition
            to={mode.to}
            className={({ isActive }) => (isActive ? 'glass-mode is-current' : 'glass-mode')}
          >
            {t(mode.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="glass-nav-right">
        <button
          type="button"
          className="launch-icon"
          aria-label={t('search.open')}
          onClick={onSearchOpen}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <UserMenuButton theme={theme} setTheme={setTheme} />
      </div>
    </header>
  );
}
