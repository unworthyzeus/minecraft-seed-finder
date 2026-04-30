import { BiomeID } from './core.js';
import { parseMinecraftVersion } from '../version-utils.js';
import { bedrockProfileAtLeast, getBedrockVersionProfile } from './bedrock-profiles.js';

const MASK48 = (1n << 48n) - 1n;
const MULT = 0x5deece66dn;
const ADD = 0xbn;
const STRUCTURE_X = 341873128712n;
const STRUCTURE_Z = 132897987541n;

export const MC = {
    UNDEF: 0,
    B1_7: 1,
    B1_8: 2,
    V1_0: 3,
    V1_1: 4,
    V1_2: 5,
    V1_3: 6,
    V1_4: 7,
    V1_5: 8,
    V1_6: 9,
    V1_7: 10,
    V1_8: 11,
    V1_9: 12,
    V1_10: 13,
    V1_11: 14,
    V1_12: 15,
    V1_13: 16,
    V1_14: 17,
    V1_15: 18,
    V1_16_1: 19,
    V1_16: 20,
    V1_17: 21,
    V1_18: 22,
    V1_19_2: 23,
    V1_19: 24,
    V1_20: 25,
    V1_21_1: 26,
    V1_21_3: 27,
    V1_21: 28,
};

export const STRUCTURE_TYPES = {
    Feature: 0,
    Desert_Pyramid: 1,
    Jungle_Temple: 2,
    Swamp_Hut: 3,
    Igloo: 4,
    Village: 5,
    Ocean_Ruin: 6,
    Shipwreck: 7,
    Monument: 8,
    Mansion: 9,
    Outpost: 10,
    Ruined_Portal: 11,
    Ruined_Portal_N: 12,
    Ancient_City: 13,
    Treasure: 14,
    Mineshaft: 15,
    Desert_Well: 16,
    Geode: 17,
    Fortress: 18,
    Bastion: 19,
    End_City: 20,
    End_Gateway: 21,
    End_Island: 22,
    Trail_Ruins: 23,
    Trial_Chambers: 24,
};

export const STRUCTURE_INFO = {
    village: { type: STRUCTURE_TYPES.Village, name: 'Village', color: '#f59e0b', size: 20, icon: 'Village' },
    desert_pyramid: { type: STRUCTURE_TYPES.Desert_Pyramid, name: 'Desert Pyramid', color: '#eab308', size: 18, icon: 'Pyramid' },
    jungle_temple: { type: STRUCTURE_TYPES.Jungle_Temple, name: 'Jungle Temple', color: '#166534', size: 18, icon: 'Temple' },
    witch_hut: { type: STRUCTURE_TYPES.Swamp_Hut, name: 'Witch Hut', color: '#4a5568', size: 18, icon: 'Hut' },
    igloo: { type: STRUCTURE_TYPES.Igloo, name: 'Igloo', color: '#3b82f6', size: 16, icon: 'Igloo' },
    monument: { type: STRUCTURE_TYPES.Monument, name: 'Ocean Monument', color: '#06b6d4', size: 20, icon: 'Monument' },
    mansion: { type: STRUCTURE_TYPES.Mansion, name: 'Mansion', color: '#c27e2e', size: 24, icon: 'Mansion' },
    outpost: { type: STRUCTURE_TYPES.Outpost, name: 'Pillager Outpost', color: '#9f1239', size: 20, icon: 'Outpost' },
    shipwreck: { type: STRUCTURE_TYPES.Shipwreck, name: 'Shipwreck', color: '#22c55e', size: 16, icon: 'Shipwreck' },
    ocean_ruin: { type: STRUCTURE_TYPES.Ocean_Ruin, name: 'Ocean Ruin', color: '#38bdf8', size: 16, icon: 'Ruin' },
    buried_treasure: { type: STRUCTURE_TYPES.Treasure, name: 'Buried Treasure', color: '#facc15', size: 14, icon: 'Treasure' },
    ruined_portal: { type: STRUCTURE_TYPES.Ruined_Portal, name: 'Ruined Portal', color: '#a855f7', size: 16, icon: 'Portal' },
    ancient_city: { type: STRUCTURE_TYPES.Ancient_City, name: 'Ancient City', color: '#0f172a', size: 22, icon: 'City' },
    trail_ruins: { type: STRUCTURE_TYPES.Trail_Ruins, name: 'Trail Ruins', color: '#a16207', size: 16, icon: 'Trail' },
    trial_chambers: { type: STRUCTURE_TYPES.Trial_Chambers, name: 'Trial Chambers', color: '#64748b', size: 18, icon: 'Trial' },
};

const TYPE_BY_ID = new Map(Object.entries(STRUCTURE_TYPES).map(([name, id]) => [id, name]));
const UI_BY_TYPE = new Map(Object.entries(STRUCTURE_INFO).map(([key, info]) => [info.type, { key, ...info }]));

