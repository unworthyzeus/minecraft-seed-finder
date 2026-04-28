import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { strict as assert } from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homePath = path.resolve(__dirname, '../app/page.js');
const source = fs.readFileSync(homePath, 'utf8');

assert.match(
    source,
    /const\s+\[editionFilter,\s*setEditionFilter\]\s*=\s*useState\('all'\)/,
    'home page should default to All Editions so Bedrock catalog seeds are visible'
);

console.log('Home page defaults to All Editions');
