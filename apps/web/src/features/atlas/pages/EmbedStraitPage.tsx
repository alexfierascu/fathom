import { useParams } from 'react-router';

import { StraitMap } from '../components/StraitMap';
import { findStraitBySlug } from '../lib/navigation';

/**
 * Compact, chrome-free strait card for third-party iframes. Renders
 * outside RootLayout — no header, nav, or footer — and links back to the
 * full article. Kept out of search indexes to avoid duplicate content.
 */
export function EmbedStraitPage() {
  const { slug } = useParams();
  const strait = findStraitBySlug(slug);

  if (!strait) {
    return <div className="empty">No strait charted at this address.</div>;
  }

  return (
    <div className="embed">
      <title>{`${strait.name} — Fathom`}</title>
      <meta name="robots" content="noindex" />
      <header className="embed-header">
        <div>
          <div className="eyebrow">{strait.region}</div>
          <h1 className="embed-title">{strait.name}</h1>
          <div className="connects">{strait.connects}</div>
        </div>
        <a className="embed-brand" href={`/straits/${strait.id}`} target="_blank" rel="noreferrer">
          View on FATHOM<span>.</span> →
        </a>
      </header>
      <StraitMap strait={strait} tileStyle="dark" />
      <p className="embed-note">{strait.note}</p>
    </div>
  );
}
