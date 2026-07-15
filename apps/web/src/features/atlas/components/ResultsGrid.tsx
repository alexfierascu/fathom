import type { Strait } from '@fathom/data';

import { StraitCard } from './StraitCard';

interface ResultsGridProps {
  straits: readonly Strait[];
  totalCount: number;
  query: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function ResultsGrid({ straits, totalCount, query, onSelect, onHover }: ResultsGridProps) {
  return (
    <section>
      <h2 id="resultsHeading" className="sr-only" aria-live="polite">
        SHOWING <b>{straits.length}</b> OF {totalCount}
      </h2>
      <div className="grid" id="grid">
        {straits.length === 0 ? (
          <div className="empty">
            No strait found for “<b>{query}</b>”. Try a country like “Indonesia” or a name like
            “Malacca.”
          </div>
        ) : (
          straits.map((strait) => (
            <StraitCard key={strait.id} strait={strait} onSelect={onSelect} onHover={onHover} />
          ))
        )}
      </div>
    </section>
  );
}
