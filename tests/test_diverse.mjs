/**
 * Diverse Coordinate Ground Truth Test (Non-Beta Only)
 * 
 * Tests the JS implementation against C cubiomes with random coordinates per seed.
 * Coordinates range from near (1000) to extreme (10 million blocks).
 * 
 * Format: version seed x z biome
 */

import fs from 'fs';
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers.js';

const EXPECTED_FILE = '../../cubiomes/groundtruth_100k.txt';
const LOG_FILE = 'test_diverse_failures.log';

// Version name mapping
const VERSION_NAMES = {
    3: '1.0', 4: '1.1', 5: '1.2', 6: '1.3', 7: '1.4', 8: '1.5', 9: '1.6',
    10: '1.7', 11: '1.8', 12: '1.9', 13: '1.10', 14: '1.11', 15: '1.12',
    16: '1.13', 17: '1.14', 18: '1.15', 19: '1.16.1', 20: '1.16', 21: '1.17'
};

// Biome ID to name mapping
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
    134: 'swamp_hills', 140: 'ice_spikes', 149: 'modified_jungle', 151: 'modified_jungle_edge',
    155: 'tall_birch_forest', 156: 'tall_birch_hills',
    157: 'dark_forest_hills', 158: 'snowy_taiga_mountains', 160: 'giant_spruce_taiga',
    161: 'giant_spruce_taiga_hills', 162: 'modified_gravelly_mountains',
    163: 'shattered_savanna', 164: 'shattered_savanna_plateau',
    165: 'eroded_badlands', 166: 'modified_wooded_badlands_plateau',
    167: 'modified_badlands_plateau', 168: 'bamboo_jungle', 169: 'bamboo_jungle_hills'
};

function getBiomeName(id) {
    return BIOME_NAMES[id] || `biome_${id}`;
}

function readTestFile(filepath) {
    const buffer = fs.readFileSync(filepath);
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return buffer.slice(2).toString('utf16le');
    }
    return buffer.toString('utf-8');
}

