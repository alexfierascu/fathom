import { z } from 'zod';

import { EditorialStatusSchema, NameSchema, SlugSchema, TokenSchema } from './common';

/**
 * Water body kinds (DATA_MODEL.md). Beyond the core ocean/sea/gulf/bay,
 * `channel` covers waters like the English Channel and `strait` covers
 * waters that are themselves straits when referenced as connecting water
 * (the wide-channel open question, resolved case by case).
 */
export const WATER_BODY_TYPES = ['ocean', 'sea', 'channel', 'strait', 'gulf', 'bay'] as const;
export const WaterBodyTypeSchema = z.enum(WATER_BODY_TYPES);
export type WaterBodyType = z.infer<typeof WaterBodyTypeSchema>;

/**
 * Full water body document, one JSON file per water body in
 * src/water-bodies/. Ids must match `slugifyName(name)` so the edges
 * derived from strait `connects` values resolve to these documents.
 */
export const WaterBodySchema = z
  .strictObject({
    id: TokenSchema,
    name: z.string().min(1),
    type: WaterBodyTypeSchema,
    summary: z.string().min(1),
    /** Containment hierarchy: required for everything except oceans. */
    parentId: TokenSchema.optional(),
    sourceIds: z.array(TokenSchema).min(1),

    // --- Canonical expansion (optional), mirroring the strait document ---
    slug: SlugSchema.optional(),
    names: z.array(NameSchema).optional(),
    description: z.string().min(1).optional(),
    status: EditorialStatusSchema.optional(),
  })
  .superRefine((waterBody, ctx) => {
    if (waterBody.type === 'ocean' && waterBody.parentId !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['parentId'], message: 'Oceans have no parent' });
    }
    if (waterBody.type !== 'ocean' && waterBody.parentId === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['parentId'],
        message: 'Only oceans may omit a parent',
      });
    }
  });
export type WaterBody = z.infer<typeof WaterBodySchema>;

/** Lightweight per-water-body entry in src/water-bodies/index.json. */
export const WaterBodyIndexEntrySchema = z.strictObject({
  id: TokenSchema,
  name: z.string().min(1),
  type: WaterBodyTypeSchema,
});
export type WaterBodyIndexEntry = z.infer<typeof WaterBodyIndexEntrySchema>;

export const WaterBodiesIndexSchema = z.array(WaterBodyIndexEntrySchema).min(1);
export type WaterBodiesIndex = z.infer<typeof WaterBodiesIndexSchema>;
