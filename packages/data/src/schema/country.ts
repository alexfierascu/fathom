import { z } from 'zod';

import {
  EditorialStatusSchema,
  MeasurementSchema,
  NameSchema,
  SlugSchema,
  TokenSchema,
} from './common';

/**
 * Full country document, one JSON file per country in src/countries/.
 * Countries appear in Fathom for their maritime character (DATA_MODEL.md).
 * Ids must match `slugifyName(name)` so edges derived from strait
 * `countries` values resolve to these documents.
 */
export const CountrySchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  /** ISO 3166-1 alpha-2 code, where one is assigned. */
  code: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  /** Summary focused on the country's maritime character. */
  summary: z.string().min(1),
  sourceIds: z.array(TokenSchema).min(1),
  /** Sourced measurement; absent until real data arrives. */
  coastline: MeasurementSchema.optional(),

  // --- Canonical expansion (optional) ---
  slug: SlugSchema.optional(),
  names: z.array(NameSchema).optional(),
  officialName: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: EditorialStatusSchema.optional(),
});
export type Country = z.infer<typeof CountrySchema>;

/** Lightweight per-country entry in src/countries/index.json. */
export const CountryIndexEntrySchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  code: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
});
export type CountryIndexEntry = z.infer<typeof CountryIndexEntrySchema>;

export const CountriesIndexSchema = z.array(CountryIndexEntrySchema).min(1);
export type CountriesIndex = z.infer<typeof CountriesIndexSchema>;
