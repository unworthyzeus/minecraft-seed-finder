import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { strict as assert } from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagePath = path.resolve(__dirname, '../app/seeds/[id]/page.js');
const islandPath = path.resolve(__dirname, '../components/DeferredSeedVisualizer.js');

const pageSource = fs.readFileSync(pagePath, 'utf8');

assert.doesNotMatch(
  pageSource,
  /^['"]use client['"]/m,
  'Seed detail page should be a Server Component so basic links and content do not wait for client hydration'
);

assert.match(
  pageSource,
  /export\s+default\s+function\s+SeedDetailPage\(\{\s*params\s*\}\)/,
  'Seed detail page should read route params on the server instead of useParams in the client'
);

assert.doesNotMatch(
  pageSource,
  /from\s+['"]next\/navigation['"]/,
  'Seed detail page should not import next/navigation client hooks'
);

assert.doesNotMatch(
  pageSource,
  /import\s+SeedVisualizer\s+from\s+['"]@\/components\/SeedVisualizer['"]/,
  'Seed detail page should not import the heavy visualizer directly into the initial interactive bundle'
);

assert.match(
  pageSource,
  /import\s+SeedDetailMapSection\s+from\s+['"]@\/components\/SeedDetailMapSection['"]/,
  'Seed detail page should use a small client map section island'
);

assert.match(
  pageSource,
  /<SeedDetailMapSection/,
  'Seed detail page should render the map section island'
);

const islandSource = fs.readFileSync(islandPath, 'utf8');

assert.match(
  islandSource,
  /dynamic\(\s*\(\)\s*=>\s*import\(['"]@\/components\/SeedVisualizer['"]\)/,
  'Deferred visualizer should code-split SeedVisualizer with next/dynamic'
);

assert.match(
  islandSource,
  /ssr:\s*false/,
  'Deferred visualizer should disable SSR for the canvas-heavy map'
);

assert.match(
  islandSource,
  /requestIdleCallback|requestAnimationFrame/,
  'Deferred visualizer should yield initial hydration before mounting the heavy map'
);

console.log('Seed detail visualizer is deferred into an interactive island');
