/**
 * Cubiomes-JS: Biome Generator for Minecraft 1.18+
 * 
 * JavaScript port of Cubiomes by Cubitect
 * Original: https://github.com/Cubitect/cubiomes
 * 
 * MIT License - Copyright (c) 2020 Cubitect
 * 
 * FIXES APPLIED:
 * 1. Correct seeding with MD5 hashes for each climate parameter
 * 2. Double Perlin noise (two octaves at 337/331 frequency ratio)
 * 3. Position shift transformation (NP_SHIFT)
 * 4. Accurate continentalness calculation
 * 5. Improved biome mapping with spline-based depth calculation
 */

import { Xoroshiro, DoublePerlinNoise, BiomeID, BiomeColors, BiomeNames, getBiomeColor } from './core.js';
import { BTREE_1_18 } from './btree_1_18.js';
import { BTREE_1_19 } from './btree_1_19.js';
import { LegacyBiomeGenerator } from './layers.js';


// ============================================================================
// Climate Noise Parameter IDs
// ============================================================================

const NP_TEMPERATURE = 0;
const NP_HUMIDITY = 1;
const NP_CONTINENTALNESS = 2;
const NP_EROSION = 3;
const NP_SHIFT = 4;  // Also NP_DEPTH, but shift uses same slot
const NP_WEIRDNESS = 5;
const NP_MAX = 6;

// ============================================================================
// MD5 Hashes for Climate Parameter Salting (from biomenoise.c)
// ============================================================================

// Each climate parameter has specific MD5 hashes derived from their names
// Format: [normalLo, normalHi, largeLo, largeHi] or just [lo, hi] if no large variant
const CLIMATE_MD5 = {
    // md5 "minecraft:offset"
    [NP_SHIFT]: {
        lo: 0x080518cf6af25384n,
        hi: 0x3f3dfb40a54febd5n,
    },
    // md5 "minecraft:temperature" / "minecraft:temperature_large"
    [NP_TEMPERATURE]: {
        lo: 0x5c7e6b29735f0d7fn,
        hi: 0xf7d86f1bbc734988n,
        largeLo: 0x944b0073edf549dbn,
        largeHi: 0x4ff44347e9d22b96n,
    },
    // md5 "minecraft:vegetation" / "minecraft:vegetation_large"
    [NP_HUMIDITY]: {
        lo: 0x81bb4d22e8dc168en,
        hi: 0xf1c8b4bea16303cdn,
        largeLo: 0x71b8ab943dbd5301n,
        largeHi: 0xbb63ddcf39ff7a2bn,
    },
    // md5 "minecraft:continentalness" / "minecraft:continentalness_large"
    [NP_CONTINENTALNESS]: {
        lo: 0x83886c9d0ae3a662n,
        hi: 0xafa638a61b42e8adn,
        largeLo: 0x9a3f51a113fce8dcn,
        largeHi: 0xee2dbd157e5dcdadn,
    },
    // md5 "minecraft:erosion" / "minecraft:erosion_large"
    [NP_EROSION]: {
        lo: 0xd02491e6058f6fd8n,
        hi: 0x4792512c94c17a80n,
        largeLo: 0x8c984b1f8702a951n,
        largeHi: 0xead7b1f92bae535fn,
    },
    // md5 "minecraft:ridge"
    [NP_WEIRDNESS]: {
        lo: 0xefc8ef4d36102b34n,
        hi: 0x1beeeb324a0f24ean,
    },
};

// ============================================================================
// Climate Noise Amplitude Configurations
// ============================================================================

