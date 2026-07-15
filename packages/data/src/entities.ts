import { z } from 'zod';

import {
  HistoricalEventSchema,
  ImageSchema,
  SourceSchema,
  StatisticSchema,
  TagSchema,
  WildlifeSchema,
  type HistoricalEvent,
  type Image,
  type Source,
  type Statistic,
  type Tag,
  type Wildlife,
} from './schema';

import rawEvents from './knowledge/events.json';
import rawImages from './knowledge/images.json';
import rawSources from './knowledge/sources.json';
import rawStatistics from './knowledge/statistics.json';
import rawTags from './knowledge/tags.json';
import rawWildlife from './knowledge/wildlife.json';

/**
 * Knowledge-layer collections. Empty until real, sourced data arrives;
 * every document is Zod-validated on first load (memoized), like straits.
 */
function createCollectionLoader<T>(schema: z.ZodType<T>, raw: unknown): () => readonly T[] {
  let cache: readonly T[] | null = null;
  return () => {
    cache ??= z.array(schema).parse(raw);
    return cache;
  };
}

export const loadSources: () => readonly Source[] = createCollectionLoader(
  SourceSchema,
  rawSources,
);
export const loadImages: () => readonly Image[] = createCollectionLoader(ImageSchema, rawImages);
export const loadHistoricalEvents: () => readonly HistoricalEvent[] = createCollectionLoader(
  HistoricalEventSchema,
  rawEvents,
);
export const loadWildlife: () => readonly Wildlife[] = createCollectionLoader(
  WildlifeSchema,
  rawWildlife,
);
export const loadStatistics: () => readonly Statistic[] = createCollectionLoader(
  StatisticSchema,
  rawStatistics,
);
export const loadTags: () => readonly Tag[] = createCollectionLoader(TagSchema, rawTags);
