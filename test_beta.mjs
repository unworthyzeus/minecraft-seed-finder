/**
 * Beta Version Ground Truth Test
 * Tests Beta 1.7 and Beta 1.8 against C cubiomes
 */

import fs from 'fs';
import { LegacyBiomeGenerator, MC_B1_7, MC_B1_8 } from './lib/cubiomes/layers.js';

const EXPECTED_FILE = '../cubiomes/groundtruth_beta.txt';
const LOG_FILE = 'test_beta_failures.log';

// Version name mapping
const VERSION_NAMES = {
    1: 'Beta 1.7',
    2: 'Beta 1.8'
};

// Beta biome names
const BIOME_NAMES = {
    0: 'ocean', 1: 'plains', 2: 'desert', 3: 'mountains', 4: 'forest',
    5: 'taiga', 6: 'swamp', 7: 'river', 10: 'frozen_ocean', 11: 'frozen_river',
    12: 'snowy_tundra', 35: 'savanna',
    // Beta 1.7 specific biomes
    51: 'seasonal_forest_b17', 52: 'rainforest_b17', 53: 'shrubland_b17',
    54: 'shrubland_b17', 55: 'taiga_b17', 56: 'desert_b17', 57: 'plains_b17',
    58: 'tundra_b17', 59: 'savanna_b17'
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
    console.log("  BETA VERSION GROUND TRUTH TEST");
    console.log("  Testing Beta 1.7 and Beta 1.8 against C cubiomes");
    console.log("  10,000 total test cases (5,000 per version)");
    console.log("═".repeat(80) + "\n");

    const logStream = fs.createWriteStream(LOG_FILE);
    logStream.write(`Test run: ${new Date().toISOString()}\n`);
    logStream.write(`Format: VERSION SEED X Z GOT_BIOME EXPECTED_BIOME GOT_NAME EXPECTED_NAME\n`);
    logStream.write("=".repeat(120) + "\n\n");

    const fileContent = readTestFile(EXPECTED_FILE);
    const lines = fileContent.split(/\r?\n/);

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

        if (!results[c_mc]) {
            results[c_mc] = { passed: 0, total: 0, failCount: 0 };
        }

        try {
            const generator = new LegacyBiomeGenerator(seed, c_mc);
            const got = generator.getBiome(x * 4, z * 4);

            if (got === expected) {
                results[c_mc].passed++;
            } else {
                results[c_mc].failCount++;
                totalFailures++;
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
        if (processed % 2000 === 0) {
            process.stdout.write(`\rProcessed ${processed.toLocaleString()} test cases... (${totalFailures} failures)`);
        }
    }

    logStream.write("\n" + "=".repeat(120) + "\n");
    logStream.write(`Total failures: ${totalFailures}\n`);
    logStream.end();

    console.log(`\rProcessed ${processed.toLocaleString()} test cases. ${totalFailures} failures logged to ${LOG_FILE}\n`);

    console.log("VERSION          PASSED/TOTAL           PERCENTAGE       STATUS");
    console.log("━".repeat(70));

    const mcs = Object.keys(results).map(Number).sort((a, b) => a - b);
    let totalPass = 0, totalTests = 0;

    for (const c_mc of mcs) {
        const r = results[c_mc];
        const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;
        const pct = ((r.passed / r.total) * 100).toFixed(2);
        const status = r.passed === r.total ? '✓' : '✗';

        console.log(`${vName.padEnd(15)}  ${(r.passed + '/' + r.total).padEnd(25)}${(pct + '%').padEnd(17)}${status}`);

        totalPass += r.passed;
        totalTests += r.total;
    }

    console.log("━".repeat(70));
    const grandPct = ((totalPass / totalTests) * 100).toFixed(2);
    console.log(`${'TOTAL'.padEnd(17)}${(totalPass + '/' + totalTests).padEnd(25)}${(grandPct + '%').padEnd(17)}${totalPass === totalTests ? '✓' : '✗'}`);

    if (totalFailures > 0) {
        console.log("\n📄 All failures logged to: " + LOG_FILE);

        // Show first few sample failures
        console.log("\nSample failures (first 10):");
        const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
        const failureLines = logContent.split('\n').filter(l => l.includes('Beta'));
        failureLines.slice(0, 10).forEach(l => console.log("  " + l));
    }
}

runTest().catch(console.error);
