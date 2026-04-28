import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { strict as assert } from 'assert';

import { Generator } from '../lib/cubiomes/generator.js';
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CUBIOMES_GT_CANDIDATES = [
    process.env.CUBIOMES_GT_FILE,
    path.resolve(__dirname, '../../cubiomes-original/ground_truth.txt'),
    path.resolve(__dirname, '../../cubiomes/ground_truth.txt'),
].filter(Boolean);

const fixturePath = CUBIOMES_GT_CANDIDATES.find(candidate => fs.existsSync(candidate));

if (!fixturePath) {
    console.warn('Java Cubiomes GT skipped: set CUBIOMES_GT_FILE or keep ../cubiomes-original/ground_truth.txt available.');
    process.exit(0);
}

const C_VERSION_MAP = new Map([
    [2, { name: 'B1.8', js: 2, legacy: true }],
    [3, { name: '1.0', js: 3, legacy: true }],
    [4, { name: '1.1', js: 4, legacy: true }],
    [5, { name: '1.2', js: 5, legacy: true }],
    [6, { name: '1.3', js: 6, legacy: true }],
    [7, { name: '1.4', js: 7, legacy: true }],
    [8, { name: '1.5', js: 8, legacy: true }],
    [9, { name: '1.6', js: 9, legacy: true }],
    [10, { name: '1.7', js: 10, legacy: true }],
    [11, { name: '1.8', js: 11, legacy: true }],
    [12, { name: '1.9', js: 12, legacy: true }],
    [13, { name: '1.10', js: 13, legacy: true }],
    [14, { name: '1.11', js: 14, legacy: true }],
    [15, { name: '1.12', js: 15, legacy: true }],
    [16, { name: '1.13', js: 16, legacy: true }],
    [17, { name: '1.14', js: 17, legacy: true }],
    [18, { name: '1.15', js: 18, legacy: true }],
    [19, { name: '1.16.1', js: 19, legacy: true }],
    [20, { name: '1.16', js: 20, legacy: true }],
    [21, { name: '1.17', js: 21, legacy: true }],
    [22, { name: '1.18', js: 18, modern: true }],
    [23, { name: '1.19.2', js: 19.2, modern: true }],
    [24, { name: '1.19', js: 19, modern: true }],
    [25, { name: '1.20', js: 20, modern: true }],
    [28, { name: '1.21', js: 21, modern: true }],
]);

const modernGenerator = new Generator();
const results = new Map();
const failures = [];
let checks = 0;
let skippedBeta17 = 0;

function getResult(cVersion) {
    if (!results.has(cVersion)) {
        results.set(cVersion, { passed: 0, total: 0 });
    }
    return results.get(cVersion);
}

for (const line of fs.readFileSync(fixturePath, 'utf8').split(/\r?\n/)) {
    const cleaned = line.trim();
    if (!cleaned) continue;

    const [cVersionRaw, seedRaw, originRaw, farRaw] = cleaned.split(/\s+/);
    const cVersion = Number(cVersionRaw);
    const versionInfo = C_VERSION_MAP.get(cVersion);

    if (!versionInfo) {
        if (cVersion === 1) skippedBeta17++;
        continue;
    }

    const seed = BigInt(seedRaw);
    const expectedOrigin = Number(originRaw);
    const expectedFar = Number(farRaw);
    let actualOrigin;
    let actualFar;

    if (versionInfo.legacy) {
        const generator = new LegacyBiomeGenerator(seed, versionInfo.js);
        actualOrigin = generator.getBiome(0, 0);
        actualFar = generator.getBiome(20000, 20000);
    } else {
        modernGenerator.setupGenerator(versionInfo.js);
        modernGenerator.applySeed(seed);
        actualOrigin = modernGenerator.getBiomeAt(4, 0, 64, 0);
        actualFar = modernGenerator.getBiomeAt(4, 5000, 64, 5000);
    }

    const result = getResult(cVersion);
    const samples = [
        ['origin', actualOrigin, expectedOrigin],
        ['far', actualFar, expectedFar],
    ];

    for (const [where, actual, expected] of samples) {
        result.total++;
        checks++;
        if (actual === expected) {
            result.passed++;
            continue;
        }
        if (failures.length < 25) {
            failures.push({
                version: versionInfo.name,
                seed: seedRaw,
                where,
                expected,
                actual,
            });
        }
    }
}

assert.equal(
    failures.length,
    0,
    `Java Cubiomes GT mismatches:\n${JSON.stringify(failures, null, 2)}`
);

const summary = [...results.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, result]) => `${result.passed}/${result.total}`)
    .join(', ');

console.log(`Java Cubiomes GT: ${checks} biome checks passed (${summary}); skipped ${skippedBeta17} Beta 1.7 samples`);
