import type { EntityType } from '@fathom/data';

/** Route for each entity kind that has pages; null for knowledge records. */
const PATHS: Partial<Record<EntityType, string>> = {
  strait: '/straits',
  'water-body': '/water-bodies',
  country: '/countries',
  region: '/regions',
  port: '/ports',
  canal: '/canals',
  bridge: '/bridges',
  tunnel: '/tunnels',
  island: '/islands',
  'maritime-route': '/routes',
};

export function entityPath(node: { type: EntityType; id: string }): string | null {
  const base = PATHS[node.type];
  return base ? `${base}/${node.id}` : null;
}
