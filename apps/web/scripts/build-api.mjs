/**
 * Publishes the dataset as a static, versioned JSON API under dist/api/
 * after the Vite build — no server, no keys, cache-friendly. Runs in
 * plain Node and reads the data package's JSON documents directly.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataSrc = join(here, '../../../packages/data/src');
const apiDir = join(here, '../dist/api/v1');

const readJson = (path) => JSON.parse(readFileSync(join(dataSrc, path), 'utf8'));
const write = (relative, value) => {
  const path = join(apiDir, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
};

const perFileCollection = (dir) =>
  readdirSync(join(dataSrc, dir))
    .filter((file) => file.endsWith('.json') && file !== 'index.json')
    .map((file) => readJson(`${dir}/${file}`))
    .sort((a, b) => a.id.localeCompare(b.id));

let documents = 0;

// Per-file collections: a list endpoint plus one document per entity.
for (const [dir, name] of [
  ['straits', 'straits'],
  ['water-bodies', 'water-bodies'],
  ['countries', 'countries'],
]) {
  const items = perFileCollection(dir);
  write(`${name}.json`, items);
  for (const item of items) write(`${name}/${item.id}.json`, item);
  documents += items.length;
}

// Array collections publish as single list endpoints.
for (const [file, name] of [
  ['maritime/ports.json', 'ports'],
  ['maritime/canals.json', 'canals'],
  ['maritime/bridges.json', 'bridges'],
  ['maritime/tunnels.json', 'tunnels'],
  ['maritime/islands.json', 'islands'],
  ['maritime/routes.json', 'routes'],
  ['knowledge/tags.json', 'tags'],
  ['knowledge/events.json', 'events'],
  ['knowledge/sources.json', 'sources'],
  ['knowledge/images.json', 'images'],
]) {
  const items = readJson(file);
  write(`${name}.json`, items);
  documents += items.length;
}

write('index.json', {
  name: 'Fathom Atlas API',
  version: 1,
  license: 'Data compiled from the cited sources; see /api/v1/sources.json',
  endpoints: [
    '/api/v1/straits.json',
    '/api/v1/straits/{id}.json',
    '/api/v1/water-bodies.json',
    '/api/v1/water-bodies/{id}.json',
    '/api/v1/countries.json',
    '/api/v1/countries/{id}.json',
    '/api/v1/ports.json',
    '/api/v1/canals.json',
    '/api/v1/bridges.json',
    '/api/v1/tunnels.json',
    '/api/v1/islands.json',
    '/api/v1/routes.json',
    '/api/v1/tags.json',
    '/api/v1/events.json',
    '/api/v1/sources.json',
    '/api/v1/images.json',
  ],
});

console.log(`api/v1: ${String(documents)} documents published`);