export function parseWorldSeed(seedInput) {
    if (typeof seedInput === 'bigint') return seedInput;
    if (typeof seedInput === 'number') return BigInt(Math.trunc(seedInput));
    const raw = String(seedInput);
    if (/^-?\d+$/.test(raw)) return BigInt(raw);

    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = Math.imul(31, hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    return BigInt(hash);
}

export function toCubiomesMcVersion(version) {
    const parsed = parseMinecraftVersion(version);
    if (!parsed) return MC.V1_21;
    if (parsed.type === 'alpha') return MC.B1_7;
    if (parsed.type === 'beta') return parsed.minor >= 8 ? MC.B1_8 : MC.B1_7;
    if (parsed.type === 'calendar') return MC.V1_21;

    switch (parsed.minor) {
        case 0: return MC.V1_0;
        case 1: return MC.V1_1;
        case 2: return MC.V1_2;
        case 3: return MC.V1_3;
        case 4: return MC.V1_4;
        case 5: return MC.V1_5;
        case 6: return MC.V1_6;
        case 7: return MC.V1_7;
        case 8: return MC.V1_8;
        case 9: return MC.V1_9;
        case 10: return MC.V1_10;
        case 11: return MC.V1_11;
        case 12: return MC.V1_12;
        case 13: return MC.V1_13;
        case 14: return MC.V1_14;
        case 15: return MC.V1_15;
        case 16: return parsed.patch === 1 ? MC.V1_16_1 : MC.V1_16;
        case 17: return MC.V1_17;
        case 18: return MC.V1_18;
        case 19: return parsed.patch != null && parsed.patch <= 2 ? MC.V1_19_2 : MC.V1_19;
        case 20: return MC.V1_20;
        case 21:
        default:
            if (parsed.patch != null && parsed.patch <= 1) return MC.V1_21_1;
            if (parsed.patch != null && parsed.patch <= 3) return MC.V1_21_3;
            return MC.V1_21;
    }
}

function setSeed(value) {
    return (BigInt(value) ^ MULT) & MASK48;
}

function next(seed, bits) {
    const nextSeed = (seed * MULT + ADD) & MASK48;
    return [nextSeed, Number(nextSeed >> BigInt(48 - bits))];
}

function nextInt(seed, n) {
    let bits;
    let val;
    const m = n - 1;
    if ((m & n) === 0) {
        let out;
        [seed, out] = next(seed, 31);
        return [seed, Number((BigInt(n) * BigInt(out)) >> 31n)];
    }
    do {
        [seed, bits] = next(seed, 31);
        val = bits % n;
    } while ((((bits - val + m) >>> 0) & 0x80000000) !== 0);
    return [seed, val];
}

function nextFloat(seed) {
    let out;
    [seed, out] = next(seed, 24);
    return [seed, out / 16777216.0];
}

function nextDouble(seed) {
    let a, b;
    [seed, a] = next(seed, 26);
    [seed, b] = next(seed, 27);
    return [seed, Number((BigInt(a) << 27n) + BigInt(b)) / Number(1n << 53n)];
}

function structureSeed(worldSeed, regX, regZ, salt) {
    return BigInt(worldSeed) + BigInt(regX) * STRUCTURE_X + BigInt(regZ) * STRUCTURE_Z + BigInt(salt);
}

function getFeatureChunkInRegion(config, worldSeed, regX, regZ) {
    let seed = setSeed(structureSeed(worldSeed, regX, regZ, config.salt));
    seed = (seed * MULT + ADD) & MASK48;

    const r = BigInt(config.chunkRange);
    let x;
    if ((config.chunkRange & (config.chunkRange - 1)) !== 0) {
        x = Number((seed >> 17n) % r);
        seed = (seed * MULT + ADD) & MASK48;
        return { x, z: Number((seed >> 17n) % r) };
    }

    x = Number((r * (seed >> 17n)) >> 31n);
    seed = (seed * MULT + ADD) & MASK48;
    return { x, z: Number((r * (seed >> 17n)) >> 31n) };
}

function getLargeStructureChunkInRegion(config, worldSeed, regX, regZ) {
    let seed = setSeed(structureSeed(worldSeed, regX, regZ, config.salt));
    const r = BigInt(config.chunkRange);
    const nextMod = () => {
        seed = (seed * MULT + ADD) & MASK48;
        return Number((seed >> 17n) % r);
    };
    return {
        x: (nextMod() + nextMod()) >> 1,
        z: (nextMod() + nextMod()) >> 1,
    };
}

function blockFromRegion(reg, regionSize, chunk) {
    return Number((BigInt(reg) * BigInt(regionSize) + BigInt(chunk)) << 4n);
}

function getFeaturePos(config, seed, regX, regZ) {
    const pos = getFeatureChunkInRegion(config, seed, regX, regZ);
    return {
        x: blockFromRegion(regX, config.regionSize, pos.x),
        z: blockFromRegion(regZ, config.regionSize, pos.z),
    };
}

function getLargeStructurePos(config, seed, regX, regZ) {
    const pos = getLargeStructureChunkInRegion(config, seed, regX, regZ);
    return {
        x: blockFromRegion(regX, config.regionSize, pos.x),
        z: blockFromRegion(regZ, config.regionSize, pos.z),
    };
}

function setAttemptSeed(worldSeed, chunkX, chunkZ) {
    let seed = BigInt(worldSeed) ^ BigInt(chunkX >> 4) ^ (BigInt(chunkZ >> 4) << 4n);
    seed = setSeed(seed);
    return next(seed, 31)[0];
}

function getConfigTuple(salt, regionSize, chunkRange, type, dim = 0, rarity = 0) {
    return { salt, regionSize, chunkRange, type, dim, rarity };
}

const BEDROCK_PLACEMENT_SOURCE = 'cubiomes-bedrock';
const BEDROCK_FALLBACK_SOURCE = 'java-parity-fallback';

function bedrockConfig({ salt, regionSize, chunkRange, type, mode, min = 'MC_UNDEF' }) {
    return {
        salt,
        regionSize,
        chunkRange,
        spacing: regionSize,
        spawnRange: chunkRange,
        type,
        mode,
        min,
        source: BEDROCK_PLACEMENT_SOURCE,
    };
}

const BEDROCK_STRUCTURE_CONFIGS = new Map([
    [STRUCTURE_TYPES.Desert_Pyramid, bedrockConfig({ salt: 14357617, regionSize: 32, chunkRange: 24, type: STRUCTURE_TYPES.Desert_Pyramid, mode: 'feature' })],
    [STRUCTURE_TYPES.Jungle_Temple, bedrockConfig({ salt: 14357617, regionSize: 32, chunkRange: 24, type: STRUCTURE_TYPES.Jungle_Temple, mode: 'feature' })],
    [STRUCTURE_TYPES.Swamp_Hut, bedrockConfig({ salt: 14357617, regionSize: 32, chunkRange: 24, type: STRUCTURE_TYPES.Swamp_Hut, mode: 'feature' })],
    [STRUCTURE_TYPES.Igloo, bedrockConfig({ salt: 14357617, regionSize: 32, chunkRange: 24, type: STRUCTURE_TYPES.Igloo, mode: 'feature', min: 'MC_1_0' })],
    [STRUCTURE_TYPES.Monument, bedrockConfig({ salt: 10387313, regionSize: 32, chunkRange: 27, type: STRUCTURE_TYPES.Monument, mode: 'large' })],
    [STRUCTURE_TYPES.Mansion, bedrockConfig({ salt: 10387319, regionSize: 80, chunkRange: 60, type: STRUCTURE_TYPES.Mansion, mode: 'large', min: 'MC_1_1' })],
    [STRUCTURE_TYPES.Outpost, bedrockConfig({ salt: 165745296, regionSize: 80, chunkRange: 56, type: STRUCTURE_TYPES.Outpost, mode: 'large', min: 'MC_1_11' })],
    [STRUCTURE_TYPES.Ruined_Portal, bedrockConfig({ salt: 40552231, regionSize: 40, chunkRange: 25, type: STRUCTURE_TYPES.Ruined_Portal, mode: 'feature', min: 'MC_1_16' })],
    [STRUCTURE_TYPES.Ancient_City, bedrockConfig({ salt: 20083232, regionSize: 24, chunkRange: 16, type: STRUCTURE_TYPES.Ancient_City, mode: 'large', min: 'MC_1_19' })],
    [STRUCTURE_TYPES.Trail_Ruins, bedrockConfig({ salt: 83469867, regionSize: 34, chunkRange: 26, type: STRUCTURE_TYPES.Trail_Ruins, mode: 'feature', min: 'MC_1_20' })],
    [STRUCTURE_TYPES.Trial_Chambers, bedrockConfig({ salt: 94251327, regionSize: 34, chunkRange: 22, type: STRUCTURE_TYPES.Trial_Chambers, mode: 'feature', min: 'MC_1_21' })],
    [STRUCTURE_TYPES.Treasure, bedrockConfig({ salt: 16842397, regionSize: 4, chunkRange: 2, type: STRUCTURE_TYPES.Treasure, mode: 'large' })],
]);

export function getStructureConfig(type, mc) {
    switch (type) {
        case STRUCTURE_TYPES.Feature:
            return mc <= MC.V1_12 ? getConfigTuple(14357617, 32, 24, type) : null;
        case STRUCTURE_TYPES.Desert_Pyramid:
            return mc >= MC.V1_3 ? getConfigTuple(14357617, 32, 24, type) : null;
        case STRUCTURE_TYPES.Jungle_Temple:
            return mc >= MC.V1_3
                ? getConfigTuple(mc <= MC.V1_12 ? 14357617 : 14357619, 32, 24, type)
                : null;
        case STRUCTURE_TYPES.Swamp_Hut:
            return mc >= MC.V1_4
                ? getConfigTuple(mc <= MC.V1_12 ? 14357617 : 14357620, 32, 24, type)
                : null;
        case STRUCTURE_TYPES.Igloo:
            return mc >= MC.V1_9
                ? getConfigTuple(mc <= MC.V1_12 ? 14357617 : 14357618, 32, 24, type)
                : null;
        case STRUCTURE_TYPES.Village:
            return mc >= MC.B1_8
                ? getConfigTuple(10387312, mc <= MC.V1_17 ? 32 : 34, mc <= MC.V1_17 ? 24 : 26, type)
                : null;
        case STRUCTURE_TYPES.Ocean_Ruin:
            return mc >= MC.V1_13
                ? getConfigTuple(14357621, mc <= MC.V1_15 ? 16 : 20, mc <= MC.V1_15 ? 8 : 12, type)
                : null;
        case STRUCTURE_TYPES.Shipwreck:
            return mc >= MC.V1_13
                ? getConfigTuple(165745295, mc <= MC.V1_15 ? 16 : 24, mc <= MC.V1_15 ? 8 : 20, type)
                : null;
        case STRUCTURE_TYPES.Ruined_Portal:
            return mc >= MC.V1_16_1 ? getConfigTuple(34222645, 40, 25, type) : null;
        case STRUCTURE_TYPES.Ancient_City:
            return mc >= MC.V1_19_2 ? getConfigTuple(20083232, 24, 16, type) : null;
        case STRUCTURE_TYPES.Trail_Ruins:
            return mc >= MC.V1_20 ? getConfigTuple(83469867, 34, 26, type) : null;
        case STRUCTURE_TYPES.Trial_Chambers:
            return mc >= MC.V1_21_1 ? getConfigTuple(94251327, 34, 22, type) : null;
        case STRUCTURE_TYPES.Monument:
            return mc >= MC.V1_8 ? getConfigTuple(10387313, 32, 27, type) : null;
        case STRUCTURE_TYPES.Mansion:
            return mc >= MC.V1_11 ? getConfigTuple(10387319, 80, 60, type) : null;
        case STRUCTURE_TYPES.Outpost:
            return mc >= MC.V1_14 ? getConfigTuple(165745296, 32, 24, type) : null;
        case STRUCTURE_TYPES.Treasure:
            return mc >= MC.V1_13 ? getConfigTuple(10387320, 1, 1, type, 0, 0.01) : null;
        default:
            return null;
    }
}

export function getBedrockStructureConfig(type, version = '26.13') {
    const profile = getBedrockVersionProfile(version);

    if (type === STRUCTURE_TYPES.Village) {
        if (bedrockProfileAtLeast(profile, 'MC_1_18')) {
            return bedrockConfig({ salt: 10387312, regionSize: 34, chunkRange: 26, type, mode: 'large', min: 'MC_UNDEF' });
        }
        if (bedrockProfileAtLeast(profile, 'MC_1_17_30')) {
            return bedrockConfig({ salt: 10387312, regionSize: 27, chunkRange: 17, type, mode: 'large', min: 'MC_UNDEF' });
        }
        if (bedrockProfileAtLeast(profile, 'MC_1_11')) {
            return bedrockConfig({ salt: 10387312, regionSize: 27, chunkRange: 17, type, mode: 'large', min: 'MC_UNDEF' });
        }
        return bedrockConfig({ salt: 10387312, regionSize: 1, chunkRange: 1, type, mode: 'legacy-village', min: 'MC_UNDEF' });
    }

    if (type === STRUCTURE_TYPES.Shipwreck) {
        return bedrockProfileAtLeast(profile, 'MC_1_18')
            ? bedrockConfig({ salt: 165745295, regionSize: 24, chunkRange: 20, type, mode: 'feature', min: 'MC_1_4' })
            : bedrockConfig({ salt: 165745295, regionSize: 10, chunkRange: 5, type, mode: 'large', min: 'MC_1_4' });
    }

    if (type === STRUCTURE_TYPES.Ocean_Ruin) {
        return bedrockProfileAtLeast(profile, 'MC_1_18')
            ? bedrockConfig({ salt: 14357621, regionSize: 20, chunkRange: 12, type, mode: 'feature', min: 'MC_1_4' })
            : bedrockConfig({ salt: 14357621, regionSize: 12, chunkRange: 5, type, mode: 'large', min: 'MC_1_4' });
    }

    const config = BEDROCK_STRUCTURE_CONFIGS.get(type) || null;
    if (!config) return null;
    return bedrockProfileAtLeast(profile, config.min) ? config : null;
}

function uint32(value) {
    return Number(BigInt.asUintN(32, BigInt(value)));
}

function mtInit(value, offset) {
    return (Math.imul(0x6c078965, (value ^ (value >>> 30)) >>> 0) + offset) >>> 0;
}

function bedrockMtN(seed, n) {
    const head = new Array(n + 1);
    const last = new Array(n + 1);
    const result = new Array(n);

    head[0] = uint32(seed);
    for (let i = 1; i < n + 1; i++) {
        head[i] = mtInit(head[i - 1], i);
    }

    let temp = head[n];
    for (let i = n; i < 397; i++) {
        temp = mtInit(temp, i + 1);
    }

    last[0] = temp;
    for (let i = 1; i < n + 1; i++) {
        last[i] = mtInit(last[i - 1], i + 397);
    }

    for (let i = 0; i < n; i++) {
        temp = (((head[i] & 0x80000000) >>> 0) + (head[i + 1] & 0x7fffffff)) >>> 0;
        head[i] = ((temp >>> 1) ^ last[i]) >>> 0;
        if (temp % 2 !== 0) head[i] = (head[i] ^ 0x9908b0df) >>> 0;
    }

    for (let i = 0; i < n; i++) {
        let y = head[i] >>> 0;
        y = (y ^ (y >>> 11)) >>> 0;
        y = (y ^ ((y << 7) & 0x9d2c5680)) >>> 0;
        y = (y ^ ((y << 15) & 0xefc60000)) >>> 0;
        y = (y ^ (y >>> 18)) >>> 0;
        result[i] = y >>> 0;
    }

    return result;
}

function bedrockCandidateAreaSeed(areaX, areaZ, salt) {
    return (salt - Math.imul(245998635, areaZ) - Math.imul(1724254968, areaX)) >>> 0;
}

function getCongruentAtOrAfter(begin, modulo, remainder) {
    let base = begin - (begin % modulo);
    if (begin > 0) base += modulo;
    const candidate = base + remainder;
    return candidate >= begin && candidate <= begin + modulo ? candidate : candidate - modulo;
}

function getBedrockChunkInArea(config, seedInput, areaX, areaZ) {
    const seed = uint32(parseWorldSeed(seedInput));
    const areaSeed = (bedrockCandidateAreaSeed(areaX, areaZ, config.salt) + seed) >>> 0;
    const mt = bedrockMtN(areaSeed, config.num);

    const r1 = mt[0] % config.spawnRange;
    const r2 = mt[1] % config.spawnRange;
    let chunkOffsetX;
    let chunkOffsetZ;

    if (config.num === 2) {
        chunkOffsetX = r1;
        chunkOffsetZ = r2;
    } else {
        const r3 = mt[2] % config.spawnRange;
        const r4 = mt[3] % config.spawnRange;
        chunkOffsetX = Math.trunc((r1 + r2) / 2);
        chunkOffsetZ = Math.trunc((r3 + r4) / 2);
    }

    const minChunkX = areaX * config.spacing;
    const minChunkZ = areaZ * config.spacing;
    return {
        x: getCongruentAtOrAfter(minChunkX, config.spacing, chunkOffsetX),
        z: getCongruentAtOrAfter(minChunkZ, config.spacing, chunkOffsetZ),
    };
}

function blockFromBedrockRegion(reg, regionSize, chunk) {
    return Number(((BigInt(reg) * BigInt(regionSize) + BigInt(chunk)) << 4n) + 8n);
}

function getBedrockFeaturePos(config, seed, regX, regZ) {
    const pos = getFeatureChunkInRegion(config, seed, regX, regZ);
    return {
        x: blockFromBedrockRegion(regX, config.regionSize, pos.x),
        z: blockFromBedrockRegion(regZ, config.regionSize, pos.z),
    };
}

function getBedrockLargePos(config, seed, regX, regZ) {
    const pos = getLargeStructureChunkInRegion(config, seed, regX, regZ);
    return {
        x: blockFromBedrockRegion(regX, config.regionSize, pos.x),
        z: blockFromBedrockRegion(regZ, config.regionSize, pos.z),
    };
}

export function getBedrockStructurePos(type, seedInput, areaX, areaZ, version = '26.13') {
    const config = getBedrockStructureConfig(type, version);
    if (!config) return null;
    const seed = parseWorldSeed(seedInput);

    if (config.mode === 'feature') return getBedrockFeaturePos(config, seed, areaX, areaZ);
    if (config.mode === 'large') return getBedrockLargePos(config, seed, areaX, areaZ);
    if (config.mode === 'legacy-village') return null;

    const chunk = getBedrockChunkInArea(config, seedInput, areaX, areaZ);
    return { x: chunk.x * 16, z: chunk.z * 16 };
}

export function getStructureTypeName(type) {
    return TYPE_BY_ID.get(type) || `Structure ${type}`;
}

export function getStructurePos(type, versionOrMc, seedInput, regX, regZ) {
    const mc = typeof versionOrMc === 'number' ? versionOrMc : toCubiomesMcVersion(versionOrMc);
    const config = getStructureConfig(type, mc);
    if (!config) return null;

    const seed = parseWorldSeed(seedInput);
    switch (type) {
        case STRUCTURE_TYPES.Desert_Pyramid:
        case STRUCTURE_TYPES.Jungle_Temple:
        case STRUCTURE_TYPES.Swamp_Hut:
        case STRUCTURE_TYPES.Igloo:
        case STRUCTURE_TYPES.Village:
        case STRUCTURE_TYPES.Ocean_Ruin:
        case STRUCTURE_TYPES.Shipwreck:
        case STRUCTURE_TYPES.Ruined_Portal:
        case STRUCTURE_TYPES.Ancient_City:
        case STRUCTURE_TYPES.Trail_Ruins:
        case STRUCTURE_TYPES.Trial_Chambers:
            return getFeaturePos(config, seed, regX, regZ);

        case STRUCTURE_TYPES.Monument:
        case STRUCTURE_TYPES.Mansion:
            return getLargeStructurePos(config, seed, regX, regZ);

        case STRUCTURE_TYPES.Outpost: {
            const pos = getFeaturePos(config, seed, regX, regZ);
            let rng = setAttemptSeed(seed, pos.x >> 4, pos.z >> 4);
            const out = nextInt(rng, 5)[1];
            return out === 0 ? pos : null;
        }

        case STRUCTURE_TYPES.Treasure: {
            let rng = setSeed(structureSeed(seed, regX, regZ, config.salt));
            const chance = nextFloat(rng)[1];
            return chance < 0.01 ? { x: regX * 16 + 9, z: regZ * 16 + 9 } : null;
        }

        default:
            return null;
    }
}

function isOceanic(id) {
    return id === BiomeID.ocean || id === BiomeID.deep_ocean || id === BiomeID.frozen_ocean ||
        id === BiomeID.warm_ocean || id === BiomeID.lukewarm_ocean || id === BiomeID.cold_ocean ||
        id === BiomeID.deep_warm_ocean || id === BiomeID.deep_lukewarm_ocean ||
        id === BiomeID.deep_cold_ocean || id === BiomeID.deep_frozen_ocean;
}

function isDeepOcean(id) {
    return id === BiomeID.deep_ocean || id === BiomeID.deep_frozen_ocean ||
        id === BiomeID.deep_warm_ocean || id === BiomeID.deep_lukewarm_ocean ||
        id === BiomeID.deep_cold_ocean;
}

export function isViableFeatureBiome(type, mc, biomeID) {
    switch (type) {
        case STRUCTURE_TYPES.Desert_Pyramid:
            return biomeID === BiomeID.desert || biomeID === BiomeID.desert_hills;
        case STRUCTURE_TYPES.Jungle_Temple:
            return biomeID === BiomeID.jungle || biomeID === BiomeID.jungle_hills ||
                biomeID === BiomeID.bamboo_jungle || biomeID === BiomeID.bamboo_jungle_hills;
        case STRUCTURE_TYPES.Swamp_Hut:
            return biomeID === BiomeID.swamp;
        case STRUCTURE_TYPES.Igloo:
            return mc > MC.V1_8 && (
                biomeID === BiomeID.snowy_tundra ||
                biomeID === BiomeID.snowy_taiga ||
                biomeID === BiomeID.snowy_slopes
            );
        case STRUCTURE_TYPES.Ocean_Ruin:
            return mc > MC.V1_12 && isOceanic(biomeID);
        case STRUCTURE_TYPES.Shipwreck:
            return mc > MC.V1_12 && (isOceanic(biomeID) || biomeID === BiomeID.beach || biomeID === BiomeID.snowy_beach);
        case STRUCTURE_TYPES.Ruined_Portal:
            return mc >= MC.V1_16_1;
        case STRUCTURE_TYPES.Ancient_City:
            return mc > MC.V1_18 && biomeID === BiomeID.deep_dark;
        case STRUCTURE_TYPES.Trail_Ruins:
            return mc > MC.V1_19 && (
                biomeID === BiomeID.taiga ||
                biomeID === BiomeID.snowy_taiga ||
                biomeID === BiomeID.giant_tree_taiga ||
                biomeID === BiomeID.giant_spruce_taiga ||
                biomeID === BiomeID.tall_birch_forest ||
                biomeID === BiomeID.jungle
            );
        case STRUCTURE_TYPES.Trial_Chambers:
            return mc > MC.V1_20 && biomeID !== BiomeID.deep_dark && biomeID >= 0;
        case STRUCTURE_TYPES.Treasure:
            return mc > MC.V1_12 && (biomeID === BiomeID.beach || biomeID === BiomeID.snowy_beach);
        case STRUCTURE_TYPES.Monument:
            return mc > MC.V1_7 && isDeepOcean(biomeID);
        case STRUCTURE_TYPES.Outpost:
            if (mc <= MC.V1_13) return false;
            if (mc >= MC.V1_18) {
                return [
                    BiomeID.desert,
                    BiomeID.plains,
                    BiomeID.savanna,
                    BiomeID.snowy_tundra,
                    BiomeID.taiga,
                    BiomeID.meadow,
                    BiomeID.frozen_peaks,
                    BiomeID.jagged_peaks,
                    BiomeID.stony_peaks,
                    BiomeID.snowy_slopes,
                    BiomeID.grove,
                    BiomeID.cherry_grove,
                ].includes(biomeID);
            }
            return isViableFeatureBiome(STRUCTURE_TYPES.Village, mc, biomeID);
        case STRUCTURE_TYPES.Village:
            return biomeID === BiomeID.plains ||
                biomeID === BiomeID.desert ||
                biomeID === BiomeID.savanna ||
                (mc >= MC.V1_10 && biomeID === BiomeID.taiga) ||
                (mc >= MC.V1_14 && biomeID === BiomeID.snowy_tundra) ||
                (mc >= MC.V1_18 && biomeID === BiomeID.meadow);
        case STRUCTURE_TYPES.Mansion:
            return mc > MC.V1_10 && (biomeID === BiomeID.dark_forest || biomeID === BiomeID.dark_forest_hills);
        default:
            return true;
    }
}

export function checkStructureBiome(type, mc, generator, x, z) {
    if (!generator || typeof generator.getBiome !== 'function') return { viable: false, biome: null };
    const sampleY = type === STRUCTURE_TYPES.Ancient_City ? -40 :
        type === STRUCTURE_TYPES.Trial_Chambers ? -20 :
            64;
    const sampleBiome = (sx, sz) => {
        if (typeof generator.getBiomeAtY === 'function') {
            return generator.getBiomeAtY(sx, sampleY, sz);
        }
        return generator.getBiome(sx, sz);
    };
    const samples = [
        [x + 8, z + 8],
        [x + 32, z + 8],
        [x - 32, z + 8],
        [x + 8, z + 32],
        [x + 8, z - 32],
    ];

    for (const [sx, sz] of samples) {
        const biome = sampleBiome(sx, sz);
        if (isViableFeatureBiome(type, mc, biome)) return { viable: true, biome };
    }

    return { viable: false, biome: sampleBiome(x + 8, z + 8) };
}

function bedrockFilter(...ids) {
    return new Set(ids.filter(id => id != null));
}

const BEDROCK_BIOME_FILTERS = {
    village: bedrockFilter(
        BiomeID.plains,
        BiomeID.savanna,
        BiomeID.snowy_tundra,
        BiomeID.taiga,
        BiomeID.taiga_hills,
        BiomeID.snowy_taiga,
        BiomeID.snowy_taiga_hills,
        BiomeID.desert
    ),
    desertTemple: bedrockFilter(BiomeID.desert, BiomeID.desert_hills, BiomeID.desert_lakes),
    jungleTemple: bedrockFilter(BiomeID.jungle, BiomeID.jungle_hills),
    witchHut: bedrockFilter(BiomeID.swamp),
    igloo: bedrockFilter(BiomeID.snowy_tundra, BiomeID.snowy_taiga),
    monumentSpawn: bedrockFilter(
        BiomeID.deep_ocean,
        BiomeID.deep_cold_ocean,
        BiomeID.deep_warm_ocean,
        BiomeID.deep_frozen_ocean,
        BiomeID.deep_lukewarm_ocean
    ),
    monumentArea: bedrockFilter(
        BiomeID.ocean,
        BiomeID.deep_ocean,
        BiomeID.lukewarm_ocean,
        BiomeID.cold_ocean,
        BiomeID.frozen_ocean,
        BiomeID.warm_ocean,
        BiomeID.deep_lukewarm_ocean,
        BiomeID.deep_warm_ocean,
        BiomeID.deep_frozen_ocean,
        BiomeID.deep_cold_ocean,
        BiomeID.river,
        BiomeID.frozen_river
    ),
    buriedTreasure: bedrockFilter(BiomeID.beach, BiomeID.snowy_beach, BiomeID.stone_shore, BiomeID.mushroom_field_shore),
    mansion: bedrockFilter(BiomeID.dark_forest),
    ancientCity: bedrockFilter(BiomeID.deep_dark),
    trailRuins: bedrockFilter(
        BiomeID.taiga,
        BiomeID.snowy_taiga,
        BiomeID.giant_tree_taiga,
        BiomeID.giant_spruce_taiga,
        BiomeID.tall_birch_forest,
        BiomeID.jungle
    ),
    outpost: bedrockFilter(
        BiomeID.plains,
        BiomeID.sunflower_plains,
        BiomeID.savanna,
        BiomeID.snowy_tundra,
        BiomeID.taiga_hills,
        BiomeID.taiga,
        BiomeID.snowy_taiga,
        BiomeID.snowy_taiga_hills,
        BiomeID.desert
    ),
};

function sampleBedrockBiome(generator, x, z, y = 64) {
    if (!generator) return null;
    if (typeof generator.getBiomeAtY === 'function') return generator.getBiomeAtY(x, y, z);
    if (typeof generator.getBiome === 'function') return generator.getBiome(x, z);
    return null;
}

function bedrockAreaContainsOnly(generator, centerX, centerZ, radius, allowedBiomes, sampleY = 64) {
    if (!generator || (typeof generator.getBiome !== 'function' && typeof generator.getBiomeAtY !== 'function')) {
        return { viable: false, biome: null };
    }
    let firstBiome = null;
    const minCellX = Math.floor((centerX - radius) / 4);
    const maxCellX = Math.floor((centerX + radius) / 4);
    const minCellZ = Math.floor((centerZ - radius) / 4);
    const maxCellZ = Math.floor((centerZ + radius) / 4);

    for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
        for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
            const biome = sampleBedrockBiome(generator, cellX * 4, cellZ * 4, sampleY);
            if (firstBiome == null) firstBiome = biome;
            if (!allowedBiomes.has(biome)) {
                return { viable: false, biome };
            }
        }
    }

    return { viable: true, biome: firstBiome };
}

