import { useRef } from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
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
          placeholder="Search a strait or a country…"
          autoComplete="off"
          aria-label="Search straits by name or country"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onQueryChange('');
            }
          }}
        />
        <button
          id="clearBtn"
          aria-label="Clear search"
          style={{ display: query ? 'block' : 'none' }}
          onClick={() => {
            onQueryChange('');
            inputRef.current?.focus();
          }}
        >
          ✕
        </button>
      </div>
      <p className="hint">
        Try <b>Hormuz</b>, <b>Indonesia</b>, or <b>Turkey</b>. Click any result to open its page.
      </p>
    </>
  );
}
