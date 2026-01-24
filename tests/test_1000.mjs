
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers.js';
import * as fs from 'fs';

console.log("Testing 1000 diverse seeds at (0,0) and far from spawn for 1.12:\n");

const data = fs.readFileSync('./expected_1000.txt', 'utf-8');
const lines = data.split('\n').filter(l => {
    // Remove BOM and other non-printable characters
    const cleaned = l.replace(/[^\x20-\x7E]/g, '').trim();
    // Must start with a digit or a minus sign
    return cleaned && /^-?\d+/.test(cleaned);
});
console.log(`Successfully parsed ${lines.length} seeds from expected file.`);

let passedOrigin = 0;
let passedFar = 0;
const totalTests = lines.length;

const failedOrigin = [];
const failedFar = [];

for (const line of lines) {
    const cleanedLine = line.replace(/[^\x20-\x7E]/g, '').trim();
    const parts = cleanedLine.split(' ').filter(p => p.trim());
    if (parts.length < 3) continue;

    const seed = BigInt(parts[0]);
    const expOrigin = parseInt(parts[1]);
    const expFar = parseInt(parts[2]);

    const gen = new LegacyBiomeGenerator(seed, 12);
    const biomeOrigin = gen.getBiome(0, 0);
    const biomeFar = gen.getBiome(20000, 20000);

    const originMatch = biomeOrigin === expOrigin;
    const farMatch = biomeFar === expFar;

    if (originMatch) passedOrigin++;
    else if (failedOrigin.length < 10) failedOrigin.push({ seed, got: biomeOrigin, exp: expOrigin });

    if (farMatch) passedFar++;
    else if (failedFar.length < 10) failedFar.push({ seed, got: biomeFar, exp: expFar });
}

console.log(`=== RESULTS ===`);
console.log(`Origin (0,0): ${passedOrigin}/${totalTests} passed (${(passedOrigin / totalTests * 100).toFixed(1)}%)`);
console.log(`Far (5000,5000): ${passedFar}/${totalTests} passed (${(passedFar / totalTests * 100).toFixed(1)}%)`);

if (failedOrigin.length > 0) {
    console.log("\nSome Failed origin tests (first 10):");
    failedOrigin.forEach(f => console.log(`  Seed ${f.seed}: got ${f.got}, expected ${f.exp}`));
}

if (failedFar.length > 0) {
    console.log("\nSome Failed far tests (first 10):");
    failedFar.forEach(f => console.log(`  Seed ${f.seed}: got ${f.got}, expected ${f.exp}`));
}
