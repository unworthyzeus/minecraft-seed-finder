/**
 * Cubiomes-JS: Layer-Based Biome Generation (Pre-1.18)
 * 
 * JavaScript port of Cubiomes layers.c by Cubitect
 * https://github.com/Cubitect/cubiomes
 * 
 * MIT License - Copyright (c) 2020 Cubitect
 * 
 * This implements the layer-based world generation used in Minecraft 1.0 - 1.17
 */

// ============================================================================
// Constants
// ============================================================================

import { BiomeNoiseBeta, SurfaceNoiseBeta } from './perlin.js';
import { getOldBetaBiome } from './beta_biomes.js';

export const MC_B1_7 = 1;
export const MC_B1_8 = 2;
export const MC_1_0 = 3;
export const MC_1_1 = 4;
export const MC_1_2 = 5;
export const MC_1_3 = 6;
export const MC_1_4 = 7;
export const MC_1_5 = 8;
export const MC_1_6 = 9;
export const MC_1_7 = 10;
export const MC_1_8 = 11;
export const MC_1_9 = 12;
export const MC_1_10 = 13;
export const MC_1_11 = 14;
export const MC_1_12 = 15;
export const MC_1_13 = 16;
export const MC_1_14 = 17;
export const MC_1_15 = 18;
export const MC_1_16_1 = 19;
export const MC_1_16 = 20;
export const MC_1_17 = 21;

// Temperature categories
const Oceanic = 0;
const Warm = 1;
const Lush = 2;
const Cold = 3;
const Freezing = 4;
const Special = 5;

// Biome IDs
const ocean = 0;
const plains = 1;
const desert = 2;
const mountains = 3;
const forest = 4;
const taiga = 5;
const swamp = 6;
const river = 7;
const frozen_ocean = 10;
const frozen_river = 11;
const snowy_tundra = 12;
const snowy_mountains = 13;
const mushroom_fields = 14;
const mushroom_field_shore = 15;
const beach = 16;
const desert_hills = 17;
const wooded_hills = 18;
const taiga_hills = 19;
const mountain_edge = 20;
const jungle = 21;
const jungle_hills = 22;
const jungle_edge = 23;
const deep_ocean = 24;
const stone_shore = 25;
const snowy_beach = 26;
const birch_forest = 27;
const birch_forest_hills = 28;
const dark_forest = 29;
const snowy_taiga = 30;
const snowy_taiga_hills = 31;
const giant_tree_taiga = 32;
const giant_tree_taiga_hills = 33;
const wooded_mountains = 34;
const savanna = 35;
const savanna_plateau = 36;
const badlands = 37;
const wooded_badlands_plateau = 38;
const badlands_plateau = 39;
const swamp_hills = 134;
const bamboo_jungle = 168;
const bamboo_jungle_hills = 169;
const warm_ocean = 44;
const lukewarm_ocean = 45;
const cold_ocean = 46;
const deep_warm_ocean = 47;
const deep_lukewarm_ocean = 48;
const deep_cold_ocean = 49;
const deep_frozen_ocean = 50;
const tall_birch_forest = 155;
const dark_forest_hills = 157;


// Biome arrays for MC 1.7+
const warmBiomes = [desert, desert, desert, savanna, savanna, plains];
const lushBiomes = [forest, dark_forest, mountains, plains, birch_forest, swamp];
const coldBiomes = [forest, mountains, taiga, plains];
const snowBiomes = [snowy_tundra, snowy_tundra, snowy_tundra, snowy_taiga];

// Biome arrays for pre-1.7
const oldBiomes = [desert, forest, mountains, swamp, plains, taiga, jungle];  // MC 1.2-1.6
const oldBiomes11 = [desert, forest, mountains, swamp, plains, taiga];        // MC 1.0-1.1

// ============================================================================
// Helper Functions
// ============================================================================

function mcStepSeed(s, salt) {
    s = BigInt(s);
    salt = BigInt(salt);
    return (s * (s * 6364136223846793005n + 1442695040888963407n) + salt) & 0xFFFFFFFFFFFFFFFFn;
}

function getChunkSeed(ss, x, z) {
    ss = BigInt(ss);
    let cs = ss + BigInt(x);
    cs = mcStepSeed(cs, BigInt(z));
    cs = mcStepSeed(cs, BigInt(x));
    cs = mcStepSeed(cs, BigInt(z));
    return cs;
}

function mcFirstInt(s, mod) {
    let sBig = BigInt(s);
    if ((sBig & 0x8000000000000000n) !== 0n) {
        sBig = sBig - 0x10000000000000000n;
    }
    let ret = Number((sBig >> 24n) % BigInt(mod));
    if (ret < 0) ret += mod;
    return ret;
}

function mcFirstIsZero(s, mod) {
    return mcFirstInt(s, mod) === 0;
}

function getLayerSalt(salt) {
    salt = BigInt(salt);
    let ls = mcStepSeed(salt, salt);
    ls = mcStepSeed(ls, salt);
    ls = mcStepSeed(ls, salt);
    return ls;
}

function isShallowOcean(id) {
    if (id < 0 || id >= 64) return false;
    const bits = (1n << BigInt(ocean)) | (1n << BigInt(frozen_ocean)) | (1n << BigInt(warm_ocean)) | (1n << BigInt(lukewarm_ocean)) | (1n << BigInt(cold_ocean));
    return ((1n << BigInt(id)) & bits) !== 0n;
}

function isDeepOcean(id) {
    if (id < 0 || id >= 64) return false;
    const bits = (1n << BigInt(deep_ocean)) | (1n << BigInt(deep_warm_ocean)) | (1n << BigInt(deep_lukewarm_ocean)) | (1n << BigInt(deep_cold_ocean)) | (1n << BigInt(deep_frozen_ocean));
    return ((1n << BigInt(id)) & bits) !== 0n;
}

function isOceanic(id) {
    if (id < 0 || id >= 64) return false;
    const bits = (1n << BigInt(ocean)) | (1n << BigInt(frozen_ocean)) | (1n << BigInt(warm_ocean)) | (1n << BigInt(lukewarm_ocean)) | (1n << BigInt(cold_ocean)) |
        (1n << BigInt(deep_ocean)) | (1n << BigInt(deep_warm_ocean)) | (1n << BigInt(deep_lukewarm_ocean)) | (1n << BigInt(deep_cold_ocean)) | (1n << BigInt(deep_frozen_ocean));
    return ((1n << BigInt(id)) & bits) !== 0n;
}

function isSnowy(id) {
    switch (id) {
        case frozen_ocean: case frozen_river: case snowy_tundra: case snowy_mountains:
        case snowy_beach: case snowy_taiga: case snowy_taiga_hills: case 140: // ice_spikes
        case 158: // snowy_taiga_mountains
            return true;
        default: return false;
    }
}

function isMesa(id) {
    return id === 37 || id === 38 || id === 39 || id === 165 || id === 166 || id === 167;
}

