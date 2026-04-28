import { strict as assert } from 'assert';

import {
    evaluateBedrockVerification,
    getBdsVerifierStatus,
    parseBdsLocateLine,
} from '../lib/bedrock-bds-oracle.js';

assert.deepEqual(
    parseBdsLocateLine('The nearest minecraft:village is at block 136, (y?), 168 (216 blocks away)'),
    {
        ok: true,
        id: 'minecraft:village',
        x: 136,
        y: null,
        z: 168,
        distance: 216,
    }
);

assert.deepEqual(
    parseBdsLocateLine('The nearest minecraft:deep_dark is at block -1376, -59, -1904 (2349 blocks away)'),
    {
        ok: true,
        id: 'minecraft:deep_dark',
        x: -1376,
        y: -59,
        z: -1904,
        distance: 2349,
    }
);

assert.deepEqual(
    parseBdsLocateLine('Could not find that structure nearby'),
    { ok: false, reason: 'not-found' }
);

const unavailable = getBdsVerifierStatus({ env: {} });
assert.equal(unavailable.available, false);
assert.match(unavailable.reason, /BDS_ROOT|BEDROCK_BDS_ROOT/);

const confirmed = evaluateBedrockVerification({
    query: {
        radius: 2500,
        biome: 'deep_dark',
        structures: ['village', 'ruined_portal'],
        maxStructureDistance: 500,
        maxBiomeStructureDistance: 2800,
    },
    locateResults: {
        biome: { ok: true, id: 'minecraft:deep_dark', x: -1376, y: -59, z: -1904, distance: 2349 },
        structures: {
            village: { ok: true, id: 'minecraft:village', x: 136, y: null, z: 168, distance: 216 },
            ruined_portal: { ok: true, id: 'minecraft:ruined_portal', x: 248, y: null, z: 344, distance: 424 },
        },
    },
});
assert.equal(confirmed.status, 'confirmed');
assert.equal(confirmed.verifiedBy, 'bedrock-dedicated-server');

const mismatch = evaluateBedrockVerification({
    query: {
        radius: 300,
        biome: 'any',
        structures: ['village', 'ruined_portal'],
        maxStructureDistance: 150,
        maxBiomeStructureDistance: 0,
    },
    locateResults: {
        structures: {
            village: { ok: true, id: 'minecraft:village', x: 136, y: null, z: 168, distance: 216 },
            ruined_portal: { ok: true, id: 'minecraft:ruined_portal', x: 248, y: null, z: 344, distance: 424 },
        },
    },
});
assert.equal(mismatch.status, 'mismatch');
assert.ok(mismatch.failures.some(item => item.check === 'structure-radius'));
assert.ok(mismatch.failures.some(item => item.check === 'structure-cluster'));

console.log('Bedrock BDS oracle parsing and evaluation checks passed');
