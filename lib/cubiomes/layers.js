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
const warm_ocean = 44;
const lukewarm_ocean = 45;
const cold_ocean = 46;
const deep_warm_ocean = 47;
const deep_lukewarm_ocean = 48;
const deep_cold_ocean = 49;
const deep_frozen_ocean = 50;
const bamboo_jungle = 168;
const bamboo_jungle_hills = 169;

// Biome arrays
const warmBiomes = [desert, desert, desert, savanna, savanna, plains];
const lushBiomes = [forest, dark_forest, mountains, plains, birch_forest, swamp];
const coldBiomes = [forest, mountains, taiga, plains];
const snowBiomes = [snowy_tundra, snowy_tundra, snowy_tundra, snowy_taiga];

// ============================================================================
// Helper Functions
// ============================================================================

function mcStepSeed(s, salt) {
    s = BigInt(s);
    salt = BigInt(salt);
    return (s * 6364136223846793005n + 1442695040888963407n + salt) & 0xFFFFFFFFFFFFFFFFn;
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
    // Simulate int64_t behavior: if top bit is 1, treat as negative
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
    return id === ocean || id === frozen_ocean || id === warm_ocean ||
        id === lukewarm_ocean || id === cold_ocean;
}

function isDeepOcean(id) {
    return id === deep_ocean || id === deep_warm_ocean || id === deep_lukewarm_ocean ||
        id === deep_cold_ocean || id === deep_frozen_ocean;
}

function isOceanic(id) {
    return isShallowOcean(id) || isDeepOcean(id);
}

function getMutated(mc, id) {
    const mutated = {
        [plains]: 129,            // sunflower_plains
        [desert]: 130,            // desert_lakes
        [mountains]: 131,         // gravelly_mountains
        [forest]: 132,            // flower_forest
        [taiga]: 133,             // taiga_mountains
        [swamp]: 134,             // swamp_hills
        [snowy_tundra]: 140,      // ice_spikes
        [jungle]: 149,            // modified_jungle
        [jungle_edge]: 151,       // modified_jungle_edge
        [birch_forest]: 155,      // tall_birch_forest
        [birch_forest_hills]: 156,// tall_birch_hills
        [dark_forest]: 157,       // dark_forest_hills
        [snowy_taiga]: 158,       // snowy_taiga_mountains
        [giant_tree_taiga]: 160,  // giant_spruce_taiga
        [giant_tree_taiga_hills]: 161,
        [wooded_mountains]: 162,  // modified_gravelly_mountains
        [savanna]: 163,           // shattered_savanna
        [savanna_plateau]: 164,   // shattered_savanna_plateau
        [badlands]: 165,          // eroded_badlands
        [wooded_badlands_plateau]: 166,
        [badlands_plateau]: 167,
    };
    return mutated[id] || -1;
}

function areSimilar(mc, id1, id2) {
    if (id1 === id2) return true;
    if (id1 === wooded_badlands_plateau || id1 === badlands_plateau) {
        return id2 === wooded_badlands_plateau || id2 === badlands_plateau;
    }
    const c1 = getCategory(id1);
    const c2 = getCategory(id2);
    if (c1 === c2 && c1 !== 'none') return true;
    return false;
}

function getCategory(id) {
    if (id === badlands || id === wooded_badlands_plateau || id === badlands_plateau ||
        id === 165 || id === 166 || id === 167) return 'mesa';
    if (id === jungle || id === jungle_edge || id === jungle_hills ||
        id === bamboo_jungle || id === bamboo_jungle_hills) return 'jungle';
    if (id === forest || id === wooded_hills || id === birch_forest ||
        id === birch_forest_hills || id === dark_forest || id === 132 || id === 155 || id === 156 || id === 157) return 'forest';
    return 'none';
}

// ============================================================================
// Layer Class
// ============================================================================

