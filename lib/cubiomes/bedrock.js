import { Generator } from './generator.js';
import { LegacyBiomeGenerator } from './layers.js';
import { generateStructureCandidates, parseWorldSeed, toCubiomesMcVersion } from './structures.js';
import { getSupportedGeneratorMinor, parseMinecraftVersion } from '../version-utils.js';
import { getBedrockVersionProfile } from './bedrock-profiles.js';
import { getBedrockBiomeTree } from './bedrock-trees.js';

function signed32(value) {
    return BigInt.asIntN(32, BigInt(value));
}

function signed64(value) {
    return BigInt.asIntN(64, BigInt(value));
}

export function normalizeBedrockSeed(seedInput, version = '26.13') {
    const parsed = parseMinecraftVersion(version);
    const rawSeed = parseWorldSeed(seedInput);
    if (!parsed) return signed64(rawSeed);

    // Old Bedrock worlds used a 32-bit seed space; modern parity-era worlds use
    // the same 64-bit numeric range as Java for terrain/biome rendering.
    if (parsed.type === 'release' && parsed.familyMinor < 18) {
        return signed32(rawSeed);
    }

    return signed64(rawSeed);
}

export function getBedrockGeneratorMinor(version = '26.13') {
    return getBedrockVersionProfile(version).generatorMinor ?? getSupportedGeneratorMinor(version);
}

export class BedrockBiomeGenerator {
    constructor(seed, version = '26.13') {
        this.version = version;
        this.seed = normalizeBedrockSeed(seed, version);
        this.profile = getBedrockVersionProfile(version);
        this.minor = this.profile.generatorMinor;
        this.mc = toCubiomesMcVersion(version);
        this.edition = 'bedrock';
        this.exactStructures = false;

        if (this.minor >= 18) {
            this.modern = new Generator();
            this.modern.setupGenerator(this.minor, false, getBedrockBiomeTree(this.profile));
            this.modern.applySeed(this.seed);
            this.legacy = null;
        } else {
            this.modern = null;
            this.legacy = new LegacyBiomeGenerator(this.seed, this.mc);
        }
    }

    getBiome(x, z) {
        if (this.modern) {
            return this.modern.getBiomeAt(1, Math.floor(x), 64, Math.floor(z));
        }
        return this.legacy.getBiome(Math.floor(x), Math.floor(z));
    }

    getBiomeAtY(x, y, z) {
        if (this.modern) {
            return this.modern.getBiomeAt(1, Math.floor(x), Math.floor(y), Math.floor(z));
        }
        return this.getBiome(x, z);
    }

    getArea(x, z, width, height, scale = 4) {
        if (this.legacy?.getArea) {
            return this.legacy.getArea(x, z, width, height, scale);
        }

        const startX = Math.floor(x / scale);
        const startZ = Math.floor(z / scale);
        const w = Math.ceil(width / scale);
        const h = Math.ceil(height / scale);
        const data = new Int32Array(w * h);
        for (let dz = 0; dz < h; dz++) {
            for (let dx = 0; dx < w; dx++) {
                data[dx + dz * w] = this.getBiome((startX + dx) * scale, (startZ + dz) * scale);
            }
        }
        return { data, width: w, height: h, startX, startZ };
    }

    getStructures(options = {}) {
        return generateStructureCandidates({
            ...options,
            seed: this.seed,
            version: this.version,
            edition: 'bedrock',
            generator: this,
        });
    }
}
