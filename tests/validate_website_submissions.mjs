import { strict as assert } from 'assert';

import data from '../lib/seeds-data.json' with { type: 'json' };
import { isWebsiteSubmission, seedMatchesSourceFilter } from '../lib/source-utils.js';

const expectedSeeds = new Set([
    'BE AMAZED',
    '5004260924615097095',
    '-1432473694351278491',
]);

const submissions = data.filter(isWebsiteSubmission);
const actualSeeds = new Set(submissions.map(seed => seed.seed));

assert.equal(submissions.length, expectedSeeds.size, 'expected exactly three website submissions');

for (const expectedSeed of expectedSeeds) {
    assert.ok(actualSeeds.has(expectedSeed), `missing website submission ${expectedSeed}`);
}

for (const seed of submissions) {
    assert.equal(seed.source, 'Submitted to this website', `${seed.id} should use the public website submission source label`);
    assert.equal(seed.sourceType, 'website_submission', `${seed.id} should use the website submission source type`);
    assert.equal(seed.submittedToWebsite, true, `${seed.id} should be flagged as submitted to the website`);
    assert.equal(seed.isGenerated, false, `${seed.id} should not be treated as generated`);
    assert.ok(seed.confidence < 1, `${seed.id} should stay below fully verified confidence`);
}

assert.equal(
    data.filter(seed => seedMatchesSourceFilter(seed, 'website_submission')).length,
    expectedSeeds.size,
    'source filter should return the three website submissions'
);

assert.equal(
    data.filter(seed => seedMatchesSourceFilter(seed, 'human')).some(isWebsiteSubmission),
    false,
    'human source filter should not include website submissions'
);

console.log(`Website submissions audit: ${submissions.length} submitted seeds`);
