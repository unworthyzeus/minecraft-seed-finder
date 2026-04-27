import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getStructurePos } from '../lib/cubiomes/structures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localFixturePath = path.resolve(__dirname, 'fixtures/groundtruth_structures.txt');
const externalFixturePath = path.resolve(__dirname, '../../cubiomes/groundtruth_structures.txt');
const fixturePath = fs.existsSync(localFixturePath) ? localFixturePath : externalFixturePath;

if (!fs.existsSync(fixturePath)) {
    console.error(`Missing structure ground truth: ${fixturePath}`);
    process.exit(1);
}

const lines = fs.readFileSync(fixturePath, 'utf8').trim().split(/\r?\n/).slice(1);
let passed = 0;
let failed = 0;
const failures = [];

for (const line of lines) {
    const [mcRaw, structureRaw, seed, regXRaw, regZRaw, okRaw, xRaw, zRaw] = line.split(',');
    const mc = Number(mcRaw);
    const structure = Number(structureRaw);
    const regX = Number(regXRaw);
    const regZ = Number(regZRaw);
    const ok = Number(okRaw) === 1;
    const expected = ok ? { x: Number(xRaw), z: Number(zRaw) } : null;
    const actual = getStructurePos(structure, mc, BigInt(seed), regX, regZ);

    const matches = expected === null
        ? actual === null
        : actual !== null && actual.x === expected.x && actual.z === expected.z;

    if (matches) {
        passed++;
    } else {
        failed++;
        if (failures.length < 25) {
            failures.push({ mc, structure, seed, regX, regZ, expected, actual });
        }
    }
}

console.log(`Structure placement: ${passed}/${lines.length} passed`);
if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
}