export function checkBedrockStructureBiome(type, generator, x, z) {
    const centerX = x + 8;
    const centerZ = z + 8;

    switch (type) {
        case STRUCTURE_TYPES.Village:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 2, BEDROCK_BIOME_FILTERS.village);
        case STRUCTURE_TYPES.Desert_Pyramid:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 0, BEDROCK_BIOME_FILTERS.desertTemple);
        case STRUCTURE_TYPES.Jungle_Temple:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 0, BEDROCK_BIOME_FILTERS.jungleTemple);
        case STRUCTURE_TYPES.Swamp_Hut:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 0, BEDROCK_BIOME_FILTERS.witchHut);
        case STRUCTURE_TYPES.Igloo:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 0, BEDROCK_BIOME_FILTERS.igloo);
        case STRUCTURE_TYPES.Monument: {
            const spawn = bedrockAreaContainsOnly(generator, centerX, centerZ, 16, BEDROCK_BIOME_FILTERS.monumentSpawn);
            if (!spawn.viable) return spawn;
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 29, BEDROCK_BIOME_FILTERS.monumentArea);
        }
        case STRUCTURE_TYPES.Treasure:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 3, BEDROCK_BIOME_FILTERS.buriedTreasure);
        case STRUCTURE_TYPES.Mansion:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 32, BEDROCK_BIOME_FILTERS.mansion);
        case STRUCTURE_TYPES.Outpost:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 0, BEDROCK_BIOME_FILTERS.outpost);
        case STRUCTURE_TYPES.Ancient_City:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 0, BEDROCK_BIOME_FILTERS.ancientCity, -40);
        case STRUCTURE_TYPES.Trail_Ruins:
            return bedrockAreaContainsOnly(generator, centerX, centerZ, 0, BEDROCK_BIOME_FILTERS.trailRuins);
        case STRUCTURE_TYPES.Trial_Chambers: {
            const biome = sampleBedrockBiome(generator, centerX, centerZ, -20);
            return { viable: biome !== BiomeID.deep_dark && biome != null, biome };
        }
        default:
            return {
                viable: true,
                biome: sampleBedrockBiome(generator, centerX, centerZ),
            };
    }
}

