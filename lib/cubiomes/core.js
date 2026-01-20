/**
 * Cubiomes-JS: JavaScript port of Cubiomes
 * 
 * This is a JavaScript port of Cubiomes by Cubitect
 * Original: https://github.com/Cubitect/cubiomes
 * 
 * MIT License
 * Copyright (c) 2020 Cubitect
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

// ============================================================================
// Random Number Generators
// ============================================================================

/**
 * Java's LCG Random - used in pre-1.18 Minecraft
 */
export class JavaRandom {
    constructor(seed) {
        this.seed = BigInt(seed) & 0xFFFFFFFFFFFFn;
    }

    setSeed(value) {
        this.seed = (BigInt(value) ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn;
    }

    next(bits) {
        this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
        return Number(this.seed >> BigInt(48 - bits));
    }

    nextInt(n) {
        if (n <= 0) return 0;
        const m = n - 1;

        if ((m & n) === 0) {
            const x = BigInt(n) * BigInt(this.next(31));
            return Number(x >> 31n);
        }

        let bits, val;
        do {
            bits = this.next(31);
            val = bits % n;
        } while ((bits - val + m) < 0);
        return val;
    }

    nextLong() {
        return (BigInt(this.next(32)) << 32n) + BigInt(this.next(32));
    }

    nextFloat() {
        return this.next(24) / 16777216.0;
    }

    nextDouble() {
        const x = (BigInt(this.next(26)) << 27n) + BigInt(this.next(27));
        return Number(x) / 9007199254740992.0;
    }

    skipN(n) {
        let m = 1n;
        let a = 0n;
        let im = 0x5DEECE66Dn;
        let ia = 0xBn;

        for (let k = BigInt(n); k; k >>= 1n) {
            if (k & 1n) {
                m *= im;
                a = im * a + ia;
            }
            ia = (im + 1n) * ia;
            im *= im;
        }

        this.seed = (this.seed * m + a) & 0xFFFFFFFFFFFFn;
    }
}

/**
 * Xoroshiro128++ - used in Minecraft 1.18+
 */
export class Xoroshiro {
    constructor() {
        this.lo = 0n;
        this.hi = 0n;
    }

    static rotl64(x, k) {
        x = BigInt(x) & 0xFFFFFFFFFFFFFFFFn;
        return ((x << BigInt(k)) | (x >> BigInt(64 - k))) & 0xFFFFFFFFFFFFFFFFn;
    }

    setSeed(value) {
        const XL = 0x9E3779B97F4A7C15n;
        const XH = 0x6A09E667F3BCC909n;
        const A = 0xBF58476D1CE4E5B9n;
        const B = 0x94D049BB133111EBn;

        value = BigInt.asUintN(64, BigInt(value));
        let l = (value ^ XH) & 0xFFFFFFFFFFFFFFFFn;
        let h = (l + XL) & 0xFFFFFFFFFFFFFFFFn;

        l = ((l ^ (l >> 30n)) * A) & 0xFFFFFFFFFFFFFFFFn;
        h = ((h ^ (h >> 30n)) * A) & 0xFFFFFFFFFFFFFFFFn;
        l = ((l ^ (l >> 27n)) * B) & 0xFFFFFFFFFFFFFFFFn;
        h = ((h ^ (h >> 27n)) * B) & 0xFFFFFFFFFFFFFFFFn;
        l = (l ^ (l >> 31n)) & 0xFFFFFFFFFFFFFFFFn;
        h = (h ^ (h >> 31n)) & 0xFFFFFFFFFFFFFFFFn;

        this.lo = l;
        this.hi = h;
    }

    nextLong() {
        let l = this.lo;
        let h = this.hi;
        const n = (Xoroshiro.rotl64(l + h, 17) + l) & 0xFFFFFFFFFFFFFFFFn;

        h ^= l;
        this.lo = (Xoroshiro.rotl64(l, 49) ^ h ^ ((h << 21n) & 0xFFFFFFFFFFFFFFFFn)) & 0xFFFFFFFFFFFFFFFFn;
        this.hi = Xoroshiro.rotl64(h, 28);

        return n;
    }