class Layer {
    constructor(getMapFunc, scale, salt, parent = null, parent2 = null) {
        this.getMap = getMapFunc;
        this.scale = scale;
        this.layerSalt = getLayerSalt(salt);
        this.startSalt = 0n;
        this.startSeed = 0n;
        this.p = parent;
        this.p2 = parent2;
        this.mc = 13; // Default MC version (1.13)
    }

    setWorldSeed(worldSeed) {
        if (this.p2) this.p2.setWorldSeed(worldSeed);
        if (this.p) this.p.setWorldSeed(worldSeed);

        worldSeed = BigInt(worldSeed);
        let st = worldSeed;
        st = mcStepSeed(st, this.layerSalt);
        st = mcStepSeed(st, this.layerSalt);
        st = mcStepSeed(st, this.layerSalt);

        this.startSalt = st;
        this.startSeed = mcStepSeed(st, 0n);
    }
}

// ============================================================================
// Layer Functions
// ============================================================================

function mapContinent(l, out, x, z, w, h) {
    const ss = l.startSeed;
    let hasOcean = false;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const cs = getChunkSeed(ss, i + x, j + z);
            const val = mcFirstIsZero(cs, 10) ? 1 : 0;
            out[j * w + i] = val;
            if (val === 0) hasOcean = true;
        }
    }
    if (!hasOcean && w > 1 && h > 1) {
        console.log(`mapContinent NO OCEAN in ${w}x${h} block`);
    }

    if (x > -w && x <= 0 && z > -h && z <= 0) {
        out[-z * w - x] = 1;
    }
    return 0;
}

function modeOrRandom(v0, v1, v2, v3, r) {
    if (v1 === v2 && v2 === v3) return v1;
    if (v0 === v1 && v0 === v2) return v0;
    if (v0 === v1 && v0 === v3) return v0;
    if (v0 === v2 && v0 === v3) return v0;
    if (v0 === v1 && v2 !== v3) return v0;
    if (v0 === v2 && v1 !== v3) return v0;
    if (v0 === v3 && v1 !== v2) return v0;
    if (v1 === v2 && v0 !== v3) return v1;
    if (v1 === v3 && v0 !== v2) return v1;
    if (v2 === v3 && v0 !== v1) return v2;
    // return selectRandom(v0, v1, v2, v3);
    return r === 0n ? v0 : r === 1n ? v1 : r === 2n ? v2 : v3;
}

function mapZoomSmart(l, out, x, z, w, h) {
    const pX = x >> 1;
    const pZ = z >> 1;
    const pW = (x + w + 1 >> 1) - pX + 2;
    const pH = (z + h + 1 >> 1) - pZ + 2;

    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    const newW = pW * 2;
    const st = l.startSalt;
    const ss = l.startSeed;
    const buf = new Int32Array(newW * pH * 2);

    for (let j = 0; j < pH - 1; j++) {
        const idx = j * 2 * newW;
        let v00 = parentBuf[j * pW];
        let v01 = parentBuf[(j + 1) * pW];

        for (let i = 0; i < pW - 1; i++) {
            const v10 = parentBuf[i + 1 + j * pW];
            let v11 = parentBuf[i + 1 + (j + 1) * pW];

            // 00 10
            // 01 11
            const chunkX = (i + pX) * 2;
            const chunkZ = (j + pZ) * 2;

            let cs = ss + BigInt(chunkX);
            cs = mcStepSeed(cs, BigInt(chunkZ));
            cs = mcStepSeed(cs, BigInt(chunkX));
            cs = mcStepSeed(cs, BigInt(chunkZ));

            buf[idx + i * 2] = v00;
            cs = mcStepSeed(cs, st);
            buf[idx + newW + i * 2] = ((cs >> 24n) & 1n) ? v01 : v00;
            cs = mcStepSeed(cs, st);
            buf[idx + i * 2 + 1] = ((cs >> 24n) & 1n) ? v10 : v00;

            cs = mcStepSeed(cs, st);
            const r = (cs >> 24n) & 3n;
            buf[idx + newW + i * 2 + 1] = modeOrRandom(v00, v10, v01, v11, r);

            v00 = v10;
            v01 = v11;
        }
    }

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            out[j * w + i] = buf[(j + (z & 1)) * newW + i + (x & 1)];
        }
    }
    return 0;
}

