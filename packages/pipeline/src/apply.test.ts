import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { applyStaged, renderManifest } from './apply';

describe('renderManifest', () => {
  it('renders sorted imports with camelCase identifiers', () => {
    const manifest = renderManifest(['red-sea', 'aegean-sea'], 'RAW_WATER_BODY_DOCUMENTS');
    expect(manifest).toContain("import rawAegeanSea from './aegean-sea.json';");
    expect(manifest).toContain("import rawRedSea from './red-sea.json';");
    expect(manifest.indexOf('rawAegeanSea')).toBeLessThan(manifest.indexOf('rawRedSea'));
    expect(manifest).toContain('GENERATED FILE');
  });
});

describe('applyStaged', () => {
  it('writes documents, updates indexes, regenerates manifests, merges sources', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fathom-apply-'));
    await mkdir(join(dir, 'straits'), { recursive: true });
    await mkdir(join(dir, 'maritime'), { recursive: true });
    await mkdir(join(dir, 'knowledge'), { recursive: true });
    await writeFile(join(dir, 'straits/index.json'), '[]\n');
    await writeFile(join(dir, 'maritime/ports.json'), '[]\n');
    await writeFile(join(dir, 'knowledge/sources.json'), '[]\n');

    const applied = await applyStaged(
      dir,
      [
        {
          type: 'strait',
          id: 'straits-of-tiran',
          document: {
            id: 'straits-of-tiran',
            name: 'Straits of Tiran',
            countries: ['Egypt'],
            region: 'Middle East & Africa',
            connects: 'Red Sea ↔ Gulf of Aqaba',
            lat: 28,
            lon: 34.46,
            note: 'Test.',
            sourceIds: ['fake-tiran'],
            status: 'draft',
          },
        },
        {
          type: 'port',
          id: 'test-port',
          document: { id: 'test-port', name: 'Test Port' },
        },
      ],
      [
        {
          id: 'fake-tiran',
          type: 'dataset',
          title: 'Fake',
          publisher: 'Test',
          locator: 'https://example.test',
        },
      ],
    );

    expect(applied).toEqual(['strait:straits-of-tiran', 'port:test-port']);

    const doc = JSON.parse(
      await readFile(join(dir, 'straits/straits-of-tiran.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(doc.name).toBe('Straits of Tiran');

    const index = JSON.parse(await readFile(join(dir, 'straits/index.json'), 'utf8')) as Record<
      string,
      unknown
    >[];
    expect(index).toHaveLength(1);
    expect(index[0]?.region).toBe('Middle East & Africa');

    const manifest = await readFile(join(dir, 'straits/manifest.ts'), 'utf8');
    expect(manifest).toContain("import rawStraitsOfTiran from './straits-of-tiran.json';");

    const ports = JSON.parse(await readFile(join(dir, 'maritime/ports.json'), 'utf8')) as Record<
      string,
      unknown
    >[];
    expect(ports[0]?.id).toBe('test-port');

    const sources = JSON.parse(
      await readFile(join(dir, 'knowledge/sources.json'), 'utf8'),
    ) as Record<string, unknown>[];
    expect(sources[0]?.id).toBe('fake-tiran');
  });
});
