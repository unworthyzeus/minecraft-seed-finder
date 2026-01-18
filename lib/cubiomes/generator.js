/**
 * Cubiomes-JS: Biome Generator for Minecraft 1.18+
 * 
 * JavaScript port of Cubiomes by Cubitect
 * Original: https://github.com/Cubitect/cubiomes
 * 
 * MIT License - Copyright (c) 2020 Cubitect
 */

import { Xoroshiro, PerlinNoise, BiomeID, BiomeColors, BiomeNames, getBiomeColor } from './core.js';

// ============================================================================
// Climate Noise Parameters (1.18+)
// ============================================================================

const NP_TEMPERATURE = 0;
const NP_HUMIDITY = 1;
const NP_CONTINENTALNESS = 2;
const NP_EROSION = 3;
const NP_WEIRDNESS = 5;

// MD5 hashes for octave salting (from Cubiomes)
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

// Climate noise amplitude configurations
const TEMPERATURE_AMPLITUDES = [1.5, 0, 1, 0, 0, 0];
const HUMIDITY_AMPLITUDES = [1, 1, 0, 0, 0, 0];
const CONTINENTALNESS_AMPLITUDES = [1, 1, 2, 2, 2, 1, 1, 1, 1];
const EROSION_AMPLITUDES = [1, 1, 0, 1, 1];
const WEIRDNESS_AMPLITUDES = [1, 2, 1, 0, 0, 0];

/**
 * Multi-octave noise with Xoroshiro initialization (1.18+ style)
 */
class ClimateNoise {
    constructor() {
        this.octaves = [];
        this.amplitude = 1.0;
    }

    init(xr, amplitudes, omin, len) {
        const xlo = xr.nextLong();
        const xhi = xr.nextLong();

        // Calculate persistence based on non-zero amplitudes
        let nonZeroCount = 0;
        for (let i = 0; i < len; i++) {
            if (amplitudes[i] !== 0) nonZeroCount++;
        }

        // Amplitude from Cubiomes: (5/3) * len / (len+1) for DoublePerlin
        const ampScale = (5 / 3) * nonZeroCount / (nonZeroCount + 1);
        this.amplitude = ampScale;

        let lacuna = Math.pow(2, omin + len - 1);
        let persist = 1.0 / ((1 << nonZeroCount) - 1);

        this.octaves = [];

        for (let i = 0; i < len; i++) {
            if (amplitudes[i] === 0) {
                lacuna *= 0.5;
                continue;
            }

            // Create Xoroshiro with MD5 salt
            const pxr = new Xoroshiro();
            const saltIdx = 12 + omin + i;
            if (saltIdx >= 0 && saltIdx < MD5_OCTAVE_N.length) {
                pxr.lo = xlo ^ MD5_OCTAVE_N[saltIdx][0];
                pxr.hi = xhi ^ MD5_OCTAVE_N[saltIdx][1];
            } else {
                pxr.setSeed(xlo + BigInt(i));
            }

            const p = new PerlinNoise();
            p.initXoroshiro(pxr);
            p.amplitude = amplitudes[i] * persist;
            p.lacunarity = lacuna;
            this.octaves.push(p);

            persist *= 2.0;
            lacuna *= 0.5;
        }
    }

    sample(x, y, z) {
        let v = 0;
        for (const oct of this.octaves) {
            const lf = oct.lacunarity;
            const ax = maintainPrecision(x * lf);
            const ay = maintainPrecision(y * lf);
            const az = maintainPrecision(z * lf);
            v += oct.amplitude * oct.sample(ax, ay, az);
        }
        return v * this.amplitude;
    }
}

function maintainPrecision(x) {
    return x - 33554432.0 * Math.round(x / 33554432.0);
}

// ============================================================================
// Biome Noise Generator (1.18+)
// ============================================================================

export class BiomeNoise {
    constructor() {
        this.temperature = new ClimateNoise();
        this.humidity = new ClimateNoise();
        this.continentalness = new ClimateNoise();
        this.erosion = new ClimateNoise();
        this.weirdness = new ClimateNoise();
        this.mc = 21; // Default to 1.21
    }

