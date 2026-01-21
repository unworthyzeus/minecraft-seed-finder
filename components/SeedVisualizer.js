'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LegacyBiomeGenerator } from '../lib/cubiomes/layers';
import { Generator } from '../lib/cubiomes/generator';


/**
 * Cubiomes-JS SeedVisualizer - Complete Implementation
 * 
 * JavaScript port of Cubiomes by Cubitect
 * https://github.com/Cubitect/cubiomes
 * MIT License - Copyright (c) 2020 Cubitect
 */

// ============================================================================
// SEED HELPERS
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
    let ret = Number((BigInt(s) >> 24n) % BigInt(mod));
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

// ============================================================================
// BIOME CONSTANTS
// ============================================================================

const BIOMES = {
    0: { name: 'Ocean', color: '#000070' },
    1: { name: 'Plains', color: '#8DB360' },
    2: { name: 'Desert', color: '#FA9418' },
    3: { name: 'Mountains', color: '#606060' },
    4: { name: 'Forest', color: '#056621' },
    5: { name: 'Taiga', color: '#0B6659' },
    6: { name: 'Swamp', color: '#07F9B2' },
    7: { name: 'River', color: '#0000FF' },
    10: { name: 'Frozen Ocean', color: '#7090B0' },
    11: { name: 'Frozen River', color: '#A0A0FF' },
    12: { name: 'Snowy Plains', color: '#FFFFFF' },
    13: { name: 'Snowy Mountains', color: '#A0A0A0' },
    14: { name: 'Mushroom Fields', color: '#FF00FF' },
    15: { name: 'Mushroom Shore', color: '#A000FF' },
    16: { name: 'Beach', color: '#FADE55' },
    17: { name: 'Desert Hills', color: '#D25F12' },
    18: { name: 'Wooded Hills', color: '#22551C' },
    19: { name: 'Taiga Hills', color: '#163933' },
    20: { name: 'Mountain Edge', color: '#72789A' },
    21: { name: 'Jungle', color: '#537B09' },
    22: { name: 'Jungle Hills', color: '#2C4205' },
    23: { name: 'Jungle Edge', color: '#628B17' },
    24: { name: 'Deep Ocean', color: '#000030' },
    25: { name: 'Stone Shore', color: '#A2A284' },
    26: { name: 'Snowy Beach', color: '#FAF0C0' },
    27: { name: 'Birch Forest', color: '#307444' },
    28: { name: 'Birch Forest Hills', color: '#1F5F32' },
    29: { name: 'Dark Forest', color: '#40511A' },
    30: { name: 'Snowy Taiga', color: '#31554A' },
    31: { name: 'Snowy Taiga Hills', color: '#243F36' },
    32: { name: 'Giant Tree Taiga', color: '#596651' },
    33: { name: 'Giant Tree Taiga Hills', color: '#454F3E' },
    34: { name: 'Wooded Mountains', color: '#507050' },
    35: { name: 'Savanna', color: '#BDB25F' },
    36: { name: 'Savanna Plateau', color: '#A79D64' },
    37: { name: 'Badlands', color: '#D94515' },
    38: { name: 'Wooded Badlands Plateau', color: '#B09765' },
    39: { name: 'Badlands Plateau', color: '#CA8C65' },
    44: { name: 'Warm Ocean', color: '#0000AC' },
    45: { name: 'Lukewarm Ocean', color: '#000090' },
    46: { name: 'Cold Ocean', color: '#202070' },
    47: { name: 'Deep Warm Ocean', color: '#000050' },
    48: { name: 'Deep Lukewarm Ocean', color: '#000040' },
    49: { name: 'Deep Cold Ocean', color: '#202038' },
    50: { name: 'Deep Frozen Ocean', color: '#404090' },
    129: { name: 'Sunflower Plains', color: '#B5DB88' },
    130: { name: 'Desert Lakes', color: '#FFBC40' },
    131: { name: 'Gravelly Mountains', color: '#505050' },
    132: { name: 'Flower Forest', color: '#2D8E49' },
    133: { name: 'Taiga Mountains', color: '#338E81' },
    134: { name: 'Swamp Hills', color: '#2FFFDA' },
    140: { name: 'Ice Spikes', color: '#B4DCDC' },
    149: { name: 'Modified Jungle', color: '#7BA331' },
    151: { name: 'Modified Jungle Edge', color: '#8AB33F' },
    155: { name: 'Tall Birch Forest', color: '#589C6C' },
    156: { name: 'Tall Birch Hills', color: '#47875A' },
    157: { name: 'Dark Forest Hills', color: '#687942' },
    158: { name: 'Snowy Taiga Mountains', color: '#597D72' },
    160: { name: 'Giant Spruce Taiga', color: '#818E79' },
    161: { name: 'Giant Spruce Taiga Hills', color: '#6D7766' },
    162: { name: 'Gravelly Mountains+', color: '#789878' },
    163: { name: 'Shattered Savanna', color: '#E5DA87' },
    164: { name: 'Shattered Savanna Plateau', color: '#CFC58C' },
    165: { name: 'Eroded Badlands', color: '#FF6D3D' },
    166: { name: 'Modified Wooded Badlands', color: '#D8BF8D' },
    167: { name: 'Modified Badlands Plateau', color: '#F2B48D' },
    168: { name: 'Bamboo Jungle', color: '#768E14' },
    169: { name: 'Bamboo Jungle Hills', color: '#3B470A' },
    // 1.18+ biomes
    177: { name: 'Meadow', color: '#83BB6D' },
    178: { name: 'Grove', color: '#88BB67' },
    179: { name: 'Snowy Slopes', color: '#E0E0E0' },
    180: { name: 'Jagged Peaks', color: '#C0C0C0' },
    181: { name: 'Frozen Peaks', color: '#A0A0C0' },
    182: { name: 'Stony Peaks', color: '#888888' },
    183: { name: 'Deep Dark', color: '#0B1014' },
    184: { name: 'Mangrove Swamp', color: '#67352B' },
    185: { name: 'Cherry Grove', color: '#FFB7C5' },
    186: { name: 'Pale Garden', color: '#A8B8A8' },
};

