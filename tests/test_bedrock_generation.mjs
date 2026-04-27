import data from '../lib/seeds-data.json' with { type: 'json' };
import { BedrockBiomeGenerator, normalizeBedrockSeed } from '../lib/cubiomes/bedrock.js';
import { CURRENT_MINECRAFT_VERSIONS } from '../lib/version-utils.js';

const versions = new Set([CURRENT_MINECRAFT_VERSIONS.bedrock.version]);
for (const seed of data) {
    if (seed.version?.bedrock) versions.add(seed.version.bedrock);
}

const sampleSeeds = ['0', '1', '-1', '2147483648', '8398967436125155523', 'Glacier'];
const samplePoints = [
    [0, 0],
    [128, -256],
    [-2048, 1536],
];

let checks = 0;
for (const version of versions) {
    const generator = new BedrockBiomeGenerator('12345', version);
    for (const [x, z] of samplePoints) {
        const biome = generator.getBiome(x, z);
        if (!Number.isInteger(biome) || biome < -1) {
            throw new Error(`Invalid Bedrock biome ${biome} for version=${version} at ${x},${z}`);
        }
        checks++;
    }
}

for (const version of ['1.11.0', '1.17', '1.18', '1.20', '1.21', CURRENT_MINECRAFT_VERSIONS.bedrock.version]) {
    for (const seed of sampleSeeds) {
        const generator = new BedrockBiomeGenerator(seed, version);
        const structures = generator.getStructures({ centerX: 0, centerZ: 0, range: 768 });
        if (!Array.isArray(structures)) {
            throw new Error(`Bedrock structures did not return an array for seed=${seed} version=${version}`);
        }
        checks++;
    }
}

if (normalizeBedrockSeed('2147483648', '1.17').toString() !== '-2147483648') {
    throw new Error('Pre-1.18 Bedrock seed normalization should use signed 32-bit seeds');
}

if (normalizeBedrockSeed('2147483648', CURRENT_MINECRAFT_VERSIONS.bedrock.version).toString() !== '2147483648') {
    throw new Error('Current Bedrock seed normalization should preserve 64-bit numeric seeds');
}

console.log(`Bedrock generation smoke checks: ${checks}`);
