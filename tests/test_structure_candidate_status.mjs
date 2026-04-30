import { strict as assert } from 'assert';

import { BiomeID } from '../lib/cubiomes/core.js';
import { generateStructureCandidates } from '../lib/cubiomes/structures.js';

const plainsGenerator = {
    getBiome() {
        return BiomeID.plains;
    },
    getBiomeAtY() {
        return BiomeID.plains;
    },
};

const deepDarkGenerator = {
    getBiome() {
        return BiomeID.deep_dark;
    },
    getBiomeAtY() {
        return BiomeID.deep_dark;
    },
};

function firstCandidate(options) {
    const candidates = generateStructureCandidates({
        seed: 1n,
        centerX: 0,
        centerZ: 0,
        range: 4096,
        includeUnconfirmed: false,
        ...options,
    });

    assert.ok(candidates.length > 0, `Expected at least one ${options.structureKeys?.join(', ')} candidate`);
    return candidates[0];
}

const javaVillage = firstCandidate({
    version: '1.20',
    edition: 'java',
    generator: plainsGenerator,
    structureKeys: ['village'],
});
assert.equal(javaVillage.status, 'cubiomes-match');
assert.equal(javaVillage.statusLabel, 'Cubiomes match');
assert.equal(javaVillage.requiresTerrainCheck, false);
assert.ok(!javaVillage.status.endsWith('candidate'), 'Java structures with placement + biome parity should not be drawn as candidates');
assert.equal(javaVillage.finalVerified, false);

const javaAncientCity = firstCandidate({
    version: '1.21',
    edition: 'java',
    generator: deepDarkGenerator,
    structureKeys: ['ancient_city'],
});
assert.equal(javaAncientCity.status, 'terrain-candidate');
assert.equal(javaAncientCity.requiresTerrainCheck, true);
assert.equal(javaAncientCity.finalVerified, false);

const bedrockVillage = firstCandidate({
    version: '26.13',
    edition: 'bedrock',
    generator: plainsGenerator,
    structureKeys: ['village'],
});
assert.equal(bedrockVillage.status, 'bedrock-placement-candidate');
assert.equal(bedrockVillage.placementSource, 'cubiomes-bedrock');
assert.equal(bedrockVillage.finalVerified, false);

const allStatuses = [javaVillage, javaAncientCity, bedrockVillage].map(item => item.status);
assert.ok(!allStatuses.includes('confirmed'), 'Structure candidate generation must not emit confirmed statuses');

console.log(`Structure candidate status: ${allStatuses.join(', ')}`);
