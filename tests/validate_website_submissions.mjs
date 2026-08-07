import { strict as assert } from 'assert';

import data from '../lib/seeds-data.json' with { type: 'json' };
import * as sourceUtils from '../lib/source-utils.js';

const {
    isWebsiteSubmission,
    seedMatchesSourceFilter,
    WEBSITE_SUBMISSION_SOURCE,
} = sourceUtils;

const expectedSeeds = new Set([
    'BE AMAZED',
    '5004260924615097095',
    '-1432473694351278491',
    '-2801317721269292678',
    '3635422765',
    '-711098259',
    '-6985226424210014278',
    '12480984122590',
    '852004724143610746',
]);

const submissions = data.filter(isWebsiteSubmission);
const actualSeeds = new Set(submissions.map(seed => seed.seed));

assert.equal(submissions.length, expectedSeeds.size, 'expected exactly nine website submissions');

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

const submissionBySeed = new Map(submissions.map(seed => [seed.seed, seed]));
const landlockedShipwreck = submissionBySeed.get('12480984122590');
assert.equal(landlockedShipwreck.category, 'shipwreck_anomaly');
assert.deepEqual(landlockedShipwreck.version, { java: null, bedrock: '26.13' });
assert.deepEqual(landlockedShipwreck.coordinates, { x: -687, y: 67, z: 655 });
assert.match(landlockedShipwreck.description, /Beach.*in-game confirmation/i);

const dungeonMineshaft = submissionBySeed.get('852004724143610746');
assert.equal(dungeonMineshaft.category, 'structure_combo');
assert.deepEqual(dungeonMineshaft.version, { java: '1.12.2', bedrock: null });
assert.deepEqual(dungeonMineshaft.coordinates, { x: 784, y: 32, z: 1058 });
assert.match(dungeonMineshaft.description, /mineshaft start at X=784, Z=992.*manual in-game/i);

assert.equal(
    data.filter(seed => seedMatchesSourceFilter(seed, WEBSITE_SUBMISSION_SOURCE)).length,
    expectedSeeds.size,
    'source filter should return the nine website submissions'
);

assert.equal(
    data.filter(seed => seedMatchesSourceFilter(seed, 'human')).some(isWebsiteSubmission),
    false,
    'human source filter should not include website submissions'
);

assert.equal(
    typeof sourceUtils.normalizeFiltersForSource,
    'function',
    'source filter selection should expose a normalization helper'
);

const filtersAfterSelectingWebsiteSubmissions = sourceUtils.normalizeFiltersForSource(
    WEBSITE_SUBMISSION_SOURCE,
    { editionFilter: 'java', versionFilter: 'all' }
);

assert.deepEqual(
    filtersAfterSelectingWebsiteSubmissions,
    { editionFilter: 'all', versionFilter: 'all' },
    'selecting website submissions should clear the default Java edition filter so all submitted seeds are visible'
);

function applyEditionFilter(seeds, editionFilter) {
    if (editionFilter === 'java') return seeds.filter(seed => seed.version.java);
    if (editionFilter === 'bedrock') return seeds.filter(seed => seed.version.bedrock);
    return seeds;
}

const visibleWebsiteSubmissions = applyEditionFilter(
    data,
    filtersAfterSelectingWebsiteSubmissions.editionFilter
).filter(seed => seedMatchesSourceFilter(seed, WEBSITE_SUBMISSION_SOURCE));

assert.equal(
    visibleWebsiteSubmissions.length,
    expectedSeeds.size,
    'normalized website submission filters should show all nine submitted seeds'
);

console.log(`Website submissions audit: ${submissions.length} submitted seeds`);
