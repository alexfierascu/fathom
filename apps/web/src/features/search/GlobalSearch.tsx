import { useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router';

import {
  atlasSearchIndex,
  groupResults,
  type MatchRange,
  type SearchResult,
  type SearchableType,
} from '@fathom/search';

const TYPE_LABELS: Record<SearchableType, string> = {
  strait: 'Strait',
  'water-body': 'Water body',
  country: 'Country',
  region: 'Region',
  port: 'Port',
  canal: 'Canal',
  bridge: 'Bridge',
  tunnel: 'Tunnel',
  island: 'Island',
  'maritime-route': 'Route',
};

const GROUP_LABELS: Record<SearchableType, string> = {
  strait: 'Straits',
  'water-body': 'Water bodies',
  country: 'Countries',
  region: 'Regions',
  port: 'Ports',
  canal: 'Canals',
  bridge: 'Bridges',
  tunnel: 'Tunnels',
  island: 'Islands',
  'maritime-route': 'Routes',
};

const TYPE_ICONS: Record<SearchableType, string> = {
  strait: '↔',
  'water-body': '≈',
  country: '⚑',
  region: '◈',
  port: '⚓',
  canal: '⌇',
  bridge: '⌒',
  tunnel: '∩',
  island: '△',
  'maritime-route': '⇢',
};

function Highlighted({ text, ranges }: { text: string; ranges: readonly MatchRange[] }) {
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));
    parts.push(<mark key={range.start}>{text.slice(range.start, range.end)}</mark>);
    cursor = range.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

interface GlobalSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

/**
 * The global search box: filters the homepage grid through `onQueryChange`
 * (as before) and surfaces atlas-wide results in a grouped, keyboard-
 * navigable dropdown. All search logic lives in @fathom/search.
 */
export function GlobalSearch({ query, onQueryChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const groups = useMemo(
    () => (trimmed ? groupResults(atlasSearchIndex().search(trimmed, { limit: 12 })) : []),
    [trimmed],
  );
  // Keyboard order must match the grouped visual order, not score order.
  const flat = useMemo(() => groups.flatMap((group) => group.results), [groups]);

  const showResults = open && trimmed !== '';
  const active = activeIndex >= 0 ? flat[activeIndex] : undefined;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const optionId = (result: SearchResult) => `search-option-${result.document.entityId}`;

  const openResult = (result: SearchResult) => {
    void navigate(result.document.path);
    onQueryChange('');
    setOpen(false);
    setActiveIndex(-1);
  };

  const clear = () => {
    onQueryChange('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-row">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          id="search"
          ref={inputRef}
          type="text"
          placeholder="Search the atlas…"
          autoComplete="off"
          role="combobox"
          aria-label="Search the atlas"
          aria-expanded={showResults}
          aria-controls="search-results"
          aria-activedescendant={active ? optionId(active) : undefined}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (trimmed) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => (flat.length === 0 ? -1 : (index + 1) % flat.length));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) =>
                flat.length === 0 ? -1 : (index - 1 + flat.length) % flat.length,
              );
            } else if (event.key === 'Enter') {
              const target = active ?? flat[0];
              if (showResults && target) {
                event.preventDefault();
                openResult(target);
              }
            } else if (event.key === 'Escape') {
              if (showResults) {
                setOpen(false);
                setActiveIndex(-1);
              } else {
                onQueryChange('');
              }
            }
          }}
        />
        <button
          id="clearBtn"
          aria-label="Clear search"
          style={{ display: query ? 'block' : 'none' }}
          onClick={clear}
        >
          ✕
        </button>
        {showResults && (
          <div className="search-results" id="search-results" role="listbox">
            {flat.length === 0 ? (
              <div className="search-no-results">
                Nothing charted for “<b>{trimmed}</b>”. Try a strait, a sea, or a country.
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.type}>
                  <div className="search-group-label">{GROUP_LABELS[group.type]}</div>
                  {group.results.map((result) => (
                    <button
                      key={result.document.entityId}
                      id={optionId(result)}
                      type="button"
                      role="option"
                      aria-selected={active?.document.entityId === result.document.entityId}
                      className="search-result"
                      onMouseEnter={() => {
                        setActiveIndex(flat.indexOf(result));
                      }}
                      onClick={() => {
                        openResult(result);
                      }}
                    >
                      <span className="search-result-icon" aria-hidden="true">
                        {TYPE_ICONS[result.document.type]}
                      </span>
                      <span>
                        <span className="search-result-name">
                          <Highlighted text={result.document.name} ranges={result.nameMatches} />
                        </span>{' '}
                        <span className="search-result-meta">
                          {TYPE_LABELS[result.document.type]}
                        </span>
                        <span className="search-result-summary">{result.document.summary}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <p className="hint">
        Try <b>Hormuz</b>, <b>Indonesia</b>, or <b>Turkey</b>. Search finds straits, waters,
        countries, and regions.
      </p>
    </div>
  );
}
