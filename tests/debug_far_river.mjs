
import { setupLayerStack } from '../lib/cubiomes/layers.js';

const seed = 2821132221990690918n;
const layers = setupLayerStack(12);
layers.riverMix4.setWorldSeed(seed);

const px = Math.floor(5000 / 64);
const pz = Math.floor(5000 / 64);

const deep256 = new Int32Array(9);
layers.deepOcean256.getMap(layers.deepOcean256, deep256, px - 1, pz - 1, 3, 3);
console.log(`deepOcean256 around (${px}, ${pz}):`);
for (let j = 0; j < 3; j++) {
    console.log(deep256.slice(j * 3, (j + 1) * 3).join(' '));
}

const riv256 = new Int32Array(9);
layers.riverInit256.getMap(layers.riverInit256, riv256, px - 1, pz - 1, 3, 3);
console.log(`\nriverInit256 around (${px}, ${pz}):`);
for (let j = 0; j < 3; j++) {
    console.log(riv256.slice(j * 3, (j + 1) * 3).join(' '));
}
