import { z } from 'zod';

/**
 * Shared foundation from docs/DATA_MODEL.md: the building blocks every
 * entity uses. Only what current and near-term data needs is modeled;
 * evolution is additive.
 */

/** All entity types named by the canonical model. */
export const ENTITY_TYPES = [
  'strait',
  'water-body',
  'canal',
  'island',
  'country',
  'region',
  'port',
  'bridge',
  'tunnel',
  'infrastructure',
  'organization',
  'maritime-route',
  'image',
  'source',
  'historical-event',
  'wildlife',
  'statistic',
  'tag',
] as const;

export const EntityTypeSchema = z.enum(ENTITY_TYPES);
export type EntityType = z.infer<typeof EntityTypeSchema>;

/** Lowercase token used by ids and slugs (`gibraltar`, `bab-el-mandeb`). */
export const TokenSchema = z.string().regex(/^[a-z0-9-]+$/);

/** URL-facing slug; may change over time, unlike ids (DATA_MODEL.md). */
export const SlugSchema = TokenSchema;

/** Canonical entity id string: `<type>:<token>`, e.g. `strait:gibraltar`. */
export function entityId(type: EntityType, token: string): string {
  return `${type}:${token}`;
}

export function parseEntityId(value: string): { type: EntityType; token: string } | null {
  const separator = value.indexOf(':');
  if (separator === -1) return null;
  const type = EntityTypeSchema.safeParse(value.slice(0, separator));
  const token = TokenSchema.safeParse(value.slice(separator + 1));
  return type.success && token.success ? { type: type.data, token: token.data } : null;
}

/** Typed reference to another entity — relationships are edges of the graph. */
export const EntityRefSchema = z.strictObject({
  type: EntityTypeSchema,
  id: TokenSchema,
});
export type EntityRef = z.infer<typeof EntityRefSchema>;

/** A name with its qualifiers, per the names model. */
export const NameSchema = z.strictObject({
  value: z.string().min(1),
  /** BCP 47 language tag. */
  language: z.string().min(2).optional(),
  script: z.string().min(1).optional(),
  kind: z.enum(['official', 'endonym', 'exonym', 'historical', 'disputed']).optional(),
  /** Period of use, for historical names. */
  period: z.string().min(1).optional(),
  /** Claimant context, for disputed names. */
  claimant: z.string().min(1).optional(),
});
export type Name = z.infer<typeof NameSchema>;

/**
 * A quantity with its unit and evidence. Metric units; sources are
 * mandatory ("numbers are measurements, not decoration"). `asOf` records
 * when the value held, where known.
 */
export const MeasurementSchema = z.strictObject({
  value: z.number(),
  unit: z.string().min(1),
  asOf: z.string().min(1).optional(),
  method: z.enum(['measured', 'estimated', 'modeled']).optional(),
  uncertainty: z.string().min(1).optional(),
  sourceIds: z.array(TokenSchema).min(1),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

/** A date, range, or approximation — uncertainty is representable. */
export const DateValueSchema = z.strictObject({
  /** ISO date or year. */
  value: z.string().min(1),
  /** End of a range, when the occurrence spans time. */
  end: z.string().min(1).optional(),
  approximate: z.boolean().optional(),
});
export type DateValue = z.infer<typeof DateValueSchema>;

/** Editorial state; entities without one are considered published. */
export const EditorialStatusSchema = z.enum(['draft', 'published', 'retired']);
export type EditorialStatus = z.infer<typeof EditorialStatusSchema>;