function getMutated(mc, id) {
    switch (id) {
        case plains: return 129; // sunflower_plains
        case desert: return 130; // desert_lakes
        case mountains: return 131; // gravelly_mountains
        case forest: return 132; // flower_forest
        case taiga: return 133; // taiga_mountains
        case swamp: return 134; // swamp_hills
        case snowy_tundra: return 140; // ice_spikes
        case jungle: return 149; // modified_jungle
        case jungle_edge: return 151; // modified_jungle_edge
        case birch_forest: return (mc >= MC_1_9 && mc <= MC_1_10) ? 156 : 155;
        case birch_forest_hills: return (mc >= MC_1_9 && mc <= MC_1_10) ? -1 : 156;
        case dark_forest: return 157; // dark_forest_hills
        case snowy_taiga: return 158; // snowy_taiga_mountains
        case giant_tree_taiga: return 160; // giant_spruce_taiga
        case giant_tree_taiga_hills: return 161; // giant_spruce_taiga_hills
        case wooded_mountains: return 162; // modified_gravelly_mountains
        case savanna: return 163; // shattered_savanna
        case savanna_plateau: return 164; // shattered_savanna_plateau
        case badlands: return 165; // eroded_badlands
        case wooded_badlands_plateau: return 166; // modified_wooded_badlands_plateau
        case badlands_plateau: return 167; // modified_badlands_plateau
        default: return -1;
    }
}

function areSimilar(mc, id1, id2) {
    if (id1 === id2) return true;
    if (mc <= MC_1_15) {
        if (id1 === wooded_badlands_plateau || id1 === badlands_plateau) {
            return id2 === wooded_badlands_plateau || id2 === badlands_plateau;
        }
    }
    return getCategory(mc, id1) === getCategory(mc, id2);
}

function getCategory(mc, id) {
    switch (id) {
        case beach: case snowy_beach: return beach;
        case desert: case desert_hills: case 130: return desert;
        case mountains: case mountain_edge: case wooded_mountains: case 131: case 162: return mountains;
        case forest: case wooded_hills: case birch_forest: case birch_forest_hills:
        case dark_forest: case 132: case 155: case 156: case 157: case tall_birch_forest:
        case dark_forest_hills: return forest;
        case snowy_tundra: case snowy_mountains: case 140: return snowy_tundra;
        case jungle: case jungle_hills: case jungle_edge: case 149: case 151:
        case bamboo_jungle: case bamboo_jungle_hills: return jungle;
        case badlands: case 165: case 166: case 167: return badlands;
        case wooded_badlands_plateau: case badlands_plateau: return (mc <= MC_1_15) ? badlands : badlands_plateau;
        case mushroom_fields: case mushroom_field_shore: return mushroom_fields;
        case plains: case 129: return plains;
        case savanna: case savanna_plateau: case 163: case 164: return savanna;
        case taiga: case taiga_hills: case snowy_taiga: case snowy_taiga_hills:
        case giant_tree_taiga: case giant_tree_taiga_hills: case 133: case 158:
        case 160: case 161: return taiga;
        case swamp: case swamp_hills: return swamp;
        case river: case frozen_river: return river;
        case deep_ocean: case deep_frozen_ocean: case deep_warm_ocean:
        case deep_lukewarm_ocean: case deep_cold_ocean: return ocean;
        case ocean: case frozen_ocean: case warm_ocean: case lukewarm_ocean: case cold_ocean: return ocean;
        case stone_shore: return stone_shore;
        default: return id;
    }
}

function reduceID(id) {
    return id >= 2 ? 2 + (id & 1) : id;
}

function replaceOcean(out, idx, v10, v21, v01, v12, id, replaceID) {
    if (isOceanic(id)) return 0;
    if (isOceanic(v10) || isOceanic(v21) || isOceanic(v01) || isOceanic(v12)) {
        out[idx] = replaceID;
    } else {
        out[idx] = id;
    }
    return 1;
}

function replaceEdge(out, idx, mc, v10, v21, v01, v12, id, baseID, edgeID) {
    if (id !== baseID) return 0;
    if (areSimilar(mc, v10, baseID) && areSimilar(mc, v21, baseID) &&
        areSimilar(mc, v01, baseID) && areSimilar(mc, v12, baseID)) {
        out[idx] = id;
    } else {
        out[idx] = edgeID;
    }
    return 1;
}

function isAny4Oceanic(a, b, c, d) {
    return isOceanic(a) || isOceanic(b) || isOceanic(c) || isOceanic(d);
}

function isAll4JFTO(mc, a, b, c, d) {
    const isJFTO = (id) => (getCategory(mc, id) === jungle || id === forest || id === taiga || isOceanic(id));
    return isJFTO(a) && isJFTO(b) && isJFTO(c) && isJFTO(d);
}

function mapBiomeEdge(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    const mc = l.mc;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW];
            const v10 = parentBuf[(i + 1) + j * pW];
            const v21 = parentBuf[(i + 2) + (j + 1) * pW];
            const v01 = parentBuf[i + (j + 1) * pW];
            const v12 = parentBuf[(i + 1) + (j + 2) * pW];
            const idx = i + j * w;

            if (!replaceEdge(out, idx, mc, v10, v21, v01, v12, v11, wooded_badlands_plateau, badlands) &&
                !replaceEdge(out, idx, mc, v10, v21, v01, v12, v11, badlands_plateau, badlands) &&
                !replaceEdge(out, idx, mc, v10, v21, v01, v12, v11, giant_tree_taiga, taiga)) {

                if (v11 === desert) {
                    if (![v10, v21, v01, v12].some(v => v === snowy_tundra)) out[idx] = v11;
                    else out[idx] = wooded_mountains;
                } else if (v11 === swamp) {
                    const hasCold = [v10, v21, v01, v12].some(v => v === desert || v === snowy_taiga || v === snowy_tundra);
                    if (!hasCold) {
                        const hasJungle = [v10, v21, v01, v12].some(v => v === jungle || v === bamboo_jungle);
                        out[idx] = hasJungle ? jungle_edge : v11;
                    } else out[idx] = plains;
                } else out[idx] = v11;
            }
        }
    }
    return 0;
}

// ============================================================================
// Perlin Noise
// ============================================================================

class JavaRandom {
    constructor(seed) {
        this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn;
    }
    next(bits) {
        this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn;
        return Number(this.seed >> BigInt(48 - bits));
    }
    nextInt(n) {
        if ((n & -n) === n) return Number((BigInt(n) * BigInt(this.next(31))) >> 31n);
        let bits, val;
        do { bits = this.next(31); val = bits % n; } while (bits - val + (n - 1) < 0);
        return val;
    }
    nextDouble() {
        const l = BigInt(this.next(26)) << 27n;
        const r = BigInt(this.next(27));
        return Number(l + r) / 9007199254740992.0;
    }
}

class PerlinNoise {
    constructor(rnd) {
        this.xo = rnd.nextDouble() * 256.0;
        this.yo = rnd.nextDouble() * 256.0;
        this.zo = rnd.nextDouble() * 256.0;
        this.p = new Uint8Array(512);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 0; i < 256; i++) {
            const j = rnd.nextInt(256 - i) + i;
            const t = this.p[i]; this.p[i] = this.p[j]; this.p[j] = t;
        }
        for (let i = 0; i < 256; i++) this.p[i + 256] = this.p[i];
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

// ============================================================================
// Layer Class
// ============================================================================

class Layer {
    constructor(getMapFunc, scale, salt, parent = null, parent2 = null) {
        this.getMap = getMapFunc;
        this.scale = scale;
        this.layerSalt = (salt === 0 || salt === 0xFFFFFFFFFFFFFFFFn) ? BigInt(salt) : getLayerSalt(salt);
        this.startSalt = 0n;
        this.startSeed = 0n;
        this.p = parent;
        this.p2 = parent2;
        this.mc = 13;
    }

