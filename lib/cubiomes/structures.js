import { BiomeID } from './core.js';
import { parseMinecraftVersion } from '../version-utils.js';

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

function floorDiv(a, b) {
    return Math.floor(a / b);
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
        const config = getStructureConfig(info.type, mc);
        if (!config) continue;

        const regionSizeBlocks = config.regionSize * 16;
        const minRX = floorDiv(centerX - range, regionSizeBlocks);
        const maxRX = floorDiv(centerX + range, regionSizeBlocks);
        const minRZ = floorDiv(centerZ - range, regionSizeBlocks);
        const maxRZ = floorDiv(centerZ + range, regionSizeBlocks);

        for (let rx = minRX; rx <= maxRX; rx++) {
            for (let rz = minRZ; rz <= maxRZ; rz++) {
                const pos = getStructurePos(info.type, mc, seed, rx, rz);
                if (!pos) continue;
                if (pos.x < centerX - range || pos.x > centerX + range || pos.z < centerZ - range || pos.z > centerZ + range) {
                    continue;
                }

                const biomeCheck = checkStructureBiome(info.type, mc, generator, pos.x, pos.z);
                if (!includeUnconfirmed && !biomeCheck.viable) continue;

                const needsTerrainCheck = mc >= MC.V1_18 && [
                    STRUCTURE_TYPES.Desert_Pyramid,
                    STRUCTURE_TYPES.Jungle_Temple,
                    STRUCTURE_TYPES.Mansion,
                    STRUCTURE_TYPES.Ancient_City,
                    STRUCTURE_TYPES.Trail_Ruins,
                    STRUCTURE_TYPES.Trial_Chambers,
                ].includes(info.type);

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
                    status: biomeCheck.viable ? (needsTerrainCheck ? 'terrain-candidate' : 'confirmed') : 'biome-mismatch',
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
