import { ocean, frozen_ocean, snowy_tundra, getOldBetaBiome } from './beta_biomes.js';

class JavaRandom {
    constructor(seed, isRaw = false) {
        if (isRaw) {
            this.seed = BigInt(seed) & 0xFFFFFFFFFFFFn;
        } else {
            this.setSeed(seed);
        }
    }
    setSeed(seed) {
        this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn;
    }
    next(bits) {
        this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
        return Number(this.seed >> BigInt(48 - bits));
    }
    nextInt(n) {
        if (n <= 0) return 0;
        if ((n & -n) === n) {
            return Number((BigInt(n) * BigInt(this.next(31))) >> 31n);
        }
        let bits, val;
        do {
            bits = this.next(31);
            val = bits % n;
        } while (((bits - val + (n - 1)) | 0) < 0);
        return val;
    }
    nextDouble() {
        const l = BigInt(this.next(26)) << 27n;
        const r = BigInt(this.next(27));
        return Number(l + r) / 9007199254740992.0;
    }
}

function nextDouble(seedPtr) {
    const rnd = new JavaRandom(seedPtr.seed, true);
    const res = rnd.nextDouble();
    seedPtr.seed = rnd.seed;
    return res;
}

function nextInt(seedPtr, n) {
    const rnd = new JavaRandom(seedPtr.seed, true);
    const res = rnd.nextInt(n);
    seedPtr.seed = rnd.seed;
    return res;
}

const lerp = (t, a, b) => a + t * (b - a);
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

function maintainPrecision(x) {
    return x;
}

class PerlinNoise {
    constructor(seedOrPtr) {
        let seedPtr = (typeof seedOrPtr === 'object' && seedOrPtr !== null && 'seed' in seedOrPtr)
            ? seedOrPtr : { seed: BigInt(seedOrPtr) };

        this.a = nextDouble(seedPtr) * 256.0;
        this.b = nextDouble(seedPtr) * 256.0;
        this.c = nextDouble(seedPtr) * 256.0;
        this.amplitude = 1.0;
        this.lacunarity = 1.0;
        this.p = new Uint8Array(1024);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 0; i < 256; i++) {
            const j = nextInt(seedPtr, 256 - i) + i;
            const t = this.p[i]; this.p[i] = this.p[j]; this.p[j] = t;
        }
        for (let i = 0; i < 768; i++) this.p[i + 256] = this.p[i];