    setSeed(seed, mc = 21) {
        this.mc = mc;
        seed = BigInt(seed);

        // Each climate parameter has its own Xoroshiro seeding
        const xrTemp = new Xoroshiro();
        const xrHumid = new Xoroshiro();
        const xrCont = new Xoroshiro();
        const xrEros = new Xoroshiro();
        const xrWeird = new Xoroshiro();

        // Seed each with different salts (simplified from Cubiomes)
        xrTemp.setSeed(seed);
        xrHumid.setSeed(seed + 1n);
        xrCont.setSeed(seed + 2n);
        xrEros.setSeed(seed + 3n);
        xrWeird.setSeed(seed + 4n);

        // Initialize climate noises
        this.temperature.init(xrTemp, TEMPERATURE_AMPLITUDES, -10, 6);
        this.humidity.init(xrHumid, HUMIDITY_AMPLITUDES, -8, 2);
        this.continentalness.init(xrCont, CONTINENTALNESS_AMPLITUDES, -11, 9);
        this.erosion.init(xrEros, EROSION_AMPLITUDES, -9, 5);
        this.weirdness.init(xrWeird, WEIRDNESS_AMPLITUDES, -7, 6);
    }

    /**
     * Sample climate parameters at a position
     * Scale: 1:4 (biome coordinates)
     */
    sampleClimate(x, z) {
        const y = 0; // Surface level

        return {
            temperature: this.temperature.sample(x, y, z),
            humidity: this.humidity.sample(x, y, z),
            continentalness: this.continentalness.sample(x, y, z),
            erosion: this.erosion.sample(x, y, z),
            weirdness: this.weirdness.sample(x, y, z),
        };
    }

    /**
     * Get biome at position using climate parameters
     * This is a simplified version of climateToBiome from Cubiomes
     */
    getBiome(x, z) {
        const c = this.sampleClimate(x, z);

        const temp = c.temperature;
        const humid = c.humidity;
        const cont = c.continentalness;
        const eros = c.erosion;
        const weird = c.weirdness;

        // ========== OCEAN BIOMES ==========
        if (cont < -0.19) {
            // Deep ocean
            if (cont < -0.45) {
                if (temp < -0.45) return BiomeID.deep_frozen_ocean;
                if (temp < -0.15) return BiomeID.deep_cold_ocean;
                if (temp > 0.4) return BiomeID.deep_warm_ocean;
                if (temp > 0.2) return BiomeID.deep_lukewarm_ocean;
                return BiomeID.deep_ocean;
            }
            // Regular ocean
            if (temp < -0.45) return BiomeID.frozen_ocean;
            if (temp < -0.15) return BiomeID.cold_ocean;
            if (temp > 0.4) return BiomeID.warm_ocean;
            if (temp > 0.2) return BiomeID.lukewarm_ocean;
            return BiomeID.ocean;
        }

        // ========== COAST/BEACH ==========
        if (cont < -0.11) {
            if (eros > 0.55) {
                if (temp < -0.35) return BiomeID.snowy_beach;
                return BiomeID.beach;
            }
            if (eros > 0.25) return BiomeID.stone_shore;
            // Coastal mountains handled below
        }

        // ========== RIVER ==========
        // Simplified river check based on weirdness
        if (Math.abs(weird) < 0.05 && eros > 0.0 && cont > -0.11) {
            if (temp < -0.35) return BiomeID.frozen_river;
            return BiomeID.river;
        }

        // ========== MUSHROOM FIELDS ==========
        if (cont < -0.85 && humid < -0.35 && Math.abs(weird) > 0.8) {
            return BiomeID.mushroom_fields;
        }

        // ========== MOUNTAIN/PEAK BIOMES ==========
        if (cont > 0.3 && eros < -0.375) {
            if (eros < -0.78) {
                // Peaks
                if (temp < -0.35) return BiomeID.frozen_peaks;
                if (temp < 0.35) return BiomeID.jagged_peaks;
                return BiomeID.stony_peaks;
            }
            // Slopes
            if (temp < -0.35) return BiomeID.snowy_slopes;
            if (humid > 0.3) return BiomeID.grove;
            if (temp > 0.2) return BiomeID.meadow;
            return BiomeID.snowy_slopes;
        }

        // ========== WINDSWEPT ==========
        if (eros < -0.225 && cont > 0.1) {
            if (Math.abs(weird) > 0.4) {
                if (temp > 0.45) return BiomeID.shattered_savanna;
                if (humid > 0.1) return BiomeID.wooded_mountains;
                if (humid < -0.35) return BiomeID.gravelly_mountains;
                return BiomeID.mountains;
            }
        }

        // ========== SWAMP ==========
        if (humid > 0.35 && eros > 0.25 && temp > -0.15) {
            if (temp > 0.35 && this.mc >= 19) return BiomeID.mangrove_swamp;
            return BiomeID.swamp;
        }

        // ========== HOT BIOMES ==========
        if (temp > 0.55) {
            if (humid < -0.35) {
                // Desert/Badlands
                if (Math.abs(weird) > 0.4 && eros < 0.3) {
                    if (eros > 0.0) return BiomeID.eroded_badlands;
                    return BiomeID.badlands;
                }
                return BiomeID.desert;
            }
            if (humid < 0.0) {
                // Savanna
                if (cont > 0.3) return BiomeID.savanna_plateau;
                return BiomeID.savanna;
            }
            // Jungle
            if (humid > 0.4) return BiomeID.jungle;
            if (this.mc >= 14 && Math.abs(weird) > 0.3) return BiomeID.bamboo_jungle;
            return BiomeID.jungle_edge; // sparse_jungle in 1.18+
        }

        // ========== COLD BIOMES ==========
        if (temp < -0.35) {
            if (humid > 0.1) return BiomeID.snowy_taiga;
            if (Math.abs(weird) > 0.5) return BiomeID.ice_spikes;
            return BiomeID.snowy_tundra; // snowy_plains in 1.18+
        }

        // ========== COOL BIOMES ==========
        if (temp < -0.05) {
            if (humid > 0.2) return BiomeID.taiga;
            if (humid > -0.15) return BiomeID.taiga;
            return BiomeID.plains;
        }

        // ========== TEMPERATE BIOMES ==========

        // Very humid
        if (humid > 0.55) {
            if (Math.abs(weird) > 0.3) return BiomeID.dark_forest;
            return BiomeID.flower_forest;
        }

        // Humid
        if (humid > 0.2) {
            if (weird > 0.2) return BiomeID.birch_forest;
            if (weird > 0.0) return BiomeID.tall_birch_forest;
            return BiomeID.forest;
        }

        // Medium/Dry
        if (humid > -0.15) {
            if (weird > 0.4 && temp > 0.2) return BiomeID.sunflower_plains;
            if (weird > 0.35 && this.mc >= 20) return BiomeID.cherry_grove;
            if (this.mc >= 18 && cont > 0.2 && eros < 0.0) return BiomeID.meadow;
            return BiomeID.plains;
        }

        // Default
        return BiomeID.plains;
    }
}

