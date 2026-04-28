import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { BedrockBiomeGenerator, normalizeBedrockSeed } from '../lib/cubiomes/bedrock.js';
import {
    BEDROCK_WORLDGEN_VERSION_OPTIONS,
    CURRENT_MINECRAFT_VERSIONS,
} from '../lib/version-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, 'fixtures/groundtruth_bedrock_generation.json');

const versions = [...new Set([
    CURRENT_MINECRAFT_VERSIONS.bedrock.version,
    ...BEDROCK_WORLDGEN_VERSION_OPTIONS.map(option => option.value),
])];

const seeds = ['0', '1', '-1', '12345', '2147483648', '8398967436125155523', 'Glacier'];
const biomePoints = [
    { x: 0, y: 64, z: 0 },
    { x: 64, y: 64, z: -64 },
    { x: 128, y: 70, z: -256 },
    { x: -512, y: 72, z: 512 },
    { x: -2048, y: 80, z: 1536 },
    { x: 4096, y: 64, z: -4096 },
    { x: 0, y: -40, z: 0 },
    { x: 512, y: -20, z: 512 },
];

const structureSeeds = ['0', '12345', '2147483648', '8398967436125155523'];
const structureKeys = [
    'village',
    'ruined_portal',
    'shipwreck',
    'buried_treasure',
    'ancient_city',
    'trial_chambers',
];

function summarizeStructures(structures) {
    return structures
        .map(item => ({
            key: item.key,
            x: item.x,
            z: item.z,
            status: item.status,
            biome: item.biome,
        }))
        .sort((a, b) => a.key.localeCompare(b.key) || a.x - b.x || a.z - b.z)
        .slice(0, 12);
}

const fixture = {
    format: 2,
    generatedAt: '2026-04-28',
    source: 'BedrockBiomeGenerator golden output matrix with MCBE-style placement candidates',
    versions,
    seeds,
    biomePoints,
    structureSeeds,
    structureKeys,
    normalizations: [
        {
            seed: '2147483648',
            version: '1.17',
            expected: normalizeBedrockSeed('2147483648', '1.17').toString(),
        },
        {
            seed: '2147483648',
            version: CURRENT_MINECRAFT_VERSIONS.bedrock.version,
            expected: normalizeBedrockSeed('2147483648', CURRENT_MINECRAFT_VERSIONS.bedrock.version).toString(),
        },
    ],
    biomeSamples: [],
    structureSamples: [],
};

for (const version of versions) {
    for (const seed of seeds) {
        const generator = new BedrockBiomeGenerator(seed, version);
        for (const point of biomePoints) {
            fixture.biomeSamples.push({
                version,
                seed,
                ...point,
                biome: generator.getBiomeAtY(point.x, point.y, point.z),
            });
        }
    }

    for (const seed of structureSeeds) {
        const generator = new BedrockBiomeGenerator(seed, version);
        fixture.structureSamples.push({
            version,
            seed,
            structures: summarizeStructures(generator.getStructures({
                centerX: 0,
                centerZ: 0,
                range: 768,
                structureKeys,
            })),
        });
    }
}

fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`Wrote ${fixturePath}`);
