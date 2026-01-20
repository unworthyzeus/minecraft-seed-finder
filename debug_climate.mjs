import { Generator } from './lib/cubiomes/generator.js';

const seeds = [
    "2625384477149282570",
    "-59101340850887151",
    "4929647849923273036",
    "7771721370356731819",
    "8400824904434636638",
    "2488411697033707221",
    "9113529492621424576",
    "581288216315907599",
    "-713589275115476238",
    "-7687722061914203175"
];

const gen = new Generator();
gen.setupGenerator(18);

for (const seedStr of seeds) {
    gen.applySeed(seedStr);

    const x = 0, z = 0, y = 64;
    const climate = gen.biomeNoise.sampleClimate(x, z);
    const biome = gen.getBiomeAt(1, x, y, z);

    const ridges = -3.0 * (Math.abs(Math.abs(climate.weirdness) - 0.6666667) - 0.33333334);
    const depth = gen.biomeNoise.calculateDepth(climate.continentalness, climate.erosion, ridges, climate.weirdness, y);

    const np = [
        Math.round(10000 * climate.temperature),
        Math.round(10000 * climate.humidity),
        Math.round(10000 * climate.continentalness),
        Math.round(10000 * climate.erosion),
        Math.round(10000 * depth),
        Math.round(10000 * climate.weirdness)
    ];

    console.log(`Seed: ${seedStr}`);
    console.log(`Biome: ${biome}`);
    console.log(`NP: ${np.join(' ')}`);
    console.log('---');
}
