
import { Generator, BiomeID, BiomeNames } from './generator.js';
import { BiomeNoise } from './generator.js';

const gen = new Generator();
gen.setupGenerator(19); // 1.19 (uses 1.18+ logic)
gen.applySeed(12345n);

console.log("Testing Biome Generation vs Continentalness...");

// We want to sample points with varying continentalness.
// Since we can't easily inverse the noise function, we'll sample a line and report.

console.log("X, Z, Cont, BiomeID, BiomeName");

for (let x = 0; x < 20000; x += 1000) {
    const climate = gen.getClimate(x, 0);
    // getBiomeAt takes scale 1 coords, climate is at scale 4 (biome coords).
    // so we pass x*4, 0, 0 to getBiomeAt if we want to match?
    // climateToBiome in generator.js uses scale 1/10000 of the noise values.
    // getClimate returns raw noise values (approx -1 to 1 range usually).

    // Let's verify what getClimate returns.
    // generator.js: sampleClimate returns direct noise output.
    // climateToBiome expects values that are then passed to climateToBiome.

    // Wait, generator.js getBiome calls sampleClimate, getting raw values.
    // Then it multiplies by 10000 before passing to climateToBiome?
    // No, split logic.
    // getBiome: 
    //   calls sampleClimate -> returns { temperature: float, ... }
    //   calls climateToBiome([round(10000*temp), ...])
    // climateToBiome:
    //   takes np array.
    //   converts back: temp = np[0]/10000.

    // So effectively it works on the float values.

    // We will check the biome at this location.
    // We assume y=64 (sea level)
    const biomeId = gen.getBiomeAt(4, x, 64, 0); // scale 4 means input x is already biome coord

    // Find name
    let name = "Unknown";
    for (const [k, v] of Object.entries(BiomeNames)) {
        if (parseInt(k) == biomeId) name = v;
    }

    console.log(`x=${x} z=0 Cont=${climate.continentalness.toFixed(4)} Biome=${biomeId} (${name})`);
}