    setWorldSeed(worldSeed) {
        if (this.p2) this.p2.setWorldSeed(worldSeed);
        if (this.p) this.p.setWorldSeed(worldSeed);

        worldSeed = BigInt(worldSeed);

        if (this.layerSalt === 0n) {
            this.startSalt = 0n;
            this.startSeed = 0n;
        } else {
            let st = worldSeed;
            st = mcStepSeed(st, this.layerSalt);
            st = mcStepSeed(st, this.layerSalt);
            st = mcStepSeed(st, this.layerSalt);
            this.startSalt = st;
            this.startSeed = mcStepSeed(st, 0n);
        }
    }
}

// ============================================================================
// Layer Functions
// ============================================================================

function mapContinent(l, out, x, z, w, h) {
    const ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const cs = getChunkSeed(ss, i + x, j + z);
            out[j * w + i] = mcFirstIsZero(cs, 10) ? 1 : 0;
        }
    }
    if (x > -w && x <= 0 && z > -h && z <= 0) {
        out[-z * w - x] = 1;
    }
    return 0;
}

function mapZoom(l, out, x, z, w, h) {
    const pX = x >> 1, pZ = z >> 1;
    const pW = ((x + w) >> 1) - pX + 1, pH = ((z + h) >> 1) - pZ + 1;
    const parentBuf = new Int32Array((pW + 1) * (pH + 1));
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW + 1, pH + 1);
    if (err !== 0) return err;

    const ppW = pW + 1, newW = pW * 2;
    const st = Number(l.startSalt & 0xFFFFFFFFn) >>> 0;
    const ss = Number(l.startSeed & 0xFFFFFFFFn) >>> 0;
    const buf = new Int32Array(newW * pH * 2);

    for (let j = 0; j < pH; j++) {
        let idx = j * 2 * newW;
        let v00 = parentBuf[j * ppW], v01 = parentBuf[(j + 1) * ppW];
        for (let i = 0; i < pW; i++) {
            const v10 = parentBuf[(i + 1) + j * ppW], v11 = parentBuf[(i + 1) + (j + 1) * ppW];
            if (v00 === v01 && v00 === v10 && v00 === v11) {
                buf[idx] = buf[idx + 1] = buf[idx + newW] = buf[idx + newW + 1] = v00;
                idx += 2; v00 = v10; v01 = v11; continue;
            }
            const chunkX = (i + pX) * 2, chunkZ = (j + pZ) * 2;
            let cs = ss;
            cs = (cs + chunkX) >>> 0;
            cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
            cs = (cs + chunkZ) >>> 0;
            cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
            cs = (cs + chunkX) >>> 0;
            cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
            cs = (cs + chunkZ) >>> 0;

            buf[idx] = v00;
            buf[idx + newW] = ((cs >>> 24) & 1) ? v01 : v00;
            idx++;
            cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
            cs = (cs + st) >>> 0;
            buf[idx] = ((cs >>> 24) & 1) ? v10 : v00;

            const cv00 = (v00 === v10 ? 1 : 0) + (v00 === v01 ? 1 : 0) + (v00 === v11 ? 1 : 0);
            const cv10 = (v10 === v01 ? 1 : 0) + (v10 === v11 ? 1 : 0);
            const cv01 = (v01 === v11 ? 1 : 0);
            let v;
            if (cv00 > cv10 && cv00 > cv01) v = v00;
            else if (cv10 > cv00) v = v10;
            else if (cv01 > cv00) v = v01;
            else {
                cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
                cs = (cs + st) >>> 0;
                const r = (cs >>> 24) & 3;
                v = r === 0 ? v00 : r === 1 ? v10 : r === 2 ? v01 : v11;
            }
            buf[idx + newW] = v;
            idx++; v00 = v10; v01 = v11;
        }
    }
    const bx = x & 1, bz = z & 1;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) out[j * w + i] = buf[(j + bz) * newW + i + bx];
    }
    return 0;
}

function mapZoomFuzzy(l, out, x, z, w, h) {
    const pX = x >> 1, pZ = z >> 1;
    const pW = ((x + w) >> 1) - pX + 1, pH = ((z + h) >> 1) - pZ + 1;
    const parentBuf = new Int32Array((pW + 1) * (pH + 1));
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW + 1, pH + 1);
    if (err !== 0) return err;

    const ppW = pW + 1, newW = pW * 2;
    const st = Number(l.startSalt & 0xFFFFFFFFn) >>> 0;
    const ss = Number(l.startSeed & 0xFFFFFFFFn) >>> 0;
    const buf = new Int32Array(newW * pH * 2);

    for (let j = 0; j < pH; j++) {
        let idx = j * 2 * newW;
        let v00 = parentBuf[j * ppW], v01 = parentBuf[(j + 1) * ppW];
        for (let i = 0; i < pW; i++) {
            const v10 = parentBuf[(i + 1) + j * ppW], v11 = parentBuf[(i + 1) + (j + 1) * ppW];
            if (v00 === v01 && v00 === v10 && v00 === v11) {
                buf[idx] = buf[idx + 1] = buf[idx + newW] = buf[idx + newW + 1] = v00;
            } else {
                const chunkX = (i + pX) * 2, chunkZ = (j + pZ) * 2;
                let cs = ss;
                cs = (cs + chunkX) >>> 0;
                cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
                cs = (cs + chunkZ) >>> 0;
                cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
                cs = (cs + chunkX) >>> 0;
                cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
                cs = (cs + chunkZ) >>> 0;

                buf[idx] = v00;
                buf[idx + newW] = ((cs >>> 24) & 1) ? v01 : v00;
                cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
                cs = (cs + st) >>> 0;
                buf[idx + 1] = ((cs >>> 24) & 1) ? v10 : v00;
                cs = Math.imul(cs, (Math.imul(cs, 1284865837) + 4150755663) >>> 0) >>> 0;
                cs = (cs + st) >>> 0;
                const r = (cs >>> 24) & 3;
                buf[idx + newW + 1] = r === 0 ? v00 : r === 1 ? v10 : r === 2 ? v01 : v11;
            }
            idx += 2; v00 = v10; v01 = v11;
        }
    }
    const bx = x & 1, bz = z & 1;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) out[j * w + i] = buf[(j + bz) * newW + i + bx];
    }
    return 0;
}