function getBiomeInfo(id) {
    return BIOMES[id] || { name: `Biome ${id}`, color: '#808080' };
}

// ============================================================================
// LAYER-BASED GENERATION (Pre-1.18)
// ============================================================================

const Oceanic = 0;
const Warm = 1;
const Lush = 2;
const Cold = 3;
const Freezing = 4;

const warmBiomes = [2, 2, 2, 35, 35, 1];
const lushBiomes = [4, 29, 3, 1, 27, 6];
const coldBiomes = [4, 3, 5, 1];
const snowBiomes = [12, 12, 12, 30];




// ============================================================================
// 1.18+ BIOME GENERATION (Multi-Noise)
// ============================================================================

class Xoroshiro {
    constructor() {
        this.lo = 0n;
        this.hi = 0n;
    }

    setSeed(value) {
        const XL = 0x9E3779B97F4A7C15n;
        const XH = 0x6A09E667F3BCC909n;
        const A = 0xBF58476D1CE4E5B9n;
        const B = 0x94D049BB133111EBn;

        value = BigInt(value);
        let l = value ^ XH;
        let h = (l + XL) & 0xFFFFFFFFFFFFFFFFn;

        l = ((l ^ (l >> 30n)) * A) & 0xFFFFFFFFFFFFFFFFn;
        h = ((h ^ (h >> 30n)) * A) & 0xFFFFFFFFFFFFFFFFn;
        l = ((l ^ (l >> 27n)) * B) & 0xFFFFFFFFFFFFFFFFn;
        h = ((h ^ (h >> 27n)) * B) & 0xFFFFFFFFFFFFFFFFn;
        l = (l ^ (l >> 31n)) & 0xFFFFFFFFFFFFFFFFn;
        h = (h ^ (h >> 31n)) & 0xFFFFFFFFFFFFFFFFn;

        this.lo = l;
        this.hi = h;
    }

    static rotl64(x, k) {
        x = BigInt(x) & 0xFFFFFFFFFFFFFFFFn;
        return ((x << BigInt(k)) | (x >> BigInt(64 - k))) & 0xFFFFFFFFFFFFFFFFn;
    }

    nextLong() {
        let l = this.lo;
        let h = this.hi;
        const n = (Xoroshiro.rotl64(l + h, 17) + l) & 0xFFFFFFFFFFFFFFFFn;
        h ^= l;
        this.lo = (Xoroshiro.rotl64(l, 49) ^ h ^ ((h << 21n) & 0xFFFFFFFFFFFFFFFFn)) & 0xFFFFFFFFFFFFFFFFn;
        this.hi = Xoroshiro.rotl64(h, 28);
        return n;
    }

    nextDouble() {
        return Number(this.nextLong() >> 11n) * 1.1102230246251565e-16;
    }
}

class ModernBiomeGenerator {
    constructor(seed, version = 21) {
        this.gen = new Generator();
        this.gen.setupGenerator(version);
        this.gen.applySeed(seed);
    }

    getBiome(x, z) {
        // Use surface level (y=64)
        return this.gen.getBiomeAt(1, x, 64, z);
    }
}

// ============================================================================
// STRUCTURE HELPERS
// ============================================================================