function mapZoom(l, out, x, z, w, h) {
    const pX = x >> 1;
    const pZ = z >> 1;
    const pW = (x + w + 1 >> 1) - pX + 2;
    const pH = (z + h + 1 >> 1) - pZ + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    const newW = pW * 2;
    const st = l.startSalt;
    const ss = l.startSeed;
    const buf = new Int32Array(newW * pH * 2);

    for (let j = 0; j < pH - 1; j++) {
        const idx = j * 2 * newW;
        let v00 = parentBuf[j * pW];
        let v01 = parentBuf[(j + 1) * pW];

        for (let i = 0; i < pW - 1; i++) {
            const v10 = parentBuf[i + 1 + j * pW];
            const v11 = parentBuf[i + 1 + (j + 1) * pW];

            if (v00 === v01 && v00 === v10 && v00 === v11) {
                buf[idx + i * 2] = v00;
                buf[idx + i * 2 + 1] = v00;
                buf[idx + newW + i * 2] = v00;
                buf[idx + newW + i * 2 + 1] = v00;
            } else {
                const chunkX = (i + pX) * 2;
                const chunkZ = (j + pZ) * 2;

                let cs = ss + BigInt(chunkX);
                cs = mcStepSeed(cs, BigInt(chunkZ));
                cs = mcStepSeed(cs, BigInt(chunkX));
                cs = mcStepSeed(cs, BigInt(chunkZ));

                buf[idx + i * 2] = v00;

                cs = mcStepSeed(cs, st);
                buf[idx + newW + i * 2] = ((cs >> 24n) & 1n) ? v01 : v00;

                cs = mcStepSeed(cs, st);
                buf[idx + i * 2 + 1] = ((cs >> 24n) & 1n) ? v10 : v00;

                cs = mcStepSeed(cs, st);
                const r = (cs >> 24n) & 3n;
                buf[idx + newW + i * 2 + 1] = r === 0n ? v00 : r === 1n ? v10 : r === 2n ? v01 : v11;
            }

            v00 = v10;
            v01 = v11;
        }
    }

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            out[j * w + i] = buf[(j + (z & 1)) * newW + i + (x & 1)];
        }
    }

    return 0;
}

function mapLand(l, out, x, z, w, h) {
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    // Check parent output at 0,0 for debugging
    if (out.length === 1 && x === 0 && z === 0 && l.scale) {
        // console.log(`mapLand scale=${l.scale} Parent(0,0)=${parentBuf[(1-z)*pW + (1-x)]}`);
    }

    const st = l.startSalt;
    const ss = l.startSeed;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW];
            const v00 = parentBuf[(i + 0) + (j + 0) * pW];
            const v20 = parentBuf[(i + 2) + (j + 0) * pW];
            const v02 = parentBuf[(i + 0) + (j + 2) * pW];
            const v22 = parentBuf[(i + 2) + (j + 2) * pW];

            let v = v11;

            if (v11 === ocean) {
                if (v00 || v20 || v02 || v22) {
                    let cs = getChunkSeed(ss, i + x, j + z);
                    let inc = 0;
                    v = 1;

                    if (v00 !== ocean) { inc++; v = v00; cs = mcStepSeed(cs, st); }
                    if (v20 !== ocean) {
                        if (++inc === 1 || mcFirstIsZero(cs, 2)) v = v20;
                        cs = mcStepSeed(cs, st);
                    }
                    if (v02 !== ocean) {
                        if (inc === 0) v = v02;
                        else if (inc === 1 && mcFirstIsZero(cs, 2)) v = v02;
                        else if (inc >= 2 && mcFirstIsZero(cs, 3)) v = v02;
                        inc++;
                        cs = mcStepSeed(cs, st);
                    }
                    if (v22 !== ocean) {
                        if (inc === 0) v = v22;
                        else if (inc === 1 && mcFirstIsZero(cs, 2)) v = v22;
                        else if (inc === 2 && mcFirstIsZero(cs, 3)) v = v22;
                        else if (inc >= 3 && mcFirstIsZero(cs, 4)) v = v22;
                        cs = mcStepSeed(cs, st);
                    }

                    if (mcFirstIsZero(cs, inc + 1)) {
                        v = ocean;
                    } else if (v !== plains && !mcFirstIsZero(cs, 3)) {
                        v = ocean;
                    }
                }
            } else if (v11 !== plains) {
                if (v00 === 0 || v20 === 0 || v02 === 0 || v22 === 0) {
                    const cs = getChunkSeed(ss, i + x, j + z);
                    if (mcFirstIsZero(cs, 5)) v = 0;
                }
            }

            out[i + j * w] = v;
        }
    }



    return 0;
}

