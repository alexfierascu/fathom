/**
 * Route-chunk importers, shared by the router (for lazy routes) and by
 * hover prefetching. Dynamic imports are cached by the browser, so calling
 * a prefetcher twice is free.
 */
export const pageChunks = {
  strait: () => import('../features/atlas/pages/StraitDetailPage'),
  waterBody: () => import('../features/atlas/pages/WaterBodyDetailPage'),
  country: () => import('../features/atlas/pages/CountryDetailPage'),
  region: () => import('../features/atlas/pages/RegionDetailPage'),
  structures: () => import('../features/atlas/pages/StructurePages'),
};

const CHUNK_BY_TYPE: Record<string, keyof typeof pageChunks> = {
  strait: 'strait',
  'water-body': 'waterBody',
  country: 'country',
  region: 'region',
  port: 'structures',
  canal: 'structures',
  bridge: 'structures',
  tunnel: 'structures',
  island: 'structures',
  'maritime-route': 'structures',
};

/** Warms the route chunk for an entity type (e.g. on link hover). */
export function prefetchEntityPage(type: string): void {
  const chunk = CHUNK_BY_TYPE[type];
  if (chunk) void pageChunks[chunk]();
}
