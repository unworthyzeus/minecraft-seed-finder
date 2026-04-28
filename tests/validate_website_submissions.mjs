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
    data.filter(seed => seedMatchesSourceFilter(seed, WEBSITE_SUBMISSION_SOURCE)).length,
    expectedSeeds.size,
    'source filter should return the three website submissions'
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
    'normalized website submission filters should show all three submitted seeds'
);

console.log(`Website submissions audit: ${submissions.length} submitted seeds`);
