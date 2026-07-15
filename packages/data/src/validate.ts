import type { z } from 'zod';

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: readonly string[] };

/**
 * Validates raw data against an entity schema, returning readable issues
 * instead of throwing — for callers that ingest or edit data.
 */
export function validateEntity<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return {
    ok: false,
    issues: result.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
    ),
  };
}