async function runTest() {
    console.log("═".repeat(80));
    console.log("  DIVERSE COORDINATE GROUND TRUTH TEST (NON-BETA)");
    console.log("  Testing JS implementation with random coords from near to 10M blocks");
    console.log("  19,000 total test cases (1,000 per version × 19 versions)");
    console.log("═".repeat(80) + "\n");

    // Open log file for ALL failures
    const logStream = fs.createWriteStream(LOG_FILE);
    logStream.write(`Test run: ${new Date().toISOString()}\n`);
    logStream.write(`Format: VERSION SEED X Z GOT_BIOME EXPECTED_BIOME GOT_NAME EXPECTED_NAME\n`);
    logStream.write("=".repeat(120) + "\n\n");

    const fileContent = readTestFile(EXPECTED_FILE);
    const lines = fileContent.split(/\r?\n/);

    // Results structure: c_mc -> { passed, total, failCount }
    const results = {};

    let processed = 0;
    let totalFailures = 0;
    let errors = 0;

    for (const line of lines) {
        const cleanedLine = line.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
        if (!cleanedLine) continue;

        const parts = cleanedLine.split(/\s+/).filter(p => p.trim());
        if (parts.length < 5) continue;

        const c_mc = parseInt(parts[0]);
        const seed = BigInt(parts[1]);
        const x = parseInt(parts[2]);
        const z = parseInt(parts[3]);
        const expected = parseInt(parts[4]);
        const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;

        // Initialize results for this version
        if (!results[c_mc]) {
            results[c_mc] = { passed: 0, total: 0, failCount: 0 };
        }

        try {
            const generator = new LegacyBiomeGenerator(seed, c_mc);

            // C uses scale 4 coords, JS getBiome divides by 4: pass x*4, z*4
            const got = generator.getBiome(x * 4, z * 4);

            if (got === expected) {
                results[c_mc].passed++;
            } else {
                results[c_mc].failCount++;
                totalFailures++;
                // Log EVERY failure
                logStream.write(`${vName}\t${seed}\t${x}\t${z}\t${got}\t${expected}\t${getBiomeName(got)}\t${getBiomeName(expected)}\n`);
            }
            results[c_mc].total++;

        } catch (e) {
            errors++;
            totalFailures++;
            logStream.write(`${vName}\t${seed}\t${x}\t${z}\tERROR\t${expected}\t${e.message}\n`);
            results[c_mc].total++;
        }

        processed++;

        if (processed % 5000 === 0) {
            process.stdout.write(`\rProcessed ${processed.toLocaleString()} test cases... (${totalFailures} failures)`);
        }
    }

    // Close log stream
    logStream.write("\n" + "=".repeat(120) + "\n");
    logStream.write(`Total failures: ${totalFailures}\n`);
    logStream.end();

    console.log(`\rProcessed ${processed.toLocaleString()} test cases. ${totalFailures} failures logged to ${LOG_FILE}\n`);

    // Display results table
    console.log("VERSION          PASSED/TOTAL           PERCENTAGE       STATUS");
    console.log("━".repeat(70));

    const mcs = Object.keys(results).map(Number).sort((a, b) => a - b);
    let totalPass = 0, totalTests = 0;

    for (const c_mc of mcs) {
        const r = results[c_mc];
        const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;
        const pct = ((r.passed / r.total) * 100).toFixed(2);
        const status = r.passed === r.total ? '✓' : '✗';

        const versionStr = `MC ${vName}`.padEnd(13);
        const passStr = `${r.passed}/${r.total}`.padEnd(25);
        const pctStr = `${pct}%`.padEnd(17);

        console.log(`${versionStr}  ${passStr}${pctStr}${status}`);

        totalPass += r.passed;
        totalTests += r.total;
    }

    console.log("━".repeat(70));

    const grandPct = ((totalPass / totalTests) * 100).toFixed(2);
    console.log(`${'TOTAL'.padEnd(15)}${(totalPass + '/' + totalTests).padEnd(25)}${grandPct + '%'.padEnd(17)}${totalPass === totalTests ? '✓' : '✗'}`);

    console.log("\n" + "═".repeat(80));
    console.log(`GRAND TOTAL: ${totalPass.toLocaleString()}/${totalTests.toLocaleString()} tests passed (${grandPct}%)`);
    console.log("═".repeat(80));

    // Show failure summary
    if (totalFailures > 0) {
        console.log("\n╔══════════════════════════════════════════════════════════════════════════════╗");
        console.log("║                           FAILURE SUMMARY                                     ║");
        console.log("╚══════════════════════════════════════════════════════════════════════════════╝\n");

        for (const c_mc of mcs) {
            const r = results[c_mc];
            const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;
            if (r.failCount > 0) {
                console.log(`MC ${vName}: ${r.failCount} failures`);
            }
        }

        console.log(`\n📄 All ${totalFailures} failures have been logged to: ${LOG_FILE}`);
    } else {
        console.log("\n🎉 ALL TESTS PASSED! 🎉");
    }

    // Summary
    console.log("\n" + "═".repeat(80));
    console.log("SUMMARY:");
    console.log("═".repeat(80));
    console.log(`Total tests: ${totalTests.toLocaleString()}`);
    console.log(`Errors: ${errors}`);
    console.log(`Coordinate ranges: 1K, 50K, 500K, 5M, 10M blocks`);

    const passRate = parseFloat(grandPct);
    if (passRate === 100) {
        console.log("\n✅ PERFECT MATCH: JS implementation matches C cubiomes exactly!");
    } else if (passRate >= 99) {
        console.log(`\n⚠️  NEAR MATCH: ${(100 - passRate).toFixed(2)}% of tests failed`);
    } else {
        console.log(`\n❌ DIFFERENCES FOUND: ${(100 - passRate).toFixed(2)}% of tests failed`);
    }
}

runTest().catch(console.error);
