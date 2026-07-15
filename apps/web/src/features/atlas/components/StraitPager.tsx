import { Link } from 'react-router';

import type { Strait } from '@fathom/data';

interface StraitPagerProps {
  previous: Strait | null;
  next: Strait | null;
}

export function StraitPager({ previous, next }: StraitPagerProps) {
  return (
    <nav className="pager" aria-label="Adjacent straits">
      {previous ? (
        <Link className="pager-link" to={`/straits/${previous.id}`} rel="prev">
          ← {previous.name}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="pager-link" to={`/straits/${next.id}`} rel="next">
          {next.name} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