const CLIMATE_CONFIG = {
    [NP_SHIFT]: {
        amplitudes: [1, 1, 1, 0],
        omin: -3,
        len: 4,
    },
    [NP_TEMPERATURE]: {
        amplitudes: [1.5, 0, 1, 0, 0, 0],
        omin: -10,
        len: 6,
        largeOmin: -12,
    },
    [NP_HUMIDITY]: {
        amplitudes: [1, 1, 0, 0, 0, 0],
        omin: -8,
        len: 6,
        largeOmin: -10,
    },
    [NP_CONTINENTALNESS]: {
        amplitudes: [1, 1, 2, 2, 2, 1, 1, 1, 1],
        omin: -9,
        len: 9,
        largeOmin: -11,
    },
    [NP_EROSION]: {
        amplitudes: [1, 1, 0, 1, 1],
        omin: -9,
        len: 5,
        largeOmin: -11,
    },
    [NP_WEIRDNESS]: {
        amplitudes: [1, 2, 1, 0, 0, 0],
        omin: -7,
        len: 6,
    },
};

// ============================================================================
// Biome Noise Generator (1.18+)
// ============================================================================

export class BiomeNoise {
    constructor() {
        // Climate noise generators
        this.climate = [];
        for (let i = 0; i < NP_MAX; i++) {
            this.climate[i] = new DoublePerlinNoise();
        }
        this.mc = 21; // Default to 1.21
        this.large = false; // Large biomes setting
    }

    /**
     * Set the world seed and initialize all climate noises
     * Matches cubiomes setBiomeSeed()
     */
    setSeed(seed, mc = 21, large = false) {
        this.mc = mc;
        this.large = large;
        seed = BigInt(seed);

        // Initialize the master Xoroshiro from seed
        const pxr = new Xoroshiro();
        pxr.setSeed(seed);

        // Get xlo/xhi that will be XORed with climate-specific MD5 hashes
        const xlo = pxr.nextLong();
        const xhi = pxr.nextLong();

        // Initialize each climate parameter with its specific MD5 salt
        for (let nptype = 0; nptype < NP_MAX; nptype++) {
            const config = CLIMATE_CONFIG[nptype];
            const md5 = CLIMATE_MD5[nptype];

            if (!config || !md5) continue;

            // Create salted Xoroshiro for this climate parameter
            const cxr = new Xoroshiro();

            if (large && md5.largeLo !== undefined) {
                cxr.lo = xlo ^ md5.largeLo;
                cxr.hi = xhi ^ md5.largeHi;
            } else {
                cxr.lo = xlo ^ md5.lo;
                cxr.hi = xhi ^ md5.hi;
            }

            // Get omin based on large biomes setting
            const omin = (large && config.largeOmin !== undefined) ? config.largeOmin : config.omin;

            // Initialize the Double Perlin noise
            this.climate[nptype].initXoroshiro(cxr, config.amplitudes, omin, config.len);
        }
    }

    /**
     * Sample climate parameters at a position with shift applied
     * Scale: 1:4 (biome coordinates)
     */
    sampleClimate(x, z) {
        // Apply position shift (NP_SHIFT)
        // This distorts the sampling position slightly
        let px = x;
        let pz = z;

        px += this.climate[NP_SHIFT].sample(x, 0, z) * 4.0;
        pz += this.climate[NP_SHIFT].sample(z, x, 0) * 4.0;

        return {
            temperature: this.climate[NP_TEMPERATURE].sample(px, 0, pz),
            humidity: this.climate[NP_HUMIDITY].sample(px, 0, pz),
            continentalness: this.climate[NP_CONTINENTALNESS].sample(px, 0, pz),
            erosion: this.climate[NP_EROSION].sample(px, 0, pz),
            weirdness: this.climate[NP_WEIRDNESS].sample(px, 0, pz),
        };
    }

    /**
     * Get biome at position using climate parameters
     * Implements climateToBiome logic from cubiomes
     */
    getBiome(x, z, y = 0) {
        const c = this.sampleClimate(x, z);

        const temp = c.temperature;
        const humid = c.humidity;
        const cont = c.continentalness;
        const eros = c.erosion;
        const weird = c.weirdness;

        // Calculate ridges (PV) value used in biome selection
        const ridges = -3.0 * (Math.abs(Math.abs(weird) - 0.6666667) - 0.33333334);

        // Calculate depth parameter (surface offset + height factor)
        const depth = this.calculateDepth(cont, eros, ridges, weird, y);

        // Store scaled values like cubiomes does (multiplied by 10000)
        const np = [
            Math.round(10000 * temp),
            Math.round(10000 * humid),
            Math.round(10000 * cont),
            Math.round(10000 * eros),
            Math.round(10000 * depth),
            Math.round(10000 * weird),
        ];

        return this.climateToBiome(np);
    }

