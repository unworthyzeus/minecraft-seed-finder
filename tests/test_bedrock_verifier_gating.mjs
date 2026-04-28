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
  /fetch\('\/api\/bedrock\/verify',\s*\{\s*method:\s*'GET'/s,
  'Search page should check BDS verifier availability before survivor POST checks'
);

assert.match(
  source,
  /if\s*\(activeVerifierStatus\?\.available\)\s*\{[\s\S]*verifyBedrockCandidate/,
  'Search page should only POST survivor seeds to BDS when the verifier is available'
);

assert.match(
  source,
  /status:\s*'unavailable'[\s\S]*activeVerifierStatus\?\.reason/,
  'Search page should keep Bedrock candidates with an unavailable-verifier badge when BDS is not configured'
);

console.log('Bedrock verifier availability gates survivor POST checks');
