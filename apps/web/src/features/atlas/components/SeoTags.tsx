interface SeoTagsProps {
  title: string;
  description: string;
  /** Site-relative path; the canonical origin is resolved at render time. */
  path: string;
  ogType?: 'website' | 'article';
  /** JSON-LD structured data object(s). */
  jsonLd?: object | readonly object[];
}

/**
 * The full metadata set for a page: title, description, canonical URL,
 * Open Graph, Twitter card, and JSON-LD. React 19 hoists the head tags.
 */
export function SeoTags({ title, description, path, ogType = 'article', jsonLd }: SeoTagsProps) {
  const canonical = new URL(path, window.location.origin).href;
  const jsonLdBlocks = jsonLd === undefined ? [] : Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="Fathom" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {jsonLdBlocks.map((block, position) => (
        <script key={position} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </>
  );
}