function mapSnow(l, out, x, z, w, h) {
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;

    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    const ss = l.startSeed;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (!isShallowOcean(v11)) {
                const cs = getChunkSeed(ss, i + x, j + z);
                const r = mcFirstInt(cs, 6);
                if (r === 0) v11 = Freezing;
                else if (r <= 1) v11 = Cold;
                else v11 = Warm;
            }
            out[i + j * w] = v11;
        }
    }

    return 0;
}

function mapCool(l, out, x, z, w, h) {
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (v11 === Warm) {
                const v10 = parentBuf[(i + 1) + (j + 0) * pW];
                const v21 = parentBuf[(i + 2) + (j + 1) * pW];
                const v01 = parentBuf[(i + 0) + (j + 1) * pW];
                const v12 = parentBuf[(i + 1) + (j + 2) * pW];
                if ([v10, v21, v01, v12].some(v => v === Cold || v === Freezing)) {
                    v11 = Lush;
                }
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapHeat(l, out, x, z, w, h) {
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (v11 === Freezing) {
                const v10 = parentBuf[(i + 1) + (j + 0) * pW];
                const v21 = parentBuf[(i + 2) + (j + 1) * pW];
                const v01 = parentBuf[(i + 0) + (j + 1) * pW];
                const v12 = parentBuf[(i + 1) + (j + 2) * pW];
                if ([v10, v21, v01, v12].some(v => v === Warm || v === Lush)) {
                    v11 = Cold;
                }
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapSpecial(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;

    const st = l.startSalt;
    const ss = l.startSeed;

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
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    const ss = l.startSeed;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (v11 === 0 &&
                !parentBuf[(i + 0) + (j + 0) * pW] && !parentBuf[(i + 2) + (j + 0) * pW] &&
                !parentBuf[(i + 0) + (j + 2) * pW] && !parentBuf[(i + 2) + (j + 2) * pW]) {
                const cs = getChunkSeed(ss, i + x, j + z);
                if (mcFirstIsZero(cs, 100)) {
                    v11 = mushroom_fields;
                }
            }
            out[i + j * w] = v11;
        }
    }
    return 0;
}

function mapDeepOcean(l, out, x, z, w, h) {
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            let v11 = parentBuf[(i + 1) + (j + 1) * pW];
            if (isShallowOcean(v11)) {
                let oceans = 0;
                if (isShallowOcean(parentBuf[(i + 1) + (j + 0) * pW])) oceans++;
                if (isShallowOcean(parentBuf[(i + 2) + (j + 1) * pW])) oceans++;
                if (isShallowOcean(parentBuf[(i + 0) + (j + 1) * pW])) oceans++;
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

function mapBiome(l, out, x, z, w, h) {
    const err = l.p.getMap(l.p, out, x, z, w, h);
    if (err !== 0) return err;

    const mc = l.mc;
    const ss = l.startSeed;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const idx = i + j * w;
            let id = out[idx];
            let v;
            const hasHighBit = (id & 0xf00);
            id &= ~0xf00;

            if (isOceanic(id) || id === mushroom_fields) {
                out[idx] = id;
                continue;
            }

            const cs = getChunkSeed(ss, i + x, j + z);

            switch (id) {
                case Warm:
                    if (hasHighBit) v = mcFirstIsZero(cs, 3) ? badlands_plateau : wooded_badlands_plateau;
                    else v = warmBiomes[mcFirstInt(cs, 6)];
                    break;
                case Lush:
                    if (hasHighBit) v = jungle;
                    else v = lushBiomes[mcFirstInt(cs, 6)];
                    break;
                case Cold:
                    if (hasHighBit) v = giant_tree_taiga;
                    else v = coldBiomes[mcFirstInt(cs, 4)];
                    break;
                case Freezing:
                    v = snowBiomes[mcFirstInt(cs, 4)];
                    break;
                default:
                    v = mushroom_fields;
            }

            out[idx] = v;
        }
    }
    return 0;
}

function mapRiver(l, out, x, z, w, h) {
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW];
            const v10 = parentBuf[(i + 1) + (j + 0) * pW];
            const v21 = parentBuf[(i + 2) + (j + 1) * pW];
            const v01 = parentBuf[(i + 0) + (j + 1) * pW];
            const v12 = parentBuf[(i + 1) + (j + 2) * pW];

            const r11 = v11 > 0 ? v11 & 0xff : v11;
            const r10 = v10 > 0 ? v10 & 0xff : v10;
            const r21 = v21 > 0 ? v21 & 0xff : v21;
            const r01 = v01 > 0 ? v01 & 0xff : v01;
            const r12 = v12 > 0 ? v12 & 0xff : v12;

            if (r11 === r10 && r11 === r21 && r11 === r01 && r11 === r12) {
                out[i + j * w] = -1;
            } else {
                out[i + j * w] = river;
            }
        }
    }
    return 0;
}