const STRUCTURE_CONFIG = {
    spawn: { name: 'World Spawn', color: '#ef4444', size: 24, icon: 'Spawn' },
    stronghold: { name: 'Stronghold', color: '#7c3aed', size: 20, icon: 'Stronghold' },
    village: { name: 'Village', color: '#f59e0b', size: 20, icon: 'Village' },
    mansion: { name: 'Mansion', color: '#c27e2e', size: 24, icon: 'Mansion' },
    outpost: { name: 'Pillager Outpost', color: '#9f1239', size: 20, icon: 'Outpost' },
    jungle_temple: { name: 'Jungle Temple', color: '#166534', size: 18, icon: 'Temple' },
    desert_pyramid: { name: 'Desert Pyramid', color: '#eab308', size: 18, icon: 'Pyramid' },
    witch_hut: { name: 'Witch Hut', color: '#4a5568', size: 18, icon: 'Hut' },
    igloo: { name: 'Igloo', color: '#3b82f6', size: 16, icon: 'Igloo' },
    monument: { name: 'Ocean Monument', color: '#06b6d4', size: 20, icon: 'Monument' },
    ruined_portal: { name: 'Ruined Portal', color: '#a855f7', size: 16, icon: 'Portal' },
};

function drawStructureIcon(ctx, type, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    switch (type) {
        case 'spawn':
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Inner target
            ctx.beginPath();
            ctx.arc(x, y, size / 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            break;

        case 'stronghold':
            // Eye of Ender style
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#64748b'; // Stone
            ctx.fill();
            ctx.stroke();
            // Eye
            ctx.beginPath();
            ctx.ellipse(x, y, size / 4, size / 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            // Pupil
            ctx.beginPath();
            ctx.arc(x, y, size / 8, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            break;

        case 'desert_pyramid':
            ctx.beginPath();
            ctx.moveTo(x, y - size / 1.5);
            ctx.lineTo(x + size / 1.5, y + size / 2);
            ctx.lineTo(x - size / 1.5, y + size / 2);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();
            // Blue center
            ctx.beginPath();
            ctx.rect(x - size / 6, y, size / 3, size / 3);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            break;

        case 'jungle_temple':
            ctx.fillStyle = '#4d7c0f'; // Mossy green
            // Bottom tier
            ctx.fillRect(x - size / 1.5, y, size * 1.3, size / 2);
            ctx.strokeRect(x - size / 1.5, y, size * 1.3, size / 2);
            // Top tier
            ctx.fillRect(x - size / 2, y - size / 2, size, size / 2);
            ctx.strokeRect(x - size / 2, y - size / 2, size, size / 2);
            break;

        case 'witch_hut':
            ctx.fillStyle = '#4a5568';
            ctx.beginPath();
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x + size / 2, y);
            ctx.lineTo(x + size / 2, y + size / 2);
            ctx.lineTo(x - size / 2, y + size / 2);
            ctx.lineTo(x - size / 2, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;

        case 'igloo':
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.arc(x, y, size / 2, Math.PI, 0); // Dome
            ctx.lineTo(x + size / 2, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;

        case 'village':
            ctx.fillStyle = color;
            // House Body
            ctx.fillRect(x - size / 2, y, size, size / 2);
            ctx.strokeRect(x - size / 2, y, size, size / 2);
            // Roof
            ctx.beginPath();
            ctx.moveTo(x - size / 2 - 2, y);
            ctx.lineTo(x, y - size / 1.5);
            ctx.lineTo(x + size / 2 + 2, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;

        case 'monument':
            ctx.fillStyle = color;
            // Prism/Diamond shape
            ctx.beginPath();
            ctx.moveTo(x, y - size / 1.5);
            ctx.lineTo(x + size / 1.5, y);
            ctx.lineTo(x, y + size / 1.5);
            ctx.lineTo(x - size / 1.5, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Inner eye
            ctx.fillStyle = '#ff9e5e';
            ctx.beginPath();
            ctx.arc(x, y, size / 5, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'mansion':
            ctx.fillStyle = '#78350f'; // Dark wood
            // Large House
            ctx.fillRect(x - size / 1.5, y - size / 4, size * 1.3, size);
            ctx.strokeRect(x - size / 1.5, y - size / 4, size * 1.3, size);
            // Roof
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.moveTo(x - size / 1.5 - 2, y - size / 4);
            ctx.lineTo(x, y - size);
            ctx.lineTo(x + size / 1.5 + 2, y - size / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;

        case 'ruined_portal':
            ctx.fillStyle = '#4a044e'; // Obsidian color
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Portal Purple
            ctx.fillStyle = '#d946ef';
            ctx.beginPath();
            ctx.arc(x, y, size / 3, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'outpost':
            ctx.fillStyle = color;
            // Tower
            ctx.fillRect(x - size / 4, y - size / 2, size / 2, size);
            ctx.strokeRect(x - size / 4, y - size / 2, size / 2, size);
            // Top
            ctx.fillRect(x - size / 2, y - size / 2, size, size / 3);
            ctx.strokeRect(x - size / 2, y - size / 2, size, size / 3);
            // Flag
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x + size / 2, y - size);
            ctx.stroke();
            break;

        default:
            // Fallback to circle
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();
            break;
    }
}

function LegendIcon({ type, color, size }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = 32; // Canvas size
        canvas.width = s;
        canvas.height = s;
        ctx.clearRect(0, 0, s, s);

        // Adjust size for legend (don't let it be too big)
        const iconSize = Math.min(size || 16, 20);
        drawStructureIcon(ctx, type, s / 2, s / 2 + 2, iconSize, color);
    }, [type, color, size]);

    return (
        <canvas
            ref={canvasRef}
            width="32"
            height="32"
            style={{ width: '20px', height: '20px', display: 'inline-block' }}
        />
    );
}


// ============================================================================
// STRUCTURE GENERATION
// ============================================================================

function generateStructures(seed, centerX, centerZ, range, generator, version = 21) {
    const structures = [];
    const worldSeed = BigInt(seed);

    // World spawn (approximate)
    const spawnRng = new Xoroshiro();
    spawnRng.setSeed(worldSeed);
    structures.push({
        type: 'spawn',
        x: Math.floor((spawnRng.nextDouble() - 0.5) * 160),
        z: Math.floor((spawnRng.nextDouble() - 0.5) * 160),
        icon: 'Spawn', name: 'World Spawn', color: '#ef4444', size: 24
    });

    // Strongholds (3 in first ring)
    for (let i = 0; i < 3; i++) {
        const angle = (2 * Math.PI * i) / 3 + (spawnRng.nextDouble() - 0.5) * 0.5;
        const dist = 1408 + spawnRng.nextDouble() * 512;
        structures.push({
            type: 'stronghold',
            x: Math.floor(Math.cos(angle) * dist),
            z: Math.floor(Math.sin(angle) * dist),
            icon: 'Stronghold', name: 'Stronghold', color: '#7c3aed', size: 20,
            validBiomes: null
        });
    }

    // Region-based structures
    const regionSize = 32 * 16; // 512 blocks
    const minRX = Math.floor((centerX - range) / regionSize);
    const maxRX = Math.floor((centerX + range) / regionSize);
    const minRZ = Math.floor((centerZ - range) / regionSize);
    const maxRZ = Math.floor((centerZ + range) / regionSize);

    for (let rx = minRX; rx <= maxRX; rx++) {
        for (let rz = minRZ; rz <= maxRZ; rz++) {
            // 1. Scattered Features - Salt 14357617
            let cs = worldSeed + BigInt(rx * 341873128712 + rz * 132897987541) + 14357617n;
            cs = mcStepSeed(cs, worldSeed);
            const xS = rx * regionSize + mcFirstInt(cs, 24) * 16 + 8;
            const zS = rz * regionSize + mcFirstInt(mcStepSeed(cs, worldSeed), 24) * 16 + 8;

            // Push ALL candidates with biome constraints
            structures.push({ type: 'desert_pyramid', x: xS, z: zS, icon: 'Pyramid', name: 'Desert Pyramid', color: '#eab308', size: 18, validBiomes: [2, 17] });
            structures.push({ type: 'jungle_temple', x: xS, z: zS, icon: 'Temple', name: 'Jungle Temple', color: '#166534', size: 18, validBiomes: [21, 22, 23, 168, 169] });
            structures.push({ type: 'witch_hut', x: xS, z: zS, icon: 'Hut', name: 'Witch Hut', color: '#4a5568', size: 18, validBiomes: [6] });
            if (version >= 9) {
                structures.push({ type: 'igloo', x: xS, z: zS, icon: 'Igloo', name: 'Igloo', color: '#3b82f6', size: 16, validBiomes: [12, 30, 26, 179] });
            }

            // 2. Villages - Salt 10387312
            cs = worldSeed + BigInt(rx * 341873128712 + rz * 132897987541) + 10387312n;
            cs = mcStepSeed(cs, worldSeed);
            const xV = rx * regionSize + mcFirstInt(cs, 24) * 16 + 8;
            const zV = rz * regionSize + mcFirstInt(mcStepSeed(cs, worldSeed), 24) * 16 + 8;
            structures.push({ type: 'village', x: xV, z: zV, icon: 'Village', name: 'Village', color: '#f59e0b', size: 20, validBiomes: [1, 2, 35, 5, 12, 177] });

            // 3. Ocean Monuments - Salt 10387313 (1.8+)
            if (version >= 8) {
                cs = worldSeed + BigInt(rx * 341873128712 + rz * 132897987541) + 10387313n;
                cs = mcStepSeed(cs, worldSeed);
                const xM = rx * regionSize + mcFirstInt(cs, 27) * 16 + 8;
                const zM = rz * regionSize + mcFirstInt(mcStepSeed(cs, worldSeed), 27) * 16 + 8;
                structures.push({ type: 'monument', x: xM, z: zM, icon: 'Monument', name: 'Ocean Monument', color: '#06b6d4', size: 20, validBiomes: [0, 24, 10, 44, 45, 46, 47, 48, 49, 50] });
            }
        }
    }

    // Woodland Mansions (1.11+)
    if (version >= 11) {
        const mansionSize = 80 * 16;
        const minMX = Math.floor((centerX - range) / mansionSize);
        const maxMX = Math.floor((centerX + range) / mansionSize);
        const minMZ = Math.floor((centerZ - range) / mansionSize);
        const maxMZ = Math.floor((centerZ + range) / mansionSize);

        for (let mx = minMX; mx <= maxMX; mx++) {
            for (let mz = minMZ; mz <= maxMZ; mz++) {
                let cs = worldSeed + BigInt(mx * 341873128712 + mz * 132897987541) + 10387319n;
                cs = mcStepSeed(cs, worldSeed);

                // Mansions: Forced generation for visualizer
                const x = mx * mansionSize + mcFirstInt(cs, 60 * 16);
                const z = mz * mansionSize + mcFirstInt(mcStepSeed(cs, worldSeed), 60 * 16);

                structures.push({
                    type: 'mansion',
                    x: x,
                    z: z,
                    icon: 'Mansion', name: 'Mansion', color: '#c27e2e', size: 24,
                    validBiomes: [29]
                });
            }
        }
    }

    // Pillager Outposts (1.14+)
    if (version >= 14) {
        // Uses same spacing as temples/villages but different salt
        const regionSize = 32 * 16;
        const minRX = Math.floor((centerX - range) / regionSize);
        const maxRX = Math.floor((centerX + range) / regionSize);
        const minRZ = Math.floor((centerZ - range) / regionSize);
        const maxRZ = Math.floor((centerZ + range) / regionSize);

        for (let rx = minRX; rx <= maxRX; rx++) {
            for (let rz = minRZ; rz <= maxRZ; rz++) {
                let cs = worldSeed + BigInt(rx * 341873128712 + rz * 132897987541) + 165745296n;
                cs = mcStepSeed(cs, worldSeed);
                const x = rx * regionSize + mcFirstInt(cs, 24) * 16 + 8;
                const z = rz * regionSize + mcFirstInt(mcStepSeed(cs, worldSeed), 24) * 16 + 8;

                structures.push({
                    type: 'outpost', x, z, icon: 'Outpost', name: 'Pillager Outpost', color: '#9f1239', size: 20,
                    validBiomes: [1, 2, 35, 5, 12, 177, 178, 179] // Plains, Desert, Savanna, Taiga, Snowy Plains, Meadow...
                });
            }
        }
    }

    // Ruined Portals (1.16+)
    if (version >= 16) {
        const spacing = 40 * 16; // Approx spacing
        const minRX = Math.floor((centerX - range) / spacing);
        const maxRX = Math.floor((centerX + range) / spacing);
        const minRZ = Math.floor((centerZ - range) / spacing);
        const maxRZ = Math.floor((centerZ + range) / spacing);

        for (let rx = minRX; rx <= maxRX; rx++) {
            for (let rz = minRZ; rz <= maxRZ; rz++) {
                let cs = worldSeed + BigInt(rx * 341873128712 + rz * 132897987541) + 40084232n;
                cs = mcStepSeed(cs, worldSeed);
                // Can spawn anywhere
                const x = rx * spacing + mcFirstInt(cs, 24) * 16;
                const z = rz * spacing + mcFirstInt(mcStepSeed(cs, worldSeed), 24) * 16;
                structures.push({
                    type: 'ruined_portal', x, z, icon: 'Portal', name: 'Ruined Portal', color: '#a855f7', size: 16,
                    validBiomes: null // Any surface biome
                });
            }
        }
    }

    // Buried Treasure (1.13+)
    if (version >= 13) {
        // Probability per chunk approx 0.01 (1%)
        // Simplified: Just RNG based placement in beaches
        // We can't realistically simulate 1% per chunk efficiently without lag, so we'll skip or use region approximation
        // Skipping for performance on big map
    }

    // Geodes (1.17+) - Similar to Treasure, too common (1/24 chunks) to show all on a large map efficiently.


    return structures;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SeedVisualizer({ seed, version = '1.21', coordinates }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [zoom, setZoom] = useState(0.5);
    const [offset, setOffset] = useState({ x: 0, z: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, z: 0 });
    const [mouseCoords, setMouseCoords] = useState({ x: 0, z: 0 });
    const [hoveredBiome, setHoveredBiome] = useState(null);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [showStructures, setShowStructures] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

    const generatorRef = useRef(null);
    const structuresRef = useRef([]);

    // Parse version number
    const parseVersion = useCallback((v) => {
        const match = String(v).match(/1\.(\d+)/);
        return match ? parseInt(match[1]) : 21;
    }, []);

    // Parse seed
    const parseSeed = useCallback((seedInput) => {
        if (typeof seedInput === 'string') {
            if (/^-?\d+$/.test(seedInput)) return BigInt(seedInput);
            let hash = 0n;
            for (let i = 0; i < seedInput.length; i++) {
                hash = ((hash << 5n) - hash + BigInt(seedInput.charCodeAt(i))) & 0xFFFFFFFFFFFFFFFFn;
            }
            return hash;
        }
        return BigInt(seedInput);
    }, []);

    // Initialize generator based on version
    useEffect(() => {
        const parsedSeed = parseSeed(seed);
        const versionNum = parseVersion(version);

        if (versionNum >= 18) {
            generatorRef.current = new ModernBiomeGenerator(parsedSeed, versionNum);
        } else {
            generatorRef.current = new LegacyBiomeGenerator(parsedSeed, versionNum);
        }

        // Generate structures
        structuresRef.current = generateStructures(parsedSeed, 0, 0, 4000, generatorRef.current, versionNum);

        // Center on POI if provided
        if (coordinates) {
            setOffset({ x: -coordinates.x, z: -coordinates.z });
        }
    }, [seed, version, coordinates, parseSeed, parseVersion]);

    // Handle resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                if (isFullscreen) {
                    setCanvasSize({
                        width: window.innerWidth,
                        height: window.innerHeight - 140
                    });
                } else {
                    setCanvasSize({
                        width: Math.min(rect.width, 1200),
                        height: 500
                    });
                }
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [isFullscreen]);

    // Render map
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !generatorRef.current) return;

        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear with dark background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        const generator = generatorRef.current;
        const blockSize = Math.max(2, Math.floor(zoom * 8));
        const centerX = width / 2;
        const centerZ = height / 2;
        const worldCenterX = -offset.x;
        const worldCenterZ = -offset.z;

        // Render biomes
        if (generator.getArea) {
            // Batch rendering (optimized for Legacy)
            const minWorldX = Math.floor((-centerX) / zoom + worldCenterX);
            const minWorldZ = Math.floor((-centerZ) / zoom + worldCenterZ);
            const maxWorldX = Math.floor((width - centerX) / zoom + worldCenterX);
            const maxWorldZ = Math.floor((height - centerZ) / zoom + worldCenterZ);
            const w = maxWorldX - minWorldX + blockSize; // buffer
            const h = maxWorldZ - minWorldZ + blockSize;

            // Legacy gen works best at 1:4 resolution
            const area = generator.getArea(minWorldX, minWorldZ, w, h, 4);
            const { data, width: areaW } = area;

            // Render from buffer
            for (let sy = 0; sy < height; sy += blockSize) {
                for (let sx = 0; sx < width; sx += blockSize) {
                    const worldX = Math.floor((sx - centerX) / zoom + worldCenterX);
                    const worldZ = Math.floor((sy - centerZ) / zoom + worldCenterZ);

                    // Map to buffer index (buffer is scaled 1:4)
                    const bx = Math.floor(worldX / 4) - area.startX;
                    const bz = Math.floor(worldZ / 4) - area.startZ;

                    if (bx >= 0 && bx < area.width && bz >= 0 && bz < area.height) {
                        const biomeId = data[bx + bz * areaW];
                        const biome = getBiomeInfo(biomeId);
                        ctx.fillStyle = biome.color;
                        ctx.fillRect(sx, sy, blockSize + 1, blockSize + 1);
                    }
                }
            }
        } else {
            // Per-pixel rendering (Modern)
            for (let sy = 0; sy < height; sy += blockSize) {
                for (let sx = 0; sx < width; sx += blockSize) {
                    const worldX = Math.floor((sx - centerX) / zoom + worldCenterX);
                    const worldZ = Math.floor((sy - centerZ) / zoom + worldCenterZ);

                    // Sample biome
                    const biomeId = generator.getBiome(worldX, worldZ);
                    const biome = getBiomeInfo(biomeId);
                    ctx.fillStyle = biome.color;
                    ctx.fillRect(sx, sy, blockSize + 1, blockSize + 1);
                }
            }
        }

        // Grid
        if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            const gridSpacing = 512;

            const startX = Math.floor((worldCenterX - width / zoom / 2) / gridSpacing) * gridSpacing;
            const endX = worldCenterX + width / zoom / 2;
            const startZ = Math.floor((worldCenterZ - height / zoom / 2) / gridSpacing) * gridSpacing;
            const endZ = worldCenterZ + height / zoom / 2;

            for (let gx = startX; gx <= endX; gx += gridSpacing) {
                const screenX = centerX + (gx - worldCenterX) * zoom;
                ctx.beginPath();
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, height);
                ctx.stroke();
            }
            for (let gz = startZ; gz <= endZ; gz += gridSpacing) {
                const screenZ = centerZ + (gz - worldCenterZ) * zoom;
                ctx.beginPath();
                ctx.moveTo(0, screenZ);
                ctx.lineTo(width, screenZ);
                ctx.stroke();
            }

            // Origin crosshair
            const originX = centerX + (0 - worldCenterX) * zoom;
            const originZ = centerZ + (0 - worldCenterZ) * zoom;
            if (originX >= 0 && originX <= width && originZ >= 0 && originZ <= height) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(originX - 15, originZ);
                ctx.lineTo(originX + 15, originZ);
                ctx.moveTo(originX, originZ - 15);
                ctx.lineTo(originX, originZ + 15);
                ctx.stroke();
            }
        }

        // POI marker
        if (coordinates) {
            const poiX = centerX + (coordinates.x - worldCenterX) * zoom;
            const poiZ = centerZ + (coordinates.z - worldCenterZ) * zoom;

            ctx.beginPath();
            ctx.arc(poiX, poiZ, 16, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ef4444'; // Red star
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', poiX, poiZ + 1);
            // Label
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('Target', poiX, poiZ - 20);
        }

        // Structures
        if (showStructures && generatorRef.current) {
            const generator = generatorRef.current;
            const offsets = [[0, 0], [32, 0], [-32, 0], [0, 32], [0, -32]];

            for (const s of structuresRef.current) {
                const sx = centerX + (s.x - worldCenterX) * zoom;
                const sz = centerZ + (s.z - worldCenterZ) * zoom;

                if (sx >= -50 && sx <= width + 50 && sz >= -50 && sz <= height + 50) {

                    // Verify Match
                    let isPOIMatch = false;
                    let isBiomeConfirmed = false;

                    // 1. POI Match (High Confidence)
                    if (coordinates && Math.abs(s.x - coordinates.x) < 32 && Math.abs(s.z - coordinates.z) < 32) {
                        isPOIMatch = true;
                        isBiomeConfirmed = true; // Force confirm
                    }
                    // 2. Biome Check (Medium Verified)
                    else if (s.validBiomes) {
                        for (const [dx, dz] of [[0, 0], ...offsets]) {
                            const b = generator.getBiome(s.x + dx, s.z + dz);
                            if (s.validBiomes.includes(b)) {
                                isBiomeConfirmed = true;
                                break;
                            }
                        }
                    } else {
                        isBiomeConfirmed = true;
                    }

                    // Filtering
                    if ((!verifiedOnly || isPOIMatch) && isBiomeConfirmed) {
                        const size = s.size || 16;

                        // Confidence Opacity
                        ctx.globalAlpha = isPOIMatch ? 1.0 : 0.7;

                        // Background circle (shadow/contrast)
                        ctx.beginPath();
                        ctx.arc(sx, sz, size / 2 + 3, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fill();

                        // Structure Icon Rendering
                        drawStructureIcon(ctx, s.type, sx, sz, size, s.color);

                        ctx.globalAlpha = 1.0; // Reset
                    }
                }
            }
        }
    }, [seed, version, zoom, offset, showStructures, showGrid, coordinates, canvasSize]);

    // Mouse handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - offset.x * zoom,
            z: e.clientY - offset.z * zoom
        });
    };

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasZ = e.clientY - rect.top;

        const centerX = canvas.width / 2;
        const centerZ = canvas.height / 2;
        const worldX = Math.floor((canvasX - centerX) / zoom - offset.x);
        const worldZ = Math.floor((canvasZ - centerZ) / zoom - offset.z);

        setMouseCoords({ x: worldX, z: worldZ });

        if (generatorRef.current) {
            const biomeId = generatorRef.current.getBiome(worldX, worldZ);
            setHoveredBiome(getBiomeInfo(biomeId));
        }

        if (isDragging) {
            setOffset({
                x: (e.clientX - dragStart.x) / zoom,
                z: (e.clientY - dragStart.z) / zoom
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => {
        setIsDragging(false);
        setHoveredBiome(null);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.8 : 1.25;
        setZoom(prev => Math.max(0.1, Math.min(8, prev * delta)));
    };

    const goToOrigin = () => setOffset({ x: 0, z: 0 });
    const goToPOI = () => coordinates && setOffset({ x: -coordinates.x, z: -coordinates.z });

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
    };

    const versionNum = parseVersion(version);

    return (
        <div
            ref={containerRef}
            className={`seed-visualizer ${isFullscreen ? 'fullscreen' : ''}`}
        >
            {/* Header */}
            <div className="viz-header">
                <div className="header-left">
                    <span className="header-icon">🗺️</span>
                    <div>
                        <h3>Seed Map</h3>
                        <p>Cubiomes-JS • {version} {versionNum >= 18 ? '(Multi-Noise)' : '(Layer-Based)'}</p>
                    </div>
                </div>
                <div className="header-right">
                    <span className="seed-badge">{seed}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="viz-controls">
                <div className="control-group">
                    <button onClick={() => setZoom(z => Math.min(8, z * 1.5))} title="Zoom In">+</button>
                    <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.max(0.1, z / 1.5))} title="Zoom Out">−</button>
                </div>
                <div className="control-group">
                    <button onClick={goToOrigin} title="Go to Origin (0, 0)">Origin</button>
                    {coordinates && (
                        <button onClick={goToPOI} className="poi-btn" title="Go to Point of Interest">
                            POI ({coordinates.x}, {coordinates.z})
                        </button>
                    )}
                </div>
                <div className="control-group">
                    <button
                        onClick={() => setShowStructures(v => !v)}
                        className={showStructures ? 'active' : ''}
                        title="Toggle Structures"
                    >
                        🏠 Structures
                    </button>
                    <button
                        onClick={() => setShowGrid(v => !v)}
                        className={showGrid ? 'active' : ''}
                        title="Toggle Grid"
                    >
                        # Grid
                    </button>
                    <button onClick={toggleFullscreen} title="Toggle Fullscreen">
                        {isFullscreen ? ' Exit' : ' Full'}
                    </button>
                </div>
            </div>

            {/* Info Panel */}
            <div className="info-panel">
                <span className="coords">X: {mouseCoords.x} Z: {mouseCoords.z}</span>
                {hoveredBiome && (
                    <span className="biome-info">
                        <span className="biome-color" style={{ background: hoveredBiome.color }}></span>
                        {hoveredBiome.name}
                    </span>
                )}
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    width: '100%',
                    height: isFullscreen ? 'calc(100vh - 180px)' : '500px'
                }}
            />

            {/* Legend */}
            <div className="legend">
                {Object.entries(STRUCTURE_CONFIG).map(([type, config]) => (
                    <div className="legend-item" key={type}>
                        <LegendIcon type={type} color={config.color} size={config.size} />
                        {config.name}
                    </div>
                ))}
                {coordinates && (
                    <div className="legend-item">
                        <span className="legend-dot type-star" style={{ background: '#ef4444' }}>★</span>
                        Target
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="viz-footer">
                <span>
                    Biome algorithms by <a href="https://github.com/Cubitect/cubiomes" target="_blank" rel="noopener noreferrer">Cubiomes</a> (MIT License)
                </span>
            </div>

            <style jsx>{`
                .seed-visualizer {
                    background: linear-gradient(145deg, #1a1f2e, #151921);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    margin: 24px 0;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    position: relative;
                }

                .seed-visualizer.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    margin: 0;
                    border-radius: 0;
                    border: none;
                }

                .viz-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .header-icon {
                    font-size: 1.8rem;
                }

                .header-left h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #fff;
                }

                .header-left p {
                    margin: 2px 0 0;
                    font-size: 0.75rem;
                    color: #888;
                }

                .seed-badge {
                    padding: 6px 12px;
                    background: rgba(34, 197, 94, 0.15);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    border-radius: 6px;
                    color: #22c55e;
                    font-family: monospace;
                    font-size: 0.85rem;
                }

                .viz-controls {
                    display: flex;
                    gap: 16px;
                    padding: 12px 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    flex-wrap: wrap;
                }

                .control-group {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .control-group button {
                    padding: 8px 14px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #fff;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }

                .control-group button:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .control-group button.active {
                    background: rgba(34, 197, 94, 0.2);
                    border-color: rgba(34, 197, 94, 0.4);
                }

                .control-group button.poi-btn {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.4);
                    color: #fca5a5;
                }

                .zoom-level {
                    padding: 0 10px;
                    color: #888;
                    font-size: 0.85rem;
                    min-width: 50px;
                    text-align: center;
                    font-family: monospace;
                }

                .info-panel {
                    position: absolute;
                    top: 130px;
                    left: 20px;
                    padding: 10px 16px;
                    background: rgba(0, 0, 0, 0.75);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #fff;
                    font-family: monospace;
                    font-size: 0.9rem;
                    display: flex;
                    gap: 20px;
                    z-index: 10;
                    backdrop-filter: blur(8px);
                }

                .coords {
                    min-width: 120px;
                }

                .biome-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .biome-color {
                    width: 14px;
                    height: 14px;
                    border-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }

                canvas {
                    display: block;
                    background: #1a1a2e;
                }

                .legend {
                    display: flex;
                    gap: 16px;
                    padding: 12px 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    flex-wrap: wrap;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #aaa;
                    font-size: 0.85rem;
                }

                .legend-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    display: inline-block;
                }

                .legend-dot.type-star {
                    background: none !important;
                    color: #ef4444;
                    font-weight: bold;
                    width: auto;
                    height: auto;
                    font-size: 1.1em;
                }

                .viz-footer {
                    padding: 12px 20px;
                    background: rgba(0, 0, 0, 0.3);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    text-align: center;
                }

                .viz-footer span {
                    color: #555;
                    font-size: 0.75rem;
                }

                .viz-footer a {
                    color: #888;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .viz-footer a:hover {
                    color: #22c55e;
                }

                @media (max-width: 768px) {
                    .viz-header {
                        flex-direction: column;
                        gap: 12px;
                        text-align: center;
                    }

                    .viz-controls {
                        justify-content: center;
                    }

                    .legend {
                        justify-content: center;
                    }

                    .info-panel {
                        left: 10px;
                        right: 10px;
                        flex-direction: column;
                        gap: 8px;
                    }
                }
            `}</style>
        </div>
    );
}




