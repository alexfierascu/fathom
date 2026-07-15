import { describe, expect, it } from 'vitest';

import { connectedWaterBodyNames, slugifyName } from './derived';
import { loadAllStraits } from './loader';
import { loadAllWaterBodies, loadWaterBodiesIndex, loadWaterBody } from './water-bodies';

describe('water bodies dataset', () => {
  it('loads all documents in canonical order', () => {
    const all = loadAllWaterBodies();
    expect(all.length).toBe(loadWaterBodiesIndex().length);
    expect(all[0]?.id).toBe('atlantic-ocean');
  });

  it('covers every water body named by strait connects values', () => {
    const known = new Set(loadAllWaterBodies().map((wb) => wb.id));
    for (const strait of loadAllStraits()) {
      for (const name of connectedWaterBodyNames(strait)) {
        expect(known.has(slugifyName(name)), `missing document for "${name}"`).toBe(true);
      }
    }
  });

  it('keeps ids consistent with slugified names', () => {
    for (const waterBody of loadAllWaterBodies()) {
      expect(waterBody.id).toBe(slugifyName(waterBody.name));
    }
  });

  it('gives every non-ocean a resolvable parent and oceans none', () => {
    const byId = new Map(loadAllWaterBodies().map((wb) => [wb.id, wb]));
    for (const waterBody of loadAllWaterBodies()) {
      if (waterBody.type === 'ocean') {
        expect(waterBody.parentId).toBeUndefined();
      } else {
        expect(waterBody.parentId).toBeDefined();
        expect(byId.has(waterBody.parentId ?? '')).toBe(true);
      }
    }
  });

  it('loads single documents and throws for unknown ids', () => {
    expect(loadWaterBody('persian-gulf').type).toBe('gulf');
    expect(loadWaterBody('hudson-bay').type).toBe('bay');
    expect(() => loadWaterBody('sea-of-atlantis')).toThrow('Unknown water body id');
  });
});