function mapSmooth(l, out, x, z, w, h) {
    const pX = x - 1;
    const pZ = z - 1;
    const pW = w + 2;
    const pH = h + 2;



    const parentBuf = new Int32Array(pW * pH);
    const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
    if (err !== 0) return err;

    const ss = l.startSeed;

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const v11 = parentBuf[(i + 1) + (j + 1) * pW];
            const v10 = parentBuf[(i + 1) + (j + 0) * pW];
            const v21 = parentBuf[(i + 2) + (j + 1) * pW];
            const v01 = parentBuf[(i + 0) + (j + 1) * pW];
            const v12 = parentBuf[(i + 1) + (j + 2) * pW];

            if (v01 === v21 && v10 === v12) {
                const cs = getChunkSeed(ss, i + x, j + z);
                if (mcFirstIsZero(cs, 2)) {
                    out[i + j * w] = v01;
                } else {
                    out[i + j * w] = v10;
                }
            } else if (v01 === v21) {
                out[i + j * w] = v01;
            } else if (v10 === v12) {
                out[i + j * w] = v10;
            } else {
                out[i + j * w] = v11;
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

    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const idx = i + j * w;
            const biome = out[idx];
            const r = riv[idx];

            if (isOceanic(biome)) {
                out[idx] = biome;
            } else if (r === river) {
                if (biome === snowy_tundra) {
                    out[idx] = frozen_river;
                } else if (biome === mushroom_fields || biome === mushroom_field_shore) {
                    out[idx] = mushroom_field_shore;
                } else {
                    out[idx] = r;
                }
            } else {
                out[idx] = biome;
            }
        }
    }
    return 0;
}

// ============================================================================
// Layer Stack Setup
// ============================================================================

/**
 * Create a layer stack for a specific Minecraft version
 */
