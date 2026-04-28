import { strict as assert } from 'assert';

import {
    STRUCTURE_TYPES,
    generateStructureCandidates,
    getBedrockStructureConfig,
    getBedrockStructurePos,
} from '../lib/cubiomes/structures.js';
import { BiomeID } from '../lib/cubiomes/core.js';

const plainsGenerator = {
    getBiome() {
        return BiomeID.plains;
    },
    getBiomeAtY() {
        return BiomeID.plains;
    },
};

const cases = [
    [STRUCTURE_TYPES.Village, '0', 0, 0, { x: 144, z: 160 }],
    [STRUCTURE_TYPES.Ruined_Portal, '0', 0, 0, { x: 320, z: 160 }],
    [STRUCTURE_TYPES.Desert_Pyramid, '12345', 0, 0, { x: 96, z: 48 }],
    [STRUCTURE_TYPES.Village, '12345', -1, 0, { x: -384, z: 144 }],
    [STRUCTURE_TYPES.Village, '12345', 0, -1, { x: 80, z: -304 }],
];

assert.deepEqual(
    getBedrockStructureConfig(STRUCTURE_TYPES.Village),
    { spacing: 27, spawnRange: 17, salt: 10387312, num: 4, source: 'mcbe-structure-finder' },
    'Bedrock village config should use MCBE spacing/spawn range, not Java structure config'
);

for (const [type, seed, areaX, areaZ, expected] of cases) {
    assert.deepEqual(
        getBedrockStructurePos(type, seed, areaX, areaZ),
        expected,
        `Bedrock structure position mismatch for type=${type} seed=${seed} area=${areaX},${areaZ}`
    );
}

const candidates = generateStructureCandidates({
    seed: 0n,
    version: '26.13',
    edition: 'bedrock',
    centerX: 0,
    centerZ: 0,
    range: 256,
    generator: plainsGenerator,
    structureKeys: ['village'],
});

assert.ok(
    candidates.some(candidate =>
        candidate.key === 'village' &&
        candidate.x === 144 &&
        candidate.z === 160 &&
        candidate.status === 'bedrock-placement-candidate' &&
        candidate.placementSource === 'mcbe-structure-finder'
    ),
    'Bedrock candidate generation should use MCBE placement and expose its candidate status/source'
);

console.log(`Bedrock structure placement: ${cases.length} reference cases`);
