/**
 * Debug single octave of Beta17Terrain
 */

import { SurfaceNoiseBeta } from '../lib/cubiomes/perlin.js';

const seed = -4967056375774531896n;
const cx = -203.5;
const cz = -717.5;

console.log("=== Debug Single Octave ===");

const snb = new SurfaceNoiseBeta(seed);

// Check octmin's first octave properties
const p0 = snb.octmin.octaves[0];
console.log(`\nOctave 0 properties:`);
console.log(`  a = ${p0.a}`);
console.log(`  b = ${p0.b}`);
console.log(`  c = ${p0.c}`);
console.log(`  lacunarity = ${p0.lacunarity}`);
console.log(`  amplitude = ${p0.amplitude}`);

// Sample just this one octave manually for comparison
// sampleBeta17Terrain does: d1 = x * lacunarity, d3 = z * lacunarity
const lf = p0.lacunarity;
console.log(`\nSample coords: x*lf = ${cx * lf}, z*lf = ${cz * lf}`);

// Test the output of the full sampleBeta17Terrain
const result = [0, 0];
snb.octmin.sampleBeta17Terrain(result, cx, cz, 0, 1.0);
console.log(`\nSampled minSample via sampleBeta17Terrain: [${result[0]}, ${result[1]}]`);
