/**
 * Comprehensive Cubiomes Ground Truth Test
 * 
 * Tests the JS implementation against the C cubiomes library output.
 * Uses expected_versions.txt (18,000 test cases: 1000 per version × 18 versions)
 * Format: version seed biome_at_origin biome_at_far_coord
 * 
 * Biome at origin = getBiomeAt(g, 4, 0, 0, 0)
 * Biome at far = getBiomeAt(g, 4, 5000, 0, 5000)
 */

import fs from 'fs';
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';

const EXPECTED_FILE = '../cubiomes/expected_versions.txt';

// Read file with proper encoding (handle UTF-16LE BOM)
function readTestFile(filepath) {
    const buffer = fs.readFileSync(filepath);
    // Check for UTF-16LE BOM (0xFF 0xFE)
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return buffer.slice(2).toString('utf16le');
    }
    return buffer.toString('utf-8');
}

// C cubiomes version enum values
const C_VERSION_MAP = {
    3: { name: '1.0', js: 3 },
    4: { name: '1.1', js: 4 },
    5: { name: '1.2', js: 5 },
    6: { name: '1.3', js: 6 },
    7: { name: '1.4', js: 7 },
    8: { name: '1.5', js: 8 },
    9: { name: '1.6', js: 9 },
    10: { name: '1.7', js: 10 },
    11: { name: '1.8', js: 11 },
    12: { name: '1.9', js: 12 },
    13: { name: '1.10', js: 13 },
    14: { name: '1.11', js: 14 },
    15: { name: '1.12', js: 15 },
    16: { name: '1.13', js: 16 },
    17: { name: '1.14', js: 17 },
    18: { name: '1.15', js: 18 },
    19: { name: '1.16_1', js: 19 },  // Note: 1.16.1
    20: { name: '1.16', js: 20 },
    21: { name: '1.17', js: 21 }
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

async function runTest() {
    console.log("=================================================================");
    console.log("CUBIOMES GROUND TRUTH VERIFICATION");
    console.log("Testing JS implementation against C cubiomes library");
    console.log("=================================================================\n");

    // Read file with proper encoding
    const fileContent = readTestFile(EXPECTED_FILE);
    const lines = fileContent.split(/\r?\n/);

    const results = {};  // c_mc -> { origin: { passed, total, failures }, far: { passed, total, failures } }

    let lineNum = 0;

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

        const versionInfo = C_VERSION_MAP[c_mc];
        if (!versionInfo) {
            console.warn(`Unknown C version ${c_mc} at line ${lineNum}`);
            continue;
        }

        const js_mc = versionInfo.js;

        if (!results[c_mc]) {
            results[c_mc] = {
                origin: { passed: 0, total: 0, failures: [] },
                far: { passed: 0, total: 0, failures: [] }
            };
        }

        try {
            // Create generator for this seed and version
            const generator = new LegacyBiomeGenerator(seed, js_mc);

            // Test origin (0, 0) - JS coords need to be multiplied by 4 since C uses scale 4
            // Actually getBiome divides by 4, so we pass 0,0 directly for scale-4 coordinate 0,0
            const gotOrigin = generator.getBiome(0, 0);
            if (gotOrigin === expOrigin) {
                results[c_mc].origin.passed++;
            } else {
                if (results[c_mc].origin.failures.length < 5) {  // Limit failures shown
                    results[c_mc].origin.failures.push({
                        seed,
                        got: gotOrigin,
                        exp: expOrigin,
                        gotName: getBiomeName(gotOrigin),
                        expName: getBiomeName(expOrigin)
                    });
                }
            }
            results[c_mc].origin.total++;

            // Test far (5000, 5000) - C uses scale 4, so this is biome coord 5000
            // JS getBiome divides by 4, so pass 5000*4 = 20000
            const gotFar = generator.getBiome(20000, 20000);
            if (gotFar === expFar) {
                results[c_mc].far.passed++;
            } else {
                if (results[c_mc].far.failures.length < 5) {
                    results[c_mc].far.failures.push({
                        seed,
                        got: gotFar,
                        exp: expFar,
                        gotName: getBiomeName(gotFar),
                        expName: getBiomeName(expFar)
                    });
                }
            }
            results[c_mc].far.total++;

        } catch (e) {
            if (results[c_mc].origin.failures.length < 3) {
                results[c_mc].origin.failures.push({ seed, got: 'ERROR', exp: expOrigin, error: e.message });
            }
            results[c_mc].origin.total++;
            results[c_mc].far.total++;
        }
    }

    // Display results
    console.log("VERSION               ORIGIN (0,0)      FAR (5000,5000)   OVERALL");
    console.log("━".repeat(75));

    const mcs = Object.keys(results).map(Number).sort((a, b) => b - a);
    let totalOriginPass = 0, totalOriginTests = 0;
    let totalFarPass = 0, totalFarTests = 0;

    for (const c_mc of mcs) {
        const r = results[c_mc];
        const info = C_VERSION_MAP[c_mc];

        const originPct = ((r.origin.passed / r.origin.total) * 100).toFixed(1);
        const farPct = ((r.far.passed / r.far.total) * 100).toFixed(1);
        const overallPct = (((r.origin.passed + r.far.passed) / (r.origin.total + r.far.total)) * 100).toFixed(1);

        const originStatus = r.origin.passed === r.origin.total ? '✓' : `✗`;
        const farStatus = r.far.passed === r.far.total ? '✓' : `✗`;
        const overallStatus = (r.origin.passed === r.origin.total && r.far.passed === r.far.total) ? '✓' : '✗';

        const versionStr = `MC ${info.name}`.padEnd(10);
        const originStr = `${originPct}% ${originStatus}`.padEnd(18);
        const farStr = `${farPct}% ${farStatus}`.padEnd(18);
        const overallStr = `${overallPct}% ${overallStatus}`;

        console.log(`${versionStr}          ${originStr}${farStr}${overallStr}`);

        totalOriginPass += r.origin.passed;
        totalOriginTests += r.origin.total;
        totalFarPass += r.far.passed;
        totalFarTests += r.far.total;
    }

    console.log("━".repeat(75));

    const totalOriginPct = ((totalOriginPass / totalOriginTests) * 100).toFixed(2);
    const totalFarPct = ((totalFarPass / totalFarTests) * 100).toFixed(2);
    const grandTotalPct = (((totalOriginPass + totalFarPass) / (totalOriginTests + totalFarTests)) * 100).toFixed(2);

    console.log(`${'TOTAL'.padEnd(20)}${(totalOriginPct + '%').padEnd(18)}${(totalFarPct + '%').padEnd(18)}${grandTotalPct}%`);
    console.log(`${''.padEnd(20)}${(totalOriginPass + '/' + totalOriginTests).padEnd(18)}${(totalFarPass + '/' + totalFarTests).padEnd(18)}${totalOriginPass + totalFarPass}/${totalOriginTests + totalFarTests}`);

    // Show sample failures for debugging
    console.log("\n\n=== SAMPLE FAILURES (for debugging) ===\n");

    for (const c_mc of mcs) {
        const r = results[c_mc];
        const info = C_VERSION_MAP[c_mc];
        const hasFailures = r.origin.failures.length > 0 || r.far.failures.length > 0;

        if (hasFailures) {
            console.log(`\nMC ${info.name} (C:${c_mc} → JS:${info.js}):`);

            if (r.origin.failures.length > 0) {
                console.log("  Origin (0,0):");
                for (const f of r.origin.failures.slice(0, 3)) {
                    if (f.error) {
                        console.log(`    Seed ${f.seed}: ERROR - ${f.error}`);
                    } else {
                        console.log(`    Seed ${f.seed}: got ${f.got} (${f.gotName}), expected ${f.exp} (${f.expName})`);
                    }
                }
            }

            if (r.far.failures.length > 0) {
                console.log("  Far (5000,5000):");
                for (const f of r.far.failures.slice(0, 3)) {
                    if (f.error) {
                        console.log(`    Seed ${f.seed}: ERROR - ${f.error}`);
                    } else {
                        console.log(`    Seed ${f.seed}: got ${f.got} (${f.gotName}), expected ${f.exp} (${f.expName})`);
                    }
                }
            }
        }
    }
}

runTest().catch(console.error);
