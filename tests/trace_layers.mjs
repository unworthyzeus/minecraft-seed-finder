
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers.js';
import { BiomeNames } from '../lib/cubiomes/core.js';

// Trace layer outputs for Seed 1 (1.16)
const SEED = 1n;
const VER = 16;

const gen = new LegacyBiomeGenerator(SEED, VER);

function sampleLayer(name) {
    const layer = gen.layers[name];
    if (!layer) return `Layer ${name} not found`;
    const out = new Int32Array(1);
    layer.getMap(layer, out, 0, 0, 1, 1);
    return out[0];
}

console.log(`Trace for Seed ${SEED} (1.${VER}):`);
console.log(`continent: ${sampleLayer('continent')}`);
console.log(`zoomFuzzy: ${sampleLayer('zoomFuzzy')}`);
console.log(`land2048: ${sampleLayer('land2048')}`);
console.log(`zoom1024: ${sampleLayer('zoom1024')}`);
console.log(`land1024a: ${sampleLayer('land1024a')}`);
console.log(`land1024b: ${sampleLayer('land1024b')}`);
console.log(`land1024c: ${sampleLayer('land1024c')}`);
console.log(`island1024: ${sampleLayer('island1024')}`);
console.log(`snow1024: ${sampleLayer('snow1024')}`);
console.log(`land1024d: ${sampleLayer('land1024d')}`);
console.log(`cool1024: ${sampleLayer('cool1024')}`);
console.log(`heat1024: ${sampleLayer('heat1024')}`);
console.log(`special1024: ${sampleLayer('special1024')}`);
console.log(`zoom512: ${sampleLayer('zoom512')}`);
console.log(`zoom256: ${sampleLayer('zoom256')}`);
console.log(`land256: ${sampleLayer('land256')}`);
console.log(`mushroom256: ${sampleLayer('mushroom256')}`);
console.log(`deepOcean256: ${sampleLayer('deepOcean256')}`);
console.log(`biome256: ${sampleLayer('biome256')} (${BiomeNames[sampleLayer('biome256')]})`);
console.log(`zoom128: ${sampleLayer('zoom128')} (${BiomeNames[sampleLayer('zoom128')]})`);
console.log(`zoom64: ${sampleLayer('zoom64')} (${BiomeNames[sampleLayer('zoom64')]})`);
console.log(`biomeEdge64: ${sampleLayer('biomeEdge64')} (${BiomeNames[sampleLayer('biomeEdge64')]})`);
console.log(`hills64: ${sampleLayer('hills64')} (${BiomeNames[sampleLayer('hills64')]})`);
console.log(`zoom32: ${sampleLayer('zoom32')} (${BiomeNames[sampleLayer('zoom32')]})`);
console.log(`land32: ${sampleLayer('land32')} (${BiomeNames[sampleLayer('land32')]})`);
console.log(`zoom16: ${sampleLayer('zoom16')} (${BiomeNames[sampleLayer('zoom16')]})`);
console.log(`zoom8: ${sampleLayer('zoom8')} (${BiomeNames[sampleLayer('zoom8')]})`);
console.log(`zoom4: ${sampleLayer('zoom4')} (${BiomeNames[sampleLayer('zoom4')]})`);
console.log(`smooth4: ${sampleLayer('smooth4')} (${BiomeNames[sampleLayer('smooth4')]})`);
console.log(`riverMix4: ${sampleLayer('riverMix4')} (${BiomeNames[sampleLayer('riverMix4')]})`);

console.log(`\nFinal getBiome(0,0): ${gen.getBiome(0, 0)} (${BiomeNames[gen.getBiome(0, 0)]})`);
