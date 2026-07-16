import { describe, expect, it } from 'vitest';

import {
  loadHistoricalEvents,
  loadImages,
  loadSources,
  loadStatistics,
  loadTags,
  loadWildlife,
} from './entities';

describe('knowledge collections', () => {
  it('loads and validates the sources on record', () => {
    const ids = loadSources().map((source) => source.id);
    expect(ids).toContain('iho-limits-of-oceans-and-seas');
  });

  it('loads the populated knowledge collections', () => {
    expect(loadTags().map((tag) => tag.id)).toContain('chokepoint');
    expect(loadHistoricalEvents().map((event) => event.id)).toContain('gallipoli-campaign');
    expect(loadImages().map((image) => image.id)).toContain('gibraltar-satellite');
  });

  it('loads the still-empty collections as empty', () => {
    expect(loadWildlife()).toEqual([]);
    expect(loadStatistics()).toEqual([]);
  });
});
