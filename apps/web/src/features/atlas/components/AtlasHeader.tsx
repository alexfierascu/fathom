import type { ReactNode } from 'react';

interface AtlasHeaderProps {
  straitCount: number;
  /** Header-controls slot; the app places the theme switcher here. */
  children?: ReactNode;
}

export function AtlasHeader({ straitCount, children }: AtlasHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <h1 className="wordmark">
          FATHOM<span>.</span>
        </h1>
        <p className="tagline">
          A chart of the world's straits — the narrow waters where oceans meet and history turns.
        </p>
      </div>
      <div className="header-controls">
        <div className="stat-badge">{straitCount} straits charted</div>
        {children}
      </div>
    </header>
  );
}