function floorDiv(a, b) {
    return Math.floor(a / b);
}

const TERRAIN_GATED_STRUCTURES = new Set([
    STRUCTURE_TYPES.Desert_Pyramid,
    STRUCTURE_TYPES.Jungle_Temple,
    STRUCTURE_TYPES.Mansion,
    STRUCTURE_TYPES.Ancient_City,
    STRUCTURE_TYPES.Trail_Ruins,
    STRUCTURE_TYPES.Trial_Chambers,
]);

function getCandidateStatus({ edition, mc, type, biomeViable, placementSource }) {
    if (!biomeViable) {
        return {
            status: 'biome-mismatch',
            label: 'Biome mismatch',
            reason: 'The region placement exists, but sampled biomes do not match the structure rules.',
            requiresTerrainCheck: false,
        };
    }

    if (edition === 'bedrock') {
        if (placementSource === BEDROCK_FALLBACK_SOURCE) {
            return {
                status: 'bedrock-fallback-candidate',
                label: 'Bedrock fallback candidate',
                reason: 'No dedicated Bedrock placement rule is implemented for this structure yet, so this uses the Java/parity placement fallback and needs in-game verification.',
                requiresTerrainCheck: false,
            };
        }

        return {
            status: 'bedrock-placement-candidate',
            label: 'Bedrock placement candidate',
            reason: 'Bedrock placement uses a JavaScript port/adaptation of cubiomes-bedrock rules with biome checks where available; final Bedrock terrain/feature generation still needs BDS or in-game verification.',
            requiresTerrainCheck: false,
        };
    }

    const requiresTerrainCheck = mc >= MC.V1_18 && TERRAIN_GATED_STRUCTURES.has(type);
    if (requiresTerrainCheck) {
        return {
            status: 'terrain-candidate',
            label: 'Terrain candidate',
            reason: 'Java region placement and biome rules match, but final terrain or structure-start checks still need in-game/JAR verification.',
            requiresTerrainCheck,
        };
    }

    return {
        status: 'cubiomes-match',
        label: 'Cubiomes match',
        reason: 'Java Cubiomes placement and biome rules match for this structure.',
        requiresTerrainCheck,
    };
}