export function setupLayerStack(mc, largeBiomes = false) {
    const layers = {};

    // Base continent layer
    layers.continent = new Layer(mapContinent, 4096, 1);
    layers.continent.mc = mc;

    // Zoom layers
    layers.zoomFuzzy = new Layer(mapZoom, 2048, 2000, layers.continent);
    layers.land2048 = new Layer(mapLand, 2048, 1, layers.zoomFuzzy);
    layers.zoom1024 = new Layer(mapZoomSmart, 1024, 2001, layers.land2048);
    layers.land1024a = new Layer(mapLand, 1024, 2, layers.zoom1024);

    if (mc >= 7) { // 1.7+
        layers.land1024b = new Layer(mapLand, 1024, 50, layers.land1024a);
        layers.land1024c = new Layer(mapLand, 1024, 70, layers.land1024b);
        // Remove too much ocean
        layers.island1024 = new Layer((l, o, x, z, w, h) => {
            const pX = x - 1;
            const pZ = z - 1;
            const pW = w + 2;
            const pH = h + 2;
            const parentBuf = new Int32Array(pW * pH);
            const err = l.p.getMap(l.p, parentBuf, pX, pZ, pW, pH);
            if (err !== 0) return err;
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    let v = parentBuf[(i + 1) + (j + 1) * pW];
                    if (v === 0) {
                        const n = parentBuf[(i + 1) + (j + 0) * pW];
                        const e = parentBuf[(i + 2) + (j + 1) * pW];
                        const ww = parentBuf[(i + 0) + (j + 1) * pW];
                        const s = parentBuf[(i + 1) + (j + 2) * pW];
                        if (n === 0 && e === 0 && ww === 0 && s === 0) {
                            const cs = getChunkSeed(l.startSeed, i + x, j + z);
                            if (mcFirstIsZero(cs, 2)) v = 1;
                        }
                    }
                    o[i + j * w] = v;
                }
            }
            return 0;
        }, 1024, 2, layers.land1024c);
        layers.snow1024 = new Layer(mapSnow, 1024, 2, layers.island1024);
    } else {
        layers.snow1024 = new Layer(mapSnow, 1024, 2, layers.land1024a);
    }

    if (mc >= 7) {
        layers.land1024d = new Layer(mapLand, 1024, 3, layers.snow1024);
        layers.cool1024 = new Layer(mapCool, 1024, 0, layers.land1024d);
        layers.heat1024 = new Layer(mapHeat, 1024, 0, layers.cool1024);
        layers.special1024 = new Layer(mapSpecial, 1024, 3, layers.heat1024);
        layers.parent512 = layers.special1024;
    } else {
        layers.parent512 = layers.snow1024;
    }

    layers.zoom512 = new Layer(mapZoomSmart, 512, 2002, layers.parent512);

    if (mc <= 6) {
        layers.land512 = new Layer(mapLand, 512, 4, layers.zoom512);
        layers.parentZoom256 = layers.land512;
    } else {
        layers.parentZoom256 = layers.zoom512;
    }

    layers.zoom256 = new Layer(mapZoomSmart, 256, 2003, layers.parentZoom256);
    layers.land256 = new Layer(mapLand, 256, 4, layers.zoom256);
    layers.mushroom256 = new Layer(mapMushroom, 256, 5, layers.land256);

    if (mc >= 7) {
        layers.deepOcean256 = new Layer(mapDeepOcean, 256, 0, layers.mushroom256);
        layers.biome256 = new Layer(mapBiome, 256, 200, layers.deepOcean256);
    } else {
        layers.biome256 = new Layer(mapBiome, 256, 200, layers.mushroom256);
    }

    // Apply mc version
    for (const key in layers) {
        layers[key].mc = mc;
    }

    // More zoom layers
    layers.zoom128 = new Layer(mapZoomSmart, 128, 1000, layers.biome256);
    layers.zoom64 = new Layer(mapZoomSmart, 64, 1001, layers.zoom128);

    // River noise branch
    layers.noise256 = new Layer((l, o, x, z, w, h) => {
        const err = l.p.getMap(l.p, o, x, z, w, h);
        if (err !== 0) return err;
        for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
                if (o[i + j * w] > 0) {
                    const cs = getChunkSeed(l.startSeed, i + x, j + z);
                    o[i + j * w] = mcFirstInt(cs, 299999) + 2;
                } else {
                    o[i + j * w] = 0;
                }
            }
        }
        return 0;
    }, 256, 100, layers.mushroom256);

    layers.zoomRiver128 = new Layer(mapZoomSmart, 128, 1000, layers.noise256);
    layers.zoomRiver64 = new Layer(mapZoomSmart, 64, 1001, layers.zoomRiver128);
    layers.zoomRiver32 = new Layer(mapZoomSmart, 32, 1002, layers.zoomRiver64);
    layers.zoomRiver16 = new Layer(mapZoomSmart, 16, 1003, layers.zoomRiver32);
    layers.zoomRiver8 = new Layer(mapZoomSmart, 8, 1004, layers.zoomRiver16);
    layers.zoomRiver4 = new Layer(mapZoomSmart, 4, 1005, layers.zoomRiver8);
    layers.river4 = new Layer(mapRiver, 4, 1, layers.zoomRiver4);
    layers.smoothRiver4 = new Layer(mapSmooth, 4, 1000, layers.river4);

    // Continue biome branch
    layers.zoom32 = new Layer(mapZoomSmart, 32, 1002, layers.zoom64);
    layers.land32 = new Layer(mapLand, 32, 6, layers.zoom32);
    layers.zoom16 = new Layer(mapZoomSmart, 16, 1003, layers.land32);
    layers.zoom8 = new Layer(mapZoomSmart, 8, 1004, layers.zoom16);
    layers.zoom4 = new Layer(mapZoomSmart, 4, 1005, layers.zoom8);
    layers.smooth4 = new Layer(mapSmooth, 4, 1000, layers.zoom4);

    // River mix
    layers.riverMix4 = new Layer(mapRiverMix, 4, 100, layers.smooth4, layers.smoothRiver4);

    // Set MC version on all
    for (const key in layers) {
        layers[key].mc = mc;
    }

    return layers;
}

