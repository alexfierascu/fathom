import { useEffect, useRef, useState } from 'react';

import { useLocation } from 'react-router';

import { GlobalSearch } from './GlobalSearch';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/** The panel mounts fresh on every open, so the query always starts empty. */
function SearchPanel() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    // The input lives inside GlobalSearch; focus it once the layer paints.
    const focus = window.setTimeout(() => {
      document.getElementById('search')?.focus();
    }, 30);
    return () => {
      window.clearTimeout(focus);
    };
  }, []);

  return (
    <div className="search-overlay-panel">
      <GlobalSearch query={query} onQueryChange={setQuery} />
      <div className="search-overlay-hint">
        <kbd>esc</kbd> to close · <kbd>↑↓</kbd> to move · <kbd>enter</kbd> to open
      </div>
    </div>
  );
}

/**
 * Search as a summonable layer: available on every page behind the header
 * icon, `/`, or ⌘K — and absent until asked for. Closes on Escape, on
 * backdrop click, and whenever navigation happens.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const location = useLocation();
  const lastPath = useRef(location.pathname);

  // Selecting a result navigates; any navigation dismisses the overlay.
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search the atlas"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <SearchPanel />
    </div>
  );
}
