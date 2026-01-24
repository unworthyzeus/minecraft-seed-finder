
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers.js';
import { BiomeNames } from '../lib/cubiomes/core.js';

const gen = new LegacyBiomeGenerator(111n, 12);

function sampleLayerAt(layerName, x, z) {
    const layer = gen.layers[layerName];
    if (!layer) return `Layer ${layerName} not found`;
    const out = new Int32Array(1);
    layer.getMap(layer, out, x, z, 1, 1);
    return out[0];
}

// Test getBiome at block coords
console.log("Seed 111 (1.12):");
console.log(`getBiome(0, 0): ${gen.getBiome(0, 0)} (Expected: 2 Desert)`);
console.log(`getBiome(1000, 0): ${gen.getBiome(1000, 0)} (Expected: 6 Swamp)`);

// Sample riverMix4 at biome coords
console.log("\nDirect layer sampling at biome coords:");
console.log(`riverMix4 @ (0,0): ${sampleLayerAt('riverMix4', 0, 0)}`);
console.log(`riverMix4 @ (250,0): ${sampleLayerAt('riverMix4', 250, 0)} (Expected: 6 for block 1000,0)`);