    /**
     * Calculate depth parameter using splines
     * Simplified version of getSpline() from cubiomes
     */
    calculateDepth(cont, eros, ridges, weird, y) {
        // Simplified depth calculation based on offset splines
        // The full implementation uses complex nested splines

        // Calculate offset from splines (simplified approximation)
        let offset = this.getOffsetValue(weird, cont);

        // Apply erosion influence
        if (eros > 0.0) {
            offset = lerp(Math.min(eros, 1.0), offset, 0.0);
        }

        // Depth formula from cubiomes
        // d = 1.0 - (y * 4) / 128.0 - 83.0/160.0 + offset
        const baseDepth = 1.0 - (y * 4) / 128.0 - 83.0 / 160.0 + offset + 0.015;

        return baseDepth;
    }

    /**
     * Get offset value from weirdness and continentalness
     * Direct port from cubiomes getOffsetValue()
     */
    getOffsetValue(weirdness, continentalness) {
        const f0 = 1.0 - (1.0 - continentalness) * 0.5;
        const f1 = 0.5 * (1.0 - continentalness);
        const f2 = (weirdness + 1.17) * 0.46082947;
        let off = f2 * f0 - f1;

        if (weirdness < -0.7) {
            return off > -0.2222 ? off : -0.2222;
        } else {
            return off > 0 ? off : 0;
        }
    }

    /**
     * Map climate parameters to biome ID
     * Based on the B-tree lookup in cubiomes
     */
    climateToBiome(np) {
        let bt;
        if (this.mc >= 19) {
            bt = BTREE_1_19;
        } else {
            bt = BTREE_1_18;
        }

        // Handle potential dummy node at index 0 in JS data files
        // C implementation uses 0-based indexing where nodes[0] is root
        // JS files have 0xFF at index 0
        const nodes = (bt.nodes[0] === 255n) ? bt.nodes.slice(1) : bt.nodes;

        // Helper to calculate distance to a parameter range
        // np: current noise parameters (scaled by 10000)
        // bitNode: the node defining the ranges for each parameter
        const get_np_dist = (np, btParams, nodeIdx) => {
            const node = nodes[nodeIdx];
            let ds = 0n;

            for (let i = 0; i < 6; i++) {
                // Extract parameter index from 8-bit slot in node
                // Each node packs 6 indices (one for each param) in lower 48 bits
                const paramIdx = Number((node >> BigInt(8 * i)) & 0xFFn);

                // Get range [min, max] for this parameter
                const range = btParams[paramIdx];
                // if (!range) {
                //     console.error(`get_np_dist FAILED: nodeIdx=${nodeIdx} i=${i} paramIdx=${paramIdx}`);
                //     throw new Error("Invalid param index");
                // }
                const min = BigInt(range[0]);
                const max = BigInt(range[1]);
                const val = BigInt(np[i]);

                // Calculate distance if outside range
                // a = val - max
                // b = min - val
                const a = val - max;
                const b = min - val;

                let d = 0n;
                if (a > 0n) d = a;
                else if (b > 0n) d = b;

                ds += d * d;
            }
            return ds;
        };

        // Recursive search for best leaf node
        const get_resulting_node = (np, btParams, idx, alt, ds, depth) => {
            // Base case: if step size is 0, we can't go deeper
            if (bt.steps[depth] === 0) return idx;

            // Find step size for current depth
            let step = bt.steps[depth];
            // Adjust step/depth if current index would overflow
            // (Matching C implementation behavior)
            while (idx + step >= nodes.length) {
                depth++;
                if (depth >= bt.steps.length) return idx; // Should not happen if well-formed
                step = bt.steps[depth];
                if (step === 0) return idx;
            }

            const node = nodes[idx];
            // Inner points to the first child node index (top 16 bits)
            let inner = Number(node >> 48n);

            let leaf = alt;

            // Order defines how many children to check
            for (let i = 0; i < bt.order; i++) {
                // Check if this child is a candidate
                const ds_inner = get_np_dist(np, btParams, inner);

                if (ds_inner < ds) {
                    // Try to go deeper
                    let leaf2 = get_resulting_node(np, btParams, inner, leaf, ds, depth + 1);

                    // Calculate distance for the leaf found
                    let ds_leaf2;
                    if (inner === leaf2) {
                        ds_leaf2 = ds_inner;
                    } else {
                        ds_leaf2 = get_np_dist(np, btParams, leaf2);
                    }

                    // If this path is better, update best leaf
                    if (ds_leaf2 < ds) {
                        ds = ds_leaf2;
                        leaf = leaf2;
                    }
                }

                // Move to next sibling
                inner += step;
                if (inner >= nodes.length) break;
            }

            return leaf;
        };

        // Start from root (idx 0)
        // Note: In C this starts with alt=0, ds=-1 (max uint64).
        // We use a very large BigInt for initial ds.
        const MAX_DS = 0xFFFFFFFFFFFFFFFFn;

        // Start traversal
        const finalIdx = get_resulting_node(np, bt.params, 0, 0, MAX_DS, 0);

        // Extract biome ID from the final node
        // Top 16 bits of leaf node contain the biome ID
        const finalNode = nodes[finalIdx];
        const biomeId = Number((finalNode >> 48n) & 0xFFn);

        return biomeId;
    }

}

