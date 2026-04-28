import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { strict as assert } from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const searchPath = path.resolve(__dirname, '../app/search/page.js');
const source = fs.readFileSync(searchPath, 'utf8');

assert.match(
    source,
    /queryHydrated/,
    'Search page should gate URL replacement until URL query hydration has run'
);

assert.match(
    source,
    /if\s*\(!queryHydrated\)\s*return;/,
    'Search page should not overwrite incoming query params with defaults on first render'
);

console.log('Search query hydration guard is present');