function mapLand(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const st = l.startSalt, ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW];
            const v00 = parentBuf[(i + 0) + j * pW], v20 = parentBuf[(i + 2) + j * pW];
            const v02 = parentBuf[i + (j + 2) * pW], v22 = parentBuf[(i + 2) + (j + 2) * pW];
            let v = v11;
            if (v11 === ocean) {
                if (v00 || v20 || v02 || v22) {
                    let cs = getChunkSeed(ss, i + x, j + z), inc = 0;
                    v = 1;
                    if (v00 !== ocean) { inc++; v = v00; cs = mcStepSeed(cs, st); }
                    if (v20 !== ocean) { if (++inc === 1 || mcFirstIsZero(cs, 2)) v = v20; cs = mcStepSeed(cs, st); }
                    if (v02 !== ocean) {
                        if (inc === 0) v = v02;
                        else if (inc === 1 && mcFirstIsZero(cs, 2)) v = v02;
                        else if (inc >= 2 && mcFirstIsZero(cs, 3)) v = v02;
                        inc++; cs = mcStepSeed(cs, st);
                    }
                    if (v22 !== ocean) {
                        if (inc === 0) v = v22;
                        else if (inc === 1 && mcFirstIsZero(cs, 2)) v = v22;
                        else if (inc === 2 && mcFirstIsZero(cs, 3)) v = v22;
                        else if (inc >= 3 && mcFirstIsZero(cs, 4)) v = v22;
                        cs = mcStepSeed(cs, st);
                    }
                    if (v !== forest && !mcFirstIsZero(cs, 3)) v = ocean;
                }
            } else if (v11 !== forest) {
                if (v00 === 0 || v20 === 0 || v02 === 0 || v22 === 0) {
                    if (mcFirstIsZero(getChunkSeed(ss, i + x, j + z), 5)) v = 0;
                }
            }
            out[i + j * w] = v;
        }
    }
    return 0;
}

function mapSnow(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (!isShallowOcean(v11)) {
                const cs = getChunkSeed(ss, i + x, j + z), r = mcFirstInt(cs, 6);
                v11 = (r === 0) ? Freezing : (r <= 1) ? Cold : Warm;
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapCool(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (v11 === Warm) {
                const v10 = parentBuf[(i + 1) + j * pW], v21 = parentBuf[(i + 2) + (j + 1) * pW];
                const v01 = parentBuf[i + (j + 1) * pW], v12 = parentBuf[(i + 1) + (j + 2) * pW];
                if ([v10, v21, v01, v12].some(v => v === Cold || v === Freezing)) v11 = Lush;
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapHeat(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (v11 === Freezing) {
                const v10 = parentBuf[(i + 1) + j * pW], v21 = parentBuf[(i + 2) + (j + 1) * pW];
                const v01 = parentBuf[i + (j + 1) * pW], v12 = parentBuf[(i + 1) + (j + 2) * pW];
                if ([v10, v21, v01, v12].some(v => v === Warm || v === Lush)) v11 = Cold;
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapSpecial(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;
    const st = l.startSalt, ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v = out[i + j * w];
            if (v === Oceanic) continue;
            const cs = getChunkSeed(ss, i + x, j + z);
            if (mcFirstIsZero(cs, 13)) {
                const cs2 = mcStepSeed(cs, st);
                v |= (1 + mcFirstInt(cs2, 15)) << 8 & 0xf00;
                out[i + j * w] = v;
            }
        }
    }
    return 0;
}

function mapMushroom(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (v11 === 0 && !parentBuf[(i + 0) + j * pW] && !parentBuf[(i + 2) + j * pW] &&
                !parentBuf[i + (j + 2) * pW] && !parentBuf[(i + 2) + (j + 2) * pW]) {
                if (mcFirstIsZero(getChunkSeed(ss, i + x, j + z), 100)) v11 = mushroom_fields;
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapDeepOcean(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (isShallowOcean(v11)) {
                let oceans = 0;
                if (isShallowOcean(parentBuf[(i + 1) + j * pW])) oceans++;
                if (isShallowOcean(parentBuf[(i + 2) + (j + 1) * pW])) oceans++;
                if (isShallowOcean(parentBuf[i + (j + 1) * pW])) oceans++;
                if (isShallowOcean(parentBuf[(i + 1) + (j + 2) * pW])) oceans++;
                if (oceans >= 4) {
                    if (v11 === warm_ocean) v11 = deep_warm_ocean;
                    else if (v11 === lukewarm_ocean) v11 = deep_lukewarm_ocean;
                    else if (v11 === ocean) v11 = deep_ocean;
                    else if (v11 === cold_ocean) v11 = deep_cold_ocean;
                    else if (v11 === frozen_ocean) v11 = deep_frozen_ocean;
                    else v11 = deep_ocean;
                }
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapLand16(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const st = l.startSalt, ss = l.startSeed;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW];
            let v = v11;
            const v00 = parentBuf[(i + 0) + j * pW], v20 = parentBuf[(i + 2) + j * pW];
            const v02 = parentBuf[(i + 0) + (j + 2) * pW], v22 = parentBuf[(i + 2) + (j + 2) * pW];

            if (v11 !== 0 || (v00 === 0 && v20 === 0 && v02 === 0 && v22 === 0)) {
                if (v11 !== 0 && (v00 === 0 || v20 === 0 || v02 === 0 || v22 === 0)) {
                    const cs = getChunkSeed(ss, i + x, j + z);
                    if (mcFirstIsZero(cs, 5)) {
                        v = (v === snowy_tundra) ? frozen_ocean : ocean;
                    }
                }
            } else {
                let cs = getChunkSeed(ss, i + x, j + z);
                let inc = 0;
                v = 1;
                if (v00 !== ocean) {
                    inc++; v = v00;
                    cs = mcStepSeed(cs, st);
                }
                if (v20 !== ocean) {
                    inc++;
                    if (inc === 1 || mcFirstIsZero(cs, 2)) v = v20;
                    cs = mcStepSeed(cs, st);
                }
                if (v02 !== ocean) {
                    inc++;
                    if (inc === 1) v = v02;
                    else if (inc === 2) { if (mcFirstIsZero(cs, 2)) v = v02; }
                    else { if (mcFirstIsZero(cs, 3)) v = v02; }
                    cs = mcStepSeed(cs, st);
                }
                if (v22 !== ocean) {
                    inc++;
                    if (inc === 1) v = v22;
                    else if (inc === 2) { if (mcFirstIsZero(cs, 2)) v = v22; }
                    else if (inc === 3) { if (mcFirstIsZero(cs, 3)) v = v22; }
                    else { if (mcFirstIsZero(cs, 4)) v = v22; }
                    cs = mcStepSeed(cs, st);
                }
                if (!mcFirstIsZero(cs, 3)) {
                    v = (v === snowy_tundra) ? frozen_ocean : ocean;
                }
            }
            out[i + j * w] = v;
        }
    }
    return 0;
}

function mapLandB18(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const ss = l.startSeed, st = l.startSalt, mc = l.mc;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW];
            const v00 = parentBuf[(i + 0) + j * pW], v20 = parentBuf[(i + 2) + j * pW];
            const v02 = parentBuf[i + (j + 2) * pW], v22 = parentBuf[(i + 2) + (j + 2) * pW];
            let v = v11;

            if (v11 === 0 && (v00 !== 0 || v02 !== 0 || v20 !== 0 || v22 !== 0)) {
                let cs = getChunkSeed(ss, i + x, j + z);
                v = mcFirstInt(cs, 3) + 1;
                if (v === taiga && mc <= MC_B1_7) v = plains;

                if (mc >= MC_1_0) {
                    cs = mcStepSeed(cs, st);
                    if (mcFirstIsZero(cs, 5)) {
                        v = (v === snowy_tundra) ? frozen_ocean : ocean;
                    }
                }
            }
            out[i + j * w] = v;
        }
    }
    return 0;
}

function mapSnow16(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const ss = l.startSeed;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (v11 !== ocean) {
                const cs = getChunkSeed(ss, i + x, j + z);
                v11 = mcFirstIsZero(cs, 5) ? snowy_tundra : plains;
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapBiome(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;
    const mc = l.mc;
    const ss = l.startSeed, st = l.startSalt;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const idx = i + j * w;
            let id = out[idx];
            const hasHighBit = (id & 0xf00);
            id &= ~0xf00;
            let v;

            if (mc <= MC_1_6) {
                // Pre-1.7 biome generation
                if (id === ocean || id === mushroom_fields) {
                    out[idx] = id;
                    continue;
                }

                const cs = getChunkSeed(ss, i + x, j + z);

                if (mc <= MC_1_1) {
                    v = oldBiomes11[mcFirstInt(cs, 6)];
                } else {
                    v = oldBiomes[mcFirstInt(cs, 7)];
                }

                // Temperature adjustment: snowy tundra for cold regions
                // id != plains means it's a cold/snowy region (snowy_tundra from mapSnow16)
                // Exception: taiga is allowed in warm zones for MC 1.3+
                if (id !== plains && (v !== taiga || mc <= MC_1_2)) {
                    v = snowy_tundra;
                }
            } else {
                // MC 1.7+ biome generation using temperature categories
                if (isOceanic(id) || id === mushroom_fields) {
                    out[idx] = id;
                    continue;
                }

                const cs = getChunkSeed(ss, i + x, j + z);

                switch (id) {
                    case Warm:
                        v = hasHighBit ? (mcFirstIsZero(cs, 3) ? badlands_plateau : wooded_badlands_plateau) : warmBiomes[mcFirstInt(cs, 6)];
                        break;
                    case Lush:
                        v = hasHighBit ? jungle : lushBiomes[mcFirstInt(cs, 6)];
                        break;
                    case Cold:
                        v = hasHighBit ? giant_tree_taiga : coldBiomes[mcFirstInt(cs, 4)];
                        break;
                    case Freezing:
                        v = snowBiomes[mcFirstInt(cs, 4)];
                        break;
                    default:
                        v = mushroom_fields;
                }
            }
            out[idx] = v;
        }
    }
    return 0;
}


function mapRiver(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const mc = l.mc;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW], v10 = parentBuf[(i + 1) + j * pW];
            let v21 = parentBuf[(i + 2) + (j + 1) * pW], v01 = parentBuf[i + (j + 1) * pW], v12 = parentBuf[(i + 1) + (j + 2) * pW];
            if (mc >= MC_1_7) {
                v11 = reduceID(v11); v10 = reduceID(v10); v21 = reduceID(v21); v01 = reduceID(v01); v12 = reduceID(v12);
            } else if (v11 === 0) {
                out[i + j * w] = river; continue;
            }
            out[i + j * w] = (v11 === v01 && v11 === v10 && v11 === v12 && v11 === v21) ? -1 : river;
        }
    }
    return 0;
}

