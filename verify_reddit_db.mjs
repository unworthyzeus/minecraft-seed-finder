
import { LegacyBiomeGenerator } from './lib/cubiomes/layers.js';
import { BiomeID, BiomeNames } from './lib/cubiomes/core.js';
import fs from 'fs';

function getBiomeName(id) {
    return BiomeNames[id] || `Unknown (${id})`;
}

async function verifyRedditSeeds() {
    console.log("Searching for Pre-1.18 seeds in reddit-seeds-versions.json...");

    try {
        const rawData = fs.readFileSync('./data/reddit-seeds-versions.json', 'utf8');
        const seedsData = JSON.parse(rawData);

        // Keywords to map text to biomes
        const biomeKeywords = {
            'mushroom': [BiomeID.mushroom_fields, BiomeID.mushroom_field_shore],
            'jungle': [BiomeID.jungle, BiomeID.jungle_hills, BiomeID.jungle_edge, BiomeID.modified_jungle, BiomeID.modified_jungle_edge, BiomeID.bamboo_jungle, BiomeID.bamboo_jungle_hills],
            'badlands': [BiomeID.badlands, BiomeID.badlands_plateau, BiomeID.wooded_badlands_plateau, BiomeID.eroded_badlands, BiomeID.modified_wooded_badlands_plateau, BiomeID.modified_badlands_plateau],
            'mesa': [BiomeID.badlands, BiomeID.badlands_plateau, BiomeID.wooded_badlands_plateau, BiomeID.eroded_badlands, BiomeID.modified_wooded_badlands_plateau, BiomeID.modified_badlands_plateau],
            'ice': [BiomeID.ice_spikes],
            'flower forest': [BiomeID.flower_forest],
            'swamp': [BiomeID.swamp, BiomeID.swamp_hills],
            'desert': [BiomeID.desert, BiomeID.desert_hills, BiomeID.desert_lakes]
        };

        let checked = 0;
        let passed = 0;

        for (const entry of seedsData) {
            // Check if version is explicitly pre-1.18
            const vJava = entry.version?.java || '';
            const vBedrock = entry.version?.bedrock || '';
            const versionStr = (vJava + ' ' + vBedrock).toLowerCase();

            if (versionStr.includes('1.18') || versionStr.includes('1.19') || versionStr.includes('1.20') || versionStr.includes('1.21')) {
                continue;
            }

            // Look for 1.16, 1.15, ..., 1.12
            // Also ensure it's not empty
            if (!versionStr.match(/1\.(1[0-7]|[0-9])(\.|$)/)) {
                // Skips if no clear old version found
                continue;
            }

            // Extract coordinates from description or assume spawn
            // Regex for coordinates: X ... Z ... or numbers
            let x = 0, z = 0;
            const coordMatch = entry.description.match(/(?:at|coords?|location)[\s:]*([-\d]+)[,\s]+(?:[-\d]+[,\s]+)?([-\d]+)/i);

            if (coordMatch) {
                x = parseInt(coordMatch[1]);
                z = parseInt(coordMatch[2]);
            } else {
                continue; // Skip if no coords
            }

            // Identify expected biome from title/category
            let expectedBiomes = [];
            const text = (entry.title + ' ' + entry.category).toLowerCase();

            for (const [key, biomes] of Object.entries(biomeKeywords)) {
                if (text.includes(key)) {
                    expectedBiomes = biomes;
                    break;
                }
            }

            if (expectedBiomes.length === 0) continue;

            const seed = BigInt(entry.seed);

            // Assume 1.16 logic for 1.7-1.17 usually
            const gen = new LegacyBiomeGenerator(seed, 16);

            // Check area (radius 16) around target
            const area = gen.getArea(x - 32, z - 32, 64, 64, 4);
            const foundBiomes = new Set(area.data);

            // Check intersection
            const hasMatch = expectedBiomes.some(b => foundBiomes.has(b));

            checked++;
            console.log(`\nChecking ${entry.id} (${entry.title.substring(0, 30)}...)`);
            console.log(`Seed: ${seed}, Target: (${x}, ${z}), Version: ${versionStr.trim()}`);
            console.log(`Expected: ${expectedBiomes.map(b => getBiomeName(b)).join('|')}`);
            console.log(`Found: ${Array.from(foundBiomes).slice(0, 5).map(b => getBiomeName(b)).join(', ')}...`);

            if (hasMatch) {
                console.log("PASS");
                passed++;
            } else {
                console.log("FAIL");
            }

            if (checked >= 10) break; // Limit to 10 checks
        }

        console.log(`\nFound ${checked} valid test entries. Passed: ${passed}`);

    } catch (e) {
        console.error(e);
    }
}

verifyRedditSeeds();
