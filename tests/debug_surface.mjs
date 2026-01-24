/**
 * Deep debug Beta 1.7 surface noise
 */

import { BiomeNoiseBeta, SurfaceNoiseBeta } from '../lib/cubiomes/perlin.js';
import { getOldBetaBiome } from '../lib/cubiomes/beta_biomes.js';

const seed = -4967056375774531896n;
const x = -814;  // block coord
const z = -2870;

console.log("=== Deep Debug Beta 1.7 Surface Noise ===");
console.log(`Seed: ${seed}`);
console.log(`Block coords: (${x}, ${z})`);

const bnb = new BiomeNoiseBeta(seed);
const snb = new SurfaceNoiseBeta(seed);

// Sample climate
const [t, h] = bnb.sample(x, z);
console.log(`\nClimate: T=${t}, H=${h}`);

// Surface noise calculation
const cx = x * 0.25;
const cz = z * 0.25;
const lacmin = 1.0;

console.log(`\nSurface sample coords: cx=${cx}, cz=${cz}, lacmin=${lacmin}`);

// Debug each component
const contASample = snb.octcontA.sampleAmp(cx, 0, cz, 0, 0, 1);
const contBSample = snb.octcontB.sampleAmp(cx, 0, cz, 0, 0, 1);
console.log(`\ncontASample = ${contASample}`);
console.log(`contBSample = ${contBSample}`);

const minSample = [0, 0];
const maxSample = [0, 0];
const mainSample = [0, 0];

snb.octmin.sampleBeta17Terrain(minSample, cx, cz, 0, lacmin);
snb.octmax.sampleBeta17Terrain(maxSample, cx, cz, 0, lacmin);
snb.octmain.sampleBeta17Terrain(mainSample, cx, cz, 1, lacmin);

console.log(`\nminSample = [${minSample[0]}, ${minSample[1]}]`);
console.log(`maxSample = [${maxSample[0]}, ${maxSample[1]}]`);
console.log(`mainSample = [${mainSample[0]}, ${mainSample[1]}]`);

// processColumnNoise logic
let humi = 1 - t * h;
console.log(`\nhumi (initial) = 1 - ${t} * ${h} = ${humi}`);
let humi2 = humi * humi;
let humi4 = humi2 * humi2;
let humiF = 1 - humi4;
console.log(`humi^4 = ${humi4}`);
console.log(`humiF = 1 - humi^4 = ${humiF}`);

let contA = (contASample + 256) / 512 * humiF;
console.log(`\ncontA (before clamp) = (${contASample} + 256) / 512 * ${humiF} = ${contA}`);
contA = (contA > 1) ? 1.0 : contA;
console.log(`contA (after clamp) = ${contA}`);

let contB = contBSample / 8000;
console.log(`\ncontB (initial) = ${contBSample} / 8000 = ${contB}`);
if (contB < 0) contB = -contB * 0.3;
console.log(`contB (after abs if neg) = ${contB}`);
contB = contB * 3 - 2;
console.log(`contB (after *3-2) = ${contB}`);

if (contB < 0) {
    contB /= 2;
    contB = (contB < -1) ? -1.0 / 1.4 / 2 : contB / 1.4 / 2;
    contA = 0;
    console.log(`contB < 0 branch: contB = ${contB}, contA = ${contA}`);
} else {
    contB = (contB > 1) ? 1.0 / 8 : contB / 8;
    console.log(`contB >= 0 branch: contB = ${contB}`);
}

contA = (contA < 0) ? 0.5 : contA + 0.5;
console.log(`\ncontA (final) = ${contA}`);
contB = (contB * 17.0) / 16;
contB = 17.0 / 2 + contB * 4;
console.log(`contB (final) = ${contB}`);

console.log("\n--- Column processing ---");
const cols = [0, 0];
for (let i = 0; i <= 1; i++) {
    let procCont = ((i + 7 - contB) * 12) / contA;
    console.log(`\n[i=${i}] procCont (initial) = ((${i} + 7 - ${contB}) * 12) / ${contA} = ${procCont}`);
    if (procCont < 0) procCont *= 4;
    console.log(`[i=${i}] procCont (after *4 if <0) = ${procCont}`);

    const lSample = minSample[i] / 512;
    const hSample = maxSample[i] / 512;
    const sSample = (mainSample[i] / 10 + 1) / 2;
    console.log(`[i=${i}] lSample=${lSample}, hSample=${hSample}, sSample=${sSample}`);

    let chooseLHS = (sSample < 0.0) ? lSample : (sSample > 1) ? hSample :
        lSample + (hSample - lSample) * sSample;
    console.log(`[i=${i}] chooseLHS (before procCont) = ${chooseLHS}`);
    chooseLHS -= procCont;
    console.log(`[i=${i}] chooseLHS (final) = ${chooseLHS}`);
    cols[i] = chooseLHS;
}

console.log(`\nFinal cols = [${cols[0]}, ${cols[1]}]`);
const surfaceVal = cols[0] * 0.125 + cols[1] * 0.875;
console.log(`0.125*cols[0] + 0.875*cols[1] = ${surfaceVal}`);
console.log(`Is ocean (<=0)? ${surfaceVal <= 0}`);