function mapSmooth(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW], v10 = parentBuf[(i + 1) + j * pW];
            const v21 = parentBuf[(i + 2) + (j + 1) * pW], v01 = parentBuf[i + (j + 1) * pW], v12 = parentBuf[(i + 1) + (j + 2) * pW];
            if (v01 === v21 && v10 === v12) {
                out[i + j * w] = mcFirstIsZero(getChunkSeed(ss, i + x, j + z), 2) ? v01 : v10;
            } else {
                if (v01 === v21) out[i + j * w] = v01;
                else if (v10 === v12) out[i + j * w] = v10;
                else out[i + j * w] = v11;
            }
        }
    }
    return 0;
}

function mapRiverMix(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;
    const riv = new Int32Array(w * h);
    const err2 = l.p2.getMap(l.p2, riv, x, z, w, h);
    if (err2 !== 0) return err2;
    const mc = l.mc;
    for (let idx = 0; idx < w * h; idx++) {
        let biome = out[idx];
        const r = riv[idx];

        if (r === river && biome !== ocean && (mc <= MC_1_6 || !isOceanic(biome))) {
            if (biome === snowy_tundra) biome = frozen_river;
            else if (biome === mushroom_fields || biome === mushroom_field_shore) biome = mushroom_field_shore;
            else biome = river;

            out[idx] = biome;
        }
    }
    return 0;
}

function mapNoise(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;
    const ss = l.startSeed;
    const mod = (l.mc <= MC_1_6) ? 2 : 299999;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const idx = i + j * w;
            if (out[idx] > 0) {
                const cs = getChunkSeed(ss, i + x, j + z);
                out[idx] = mcFirstInt(cs, mod) + 2;
            } else {
                out[idx] = 0;
            }
        }
    }
    return 0;
}

function mapSunflower(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;
    const ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            if (out[i + j * w] === plains) {
                if (mcFirstIsZero(getChunkSeed(ss, i + x, j + z), 57)) out[i + j * w] = 129;
            }
        }
    }
    return 0;
}

// Bamboo jungle layer (MC 1.14+) - converts 10% of jungle to bamboo_jungle
function mapBamboo(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;
    const ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const idx = i + j * w;
            if (out[idx] !== jungle) continue;
            const cs = getChunkSeed(ss, i + x, j + z);
            if (mcFirstIsZero(cs, 10)) {
                out[idx] = bamboo_jungle;
            }
        }
    }
    return 0;
}



function mapShore(l, out, x, z, w, h) {

    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    const mc = l.mc;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW], v10 = parentBuf[(i + 1) + j * pW];
            let v21 = parentBuf[(i + 2) + (j + 1) * pW], v01 = parentBuf[i + (j + 1) * pW], v12 = parentBuf[(i + 1) + (j + 2) * pW];
            const idx = i + j * w;
            if (v11 === mushroom_fields) {
                out[idx] = (v10 === ocean || v21 === ocean || v01 === ocean || v12 === ocean) ? mushroom_field_shore : v11;
            } else if (mc <= MC_1_0) {
                out[idx] = v11;
            } else if (mc <= MC_1_6) {
                if (v11 === mountains) {
                    if (v10 !== mountains || v21 !== mountains || v01 !== mountains || v12 !== mountains) v11 = mountain_edge;
                } else if (v11 !== ocean && v11 !== river && v11 !== swamp) {
                    if (v10 === ocean || v21 === ocean || v01 === ocean || v12 === ocean) v11 = beach;
                }
                out[idx] = v11;
            } else if (getCategory(mc, v11) === jungle) {
                out[idx] = isAll4JFTO(mc, v10, v21, v01, v12) ? (isAny4Oceanic(v10, v21, v01, v12) ? beach : v11) : jungle_edge;
            } else if (v11 === mountains || v11 === wooded_mountains) {
                replaceOcean(out, idx, v10, v21, v01, v12, v11, stone_shore);
            } else if (isSnowy(v11)) {
                replaceOcean(out, idx, v10, v21, v01, v12, v11, snowy_beach);
            } else if (v11 === badlands || v11 === wooded_badlands_plateau) {
                if (!isAny4Oceanic(v10, v21, v01, v12)) {
                    out[idx] = (isMesa(v10) && isMesa(v21) && isMesa(v01) && isMesa(v12)) ? v11 : desert;
                } else out[idx] = v11;
            } else if (v11 !== ocean && v11 !== deep_ocean && v11 !== river && v11 !== swamp) {
                out[idx] = isAny4Oceanic(v10, v21, v01, v12) ? beach : v11;
            } else out[idx] = v11;
        }
    }
    return 0;
}

