/**
 * Deep debug - trace mapShore layer directly
 */

import fs from 'fs';

// Import necessary functions from layers.js
// We'll create a modified version to trace the issue

const MC_1_0 = 3;
const mushroom_fields = 14;
const mushroom_field_shore = 15;
const ocean = 0;

// Recreate the test scenario  
const seed = 2798839568882297658n;

// The test coordinates in scale 4
const testX4 = -4619598;
const testZ4 = -6416195;

// Convert to scale 16 coords (shore layer operates at scale 16)
// But mapShore processes at its own scale - need to understand the layer setup better

console.log("=== Deep Debug: MC 1.0 Mushroom Shore Issue ===");
console.log(`Seed: ${seed}`);
console.log(`Test coords (scale 4): (${testX4}, ${testZ4})`);
console.log("");

// Let's import and run with the actual generator
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers.js';

const gen = new LegacyBiomeGenerator(seed, MC_1_0);

// The generator should have layers - let's check what's in them
console.log("Layer stack:");
const layerNames = Object.keys(gen.layers);
for (const name of layerNames) {
    const layer = gen.layers[name];
    console.log(`  ${name}: scale=${layer.scale}, salt=${layer.layerSalt}`);
}

// Now let's manually check the shore16 layer input
console.log("\n=== Checking shore16 parent output ===");

const shore16 = gen.layers.shore16;
if (!shore16) {
    console.log("shore16 layer not found!");
    process.exit(1);
}

const parent = shore16.p;
console.log(`shore16 parent: scale=${parent?.scale}`);

// The shore layer at scale 16 covers scale-16 coordinates
// To get scale-4 coord (-4619598, -6416195), we need to understand the zoom chain

// Scale 4 coord / 4 = Scale 16 coord (approximately)
const scale16X = Math.floor(testX4 / 4);
const scale16Z = Math.floor(testZ4 / 4);

console.log(`Scale 16 coords: (${scale16X}, ${scale16Z})`);

// Get a small buffer from the parent layer (before shore processing)
const pW = 5, pH = 5;
const pX = scale16X - 2, pZ = scale16Z - 2;
const parentBuf = new Int32Array(pW * pH);

if (parent && parent.getMap) {
    parent.getMap(parent, parentBuf, pX, pZ, pW, pH);

    console.log("\nParent layer output (before shore):");
    for (let j = 0; j < pH; j++) {
        let row = "";
        for (let i = 0; i < pW; i++) {
            row += parentBuf[i + j * pW].toString().padStart(3) + " ";
        }
        console.log(row);
    }

    // Check if there's ocean around center cell
    const cx = 2, cz = 2;  // center of 5x5
    const v11 = parentBuf[cx + cz * pW];
    const v10 = parentBuf[cx + (cz - 1) * pW];  // north
    const v21 = parentBuf[(cx + 1) + cz * pW];  // east
    const v01 = parentBuf[(cx - 1) + cz * pW];  // west
    const v12 = parentBuf[cx + (cz + 1) * pW];  // south

    console.log(`\nCenter cell (${scale16X}, ${scale16Z}): ${v11}`);
    console.log(`Neighbors: N=${v10}, E=${v21}, W=${v01}, S=${v12}`);
    console.log(`Any neighbor is ocean (0)? ${v10 === 0 || v21 === 0 || v01 === 0 || v12 === 0}`);

    if (v11 === mushroom_fields) {
        const shouldBeShore = v10 === ocean || v21 === ocean || v01 === ocean || v12 === ocean;
        console.log(`Center is mushroom_fields, should be shore: ${shouldBeShore}`);
    }
}

// Now check shore16 output
const shoreOut = new Int32Array(pW * pH);
shore16.getMap(shore16, shoreOut, pX, pZ, pW, pH);

console.log("\nShore layer output:");
for (let j = 0; j < pH; j++) {
    let row = "";
    for (let i = 0; i < pW; i++) {
        row += shoreOut[i + j * pW].toString().padStart(3) + " ";
    }
    console.log(row);
}
