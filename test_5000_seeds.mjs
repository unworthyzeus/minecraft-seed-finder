/**
 * Comprehensive 5000-Seeds-Per-Version Ground Truth Test
 * 
 * Tests the JS implementation against 5000 seeds per version from the C cubiomes library.
 * 
 * Format: version seed biome_at_origin biome_at_far_coord
 * 
 * Biome at origin = getBiomeAt(g, 4, 0, 0, 0)
 * Biome at far = getBiomeAt(g, 4, 5000, 0, 5000)
 */

import fs from 'fs';
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';

const EXPECTED_FILE = '../cubiomes/groundtruth_5000.txt';
const LOG_FILE = 'test_5000_failures.log';

// Version name mapping (C enum values to human-readable)
const VERSION_NAMES = {
    1: 'Beta 1.7',
    2: 'Beta 1.8',
    3: '1.0',
    4: '1.1',
    5: '1.2',
    6: '1.3',
    7: '1.4',
    8: '1.5',
    9: '1.6',
    10: '1.7',
    11: '1.8',
    12: '1.9',
    13: '1.10',
    14: '1.11',
    15: '1.12',
    16: '1.13',
    17: '1.14',
    18: '1.15',
    19: '1.16.1',
    20: '1.16',
    21: '1.17'
};

// Biome ID to name mapping for better readability
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
    50: 'deep_frozen_ocean', 51: 'rainforest_b17', 52: 'swampland_b17', 53: 'seasonalForest_b17',
    54: 'forest_b17', 55: 'savanna_b17', 56: 'shrubland_b17', 57: 'taiga_b17',
    58: 'desert_b17', 59: 'plains_b17', 60: 'tundra_b17', 61: 'tundra_b17_edge',
    129: 'sunflower_plains', 130: 'desert_lakes',
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

// Read file with proper encoding (handle UTF-16LE BOM if present)
function readTestFile(filepath) {
    const buffer = fs.readFileSync(filepath);
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return buffer.slice(2).toString('utf16le');
    }
    return buffer.toString('utf-8');
}