function mapSwampRiver(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;
    const ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v = out[i + j * w];
            if (v !== swamp && v !== jungle && v !== jungle_hills) continue;
            const cs = getChunkSeed(ss, i + x, j + z);
            if (mcFirstIsZero(cs, (v === swamp) ? 6 : 8)) v = river;
            out[i + j * w] = v;
        }
    }
    return 0;
}

function mapHills(l, out, x, z, w, h) {
    const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;
    if (!l.p2) {
        console.error(`mapHills: l.p2 is missing! mc=${l.mc} scale=${l.scale} salt=${l.layerSalt}`);
        return -1;
    }
    const riv = new Int32Array(pW * pH);
    const err2 = l.p2.getMap(l.p2, riv, pX, pZ, pW, pH);
    if (err2 !== 0) return err2;
    const mc = l.mc, st = l.startSalt, ss = l.startSeed;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const idx = i + j * w;
            const a11 = parentBuf[(i + 1) + (j + 1) * pW], b11 = riv[(i + 1) + (j + 1) * pW];
            let bn = -1; if (mc >= MC_1_7) bn = (b11 - 2) % 29;
            if (bn === 1 && b11 >= 2 && !isShallowOcean(a11)) {
                const m = getMutated(mc, a11); out[idx] = m > 0 ? m : a11;
            } else {
                const cs = getChunkSeed(ss, i + x, j + z);
                if (bn === 0 || mcFirstIsZero(cs, 3)) {
                    let hillID = a11;
                    switch (a11) {
                        case desert: hillID = desert_hills; break;
                        case forest: hillID = wooded_hills; break;
                        case birch_forest: hillID = birch_forest_hills; break;
                        case dark_forest: hillID = plains; break;
                        case taiga: hillID = taiga_hills; break;
                        case giant_tree_taiga: hillID = giant_tree_taiga_hills; break;
                        case snowy_taiga: hillID = snowy_taiga_hills; break;
                        case plains: hillID = (mc <= MC_1_6) ? forest : (mcFirstIsZero(mcStepSeed(cs, st), 3) ? wooded_hills : forest); break;
                        case snowy_tundra: hillID = snowy_mountains; break;
                        case jungle: hillID = jungle_hills; break;
                        case bamboo_jungle: hillID = bamboo_jungle_hills; break;
                        case ocean: if (mc >= MC_1_7) hillID = deep_ocean; break;
                        case mountains: if (mc >= MC_1_7) hillID = wooded_mountains; break;
                        case savanna: hillID = savanna_plateau; break;
                        default:
                            if (areSimilar(mc, a11, wooded_badlands_plateau)) hillID = badlands;
                            else if (isDeepOcean(a11)) {
                                let cs2 = mcStepSeed(cs, st);
                                if (mcFirstIsZero(cs2, 3)) hillID = mcFirstIsZero(mcStepSeed(cs2, st), 2) ? plains : forest;
                            }
                    }
                    if (bn === 0 && hillID !== a11) { const m = getMutated(mc, hillID); hillID = m >= 0 ? m : a11; }
                    if (hillID !== a11) {
                        const a10 = parentBuf[(i + 1) + j * pW], a21 = parentBuf[(i + 2) + (j + 1) * pW], a01 = parentBuf[i + (j + 1) * pW], a12 = parentBuf[(i + 1) + (j + 2) * pW];
                        let equals = 0;
                        if (areSimilar(mc, a10, a11)) equals++; if (areSimilar(mc, a21, a11)) equals++;
                        if (areSimilar(mc, a01, a11)) equals++; if (areSimilar(mc, a12, a11)) equals++;
                        out[idx] = (equals >= 3 + (mc <= MC_1_6 ? 1 : 0)) ? hillID : a11;
                    } else out[idx] = a11;
                } else out[idx] = a11;
            }
        }
    }
    return 0;
}

// ============================================================================
// Layer Stack Setup
// ============================================================================


function mapOceanTemp(l, out, x, z, w, h) {
    const rnd = l.noise;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const rx = (i + x) / 8.0;
            const rz = (j + z) / 8.0;
            const tmp = rnd.sample(rx, rz, 0);
            let v;
            if (tmp > 0.4) v = warm_ocean;
            else if (tmp > 0.2) v = lukewarm_ocean;
            else if (tmp < -0.4) v = frozen_ocean;
            else if (tmp < -0.2) v = cold_ocean;
            else v = ocean;
            out[i + j * w] = v;
        }
    }
    return 0;
}

function mapOceanMix(l, out, x, z, w, h) {
    const pX = x, pZ = z, pW = w, pH = h;
    const err = l.p2.getMap(l.p2, out, pX, pZ, pW, pH); // Ocean Temp output
    if (err !== 0) return err;

    // determine required area
    let lx0 = 0, lx1 = w, lz0 = 0, lz1 = h;
    for (let j = 0; j < h; j++) {
        const jcentre = (j - 8 > 0 && j + 9 < h);
        for (let i = 0; i < w; i++) {
            if (jcentre && i - 8 > 0 && i + 9 < w) continue;
            const oceanID = out[i + j * w];
            if (oceanID === warm_ocean || oceanID === frozen_ocean) {
                if (i - 8 < lx0) lx0 = i - 8;
                if (i + 9 > lx1) lx1 = i + 9;
                if (j - 8 < lz0) lz0 = j - 8;
                if (j + 9 > lz1) lz1 = j + 9;
            }
        }
    }

    const lw = lx1 - lx0, lh = lz1 - lz0;
    const land = new Int32Array(lw * lh);
    const err2 = l.p.getMap(l.p, land, x + lx0, z + lz0, lw, lh); // Land/Height output
    if (err2 !== 0) return err2;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const landID = land[(i - lx0) + (j - lz0) * lw];
            let oceanID = out[i + j * w];

            if (!isOceanic(landID)) {
                out[i + j * w] = landID;
                continue;
            }

            let replaceID = 0;
            if (oceanID === warm_ocean) replaceID = lukewarm_ocean;
            if (oceanID === frozen_ocean) replaceID = cold_ocean;

            if (replaceID) {
                let found = false;
                check: for (let ii = -8; ii <= 8; ii += 4) {
                    for (let jj = -8; jj <= 8; jj += 4) {
                        const id = land[(i + ii - lx0) + (j + jj - lz0) * lw];
                        if (!isOceanic(id)) {
                            out[i + j * w] = replaceID;
                            found = true;
                            break check;
                        }
                    }
                }
                if (found) continue;
            }

            if (landID === deep_ocean) {
                switch (oceanID) {
                    case lukewarm_ocean: oceanID = deep_lukewarm_ocean; break;
                    case ocean: oceanID = deep_ocean; break;
                    case cold_ocean: oceanID = deep_cold_ocean; break;
                    case frozen_ocean: oceanID = deep_frozen_ocean; break;
                }
            }
            out[i + j * w] = oceanID;
        }
    }
    return 0;
}


