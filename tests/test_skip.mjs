// Test skipNextN equivalence

// JavaScript implementation
function skipNextN_loop(seed, n) {
    let s = BigInt(seed) & 0xFFFFFFFFFFFFn;
    for (let i = 0; i < n; i++) {
        s = (s * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
    }
    return s;
}

function skipNextN_fast(seed, n) {
    n = BigInt(n);
    let m = 1n;
    let a = 0n;
    let im = 0x5DEECE66Dn;
    let ia = 0xBn;

    for (let k = n; k; k >>= 1n) {
        if (k & 1n) {
            m = (m * im) & 0xFFFFFFFFFFFFn;
            a = (im * a + ia) & 0xFFFFFFFFFFFFn;
        }
        ia = ((im + 1n) * ia) & 0xFFFFFFFFFFFFn;
        im = (im * im) & 0xFFFFFFFFFFFFn;
    }

    return ((BigInt(seed) * m + a) & 0xFFFFFFFFFFFFn);
}

// Test with a known seed
const seed = (12345n ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn;
const n = 2096;

console.log("Testing skipNextN implementations...");
console.log(`Initial seed: ${seed}`);
console.log(`Skip count: ${n}`);
console.log();

const loop_result = skipNextN_loop(seed, n);
const fast_result = skipNextN_fast(seed, n);

console.log(`Loop result: ${loop_result}`);
console.log(`Fast result: ${fast_result}`);
console.log(`Match: ${loop_result === fast_result}`);
