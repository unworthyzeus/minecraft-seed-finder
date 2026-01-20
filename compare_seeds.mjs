
import { LegacyBiomeGenerator, getLayerSalt } from './lib/cubiomes/layers.js';

const SEED = 111n;
const VER = 12;

const gen = new LegacyBiomeGenerator(SEED, VER);

console.log("Layer seed info for Seed 111 (1.12) [JS]:");

const continent = gen.layers.continent;
console.log(`continent: layerSalt=${continent.layerSalt} startSalt=${continent.startSalt} startSeed=${continent.startSeed}`);

const biome256 = gen.layers.biome256;
console.log(`biome256: layerSalt=${biome256.layerSalt} startSalt=${biome256.startSalt} startSeed=${biome256.startSeed}`);

const biome = gen.getBiome(0, 0);
console.log(`\nBiome at (0,0): ${biome}`);

// Compare with C values
console.log("\n--- C cubiomes values ---");
console.log("continent: layerSalt=3107951898966440229 startSalt=10580154208347602491 startSeed=12818622829490322970");
console.log("biome256: layerSalt=3038466749335869312 startSalt=11755017755167727086 startSeed=7865349641709733734");