export function setupLayerStack(mc, largeBiomes = false) {
    const layers = {};
    const map_land = (mc <= MC_1_6) ? mapLand16 : mapLand;
    let p;

    layers.continent = new Layer(mapContinent, 4096, 1);
    layers.zoom2048 = new Layer(mapZoomFuzzy, 2048, 2000, layers.continent);

    if (mc === MC_B1_7) {
        // Beta 1.7 does not use layers for biome generation
        return layers;
    }

    if (mc === MC_B1_8) {
        // Beta 1.8 stack starts at scale 8192
        layers.continent = new Layer(mapContinent, 8192, 1);
        p = layers.zoom4096 = new Layer(mapZoomFuzzy, 4096, 2000, layers.continent);
        p = layers.land4096 = new Layer(mapLandB18, 4096, 1, p);
        p = layers.zoom2048 = new Layer(mapZoom, 2048, 2001, p);
        p = layers.land2048 = new Layer(mapLandB18, 2048, 2, p);
        p = layers.zoom1024 = new Layer(mapZoom, 1024, 2002, p);
        p = layers.land1024a = new Layer(mapLandB18, 1024, 3, p);
        p = layers.zoom512 = new Layer(mapZoom, 512, 2003, p);
        p = layers.land512 = new Layer(mapLandB18, 512, 3, p);
        p = layers.zoom256 = new Layer(mapZoom, 256, 2004, p);
        p = layers.land256 = new Layer(mapLandB18, 256, 3, p);
        p = layers.biome256 = new Layer(mapBiome, 256, 200, p);
        const biome256 = p;
        p = layers.zoom128 = new Layer(mapZoom, 128, 1000, p);
        p = layers.zoom64 = new Layer(mapZoom, 64, 1001, p);
        const zoom64 = p;

        p = layers.zoom32 = new Layer(mapZoom, 32, 1000, zoom64);
        p = layers.land32 = new Layer(mapLandB18, 32, 3, p);
        p = layers.shore32 = new Layer(mapShore, 32, 1000, p);
        p = layers.zoom16 = new Layer(mapZoom, 16, 1001, p);
        p = layers.zoom8 = new Layer(mapZoom, 8, 1002, p);
        p = layers.zoom4 = new Layer(mapZoom, 4, 1003, p);
        p = layers.smooth4 = new Layer(mapSmooth, 4, 1000, p);
        const smooth4 = p;

        // River chain
        layers.riverInit256 = new Layer(mapNoise, 256, 100, layers.land256);
        p = layers.zoom128River = new Layer(mapZoom, 128, 1000, layers.riverInit256);
        p = layers.zoom64River = new Layer(mapZoom, 64, 1001, p);
        p = layers.zoom32River = new Layer(mapZoom, 32, 1002, p);
        p = layers.zoom16River = new Layer(mapZoom, 16, 1003, p);
        p = layers.zoom8River = new Layer(mapZoom, 8, 1004, p);
        p = layers.zoom4River = new Layer(mapZoom, 4, 1005, p);
        p = layers.river4 = new Layer(mapRiver, 4, 1, p);
        p = layers.smooth4River = new Layer(mapSmooth, 4, 1000, p);
        const smooth4River = p;

        layers.riverMix4 = new Layer(mapRiverMix, 4, 100, smooth4, smooth4River);
    } else if (mc <= MC_1_6) {
        p = layers.land2048 = new Layer(mapLand16, 2048, 1, layers.zoom2048);
        p = layers.zoom1024 = new Layer(mapZoom, 1024, 2001, p);
        p = layers.land1024a = new Layer(mapLand16, 1024, 2, p);
        p = layers.snow1024 = new Layer(mapSnow16, 1024, 2, p);
        p = layers.zoom512 = new Layer(mapZoom, 512, 2002, p);
        p = layers.land512 = new Layer(mapLand16, 512, 3, p);
        p = layers.zoom256 = new Layer(mapZoom, 256, 2003, p);
        p = layers.land256 = new Layer(mapLand16, 256, 4, p);
        p = layers.mushroom256 = new Layer(mapMushroom, 256, 5, p);
        p = layers.biome256 = new Layer(mapBiome, 256, 200, p);
        p = layers.zoom128 = new Layer(mapZoom, 128, 1000, p);
        p = layers.zoom64 = new Layer(mapZoom, 64, 1001, p);
        layers.riverInit256 = new Layer(mapNoise, 256, 100, layers.mushroom256);
    } else {
        p = layers.land2048 = new Layer(mapLand, 2048, 1, layers.zoom2048);
        p = layers.zoom1024 = new Layer(mapZoom, 1024, 2001, p);
        p = layers.land1024a = new Layer(mapLand, 1024, 2, p);
        if (mc >= MC_1_7) {
            p = layers.land1024b = new Layer(mapLand, 1024, 50, p);
            p = layers.land1024c = new Layer(mapLand, 1024, 70, p);
            p = layers.island1024 = new Layer((l, o, x, z, w, h) => {
                const pX = x - 1, pZ = z - 1, pW = w + 2, pH = h + 2;
                const parentBuf = new Int32Array(pW * pH);
                if (l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH) !== 0) return -1;
                for (let j = 0; j < h; j++) {
                    for (let i = 0; i < w; i++) {
                        let v = parentBuf[(i + 1) + (j + 1) * pW];
                        if (v === 0) {
                            if (parentBuf[(i + 1) + j * pW] === 0 && parentBuf[(i + 2) + (j + 1) * pW] === 0 &&
                                parentBuf[i + (j + 1) * pW] === 0 && parentBuf[(i + 1) + (j + 2) * pW] === 0) {
                                if (mcFirstIsZero(getChunkSeed(l.startSeed, i + x, j + z), 2)) v = 1;
                            }
                        }
                        o[i + j * w] = v;
                    }
                }
                return 0;
            }, 1024, 2, p);
            p = layers.snow1024 = new Layer(mapSnow, 1024, 2, p);
            p = layers.land1024d = new Layer(mapLand, 1024, 3, p);
            p = layers.cool1024 = new Layer(mapCool, 1024, 2, p);
            p = layers.heat1024 = new Layer(mapHeat, 1024, 2, p);
            p = layers.special1024 = new Layer(mapSpecial, 1024, 3, p);
        } else {
            p = layers.snow1024 = new Layer(mapSnow, 1024, 2, p);
        }
        p = layers.zoom512 = new Layer(mapZoom, 512, 2002, p);
        p = layers.zoom256 = new Layer(mapZoom, 256, 2003, p);
        p = layers.land256 = new Layer(mapLand, 256, 4, p);
        p = layers.mushroom256 = new Layer(mapMushroom, 256, 5, p);
        if (mc >= MC_1_7) {
            p = layers.deepOcean256 = new Layer(mapDeepOcean, 256, 4, p);
            p = layers.biome256 = new Layer(mapBiome, 256, 200, p);
        } else {
            p = layers.biome256 = new Layer(mapBiome, 256, 200, p);
        }

        if (mc >= MC_1_14) p = layers.bamboo256 = new Layer(mapBamboo, 256, 1001, p);

        p = layers.zoom128 = new Layer(mapZoom, 128, 1000, p);
        p = layers.zoom64 = new Layer(mapZoom, 64, 1001, p);
        p = layers.biomeEdge64 = new Layer(mapBiomeEdge, 64, 1000, p);
        layers.riverInit256 = new Layer(mapNoise, 256, 100, (mc >= MC_1_7) ? layers.deepOcean256 : layers.mushroom256);
    }

    // Hill layers
    if (mc > MC_1_0) {
        const hS1 = (mc <= MC_1_12) ? 0 : 1000;
        const hS2 = (mc <= MC_1_12) ? 0 : 1001;
        layers.zoom128Hills = new Layer(mapZoom, 128, hS1, layers.riverInit256);
        layers.zoom64Hills = new Layer(mapZoom, 64, hS2, layers.zoom128Hills);
        const hillsParent = (mc <= MC_1_6) ? layers.zoom64 : layers.biomeEdge64;
        p = layers.hills64 = new Layer(mapHills, 64, 1000, hillsParent, layers.zoom64Hills);
    } else {
        p = layers.zoom64;
    }

    if (mc >= MC_1_7) p = layers.sunflower64 = new Layer(mapSunflower, 64, 1001, p);

    p = layers.zoom32 = new Layer(mapZoom, 32, 1000, p);
    p = layers.land32 = new Layer(map_land, 32, 3, p);

    // For MC 1.0, shore layer comes BEFORE zoom16 (at scale 32)
    // For MC 1.1+, shore layer comes AFTER zoom16 (at scale 16)
    if (mc <= MC_1_0) {
        p = layers.shore32 = new Layer(mapShore, 32, 1000, p);
        p = layers.zoom16 = new Layer(mapZoom, 16, 1001, p);
    } else {
        p = layers.zoom16 = new Layer(mapZoom, 16, 1001, p);
        p = layers.shore16 = new Layer(mapShore, 16, 1000, p);
    }

    if (mc > MC_1_0 && mc <= MC_1_6) {
        p = layers.swampRiver16 = new Layer(mapSwampRiver, 16, 1000, p);
    }

    p = layers.zoom8 = new Layer(mapZoom, 8, 1002, p);
    p = layers.zoom4 = new Layer(mapZoom, 4, 1003, p);

    if (largeBiomes) {
        p = layers.zoomLargeA = new Layer(mapZoom, 4, 1004, p);
        p = layers.zoomLargeB = new Layer(mapZoom, 4, 1005, p);
    }

    p = layers.smooth4 = new Layer(mapSmooth, 4, 1000, p);

    // River chain
    const rS = (mc <= MC_1_6) ? [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007] : [1000, 1001, 1000, 1001, 1002, 1003, 1004, 1005];
    let r = layers.riverInit256;
    r = layers.zoom128River = new Layer(mapZoom, 128, rS[0], r);
    r = layers.zoom64River = new Layer(mapZoom, 64, rS[1], r);
    r = layers.zoom32River = new Layer(mapZoom, 32, rS[2], r);
    r = layers.zoom16River = new Layer(mapZoom, 16, rS[3], r);
    r = layers.zoom8River = new Layer(mapZoom, 8, rS[4], r);
    r = layers.zoom4River = new Layer(mapZoom, 4, rS[5], r);

    if (largeBiomes) {
        r = layers.zoomLargeRiverA = new Layer(mapZoom, 4, rS[6], r);
        r = layers.zoomLargeRiverB = new Layer(mapZoom, 4, rS[7], r);
    }

    r = layers.river4 = new Layer(mapRiver, 4, 1, r);
    r = layers.smoothRiver4 = new Layer(mapSmooth, 4, 1000, r);

    layers.riverMix4 = new Layer(mapRiverMix, 4, 100, p, r);

    let entry = layers.riverMix4;
    if (mc >= MC_1_13) {
        layers.oceanTemp256 = new Layer(mapOceanTemp, 256, 2);
        layers.zoom128Ocean = new Layer(mapZoom, 128, 2001, layers.oceanTemp256);
        layers.zoom64Ocean = new Layer(mapZoom, 64, 2002, layers.zoom128Ocean);
        layers.zoom32Ocean = new Layer(mapZoom, 32, 2003, layers.zoom64Ocean);
        layers.zoom16Ocean = new Layer(mapZoom, 16, 2004, layers.zoom32Ocean);
        layers.zoom8Ocean = new Layer(mapZoom, 8, 2005, layers.zoom16Ocean);
        layers.zoom4Ocean = new Layer(mapZoom, 4, 2006, layers.zoom8Ocean);
        entry = layers.oceanMix4 = new Layer(mapOceanMix, 4, 100, layers.riverMix4, layers.zoom4Ocean);
    }

    for (const key in layers) layers[key].mc = mc;
    return layers;
}

