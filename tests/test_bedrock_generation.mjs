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

if (!fs.existsSync(fixturePath)) {
    console.error(`Missing Bedrock generation ground truth: ${fixturePath}`);
    console.error('Run: node tests/generate_bedrock_groundtruth.mjs');
    process.exit(1);
}

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const fixtureVersions = new Set(fixture.versions);
const expectedVersions = new Set([
    CURRENT_MINECRAFT_VERSIONS.bedrock.version,
    ...BEDROCK_WORLDGEN_VERSION_OPTIONS.map(option => option.value),
]);

for (const version of expectedVersions) {
    if (!fixtureVersions.has(version)) {
        throw new Error(`Bedrock ground truth does not cover selectable version ${version}`);
    }
}

let checks = 0;
const failures = [];

for (const sample of fixture.biomeSamples) {
    const generator = new BedrockBiomeGenerator(sample.seed, sample.version);
    const actual = generator.getBiomeAtY(sample.x, sample.y, sample.z);
    if (actual !== sample.biome) {
        failures.push({
            type: 'biome',
            version: sample.version,
            seed: sample.seed,
            x: sample.x,
            y: sample.y,
            z: sample.z,
            expected: sample.biome,
            actual,
        });
    }
    checks++;
}

for (const sample of fixture.structureSamples) {
    const generator = new BedrockBiomeGenerator(sample.seed, sample.version);
    const actual = generator.getStructures({
        centerX: 0,
        centerZ: 0,
        range: 768,
        structureKeys: fixture.structureKeys,
    })
        .map(item => ({
            key: item.key,
            x: item.x,
            z: item.z,
            status: item.status,
            biome: item.biome,
        }))
        .sort((a, b) => a.key.localeCompare(b.key) || a.x - b.x || a.z - b.z)
        .slice(0, 12);

    if (JSON.stringify(actual) !== JSON.stringify(sample.structures)) {
        failures.push({
            type: 'structures',
            version: sample.version,
            seed: sample.seed,
            expected: sample.structures,
            actual,
        });
    }
    checks++;
}

for (const sample of fixture.normalizations) {
    const actual = normalizeBedrockSeed(sample.seed, sample.version).toString();
    if (actual !== sample.expected) {
        failures.push({
            type: 'normalization',
            version: sample.version,
            seed: sample.seed,
            expected: sample.expected,
            actual,
        });
    }
    checks++;
}

if (failures.length > 0) {
    console.error(JSON.stringify(failures.slice(0, 25), null, 2));
    throw new Error(`Bedrock generation ground truth failed: ${failures.length} mismatches`);
}

console.log(`Bedrock generation ground truth: ${checks} checks across ${fixtureVersions.size} versions`);
