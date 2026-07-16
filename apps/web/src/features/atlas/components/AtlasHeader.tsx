import type { ReactNode } from 'react';

import { Link, useNavigate } from 'react-router';

import { useT } from '../../i18n/locale';
import { randomStrait } from '../lib/discovery';

interface AtlasHeaderProps {
  straitCount: number;
  /** Header-controls slot; the app places the theme switcher here. */
  children?: ReactNode;
}

export function AtlasHeader({ straitCount, children }: AtlasHeaderProps) {
  const navigate = useNavigate();
  const t = useT();
  return (
    <header className="topbar">
      <div>
        <h1 className="wordmark">
          <Link to="/">
            FATHOM<span>.</span>
          </Link>
        </h1>
        <p className="tagline">{t('tagline')}</p>
        <nav className="site-nav" aria-label="Primary">
          <Link to="/">{t('nav.straits')}</Link>
          <Link to="/#explore-regions">{t('nav.regions')}</Link>
          <Link to="/#explore-seas">{t('nav.seas')}</Link>
          <Link to="/#explore-countries">{t('nav.countries')}</Link>
          <Link to="/tours">{t('nav.tours')}</Link>
          <Link to="/timeline">{t('nav.timeline')}</Link>
          <Link to="/quiz">{t('nav.quiz')}</Link>
          <button
            type="button"
            className="nav-random"
            onClick={() => {
              const strait = randomStrait();
              if (strait) void navigate(`/straits/${strait.id}`);
            }}
          >
            {t('nav.random')} ⚄
          </button>
        </nav>
      </div>
      <div className="header-controls">
        <div className="stat-badge">{t('header.charted', { count: straitCount })}</div>
        {children}
      </div>
    </header>
  );
}