// ============================================================================
// Helper Functions
// ============================================================================

function lerp(t, a, b) {
    return a + t * (b - a);
}

function clamp(x, min, max) {
    return x < min ? min : (x > max ? max : x);
}

// ============================================================================
// Generator Class - Main Interface
// ============================================================================

export class Generator {
    constructor() {
        this.mc = 21;
        this.seed = 0n;
        this.large = false;
        this.biomeNoise = new BiomeNoise();
    }

    /**
     * Set up generator for a Minecraft version
     * @param {number} mc - Minecraft version (e.g., 18, 19, 20, 21)
     * @param {boolean} large - Use large biomes
     */
    setupGenerator(mc, large = false) {
        this.mc = mc;
        this.large = large;
        if (mc < 18) {
            this.legacyGen = new LegacyBiomeGenerator(this.seed, mc);
        } else {
            this.legacyGen = null;
        }
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
                // Hash string to seed using Java's hashCode algorithm
                let hash = 0;
                for (let i = 0; i < seed.length; i++) {
                    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
                }
                seed = BigInt(hash);
            }
        }

        this.seed = BigInt(seed);
        this.biomeNoise.setSeed(this.seed, this.mc, this.large);

        if (this.mc < 18) {
            this.legacyGen = new LegacyBiomeGenerator(this.seed, this.mc);
        }
    }

    /**
     * Get the biome at a position
     * @param {number} scale - Scale (1 for blocks, 4 for biome coords)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate (used for depth calculation)
     * @param {number} z - Z coordinate
     * @returns {number} Biome ID
     */
    getBiomeAt(scale, x, y, z) {
        // Convert to biome coordinates (1:4 scale)
        if (scale === 1) {
            x = Math.floor(x / 4);
            z = Math.floor(z / 4);
            y = Math.floor(y / 4);
        }


        if (this.mc >= 18) {
            return this.biomeNoise.getBiome(x, z, y);
        }

        // For older versions, use the layer system
        if (this.legacyGen) {
            return this.legacyGen.getBiome(x, z);
        }

        return BiomeID.plains;
    }

    /**
     * Sample raw climate parameters at a position
     * @param {number} x - X coordinate (biome scale 1:4)
     * @param {number} z - Z coordinate (biome scale 1:4)
     * @returns {Object} Climate parameter values
     */
    getClimate(x, z) {
        return this.biomeNoise.sampleClimate(x, z);
    }
}

// Re-export for convenience
export { BiomeID, BiomeColors, BiomeNames, getBiomeColor };