    nextInt(n) {
        n = BigInt(n);
        let r = (this.nextLong() & 0xFFFFFFFFn) * n;
        if ((r & 0xFFFFFFFFn) < n) {
            while ((r & 0xFFFFFFFFn) < ((~n + 1n) & 0xFFFFFFFFn) % n) {
                r = (this.nextLong() & 0xFFFFFFFFn) * n;
            }
        }
        return Number(r >> 32n);
    }

    nextDouble() {
        return Number(this.nextLong() >> 11n) * 1.1102230246251565e-16;
    }

    nextFloat() {
        return Number(this.nextLong() >> 40n) * 5.9604645e-8;
    }
}

// ============================================================================
// Perlin Noise
// ============================================================================

/**
 * Gradient function for Perlin noise
 */
function indexedLerp(idx, a, b, c) {
    switch (idx & 0xf) {
        case 0: return a + b;
        case 1: return -a + b;
        case 2: return a - b;
        case 3: return -a - b;
        case 4: return a + c;
        case 5: return -a + c;
        case 6: return a - c;
        case 7: return -a - c;
        case 8: return b + c;
        case 9: return -b + c;
        case 10: return b - c;
        case 11: return -b - c;
        case 12: return a + b;
        case 13: return -b + c;
        case 14: return -a + b;
        case 15: return -b - c;
    }
    return 0;
}

function lerp(t, a, b) {
    return a + t * (b - a);
}

function smoothStep(x) {
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

/**
 * Perlin noise octave
 */
export class PerlinNoise {
    constructor() {
        this.a = 0;  // x offset
        this.b = 0;  // y offset  
        this.c = 0;  // z offset
        this.amplitude = 1.0;
        this.lacunarity = 1.0;
        this.d = new Uint8Array(257);  // permutation table
        // Pre-computed values for y=0
        this.h2 = 0;
        this.d2 = 0;
        this.t2 = 0;
    }

    /**
     * Initialize with Java Random (pre-1.18)
     */
    initJava(random) {
        this.a = random.nextDouble() * 256.0;
        this.b = random.nextDouble() * 256.0;
        this.c = random.nextDouble() * 256.0;
        this.amplitude = 1.0;
        this.lacunarity = 1.0;

        // Initialize permutation table
        for (let i = 0; i < 256; i++) {
            this.d[i] = i;
        }
        // Shuffle
        for (let i = 0; i < 256; i++) {
            const j = random.nextInt(256 - i) + i;
            const n = this.d[i];
            this.d[i] = this.d[j];
            this.d[j] = n;
        }
        this.d[256] = this.d[0];

        // Pre-compute for y=0
        const i2 = Math.floor(this.b);
        const d2 = this.b - i2;
        this.h2 = i2 & 0xff;
        this.d2 = d2;
        this.t2 = smoothStep(d2);
    }

    /**
     * Initialize with Xoroshiro (1.18+)
     */
    initXoroshiro(xr) {
        this.a = xr.nextDouble() * 256.0;
        this.b = xr.nextDouble() * 256.0;
        this.c = xr.nextDouble() * 256.0;
        this.amplitude = 1.0;
        this.lacunarity = 1.0;

        // Initialize permutation table
        for (let i = 0; i < 256; i++) {
            this.d[i] = i;
        }
        // Shuffle
        for (let i = 0; i < 256; i++) {
            const j = xr.nextInt(256 - i) + i;
            const n = this.d[i];
            this.d[i] = this.d[j];
            this.d[j] = n;
        }
        this.d[256] = this.d[0];

        // Pre-compute for y=0
        const i2 = Math.floor(this.b);
        const d2 = this.b - i2;
        this.h2 = i2 & 0xff;
        this.d2 = d2;
        this.t2 = smoothStep(d2);
    }

    /**
     * Sample 3D Perlin noise
     */
    sample(x, y, z, yamp = 0, ymin = 0) {
        let h1, h2, h3;
        let t1, t2, t3;
        let d1 = x + this.a;
        let d2, d3 = z + this.c;

        // Handle y dimension
        if (y === 0) {
            d2 = this.d2;
            h2 = this.h2;
            t2 = this.t2;
        } else {
            d2 = y + this.b;
            const i2 = Math.floor(d2);
            d2 -= i2;
            h2 = i2 & 0xff;
            t2 = smoothStep(d2);
        }

        const i1 = Math.floor(d1);
        const i3 = Math.floor(d3);
        d1 -= i1;
        d3 -= i3;

        h1 = i1 & 0xff;
        h3 = i3 & 0xff;

        t1 = smoothStep(d1);
        t3 = smoothStep(d3);

        if (yamp) {
            const yclamp = ymin < d2 ? ymin : d2;
            d2 -= Math.floor(yclamp / yamp) * yamp;
        }

        const idx = this.d;

        // Calculate gradients
        const a1 = idx[h1] + h2;
        const b1 = idx[h1 + 1] + h2;

        const a2 = idx[a1 & 0xff] + h3;
        const b2 = idx[b1 & 0xff] + h3;
        const a3 = idx[(a1 + 1) & 0xff] + h3;
        const b3 = idx[(b1 + 1) & 0xff] + h3;

        let l1 = indexedLerp(idx[a2 & 0xff], d1, d2, d3);
        let l2 = indexedLerp(idx[b2 & 0xff], d1 - 1, d2, d3);
        let l3 = indexedLerp(idx[a3 & 0xff], d1, d2 - 1, d3);
        let l4 = indexedLerp(idx[b3 & 0xff], d1 - 1, d2 - 1, d3);
        let l5 = indexedLerp(idx[(a2 + 1) & 0xff], d1, d2, d3 - 1);
        let l6 = indexedLerp(idx[(b2 + 1) & 0xff], d1 - 1, d2, d3 - 1);
        let l7 = indexedLerp(idx[(a3 + 1) & 0xff], d1, d2 - 1, d3 - 1);
        let l8 = indexedLerp(idx[(b3 + 1) & 0xff], d1 - 1, d2 - 1, d3 - 1);

        // Interpolate
        l1 = lerp(t1, l1, l2);
        l3 = lerp(t1, l3, l4);
        l5 = lerp(t1, l5, l6);
        l7 = lerp(t1, l7, l8);

        l1 = lerp(t2, l1, l3);
        l5 = lerp(t2, l5, l7);

        return lerp(t3, l1, l5);
    }
}

/**
 * Simplex 2D noise (used for End generation)
 */
export function sampleSimplex2D(noise, x, y) {
    const SKEW = 0.5 * (Math.sqrt(3) - 1.0);
    const UNSKEW = (3.0 - Math.sqrt(3)) / 6.0;

    const hf = (x + y) * SKEW;
    const hx = Math.floor(x + hf);
    const hz = Math.floor(y + hf);
    const mhxz = (hx + hz) * UNSKEW;
    const x0 = x - (hx - mhxz);
    const y0 = y - (hz - mhxz);
    const offx = x0 > y0 ? 1 : 0;
    const offz = x0 > y0 ? 0 : 1;
    const x1 = x0 - offx + UNSKEW;
    const y1 = y0 - offz + UNSKEW;
    const x2 = x0 - 1.0 + 2.0 * UNSKEW;
    const y2 = y0 - 1.0 + 2.0 * UNSKEW;

    let gi0 = noise.d[0xff & hz];
    let gi1 = noise.d[0xff & (hz + offz)];
    let gi2 = noise.d[0xff & (hz + 1)];
    gi0 = noise.d[0xff & (gi0 + hx)];
    gi1 = noise.d[0xff & (gi1 + hx + offx)];
    gi2 = noise.d[0xff & (gi2 + hx + 1)];

    function simplexGrad(idx, x, y, z, d) {
        const con = d - x * x - y * y - z * z;
        if (con < 0) return 0;
        return con * con * con * con * indexedLerp(idx, x, y, z);
    }

    let t = 0;
    t += simplexGrad(gi0 % 12, x0, y0, 0.0, 0.5);
    t += simplexGrad(gi1 % 12, x1, y1, 0.0, 0.5);
    t += simplexGrad(gi2 % 12, x2, y2, 0.0, 0.5);
    return 70.0 * t;
}

// ============================================================================
// Octave Noise
// ============================================================================

// MD5 hashes for octave salting (from Cubiomes noise.c)
const MD5_OCTAVE_N = [
    [0xb198de63a8012672n, 0x7b84cad43ef7b5a8n], // octave_-12
    [0x0fd787bfbc403ec3n, 0x74a4a31ca21b48b8n], // octave_-11
    [0x36d326eed40efeb2n, 0x5be9ce18223c636an], // octave_-10
    [0x082fe255f8be6631n, 0x4e96119e22dedc81n], // octave_-9
    [0x0ef68ec68504005en, 0x48b6bf93a2789640n], // octave_-8
    [0xf11268128982754fn, 0x257a1d670430b0aan], // octave_-7
    [0xe51c98ce7d1de664n, 0x5f9478a733040c45n], // octave_-6
    [0x6d7b49e7e429850an, 0x2e3063c622a24777n], // octave_-5
    [0xbd90d5377ba1b762n, 0xc07317d419a7548dn], // octave_-4
    [0x53d39c6752dac858n, 0xbcd1c5a80ab65b3en], // octave_-3
    [0xb4a24d7a84e7677bn, 0x023ff9668e89b5c4n], // octave_-2
    [0xdffa22b534c5f608n, 0xb9b67517d3665ca9n], // octave_-1
    [0xd50708086cef4d7cn, 0x6e1651ecc7f43309n], // octave_0
];

// Precomputed lacunarity and persistence values
const LACUNA_INI = [1, 0.5, 0.25, 1 / 8, 1 / 16, 1 / 32, 1 / 64, 1 / 128, 1 / 256, 1 / 512, 1 / 1024, 1 / 2048, 1 / 4096];
const PERSIST_INI = [0, 1, 2 / 3, 4 / 7, 8 / 15, 16 / 31, 32 / 63, 64 / 127, 128 / 255, 256 / 511];

/**
 * Multi-octave noise generator
 */
export class OctaveNoise {
    constructor() {
        this.octaves = [];
        this.octcnt = 0;
    }

    /**
     * Initialize octaves with Java random (pre-1.18)
     */
    initJava(random, omin, len) {
        const end = omin + len - 1;
        let persist = 1.0 / ((1 << len) - 1);
        let lacuna = Math.pow(2.0, end);

        if (len < 1 || end > 0) {
            console.error('OctaveNoise: unsupported octave range');
            return;
        }

        this.octaves = [];
        let i = 0;

        if (end === 0) {
            const p = new PerlinNoise();
            p.initJava(random);
            p.amplitude = persist;
            p.lacunarity = lacuna;
            this.octaves.push(p);
            persist *= 2.0;
            lacuna *= 0.5;
            i = 1;
        } else {
            random.skipN(-end * 262);
        }

        for (; i < len; i++) {
            const p = new PerlinNoise();
            p.initJava(random);
            p.amplitude = persist;
            p.lacunarity = lacuna;
            this.octaves.push(p);
            persist *= 2.0;
            lacuna *= 0.5;
        }

        this.octcnt = this.octaves.length;
    }

    /**
     * Initialize octaves with Xoroshiro and amplitudes (1.18+ style)
     * Matches cubiomes xOctaveInit()
     * @param {bigint} xlo - Low bits from Xoroshiro
     * @param {bigint} xhi - High bits from Xoroshiro
     * @param {number[]} amplitudes - Amplitude array for each octave
     * @param {number} omin - First octave (negative, e.g., -9)
     * @param {number} len - Length of amplitudes array
     * @param {number} nmax - Maximum octaves to initialize (-1 for all)
     * @returns {number} Number of octaves initialized
     */
    xOctaveInit(xlo, xhi, amplitudes, omin, len, nmax = -1) {
        const lacunaIdx = -omin;
        let lacuna = lacunaIdx < LACUNA_INI.length ? LACUNA_INI[lacunaIdx] : Math.pow(2, omin + len - 1);
        let persist = len < PERSIST_INI.length ? PERSIST_INI[len] : 1.0 / ((1 << len) - 1);

        this.octaves = [];
        let n = 0;

        for (let i = 0; i < len && (nmax < 0 || n < nmax); i++) {
            if (amplitudes[i] !== 0) {
                // Get MD5 salt for this octave
                const saltIdx = 12 + omin + i;
                const pxr = new Xoroshiro();

                if (saltIdx >= 0 && saltIdx < MD5_OCTAVE_N.length) {
                    pxr.lo = xlo ^ MD5_OCTAVE_N[saltIdx][0];
                    pxr.hi = xhi ^ MD5_OCTAVE_N[saltIdx][1];
                } else {
                    // Fallback for out-of-range octaves
                    pxr.lo = xlo ^ BigInt(saltIdx * 0x9E3779B97F4A7C15n);
                    pxr.hi = xhi ^ BigInt(saltIdx * 0x6A09E667F3BCC909n);
                }

                const p = new PerlinNoise();
                p.initXoroshiro(pxr);
                p.amplitude = amplitudes[i] * persist;
                p.lacunarity = lacuna;
                this.octaves.push(p);

                n++;
            }

            // Always update persistence and lacunarity
            persist *= 0.5;
            lacuna *= 2.0;
        }

        this.octcnt = this.octaves.length;
        return n;
    }

    /**
     * Sample multi-octave noise
     */
    sample(x, y, z) {
        let v = 0;
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            const lf = p.lacunarity;
            const ax = maintainPrecision(x * lf);
            const ay = maintainPrecision(y * lf);
            const az = maintainPrecision(z * lf);
            const pv = p.sample(ax, ay, az);
            v += p.amplitude * pv;
        }
        return v;
    }
}

/**
 * Double Perlin Noise (1.18+ climate noise)
 * Matches cubiomes xDoublePerlinInit()
 */
export class DoublePerlinNoise {
    constructor() {
        this.amplitude = 0;
        this.octA = new OctaveNoise();
        this.octB = new OctaveNoise();
    }

