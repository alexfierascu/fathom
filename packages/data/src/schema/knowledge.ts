import { z } from 'zod';

import { DateValueSchema, EntityRefSchema, TokenSchema } from './common';

/**
 * Knowledge-layer entities from docs/DATA_MODEL.md: they annotate the
 * geographic core and never alter its structure. Collections are empty
 * until real, sourced data arrives — these schemas are the contract.
 */

export const SourceSchema = z.strictObject({
  id: TokenSchema,
  type: z.enum([
    'book',
    'journal-article',
    'official-publication',
    'chart',
    'dataset',
    'website',
    'institution',
  ]),
  title: z.string().min(1),
  /** Author or publisher, as cited. */
  publisher: z.string().min(1),
  /** URL, ISBN, DOI, chart number, or archive reference. */
  locator: z.string().min(1),
  /** Last-accessed date; editorially required for online sources. */
  accessedOn: z.string().min(1).optional(),
  publishedOn: z.string().min(1).optional(),
  edition: z.string().min(1).optional(),
  language: z.string().min(2).optional(),
  /** Terms governing reuse of the source's content. */
  license: z.string().min(1).optional(),
  archiveUrl: z.string().min(1).optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const ImageSchema = z.strictObject({
  id: TokenSchema,
  /** Reference into the media store; never a path that encodes a slug. */
  file: z.string().min(1),
  license: z.string().min(1),
  credit: z.string().min(1),
  /** Accessibility text; required for every image. */
  alt: z.string().min(1),
  depicts: z.array(EntityRefSchema).min(1),
  caption: z.string().min(1).optional(),
  capturedOn: z.string().min(1).optional(),
  role: z.enum(['representative', 'gallery', 'historical']).optional(),
  focalPoint: z
    .strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
    .optional(),
  /** Provenance: the Source the image was obtained from. */
  sourceId: TokenSchema.optional(),
});
export type Image = z.infer<typeof ImageSchema>;

export const HistoricalEventSchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  date: DateValueSchema,
  summary: z.string().min(1),
  involves: z.array(EntityRefSchema).min(1),
  category: z
    .enum(['battle', 'treaty', 'disaster', 'expedition', 'construction', 'discovery', 'other'])
    .optional(),
  participants: z.string().min(1).optional(),
  outcome: z.string().min(1).optional(),
  relatedEventIds: z.array(TokenSchema).optional(),
  sourceIds: z.array(TokenSchema).min(1),
});
export type HistoricalEvent = z.infer<typeof HistoricalEventSchema>;

export const WildlifeSchema = z.strictObject({
  id: TokenSchema,
  commonName: z.string().min(1),
  scientificName: z.string().min(1),
  summary: z.string().min(1),
  habitats: z.array(EntityRefSchema).min(1),
  category: z
    .enum(['mammal', 'fish', 'bird', 'reptile', 'invertebrate', 'plant', 'community'])
    .optional(),
  /** Conservation status with its assessment context, descriptively. */
  conservationStatus: z.string().min(1).optional(),
  seasonality: z.string().min(1).optional(),
  sourceIds: z.array(TokenSchema).min(1),
});
export type Wildlife = z.infer<typeof WildlifeSchema>;

/** One measured or estimated value about one entity at one time. */
export const StatisticSchema = z.strictObject({
  subject: EntityRefSchema,
  /** From the controlled metric vocabulary (its own doc, once metrics exist). */
  metric: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  /** The time point or period the value describes. */
  period: z.string().min(1),
  method: z.enum(['measured', 'estimated', 'modeled']).optional(),
  uncertainty: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  sourceIds: z.array(TokenSchema).min(1),
});
export type Statistic = z.infer<typeof StatisticSchema>;

/** Curated vocabulary: every tag carries a definition. */
export const TagSchema = z.strictObject({
  id: TokenSchema,
  label: z.string().min(1),
  definition: z.string().min(1),
  relatedTagIds: z.array(TokenSchema).optional(),
});
export type Tag = z.infer<typeof TagSchema>;