        const i2 = Math.floor(this.b);
        this.d2 = this.b - i2;
        this.h2 = i2 & 0xFF;
        this.t2 = fade(this.d2);
    }

    grad(idx, x, y, z) {
        switch (idx & 0xF) {
            case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
            case 4: return x + z; case 5: return -x + z; case 6: return x - z; case 7: return -x - z;
            case 8: return y + z; case 9: return -y + z; case 10: return y - z; case 11: return -y - z;
            case 12: return x + y; case 13: return -y + z; case 14: return -x + y; case 15: return -y - z;
            default: return 0;
        }
    }

    sample(x, y, z, yamp = 0, ymin = 0) {
        let d1 = x, d2 = y, d3 = z;
        let h1, h2, h3, t1, t2, t3;

        if (d2 === 0.0) {
            d2 = this.d2; h2 = this.h2; t2 = this.t2;
        } else {
            d2 += this.b; const i2 = Math.floor(d2); d2 -= i2; h2 = i2 & 0xFF; t2 = fade(d2);
        }

        d1 += this.a; d3 += this.c;
        const i1 = Math.floor(d1), i3 = Math.floor(d3);
        d1 -= i1; d3 -= i3; h1 = i1 & 0xFF; h3 = i3 & 0xFF;
        t1 = fade(d1); t3 = fade(d3);

        if (yamp) {
            const yclamp = ymin < d2 ? ymin : d2;
            d2 -= Math.floor(yclamp / yamp) * yamp;
        }

        const p = this.p;
        const a1 = (p[h1] + h2) & 0xFF, b1 = (p[h1 + 1] + h2) & 0xFF;
        const a2 = (p[a1] + h3) & 0xFF, b2 = (p[b1] + h3) & 0xFF;
        const a3 = (p[a1 + 1] + h3) & 0xFF, b3 = (p[b1 + 1] + h3) & 0xFF;

        let l1 = this.grad(p[a2], d1, d2, d3), l2 = this.grad(p[b2], d1 - 1, d2, d3);
        let l3 = this.grad(p[a3], d1, d2 - 1, d3), l4 = this.grad(p[b3], d1 - 1, d2 - 1, d3);
        let l5 = this.grad(p[a2 + 1], d1, d2, d3 - 1), l6 = this.grad(p[b2 + 1], d1 - 1, d2, d3 - 1);
        let l7 = this.grad(p[a3 + 1], d1, d2 - 1, d3 - 1), l8 = this.grad(p[b3 + 1], d1 - 1, d2 - 1, d3 - 1);

        l1 = lerp(t1, l1, l2); l3 = lerp(t1, l3, l4);
        l5 = lerp(t1, l5, l6); l7 = lerp(t1, l7, l8);
        return lerp(t3, lerp(t2, l1, l3), lerp(t2, l5, l7));
    }

    sampleSimplex2D(x, y) {
        const SKEW = 0.5 * (Math.sqrt(3) - 1.0);
        const UNSKEW = (3.0 - Math.sqrt(3)) / 6.0;
        const hf = (x + y) * SKEW;
        const hx = Math.floor(x + hf), hz = Math.floor(y + hf);
        const mhxz = (hx + hz) * UNSKEW;
        const x0 = x - (hx - mhxz), y0 = y - (hz - mhxz);
        const offx = (x0 > y0) ? 1 : 0, offz = (offx === 0) ? 1 : 0;
        const p = this.p;
        let gi0 = p[0xff & hz], gi1 = p[0xff & (hz + offz)], gi2 = p[0xff & (hz + 1)];
        gi0 = p[0xff & (gi0 + hx)]; gi1 = p[0xff & (gi1 + hx + offx)]; gi2 = p[0xff & (gi2 + hx + 1)];

        const sGrad = (idx, x, y, d) => {
            let con = d - x * x - y * y;
            if (con < 0) return 0;
            con *= con;
            return con * con * this.grad(idx, x, y, 0);
        };

        let t = sGrad(gi0 % 12, x0, y0, 0.5);
        t += sGrad(gi1 % 12, x0 - offx + UNSKEW, y0 - offz + UNSKEW, 0.5);
        t += sGrad(gi2 % 12, x0 - 1.0 + 2.0 * UNSKEW, y0 - 1.0 + 2.0 * UNSKEW, 0.5);
        return 70.0 * t;
    }

    sampleBeta17Terrain(v, d1, d3, yLacAmp) {
        d1 += this.a; d3 += this.c;
        const i1 = Math.floor(d1), i3 = Math.floor(d3);
        d1 -= i1; d3 -= i3;
        const t1 = fade(d1), t3 = fade(d3);
        const p = this.p, ii1 = i1 & 0xFF, ii3 = i3 & 0xFF;

        let genFlag = -1, l1 = 0, l3 = 0, l5 = 0, l7 = 0, gfCopy = 0, yic = 0;
        for (let yi = 0; yi <= 7; yi++) {
            const di2 = Math.floor(yi * this.lacunarity * yLacAmp + this.b) & 0xFF;
            if (yi === 0 || di2 !== genFlag) { yic = yi; gfCopy = genFlag; genFlag = di2; }
        }
        genFlag = gfCopy;

        for (let yi = yic; yi <= 8; yi++) {
            let d2 = yi * this.lacunarity * yLacAmp + this.b;
            const i2 = Math.floor(d2); d2 -= i2;
            const t2 = fade(d2), ii2 = i2 & 0xFF;

            if (yi === 0 || ii2 !== genFlag) {
                genFlag = ii2;
                const a1 = (p[ii1] + ii2) & 0xFF, b1 = (p[ii1 + 1] + ii2) & 0xFF;
                const a2 = (p[a1] + ii3) & 0xFF, a3 = (p[a1 + 1] + ii3) & 0xFF;
                const b2 = (p[b1] + ii3) & 0xFF, b3 = (p[b1 + 1] + ii3) & 0xFF;

                l1 = lerp(t1, this.grad(p[a2], d1, d2, d3), this.grad(p[b2], d1 - 1, d2, d3));
                l3 = lerp(t1, this.grad(p[a3], d1, d2 - 1, d3), this.grad(p[b3], d1 - 1, d2 - 1, d3));
                l5 = lerp(t1, this.grad(p[a2 + 1], d1, d2, d3 - 1), this.grad(p[b2 + 1], d1 - 1, d2, d3 - 1));
                l7 = lerp(t1, this.grad(p[a3 + 1], d1, d2 - 1, d3 - 1), this.grad(p[b3 + 1], d1 - 1, d2 - 1, d3 - 1));
            }
            if (yi >= 7) {
                v[yi - 7] += lerp(t3, lerp(t2, l1, l3), lerp(t2, l5, l7)) * this.amplitude;
            }
        }
    }
}

class OctaveNoise {
    constructor(seedPtr, count, lac, lacMul, persist, persistMul) {
        this.octcnt = count;
        this.octaves = [];
        for (let i = 0; i < count; i++) {
            const p = new PerlinNoise(seedPtr);
            p.amplitude = persist; p.lacunarity = lac;
            this.octaves.push(p);
            persist *= persistMul; lac *= lacMul;
        }
    }
    sampleModern(x, z) {
        let v = 0;
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            v += p.amplitude * p.sampleSimplex2D(x * p.lacunarity + p.a, z * p.lacunarity + p.b);
        }
        return v;
    }
    samplePerlin(x, y, z, yamp = 0, ymin = 0) {
        let v = 0;
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            const ay = (yamp === 0 && ymin === 0) ? -p.b : y * p.lacunarity;
            v += p.amplitude * p.sample(x * p.lacunarity, ay, z * p.lacunarity, yamp * p.lacunarity, ymin * p.lacunarity);
        }
        return v;
    }
    sampleBeta17Terrain(v, x, z, yLacFlag, lacmin) {
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            if (lacmin && p.lacunarity > lacmin) continue;
            p.sampleBeta17Terrain(v, x * p.lacunarity, z * p.lacunarity, yLacFlag ? 0.5 : 1.0);
        }
    }
}

