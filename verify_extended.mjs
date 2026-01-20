
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';
import { BiomeID, BiomeNames } from './lib/cubiomes/core.js';

function getBiomeName(id) {
    return BiomeNames[id] || `Unknown (${id})`;
}

async function verifyExtended() {
    console.log("Running Extended Verification for Legacy Biome Generator...");

    const cases = [
        // 1.12 tests (verified with C cubiomes)
        { seed: 111n, version: 12, x: 0, z: 0, expected: [2], desc: "Seed 111 (1.12) @ 0,0 -> Desert" },
        { seed: 111n, version: 12, x: 100, z: 100, expected: [2], desc: "Seed 111 (1.12) @ 100,100 -> Desert" },
        { seed: 111n, version: 12, x: -50, z: -50, expected: [2], desc: "Seed 111 (1.12) @ -50,-50 -> Desert" },
        { seed: 111n, version: 12, x: 1000, z: 0, expected: [6], desc: "Seed 111 (1.12) @ 1000,0 -> Swamp" },
        { seed: 111n, version: 12, x: 0, z: 1000, expected: [24], desc: "Seed 111 (1.12) @ 0,1000 -> Deep Ocean" },

        { seed: 123n, version: 12, x: 0, z: 0, expected: [4], desc: "Seed 123 (1.12) @ 0,0 -> Forest" },
        { seed: 123n, version: 12, x: 100, z: 100, expected: [29], desc: "Seed 123 (1.12) @ 100,100 -> Dark Forest" },

        { seed: 789n, version: 12, x: 0, z: 0, expected: [0], desc: "Seed 789 (1.12) @ 0,0 -> Ocean" },
        { seed: 789n, version: 12, x: 100, z: 100, expected: [1], desc: "Seed 789 (1.12) @ 100,100 -> Plains" },

        { seed: 1234567890n, version: 12, x: 0, z: 0, expected: [28], desc: "Seed 1234567890 (1.12) @ 0,0 -> Snowy Taiga Hills" },
    ];

    let passed = 0;

    for (const test of cases) {
        console.log(`\nChecking: ${test.desc}`);
        const gen = new LegacyBiomeGenerator(test.seed, test.version);
        const biome = gen.getBiome(test.x, test.z);
        const name = getBiomeName(biome);

        console.log(`Found: ${name} (ID: ${biome})`);

        if (test.expected.includes(biome)) {
            console.log("RESULT: PASS");
            passed++;
        } else {
            console.log(`RESULT: FAIL (Expected: ${test.expected.map(getBiomeName).join(' or ')})`);
        }
    }

    console.log(`\nSummary: ${passed}/${cases.length} Passed`);
}

verifyExtended();
