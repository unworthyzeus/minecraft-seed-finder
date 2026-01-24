
import { setupLayerStack } from '../lib/cubiomes/layers.js';

const seed = -1291858280428663872n;
const layers = setupLayerStack(12);
layers.riverMix4.setWorldSeed(seed);

function trace(layer, name) {
    const out = new Int32Array(1);
    layer.getMap(layer, out, 0, 0, 1, 1);
    console.log(`${name}: ${out[0]}`);
    return out[0];
}

console.log("Tracing Seed -1291858280428663872 at (0,0):");
trace(layers.special1024, "special1024");
trace(layers.biome256, "biome256");
trace(layers.zoom128, "zoom128");
trace(layers.zoom64, "zoom64");
trace(layers.biomeEdge64, "biomeEdge64");
trace(layers.hills64, "hills64");
trace(layers.sunflower64, "sunflower64");
trace(layers.zoom32, "zoom32");
trace(layers.land32, "land32");
trace(layers.zoom16, "zoom16");
trace(layers.shore16, "shore16");
trace(layers.riverMix4, "riverMix4");
