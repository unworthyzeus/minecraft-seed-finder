
import fs from 'fs';
import { LegacyBiomeGenerator, MC_B1_7, MC_B1_8 } from './lib/cubiomes/layers.js'; // Adjust path if needed
import { BiomeNames } from './lib/cubiomes/core.js'; // Trying to import names, fallback if not

// Define local map if core.js doesn't export BiomeNames
const BIOME_NAMES = {
    0: 'ocean', 1: 'plains', 2: 'desert', 3: 'mountains', 4: 'forest',
    5: 'taiga', 6: 'swamp', 7: 'river', 10: 'frozen_ocean', 11: 'frozen_river',
    12: 'snowy_tundra', 13: 'snowy_mountains', 14: 'mushroom_fields', 15: 'mushroom_field_shore',
    16: 'beach', 17: 'desert_hills', 18: 'wooded_hills', 19: 'taiga_hills',
    20: 'mountain_edge', 21: 'jungle', 22: 'jungle_hills', 23: 'jungle_edge',
    24: 'deep_ocean', 25: 'stone_shore', 26: 'snowy_beach', 27: 'birch_forest',
    28: 'birch_forest_hills', 29: 'dark_forest', 30: 'snowy_taiga', 31: 'snowy_taiga_hills',
    32: 'giant_tree_taiga', 33: 'giant_tree_taiga_hills', 34: 'wooded_mountains',
    35: 'savanna', 36: 'savanna_plateau', 37: 'badlands', 38: 'wooded_badlands_plateau',
    39: 'badlands_plateau', 44: 'warm_ocean', 45: 'lukewarm_ocean', 46: 'cold_ocean',
    47: 'deep_warm_ocean', 48: 'deep_lukewarm_ocean', 49: 'deep_cold_ocean',
    50: 'deep_frozen_ocean', 129: 'sunflower_plains', 130: 'desert_lakes',
    131: 'gravelly_mountains', 132: 'flower_forest', 133: 'taiga_mountains',
    134: 'swamp_hills', 155: 'tall_birch_forest', 156: 'tall_birch_hills',
    157: 'dark_forest_hills', 158: 'snowy_taiga_mountains', 160: 'giant_spruce_taiga',
    161: 'giant_spruce_taiga_hills', 162: 'modified_gravelly_mountains',
    163: 'shattered_savanna', 164: 'shattered_savanna_plateau',
    165: 'eroded_badlands', 166: 'modified_wooded_badlands_plateau',
    167: 'modified_badlands_plateau', 168: 'bamboo_jungle', 169: 'bamboo_jungle_hills'
};

function getBiomeName(id) {
    return BIOME_NAMES[id] || `biome_${id}`;
}

const LEGACY_GT_FILE = '../cubiomes/legacy_gt.txt';

async function runTest() {
    console.log("=================================================================");
    console.log("BETA & LEGACY GROUND TRUTH VERIFICATION");
    console.log(`Reading from ${LEGACY_GT_FILE}`);
    console.log("=================================================================\n");

    if (!fs.existsSync(LEGACY_GT_FILE)) {
        console.error(`Error: File ${LEGACY_GT_FILE} not found.`);
        return;
    }

    const buffer = fs.readFileSync(LEGACY_GT_FILE);
    let content;
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        content = buffer.slice(2).toString('utf16le');
    } else {
        content = buffer.toString('utf-8');
    }

    // Remove null bytes or other non-printable chars just in case
    content = content.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '');

    const lines = content.split(/\r?\n/);

    // Stats per version
    const stats = {};

    let lineNum = 0;
    for (const line of lines) {
        lineNum++;
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5) continue;

        const version = parseInt(parts[0]);
        const seed = BigInt(parts[1]);
        const x = parseInt(parts[2]);
        const z = parseInt(parts[3]);
        const expectedBiome = parseInt(parts[4]);

        if (!stats[version]) {
            stats[version] = { passed: 0, total: 0, failures: [] };
        }

        try {
            const gen = new LegacyBiomeGenerator(seed, version);
            const gotBiome = gen.getBiome(x, z);

            if (gotBiome === expectedBiome) {
                stats[version].passed++;
            } else {
                if (stats[version].failures.length < 5) {
                    stats[version].failures.push({
                        seed, x, z,
                        got: gotBiome, gotName: getBiomeName(gotBiome),
                        exp: expectedBiome, expName: getBiomeName(expectedBiome)
                    });
                }
            }
            stats[version].total++;
        } catch (e) {
            console.error(`Error on line ${lineNum}: ${e.message}`);
        }
    }

    console.log("VERSION     PASSED/TOTAL     PERCENTAGE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const versions = Object.keys(stats).sort((a, b) => parseInt(a) - parseInt(b));
    let grandTotal = 0;
    let grandPassed = 0;

    for (const v of versions) {
        const s = stats[v];
        const pct = (s.passed / s.total * 100).toFixed(1) + '%';
        const vName = v === 1 ? "B1.7" : (v === 2 ? "B1.8" : v.toString());
        console.log(`${vName.padEnd(10)}  ${(s.passed + '/' + s.total).padEnd(15)}  ${pct}`);

        grandTotal += s.total;
        grandPassed += s.passed;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`${"TOTAL".padEnd(10)}  ${(grandPassed + '/' + grandTotal).padEnd(15)}  ${(grandPassed / grandTotal * 100).toFixed(1)}%`);

    console.log("\n=== FAILURES ===");
    for (const v of versions) {
        const s = stats[v];
        if (s.failures.length > 0) {
            const vName = v === 1 ? "B1.7" : (v === 2 ? "B1.8" : v.toString());
            console.log(`\nVersion ${vName}:`);
            for (const f of s.failures) {
                console.log(`  Seed ${f.seed} at (${f.x},${f.z}): Got ${f.got} (${f.gotName}), Expected ${f.exp} (${f.expName})`);
            }
        }
    }
}

runTest();
