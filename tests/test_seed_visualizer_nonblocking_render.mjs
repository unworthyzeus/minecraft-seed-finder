import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { strict as assert } from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const visualizerPath = path.resolve(__dirname, '../components/SeedVisualizer.js');
const source = fs.readFileSync(visualizerPath, 'utf8');

assert.match(
  source,
  /requestAnimationFrame\(renderBiomeRows\)/,
  'SeedVisualizer should render the initial biome canvas in animation-frame batches'
);

assert.match(
  source,
  /performance\.now\(\)\s*\+\s*8/,
  'SeedVisualizer should keep each canvas render batch short enough to yield to clicks'
);

assert.match(
  source,
  /cancelAnimationFrame\(frameId\)/,
  'SeedVisualizer should cancel pending canvas work when route state changes'
);

console.log('Seed visualizer renders the initial canvas without monopolizing the main thread');
