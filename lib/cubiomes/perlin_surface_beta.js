class SurfaceNoiseBeta {
    constructor(seed) {
        seed = BigInt(seed);
        const createSeed = (s) => ({ seed: (BigInt(s) ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn });
        const s = createSeed(seed);

        this.octmin = new OctaveNoise(s, 16, 684.412, 0.5, 1.0, 2.0);
        this.octmax = new OctaveNoise(s, 16, 684.412, 0.5, 1.0, 2.0);
        this.octmain = new OctaveNoise(s, 8, 684.412 / 80.0, 0.5, 1.0, 2.0);

        // Skip 262*8 = 2096 PRNG transitions to match C cubiomes skipNextN(&s, 262 * 8)
        for (let i = 0; i < 2096; i++) {
            s.seed = (s.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
        }

        this.octcontA = new OctaveNoise(s, 10, 1.121, 0.5, 1.0, 2.0);
        this.octcontB = new OctaveNoise(s, 16, 200.0, 0.5, 1.0, 2.0);

        // Climate noises for getBiome (usually separate from the main surface noise instance)
        this.temperatureNoise = new OctaveNoise(createSeed(seed * 9871n), 4, 0.016666666666666666, 0.25, 0.55, 2.0);
        this.humidityNoise = new OctaveNoise(createSeed(seed * 39811n), 4, 0.03333333333333333, 0.3333333333333333, 0.55, 2.0);
        this.detailNoise = new OctaveNoise(createSeed(seed * 543321n), 2, 0.16666666666666666, 10.0 / 17.0, 0.55, 2.0);
    }

    sample(cx, cz, lacmin) {
        const contASample = this.octcontA.sampleAmp(cx, 0, cz, 0, 0, 1);
        const contBSample = this.octcontB.sampleAmp(cx, 0, cz, 0, 0, 1);

        const minSample = [0, 0];
        const maxSample = [0, 0];
        const mainSample = [0, 0];

        this.octmin.sampleBeta17Terrain(minSample, cx, cz, 0, lacmin);
        this.octmax.sampleBeta17Terrain(maxSample, cx, cz, 0, lacmin);
        this.octmain.sampleBeta17Terrain(mainSample, cx, cz, 1, lacmin);

        return { minSample, maxSample, mainSample, contASample, contBSample };
    }

    getBiome(x, z, chunk_lacmin = 1.0) {
        // Sample climate (matching getOldBetaNoise logic from C)
        let t = this.temperatureNoise.sample(x, 0, z);
        let h = this.humidityNoise.sample(x, 0, z);
        let f = this.detailNoise.sample(x, 0, z);

        f = f * 1.1 + 0.5;
        t = (t * 0.15 + 0.7) * 0.99 + f * 0.01;
        t = 1.0 - (1.0 - t) * (1.0 - t);
        if (t < 0) t = 0; else if (t > 1) t = 1;

        h = (h * 0.15 + 0.5) * 0.998 + f * 0.002;
        if (h < 0) h = 0; else if (h > 1) h = 1;

        // Coordinates used for noise generators are at block scale in C (x*0.25)
        // Since x, z are passed at biome scale (1:4), x*4 is block scale.
        // C passes (block*0.25) which is biome scale.
        // So we pass x, z directly to sample()
        const cx = x * 0.25, cz = z * 0.25;
        const res = this.sample(cx, cz, chunk_lacmin);

        let humi = 1.0 - t * h;
        const humiF = 1.0 - Math.pow(humi, 4);

        let contA = (res.contASample + 256.0) / 512.0 * humiF;
        if (contA > 1.0) contA = 1.0;

        let contB = res.contBSample / 8000.0;
        if (contB < 0) contB = -contB * 0.3;
        contB = contB * 3.0 - 2.0;

        if (contB > 1.0) {
            contB = (contB > 2.0) ? 1.0 : 2.0 - contB;
            contA = 0.5;
        } else {
            if (contB < 0) {
                contB /= 2.0;
                contB = (contB < -1.0) ? -1.0 / 1.4 / 2.0 : contB / 1.4 / 2.0;
                contA = 0;
            } else {
                contB = contB / 8.0;
            }
        }

        contA = (contA < 0) ? 0.5 : contA + 0.5;
        contB = (contB * 17.0) / 16.0;
        contB = 17.0 / 2.0 + contB * 4.0;

        const cols = [0, 0];
        for (let i = 0; i <= 1; i++) {
            let procCont = ((i + 7 - contB) * 12.0) / contA;
            if (procCont < 0) procCont *= 4.0;

            const lSample = res.minSample[i] / 512.0;
            const hSample = res.maxSample[i] / 512.0;
            const sSample = (res.mainSample[i] / 10.0 + 1.0) / 2.0;

            let chooseLHS;
            if (sSample < 0) chooseLHS = lSample;
            else if (sSample > 1.0) chooseLHS = hSample;
            else chooseLHS = lSample + (hSample - lSample) * sSample;

            cols[i] = chooseLHS - procCont;
        }

        const surfaceVal = 0.125 * cols[0] + 0.875 * cols[1];
        const b = getOldBetaBiome(t, h);

        if (b === snowy_tundra && surfaceVal <= 0) return frozen_ocean;
        if (surfaceVal <= 0) return ocean;
        return b;
    }
}

class BiomeNoiseBeta {
    constructor(seed) {
        this.snb = new SurfaceNoiseBeta(seed);
    }

    sample(x, z) {
        // x, z are biome coordinates
        const t = this.snb.temperatureNoise.sample(x, 0, z);
        const h = this.snb.humidityNoise.sample(x, 0, z);
        const f = this.snb.detailNoise.sample(x, 0, z);

        let ft = (t * 0.15 + 0.7) * 0.99 + (f * 1.1 + 0.5) * 0.01;
        ft = 1.0 - (1.0 - ft) * (1.0 - ft);
        if (ft < 0) ft = 0; else if (ft > 1) ft = 1;

        let fh = (h * 0.15 + 0.5) * 0.998 + (f * 1.1 + 0.5) * 0.002;
        if (fh < 0) fh = 0; else if (fh > 1) fh = 1;

        return [ft, fh];
    }
}
