
class JavaRandom {
    constructor(seed) {
        this.setSeed(seed);
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
        if ((n & -n) === n) { // Power of 2
            return Number((BigInt(n) * BigInt(this.next(31))) >> 31n);
        }
        let bits, val;
        do {
            bits = this.next(31);
            val = bits % n;
        } while (bits - val + (n - 1) < 0);
        return val;
    }
    nextDouble() {
        const l = BigInt(this.next(26)) << 27n;
        const r = BigInt(this.next(27));
        return Number(l + r) / 9007199254740992.0; // 1 << 53
    }
}

function nextDouble(seedPtr) {
    const rnd = new JavaRandom(seedPtr.seed);
    const res = rnd.nextDouble();
    seedPtr.seed = rnd.seed;
    return res;
}

function nextInt(seedPtr, n) {
    const rnd = new JavaRandom(seedPtr.seed);
    const res = rnd.nextInt(n);
    seedPtr.seed = rnd.seed;
    return res;
}

const lerp = (t, a, b) => a + t * (b - a);
const lerp4 = (a, b, c, d, dy, dx, dz) => {
    // a,b,c,d are arrays [v0, v1]
    const b00 = a[0] + (a[1] - a[0]) * dy;
    const b01 = b[0] + (b[1] - b[0]) * dy;
    const b10 = c[0] + (c[1] - c[0]) * dy;
    const b11 = d[0] + (d[1] - d[0]) * dy;
    const b0 = b00 + (b10 - b00) * dz;
    const b1 = b01 + (b11 - b01) * dz;
    return b0 + (b1 - b0) * dx;
};
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

function maintainPrecision(x) {
    return x - Math.floor(x / 33554432.0) * 33554432.0;
}

class PerlinNoise {
    constructor(seedOrPtr) {
        let seedPtr;
        if (typeof seedOrPtr === 'object' && seedOrPtr !== null && 'seed' in seedOrPtr) {
            seedPtr = seedOrPtr;
        } else {
            seedPtr = { seed: BigInt(seedOrPtr) };
        }

        this.a = nextDouble(seedPtr) * 256.0;
        this.b = nextDouble(seedPtr) * 256.0;
        this.c = nextDouble(seedPtr) * 256.0;
        this.amplitude = 1.0;
        this.lacunarity = 1.0;
        this.p = new Uint8Array(256 + 1);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 0; i < 256; i++) {
            const j = nextInt(seedPtr, 256 - i) + i;
            const t = this.p[i]; this.p[i] = this.p[j]; this.p[j] = t;
        }
        this.p[256] = this.p[0];