    /**
     * Initialize Double Perlin noise with Xoroshiro (1.18+ style)
     * @param {Xoroshiro} xr - Xoroshiro random generator (will be advanced)
     * @param {number[]} amplitudes - Amplitude array for each octave
     * @param {number} omin - First octave (negative, e.g., -9)
     * @param {number} len - Length of amplitudes array
     */
    initXoroshiro(xr, amplitudes, omin, len) {
        // Initialize both octave sets with their own nextLong() pairs
        const xloA = xr.nextLong();
        const xhiA = xr.nextLong();
        this.octA.xOctaveInit(xloA, xhiA, amplitudes, omin, len, -1);

        const xloB = xr.nextLong();
        const xhiB = xr.nextLong();
        this.octB.xOctaveInit(xloB, xhiB, amplitudes, omin, len, -1);

        // Calculate amplitude based on trimmed length (matching cubiomes logic)
        let first = 0;
        while (first < len && amplitudes[first] === 0) first++;

        let last = len - 1;
        while (last >= 0 && amplitudes[last] === 0) last--;

        const effectiveLen = (last < first) ? 0 : (last - first + 1);

        // Amplitude table from cubiomes: (5/3) * len / (len + 1)
        const AMP_INI = [0, 5 / 6, 10 / 9, 15 / 12, 20 / 15, 25 / 18, 30 / 21, 35 / 24, 40 / 27, 45 / 30];
        this.amplitude = effectiveLen < AMP_INI.length ? AMP_INI[effectiveLen] : (5 / 3) * effectiveLen / (effectiveLen + 1);
    }

