/**
 * Cubiomes-JS: Complete JavaScript Port of Cubiomes
 * 
 * This is a JavaScript port of Cubiomes by Cubitect
 * https://github.com/Cubitect/cubiomes
 * 
 * MIT License - Copyright (c) 2020 Cubitect
 * 
 * Features:
 * - Accurate biome generation for Minecraft 1.18+
 * - Biome decision trees for versions 1.18, 1.19, 1.19.2, 1.20, 1.21
 * - Xoroshiro128++ and Java Random RNGs
 * - Multi-octave Perlin noise
 * - Climate noise sampling
 */

export * from './core.js';
export * from './generator.js';

// Version-specific biome trees
export { BTREE_1_18, lookupBiome_1_18 } from './btree_1_18.js';
export { BTREE_1_19, lookupBiome_1_19 } from './btree_1_19.js';
export { BTREE_1_19_2, lookupBiome_1_19_2 } from './btree_1_19.2.js';
export { BTREE_1_20, lookupBiome_1_20 } from './btree_1_20.js';
export { BTREE_1_21, lookupBiome_1_21 } from './btree_1_21.js';

/**
 * Get the appropriate biome lookup function for a Minecraft version
 * @param {string} version - Minecraft version string (e.g., "1.20", "1.18.2")
 * @returns {Function} Biome lookup function
 */
export function getBiomeLookup(version) {
    const match = version.match(/1\.(\d+)/);
    if (!match) return null;

    const minor = parseInt(match[1]);

    if (minor >= 21) {
        return async () => {
            const { lookupBiome_1_21 } = await import('./btree_1_21.js');
            return lookupBiome_1_21;
        };
    } else if (minor >= 20) {
        return async () => {
            const { lookupBiome_1_20 } = await import('./btree_1_20.js');
            return lookupBiome_1_20;
        };
    } else if (minor >= 19) {
        return async () => {
            const { lookupBiome_1_19 } = await import('./btree_1_19.js');
            return lookupBiome_1_19;
        };
    } else if (minor >= 18) {
        return async () => {
            const { lookupBiome_1_18 } = await import('./btree_1_18.js');
            return lookupBiome_1_18;
        };
    }

    return null; // Pre-1.18 requires different layer-based generator
}
