
import { setupLayerStack } from './lib/cubiomes/layers.js';

const seed = -4773880749854806539n;
const layers = setupLayerStack(12);
layers.riverMix4.setWorldSeed(seed);

const bx = 0, bz = 0;

function trace(layer, name) {
    const out = new Int32Array(9);
    layer.getMap(layer, out, -1, -1, 3, 3);
    console.log(`\n${name} around (0,0) [scale ${layer.scale}]:`);
    for (let j = 0; j < 3; j++) {
        console.log(out.slice(j * 3, (j + 1) * 3).join('\t'));
    }
}

trace(layers.deepOcean256, "deepOcean256");
trace(layers.riverInit256, "riverInit256");
trace(layers.zoom128River, "zoom128River");
trace(layers.zoom64River, "zoom64River");
trace(layers.zoom32River, "zoom32River");
trace(layers.zoom16River, "zoom16River");
trace(layers.zoom8River, "zoom8River");
trace(layers.zoom4River, "zoom4River");
trace(layers.river4, "river4");
