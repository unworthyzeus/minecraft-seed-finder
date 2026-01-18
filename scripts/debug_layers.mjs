
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers.js';

const seed = 655373745929100166n;
const version = 13;

console.log(`Testing Layer Logic for seed ${seed} version ${version}...`);

try {
    const gen = new LegacyBiomeGenerator(seed, version);

    // Test a specific coord where land is expected?
    // Map center (0,0) usually has land due to mapContinent special case?
    // Let's check mapContinent output for 0,0.

    console.log("--- Continent Layer (1:4096) ---");
    const continentOut = new Int32Array(10 * 10);
    // getMap(layer, out, x, z, w, h)
    gen.layers.continent.getMap(gen.layers.continent, continentOut, 0, 0, 5, 5);
    console.log("Continent (0,0 5x5):");
    printGrid(continentOut, 5, 5);

    console.log("--- ZoomFuzzy Layer (1:2048) ---");
    const zoomOut = new Int32Array(10 * 10);
    gen.layers.zoomFuzzy.getMap(gen.layers.zoomFuzzy, zoomOut, 0, 0, 5, 5);
    console.log("ZoomFuzzy (0,0 5x5):");
    printGrid(zoomOut, 5, 5);

    // Check final
    console.log("--- Final Biome Check ---");
    const p = { x: 0, z: 0 };
    console.log(`Biome at 0,0: ${gen.getBiome(0, 0)}`);

} catch (e) {
    console.error("Generator Error:", e);
    console.error(e.stack);
}

function printGrid(arr, w, h) {
    for (let j = 0; j < h; j++) {
        let line = "";
        for (let i = 0; i < w; i++) {
            line += arr[j * w + i].toString().padStart(3) + " ";
        }
        console.log(line);
    }
}
