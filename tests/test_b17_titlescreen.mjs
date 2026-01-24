
import { LegacyBiomeGenerator, MC_B1_7 } from '../lib/cubiomes/layers.js';

const seed = 12345n;
const x = 61, z = -68;

const gen = new LegacyBiomeGenerator(seed, MC_B1_7);
const biome = gen.getBiome(x, z);

const names = {
    0: 'ocean', 1: 'plains', 2: 'desert', 4: 'forest', 5: 'taiga', 6: 'swamp',
    10: 'frozen_ocean', 12: 'snowy_tundra', 35: 'savanna',
    51: 'seasonal_forest', 52: 'rainforest', 53: 'shrubland'
};

console.log(`Seed: ${seed}`);
console.log(`Coord: (${x}, ${z})`);
console.log(`Biome ID: ${biome}`);
console.log(`Biome Name: ${names[biome] || 'unknown'}`);

// Sample a few points around
for (let dz = -2; dz <= 2; dz++) {
    let line = "";
    for (let dx = -2; dx <= 2; dx++) {
        const b = gen.getBiome(x + dx, z + dz);
        line += b.toString().padStart(3) + " ";
    }
    console.log(line);
}
