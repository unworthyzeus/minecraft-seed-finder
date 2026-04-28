/**
 * Comprehensive Cubiomes Ground Truth Test - 5000 Seeds Edition
 * 
 * Tests the JS implementation against C cubiomes ground truth data.
 * Ground truth generated with gen_groundtruth_5000.c:
 * - 5000 seeds per version
 * - 26 Minecraft versions (B1.7 through 1.21)
 * - 5 coordinate pairs per seed
 * - Total: 650,000 test cases
 * 
 * Format of ground_truth_5000.tsv:
 * version<TAB>seed<TAB>x<TAB>z<TAB>biome
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';
import { BiomeNoise } from './lib/cubiomes/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to ground truth file
const GROUND_TRUTH_FILE = path.join(__dirname, 'data', 'ground_truth_5000.tsv');

// C cubiomes version enum to JS mapping
// C enum values from generator.h
const C_VERSION_MAP = {
    1: { name: 'B1.7', js: 1, modern: false },
    2: { name: 'B1.8', js: 2, modern: false },
    3: { name: '1.0', js: 3, modern: false },
    4: { name: '1.1', js: 4, modern: false },
    5: { name: '1.2', js: 5, modern: false },
    6: { name: '1.3', js: 6, modern: false },
    7: { name: '1.4', js: 7, modern: false },
    8: { name: '1.5', js: 8, modern: false },
    9: { name: '1.6', js: 9, modern: false },
    10: { name: '1.7', js: 10, modern: false },
    11: { name: '1.8', js: 11, modern: false },
    12: { name: '1.9', js: 12, modern: false },
    13: { name: '1.10', js: 13, modern: false },
    14: { name: '1.11', js: 14, modern: false },
    15: { name: '1.12', js: 15, modern: false },
    16: { name: '1.13', js: 16, modern: false },
    17: { name: '1.14', js: 17, modern: false },
    18: { name: '1.15', js: 18, modern: false },
    19: { name: '1.16.1', js: 19, modern: false },
    20: { name: '1.16', js: 20, modern: false },
    21: { name: '1.17', js: 21, modern: false },
    // Modern versions (1.18+) use BiomeNoise
    22: { name: '1.18', js: 18, modern: true },
    23: { name: '1.19.2', js: 19.2, modern: true },
    24: { name: '1.19', js: 19, modern: true },
    25: { name: '1.20', js: 20, modern: true },
    28: { name: '1.21', js: 21, modern: true },
};

// Biome ID to name mapping for debugging
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
    134: 'swamp_hills', 140: 'ice_spikes', 149: 'modified_jungle',
    151: 'modified_jungle_edge', 155: 'tall_birch_forest', 156: 'tall_birch_hills',
    157: 'dark_forest_hills', 158: 'snowy_taiga_mountains', 160: 'giant_spruce_taiga',
    161: 'giant_spruce_taiga_hills', 162: 'modified_gravelly_mountains',
    163: 'shattered_savanna', 164: 'shattered_savanna_plateau',
    165: 'eroded_badlands', 166: 'modified_wooded_badlands_plateau',
    167: 'modified_badlands_plateau', 168: 'bamboo_jungle', 169: 'bamboo_jungle_hills',
    // 1.18+ biomes
    174: 'dripstone_caves', 175: 'lush_caves', 177: 'meadow', 178: 'grove',
    179: 'snowy_slopes', 180: 'jagged_peaks', 181: 'frozen_peaks', 182: 'stony_peaks',
    183: 'old_growth_birch_forest', 184: 'old_growth_pine_taiga', 185: 'old_growth_spruce_taiga',
    186: 'snowy_plains', 187: 'sparse_jungle', 188: 'stony_shore', 189: 'windswept_hills',
    190: 'windswept_forest', 191: 'windswept_gravelly_hills', 192: 'windswept_savanna',
    193: 'wooded_badlands', 194: 'deep_dark',
    // 1.19+ biomes  
    195: 'mangrove_swamp',
    // 1.20+ biomes
    196: 'cherry_grove',
    // 1.21+ biomes
    197: 'pale_garden'
};

function getBiomeName(id) {
    return BIOME_NAMES[id] || `biome_${id}`;
}

// Coordinate names for reporting
const COORD_NAMES = {
    '0,0': 'origin',
    '100,100': 'near',
    '5000,5000': 'far',
    '12000,-8000': 'very_far',
    '-3000,-4500': 'negative'
};

function getCoordName(x, z) {
    return COORD_NAMES[`${x},${z}`] || `(${x},${z})`;
}

// Read file with proper encoding (handle UTF-16LE BOM)
function readGroundTruthFile(filepath) {
    const buffer = fs.readFileSync(filepath);
    // Check for UTF-16LE BOM (0xFF 0xFE)
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return buffer.slice(2).toString('utf16le');
    }
    // Check for UTF-8 BOM
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return buffer.slice(3).toString('utf-8');
    }
    return buffer.toString('utf-8');
}

// Main test runner
async function runTest() {
    console.log("═══════════════════════════════════════════════════════════════════════════════");
    console.log("CUBIOMES GROUND TRUTH VERIFICATION - 5000 SEEDS EDITION");
    console.log("Testing JS implementation against C cubiomes library");
    console.log("═══════════════════════════════════════════════════════════════════════════════\n");

    // Check if ground truth file exists
    if (!fs.existsSync(GROUND_TRUTH_FILE)) {
        console.error(`ERROR: Ground truth file not found: ${GROUND_TRUTH_FILE}`);
        console.error("Please run the C ground truth generator first.");
        process.exit(1);
    }

    console.log(`Loading ground truth from: ${GROUND_TRUTH_FILE}\n`);

    // Read and parse ground truth
    const fileContent = readGroundTruthFile(GROUND_TRUTH_FILE);
    const lines = fileContent.split(/\r?\n/);

    // Results structure: version -> { coord -> { passed, total, failures } }
    const results = {};

    // Cache for generators (reuse for same version/seed)
    let cachedGen = null;
    let cachedVersion = null;
    let cachedSeed = null;

    let totalTests = 0;
    let totalPassed = 0;
    let lineNum = 0;
    const startTime = Date.now();

    for (const line of lines) {
        lineNum++;

        // Skip comments and empty lines
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;

        // Parse TSV: version seed x z biome
        const parts = trimmedLine.split(/\t/).filter(p => p.trim());
        if (parts.length < 5) continue;

        const c_mc = parseInt(parts[0]);
        const seed = BigInt(parts[1]);
        const x = parseInt(parts[2]);
        const z = parseInt(parts[3]);
        const expectedBiome = parseInt(parts[4]);

        const versionInfo = C_VERSION_MAP[c_mc];
        if (!versionInfo) {
            // Unknown version, skip
            continue;
        }

        const js_mc = versionInfo.js;
        const coordKey = `${x},${z}`;

        // Initialize results structure
        if (!results[c_mc]) {
            results[c_mc] = {};
        }
        if (!results[c_mc][coordKey]) {
            results[c_mc][coordKey] = { passed: 0, total: 0, failures: [] };
        }

        // Get or create generator
        try {
            let gotBiome;

            if (versionInfo.modern) {
                // 1.18+ uses BiomeNoise
                if (cachedVersion !== c_mc || cachedSeed !== seed) {
                    cachedGen = new BiomeNoise();
                    cachedGen.setSeed(seed, js_mc);
                    cachedVersion = c_mc;
                    cachedSeed = seed;
                }
                // BiomeNoise.getBiome expects biome coordinates (scale 4)
                // Ground truth was generated with scale 4, so x,z are already block coords
                // We need to divide by 4 for biome coords (but for modern, the generator expects biome coords)
                // Actually checking gen_groundtruth_5000.c: getBiomeAt(&g, 4, x, 64, z) uses scale 4
                // So x,z are block coordinates that get divided by 4 internally by cubiomes
                gotBiome = cachedGen.getBiome(Math.floor(x / 4), Math.floor(z / 4), 64 >> 2);
            } else {
                // Pre-1.18 uses LegacyBiomeGenerator
                if (cachedVersion !== c_mc || cachedSeed !== seed) {
                    cachedGen = new LegacyBiomeGenerator(seed, js_mc);
                    cachedVersion = c_mc;
                    cachedSeed = seed;
                }
                // Legacy uses biome coordinates (1:4 scale)
                // getBiome expects already-scaled coords
                gotBiome = cachedGen.getBiome(Math.floor(x / 4), Math.floor(z / 4));
            }

            totalTests++;
            results[c_mc][coordKey].total++;

            if (gotBiome === expectedBiome) {
                totalPassed++;
                results[c_mc][coordKey].passed++;
            } else {
                // Record failure (limit to first 3 per version/coord)
                if (results[c_mc][coordKey].failures.length < 3) {
                    results[c_mc][coordKey].failures.push({
                        seed,
                        x, z,
                        got: gotBiome,
                        expected: expectedBiome,
                        gotName: getBiomeName(gotBiome),
                        expectedName: getBiomeName(expectedBiome)
                    });
                }
            }

        } catch (e) {
            totalTests++;
            results[c_mc][coordKey].total++;
            if (results[c_mc][coordKey].failures.length < 3) {
                results[c_mc][coordKey].failures.push({
                    seed,
                    x, z,
                    error: e.message
                });
            }
        }

        // Progress indicator
        if (lineNum % 50000 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`  Processed ${lineNum.toLocaleString()} lines (${elapsed}s)...`);
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Display results summary
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════════════════════════");
    console.log("RESULTS BY VERSION AND COORDINATE");
    console.log("═══════════════════════════════════════════════════════════════════════════════\n");

    const versions = Object.keys(results).map(Number).sort((a, b) => a - b);

    // Aggregate by version
    const versionSummary = {};

    for (const c_mc of versions) {
        const info = C_VERSION_MAP[c_mc];
        let vPassed = 0, vTotal = 0;

        for (const coordKey of Object.keys(results[c_mc])) {
            vPassed += results[c_mc][coordKey].passed;
            vTotal += results[c_mc][coordKey].total;
        }

        versionSummary[c_mc] = { passed: vPassed, total: vTotal };

        const pct = ((vPassed / vTotal) * 100).toFixed(2);
        const status = vPassed === vTotal ? '✓' : '✗';

        console.log(`MC ${info.name.padEnd(8)} ${status}  ${pct.padStart(7)}%  (${vPassed}/${vTotal})`);

        // Show coordinate breakdown if there are failures
        if (vPassed !== vTotal) {
            for (const coordKey of Object.keys(results[c_mc])) {
                const cr = results[c_mc][coordKey];
                if (cr.passed < cr.total) {
                    const coordPct = ((cr.passed / cr.total) * 100).toFixed(1);
                    console.log(`           └─ ${getCoordName(...coordKey.split(',').map(Number)).padEnd(12)} ${coordPct}%  (${cr.passed}/${cr.total})`);
                }
            }
        }
    }

    // Overall summary
    console.log("\n───────────────────────────────────────────────────────────────────────────────");
    const overallPct = ((totalPassed / totalTests) * 100).toFixed(3);
    const overallStatus = totalPassed === totalTests ? '✓ ALL PASSED' : '✗ FAILURES DETECTED';

    console.log(`OVERALL: ${overallStatus}`);
    console.log(`Total:   ${totalPassed.toLocaleString()} / ${totalTests.toLocaleString()} (${overallPct}%)`);
    console.log(`Time:    ${totalTime}s`);
    console.log("───────────────────────────────────────────────────────────────────────────────\n");

    // Show sample failures for debugging
    let hasFailures = false;
    for (const c_mc of versions) {
        const info = C_VERSION_MAP[c_mc];
        for (const coordKey of Object.keys(results[c_mc])) {
            const cr = results[c_mc][coordKey];
            if (cr.failures.length > 0 && !hasFailures) {
                console.log("═══════════════════════════════════════════════════════════════════════════════");
                console.log("SAMPLE FAILURES (for debugging)");
                console.log("═══════════════════════════════════════════════════════════════════════════════\n");
                hasFailures = true;
            }

            if (cr.failures.length > 0) {
                console.log(`MC ${info.name} @ ${getCoordName(...coordKey.split(',').map(Number))}:`);
                for (const f of cr.failures) {
                    if (f.error) {
                        console.log(`  Seed ${f.seed}: ERROR - ${f.error}`);
                    } else {
                        console.log(`  Seed ${f.seed} @ (${f.x}, ${f.z}): got ${f.got} (${f.gotName}), expected ${f.expected} (${f.expectedName})`);
                    }
                }
                console.log();
            }
        }
    }

    // Exit with appropriate code
    process.exit(totalPassed === totalTests ? 0 : 1);
}

// Run the test
runTest().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
