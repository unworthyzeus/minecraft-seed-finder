// Test getLayerSalt directly

function mcStepSeed(s, salt) {
    s = BigInt(s);
    salt = BigInt(salt);
    return (s * 6364136223846793005n + 1442695040888963407n + salt) & 0xFFFFFFFFFFFFFFFFn;
}

console.log("Step by step getLayerSalt(1) in JS:");
let salt = 1n;
console.log(`salt = ${salt}`);

let ls = mcStepSeed(salt, salt);
console.log(`after mcStepSeed(salt, salt): ls = ${ls}`);

ls = mcStepSeed(ls, salt);
console.log(`after mcStepSeed(ls, salt): ls = ${ls}`);

ls = mcStepSeed(ls, salt);
console.log(`after mcStepSeed(ls, salt): ls = ${ls}`);

console.log("\nC expected:");
console.log("salt = 1");
console.log("after mcStepSeed(salt, salt): ls = 7806831264735756413");
console.log("after mcStepSeed(ls, salt): ls = 9585855196107789609");
console.log("after mcStepSeed(ls, salt): ls = 3107951898966440229");
