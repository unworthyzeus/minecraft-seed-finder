
const cs = 1;
const a = 1284865837;
const b = 4150755663;

const res1 = Math.imul(cs, (Math.imul(cs, a) + b) >>> 0) >>> 0;
console.log("res1:", res1);

// Standard JS way for uint32
const res2 = (Math.imul(cs, (Math.imul(cs, a) + b | 0)) >>> 0);
console.log("res2:", res2);

// Compare with expectation
// cs * (cs*a + b) = 1 * (1284865837 + 4150755663) = 5435621500
// 5435621500 % 2^32 = 1139154204
console.log("Expected:", 5435621500 % (2 ** 32));
