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

  it('loads the still-empty collections as empty', () => {
    expect(loadImages()).toEqual([]);
    expect(loadHistoricalEvents()).toEqual([]);
    expect(loadWildlife()).toEqual([]);
    expect(loadStatistics()).toEqual([]);
    expect(loadTags()).toEqual([]);
  });
});
