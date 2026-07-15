import type { Strait } from '@fathom/data';

import { StraitCard } from './StraitCard';

interface ResultsGridProps {
  straits: readonly Strait[];
  totalCount: number;
  query: string;
  onHover: (id: string | null) => void;
}

export function ResultsGrid({ straits, totalCount, query, onHover }: ResultsGridProps) {
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
          straits.map((strait) => <StraitCard key={strait.id} strait={strait} onHover={onHover} />)
        )}
      </div>
    </section>
  );
}
