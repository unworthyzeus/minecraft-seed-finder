
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';

console.log("Testing 100 seeds at (0,0) and far from spawn for 1.12:\n");

// Expected values from C cubiomes
const expected = {
    0: { origin: 4, far: 0 }, 1: { origin: 0, far: 25 }, 2: { origin: 18, far: 1 },
    3: { origin: 34, far: 36 }, 4: { origin: 24, far: 24 }, 5: { origin: 24, far: 1 },
    6: { origin: 0, far: 12 }, 7: { origin: 6, far: 12 }, 8: { origin: 0, far: 2 },
    9: { origin: 6, far: 0 }, 10: { origin: 27, far: 4 }, 11: { origin: 18, far: 16 },
    12: { origin: 18, far: 18 }, 13: { origin: 24, far: 29 }, 14: { origin: 30, far: 5 },
    15: { origin: 24, far: 24 }, 16: { origin: 1, far: 30 }, 17: { origin: 1, far: 3 },
    18: { origin: 0, far: 0 }, 19: { origin: 32, far: 12 }, 20: { origin: 4, far: 24 },
    21: { origin: 18, far: 6 }, 22: { origin: 18, far: 16 }, 23: { origin: 24, far: 29 },
    24: { origin: 4, far: 24 }, 25: { origin: 129, far: 0 }, 26: { origin: 0, far: 24 },
    27: { origin: 1, far: 4 }, 28: { origin: 0, far: 140 }, 29: { origin: 19, far: 0 },
    30: { origin: 28, far: 0 }, 31: { origin: 5, far: 3 }, 32: { origin: 4, far: 24 },
    33: { origin: 7, far: 3 }, 34: { origin: 4, far: 0 }, 35: { origin: 4, far: 24 },
    36: { origin: 6, far: 24 }, 37: { origin: 24, far: 2 }, 38: { origin: 2, far: 28 },
    39: { origin: 7, far: 3 }, 40: { origin: 18, far: 24 }, 41: { origin: 1, far: 24 },
    42: { origin: 12, far: 12 }, 43: { origin: 129, far: 35 }, 44: { origin: 29, far: 24 },
    45: { origin: 16, far: 0 }, 46: { origin: 29, far: 0 }, 47: { origin: 18, far: 1 },
    48: { origin: 155, far: 36 }, 49: { origin: 2, far: 0 }, 50: { origin: 4, far: 0 },
    51: { origin: 0, far: 30 }, 52: { origin: 4, far: 35 }, 53: { origin: 24, far: 6 },
    54: { origin: 0, far: 0 }, 55: { origin: 0, far: 24 }, 56: { origin: 24, far: 4 },
    57: { origin: 24, far: 25 }, 58: { origin: 25, far: 5 }, 59: { origin: 140, far: 4 },
    60: { origin: 24, far: 24 }, 61: { origin: 22, far: 3 }, 62: { origin: 35, far: 6 },
    63: { origin: 4, far: 17 }, 64: { origin: 0, far: 12 }, 65: { origin: 0, far: 1 },
    66: { origin: 12, far: 4 }, 67: { origin: 1, far: 1 }, 68: { origin: 163, far: 24 },
    69: { origin: 6, far: 24 }, 70: { origin: 129, far: 4 }, 71: { origin: 21, far: 17 },
    72: { origin: 0, far: 29 }, 73: { origin: 1, far: 0 }, 74: { origin: 0, far: 6 },
    75: { origin: 1, far: 24 }, 76: { origin: 0, far: 12 }, 77: { origin: 32, far: 26 },
    78: { origin: 0, far: 6 }, 79: { origin: 0, far: 1 }, 80: { origin: 24, far: 0 },
    81: { origin: 4, far: 6 }, 82: { origin: 6, far: 0 }, 83: { origin: 162, far: 0 },
    84: { origin: 37, far: 0 }, 85: { origin: 19, far: 24 }, 86: { origin: 38, far: 1 },
    87: { origin: 21, far: 27 }, 88: { origin: 6, far: 16 }, 89: { origin: 24, far: 24 },
    90: { origin: 34, far: 28 }, 91: { origin: 4, far: 5 }, 92: { origin: 32, far: 1 },
    93: { origin: 33, far: 0 }, 94: { origin: 28, far: 16 }, 95: { origin: 4, far: 0 },
    96: { origin: 0, far: 0 }, 97: { origin: 7, far: 1 }, 98: { origin: 130, far: 32 },
    99: { origin: 0, far: 24 }
};

let passedOrigin = 0;
let passedFar = 0;
const totalTests = 100;

const failedOrigin = [];
const failedFar = [];

for (let seed = 0; seed < totalTests; seed++) {
    const gen = new LegacyBiomeGenerator(BigInt(seed), 12);
    const biomeOrigin = gen.getBiome(0, 0);
    const biomeFar = gen.getBiome(5000, 5000);

    const expOrigin = expected[seed].origin;
    const expFar = expected[seed].far;

    const originMatch = biomeOrigin === expOrigin;
    const farMatch = biomeFar === expFar;

    if (originMatch) passedOrigin++;
    else failedOrigin.push({ seed, got: biomeOrigin, exp: expOrigin });

    if (farMatch) passedFar++;
    else failedFar.push({ seed, got: biomeFar, exp: expFar });
}

console.log(`=== RESULTS ===`);
console.log(`Origin (0,0): ${passedOrigin}/${totalTests} passed (${(passedOrigin / totalTests * 100).toFixed(1)}%)`);
console.log(`Far (5000,5000): ${passedFar}/${totalTests} passed (${(passedFar / totalTests * 100).toFixed(1)}%)`);

if (failedOrigin.length > 0 && failedOrigin.length <= 10) {
    console.log("\nFailed origin tests:");
    failedOrigin.forEach(f => console.log(`  Seed ${f.seed}: got ${f.got}, expected ${f.exp}`));
}

if (failedFar.length > 0 && failedFar.length <= 10) {
    console.log("\nFailed far tests:");
    failedFar.forEach(f => console.log(`  Seed ${f.seed}: got ${f.got}, expected ${f.exp}`));
}
