interface SeoTagsProps {
  title: string;
  description: string;
  /** Site-relative path; the canonical origin is resolved at render time. */
  path: string;
  ogType?: 'website' | 'article';
  /** Site-relative share image; falls back to the brand card. */
  image?: string;
  /** JSON-LD structured data object(s). */
  jsonLd?: object | readonly object[];
}

/**
 * The full metadata set for a page: title, description, canonical URL,
 * Open Graph, Twitter card, and JSON-LD. React 19 hoists the head tags.
 */
export function SeoTags({
  title,
  description,
  path,
  ogType = 'article',
  image,
  jsonLd,
}: SeoTagsProps) {
  const canonical = new URL(path, window.location.origin).href;
  const ogImage = new URL(image ?? '/og.png', window.location.origin).href;
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
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {jsonLdBlocks.map((block, position) => (
        <script key={position} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </>
  );
}
