import {
  findBrokenReferences,
  loadAtlasDataset,
  type Source,
  type Strait,
  type WaterBody,
} from '@fathom/data';
import { buildSearchDocuments, loadedAtlasContent, type AtlasContent } from '@fathom/search';

import { generateEntities } from './stages/generate';
import { normalize } from './stages/normalize';
import { resolveRelationships } from './stages/resolve';
import type {
  Enricher,
  ImportScope,
  Issue,
  PipelineReport,
  ProviderAdapter,
  StagedEntity,
} from './types';

export interface PipelineResult {
  report: PipelineReport;
  staged: readonly StagedEntity[];
  stagedSources: readonly Source[];
  searchDocuments: readonly unknown[];
}

/**
 * Runs the full pipeline: import → normalize → validate → enrich →
 * resolve → generate → indexes → search index → report. Providers and
 * enrichers are injected, so adding a data source never touches this file.
 */
export async function runPipeline(
  adapters: readonly ProviderAdapter[],
  enrichers: readonly Enricher[],
  scope: ImportScope,
): Promise<PipelineResult> {
  const startedAt = new Date().toISOString();
  const issues: Issue[] = [];

  // 1 — Import
  const imported = [];
  for (const adapter of adapters) {
    const wanted = scope.types.filter((type) => adapter.provides.includes(type));
    if (wanted.length === 0) continue;
    try {
      const records = await adapter.fetchRecords({ ...scope, types: wanted });
      imported.push(...records);
    } catch (error) {
      issues.push({
        severity: 'error',
        stage: 'import',
        subject: adapter.name,
        message: `Adapter failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // 2 + 3 — Normalize (validation issues surface inside)
  const { normalized, issues: normalizeIssues, duplicatesInBatch } = normalize(imported);
  issues.push(...normalizeIssues);

  // 4 — Enrich
  let enriched = normalized;
  for (const enricher of enrichers) {
    const next = [];
    for (const record of enriched) {
      try {
        next.push(await enricher.enrich(record));
      } catch (error) {
        issues.push({
          severity: 'warning',
          stage: 'enrich',
          subject: `${record.entityType}:${record.id}`,
          message: `${enricher.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        });
        next.push(record);
      }
    }
    enriched = next;
  }

  // 5 — Resolve relationships
  const atlas = loadedAtlasContent();
  const { resolved, issues: resolveIssues } = resolveRelationships(enriched, atlas);
  issues.push(...resolveIssues);

  // 6 — Generate + validate documents
  const {
    staged,
    duplicatesOfAtlas,
    rejected,
    issues: generateIssues,
  } = generateEntities(resolved, atlas);
  issues.push(...generateIssues);

  // Sources cited by staged entities become source documents.
  const stagedSourceIds = new Set(
    staged.flatMap((entity) => (entity.document.sourceIds as string[] | undefined) ?? []),
  );
  const knownSources = new Set(loadAtlasDataset().sources.map((source) => source.id));
  const stagedSources: Source[] = [];
  const seenDrafts = new Set<string>();
  for (const record of resolved) {
    for (const draft of record.sources) {
      if (!stagedSourceIds.has(draft.id) || knownSources.has(draft.id) || seenDrafts.has(draft.id))
        continue;
      seenDrafts.add(draft.id);
      stagedSources.push(draft);
    }
  }

  // 7 + 8 — Merged content for indexes and the search index
  const merged = mergeContent(atlas, staged);
  const searchDocuments = buildSearchDocuments(merged);

  // 9 — Report, including integrity over existing + staged
  const dataset = loadAtlasDataset();
  const brokenReferences = findBrokenReferences({
    ...dataset,
    straits: merged.straits,
    waterBodies: merged.waterBodies,
    countries: merged.countries,
    ports: merged.ports,
    islands: merged.islands,
    sources: [...dataset.sources, ...stagedSources],
  });

  const report: PipelineReport = {
    startedAt,
    scope,
    adapters: adapters.map((adapter) => adapter.name),
    counts: {
      imported: imported.length,
      normalized: normalized.length,
      duplicatesOfAtlas,
      duplicatesInBatch,
      staged: staged.length,
      rejected,
      searchDocuments: searchDocuments.length,
    },
    issues,
    brokenReferences: brokenReferences.map((broken) => ({ ...broken })),
  };

  return { report, staged, stagedSources, searchDocuments };
}

function mergeContent(atlas: AtlasContent, staged: readonly StagedEntity[]): AtlasContent {
  const of = <T>(type: string) =>
    staged
      .filter((entity) => entity.type === type)
      .map((entity) => entity.document as unknown as T);
  return {
    ...atlas,
    straits: [...atlas.straits, ...of<Strait>('strait')],
    waterBodies: [...atlas.waterBodies, ...of<WaterBody>('water-body')],
    countries: [...atlas.countries, ...of<never>('country')],
    ports: [...atlas.ports, ...of<never>('port')],
    islands: [...atlas.islands, ...of<never>('island')],
  };
}
