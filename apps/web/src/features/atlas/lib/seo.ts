import type { Country, Strait, WaterBody } from '@fathom/data';

export interface StraitSeo {
  title: string;
  description: string;
  /** Site-relative canonical path; the origin is resolved at render time. */
  path: string;
}

/** Page metadata composed purely from existing strait data. */
export function buildStraitSeo(strait: Strait): StraitSeo {
  return {
    title: `${strait.name} — Fathom`,
    description: `${strait.name}: ${strait.connects}. ${strait.note}`,
    path: `/straits/${strait.id}`,
  };
}

/** Page metadata composed purely from existing country data. */
export function buildCountrySeo(country: Country): StraitSeo {
  return {
    title: `${country.name} — Fathom`,
    description: `${country.name}: ${country.summary}`,
    path: `/countries/${country.id}`,
  };
}

/** Page metadata composed purely from existing water body data. */
export function buildWaterBodySeo(waterBody: WaterBody): StraitSeo {
  return {
    title: `${waterBody.name} — Fathom`,
    description: `${waterBody.name}: ${waterBody.summary}`,
    path: `/water-bodies/${waterBody.id}`,
  };
}

/** schema.org Place (with geo coordinates when known). */
export function placeJsonLd(options: {
  name: string;
  description: string;
  path: string;
  lat?: number;
  lon?: number;
}): object {
  const url = new URL(options.path, window.location.origin).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: options.name,
    description: options.description,
    url,
    ...(options.lat !== undefined && options.lon !== undefined
      ? { geo: { '@type': 'GeoCoordinates', latitude: options.lat, longitude: options.lon } }
      : {}),
  };
}

/** schema.org BreadcrumbList; items without a path are plain positions. */
export function breadcrumbsJsonLd(items: readonly { name: string; path?: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, position) => ({
      '@type': 'ListItem',
      position: position + 1,
      name: item.name,
      ...(item.path ? { item: new URL(item.path, window.location.origin).href } : {}),
    })),
  };
}