    sample(x, y, z) {
        const f = 337.0 / 331.0;
        let v = 0;
        v += this.octA.sample(x, y, z);
        v += this.octB.sample(x * f, y * f, z * f);
        return v * this.amplitude;
    }
}

/**
 * Maintain precision by wrapping large coordinates
 */
function maintainPrecision(x) {
    // Wrap to avoid floating point precision issues at large coordinates
    // Current cubiomes implementation (noise.h) returns x as-is for doubles.
    // return x - 33554432.0 * Math.round(x / 33554432.0);
    return x;
}

// ============================================================================
// Minecraft Seed Helpers
// ============================================================================

export function mcStepSeed(s, salt) {
    s = BigInt(s);
    salt = BigInt(salt);
    return (s * (s * 6364136223846793005n + 1442695040888963407n) + salt) & 0xFFFFFFFFFFFFFFFFn;
}

export function getLayerSalt(salt) {
    salt = BigInt(salt);
    let ls = mcStepSeed(salt, salt);
    ls = mcStepSeed(ls, salt);
    ls = mcStepSeed(ls, salt);
    return ls;
}

export function getStartSalt(ws, ls) {
    ws = BigInt(ws);
    ls = BigInt(ls);
    let st = ws;
    st = mcStepSeed(st, ls);
    st = mcStepSeed(st, ls);
    st = mcStepSeed(st, ls);
    return st;
}

export function getStartSeed(ws, ls) {
    let ss = getStartSalt(BigInt(ws), BigInt(ls));
    ss = mcStepSeed(ss, 0n);
    return ss;
}

export function getChunkSeed(ss, x, z) {
    ss = BigInt(ss);
    let cs = ss + BigInt(x);
    cs = mcStepSeed(cs, BigInt(z));
    cs = mcStepSeed(cs, BigInt(x));
    cs = mcStepSeed(cs, BigInt(z));
    return cs;
}

// ============================================================================
// Biome IDs (matching Cubiomes)
// ============================================================================

export const BiomeID = {
    none: -1,
    ocean: 0,
    plains: 1,
    desert: 2,
    mountains: 3,
    forest: 4,
    taiga: 5,
    swamp: 6,
    river: 7,
    nether_wastes: 8,
    the_end: 9,
    frozen_ocean: 10,
    frozen_river: 11,
    snowy_tundra: 12,
    snowy_mountains: 13,
    mushroom_fields: 14,
    mushroom_field_shore: 15,
    beach: 16,
    desert_hills: 17,
    wooded_hills: 18,
    taiga_hills: 19,
    mountain_edge: 20,
    jungle: 21,
    jungle_hills: 22,
    jungle_edge: 23,
    deep_ocean: 24,
    stone_shore: 25,
    snowy_beach: 26,
    birch_forest: 27,
    birch_forest_hills: 28,
    dark_forest: 29,
    snowy_taiga: 30,
    snowy_taiga_hills: 31,
    giant_tree_taiga: 32,
    giant_tree_taiga_hills: 33,
    wooded_mountains: 34,
    savanna: 35,
    savanna_plateau: 36,
    badlands: 37,
    wooded_badlands_plateau: 38,
    badlands_plateau: 39,
    small_end_islands: 40,
    end_midlands: 41,
    end_highlands: 42,
    end_barrens: 43,
    warm_ocean: 44,
    lukewarm_ocean: 45,
    cold_ocean: 46,
    deep_warm_ocean: 47,
    deep_lukewarm_ocean: 48,
    deep_cold_ocean: 49,
    deep_frozen_ocean: 50,

    // Mutated variants (ID + 128)
    sunflower_plains: 129,
    desert_lakes: 130,
    gravelly_mountains: 131,
    flower_forest: 132,
    taiga_mountains: 133,
    swamp_hills: 134,
    ice_spikes: 140,
    modified_jungle: 149,
    modified_jungle_edge: 151,
    tall_birch_forest: 155,
    tall_birch_hills: 156,
    dark_forest_hills: 157,
    snowy_taiga_mountains: 158,
    giant_spruce_taiga: 160,
    giant_spruce_taiga_hills: 161,
    modified_gravelly_mountains: 162,
    shattered_savanna: 163,
    shattered_savanna_plateau: 164,
    eroded_badlands: 165,
    modified_wooded_badlands_plateau: 166,
    modified_badlands_plateau: 167,

    // 1.14+
    bamboo_jungle: 168,
    bamboo_jungle_hills: 169,

    // 1.16+
    soul_sand_valley: 170,
    crimson_forest: 171,
    warped_forest: 172,
    basalt_deltas: 173,

    // 1.17+
    dripstone_caves: 174,
    lush_caves: 175,

    // 1.18+
    meadow: 177,
    grove: 178,
    snowy_slopes: 179,
    jagged_peaks: 180,
    frozen_peaks: 181,
    stony_peaks: 182,

    // 1.19+
    deep_dark: 183,
    mangrove_swamp: 184,

    // 1.20+
    cherry_grove: 185,

    // 1.21+
    pale_garden: 186,
};

// Biome name lookup
export const BiomeNames = Object.fromEntries(
    Object.entries(BiomeID).map(([k, v]) => [v, k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())])
);

