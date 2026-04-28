import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const STRUCTURE_LOCATE_IDS = {
    village: 'village',
    ruined_portal: 'ruined_portal',
    desert_pyramid: 'desert_pyramid',
    jungle_temple: 'jungle_temple',
    witch_hut: 'swamp_hut',
    igloo: 'igloo',
    monument: 'monument',
    mansion: 'mansion',
    outpost: 'pillager_outpost',
    shipwreck: 'shipwreck',
    ocean_ruin: 'ocean_ruin',
    buried_treasure: 'buried_treasure',
    ancient_city: 'ancient_city',
    trail_ruins: 'trail_ruins',
    trial_chambers: 'trial_chambers',
};

const BIOME_LOCATE_IDS = {
    plains: 'minecraft:plains',
    desert: 'minecraft:desert',
    forest: 'minecraft:forest',
    flower_forest: 'minecraft:flower_forest',
    dark_forest: 'minecraft:dark_forest',
    birch_forest: 'minecraft:birch_forest',
    taiga: 'minecraft:taiga',
    giant_tree_taiga: 'minecraft:old_growth_pine_taiga',
    snowy_tundra: 'minecraft:snowy_plains',
    snowy_taiga: 'minecraft:snowy_taiga',
    ice_spikes: 'minecraft:ice_spikes',
    savanna: 'minecraft:savanna',
    swamp: 'minecraft:swamp',
    jungle: 'minecraft:jungle',
    bamboo_jungle: 'minecraft:bamboo_jungle',
    badlands: 'minecraft:badlands',
    eroded_badlands: 'minecraft:eroded_badlands',
    mushroom_fields: 'minecraft:mushroom_fields',
    ocean: 'minecraft:ocean',
    deep_ocean: 'minecraft:deep_ocean',
    warm_ocean: 'minecraft:warm_ocean',
    lukewarm_ocean: 'minecraft:lukewarm_ocean',
    beach: 'minecraft:beach',
    meadow: 'minecraft:meadow',
    grove: 'minecraft:grove',
    snowy_slopes: 'minecraft:snowy_slopes',
    jagged_peaks: 'minecraft:jagged_peaks',
    frozen_peaks: 'minecraft:frozen_peaks',
    stony_peaks: 'minecraft:stony_peaks',
    lush_caves: 'minecraft:lush_caves',
    dripstone_caves: 'minecraft:dripstone_caves',
    cherry_grove: 'minecraft:cherry_grove',
    deep_dark: 'minecraft:deep_dark',
    mangrove_swamp: 'minecraft:mangrove_swamp',
    pale_garden: 'minecraft:pale_garden',
};

function dist(a, b = { x: 0, z: 0 }) {
    if (!a) return Infinity;
    return Math.hypot(Number(a.x) - Number(b.x), Number(a.z) - Number(b.z));
}

export function parseBdsLocateLine(line) {
    const raw = String(line || '');
    if (/could not find/i.test(raw)) return { ok: false, reason: 'not-found' };

    const match = raw.match(/The nearest\s+([\w:]+)\s+is at block\s+(-?\d+),\s+(?:\(y\?\)|(-?\d+)),\s+(-?\d+)\s+\((\d+)\s+blocks away\)/i);
    if (!match) return null;

    return {
        ok: true,
        id: match[1],
        x: Number(match[2]),
        y: match[3] == null ? null : Number(match[3]),
        z: Number(match[4]),
        distance: Number(match[5]),
    };
}

export function getBdsVerifierStatus({ env = process.env, fsImpl = fs } = {}) {
    const root = env.BEDROCK_BDS_ROOT || env.BDS_ROOT || '';
    if (!root) {
        return {
            available: false,
            reason: 'Set BEDROCK_BDS_ROOT or BDS_ROOT to a Bedrock Dedicated Server folder to enable BDS verification.',
        };
    }

    const exeName = process.platform === 'win32' ? 'bedrock_server.exe' : 'bedrock_server';
    const executable = path.join(root, exeName);
    if (!fsImpl.existsSync(executable)) {
        return {
            available: false,
            reason: `Could not find ${exeName} under ${root}.`,
            root,
            executable,
        };
    }

    return { available: true, root, executable };
}

