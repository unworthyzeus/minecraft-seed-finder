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
  /import\s+SeedVisualizer\s+from\s+['"]@\/components\/SeedVisualizer['"]/,
  'Seed detail page should not import the heavy visualizer directly into the initial interactive bundle'
);

assert.match(
  pageSource,
  /import\s+DeferredSeedVisualizer\s+from\s+['"]@\/components\/DeferredSeedVisualizer['"]/,
  'Seed detail page should use the deferred visualizer island'
);

assert.match(
  pageSource,
  /<DeferredSeedVisualizer/,
  'Seed detail page should render the deferred visualizer island'
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
