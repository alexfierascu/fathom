import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import type { Source } from '@fathom/data';

import { geonamesAdapter } from './adapters/geonames';
import { naturalEarthAdapter } from './adapters/natural-earth';
import { osmAdapter } from './adapters/osm';
import { wikidataAdapter } from './adapters/wikidata';
import { wikipediaEnricher } from './adapters/wikipedia';
import { applyStaged, writeStagedBundle } from './apply';
import { runPipeline } from './pipeline';
import type { ImportableType, ProviderAdapter, StagedEntity } from './types';

const ADAPTERS: Record<string, ProviderAdapter> = {
  wikidata: wikidataAdapter,
  osm: osmAdapter,
  'natural-earth': naturalEarthAdapter(),
  geonames: geonamesAdapter,
};

const DATA_SRC = join(import.meta.dirname, '../../data/src');

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { values } = parseArgs({
    args: rest,
    options: {
      adapters: { type: 'string', default: 'wikidata' },
      types: { type: 'string', default: 'strait' },
      limit: { type: 'string', default: '25' },
      out: { type: 'string', default: join(import.meta.dirname, '../out') },
      enrich: { type: 'string', default: 'wikipedia' },
      'enrich-limit': { type: 'string', default: '40' },
      from: { type: 'string', default: join(import.meta.dirname, '../out') },
    },
  });

  if (command === 'run') {
    const adapterNames = (values.adapters ?? '').split(',').filter(Boolean);
    const adapters = adapterNames.map((name) => {
      const adapter = ADAPTERS[name];
      if (!adapter)
        throw new Error(`Unknown adapter "${name}" (have: ${Object.keys(ADAPTERS).join(', ')})`);
      return adapter;
    });
    const types = (values.types ?? '').split(',').filter(Boolean) as ImportableType[];
    const enrichers = values.enrich?.includes('wikipedia')
      ? [wikipediaEnricher({ maxLookups: Number(values['enrich-limit']) })]
      : [];

    const result = await runPipeline(adapters, enrichers, {
      types,
      limit: Number(values.limit),
    });
    await writeStagedBundle(
      values.out ?? 'out',
      result.staged,
      result.stagedSources,
      result.report,
      result.searchDocuments,
    );

    const { counts } = result.report;
    console.log(`\nPipeline report (${result.report.adapters.join(', ')} → ${types.join(', ')})`);
    console.log(`  imported:            ${String(counts.imported)}`);
    console.log(`  normalized:          ${String(counts.normalized)}`);
    console.log(`  duplicates in batch: ${String(counts.duplicatesInBatch)}`);
    console.log(`  already charted:     ${String(counts.duplicatesOfAtlas)}`);
    console.log(`  staged (valid):      ${String(counts.staged)}`);
    console.log(`  rejected:            ${String(counts.rejected)}`);
    console.log(`  search documents:    ${String(counts.searchDocuments)}`);
    console.log(`  broken references:   ${String(result.report.brokenReferences.length)}`);
    const errors = result.report.issues.filter((issue) => issue.severity === 'error');
    const warnings = result.report.issues.filter((issue) => issue.severity === 'warning');
    console.log(
      `  issues:              ${String(errors.length)} errors, ${String(warnings.length)} warnings`,
    );
    console.log(
      `\nStaged bundle written to ${values.out ?? 'out'} — review report.json, then run apply.`,
    );
    return;
  }

  if (command === 'apply') {
    const bundlePath = join(values.from ?? 'out', 'staged.json');
    const bundle = JSON.parse(await readFile(bundlePath, 'utf8')) as {
      staged: StagedEntity[];
      stagedSources: Source[];
    };
    const applied = await applyStaged(DATA_SRC, bundle.staged, bundle.stagedSources);
    console.log(`Applied ${String(applied.length)} entities to packages/data:`);
    for (const id of applied) console.log(`  ${id}`);
    console.log('\nNow run: pnpm format && pnpm test (documents are drafts until reviewed).');
    return;
  }

  console.log('Usage: tsx src/cli.ts run [--adapters a,b] [--types t,u] [--limit n] [--out dir]');
  console.log('       tsx src/cli.ts apply [--from dir]');
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
