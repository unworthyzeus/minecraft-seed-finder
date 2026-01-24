/**
 * Cubiomes 1.18+ Ground Truth Test
 */

import fs from 'fs';
import path from 'path';
import { Generator, BiomeID, BiomeNames } from '../lib/cubiomes/generator.js';

const EXPECTED_FILE = '../../cubiomes/expected_1_18_plus.txt';

const C_VERSION_MAP = {
    22: { name: '1.18', js: 18 },
    23: { name: '1.19.2', js: 19.2 },
    24: { name: '1.19', js: 19 },
    25: { name: '1.20', js: 20 },
    28: { name: '1.21', js: 21 }
};

function getBiomeName(id) {
    if (BiomeNames[id]) return BiomeNames[id];
    return `biome_${id}`;
}

async function runTest() {
    console.log("=================================================================");
    console.log("CUBIOMES 1.18+ GROUND TRUTH VERIFICATION");
    console.log("Testing JS implementation against C cubiomes library");
    console.log("=================================================================\n");

    if (!fs.existsSync(EXPECTED_FILE)) {
        console.error(`Expected file not found: ${EXPECTED_FILE}`);
        return;
    }

    const fileContent = fs.readFileSync(EXPECTED_FILE, 'utf-8');
    const lines = fileContent.split(/\r?\n/);

    const results = {};

    let lineNum = 0;
    const generator = new Generator();

    for (const line of lines) {
        lineNum++;
        const cleanedLine = line.trim();
        if (!cleanedLine) continue;

        const parts = cleanedLine.split(/\s+/);
        if (parts.length < 4) continue;

        const c_mc = parseInt(parts[0]);
        const seedString = parts[1];
        const seed = BigInt(seedString);
        const expOrigin = parseInt(parts[2]);
        const expFar = parseInt(parts[3]);

        const versionInfo = C_VERSION_MAP[c_mc];
        if (!versionInfo) continue;

        const js_mc = versionInfo.js;

        if (!results[c_mc]) {
            results[c_mc] = {
                origin: { passed: 0, total: 0, failures: [] },
                far: { passed: 0, total: 0, failures: [] }
            };
        }

        try {
            generator.setupGenerator(js_mc);
            generator.applySeed(seed);

            // Origin at (0, 0), Y=64 (biome scale 1:4)
            const gotOrigin = generator.getBiomeAt(4, 0, 64, 0);
            if (gotOrigin === expOrigin) {
                results[c_mc].origin.passed++;
            } else {
                if (results[c_mc].origin.failures.length < 5) {
                    results[c_mc].origin.failures.push({
                        seed: seedString,
                        got: gotOrigin,
                        exp: expOrigin,
                        gotName: getBiomeName(gotOrigin),
                        expName: getBiomeName(expOrigin)
                    });
                }
            }
            results[c_mc].origin.total++;

            // Far at (5000, 5000), Y=64 (biome scale 1:4)
            const gotFar = generator.getBiomeAt(4, 5000, 64, 5000);
            if (gotFar === expFar) {
                results[c_mc].far.passed++;
            } else {
                if (results[c_mc].far.failures.length < 5) {
                    results[c_mc].far.failures.push({
                        seed: seedString,
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
                results[c_mc].origin.failures.push({ seed: seedString, got: 'ERROR', exp: expOrigin, error: e.stack });
            }
            results[c_mc].origin.total++;
            results[c_mc].far.total++;
        }
    }

    // Print Results
    console.log("VERSION               ORIGIN (0,0)      FAR (5000,5000)   OVERALL");
    console.log("━".repeat(75));

    for (const c_mc in results) {
        const r = results[c_mc];
        const info = C_VERSION_MAP[c_mc];

        const originPct = ((r.origin.passed / r.origin.total) * 100).toFixed(1);
        const farPct = ((r.far.passed / r.far.total) * 100).toFixed(1);
        const overallPct = (((r.origin.passed + r.far.passed) / (r.origin.total + r.far.total)) * 100).toFixed(1);

        const originStatus = r.origin.passed === r.origin.total ? '✓' : `✗`;
        const farStatus = r.far.passed === r.far.total ? '✓' : `✗`;

        console.log(`MC ${info.name.padEnd(10)}      ${originPct}% ${originStatus}          ${farPct}% ${farStatus}          ${overallPct}%`);
    }

    console.log("\n=== SAMPLE FAILURES ===\n");
    for (const c_mc in results) {
        const r = results[c_mc];
        const info = C_VERSION_MAP[c_mc];
        if (r.origin.failures.length > 0 || r.far.failures.length > 0) {
            console.log(`\nMC ${info.name}:`);
            if (r.origin.failures.length > 0) {
                console.log("  Origin (0,0):");
                r.origin.failures.forEach(f => {
                    console.log(`    Seed ${f.seed}: got ${f.got} (${f.gotName}), expected ${f.exp} (${f.expName}) ${f.error || ''}`);
                });
            }
            if (r.far.failures.length > 0) {
                console.log("  Far (5000,5000):");
                r.far.failures.forEach(f => {
                    console.log(`    Seed ${f.seed}: got ${f.got} (${f.gotName}), expected ${f.exp} (${f.expName}) ${f.error || ''}`);
                });
            }
        }
    }
}

runTest().catch(console.error);
