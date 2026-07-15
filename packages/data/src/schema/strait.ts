import { z } from 'zod';

import {
  EditorialStatusSchema,
  EntityRefSchema,
  MeasurementSchema,
  NameSchema,
  SlugSchema,
  TokenSchema,
} from './common';

/** Region order drives the UI's filter chips; do not reorder. */
export const STRAIT_REGIONS = [
  'Europe',
  'Middle East & Africa',
  'South & Southeast Asia',
  'East Asia & Oceania',
  'Americas & Arctic',
] as const;

export const StraitRegionSchema = z.enum(STRAIT_REGIONS);
export type StraitRegion = z.infer<typeof StraitRegionSchema>;

/** Sourced dimensions of a strait (DATA_MODEL.md, Strait → optional). */
export const StraitDimensionsSchema = z.strictObject({
  length: MeasurementSchema.optional(),
  widthMin: MeasurementSchema.optional(),
  widthMax: MeasurementSchema.optional(),
  depthMin: MeasurementSchema.optional(),
});
export type StraitDimensions = z.infer<typeof StraitDimensionsSchema>;

/**
 * Full strait document, one JSON file per strait in src/straits/.
 *
 * The first block is the prototype core every current document carries.
 * The second block is the canonical expansion from docs/DATA_MODEL.md —
 * optional until sourced data arrives, so existing documents stay valid.
 */
export const StraitSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  countries: z.array(z.string().min(1)).min(1),
  region: StraitRegionSchema,
  connects: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  note: z.string().min(1),

  // --- Canonical expansion (all optional; do not populate without sources) ---
  /** URL slug when it diverges from the id; ids never change, slugs may. */
  slug: SlugSchema.optional(),
  names: z.array(NameSchema).optional(),
  summary: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: EditorialStatusSchema.optional(),
  /** Relationships (graph edges): the waters connected, land separated, shores. */
  connectsWaterBodies: z.array(EntityRefSchema).optional(),
  separates: z.array(EntityRefSchema).optional(),
  borderedBy: z.array(EntityRefSchema).optional(),
  dimensions: StraitDimensionsSchema.optional(),
  /** Knowledge-layer attachments, by entity token. */
  tagIds: z.array(TokenSchema).optional(),
  imageIds: z.array(TokenSchema).optional(),
  sourceIds: z.array(TokenSchema).optional(),
  eventIds: z.array(TokenSchema).optional(),
  wildlifeIds: z.array(TokenSchema).optional(),
});
export type Strait = z.infer<typeof StraitSchema>;

/** Lightweight per-strait entry in src/straits/index.json. */
export const StraitIndexEntrySchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  region: StraitRegionSchema,
  countries: z.array(z.string().min(1)).min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});
export type StraitIndexEntry = z.infer<typeof StraitIndexEntrySchema>;

export const StraitsIndexSchema = z.array(StraitIndexEntrySchema).min(1);
export type StraitsIndex = z.infer<typeof StraitsIndexSchema>;