/**
 * Legacy biome generator for pre-1.18
 */
export class LegacyBiomeGenerator {
    constructor(seed, version = 13) {
        this.seed = BigInt(seed);
        this.version = version;
        this.layers = setupLayerStack(version);

        // Set world seed on all layers
        this.layers.riverMix4.setWorldSeed(this.seed);
    }

    getBiome(x, z) {
        // Convert block coords to 1:4 scale
        const bx = Math.floor(x / 4);
        const bz = Math.floor(z / 4);

        const out = new Int32Array(1);
        this.layers.riverMix4.getMap(this.layers.riverMix4, out, bx, bz, 1, 1);

        return out[0];
    }

    getArea(x, z, w, h, scale = 4) {
        const sx = Math.floor(x / scale);
        const sz = Math.floor(z / scale);
        const sw = Math.ceil(w / scale);
        const sh = Math.ceil(h / scale);

        const out = new Int32Array(sw * sh * 4); // Extra buffer for internal use
        this.layers.riverMix4.getMap(this.layers.riverMix4, out, sx, sz, sw, sh);

        return { data: out.slice(0, sw * sh), width: sw, height: sh, startX: sx, startZ: sz, scale: scale };
    }
}

export {
    Layer,
    mapContinent,
    mapZoom,
    mapZoomSmart,
    mapLand,
    mapSnow,
    mapBiome,
    mapRiver,
    mapRiverMix,
    ocean, plains, desert, mountains, forest, taiga, swamp, river,
    frozen_ocean, frozen_river, snowy_tundra, mushroom_fields, beach,
    jungle, deep_ocean, savanna, badlands, warm_ocean, cold_ocean
};
