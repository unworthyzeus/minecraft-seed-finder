/**
 * Debug Beta biome generation for a specific test case
 */

import { LegacyBiomeGenerator, MC_B1_7 } from '../lib/cubiomes/layers.js';
import { BiomeNoiseBeta, SurfaceNoiseBeta } from '../lib/cubiomes/perlin.js';
import { getOldBetaBiome } from '../lib/cubiomes/beta_biomes.js';

// Pick a failing case from the log:
// Beta 1.7	-4967056375774531896	-204	-718	12	10	snowy_tundra	frozen_ocean
// JS got: 12 (snowy_tundra), expected: 10 (frozen_ocean)

const seed = -4967056375774531896n;
const x = -204;  // scale-4 coordinate
const z = -718;  // scale-4 coordinate

console.log("=== Debug Beta 1.7 Biome ===");
console.log(`Seed: ${seed}`);
console.log(`Scale-4 coords: (${x}, ${z})`);

// Convert to block coords (what test does)
const bx = x * 4;
const bz = z * 4;
console.log(`Block coords (x*4): (${bx}, ${bz})`);

// What C code does: add mid offset
const sx = bx + 2;
const sz = bz + 2;
console.log(`Sample coords (bx+2): (${sx}, ${sz})`);

// Create the generator
const gen = new LegacyBiomeGenerator(seed, MC_B1_7);

// Get biome
const biome = gen.getBiome(bx, bz);
console.log(`\nJS result: ${biome}`);

// Debug: manually test climate and surface noise
const bnb = new BiomeNoiseBeta(seed);
const snb = new SurfaceNoiseBeta(seed);

const [t, h] = bnb.sample(sx, sz);
console.log(`\nClimate at (${sx}, ${sz}):`);
console.log(`  Temperature: ${t}`);
console.log(`  Humidity: ${h}`);

const climateBiome = getOldBetaBiome(t, h);
console.log(`  Climate biome: ${climateBiome}`);

// Surface noise
const cols = snb.sample(sx, sz, [t, h]);
console.log(`\nSurface noise cols: [${cols[0]}, ${cols[1]}]`);
const surfaceVal = cols[0] * 0.125 + cols[1] * 0.875;
console.log(`0.125*cols[0] + 0.875*cols[1] = ${surfaceVal}`);
console.log(`Is ocean? ${surfaceVal <= 0}`);

if (surfaceVal <= 0) {
    const oceanType = (t < 0.5) ? 10 : 0;  // frozen_ocean : ocean
    console.log(`Ocean type (t<0.5?): ${t < 0.5 ? 'frozen_ocean (10)' : 'ocean (0)'} = ${oceanType}`);
}

console.log("\n=== Expected: 10 (frozen_ocean) ===");
