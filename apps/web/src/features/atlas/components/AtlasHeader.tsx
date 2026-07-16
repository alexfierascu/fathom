import type { ReactNode } from 'react';

import { Link, useNavigate } from 'react-router';

import { randomStrait } from '../lib/discovery';

interface AtlasHeaderProps {
  straitCount: number;
  /** Header-controls slot; the app places the theme switcher here. */
  children?: ReactNode;
}

export function AtlasHeader({ straitCount, children }: AtlasHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <div>
        <h1 className="wordmark">
          <Link to="/">
            FATHOM<span>.</span>
          </Link>
        </h1>
        <p className="tagline">
          The definitive interactive atlas of the world's straits — the narrow waters where oceans
          meet and history turns.
        </p>
        <nav className="site-nav" aria-label="Primary">
          <Link to="/">Straits</Link>
          <Link to="/#explore-regions">Regions</Link>
          <Link to="/#explore-seas">Seas</Link>
          <Link to="/#explore-countries">Countries</Link>
          <Link to="/tours">Tours</Link>
          <Link to="/timeline">Timeline</Link>
          <Link to="/quiz">Quiz</Link>
          <button
            type="button"
            className="nav-random"
            onClick={() => {
              const strait = randomStrait();
              if (strait) void navigate(`/straits/${strait.id}`);
            }}
          >
            Random ⚄
          </button>
        </nav>
      </div>
      <div className="header-controls">
        <div className="stat-badge">{straitCount} straits charted</div>
        {children}
      </div>
    </header>
  );
}
