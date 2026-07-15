import { z } from 'zod';

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

/** Full strait document, one JSON file per strait in src/straits/. */
export const StraitSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  countries: z.array(z.string().min(1)).min(1),
  region: StraitRegionSchema,
  connects: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  note: z.string().min(1),
});
export type Strait = z.infer<typeof StraitSchema>;

/** Lightweight per-strait entry in src/straits/index.json. */
export const StraitIndexEntrySchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  region: StraitRegionSchema,
  countries: z.array(z.string().min(1)).min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});
export type StraitIndexEntry = z.infer<typeof StraitIndexEntrySchema>;

export const StraitsIndexSchema = z.array(StraitIndexEntrySchema).min(1);
export type StraitsIndex = z.infer<typeof StraitsIndexSchema>;