// ============================================================================
// Generator Class - Main Interface
// ============================================================================

export class Generator {
    constructor() {
        this.mc = 21;
        this.seed = 0n;
        this.biomeNoise = new BiomeNoise();
    }

    /**
     * Set up generator for a Minecraft version
     * @param {number} mc - Minecraft version (e.g., 18, 19, 20, 21)
     */
    setupGenerator(mc) {
        this.mc = mc;
    }

    /**
     * Apply a seed to the generator
     * @param {number|bigint|string} seed - World seed
     */
    applySeed(seed) {
        // Handle string seeds
        if (typeof seed === 'string') {
            if (/^-?\d+$/.test(seed)) {
                seed = BigInt(seed);
            } else {
                // Hash string to seed
                let hash = 0n;
                for (let i = 0; i < seed.length; i++) {
                    hash = ((hash << 5n) - hash + BigInt(seed.charCodeAt(i))) & 0xFFFFFFFFFFFFFFFFn;
                }
                seed = hash;
            }
        }

        this.seed = BigInt(seed);
        this.biomeNoise.setSeed(this.seed, this.mc);
    }

    /**
     * Get the biome at a position
     * @param {number} scale - Scale (1 for blocks, 4 for biome coords)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate (ignored for overworld surface)
     * @param {number} z - Z coordinate
     * @returns {number} Biome ID
     */
    getBiomeAt(scale, x, y, z) {
        // Convert to biome coordinates (1:4 scale)
        if (scale === 1) {
            x = Math.floor(x / 4);
            z = Math.floor(z / 4);
        }

        if (this.mc >= 18) {
            return this.biomeNoise.getBiome(x, z);
        }

        // For older versions, return a placeholder
        // A full implementation would use the layer system
        return BiomeID.plains;
    }
}

// Re-export for convenience
export { BiomeID, BiomeColors, BiomeNames, getBiomeColor };
