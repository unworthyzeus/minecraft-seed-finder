
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';
import * as fs from 'fs';
import readline from 'node:readline';

const EXPECTED_FILE = '../cubiomes/expected_100000.txt';

async function runMassiveTest() {
    if (!fs.existsSync(EXPECTED_FILE)) {
        console.error(`Expected file not found: ${EXPECTED_FILE}`);
        return;
    }

    console.log("Testing 100,000 seeds at (0,0) and far from spawn for 1.12...");

    const fileStream = fs.createReadStream(EXPECTED_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let count = 0;
    let passedOrigin = 0;
    let passedFar = 0;
    const failedOrigin = [];
    const failedFar = [];

    const startTime = Date.now();

    for await (const line of rl) {
        const cleanedLine = line.replace(/[^\x20-\x7E]/g, '').trim();
        if (!cleanedLine || !/^-?\d+/.test(cleanedLine)) continue;

        const parts = cleanedLine.split(' ').filter(p => p.trim());
        if (parts.length < 3) continue;

        const seed = BigInt(parts[0]);
        const expOrigin = parseInt(parts[1]);
        const expFar = parseInt(parts[2]);

        const gen = new LegacyBiomeGenerator(seed, 12);
        const biomeOrigin = gen.getBiome(0, 0);
        const biomeFar = gen.getBiome(20000, 20000);

        if (biomeOrigin === expOrigin) passedOrigin++;
        else if (failedOrigin.length < 10) failedOrigin.push({ seed, got: biomeOrigin, exp: expOrigin });

        if (biomeFar === expFar) passedFar++;
        else if (failedFar.length < 10) failedFar.push({ seed, got: biomeFar, exp: expFar });

        count++;
        if (count % 1000 === 0) {
            process.stdout.write(`\rProcessed ${count}...`);
        }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\rProcessed ${count} seeds in ${duration.toFixed(1)}s (${(count / duration).toFixed(0)} seeds/s)`);

    console.log(`\n=== RESULTS ===`);
    console.log(`Origin (0,0): ${passedOrigin}/${count} passed (${(passedOrigin / count * 100).toFixed(4)}%)`);
    console.log(`Far (5000,5000): ${passedFar}/${count} passed (${(passedFar / count * 100).toFixed(4)}%)`);

    if (failedOrigin.length > 0) {
        console.log("\nSome Failed origin tests (first 10):");
        failedOrigin.forEach(f => console.log(`  Seed ${f.seed}: got ${f.got}, expected ${f.exp}`));
    }

    if (failedFar.length > 0) {
        console.log("\nSome Failed far tests (first 10):");
        failedFar.forEach(f => console.log(`  Seed ${f.seed}: got ${f.got}, expected ${f.exp}`));
    }
}

runMassiveTest();
