import { useEffect, useRef, useState } from 'react';

import { useLocation, useNavigate } from 'react-router';

import { foldForSearch } from '@fathom/search';
import { loadJourneys, randomEntity } from '@fathom/discovery';

import { entityPath } from '../atlas/lib/entityPaths';
import { getUnits, setUnits } from '../atlas/lib/units';
import { GlobalSearch } from './GlobalSearch';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onCycleTheme?: () => void;
}

/** The panel mounts fresh on every open, so the query always starts empty. */
function SearchPanel({
  onClose,
  onCycleTheme,
}: {
  onClose: () => void;
  onCycleTheme?: () => void;
}) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const actions: { label: string; run: () => void }[] = [
    {
      label: 'Random strait ⚄',
      run: () => {
        const pick = randomEntity({ types: ['strait'] });
        const path = pick ? entityPath(pick) : null;
        if (path) void navigate(path);
      },
    },
    { label: 'Open the map', run: () => void navigate('/map') },
    { label: 'Set adrift', run: () => void navigate('/map?drift=1') },
    { label: 'Daily Expedition', run: () => void navigate('/daily') },
    { label: 'Voyage Passport', run: () => void navigate('/passport') },
    { label: 'Six Degrees of Sea', run: () => void navigate('/six-degrees') },
    ...loadJourneys().map((journey) => ({
      label: `Start: ${journey.title}`,
      run: () => void navigate(`/journeys/${journey.id}`),
    })),
    ...(onCycleTheme ? [{ label: 'Switch theme', run: onCycleTheme }] : []),
    {
      label: getUnits() === 'km' ? 'Use nautical miles' : 'Use kilometres',
      run: () => {
        setUnits(getUnits() === 'km' ? 'nm' : 'km');
      },
    },
  ];
  const folded = foldForSearch(query.trim());
  const shownActions =
    query.trim() === ''
      ? actions.slice(0, 6)
      : actions.filter((action) => foldForSearch(action.label).includes(folded)).slice(0, 6);

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
      {shownActions.length > 0 && (
        <div className="palette-actions">
          {shownActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="palette-action"
              onClick={() => {
                action.run();
                onClose();
              }}
            >
              <span aria-hidden="true">›</span> {action.label}
            </button>
          ))}
        </div>
      )}
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
export function SearchOverlay({ open, onClose, onCycleTheme }: SearchOverlayProps) {
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
      <SearchPanel onClose={onClose} onCycleTheme={onCycleTheme} />
    </div>
  );
}
