import type { EntityNode } from '@fathom/data';

import { Section } from './Section';

/** The References section: every source an entity cites, always attributed. */
export function SourcesList({ sources }: { sources: readonly EntityNode<'source'>[] }) {
  if (sources.length === 0) return null;
  return (
    <Section label="References">
      <ul className="sources">
        {sources.map((source) => (
          <li key={source.id}>
            {source.data.title} — {source.data.publisher}
            {source.data.publishedOn ? ` (${source.data.publishedOn})` : ''}
            {source.data.locator.startsWith('http') ? (
              <>
                {' · '}
                <a href={source.data.locator} rel="noreferrer noopener" target="_blank">
                  source
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
