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
  it('load and validate as empty until sourced data arrives', () => {
    expect(loadSources()).toEqual([]);
    expect(loadImages()).toEqual([]);
    expect(loadHistoricalEvents()).toEqual([]);
    expect(loadWildlife()).toEqual([]);
    expect(loadStatistics()).toEqual([]);
    expect(loadTags()).toEqual([]);
  });
});
