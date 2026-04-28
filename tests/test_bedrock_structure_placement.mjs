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
    [STRUCTURE_TYPES.Village, '0', 0, 0, { x: 136, z: 280 }],
    [STRUCTURE_TYPES.Ruined_Portal, '0', 0, 0, { x: 40, z: 24 }],
    [STRUCTURE_TYPES.Desert_Pyramid, '12345', 0, 0, { x: 280, z: 88 }],
    [STRUCTURE_TYPES.Village, '12345', -1, 0, { x: -168, z: 168 }],
    [STRUCTURE_TYPES.Village, '12345', 0, -1, { x: 344, z: -264 }],
];

assert.deepEqual(
    {
        spacing: getBedrockStructureConfig(STRUCTURE_TYPES.Village).spacing,
        spawnRange: getBedrockStructureConfig(STRUCTURE_TYPES.Village).spawnRange,
        salt: getBedrockStructureConfig(STRUCTURE_TYPES.Village).salt,
        source: getBedrockStructureConfig(STRUCTURE_TYPES.Village).source,
    },
    { spacing: 34, spawnRange: 26, salt: 10387312, source: 'cubiomes-bedrock' },
    'Bedrock current village config should use the cubiomes-bedrock 1.18+ spacing/spawn range'
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
    range: 320,
    generator: plainsGenerator,
    structureKeys: ['village'],
});

assert.ok(
    candidates.some(candidate =>
        candidate.key === 'village' &&
        candidate.x === 136 &&
        candidate.z === 280 &&
        candidate.status === 'bedrock-placement-candidate' &&
        candidate.placementSource === 'cubiomes-bedrock'
    ),
    'Bedrock candidate generation should use cubiomes-bedrock placement and expose its candidate status/source'
);

console.log(`Bedrock structure placement: ${cases.length} reference cases`);
