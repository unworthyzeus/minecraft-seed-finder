/**
 * Debug octave lacunarities
 */

import { SurfaceNoiseBeta } from '../lib/cubiomes/perlin.js';

const seed = -4967056375774531896n;
const snb = new SurfaceNoiseBeta(seed);

console.log("=== Octave Lacunarities ===\n");

console.log("octmin:");
for (let i = 0; i < snb.octmin.octcnt; i++) {
    console.log(`  [${i}] lacunarity = ${snb.octmin.octaves[i].lacunarity}`);
}

console.log("\noctmax:");
for (let i = 0; i < snb.octmax.octcnt; i++) {
    console.log(`  [${i}] lacunarity = ${snb.octmax.octaves[i].lacunarity}`);
}

console.log("\noctmain:");
for (let i = 0; i < snb.octmain.octcnt; i++) {
    console.log(`  [${i}] lacunarity = ${snb.octmain.octaves[i].lacunarity}`);
}

console.log("\noctcontA:");
for (let i = 0; i < snb.octcontA.octcnt; i++) {
    console.log(`  [${i}] lacunarity = ${snb.octcontA.octaves[i].lacunarity}`);
}

console.log("\n\nWith lacmin=1.0, how many octaves are skipped?");
const lacmin = 1.0;
let skipped = 0;
for (let i = 0; i < snb.octmin.octcnt; i++) {
    if (lacmin && snb.octmin.octaves[i].lacunarity > lacmin) skipped++;
}
console.log(`octmin: ${skipped} of ${snb.octmin.octcnt} skipped`);