/**
 * Legacy biome generator for pre-1.18
 */
export class LegacyBiomeGenerator {
    constructor(seed, version = 11) { // Default to 1.8 (MC_1_8 is 11)
        this.seed = BigInt(seed);
        this.version = version;
        this.layers = setupLayerStack(version);

        if (version === MC_B1_7) {
            this.bnb = new BiomeNoiseBeta(this.seed);
            this.snb = new SurfaceNoiseBeta(this.seed);
            return;
        }

        let layerSeed = this.seed;
        if (version >= MC_1_13 && this.layers.oceanTemp256) {
            const rnd = new JavaRandom(this.seed);
            this.oceanRnd = new PerlinNoise(rnd);
            this.layers.oceanTemp256.noise = this.oceanRnd;
            // layerSeed = rnd.seed; // INCORRECT: layers use the original world seed
        }

        const entry = this.layers.oceanMix4 || this.layers.riverMix4;
        this.entry = entry;
        this.entry.setWorldSeed(layerSeed);
    }
    getBiome(x, z) {
        if (this.version === MC_B1_7) {
            // Beta 1.7 scale 4 sampling is done at the center of the 4x4 block (offset +2)
            const sx = x + 2, sz = z + 2;
            const [t, h] = this.bnb.sample(sx, sz);
            const biome = getOldBetaBiome(t, h);

            // Check surface noise for ocean
            const cols = this.snb.sample(sx, sz, [t, h]);

            // cols[0]*0.125 + cols[1]*0.875 <= 0 implies ocean
            if (cols[0] * 0.125 + cols[1] * 0.875 <= 0) {
                return (t < 0.5) ? frozen_ocean : ocean;
            }
            return biome;
        }
        const bx = Math.floor(x / 4), bz = Math.floor(z / 4), out = new Int32Array(1);
        this.entry.getMap(this.entry, out, bx, bz, 1, 1);
        return out[0];
    }
    getArea(x, z, w, h, scale = 4) {
        const sx = Math.floor(x / scale), sz = Math.floor(z / scale);
        const sw = Math.ceil(w / scale), sh = Math.ceil(h / scale);
        const out = new Int32Array(sw * sh);
        this.entry.getMap(this.entry, out, sx, sz, sw, sh);
        return { data: out, width: sw, height: sh, startX: sx, startZ: sz, scale: scale };
    }
}

export {
    Layer,
    mapContinent,
    mapZoom,
    mapZoomFuzzy,
    mapLand,
    mapSnow,
    mapBiome,
    mapRiver,
    mapNoise,
    mapRiverMix,
    ocean, plains, desert, mountains, forest, taiga, swamp, river,
    frozen_ocean, frozen_river, snowy_tundra, mushroom_fields, beach,
    jungle, deep_ocean, savanna, badlands, warm_ocean, cold_ocean
};