// ============================================================================
// Biome Colors (for visualization)
// ============================================================================

export const BiomeColors = {
    [BiomeID.ocean]: '#000070',
    [BiomeID.plains]: '#8DB360',
    [BiomeID.desert]: '#FA9418',
    [BiomeID.mountains]: '#606060',
    [BiomeID.forest]: '#056621',
    [BiomeID.taiga]: '#0B6659',
    [BiomeID.swamp]: '#07F9B2',
    [BiomeID.river]: '#0000FF',
    [BiomeID.frozen_ocean]: '#7090B0',
    [BiomeID.frozen_river]: '#A0A0FF',
    [BiomeID.snowy_tundra]: '#FFFFFF',
    [BiomeID.snowy_mountains]: '#A0A0A0',
    [BiomeID.mushroom_fields]: '#FF00FF',
    [BiomeID.mushroom_field_shore]: '#A000FF',
    [BiomeID.beach]: '#FADE55',
    [BiomeID.desert_hills]: '#D25F12',
    [BiomeID.wooded_hills]: '#22551C',
    [BiomeID.taiga_hills]: '#163933',
    [BiomeID.mountain_edge]: '#72789A',
    [BiomeID.jungle]: '#537B09',
    [BiomeID.jungle_hills]: '#2C4205',
    [BiomeID.jungle_edge]: '#628B17',
    [BiomeID.deep_ocean]: '#000030',
    [BiomeID.stone_shore]: '#A2A284',
    [BiomeID.snowy_beach]: '#FAF0C0',
    [BiomeID.birch_forest]: '#307444',
    [BiomeID.birch_forest_hills]: '#1F5F32',
    [BiomeID.dark_forest]: '#40511A',
    [BiomeID.snowy_taiga]: '#31554A',
    [BiomeID.snowy_taiga_hills]: '#243F36',
    [BiomeID.giant_tree_taiga]: '#596651',
    [BiomeID.giant_tree_taiga_hills]: '#454F3E',
    [BiomeID.wooded_mountains]: '#507050',
    [BiomeID.savanna]: '#BDB25F',
    [BiomeID.savanna_plateau]: '#A79D64',
    [BiomeID.badlands]: '#D94515',
    [BiomeID.wooded_badlands_plateau]: '#B09765',
    [BiomeID.badlands_plateau]: '#CA8C65',
    [BiomeID.warm_ocean]: '#0000AC',
    [BiomeID.lukewarm_ocean]: '#000090',
    [BiomeID.cold_ocean]: '#202070',
    [BiomeID.deep_warm_ocean]: '#000050',
    [BiomeID.deep_lukewarm_ocean]: '#000040',
    [BiomeID.deep_cold_ocean]: '#202038',
    [BiomeID.deep_frozen_ocean]: '#404090',
    [BiomeID.sunflower_plains]: '#B5DB88',
    [BiomeID.flower_forest]: '#2D8E49',
    [BiomeID.ice_spikes]: '#B4DCDC',
    [BiomeID.tall_birch_forest]: '#589C6C',
    [BiomeID.shattered_savanna]: '#E5DA87',
    [BiomeID.eroded_badlands]: '#FF6D3D',
    [BiomeID.bamboo_jungle]: '#768E14',
    [BiomeID.meadow]: '#83BB6D',
    [BiomeID.grove]: '#88BB67',
    [BiomeID.snowy_slopes]: '#E0E0E0',
    [BiomeID.jagged_peaks]: '#C0C0C0',
    [BiomeID.frozen_peaks]: '#A0A0C0',
    [BiomeID.stony_peaks]: '#888888',
    [BiomeID.mangrove_swamp]: '#67352B',
    [BiomeID.cherry_grove]: '#FFB7C5',
    [BiomeID.deep_dark]: '#0B1014',
};

// Default color for unknown biomes
export function getBiomeColor(id) {
    return BiomeColors[id] || '#808080';
}
