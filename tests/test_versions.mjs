import fs from 'fs';
import readline from 'readline';
import { LegacyBiomeGenerator, MC_1_0, MC_1_13, MC_1_17 } from '../lib/cubiomes/layers.js';

const EXPECTED_FILE = '../../cubiomes/legacy_gt.txt';

// Version name mapping
const VERSION_NAMES = {
    1: 'Beta 1.7', 2: 'Beta 1.8',
    3: '1.0', 4: '1.1', 5: '1.2', 6: '1.3', 7: '1.4', 8: '1.5', 9: '1.6',
    10: '1.7', 11: '1.8', 12: '1.9', 13: '1.10', 14: '1.11', 15: '1.12',
    16: '1.13', 17: '1.14', 18: '1.15', 19: '1.16_1', 20: '1.16', 21: '1.17'
};

async function runTest() {
    console.log("Testing fixed coordinates per version (1.0 to 1.17)...\n");

    const fileStream = fs.createReadStream(EXPECTED_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const results = {}; // c_mc -> { passed, total, failures }

    for await (const line of rl) {
        const cleanedLine = line.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
        if (!cleanedLine) continue;

        const parts = cleanedLine.split(' ').filter(p => p.trim());
        if (parts.length < 5) continue;

        const c_mc = parseInt(parts[0]);
        const seed = BigInt(parts[1]);
        const x = parseInt(parts[2]);
        const z = parseInt(parts[3]);
        const exp = parseInt(parts[4]);

        // C to JS version mapping: JS = C (constants are now aligned)
        const mc = c_mc;
        if (mc !== 1) continue; // Filter for Beta 1.7

        if (!results[c_mc]) {
            results[c_mc] = { passed: 0, total: 0, failures: [] };
        }

        try {
            const gen = new LegacyBiomeGenerator(seed, mc);
            // C uses scale 4 coordinates for layers, but block coords for legacy noise?
            // For B1.7 (mc=1), getBiome expects block coords, and GT is block coords.
            const scale = (mc === 1) ? 1 : 4;
            const got = gen.getBiome(x * scale, z * scale);

            if (got === exp) {
                results[c_mc].passed++;
            } else {
                results[c_mc].failures.push({ seed, x, z, got, exp });
            }
        } catch (e) {
            results[c_mc].failures.push({ seed, x, z, got: 'ERROR', exp, error: e.message });
        }
        results[c_mc].total++;
    }

    console.log("=== VERSION RESULTS ===");
    console.log("Version\t\tPass %\tTotal\tStatus");
    console.log("-".repeat(50));

    // Sort versions descending (1.17 -> 1.0)
    const mcs = Object.keys(results).map(Number).sort((a, b) => b - a);

    for (const c_mc of mcs) {
        const r = results[c_mc];
        const pct = ((r.passed / r.total) * 100).toFixed(1);
        const vName = VERSION_NAMES[c_mc] || `v${c_mc}`;
        const status = r.passed === r.total ? '✓' : `✗ (${r.failures.length} fails)`;
        console.log(`MC ${vName}\t\t${pct}%\t${r.total}\t${status}`);

        // Show all failures
        for (const f of r.failures) {
            console.log(`  Seed ${f.seed} @ (${f.x},${f.z}): got ${f.got}, expected ${f.exp}`);
        }
    }

    // Summary
    const totalPassed = mcs.reduce((a, mc) => a + results[mc].passed, 0);
    const totalTests = mcs.reduce((a, mc) => a + results[mc].total, 0);
    console.log("-".repeat(50));
    console.log(`TOTAL: ${totalPassed}/${totalTests} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
}

runTest().catch(console.error);
