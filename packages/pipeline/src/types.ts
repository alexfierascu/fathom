/**
 * The pipeline's shared contracts. Providers know nothing about Fathom's
 * schemas; the core stages know nothing about providers — adapters meet in
 * the middle at ProviderRecord.
 */

export type ImportableType =
  | 'strait'
  | 'water-body'
  | 'country'
  | 'port'
  | 'canal'
  | 'bridge'
  | 'tunnel'
  | 'island'
  | 'maritime-route';

/** A citable source draft, shaped like the data package's Source schema. */
export interface SourceDraft {
  id: string;
  type:
    | 'book'
    | 'journal-article'
    | 'official-publication'
    | 'chart'
    | 'dataset'
    | 'website'
    | 'institution';
  title: string;
  publisher: string;
  locator: string;
  accessedOn?: string;
  license?: string;
}

/** One entity as one provider saw it. */
export interface ProviderRecord {
  provider: string;
  providerId: string;
  entityType: ImportableType;
  name: string;
  alternateNames?: readonly string[];
  lat?: number;
  lon?: number;
  summary?: string;
  /** Display names of bordering/owning countries, as the provider gives them. */
  countryNames?: readonly string[];
  /** For straits and canals: the waters they connect. */
  connectsNames?: readonly string[];
  /** Water body kind hint (ocean, sea, gulf, bay, …). */
  waterBodyType?: string;
  /** Parent water body name (seas → oceans), when the provider knows. */
  parentName?: string;
  /** ISO 3166-1 alpha-2 code for countries. */
  isoCode?: string;
  /** For bridges and tunnels: the strait they cross. */
  crossesName?: string;
  source: SourceDraft;
}

export interface ImportScope {
  types: readonly ImportableType[];
  limit?: number;
}

export interface ProviderAdapter {
  name: string;
  provides: readonly ImportableType[];
  fetchRecords: (scope: ImportScope) => Promise<readonly ProviderRecord[]>;
}

/** Post-normalization: slug assigned, multi-provider records merged. */
export interface NormalizedRecord {
  id: string;
  entityType: ImportableType;
  name: string;
  alternateNames: readonly string[];
  lat?: number;
  lon?: number;
  summary?: string;
  countryNames: readonly string[];
  connectsNames: readonly string[];
  waterBodyType?: string;
  parentName?: string;
  isoCode?: string;
  crossesName?: string;
  providers: readonly { provider: string; providerId: string }[];
  sources: readonly SourceDraft[];
  /** Filled by the resolve stage. */
  region?: string;
  connects?: string;
}

export interface Issue {
  severity: 'error' | 'warning';
  stage: string;
  subject: string;
  message: string;
}

export interface StagedEntity {
  type: ImportableType;
  id: string;
  document: Record<string, unknown>;
}

export interface PipelineReport {
  startedAt: string;
  scope: ImportScope;
  adapters: readonly string[];
  counts: {
    imported: number;
    normalized: number;
    duplicatesOfAtlas: number;
    duplicatesInBatch: number;
    staged: number;
    rejected: number;
    searchDocuments: number;
  };
  issues: readonly Issue[];
  /** Broken references across existing + staged content. */
  brokenReferences: readonly { from: string; field: string; ref: string; reason: string }[];
}

export interface Enricher {
  name: string;
  enrich: (record: NormalizedRecord) => Promise<NormalizedRecord>;
}
