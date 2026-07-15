import { loadStrait } from '@fathom/data';

import { buildStraitSeo } from './seo';

describe('buildStraitSeo', () => {
  it('derives title, description, and path from existing data only', () => {
    const strait = loadStrait('gibraltar');
    const seo = buildStraitSeo(strait);

    expect(seo.title).toBe('Strait of Gibraltar — Fathom');
    expect(seo.description).toContain(strait.connects);
    expect(seo.description).toContain(strait.note);
    expect(seo.path).toBe('/straits/gibraltar');
  });
});