        // precompute for d2=0 case
        const i2 = Math.floor(this.b);
        this.d2 = this.b - i2;
        this.h2 = i2 & 0xFF;
        this.t2 = fade(this.d2);
    }

    grad(idx, x, y, z) {
        switch (idx & 0xF) {
            case 0: return x + y;
            case 1: return -x + y;
            case 2: return x - y;
            case 3: return -x - y;
            case 4: return x + z;
            case 5: return -x + z;
            case 6: return x - z;
            case 7: return -x - z;
            case 8: return y + z;
            case 9: return -y + z;
            case 10: return y - z;
            case 11: return -y - z;
            case 12: return x + y;
            case 13: return -y + z;
            case 14: return x - y;
            case 15: return -y - z;
            default: return 0;
        }
    }


    sample(x, y, z, yamp = 0, ymin = 0) {
        let d1 = x, d2 = y, d3 = z;
        let h1, h2, h3, t1, t2, t3;

        if (d2 === 0.0) {
            d2 = this.d2;
            h2 = this.h2;
            t2 = this.t2;
        } else {
            d2 += this.b;
            const i2 = Math.floor(d2);
            d2 -= i2;
            h2 = i2 & 0xFF;
            t2 = fade(d2);
        }

        d1 += this.a;
        d3 += this.c;
        const i1 = Math.floor(d1);
        const i3 = Math.floor(d3);
        d1 -= i1;
        d3 -= i3;
        h1 = i1 & 0xFF;
        h3 = i3 & 0xFF;

        t1 = fade(d1);
        t3 = fade(d3);

        if (yamp) {
            const yclamp = ymin < d2 ? ymin : d2;
            d2 -= Math.floor(yclamp / yamp) * yamp;
        }

        const p = this.p;
        const a1 = (p[h1] + h2) & 0xFF;
        const b1 = (p[h1 + 1] + h2) & 0xFF;
        const a2 = (p[a1] + h3) & 0xFF;
        const b2 = (p[b1] + h3) & 0xFF;
        const a3 = (p[a1 + 1] + h3) & 0xFF;
        const b3 = (p[b1 + 1] + h3) & 0xFF;

        let l1 = this.grad(p[a2], d1, d2, d3);
        let l2 = this.grad(p[b2], d1 - 1, d2, d3);
        let l3 = this.grad(p[a3], d1, d2 - 1, d3);
        let l4 = this.grad(p[b3], d1 - 1, d2 - 1, d3);
        let l5 = this.grad(p[a2 + 1], d1, d2, d3 - 1);
        let l6 = this.grad(p[b2 + 1], d1 - 1, d2, d3 - 1);
        let l7 = this.grad(p[a3 + 1], d1, d2 - 1, d3 - 1);
        let l8 = this.grad(p[b3 + 1], d1 - 1, d2 - 1, d3 - 1);

        l1 = lerp(t1, l1, l2);
        l3 = lerp(t1, l3, l4);
        l5 = lerp(t1, l5, l6);
        l7 = lerp(t1, l7, l8);

        l1 = lerp(t2, l1, l3);
        l5 = lerp(t2, l5, l7);

        return lerp(t3, l1, l5);
    }

    sampleSimplex2D(x, y) {
        const SKEW = 0.5 * (Math.sqrt(3) - 1.0);
        const UNSKEW = (3.0 - Math.sqrt(3)) / 6.0;

        const hf = (x + y) * SKEW;
        const hx = Math.floor(x + hf);
        const hz = Math.floor(y + hf);
        const mhxz = (hx + hz) * UNSKEW;
        const x0 = x - (hx - mhxz);
        const y0 = y - (hz - mhxz);

        const offx = (x0 > y0) ? 1 : 0;
        const offz = (offx === 0) ? 1 : 0;

        const x1 = x0 - offx + UNSKEW;
        const y1 = y0 - offz + UNSKEW;
        const x2 = x0 - 1.0 + 2.0 * UNSKEW;
        const y2 = y0 - 1.0 + 2.0 * UNSKEW;

        const p = this.p;
        let gi0 = p[0xff & hz];
        let gi1 = p[0xff & (hz + offz)];
        let gi2 = p[0xff & (hz + 1)];
        gi0 = p[0xff & (gi0 + hx)];
        gi1 = p[0xff & (gi1 + hx + offx)];
        gi2 = p[0xff & (gi2 + hx + 1)];

        const simplexGrad = (idx, x, y, z, d) => {
            let con = d - x * x - y * y - z * z;
            if (con < 0) return 0;
            con *= con;
            return con * con * this.grad(idx, x, y, z);
        };

        let t = 0;
        t += simplexGrad(gi0 % 12, x0, y0, 0.0, 0.5);
        t += simplexGrad(gi1 % 12, x1, y1, 0.0, 0.5);
        t += simplexGrad(gi2 % 12, x2, y2, 0.0, 0.5);
        return 70.0 * t;
    }

    sampleBeta17Terrain(v, d1, d3, yLacAmp) {
        d1 += this.a;
        d3 += this.c;
        const i1 = Math.floor(d1);
        const i3 = Math.floor(d3);
        d1 -= i1;
        d3 -= i3;
        const t1 = fade(d1);
        const t3 = fade(d3);

        const p = this.p;
        // i1 & 0xFF implicit in p access due to 256 size if we did p[i1&0xFF]?
        // JS array access is not modulo. We need to mask.
        const ii1 = i1 & 0xFF;
        const ii3 = i3 & 0xFF;

        let genFlag = -1;
        let l1 = 0, l3 = 0, l5 = 0, l7 = 0;
        let gfCopy = 0, yic = 0;

        // First loop: check genFlag logic
        for (let yi = 0; yi <= 7; yi++) {
            const d2 = yi * this.lacunarity * yLacAmp + this.b;
            const i2 = Math.floor(d2) & 0xFF;
            if (yi === 0 || i2 !== genFlag) {
                yic = yi;
                gfCopy = genFlag;
                genFlag = i2;
            }
        }
        genFlag = gfCopy;

        for (let yi = yic; yi <= 8; yi++) {
            let d2 = yi * this.lacunarity * yLacAmp + this.b;
            const i2 = Math.floor(d2);
            d2 -= i2;
            const t2 = fade(d2);
            const ii2 = i2 & 0xFF;

            if (yi === 0 || ii2 !== genFlag) {
                genFlag = ii2;
                const a1 = (p[ii1] + ii2) & 0xFF;
                const b1 = (p[ii1 + 1] + ii2) & 0xFF;
                const a2 = (p[a1] + ii3) & 0xFF;
                const a3 = (p[a1 + 1] + ii3) & 0xFF;
                const b2 = (p[b1] + ii3) & 0xFF;
                const b3 = (p[b1 + 1] + ii3) & 0xFF;

                let m1 = this.grad(p[a2], d1, d2, d3);
                let m2 = this.grad(p[b2], d1 - 1, d2, d3);
                let m3 = this.grad(p[a3], d1, d2 - 1, d3);
                let m4 = this.grad(p[b3], d1 - 1, d2 - 1, d3);
                let m5 = this.grad(p[a2 + 1], d1, d2, d3 - 1);
                let m6 = this.grad(p[b2 + 1], d1 - 1, d2, d3 - 1);
                let m7 = this.grad(p[a3 + 1], d1, d2 - 1, d3 - 1);
                let m8 = this.grad(p[b3 + 1], d1 - 1, d2 - 1, d3 - 1);

                l1 = lerp(t1, m1, m2);
                l3 = lerp(t1, m3, m4);
                l5 = lerp(t1, m5, m6);
                l7 = lerp(t1, m7, m8);
            }

            if (yi >= 7) {
                const n1 = lerp(t2, l1, l3);
                const n5 = lerp(t2, l5, l7);
                v[yi - 7] += lerp(t3, n1, n5) * this.amplitude;
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
            p.amplitude = persist;
            p.lacunarity = lac;
            this.octaves.push(p);
            persist *= persistMul;
            lac *= lacMul;
        }
    }

    sample(x, z) {
        let v = 0;
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            const lf = p.lacunarity;
            const ax = maintainPrecision(x * lf) + p.a;
            const az = maintainPrecision(z * lf) + p.b;
            v += p.amplitude * p.sampleSimplex2D(ax, az);
        }
        return v;
    }

    sample3D(x, y, z, yLacAmp) {
        let v = 0;
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            const lf = p.lacunarity;
            const ax = maintainPrecision(x * lf);
            const ay = maintainPrecision(y * lf);
            const az = maintainPrecision(z * lf);
            v += p.amplitude * p.sample(ax, ay, az, yLacAmp ? 0.5 : 1.0);
        }
        return v;
    }

    sampleAmp(x, y, z, yamp, ymin) {
        let v = 0;
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            const lf = p.lacunarity;
            const ax = maintainPrecision(x * lf);
            const ay = maintainPrecision(y * lf); // Note: C sampleOctaveAmp has ydefault flag handling
            const az = maintainPrecision(z * lf);
            v += p.amplitude * p.sample(ax, ay, az, yamp * lf, ymin * lf);
        }
        return v;
    }

    sampleBeta17Terrain(v, x, z, yLacFlag, lacmin) {
        // v is array of size 2, initialized to 0 by caller
        for (let i = 0; i < this.octcnt; i++) {
            const p = this.octaves[i];
            const lf = p.lacunarity;
            if (lacmin && lf > lacmin) continue;
            const ax = maintainPrecision(x * lf);
            const az = maintainPrecision(z * lf);
            p.sampleBeta17Terrain(v, ax, az, yLacFlag ? 0.5 : 1.0);
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

        // Skip 262*8 = 2096 seeds
        for (let i = 0; i < 2096; i++) {
            s.seed = (s.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
        }

        this.octcontA = new OctaveNoise(s, 10, 1.121, 0.5, 1.0, 2.0);
        this.octcontB = new OctaveNoise(s, 16, 200.0, 0.5, 1.0, 2.0);
    }

    sample(x, z, climate) { // x, z are block coordinates
        const cx = x * 0.25;
        const cz = z * 0.25;
        const lacmin = 4.0; // scale 1 equivalent

        // genColumnNoise logic
        const contASample = this.octcontA.sampleAmp(cx, 0, cz, 0, 0);
        const contBSample = this.octcontB.sampleAmp(cx, 0, cz, 0, 0);

        const minSample = [0, 0];
        const maxSample = [0, 0];
        const mainSample = [0, 0];

        this.octmin.sampleBeta17Terrain(minSample, cx, cz, 0, lacmin);
        this.octmax.sampleBeta17Terrain(maxSample, cx, cz, 0, lacmin);
        this.octmain.sampleBeta17Terrain(mainSample, cx, cz, 1, lacmin);

        // processColumnNoise logic
        const humi = 1 - climate[0] * climate[1];
        let humi2 = humi * humi;
        let humi4 = humi2 * humi2;
        let humiF = 1 - humi4;

        let contA = (contASample + 256) / 512 * humiF;
        contA = (contA > 1) ? 1.0 : contA;

        let contB = contBSample / 8000;
        if (contB < 0) contB = -contB * 0.3;
        contB = contB * 3 - 2;

        if (contB < 0) {
            contB /= 2;
            contB = (contB < -1) ? -1.0 / 1.4 / 2 : contB / 1.4 / 2;
            contA = 0;
        } else {
            contB = (contB > 1) ? 1.0 / 8 : contB / 8;
        }

        contA = (contA < 0) ? 0.5 : contA + 0.5;
        contB = (contB * 17.0) / 16;
        contB = 17.0 / 2 + contB * 4;

        const cols = [0, 0];
        for (let i = 0; i <= 1; i++) {
            let procCont = ((i + 7 - contB) * 12) / contA;
            if (procCont < 0) procCont *= 4;

            const lSample = minSample[i] / 512;
            const hSample = maxSample[i] / 512;
            const sSample = (mainSample[i] / 10 + 1) / 2;

            let chooseLHS = (sSample < 0.0) ? lSample : (sSample > 1) ? hSample :
                lSample + (hSample - lSample) * sSample;
            chooseLHS -= procCont;
            cols[i] = chooseLHS;
        }
        return cols;
    }
}

class BiomeNoiseBeta {
    constructor(seed) {
        seed = BigInt(seed);

        // Helper to create a seeded random state
        const createSeed = (s) => ({ seed: (BigInt(s) ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn });

        this.climate = [
            // Temperature: seed * 9871
            new OctaveNoise(createSeed(seed * 9871n), 4,
                0.025 / 1.5, 0.25, 0.55, 2.0),
            // Humidity: seed * 39811
            new OctaveNoise(createSeed(seed * 39811n), 4,
                0.05 / 1.5, 1.0 / 3.0, 0.55, 2.0),
            // Detail: seed * 543321
            new OctaveNoise(createSeed(seed * 543321n), 2,
                0.25 / 1.5, 10.0 / 17.0, 0.55, 2.0)
        ];
    }

    sample(x, z) {
        // Temperature, Humidity, Detail
        let t = this.climate[0].sample(x, z);
        let h = this.climate[1].sample(x, z);
        let f = this.climate[2].sample(x, z); // noise/detail

        f = f * 1.1 + 0.5;

        t = (t * 0.15 + 0.7) * 0.99 + f * 0.01;
        t = 1.0 - (1.0 - t) * (1.0 - t);
        if (t < 0) t = 0; else if (t > 1) t = 1;

        h = (h * 0.15 + 0.5) * 0.998 + f * 0.002;
        if (h < 0) h = 0; else if (h > 1) h = 1;

        return [t, h];
    }
}

export { JavaRandom, PerlinNoise, OctaveNoise, BiomeNoiseBeta, SurfaceNoiseBeta, maintainPrecision };