async function runTest() {
    console.log("═".repeat(80));
    console.log("  5000-SEEDS-PER-VERSION GROUND TRUTH VERIFICATION");
    console.log("  Testing JS implementation against C cubiomes library");
    console.log("  105,000 total test cases (5,000 per version × 21 versions)");
    console.log("═".repeat(80) + "\n");

    // Open log file for ALL failures
    const logStream = fs.createWriteStream(LOG_FILE);
    logStream.write(`Test run: ${new Date().toISOString()}\n`);
    logStream.write(`Format: VERSION SEED LOCATION GOT_BIOME EXPECTED_BIOME GOT_NAME EXPECTED_NAME\n`);
    logStream.write("=".repeat(100) + "\n\n");

    const fileContent = readTestFile(EXPECTED_FILE);
    const lines = fileContent.split(/\r?\n/);

    // Results structure: c_mc -> { origin: {passed, total, failCount}, far: {passed, total, failCount} }
    const results = {};

    let lineNum = 0;
    let processed = 0;
    let errors = 0;
    let totalFailures = 0;

    for (const line of lines) {
        lineNum++;
        const cleanedLine = line.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
        if (!cleanedLine) continue;

        const parts = cleanedLine.split(/\s+/).filter(p => p.trim());
        if (parts.length < 4) continue;

        const c_mc = parseInt(parts[0]);
        const seed = BigInt(parts[1]);
        const expOrigin = parseInt(parts[2]);
        const expFar = parseInt(parts[3]);
        const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;

        // Initialize results for this version
        if (!results[c_mc]) {
            results[c_mc] = {
                origin: { passed: 0, total: 0, failCount: 0 },
                far: { passed: 0, total: 0, failCount: 0 }
            };
        }

        try {
            // JS version matches C version enum directly
            const js_mc = c_mc;

            // Create generator
            const generator = new LegacyBiomeGenerator(seed, js_mc);

            // Test origin (0, 0)
            const gotOrigin = generator.getBiome(0, 0);
            if (gotOrigin === expOrigin) {
                results[c_mc].origin.passed++;
            } else {
                results[c_mc].origin.failCount++;
                totalFailures++;
                // Log EVERY failure to file
                logStream.write(`${vName}\t${seed}\tORIGIN\t${gotOrigin}\t${expOrigin}\t${getBiomeName(gotOrigin)}\t${getBiomeName(expOrigin)}\n`);
            }
            results[c_mc].origin.total++;

            // Test far (5000, 5000)
            const gotFar = generator.getBiome(20000, 20000);
            if (gotFar === expFar) {
                results[c_mc].far.passed++;
            } else {
                results[c_mc].far.failCount++;
                totalFailures++;
                // Log EVERY failure to file
                logStream.write(`${vName}\t${seed}\tFAR\t${gotFar}\t${expFar}\t${getBiomeName(gotFar)}\t${getBiomeName(expFar)}\n`);
            }
            results[c_mc].far.total++;

        } catch (e) {
            errors++;
            totalFailures++;
            logStream.write(`${vName}\t${seed}\tERROR\t-\t${expOrigin}/${expFar}\t${e.message}\n`);
            results[c_mc].origin.total++;
            results[c_mc].far.total++;
        }

        processed++;

        // Progress update every 10000 lines
        if (processed % 10000 === 0) {
            process.stdout.write(`\rProcessed ${processed.toLocaleString()} test cases... (${totalFailures} failures)`);
        }
    }

    // Close log stream
    logStream.write("\n" + "=".repeat(100) + "\n");
    logStream.write(`Total failures: ${totalFailures}\n`);
    logStream.end();

    console.log(`\rProcessed ${processed.toLocaleString()} test cases. ${totalFailures} failures logged to ${LOG_FILE}\n`);

    // Display results table
    console.log("VERSION          ORIGIN (0,0)           FAR (5000,5000)        OVERALL");
    console.log("━".repeat(80));

    const mcs = Object.keys(results).map(Number).sort((a, b) => a - b);
    let totalOriginPass = 0, totalOriginTests = 0;
    let totalFarPass = 0, totalFarTests = 0;

    for (const c_mc of mcs) {
        const r = results[c_mc];
        const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;

        const originPct = ((r.origin.passed / r.origin.total) * 100).toFixed(1);
        const farPct = ((r.far.passed / r.far.total) * 100).toFixed(1);
        const overallPct = (((r.origin.passed + r.far.passed) / (r.origin.total + r.far.total)) * 100).toFixed(1);

        const originStatus = r.origin.passed === r.origin.total ? '✓' : '✗';
        const farStatus = r.far.passed === r.far.total ? '✓' : '✗';
        const overallStatus = (r.origin.passed === r.origin.total && r.far.passed === r.far.total) ? '✓' : '✗';

        const versionStr = `MC ${vName}`.padEnd(13);
        const originStr = `${r.origin.passed}/${r.origin.total} (${originPct}%) ${originStatus}`.padEnd(25);
        const farStr = `${r.far.passed}/${r.far.total} (${farPct}%) ${farStatus}`.padEnd(25);
        const overallStr = `${overallPct}% ${overallStatus}`;

        console.log(`${versionStr}  ${originStr}${farStr}${overallStr}`);

        totalOriginPass += r.origin.passed;
        totalOriginTests += r.origin.total;
        totalFarPass += r.far.passed;
        totalFarTests += r.far.total;
    }

    console.log("━".repeat(80));

    const totalOriginPct = ((totalOriginPass / totalOriginTests) * 100).toFixed(2);
    const totalFarPct = ((totalFarPass / totalFarTests) * 100).toFixed(2);
    const grandTotal = totalOriginPass + totalFarPass;
    const grandTotalTests = totalOriginTests + totalFarTests;
    const grandTotalPct = ((grandTotal / grandTotalTests) * 100).toFixed(2);

    console.log(`${'TOTAL'.padEnd(15)}${(totalOriginPass + '/' + totalOriginTests + ' (' + totalOriginPct + '%)').padEnd(25)}${(totalFarPass + '/' + totalFarTests + ' (' + totalFarPct + '%)').padEnd(25)}${grandTotalPct}%`);

    console.log("\n" + "═".repeat(80));
    console.log(`GRAND TOTAL: ${grandTotal.toLocaleString()}/${grandTotalTests.toLocaleString()} tests passed (${grandTotalPct}%)`);
    console.log("═".repeat(80));

    // Show failure summary
    if (totalFailures > 0) {
        console.log("\n" + "╔".repeat(1) + "══════════════════════════════════════════════════════════════════════════════╗");
        console.log("║                           FAILURE SUMMARY                                     ║");
        console.log("╚══════════════════════════════════════════════════════════════════════════════╝\n");

        for (const c_mc of mcs) {
            const r = results[c_mc];
            const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;
            const hasVersionFailures = r.origin.failCount > 0 || r.far.failCount > 0;

            if (hasVersionFailures) {
                console.log(`MC ${vName}: ${r.origin.failCount} origin failures, ${r.far.failCount} far failures`);
            }
        }

        console.log(`\n📄 All ${totalFailures} failures have been logged to: ${LOG_FILE}`);
    } else {
        console.log("\n🎉 ALL TESTS PASSED! 🎉");
    }

    // Summary statistics
    console.log("\n" + "═".repeat(80));
    console.log("SUMMARY STATISTICS:");
    console.log("═".repeat(80));
    console.log(`Total test cases processed: ${processed.toLocaleString()}`);
    console.log(`Total errors during execution: ${errors}`);
    console.log(`Versions tested: ${mcs.length}`);
    console.log(`Seeds per version: 5,000`);
    console.log(`Test locations: Origin (0,0) and Far (5000,5000) at scale 4`);

    if (errors > 0) {
        console.log(`\n⚠️  ${errors} errors occurred during testing`);
    }

    const passRate = parseFloat(grandTotalPct);
    if (passRate === 100) {
        console.log("\n✅ PERFECT MATCH: JS implementation matches C cubiomes exactly!");
    } else if (passRate >= 99) {
        console.log(`\n⚠️  NEAR MATCH: ${(100 - passRate).toFixed(2)}% of tests failed`);
    } else {
        console.log(`\n❌ SIGNIFICANT DIFFERENCES: ${(100 - passRate).toFixed(2)}% of tests failed`);
    }
}

runTest().catch(console.error);
