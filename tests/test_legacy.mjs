
import { Generator, BiomeID } from '../lib/cubiomes/generator.js';

async function testIntegration() {
    console.log("Testing Generator integration with LegacyBiomeGenerator...");
    try {
        const seed = 1n;
        const gen = new Generator();
        gen.setupGenerator(16, false); // Version 1.16
        gen.applySeed(seed);

        console.log(`Seed: ${seed}, Version: 1.16`);

        // Sample some points
        const points = [
            [0, 0],
            [100, 100],
            [-200, 50],
            [1000, 1000]
        ];

        for (const [x, z, y] of points.map(([x, z]) => [x, z, 64])) {
            // Note: getBiomeAt inputs scale, x, y, z
            const biome = gen.getBiomeAt(1, x * 4, y, z * 4); // x4 because logic expects block coords but legacy gen works on biome coords internally?
            // Wait, getBiomeAt(1, ...) means scale 1 (block coords).
            // Inside getBiomeAt: if scale === 1, it divides by 4.
            // So if I pass block coords 400, it becomes biome coord 100.
            // My previous test used biome coords 100 directly.

            // Let's pass block coordinates corresponding to previous biome coords.
            const bx = x * 4;
            const bz = z * 4;
            const b = gen.getBiomeAt(1, bx, 64, bz);
            console.log(`Biome at (${bx}, ${bz}) [block]: ${b}`);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testIntegration();
