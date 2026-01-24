/**
 * Debug a single octave's Beta17Terrain sampling
 */

import { SurfaceNoiseBeta } from '../lib/cubiomes/perlin.js';

const seed = -4967056375774531896n;
const cx = -203.5;
const cz = -717.5;

console.log("=== Debug Single Octave Sampling ===");

const snb = new SurfaceNoiseBeta(seed);

// Test octave 10 specifically (first one that isn't skipped with lacmin=1.0)
const oct = snb.octmin.octaves[10];
console.log(`\nOctave 10 properties:`);
console.log(`  a = ${oct.a}`);
console.log(`  b = ${oct.b}`);
console.log(`  c = ${oct.c}`);
console.log(`  lacunarity = ${oct.lacunarity}`);
console.log(`  amplitude = ${oct.amplitude}`);

// Sample coordinates after lacunarity scaling
const lf = oct.lacunarity;
const ax = cx * lf;  // maintainPrecision would be identity for small values
const az = cz * lf;
console.log(`\nScaled coords: ax=${ax}, az=${az}`);

// What sampleBeta17Terrain does:
// It calls oct.sampleBeta17Terrain(v, ax, az, yLacFlag ? 0.5 : 1.0)
// where yLacFlag = 0 for octmin

const v = [0, 0];
oct.sampleBeta17Terrain(v, ax, az, 1.0);  // yLacAmp = 1.0 since yLacFlag = 0
console.log(`\nOctave 10 output: [${v[0]}, ${v[1]}]`);

// The output gets multiplied by amplitude and added to the result
console.log(`Contribution = amplitude * output = ${oct.amplitude} * [${v[0]}, ${v[1]}]`);
console.log(`            = [${oct.amplitude * v[0]}, ${oct.amplitude * v[1]}]`);
