
import { setupLayerStack } from '../lib/cubiomes/layers.js';

const seed = -3143305535080761978n;
const layers = setupLayerStack(12);
layers.riverMix4.setWorldSeed(seed);

const smooth4 = new Int32Array(1);
const smoothRiver4 = new Int32Array(1);

layers.smooth4.getMap(layers.smooth4, smooth4, 0, 0, 1, 1);
layers.smoothRiver4.getMap(layers.smoothRiver4, smoothRiver4, 0, 0, 1, 1);

console.log("smooth4(0,0):", smooth4[0]);
console.log("smoothRiver4(0,0):", smoothRiver4[0]);

const riv4 = new Int32Array(1);
layers.river4.getMap(layers.river4, riv4, 0, 0, 1, 1);
console.log("river4(0,0):", riv4[0]);

const zoom4R = new Int32Array(9);
layers.zoom4River.getMap(layers.zoom4River, zoom4R, -1, -1, 3, 3);
console.log("zoom4River around (0,0):");
for (let j = 0; j < 3; j++) {
    console.log(zoom4R.slice(j * 3, (j + 1) * 3).join(' '));
}
