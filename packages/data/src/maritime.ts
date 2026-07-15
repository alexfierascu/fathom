import { z } from 'zod';

import {
  BridgeSchema,
  CanalSchema,
  IslandSchema,
  MaritimeRouteSchema,
  PortSchema,
  TunnelSchema,
  type Bridge,
  type Canal,
  type Island,
  type MaritimeRoute,
  type Port,
  type Tunnel,
} from './schema';

import rawBridges from './maritime/bridges.json';
import rawCanals from './maritime/canals.json';
import rawIslands from './maritime/islands.json';
import rawPorts from './maritime/ports.json';
import rawRoutes from './maritime/routes.json';
import rawTunnels from './maritime/tunnels.json';

/**
 * Maritime entity collections, validated on first load (memoized). These
 * are seed-sized today; the loaders don't care how large they grow.
 */
function collectionLoader<T>(schema: z.ZodType<T>, raw: unknown): () => readonly T[] {
  let cache: readonly T[] | null = null;
  return () => {
    cache ??= z.array(schema).parse(raw);
    return cache;
  };
}

export const loadPorts: () => readonly Port[] = collectionLoader(PortSchema, rawPorts);
export const loadCanals: () => readonly Canal[] = collectionLoader(CanalSchema, rawCanals);
export const loadBridges: () => readonly Bridge[] = collectionLoader(BridgeSchema, rawBridges);
export const loadTunnels: () => readonly Tunnel[] = collectionLoader(TunnelSchema, rawTunnels);
export const loadIslands: () => readonly Island[] = collectionLoader(IslandSchema, rawIslands);
export const loadMaritimeRoutes: () => readonly MaritimeRoute[] = collectionLoader(
  MaritimeRouteSchema,
  rawRoutes,
);
