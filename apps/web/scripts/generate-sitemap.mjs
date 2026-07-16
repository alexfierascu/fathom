/**
 * Generates dist/sitemap.xml and dist/robots.txt from the data package's
 * JSON indexes after the Vite build. Runs in plain Node — it reads the
 * JSON files directly rather than importing TypeScript.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataSrc = join(here, '../../../packages/data/src');
const dist = join(here, '../dist');

const siteUrl = (process.env.VITE_SITE_URL ?? 'https://fathom.pages.dev').replace(/\/$/, '');

const readJson = (path) => JSON.parse(readFileSync(join(dataSrc, path), 'utf8'));

const slugify = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const paths = ['/'];

for (const entry of readJson('straits/index.json')) paths.push(`/straits/${entry.id}`);
for (const entry of readJson('water-bodies/index.json')) paths.push(`/water-bodies/${entry.id}`);
for (const entry of readJson('countries/index.json')) paths.push(`/countries/${entry.id}`);

const regions = [...new Set(readJson('straits/index.json').map((entry) => entry.region))];
for (const region of regions) paths.push(`/regions/${slugify(region)}`);

const collections = [
  ['maritime/ports.json', '/ports'],
  ['maritime/canals.json', '/canals'],
  ['maritime/bridges.json', '/bridges'],
  ['maritime/tunnels.json', '/tunnels'],
  ['maritime/islands.json', '/islands'],
  ['maritime/routes.json', '/routes'],
];
for (const [file, base] of collections) {
  for (const entry of readJson(file)) paths.push(`${base}/${entry.id}`);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(join(dist, 'sitemap.xml'), sitemap);
writeFileSync(join(dist, 'robots.txt'), robots);
console.log(`sitemap.xml: ${String(paths.length)} URLs for ${siteUrl}`);