class SurfaceNoiseBeta {
    constructor(seed) {
        seed = BigInt(seed);
        const createSeed = (s) => ({ seed: (BigInt(s) ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn });
        const s = createSeed(seed);
        this.octmin = new OctaveNoise(s, 16, 684.412, 0.5, 1.0, 2.0);
        this.octmax = new OctaveNoise(s, 16, 684.412, 0.5, 1.0, 2.0);
        this.octmain = new OctaveNoise(s, 8, 684.412 / 80.0, 0.5, 1.0, 2.0);
        for (let i = 0; i < 2096; i++) s.seed = (s.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
        this.octcontA = new OctaveNoise(s, 10, 1.121, 0.5, 1.0, 2.0);
        this.octcontB = new OctaveNoise(s, 16, 200.0, 0.5, 1.0, 2.0);
        this.temperature = new OctaveNoise(createSeed(seed * 9871n), 4, 1.0 / 60.0, 0.25, 0.55, 2.0);
        this.humidity = new OctaveNoise(createSeed(seed * 39811n), 4, 1.0 / 30.0, 1.0 / 3.0, 0.55, 2.0);
        this.detail = new OctaveNoise(createSeed(seed * 543321n), 2, 0.16666, 10.0 / 17.0, 0.55, 2.0);
    }

    getBiome(x, z) {
        // x, z are biome-scale (1:4)
        const t_raw = this.temperature.samplePerlin(x, 0, z);
        const h_raw = this.humidity.samplePerlin(x, 0, z);
        const f_raw = this.detail.samplePerlin(x, 0, z);

        let f = f_raw * 1.1 + 0.5;
        let t = (t_raw * 0.15 + 0.7) * 0.99 + f * 0.01;
        t = 1.0 - (1.0 - t) * (1.0 - t);
        if (t < 0) t = 0; else if (t > 1) t = 1;
        let h = (h_raw * 0.15 + 0.5) * 0.998 + f * 0.002;
        if (h < 0) h = 0; else if (h > 1) h = 1;

        const cas = this.octcontA.samplePerlin(x, 0, z, 0, 0);
        const cbs = this.octcontB.samplePerlin(x, 0, z, 0, 0);
        const minS = [0, 0], maxS = [0, 0], mainS = [0, 0];
        this.octmin.sampleBeta17Terrain(minS, x, z, 0, 1.0);
        this.octmax.sampleBeta17Terrain(maxS, x, z, 0, 1.0);
        this.octmain.sampleBeta17Terrain(mainS, x, z, 1, 1.0);

        let humiF = 1.0 - Math.pow(1.0 - t * h, 4);
        let cA = (cas + 256.0) / 512.0 * humiF;
        if (cA > 1.0) cA = 1.0;
        let cB = cbs / 8000.0;
        if (cB < 0) cB = -cB * 0.3;
        cB = cB * 3.0 - 2.0;

        if (cB > 1.0) {
            cB = (cB > 2.0) ? 1.0 : 2.0 - cB; cA = 0.5;
        } else {
            if (cB < 0) {
                cB /= 2.0; cB = (cB < -1.0) ? -1.0 / 1.4 / 2.0 : cB / 1.4 / 2.0; cA = 0;
            } else cB /= 8.0;
        }
        cA = cA < 0 ? 0.5 : cA + 0.5;
        cB = 17.0 / 2.0 + (cB * 17.0 / 16.0) * 4.0;

        let sVal = 0;
        for (let i = 0; i < 2; i++) {
            let pc = ((i + 7 - cB) * 12.0) / cA; if (pc < 0) pc *= 4.0;
            let ss = (mainS[i] / 10.0 + 1.0) / 2.0;
            let ls = minS[i] / 512.0, hs = maxS[i] / 512.0;
            let ch = (ss < 0) ? ls : (ss > 1.0) ? hs : ls + (hs - ls) * ss;
            sVal += (ch - pc) * (i === 0 ? 0.125 : 0.875);
        }
        const b = getOldBetaBiome(t, h);
        if (sVal <= 0) return (b === snowy_tundra) ? frozen_ocean : ocean;
        return b;
    }
}

class BiomeNoiseBeta {
    constructor(seed) { this.snb = new SurfaceNoiseBeta(seed); }
    sample(x, z) {
        // BiomeNoiseBeta handles its own weighting but we consolidated it in SurfaceNoiseBeta
        // Return placeholder for now
        return [0.5, 0.5];
    }
}

export { JavaRandom, PerlinNoise, OctaveNoise, BiomeNoiseBeta, SurfaceNoiseBeta, maintainPrecision };
