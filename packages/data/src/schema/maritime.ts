import { z } from 'zod';

import {
  EditorialStatusSchema,
  EntityRefSchema,
  NameSchema,
  SlugSchema,
  TokenSchema,
} from './common';

/**
 * Maritime entities from docs/DATA_MODEL.md: ports, canals, bridges,
 * tunnels, islands, and maritime routes. Documents are minimal and every
 * one cites a source; numeric dimensions stay absent until they can be
 * individually sourced.
 */

/** Lifecycle of built structures (DATA_MODEL.md status fields). */
export const StructureStatusSchema = z.enum([
  'planned',
  'under-construction',
  'operational',
  'closed',
  'demolished',
  'abandoned',
]);
export type StructureStatus = z.infer<typeof StructureStatusSchema>;

const expansion = {
  /** Representative map coordinates, for plotting journeys and charts. */
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  slug: SlugSchema.optional(),
  names: z.array(NameSchema).optional(),
  description: z.string().min(1).optional(),
  status: EditorialStatusSchema.optional(),
};

export const PortSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  countryId: TokenSchema,
  /** The water the port opens onto: a water body, strait, or canal. */
  opensOnto: EntityRefSchema,
  islandId: TokenSchema.optional(),
  /** UN/LOCODE where assigned. */
  code: z.string().min(1).optional(),
  functions: z
    .array(z.enum(['cargo', 'container', 'ferry', 'cruise', 'fishing', 'naval']))
    .optional(),
  summary: z.string().min(1),
  sourceIds: z.array(TokenSchema).min(1),
  ...expansion,
});
export type Port = z.infer<typeof PortSchema>;

export const CanalSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  connects: z.array(EntityRefSchema).min(2),
  countryIds: z.array(TokenSchema).min(1),
  operationalStatus: StructureStatusSchema,
  /** Opening year. */
  opened: z.string().min(1).optional(),
  summary: z.string().min(1),
  sourceIds: z.array(TokenSchema).min(1),
  ...expansion,
});
export type Canal = z.infer<typeof CanalSchema>;

export const BridgeSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  /** The water feature it crosses. */
  crosses: EntityRefSchema,
  /** The land entities it connects (countries and/or islands). */
  connects: z.array(EntityRefSchema).min(2),
  operationalStatus: StructureStatusSchema,
  opened: z.string().min(1).optional(),
  summary: z.string().min(1),
  sourceIds: z.array(TokenSchema).min(1),
  ...expansion,
});
export type Bridge = z.infer<typeof BridgeSchema>;

export const TunnelSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  /** The water feature it passes under. */
  crosses: EntityRefSchema,
  connects: z.array(EntityRefSchema).min(2),
  mode: z.enum(['rail', 'road', 'mixed', 'utility']).optional(),
  operationalStatus: StructureStatusSchema,
  opened: z.string().min(1).optional(),
  summary: z.string().min(1),
  sourceIds: z.array(TokenSchema).min(1),
  ...expansion,
});
export type Tunnel = z.infer<typeof TunnelSchema>;

export const IslandSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  /** The water body in which it lies. */
  waterBodyId: TokenSchema,
  /** Sovereignty, where undisputed; richer claims come later. */
  countryId: TokenSchema.optional(),
  /** Straits this island forms a shore of. */
  flanksStraitIds: z.array(TokenSchema).optional(),
  summary: z.string().min(1),
  sourceIds: z.array(TokenSchema).min(1),
  ...expansion,
});
export type Island = z.infer<typeof IslandSchema>;

export const MaritimeRouteSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  routeType: z.enum(['trade-lane', 'ferry', 'historical', 'transit-corridor']),
  /** Ordered traversal of ports, straits, canals, and water bodies. */
  waypoints: z.array(EntityRefSchema).min(2),
  activePeriod: z.string().min(1).optional(),
  summary: z.string().min(1),
  sourceIds: z.array(TokenSchema).min(1),
  ...expansion,
});
export type MaritimeRoute = z.infer<typeof MaritimeRouteSchema>;