export function generateStructureCandidates({
    seed,
    version = '1.21',
    edition = 'java',
    centerX = 0,
    centerZ = 0,
    range = 4000,
    generator = null,
    includeUnconfirmed = false,
    structureKeys = null,
} = {}) {
    const mc = toCubiomesMcVersion(version);
    const structures = [];
    const exact = edition === 'java';
    const entries = Array.isArray(structureKeys) && structureKeys.length > 0
        ? structureKeys.map(key => [key, STRUCTURE_INFO[key]]).filter(([, info]) => info)
        : Object.entries(STRUCTURE_INFO);

    for (const [key, info] of entries) {
        const bedrockConfig = edition === 'bedrock' ? getBedrockStructureConfig(info.type, version) : null;
        const placementSource = edition === 'bedrock'
            ? (bedrockConfig ? BEDROCK_PLACEMENT_SOURCE : BEDROCK_FALLBACK_SOURCE)
            : 'cubiomes-js';
        const config = bedrockConfig || getStructureConfig(info.type, mc);
        if (!config) continue;

        const regionSizeChunks = bedrockConfig ? config.spacing : config.regionSize;
        const regionSizeBlocks = regionSizeChunks * 16;
        const minRX = floorDiv(centerX - range, regionSizeBlocks);
        const maxRX = floorDiv(centerX + range, regionSizeBlocks);
        const minRZ = floorDiv(centerZ - range, regionSizeBlocks);
        const maxRZ = floorDiv(centerZ + range, regionSizeBlocks);

        for (let rx = minRX; rx <= maxRX; rx++) {
            for (let rz = minRZ; rz <= maxRZ; rz++) {
                const pos = bedrockConfig
                    ? getBedrockStructurePos(info.type, seed, rx, rz, version)
                    : getStructurePos(info.type, mc, seed, rx, rz);
                if (!pos) continue;
                if (pos.x < centerX - range || pos.x > centerX + range || pos.z < centerZ - range || pos.z > centerZ + range) {
                    continue;
                }

                const biomeCheck = bedrockConfig
                    ? checkBedrockStructureBiome(info.type, generator, pos.x, pos.z)
                    : checkStructureBiome(info.type, mc, generator, pos.x, pos.z);
                if (!includeUnconfirmed && !biomeCheck.viable) continue;

                const candidateStatus = getCandidateStatus({
                    edition,
                    mc,
                    type: info.type,
                    biomeViable: biomeCheck.viable,
                    placementSource,
                });

                structures.push({
                    ...info,
                    key,
                    x: pos.x,
                    z: pos.z,
                    regionX: rx,
                    regionZ: rz,
                    exact,
                    biome: biomeCheck.biome,
                    biomeConfirmed: biomeCheck.viable,
                    placementSource,
                    status: candidateStatus.status,
                    statusLabel: candidateStatus.label,
                    candidateReason: candidateStatus.reason,
                    requiresTerrainCheck: candidateStatus.requiresTerrainCheck,
                    finalVerified: false,
                });
            }
        }
    }

    return structures;
}

export function getStructureLegend() {
    return Object.entries(STRUCTURE_INFO).map(([key, info]) => ({ key, ...info }));
}

export function getStructureInfoForType(type) {
    return UI_BY_TYPE.get(type) || null;
}
