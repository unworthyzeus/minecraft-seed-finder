import { Generator } from '../lib/cubiomes/generator.js';

const seed = -2635719608556356926n;
const x = 5000, z = 5000, y = 64;

const versions = [18, 19, 19.2, 20, 21];
const gen = new Generator();

for (const v of versions) {
    gen.setupGenerator(v);
    gen.applySeed(seed);
    const biome = gen.getBiomeAt(4, x, y, z);

    const c = gen.biomeNoise.sampleClimate(x * 4, z * 4);
    const ridges = -3.0 * (Math.abs(Math.abs(c.weirdness) - 0.6666667) - 0.33333334);
    const depth = gen.biomeNoise.calculateDepth(c.continentalness, c.erosion, ridges, c.weirdness, y);

    const np = [
        Math.round(10000 * c.temperature),
        Math.round(10000 * c.humidity),
        Math.round(10000 * c.continentalness),
        Math.round(10000 * c.erosion),
        Math.round(10000 * depth),
        Math.round(10000 * c.weirdness)
    ];

    console.log(`v${v}: biome=${biome} np=[${np.join(', ')}]`);
}
