import { describe, expect, it } from 'vitest';

import { loadStrait } from './loader';
import {
  loadImagesFor,
  loadSourcesFor,
  loadStatisticsFor,
  resolveRef,
  resolveRefs,
} from './resolve';

describe('resolveRef', () => {
  it('resolves strait references', () => {
    const resolved = resolveRef({ type: 'strait', id: 'gibraltar' });
    expect(resolved).toEqual(loadStrait('gibraltar'));
  });

  it('returns null for unknown ids and collectionless types', () => {
    expect(resolveRef({ type: 'strait', id: 'atlantis' })).toBeNull();
    expect(resolveRef({ type: 'water-body', id: 'mediterranean' })).toBeNull();
    expect(resolveRef({ type: 'source', id: 'nonexistent' })).toBeNull();
  });
});

describe('resolveRefs', () => {
  it('omits unresolvable references instead of failing', () => {
    const resolved = resolveRefs([
      { type: 'strait', id: 'gibraltar' },
      { type: 'water-body', id: 'mediterranean' },
      { type: 'strait', id: 'hormuz' },
    ]);
    expect(resolved.map((entity) => ('id' in entity ? entity.id : null))).toEqual([
      'gibraltar',
      'hormuz',
    ]);
  });
});

describe('attachment loaders', () => {
  it('resolve attachments where they exist and stay empty elsewhere', () => {
    expect(loadSourcesFor({ sourceIds: ['unknown'] })).toEqual([]);
    expect(loadImagesFor({ type: 'strait', id: 'gibraltar' }).map((image) => image.id)).toContain(
      'gibraltar-satellite',
    );
    expect(loadImagesFor({ type: 'strait', id: 'vries-strait' })).toEqual([]);
    expect(loadStatisticsFor({ type: 'strait', id: 'hormuz' })).toEqual([]);
  });
});
