
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';
import { BiomeNames } from './lib/cubiomes/core.js';

const seed = 83n; // This seed works at origin but fails far
const gen = new LegacyBiomeGenerator(seed, 12);

function sampleLayerAt(layerName, x, z) {
    const layer = gen.layers[layerName];
    if (!layer) return 'N/A';
    const out = new Int32Array(1);
    layer.getMap(layer, out, x, z, 1, 1);
    return out[0];
}

console.log(`Seed ${seed} (1.12):`);
console.log("\n=== At origin (0,0) - PASSES ===");
console.log(`biome256: ${sampleLayerAt('biome256', 0, 0)}`);
console.log(`riverMix4: ${sampleLayerAt('riverMix4', 0, 0)} (${BiomeNames[sampleLayerAt('riverMix4', 0, 0)]})`);
console.log(`getBiome(0,0): ${gen.getBiome(0, 0)} Expected: 162`);

console.log("\n=== At far (5000,5000) -> biome coord (1250,1250) - FAILS ===");
const bx = Math.floor(5000 / 4);
const bz = Math.floor(5000 / 4);
console.log(`biome256 at continent scale (${Math.floor(bx / 64)}, ${Math.floor(bz / 64)}): ${sampleLayerAt('biome256', Math.floor(bx / 64), Math.floor(bz / 64))}`);
console.log(`riverMix4 @ (${bx},${bz}): ${sampleLayerAt('riverMix4', bx, bz)} (${BiomeNames[sampleLayerAt('riverMix4', bx, bz)]})`);
console.log(`getBiome(5000,5000): ${gen.getBiome(5000, 5000)} Expected: 0 (Ocean)`);
