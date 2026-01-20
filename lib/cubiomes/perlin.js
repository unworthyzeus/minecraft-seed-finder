
class JavaRandom {
    constructor(seed) {
        this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn;
    }
    next(bits) {
        this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
        return Number(this.seed >> BigInt(48 - bits));
    }
    nextInt(n) {
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

class PerlinNoise {
    constructor(seed) {
        const rnd = new JavaRandom(seed);
        this.xo = rnd.nextDouble() * 256.0;
        this.yo = rnd.nextDouble() * 256.0;
        this.zo = rnd.nextDouble() * 256.0;
        this.p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 0; i < 256; i++) {
            const j = rnd.nextInt(256 - i) + i;
            const t = this.p[i]; this.p[i] = this.p[j]; this.p[j] = t;
        }
        // Duplicate for 512 lookup if needed, but 256 + bit masking works
    }

    sample(x, y, z) {
        const d1 = x + this.xo;
        const d2 = y + this.yo;
        const d3 = z + this.zo;
        const i1 = Math.floor(d1);
        const i2 = Math.floor(d2);
        const i3 = Math.floor(d3);
        const fd1 = d1 - i1;
        const fd2 = d2 - i2;
        const fd3 = d3 - i3;

        const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
        const t1 = fade(fd1);
        const t2 = fade(fd2);
        const t3 = fade(fd3);

        const p = this.p;
        const mask = 0xFF;
        const h1 = i1 & mask;
        const h2 = i2 & mask;
        const h3 = i3 & mask;

        const lerp = (t, a, b) => a + t * (b - a);
        const grad = (hash, x, y, z) => {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        };

        const a = p[h1] + h2;
        const aa = p[a] + h3;
        const ab = p[a + 1] + h3;
        const b = p[h1 + 1] + h2;
        const ba = p[b] + h3;
        const bb = p[b + 1] + h3;

        return lerp(t3,
            lerp(t2,
                lerp(t1, grad(p[aa], fd1, fd2, fd3), grad(p[ba], fd1 - 1, fd2, fd3)),
                lerp(t1, grad(p[ab], fd1, fd2 - 1, fd3), grad(p[bb], fd1 - 1, fd2 - 1, fd3))
            ),
            lerp(t2,
                lerp(t1, grad(p[aa + 1], fd1, fd2, fd3 - 1), grad(p[ba + 1], fd1 - 1, fd2, fd3 - 1)),
                lerp(t1, grad(p[ab + 1], fd1, fd2 - 1, fd3 - 1), grad(p[bb + 1], fd1 - 1, fd2 - 1, fd3 - 1))
            )
        );
    }
}

// In mapOceanTemp, l.noise should be an instance of PerlinNoise.
// C uses samplePerlin(rnd, x, z, 0, 0, 0). So y=z=0?
// C args: d1=x, d2=z, d3=0.
// My sample args: x, y, z.
// In C `samplePerlin` logic (Step 2392):
// d1 += noise->a; d2 (z) += noise->b; d3 (0) += noise->c;
// Wait. C function: samplePerlin(noise, d1, d2, d3, ...).
// mapOceanTemp (Step 2386): samplePerlin(rnd, (i+x)/8, (j+z)/8, 0, 0, 0);
// So d1=x, d2=z, d3=0.
// My JS PerlinNoise.sample(x, y, z):
// x corresponds to d1. y to d2. z to d3.
// So I call sample(x, z, 0).