export function evaluateBedrockVerification({ query, locateResults }) {
    const radius = Number(query.radius) || 0;
    const maxStructureDistance = Number(query.maxStructureDistance) || 0;
    const maxBiomeStructureDistance = Number(query.maxBiomeStructureDistance) || 0;
    const requiredStructures = Array.isArray(query.structures) ? query.structures : [];
    const failures = [];
    const structures = [];
    const biomePoint = locateResults.biome?.ok ? locateResults.biome : null;

    if (query.biome && query.biome !== 'any') {
        if (!locateResults.biome?.ok) {
            failures.push({ check: 'biome-found', biome: query.biome });
        } else if (radius > 0 && dist(locateResults.biome) > radius) {
            failures.push({ check: 'biome-radius', biome: query.biome, distance: Math.round(dist(locateResults.biome)), radius });
        }
    }

    for (const key of requiredStructures) {
        const result = locateResults.structures?.[key];
        if (!result?.ok) {
            failures.push({ check: 'structure-found', structure: key });
            continue;
        }

        structures.push({ key, ...result });
        if (radius > 0 && dist(result) > radius) {
            failures.push({ check: 'structure-radius', structure: key, distance: Math.round(dist(result)), radius });
        }
    }

    if (maxStructureDistance > 0) {
        for (let i = 0; i < structures.length; i++) {
            for (let j = i + 1; j < structures.length; j++) {
                const distance = dist(structures[i], structures[j]);
                if (distance > maxStructureDistance) {
                    failures.push({
                        check: 'structure-cluster',
                        from: structures[i].key,
                        to: structures[j].key,
                        distance: Math.round(distance),
                        maxStructureDistance,
                    });
                }
            }
        }
    }

    if (biomePoint && maxBiomeStructureDistance > 0) {
        for (const structure of structures) {
            const distance = dist(structure, biomePoint);
            if (distance > maxBiomeStructureDistance) {
                failures.push({
                    check: 'biome-structure-cluster',
                    structure: structure.key,
                    biome: query.biome,
                    distance: Math.round(distance),
                    maxBiomeStructureDistance,
                });
            }
        }
    }

    return {
        status: failures.length === 0 ? 'confirmed' : 'mismatch',
        verifiedBy: 'bedrock-dedicated-server',
        structures,
        biomePoint,
        failures,
    };
}

function randomPort() {
    return 30000 + Math.floor(Math.random() * 20000);
}

function updateServerProperties(existing, props) {
    const seen = new Set();
    const lines = String(existing || '')
        .split(/\r?\n/)
        .filter(line => line.trim() !== '')
        .map(line => {
            const key = line.split('=')[0];
            if (Object.prototype.hasOwnProperty.call(props, key)) {
                seen.add(key);
                return `${key}=${props[key]}`;
            }
            return line;
        });

    for (const [key, value] of Object.entries(props)) {
        if (!seen.has(key)) lines.push(`${key}=${value}`);
    }

    return `${lines.join(os.EOL)}${os.EOL}`;
}

function extractBdsVersion(lines) {
    const line = lines.find(item => /Version\s+\d+\./i.test(item));
    return line?.match(/Version\s+([\d.]+)/i)?.[1] || null;
}

async function waitForLine(lines, predicate, timeoutMs, label, startIndex = 0) {
    const started = Date.now();
    let cursor = startIndex;
    while (Date.now() - started < timeoutMs) {
        for (; cursor < lines.length; cursor++) {
            const line = lines[cursor];
            const parsed = predicate(line);
            if (parsed) return parsed;
        }
        await new Promise(resolve => setTimeout(resolve, 80));
    }
    throw new Error(`Timed out waiting for ${label}`);
}

export async function verifyBedrockSeedWithBds(query, { timeoutMs = 45000 } = {}) {
    const status = getBdsVerifierStatus();
    if (!status.available) {
        return { status: 'unavailable', reason: status.reason };
    }

    const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'minecraft-seed-finder-bds-'));
    const lines = [];
    let child = null;

    try {
        await fs.promises.cp(status.root, workdir, { recursive: true });
        const propertiesPath = path.join(workdir, 'server.properties');
        const existingProperties = fs.existsSync(propertiesPath)
            ? await fs.promises.readFile(propertiesPath, 'utf8')
            : '';
        await fs.promises.writeFile(propertiesPath, updateServerProperties(existingProperties, {
            'server-port': String(randomPort()),
            'server-portv6': String(randomPort()),
            'level-name': 'SeedFinderOracle',
            'level-seed': String(query.seed),
            'online-mode': 'false',
            'allow-cheats': 'true',
            'content-log-console-output-enabled': 'true',
        }));

        const executable = path.join(workdir, path.basename(status.executable));
        child = spawn(executable, [], { cwd: workdir, stdio: ['pipe', 'pipe', 'pipe'] });
        const collect = chunk => {
            String(chunk).split(/\r?\n/).forEach(line => {
                if (line.trim()) lines.push(line.trim());
            });
        };
        child.stdout.on('data', collect);
        child.stderr.on('data', collect);

        await waitForLine(lines, line => /Server started\./i.test(line), timeoutMs, 'BDS startup');

        const locateResults = { structures: {} };
        const locate = async command => {
            const startIndex = lines.length;
            child.stdin.write(`${command}\n`);
            return waitForLine(lines, line => parseBdsLocateLine(line), timeoutMs, command, startIndex);
        };

        if (query.biome && query.biome !== 'any' && BIOME_LOCATE_IDS[query.biome]) {
            locateResults.biome = await locate(`execute in overworld positioned 0 80 0 run locate biome ${BIOME_LOCATE_IDS[query.biome]}`);
        }

        for (const key of query.structures || []) {
            const id = STRUCTURE_LOCATE_IDS[key];
            if (!id) {
                locateResults.structures[key] = { ok: false, reason: 'unsupported-structure' };
                continue;
            }
            locateResults.structures[key] = await locate(`execute in overworld positioned 0 80 0 run locate structure ${id}`);
        }

        return {
            ...evaluateBedrockVerification({ query, locateResults }),
            bdsVersion: extractBdsVersion(lines),
        };
    } finally {
        if (child && !child.killed) {
            try {
                child.stdin.write('stop\n');
            } catch {
                child.kill();
            }
        }
        await fs.promises.rm(workdir, { recursive: true, force: true });
    }
}
