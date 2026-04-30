import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { strict as assert } from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cardPath = path.resolve(__dirname, '../components/SeedCard.js');
const source = fs.readFileSync(cardPath, 'utf8');

assert.match(
  source,
  /const\s+seedHref\s*=\s*`\/seeds\/\$\{encodeURIComponent\(seed\.id\)\}`/,
  'Seed detail navigation should URL-encode the seed id'
);

assert.match(
  source,
  /router\.push\(seedHref\)/,
  'Seed cards should navigate to the encoded detail URL when the card is clicked'
);

assert.match(
  source,
  /<article[\s\S]*role="link"[\s\S]*tabIndex=\{0\}[\s\S]*onClick=\{openSeed\}/,
  'Seed cards should expose the card itself as a keyboard-accessible link target'
);

assert.match(
  source,
  /e\.stopPropagation\(\)/,
  'Seed copy button should stop propagation so it copies without opening the detail page'
);

assert.match(
  source,
  /e\.target\?\.closest\?\.\('button'\)/,
  'Seed card keyboard navigation should ignore key events that start on the copy button'
);

assert.doesNotMatch(
  source,
  /<Link[\s\S]*<button[\s\S]*<\/Link>/,
  'Seed cards should not nest the copy button inside a Next Link because that can cancel card navigation'
);

console.log('Seed card navigation markup is safe');
