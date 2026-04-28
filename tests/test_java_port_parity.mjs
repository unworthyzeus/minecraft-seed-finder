import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { strict as assert } from 'assert';

import { getStructurePos } from '../lib/cubiomes/structures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const structuresPath = path.resolve(__dirname, 'fixtures/groundtruth_structures.txt');

const structureLines = fs.readFileSync(structuresPath, 'utf8').trim().split(/\r?\n/).slice(1);
let structureChecks = 0;

for (const line of structureLines) {
    const [mcRaw, structureRaw, seed, regXRaw, regZRaw, okRaw, xRaw, zRaw] = line.split(',');
    const mc = Number(mcRaw);
    const structure = Number(structureRaw);
    const regX = Number(regXRaw);
    const regZ = Number(regZRaw);
    const expected = Number(okRaw) === 1 ? { x: Number(xRaw), z: Number(zRaw) } : null;
    const actual = getStructurePos(structure, mc, BigInt(seed), regX, regZ);

    assert.deepEqual(
        actual,
        expected,
        `Java structure parity mismatch mc=${mc} structure=${structure} seed=${seed} region=${regX},${regZ}`
    );
    structureChecks++;
}

console.log(`Java port parity: ${structureChecks} Cubiomes structure placement checks`);
